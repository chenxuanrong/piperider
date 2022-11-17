import os

from piperider_cli.profiler import Profiler
import piperider_cli.dbtutil as dbtutil
from tests.common import MockDatabase
from unittest import TestCase


class TestRunner(TestCase):

    def setUp(self):
        self.db = MockDatabase()
        self.profiler = Profiler(self.db.engine)

        data1 = [
            ("symbol", "open", "ma60", "ma20"),
            ("AAA", 1, 2, 3),
            ("BBB", 4, 5, 6),
        ]
        data2 = [
            ("symbol", "open", "ma60", "ma20"),
            ("CCC", 1, 2, 3),
            ("DDD", 4, 5, 6),
        ]
        self.db.create_table("PRICE", data1)
        self.db.create_table("PRICE_PRESENT", data2)
        self.profile_results = self.profiler.profile()
        self.dbt_state_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mock_dbt_data")

    def test_get_dbt_state_candidate(self):
        tables = dbtutil.get_dbt_state_candidate(self.dbt_state_dir, 'PUBLIC')

        self.assertListEqual(['PRICE_PRESENT'], tables)

    def test_get_dbt_state_tests_result(self):
        results, results_compatible = dbtutil.get_dbt_state_tests_result(self.dbt_state_dir, 'PUBLIC')

        self.assertIn('PRICE_PRESENT', results_compatible)
        self.assertIn('MA60', results_compatible['PRICE_PRESENT']['columns'])
        self.assertEqual('failed', results_compatible['PRICE_PRESENT']['columns']['MA60'][0]['status'])

        table_names = [r.get('table') for r in results]
        column_names = [r.get('column') for r in results]

        self.assertIn('PRICE_PRESENT', table_names)
        self.assertIn('MA60', column_names)

        status = None
        for r in results:
            if r.get('table') == 'PRICE_PRESENT' and r.get('column') == 'MA60':
                status = r.get('status')
                break
        self.assertEqual('failed', status)

    def test_dbt_append_descriptions(self):
        dbtutil.append_descriptions(self.profile_results, self.dbt_state_dir, 'PUBLIC')

        self.assertEqual('The price data to today - via DBT',
                         self.profile_results['tables']['PRICE_PRESENT']['description'])
        self.assertEqual('The symbol name - via DBT',
                         self.profile_results['tables']['PRICE_PRESENT']['columns']['symbol']['description'])
