import json
import os
import uuid
from dataclasses import dataclass

from rich.console import Console, escape
from sqlalchemy.engine import Connection, Engine, create_engine
from sqlalchemy import Table, Column, text

from piperider_cli.profiler.profiler import *
from piperider_cli.reconciler.reconcile_rule import ColumnReconcileRule, ReconcileRule
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

        result = {
            "id": "",
            "profiling": {},
            "reconcile": {},
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

        # TODO: starts with single reconciliation if there are multiple rules

        if project:
            rule = configuration.get_reconcile_rule_by_name(project)
        else:
            rule = configuration.reconcileRules[0]

        rule_name = rule.name
        rule_metadata = rule.name
        rule_description = rule.description
        rule_base_table = rule.base_table
        rule_base_column = rule.base_join_key
        rule_target_table = rule.target_table
        rule_target_column = rule.target_join_key

        # datasource = rule.source
        base_source = rule.base_source
        target_source = (
            base_source
            if rule.base_source == rule.target_source
            else rule.target_source
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

        stop_reconciler = rule.validate()
        if not stop_reconciler:
            # TODO: provide validating error details
            console.print(
                "\n\n[bold red]ERROR:[/bold red] Stop reconciler, please fix the syntax errors above."
            )
            return 1

        # Profile
        console.rule("Profiling")
        run_id = uuid.uuid4().hex
        created_at = datetime.utcnow()

        bds = datasources[base_source]
        tds = datasources[target_source]

        tables_dict = {}
        # To enable target and source from different database/schema
        if is_same_source:
            engine = create_engine(bds.to_database_url(), **bds.engine_args())

            # TODO: change this line
            self.bengine = engine
            self.tengine = engine

            base_table, target_table = self._get_table_list(rule)

            profiler = Profiler(
                engine, RichProfilerEventHandler([base_table, target_table])
            )
            # try:
            schema = inspect(engine).default_schema_name

            bprofile_result = profiler.profile(
                [ProfileSubject(base_table, schema, base_table)]
            )
            result["profiling"]["base"] = bprofile_result.get("tables")

            tprofile_result = profiler.profile(
                [ProfileSubject(target_table, schema, target_table)]
            )
            result["profiling"]["target"] = tprofile_result.get("tables")

            tables_dict["base_table"] = profiler._fetch_table_metadata(
                ProfileSubject(base_table, schema, target_table), reflecting_cache={}
            )
            tables_dict["target_table"] = profiler._fetch_table_metadata(
                ProfileSubject(target_table, schema, target_table), reflecting_cache={}
            )

        else:
            bengine = create_engine(bds.to_database_url(), **bds.engine_args())
            tengine = create_engine(tds.to_database_url(), **tds.engine_args())
            self.bengine = bengine
            self.tengine = tengine

            bprofilers = Profiler(bengine, RichProfilerEventHandler([rule.base_table]))
            tprofilers = Profiler(
                tengine, RichProfilerEventHandler([rule.target_table])
            )
            bschema = inspect(bengine).default_schema_name
            tschema = inspect(tengine).default_schema_name
            b_profiler_result = bprofilers.profile(
                [ProfileSubject(rule.base_table, bschema, rule.base_table)]
            )
            t_profiler_result = tprofilers.profile(
                [ProfileSubject(rule.target_table, tschema, rule.target_table)]
            )
            result["profiling"]["base"] = b_profiler_result.get("tables")
            result["profiling"]["target"] = t_profiler_result.get("tables")
            base_table, target_table = self._get_table_list(rule)

            # TODO: differentiat table name with schema/database
            tables_dict["base_table"] = bprofilers._fetch_table_metadata(
                ProfileSubject(base_table, bschema, base_table), reflecting_cache={}
            )
            tables_dict["target_table"] = tprofilers._fetch_table_metadata(
                ProfileSubject(target_table, tschema, target_table), reflecting_cache={}
            )

        # Reconciling
        console.rule("Reconciling")

        # tables_dict = {}
        # for table in tables:
        #     tables_dict[table] = profiler._fetch_table_metadata(ProfileSubject(table, schema, table), reflecting_cache={})

        # Use sqlalchmey Table type generated by Profiles
        base_table: Table = tables_dict["base_table"]
        target_table: Table = tables_dict["target_table"]
        base_col = base_table.columns[rule.base_join_key]
        target_col = target_table.columns[rule.target_join_key]
        rules = rule.column_reconcile_rules

        console.rule("Reconciling Tables Stats")
        trecon = self._reconcile_table(
            base_table,
            target_table,
            base_col,
            target_col,
        )

        result["reconcile"]["tables"] = trecon

        console.rule("Reconciling Columns Stats")
        crecon = self._reconcile_column(
            base_table, target_table, base_col, target_col, rules
        )

        result["reconcile"]["columns"] = crecon
        result["reconcile"]["metadata"] = {
            "name": rule_name,
            "description": rule_description,
            "base_table": rule_base_table,
            "base_column": rule_base_column,
            "target_table": rule_target_table,
            "target_column": rule_target_column,
        }
        result["reconcile"]["name"] = rule_name
        result["created_at"] = created_at.isoformat()
        result["id"] = run_id
        decorate_with_metadata(result["profiling"])

        console.rule("Summary")
        # TODO: Implement summary presentation funciton

        filesystem = FileSystem(report_dir=report_dir)
        output_path = prepare_default_output_path(
            filesystem, created_at, ds=ds, task="reconcile"
        )
        output_file = os.path.join(output_path, "reconcile.json")

        if output:
            clone_directory(output_path, output)
        console.print_json()
        console.print(f"Reconcile report: {output_file}")

        with open(output_file, "w") as f:
            f.write(json.dumps(result, indent=2))

        return result

    def _reconcile_table(
        self,
        base_table: Table,
        target_table: Table,
        base_col: Column,
        target_col: Column,
        base_database: str = None,
        target_database: str = None,
    ):
        base_db = self.bengine.url.database.split("/")[0]
        target_db = self.tengine.url.database.split("/")[0]

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
        base_column: Column,
        target_column: Column,
        rules: List[ColumnReconcileRule],
    ):
        result = {}

        base_db = self.bengine.url.database.split("/")[0]
        target_db = self.tengine.url.database.split("/")[0]

        index = 0
        for rule in rules:
            # TODO: implement progress bar
            print(f"[{index+1}/{len(rules)}] {rule.name}")

            # Loop through base and target column data type to dispath to specific column reconciler

            base_compare_key: Column = base_table.columns[rule.base_compare_key]
            target_compare_key: Column = target_table.columns[rule.target_compare_key]
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
            elif isinstance(base_compare_key.type, (Date, DateTime)) and isinstance(
                target_compare_key.type, (Date, DateTime)
            ):
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
                reconciler = MismatchDataTypeColumnReconciler()
            else:
                raise UnhandableColumnTypeError

            _result = reconciler.reconcile()
            _result["generic_type"] = generic_type
            result[rule.name] = _result
            index += 1
        return result

    def _get_table_list(self, rule: ReconcileRule):
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
        base_col: Column,
        target_col: Column,
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
                    from {self.base_database}.{self.base_table.schema}.{self.base_table.name}
                ),
                t as (
                    select
                        {tkey} as tid,
                        {tcompkey} as tcid
                    from {self.target_database}.{self.target_table.schema}.{self.target_table.name}
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
                    from {self.base_database}.{self.base_table.schema}.{self.base_table.name}
                ),
                t as (
                    select
                        {tkey} as tid,
                        {tcompkey} as tcid
                    from {self.target_database}.{self.target_table.schema}.{self.target_table.name}
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
        base_col: Column,
        target_col: Column,
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

        bkey = self.base_col.name
        tkey = self.target_col.name
        bcompkey = self.base_compare_col.name
        tcompkey = self.target_compare_col.name

        with self.bengine.connect() as conn:
            cte = super()._base_cte(bkey, bcompkey, tkey, tcompkey)
            query = f"""
                {cte}
                stats as (
                    select
                        count(*) as total,
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
                _equal,
                _equal_case_insensitive,
                _equal_trim_whitespace,
                _not_equal,
                _not_comparable,
            ) = result

            result = {
                "name": self.name,
                "base_table": self.base_table.name,
                "base_column": self.base_col.name,
                "target_table": self.target_table.name,
                "target_column": self.target_col.name,
                "base_compare_key": self.base_compare_col.name,
                "target_compare_key": self.target_compare_col.name,
                "total": _total,
                "equal": _equal,
                "not_equal": _not_equal,
                "not_comparable": _not_comparable,
                "equal_case_insensitive": _equal_case_insensitive,
                "equal_trim_whitespace": _equal_trim_whitespace,
                "equal_percentage": dtostr(round(_equal / _total, 4)),
                "not_equal_percentage": dtostr(round(_not_equal / _total, 4)),
                "equal_case_insensitive_percentage": dtostr(round(_equal_case_insensitive / _total, 4)),
                "equal_trim_whitespace_percentage": dtostr(round(_equal_trim_whitespace / _total, 4))
            }

            return result


class NumericColumnReconciler(ColumnReconciler):
    def __init__(
        self,
        engine: Engine,
        base_table: Table,
        target_table: Table,
        base_col: Column,
        target_col: Column,
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
        bkey = self.base_col.name
        tkey = self.target_col.name
        bcompkey = self.base_compare_col.name
        tcompkey = self.target_compare_col.name
        cte = super()._base_cte(bkey, bcompkey, tkey, tcompkey)

        with self.bengine.connect() as conn:
            query = f"""
                {cte}
                stats as (
                    select
                        count(*) as total,
                        sum(case when bcid - tcid = 0 then 1 else 0 end) as equal,
                        sum(case when (abs(bcid - tcid)+0.1 * 1.0 / (bcid + 0.1)) <= 0.05 then 1 else 0 end) as equal_within_5_difference,
                        sum(case when (abs(bcid - tcid)+0.1 * 1.0 / (bcid + 0.1)) <= 0.1 then 1 else 0 end) as equal_within_10_difference,
                        sum(case when bcid - tcid != 0 then 1 else 0 end) as not_equal,
                        sum(case when bcid is null or tcid is null then 1 else 0 end) as not_comparable,
                        round(sum(case when bcid - tcid = 0 then 1 else 0 end) * 1.0 / count(*), 4) as equal_perc,
                        round(sum(case when bcid != tcid then 1 else 0 end) * 1.0 / count(*), 4) as not_equal_perc
                    from fjoin
                )
                select * from stats
            """

            result = conn.execute(text(query)).fetchone()
            (
                _total,
                _equal,
                _equal_within_5_difference,
                _equal_within_10_difference,
                _not_equal,
                _not_comparable,
                _equal_perc,
                _not_equal_perc,
            ) = result

            _equal_perc = dtof(_equal_perc)
            _not_equal_perc = dtof(_not_equal_perc)

            result = {
                "name": self.name,
                "base_table": self.base_table.name,
                "base_column": self.base_col.name,
                "target_table": self.target_table.name,
                "target_column": self.target_col.name,
                "base_compare_key": self.base_compare_col.name,
                "target_compare_key": self.target_compare_col.name,
                "total": _total,
                "equal": _equal,
                "not_equal": _not_equal,
                "not_comparable": _not_comparable,
                "equal_within_5_difference": _equal_within_5_difference,
                "equal_within_10_difference": _equal_within_10_difference,
                "equal_percentage": dtostr(_equal_perc),
                "not_equal_percentage": dtostr(_not_equal_perc),
                "equal_within_5_difference_percentage": dtostr(round(_equal_within_5_difference / _total, 4)),
                "equal_within_10_difference_percentage": dtostr(round(_equal_within_10_difference / _total, 4)),
            }

            return result


class DatetimeColumnReconciler(ColumnReconciler):
    def __init__(
        self,
        engine: Engine,
        base_table: Table,
        target_table: Table,
        base_col: Column,
        target_col: Column,
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
        bkey = self.base_col.name
        tkey = self.target_col.name
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
            _total, _equal, _not_equal, equal_withitn_1_day_difference, equal_within_1_week_difference, equal_within_1_month_difference, _not_comparable = result

            result = {
                "name": self.name,
                "base_table": self.base_table.name,
                "base_column": self.base_col.name,
                "target_table": self.target_table.name,
                "target_column": self.target_col.name,
                "base_compare_key": self.base_compare_col.name,
                "target_compare_key": self.target_compare_col.name,
                "total": _total,
                "equal": _equal,
                "not_equal": _not_equal,
                "not_comparable": _not_comparable,
                "equal_percentage": dtostr(round(_equal / _total, 4)),
                "not_equal_percentage": dtostr(round(1 - _equal / _total, 4)),
                "equal_within_1_day_difference": equal_withitn_1_day_difference,
                "equal_within_1_week_difference": equal_within_1_week_difference,
                "equal_within_1_month_difference": equal_within_1_month_difference,
                "equal_within_1_day_difference_percentage": dtostr(round(equal_withitn_1_day_difference / _total, 4)),
                "equal_within_1_week_difference_percentage": dtostr(round(equal_within_1_week_difference / _total, 4)),
                "equal_within_1_month_difference_percentage": dtostr(round(equal_within_1_month_difference / _total, 4)),
            }
            return result


class BooleanColumnReconciler(ColumnReconciler):
    def __init__(
        self,
        engine: Engine,
        base_table: Table,
        target_table: Table,
        base_col: Column,
        target_col: Column,
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
        bkey = self.base_col.name
        tkey = self.target_col.name
        bcompkey = self.base_compare_col.name
        tcompkey = self.target_compare_col.name
        cte = super()._base_cte(bkey, bcompkey, tkey, tcompkey)

        with self.bengine.connect() as conn:
            query = f"""
            {cte}
            stats as (
                select
                    count(*) as total,
                    sum(case when bcid = tcid then 1 else 0 end) as equal,
                    sum(case when bcid != tcid then 1 else 0 end) as not_equal,
                    sum(case when bcid is null or tcid is null then 1 else 0 end) as not_comparable
                from fjoin
            )
            select * from stats
            """
            result = conn.execute(text(query)).fetchone()
            _total, _equal, _not_equal, _not_comparable = result

            result = {
                "name": self.name,
                "base_table": self.base_table.name,
                "base_column": self.base_col.name,
                "target_table": self.target_table.name,
                "target_column": self.target_col.name,
                "base_compare_key": self.base_compare_col.name,
                "target_compare_key": self.target_compare_col.name,
                "total": _total,
                "equal": _equal,
                "not_equal": _not_equal,
                "not_comparable": _not_comparable,
                "equal_percentage": dtostr(round(_equal / _total, 4)),
                "not_equal_percentage": dtostr(round(1 - _equal / _total, 4)),
            }
            return result


class MismatchDataTypeColumnReconciler:
    """
    This class is used to reconcile columns with mismatched data types (e.g. int vs. string)
    It may invlove some type conversion before comparison
    """

    def reconcile(self) -> dict:
        raise NotImplementedError


def reconcile_table_counts(
    engine: Engine,
    base_table: Table,
    target_table: Table,
    base_col: Column,
    target_col: Column,
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
            select {base_col.name} as bid
            from {_base_table}
        ),
        t as (
            select {target_col.name} as tid
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
