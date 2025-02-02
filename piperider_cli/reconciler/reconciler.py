import json
import os
import uuid
from dataclasses import dataclass

from rich.console import Console, escape
from sqlalchemy.engine import Connection, Engine, create_engine
from sqlalchemy import Table, Column, text
from snowflake.sqlalchemy.custom_types import TIMESTAMP_LTZ, TIMESTAMP_NTZ, TIMESTAMP_TZ

from piperider_cli import datetime_to_str
from piperider_cli.profiler.profiler import *
from piperider_cli.reconciler.reconcile_rule import ColumnReconcileRule, ReconcileSuite, ReconcileProject
from piperider_cli.configuration import Configuration
from piperider_cli import raise_exception_when_directory_not_writable, clone_directory
from piperider_cli.error import PipeRiderCredentialFieldError, UnhandableColumnTypeError
from piperider_cli.runner import (
    RichProfilerEventHandler,
    prepare_default_output_path,
    decorate_with_metadata,
)
from piperider_cli.filesystem import FileSystem


def dtostr(number: Union[int, float, decimal.Decimal]) -> str:
    """
    Format decimal/float to percentage string
    :para number
    """
    return f"{(number):.2%}"


class Reconciler:
    """
    Table level Reconciler
    """

    def __init__(self, engine: Engine = None):
        """
        :param engine: sqlalchemy engine
        """
        self.bengine = engine
        self.tengine = engine

    def reconcile(self, output=None, report_dir=None, project=None) -> dict:
        """
        Reconcile two tables
        """

        console = Console()
        raise_exception_when_directory_not_writable(output)

        run_id = uuid.uuid4().hex
        created_at = datetime.utcnow()

        result = {
            "id": run_id,
            "created_at": datetime_to_str(created_at),
            "project": "",
            "description": "",
            "profiling": {
                "base": {},
                "target": {},
            },
            "reconcile": [],
        }

        # Datasource
        configuration = Configuration.load()
        datasources = {}
        datasource_names = []
        for ds in configuration.dataSources:
            datasource_names.append(ds.name)
            datasources[ds.name] = ds

        if len(datasource_names) == 0:
            console.print("[bold red]Error: no datasource found[/bold red]")
            return 1

        # Validating
        console.rule("Validating")

        if project:
            r_project: ReconcileProject = configuration.get_reconcile_project(project)
        else:
            r_project: ReconcileProject = configuration.reconcileRules[0]

        project_name = r_project.name
        project_description = r_project.description
        suites = r_project.suites

        result["project"] = project_name
        result["description"] = project_description

        base_source = r_project.base_source
        target_source = (
            base_source
            if r_project.base_source == r_project.target_source
            else r_project.target_source
        )
        is_same_source = base_source == target_source
        for src in [base_source, target_source]:
            if src not in datasource_names:
                console.print(
                    f"[bold red]Error: datasource '{src}' doesn't exist[/bold red]"
                )
                console.print(f"Available datasources: {', '.join(datasource_names)}")
                return 1

        for src in [base_source, target_source]:
            ds = datasources[src]
            passed, _ = ds.validate()
            if passed is not True:
                raise PipeRiderCredentialFieldError(ds.name)

            err = ds.verify_connector()
            if err:
                console.print(
                    f"[[bold red]FAILED[/bold red]] Failed to load the '{ds.type_name}' connector. Reason: {err}"
                )
                console.print(f"\n{escape(err.hint)}\n")
                return 1

        stop_reconciler, _reasons = r_project.validate()
        if not stop_reconciler:
            # TODO: provide validating error details
            console.print(
                "\n\n[bold red]ERROR:[/bold red] Stop reconciler, please fix the syntax errors above."
            )
            [console.print(f" - {r}") for r in _reasons]
            return 1

        # Profile
        console.rule("Profiling")
        bds = datasources[base_source]
        tds = datasources[target_source]

        tables_to_profile = {
            "base": [s.base_table for s in suites],
            "target": [s.target_table for s in suites],
        }
        
        tables_dict = {}
        tables_for_profiling = []

        # To enable target and source from different database/schema
        if is_same_source:
            engine = create_engine(bds.to_database_url(), **bds.engine_args())

            self.bengine, self.tengine = engine, engine

            for suite in suites:
                base_table, target_table = self._get_table_list(suite)
                tables_for_profiling.append(base_table)
                tables_for_profiling.append(target_table)

            base_table = tables_to_profile.get("base")
            target_table = tables_to_profile.get("target")
                               
            profiler = Profiler(
                engine, RichProfilerEventHandler(base_table + target_table)
            )
            
            schema = inspect(engine).default_schema_name

            base_tables = [ProfileSubject(t, schema, t) for t in tables_to_profile.get("base")]
            target_tables = [ProfileSubject(t, schema, t) for t in tables_to_profile.get("target")]

            bprofile_result = profiler.profile(base_tables)
            result["profiling"]["base"] = bprofile_result.get("tables")

            tprofile_result = profiler.profile(target_tables)
            result["profiling"]["target"] = tprofile_result.get("tables")

            tables_dict["base"] = [profiler._fetch_table_metadata(ProfileSubject(t, schema, t), reflecting_cache={}) for t in tables_to_profile.get("base")]
            tables_dict["target"] = [profiler._fetch_table_metadata(ProfileSubject(t, schema, t), reflecting_cache={}) for t in tables_to_profile.get("target")]

        else:
            bengine = create_engine(bds.to_database_url(), **bds.engine_args())
            tengine = create_engine(tds.to_database_url(), **tds.engine_args())
            self.bengine = bengine
            self.tengine = tengine
            bschema = inspect(bengine).default_schema_name
            tschema = inspect(tengine).default_schema_name
            base_tables = [ProfileSubject(t, bschema, t) for t in tables_to_profile.get("base")]
            target_tables = [ProfileSubject(t, tschema, t) for t in tables_to_profile.get("target")]
            bprofilers = Profiler(bengine, RichProfilerEventHandler([t.table for t in base_tables]))
            tprofilers = Profiler(tengine, RichProfilerEventHandler([t.table for t in target_tables]))

            b_profiler_result = bprofilers.profile(base_tables)
            t_profiler_result = tprofilers.profile(target_tables)
            result["profiling"]["base"] = b_profiler_result.get("tables")
            result["profiling"]["target"] = t_profiler_result.get("tables")

            # TODO: differentiat table name with schema/database
            tables_dict["base"] = [bprofilers._fetch_table_metadata(t, reflecting_cache={}) for t in base_tables]
            tables_dict["target"] = [tprofilers._fetch_table_metadata(t, reflecting_cache={}) for t in target_tables]

            # tables_dict["target_table"] = tprofilers._fetch_table_metadata(
            #     ProfileSubject(target_table, tschema, target_table), reflecting_cache={}
            # )

        # Reconciling
        console.rule("Reconciling")

        for idx, suite in enumerate(suites, 1):
            base_table: Table = list(filter(lambda x: x.name == suite.base_table, tables_dict.get('base')))[0]
            target_table: Table = list(filter(lambda x: x.name == suite.target_table, tables_dict.get('target')))[0]
            # concatenation if it's a list

            console.print(f'[{idx}/{len(suites)}] suites: {suite.name}')
            
            base_col = suite.base_join_key
            target_col = suite.target_join_key

            suite_result = {
                "name": suite.name,
                "metadata": {
                    "name": suite.name,
                    "description": suite.description,
                    "base_table": base_table.name,
                    "target_table": target_table.name,
                    "base_column": base_col,
                    "target_column:": target_col,
                },
                "tables": {},
                "columns": {},
            }            
                
            trecon = self._reconcile_table(
                base_table,
                target_table,
                base_col,
                target_col,
            )

            suite_result["tables"].update(trecon)

            crecon = self._reconcile_column(
                base_table, 
                target_table, 
                base_col, 
                target_col, 
                suite.column_reconcile_rules
            )

            suite_result["columns"].update(crecon)

            result["reconcile"].append(suite_result)

            console.rule("Summary")
            # TODO: Implement summary presentation funciton

            filesystem = FileSystem(report_dir=report_dir)
            output_path = prepare_default_output_path(
                filesystem, created_at, ds=ds, task="reconcile"
            )
            output_file = os.path.join(output_path, "reconcile.json")

        if output:
            clone_directory(output_path, output)
        console.print(f"Reconcile report: {output_file}")

        with open(output_file, "w") as f:
            f.write(json.dumps(result, indent=2))

        return 0 

    def _reconcile_table(
        self,
        base_table: Table,
        target_table: Table,
        base_col: str,
        target_col: str,
        base_database: str = None,
        target_database: str = None,
    ):
        if self.bengine.url.database:
            base_db = self.bengine.url.database.split("/")[0]
        else:
            base_db = ''

        if self.tengine.url.database:
            target_db = self.tengine.url.database.split("/")[0]
        else:
            target_db = ''

        result = reconcile_table_counts(
            self.bengine,
            base_table,
            target_table,
            base_col=base_col,
            target_col=target_col,
            base_database=base_db,
            target_database=target_db,
        )

        return result

    def _reconcile_column(
        self,
        base_table: Table,
        target_table: Table,
        base_column: str,
        target_column: str,
        rules: List[ColumnReconcileRule],
    ):
        result = {}

        console = Console()

        base_db = self.bengine.url.database.split("/")[0]
        target_db = self.tengine.url.database.split("/")[0]

        index = 0
        for rule in rules:
            # TODO: implement progress bar
            console.print(f"    [{index+1}/{len(rules)}] {rule.name}")

            # Loop through base and target column data type to dispath to specific column reconciler

            base_compare_key: Column = base_table.columns[rule.base_compare_column]
            target_compare_key: Column = target_table.columns[rule.target_compare_column]
            rule_name = rule.name

            if isinstance(base_compare_key.type, String) and isinstance(
                target_compare_key.type, String
            ):
                # VARCHAR
                # CHAR
                # TEXT
                # CLOB
                generic_type = "string"
                reconciler = StringColumnReconciler(
                    self.bengine,
                    base_table,
                    target_table,
                    base_column,
                    target_column,
                    base_compare_key,
                    target_compare_key,
                    rule_name,
                    base_database=base_db,
                    target_database=target_db,
                )
            elif isinstance(base_compare_key.type, Integer) and isinstance(
                target_compare_key.type, Integer
            ):
                # INTEGER
                # BIGINT
                # SMALLINT
                generic_type = "integer"
                reconciler = NumericColumnReconciler(
                    self.bengine,
                    base_table,
                    target_table,
                    base_column,
                    target_column,
                    base_compare_key,
                    target_compare_key,
                    rule_name,
                    base_db,
                    target_db,
                )
            elif isinstance(base_compare_key.type, Numeric) and isinstance(
                target_compare_key.type, Numeric
            ):
                # NUMERIC
                # DECIMAL
                # FLOAT
                generic_type = "numeric"
                reconciler = NumericColumnReconciler(
                    self.bengine,
                    base_table,
                    target_table,
                    base_column,
                    target_column,
                    base_compare_key,
                    target_compare_key,
                    rule_name,
                    base_db,
                    target_db,
                )
            elif isinstance(base_compare_key.type, (Date, DateTime, TIMESTAMP_TZ, TIMESTAMP_LTZ, TIMESTAMP_NTZ)) and isinstance(
                target_compare_key.type, (Date, DateTime, TIMESTAMP_TZ, TIMESTAMP_LTZ, TIMESTAMP_NTZ)):
                # DATE
                # DATETIME
                generic_type = "datetime"
                reconciler = DatetimeColumnReconciler(
                    self.bengine,
                    base_table,
                    target_table,
                    base_column,
                    target_column,
                    base_compare_key,
                    target_compare_key,
                    rule_name,
                    base_db,
                    target_db,
                )
            elif isinstance(base_compare_key.type, Boolean) and isinstance(
                target_compare_key.type, Boolean
            ):
                # BOOLEAN
                generic_type = "boolean"
                reconciler = BooleanColumnReconciler(
                    self.bengine,
                    base_table,
                    target_table,
                    base_column,
                    target_column,
                    base_compare_key,
                    target_compare_key,
                    rule_name,
                    base_db,
                    target_db,
                )
            elif base_compare_key.type != target_compare_key.type:
                generic_type = f"mismatch: {base_compare_key.type} vs {target_compare_key.type}"
                reconciler = MismatchDataTypeColumnReconciler(
                    self.bengine,
                    base_table,
                    target_table,
                    base_column,
                    target_column,
                    base_compare_key,
                    target_compare_key,
                    rule_name,
                    base_db,
                    target_db,
                )
            else:                
                raise UnhandableColumnTypeError

            _result = reconciler.reconcile()
            _result["generic_type"] = generic_type
            result[rule.name] = _result
            index += 1
        return result

    def _get_table_list(self, rule: ReconcileSuite):
        base_table = rule.base_table
        target_table = rule.target_table
        return base_table, target_table


