from datetime import date, datetime
from unittest import TestCase
from typing import List
import os.path

from sqlalchemy import *

from piperider_cli.configuration import Configuration 

from piperider_cli.reconciler.reconciler import (
    Reconciler,
    ColumnReconciler,
    StringColumnReconciler,
    NumericColumnReconciler,
    DatetimeColumnReconciler,
    dtostr,
)
from piperider_cli.reconciler.reconcile_rule import (
    ReconcileProject,
    ReconcileSuite,
    ColumnReconcileRule,
)
from tests.common import MockDatabase


class TestReconciler(TestCase):

    def setUp(self) -> None:
        self.db = MockDatabase()
        self.engine = self.db.engine
        self.reconciler = Reconciler(self.db.engine)

        data1 = [
            ("user_id", "user_name", "age", "birthday"),
            (1, "bob", 23, date(1990,1,1)),
            (2, "alice", 25, date(1990,2,2)),
        ]

        data2 = [
            ("user_id", "user_name", "age", "birthday"),
            (1, "Bob", 22, date(1990,1,1)),
            (2, "alice", 25, date(1990,2,1)),
            (3, "karen", 18, date(1991,7,1)),
        ]
        self.base_table = self.db.create_table("test1", data1)
        self.target_table = self.db.create_table("test2", data2)
        self.reconcile_config_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mock_reconcile.yml")
        self.configuration = Configuration.load(piperider_reconcile_path=self.reconcile_config_file)

    def tearDown(self) -> None:
        self.base_table.drop(self.engine)
        self.target_table.drop(self.engine)


    def test_load_reconcile_yml(self) -> None:

        projects = self.configuration.reconcileRules
        
        r_project = projects[0]
        assert isinstance(r_project, ReconcileProject)
        assert r_project.name == "unittest"
        assert r_project.base_source == "base_source"
        assert r_project.target_source == "target_source"

        r_suites = r_project.suites
        assert isinstance(r_suites, List)
        assert len(r_suites) == 1
        
        r_suite = r_suites[0]
        assert r_suite.name == "test1_test2"
        assert r_suite.description == "Compare table in test1 vs test2"
        assert r_suite.base_table == "test1"
        assert r_suite.target_table == "test2"
        assert r_suite.base_join_key == "user_id"
        assert r_suite.target_join_key == "user_id"

        r_rules = r_suite.column_reconcile_rules
        assert isinstance(r_rules, List)
        assert len(r_rules) == 3
    
    def test_find_reconcile_project(self) -> None:
        project = 'unittest'
        r_project = self.configuration.get_reconcile_project(project)
        assert isinstance(r_project, ReconcileProject)
        assert r_project.name == "unittest"

    def test_table_reconcile(self):
        """
        test table level metrics
        """

        result = self.reconciler._reconcile_table(base_table=self.base_table,
                                                  target_table=self.target_table,
                                                  base_col=self.base_table.columns.get('user_id'),
                                                  target_col=self.target_table.columns.get('user_id'),
                                                  )

        assert "base_only" in result
        assert "target_only" in result
        assert result["common"] == 2
        assert result["base_only"] == 0
        assert result["target_only"] == 1
        assert result["status"] == False        

    def test_column_reconcile_age(self):
        """
        Test numeric column reconciler
        """

        column_reconciler = NumericColumnReconciler(engine=self.engine,
                                                    base_table=self.base_table,
                                                    target_table=self.target_table,
                                                    base_col=self.base_table.columns.get("user_id"),
                                                    target_col=self.target_table.columns.get("user_id"),
                                                    base_compare_col=self.base_table.columns.get("age"),
                                                    target_compare_col=self.target_table.columns.get("age"),
                                                    name="age",
                                                    )

        result = column_reconciler.reconcile()
        assert result["name"] == "age"
        assert result["base_table"] == "test1"
        assert result["target_table"] == "test2"
        assert result["base_compare_key"] == "age"
        assert result["target_compare_key"] == "age"
        assert result["total"] == 3
        assert result["equal"] == 1
        assert result["equal_within_5_difference"] == 1
        assert result["equal_within_10_difference"] == 1
        assert result["not_equal"] == 1
        assert result["not_comparable"] == 1
        assert result["not_comparable"] + result["equal"] + result["not_equal"] == result["total"]
        assert "equal_percentage" in result
        assert "not_equal_percentage" in result

    def test_column_reconcile_name(self):
        """
        Test string type column reconcile
        """

        base_column = self.base_table.columns.get('user_id')
        target_column = self.target_table.columns.get('user_id')
        base_compare_column = self.base_table.columns.get('user_name')
        target_compare_column = self.target_table.columns.get('user_name')

        crule = ColumnReconcileRule(
            name="user_name",
            base_column="user_id",
            target_column="user_id",
            # base_compare_key="user_name",
            # target_compare_key="user_name",
            reconcile_condition="equal",
        )

        column_reconciler = StringColumnReconciler(engine=self.engine,
                                                   base_table=self.base_table,
                                                   target_table=self.target_table,
                                                   base_col=base_column,
                                                   target_col=target_column,
                                                   base_compare_col=base_compare_column,
                                                   target_compare_col=target_compare_column,
                                                   name="username",
                                                )

        result = column_reconciler.reconcile()
        assert result["name"] == "username"
        assert result["base_table"] == "test1"
        assert result["target_table"] == "test2"
        assert result["base_compare_key"] == "user_name"
        assert result["target_compare_key"] == "user_name"
        assert result["total"] == 3
        assert result["equal"] == 1
        assert result["equal_case_insensitive"] == 2
        assert result["not_equal"] == 1
        assert result["not_comparable"] == 1
        assert result["not_comparable"] + result["equal"] + result["not_equal"] == result["total"]
        assert "equal_percentage" in result
        assert "not_equal_percentage" in result

    def test_reconcile_with_null(self):
        return True

    def test_reconcile_with_empty_string(self):
        """
        Test date/datetime type column reconcile
        """
        base_column = self.base_table.columns.get('user_id')
        target_column = self.target_table.columns.get('user_id')
        base_compare_column = self.base_table.columns.get('birthday')
        target_compare_column = self.target_table.columns.get('birthday')

        column_reconciler = DatetimeColumnReconciler(engine=self.engine,
                                                    base_table=self.base_table,
                                                    target_table=self.target_table,
                                                    base_col=base_column,
                                                    target_col=target_column,
                                                    base_compare_col=base_compare_column,
                                                    target_compare_col=target_compare_column,
                                                    name="birthday",
                                                    )
        result = column_reconciler.reconcile()
        assert result["name"] == "birthday"
        assert result["base_table"] == "test1"
        assert result["target_table"] == "test2"
        assert result["base_compare_key"] == "birthday"
        assert result["target_compare_key"] == "birthday"
        assert result["total"] == 3
        assert result["equal"] == 1
        assert result["not_equal"] == 1
        assert result["not_comparable"] == 1
        assert result["not_comparable"] + result["equal"] + result["not_equal"] == result["total"]
        assert result["equal_percentage"] == "33.33%"

    def test_reconciler_e2e(self):
        reconciler  = self.reconciler
        res = reconciler.reconcile(project="unittest")
        assert isinstance(res, dict)
        assert res["project"] == "unittest"
        assert res["description"] == "test data"        
        assert len(res["profileing"]["base"]) == 1
        assert len(res["profileing"]["target"]) == 1
        assert len(res["reconcile"]) == 1
        assert res["reconcile"][0]["name"] == "test1_test2"
        assert res["reconcile"][0]["metadata"]["description"] == "Compare table in test1 vs test2"
        assert "columns" in res["reconcile"][0]["columns"]
        
        assert res is not null

def test_dtostr():
    number = 0.1234
    assert dtostr(number) == "12.34%"