class ColumnReconciler(object):
    """
    Column level reconciler
    """

    def __init__(
        self,
        bengine: Engine,
        base_table: Table,
        target_table: Table,
        base_col: str, 
        target_col: str,
        base_compare_col: Column,
        target_compare_col: Column,
        name: str,
        metadata: str = None,
        base_database: str = None,
        target_database: str = None,
    ):
        self.bengine = bengine
        self.base_table = base_table
        self.target_table = target_table
        self.base_col = base_col
        self.target_col = target_col
        self.base_compare_col = base_compare_col
        self.target_compare_col = target_compare_col
        self.metadata = metadata
        self.name = name
        self.base_database = base_database
        self.target_database = target_database

    def _get_database_backend(self) -> str:
        """
        Helper function to return the sqlalchemy engine backend
        :return:
        """
        return self.bengine.url.get_backend_name()

    def _base_cte(self, bkey, bcompkey, tkey, tcompkey) -> str:
        if self._get_database_backend() == "sqlite":
            cte = f"""
                with b as (
                    select
                        {bkey} as bid,
                        {bcompkey} as bcid
                    from {self.base_database + '.' if self.base_database else ''}{self.base_table.schema + '.' if self.base_table.schema else ''}{self.base_table.name}
                ),
                t as (
                    select
                        {tkey} as tid,
                        {tcompkey} as tcid
                    from {self.target_database+'.' if self.target_database else ''}{self.target_table.schema+'.' if self.target_table.schema else ''}{self.target_table.name}
                ),
                fjoin as (
                    select
                       bid, tid, bcid, tcid
                    from b
                    left join t
                    on bid = tid

                    union

                    select
                      bid, tid, bcid, tcid
                    from t
                    left join b
                    on tid = bid
                ),
            """
        else:
            cte = f"""
                with b as (
                    select
                        {bkey} as bid,
                        {bcompkey} as bcid
                    from {self.base_database+'.' if self.base_database else ''}{self.base_table.schema+'.' if self.base_table.schema else ''}{self.base_table.name}
                ),
                t as (
                    select
                        {tkey} as tid,
                        {tcompkey} as tcid
                    from {self.target_database+'.' if self.target_database else ''}{self.target_table.schema+'.' if self.target_table.schema else ''}{self.target_table.name}
                ),
                fjoin as (
                    select bid, bcid, tid, tcid
                    from b
                    full outer join t
                    on b.bid = t.tid
                ),
            """
        return cte

    def reconcile(self) -> dict:
        """
        Reconcile base column with target column
        """
        pass


class StringColumnReconciler(ColumnReconciler):
    def __init__(
        self,
        engine: Engine,
        base_table: Table,
        target_table: Table,
        base_col: str,
        target_col: str,
        base_compare_col: Column,
        target_compare_col: Column,
        name: str,
        base_database: str = None,
        target_database: str = None,
    ):
        super().__init__(
            engine,
            base_table,
            target_table,
            base_col,
            target_col,
            base_compare_col,
            target_compare_col,
            name=name,
            base_database=base_database,
            target_database=target_database,
        )

    def reconcile(self) -> dict:
        # string type data comparison should consists of
        # raw string: bc = tc
        # case insenstive: lower(bc) = lower(tc)
        # trim space: trim(lower(bc)) = trim(lower(bc))

        bkey = self.base_col
        tkey = self.target_col
        bcompkey = self.base_compare_col.name
        tcompkey = self.target_compare_col.name

        with self.bengine.connect() as conn:
            cte = super()._base_cte(bkey, bcompkey, tkey, tcompkey)
            query = f"""
                {cte}
                stats as (
                    select
                        count(*) as total,
                        sum(case when bcid is not null and tcid is not null then 1 else 0 end) as common,
                        sum(case when bcid = tcid then 1 else 0 end) as equal,
                        sum(case when lower(bcid) = lower(tcid) then 1 else 0 end) as equal_case_insensitive,
                        sum(case when trim(lower(bcid)) = trim(lower(tcid)) then 1 else 0 end) as equal_trim_whitespace,
                        sum(case when bcid != tcid then 1 else 0 end) as not_equal,
                        sum(case when bcid is null or tcid is null then 1 else 0 end) as not_comparable
                    from fjoin
                )
                select * from stats
            """

            result = conn.execute(text(query)).fetchone()
            (
                _total,
                _common,
                _equal,
                _equal_case_insensitive,
                _equal_trim_whitespace,
                _not_equal,
                _not_comparable,
            ) = result

            result = {
                "name": self.name,
                "base_table": self.base_table.name,
                "base_column": self.base_col,
                "target_table": self.target_table.name,
                "target_column": self.target_col,
                "base_compare_key": self.base_compare_col.name,
                "target_compare_key": self.target_compare_col.name,
                "total": _total,
                "common": _common,
                "equal": _equal,
                "not_equal": _not_equal,
                "not_comparable": _not_comparable,
                "equal_case_insensitive": _equal_case_insensitive,
                "equal_trim_whitespace": _equal_trim_whitespace,
                "equal_percentage": dtostr(round(_equal / _common, 4)) if _common != 0 else 0,
                "not_equal_percentage": dtostr(round(_not_equal / _common, 4)) if _common != 0 else 0,
                "equal_case_insensitive_percentage": dtostr(round(_equal_case_insensitive / _common, 4)) if _common != 0 else 0,
                "equal_trim_whitespace_percentage": dtostr(round(_equal_trim_whitespace / _common, 4)) if _common != 0 else 0
            }

            return result


class NumericColumnReconciler(ColumnReconciler):
    def __init__(
        self,
        engine: Engine,
        base_table: Table,
        target_table: Table,
        base_col: str,
        target_col: str,
        base_compare_col: Column,
        target_compare_col: Column,
        name: str,
        base_database: str = None,
        target_database: str = None,
    ):
        super().__init__(
            engine,
            base_table,
            target_table,
            base_col,
            target_col,
            base_compare_col,
            target_compare_col,
            name=name,
            base_database=base_database,
            target_database=target_database,
        )

    def reconcile(self) -> dict:
        bkey = self.base_col
        tkey = self.target_col
        bcompkey = self.base_compare_col.name
        tcompkey = self.target_compare_col.name
        cte = super()._base_cte(bkey, bcompkey, tkey, tcompkey)

        with self.bengine.connect() as conn:
            query = f"""
                {cte}
                stats as (
                    select
                        count(*) as total,
                        sum(case when bcid is not null and tcid is not null then 1 else 0 end) as common,
                        sum(case when bcid - tcid = 0 then 1 else 0 end) as equal,
                        sum(case
                                when bcid = tcid then 1
                                when tcid = 0 and abs(bcid) <= 0.05 then 1
                                when abs((bcid - tcid) * 1.0 / ((bcid + tcid) / 2) ) <= 0.05 then 1
                            else 0
                            end) as equal_within_5_difference,
                        sum(case
                                when bcid = tcid then 1
                                when tcid = 0 and abs(bcid) <= 0.1 then 1
                                when abs((bcid - tcid) * 1.0 / ((bcid + tcid) / 2) ) <= 0.1 then 1
                            else 0
                            end) as equal_within_10_difference,
                        sum(case when bcid - tcid != 0 then 1 else 0 end) as not_equal,
                        sum(case when bcid is null or tcid is null then 1 else 0 end) as not_comparable
                    from fjoin
                )
                select * from stats
            """

            result = conn.execute(text(query)).fetchone()
            (
                _total,
                _common,
                _equal,
                _equal_within_5_difference,
                _equal_within_10_difference,
                _not_equal,
                _not_comparable,
            ) = result

            result = {
                "name": self.name,
                "base_table": self.base_table.name,
                "base_column": self.base_col,
                "target_table": self.target_table.name,
                "target_column": self.target_col,
                "base_compare_key": self.base_compare_col.name,
                "target_compare_key": self.target_compare_col.name,
                "total": _total,
                "equal": _equal,
                "common": _common,
                "not_equal": _not_equal,
                "not_comparable": _not_comparable,
                "equal_within_5_difference": _equal_within_5_difference,
                "equal_within_10_difference": _equal_within_10_difference,
                "equal_percentage": dtostr(round(_equal / _common, 4)) if _common != 0 else 0,
                "not_equal_percentage": dtostr(round(_not_equal / _common, 4)) if _common != 0 else 0,
                "equal_within_5_difference_percentage": dtostr(round(_equal_within_5_difference / _common, 4)) if _common != 0 else 0,
                "equal_within_10_difference_percentage": dtostr(round(_equal_within_10_difference / _common, 4)) if _common != 0 else 0,
            }

            return result


class DatetimeColumnReconciler(ColumnReconciler):
    def __init__(
        self,
        engine: Engine,
        base_table: Table,
        target_table: Table,
        base_col: str,
        target_col: str,
        base_compare_col: Column,
        target_compare_col: Column,
        name: str,
        base_database: str = None,
        target_database: str = None,
    ):
        super().__init__(
            engine,
            base_table,
            target_table,
            base_col,
            target_col,
            base_compare_col,
            target_compare_col,
            name=name,
            base_database=base_database,
            target_database=target_database,
        )

    def reconcile(self) -> dict:
        bkey = self.base_col
        tkey = self.target_col
        bcompkey = self.base_compare_col.name
        tcompkey = self.target_compare_col.name
        cte = super()._base_cte(bkey, bcompkey, tkey, tcompkey)

        with self.bengine.connect() as conn:
            # https://www.sqlite.org/lang_datefunc.html
            if super()._get_database_backend() == "sqlite":
                query = f"""
                {cte}
                stats as (
                    select
                        count(*) as total,
                        sum(case when bcid is not null and tcid is not null then 1 else 0 end) as common,
                        sum(case when julianday(bcid) - julianday(tcid) = 0 then 1 else 0 end) as equal,
                        sum(case when julianday(bcid) - julianday(tcid) != 0 then 1 else 0 end) as not_equal,
                        sum(case when abs(julianday(bcid) - julianday(tcid)) < 1 then 1 else 0 end) as equal_within_1_day_difference,
                        sum(case when abs(julianday(bcid) - julianday(tcid)) < 7 then 1 else 0 end) as equal_within_1_week_difference,
                        sum(case when abs(julianday(bcid) - julianday(tcid)) < 30 then 1 else 0 end) as equal_within_1_month_difference,
                        sum(case when bcid is null or tcid is null then 1 else 0 end) as not_comparable
                    from fjoin
                )
                select * from stats
                """
            else:
                query = f"""
                {cte}
                stats as (
                    select
                        count(*) as total,
                        sum(case when bcid is not null and tcid is not null then 1 else 0 end) as common,
                        sum(case when abs(bcid::date - tcid::date) = 0 then 1 else 0 end) as equal,
                        sum(case when abs(bcid::date - tcid::date) != 0 then 1 else 0 end) as not_equal,
                        sum(case when abs(bcid::date - tcid::date) < 1 then 1 else 0 end) as equal_within_1_day_difference,
                        sum(case when abs(bcid::date - tcid::date) < 7 then 1 else 0 end) as equal_within_1_week_difference,
                        sum(case when abs(bcid::date - tcid::date) < 30 then 1 else 0 end) as equal_within_1_month_difference,
                        sum(case when bcid is null or tcid is null then 1 else 0 end) as not_comparable
                    from fjoin
                )
                select * from stats
                """
            result = conn.execute(text(query)).fetchone()
            _total, _common, _equal, _not_equal, equal_within_1_day_difference, equal_within_1_week_difference, equal_within_1_month_difference, _not_comparable = result

            result = {
                "name": self.name,
                "base_table": self.base_table.name,
                "base_column": self.base_col,
                "target_table": self.target_table.name,
                "target_column": self.target_col,
                "base_compare_key": self.base_compare_col.name,
                "target_compare_key": self.target_compare_col.name,
                "total": _total,
                "common": _common,
                "equal": _equal,
                "not_equal": _not_equal,
                "not_comparable": _not_comparable,
                "equal_percentage": dtostr(round(_equal / _common, 4)) if _common != 0 else 0,
                "not_equal_percentage": dtostr(round(1 - _equal / _common, 4)) if _common != 0 else 0,
                "equal_within_1_day_difference": equal_within_1_day_difference,
                "equal_within_1_week_difference": equal_within_1_week_difference,
                "equal_within_1_month_difference": equal_within_1_month_difference,
                "equal_within_1_day_difference_percentage": dtostr(round(equal_within_1_day_difference / _common, 4)) if _common != 0 else 0,
                "equal_within_1_week_difference_percentage": dtostr(round(equal_within_1_week_difference / _common, 4)) if _common != 0 else 0,
                "equal_within_1_month_difference_percentage": dtostr(round(equal_within_1_month_difference / _common, 4)) if _common != 0 else 0,
            }
            return result


class BooleanColumnReconciler(ColumnReconciler):
    def __init__(
        self,
        engine: Engine,
        base_table: Table,
        target_table: Table,
        base_col: str,
        target_col: str,
        base_compare_col: Column,
        target_compare_col: Column,
        name: str,
        base_database: str = None,
        target_database: str = None,
    ):
        super().__init__(
            engine,
            base_table,
            target_table,
            base_col,
            target_col,
            base_compare_col,
            target_compare_col,
            name=name,
            base_database=base_database,
            target_database=target_database,
        )

    def reconcile(self) -> dict:
        bkey = self.base_col
        tkey = self.target_col
        bcompkey = self.base_compare_col.name
        tcompkey = self.target_compare_col.name
        cte = super()._base_cte(bkey, bcompkey, tkey, tcompkey)

        with self.bengine.connect() as conn:
            query = f"""
            {cte}
            stats as (
                select
                    count(*) as total,
                    sum(case when bcid is not null and tcid is not null then 1 else 0 end) as common,
                    sum(case when bcid = tcid then 1 else 0 end) as equal,
                    sum(case when bcid != tcid then 1 else 0 end) as not_equal,
                    sum(case when bcid is null or tcid is null then 1 else 0 end) as not_comparable
                from fjoin
            )
            select * from stats
            """
            result = conn.execute(text(query)).fetchone()
            _total, _common, _equal, _not_equal, _not_comparable = result

            result = {
                "name": self.name,
                "base_table": self.base_table.name,
                "base_column": self.base_col,
                "target_table": self.target_table.name,
                "target_column": self.target_col,
                "base_compare_key": self.base_compare_col.name,
                "target_compare_key": self.target_compare_col.name,
                "total": _total,
                "equal": _equal,
                "not_equal": _not_equal,
                "not_comparable": _not_comparable,
                "equal_percentage": dtostr(round(_equal / _common, 4)) if _common != 0 else 0,
                "not_equal_percentage": dtostr(round(1 - _equal / _common, 4)) if _common != 0 else 0,
            }
            return result


class MismatchDataTypeColumnReconciler(ColumnReconciler):
    """
    This class is used to reconcile columns with mismatched data types (e.g. int vs. string)
    It may invlove some type conversion before comparison
    """

    def __init__(
        self,
        engine: Engine,
        base_table: Table,
        target_table: Table,
        base_col: str,
        target_col: str,
        base_compare_col: Column,
        target_compare_col: Column,
        name: str,
        base_database: str = None,
        target_database: str = None,
    ):
        super().__init__(
            engine,
            base_table,
            target_table,
            base_col,
            target_col,
            base_compare_col,
            target_compare_col,
            name=name,
            base_database=base_database,
            target_database=target_database,
        )

    def _base_cte(self, bkey, bcompkey, tkey, tcompkey) -> str:
        if self._get_database_backend() == "sqlite":
            cte = f"""
                with b as (
                    select
                        {bkey} as bid,
                        {bcompkey}
                    from {self.base_database + '.' if self.base_database else ''}{self.base_table.schema + '.' if self.base_table.schema else ''}{self.base_table.name}
                ),
                t as (
                    select
                        {tkey} as tid,
                        {tcompkey}
                    from {self.target_database+'.' if self.target_database else ''}{self.target_table.schema+'.' if self.target_table.schema else ''}{self.target_table.name}
                ),
                fjoin as (
                    select
                       bid, tid, {bcompkey}, {tcompkey}
                    from b
                    left join t
                    on bid = tid

                    union

                    select
                      bid, tid, {bcompkey}, {tcompkey}
                    from t
                    left join b
                    on tid = bid
                ),
            """
        else:        
            cte = f"""
                with b as (
                    select
                        {bkey} as bid,
                        {bcompkey}
                    from {self.base_database+'.' if self.base_database else ''}{self.base_table.schema+'.' if self.base_table.schema else ''}{self.base_table.name}
                ),
                t as (
                    select
                        {tkey} as tid,
                        {tcompkey}
                    from {self.target_database+'.' if self.target_database else ''}{self.target_table.schema+'.' if self.target_table.schema else ''}{self.target_table.name}
                ),
                fjoin as (
                    select bid, bcid, b.{bcompkey}, t.{tcompkey}
                    from b
                    full outer join t
                    on b.bid = t.tid
                ),
            """
        return cte

    def reconcile(self) -> dict:        
        # Warning("Different type comparison not implemented yet")
        bkey = self.base_col
        tkey = self.target_col
        bcompkey = self.base_compare_col.name
        tcompkey = self.target_compare_col.name
        cte = super()._base_cte(bkey, bcompkey, tkey, tcompkey)

        bcid = "cast(bcid as varchar)"
        tcid = "cast(tcid as varchar)"
        # Reference: https://docs.snowflake.com/en/sql-reference/data-type-conversion#data-types-that-can-be-cast
        # if (bcompkey_type == 'string' and tcompkey_type == 'integer') or bcompkey_type == 'integer' and tcompkey_type == 'string':
        #     bcid = f"cast({bcid} as text)"
        #     tcid = f"cast({tcid} as text)"
        # if (bcompkey_type == 'string' and tcompkey_type == 'datetime') or bcompkey_type == 'datetime' and tcompkey_type == 'string':
        #     bcid = f"cast({bcid} as text)"
        #     tcid = f"cast({tcid} as text)"

        with self.bengine.connect() as conn:

            query = f"""
            {cte}
            stats as (
                select
                    count(*) as total,
                    sum(case when {bcid} is not null and {tcid} is not null then 1 else 0 end) as common,
                    sum(case when {bcid} = {tcid} then 1 else 0 end) as equal,
                    sum(case when {bcid} != {tcid} then 1 else 0 end) as not_equal,
                    sum(case when {bcid} is null or {tcid} is null then 1 else 0 end) as not_comparable
                from fjoin
            )
            select * from stats
            """

            result = conn.execute(text(query)).fetchone()
            _total, _common, _equal, _not_equal, _not_comparable = result

            result = {
                "name": self.name,
                "base_table": self.base_table.name,
                "base_column": self.base_col,
                "target_table": self.target_table.name,
                "target_column": self.target_col,
                "base_compare_key": self.base_compare_col.name,
                "target_compare_key": self.target_compare_col.name,
                "total": _total,
                "equal": _equal,
                "not_equal": _not_equal,
                "not_comparable": _not_comparable,
                "equal_percentage": dtostr(round(_equal / _common, 4)) if _common != 0 else 0,
                "not_equal_percentage": dtostr(round(1 - _equal / _common, 4)) if _common != 0 else 0,
            }
            return result


def reconcile_table_counts(
    engine: Engine,
    base_table: Table,
    target_table: Table,
    base_col: str,
    target_col: str,
    base_database: str = None,
    target_database: str = None,
) -> dict:
    with engine.connect() as conn:
        if base_table.schema:
            _base_table = f"{base_database}.{base_table.schema}.{base_table.name}"
        else:
            _base_table = base_table.name

        if target_table.schema:
            _target_table = (
                f"{target_database}.{target_table.schema}.{target_table.name}"
            )
        else:
            _target_table = target_table.name

        query = f"""
        with b as (
            select {base_col} as bid
            from {_base_table}
        ),
        t as (
            select {target_col} as tid
            from {_target_table}
        ),
        fjoin as (
            select
               bid, tid
            from b
            left join t
            on bid = tid

            union

            select
              bid, tid
            from t
            left join b
            on tid = bid
        ),
        stats as (
            select
                sum(case when bid is not null and tid is not null then 1 else 0 end) as common,
                sum(case when bid is not null and tid is null then 1 else 0 end) as bonly,
                sum(case when bid is null and tid is not null then 1 else 0 end) as tonly
            from fjoin
        )

        select * from stats
        """

        result = conn.execute(text(query)).fetchone()
        _common, _bonly, _tonly = result
        _equal = _common == _bonly

        result = {
            "base_only": _bonly,
            "target_only": _tonly,
            "common": _common,
            "status": _equal,
        }

        return result
