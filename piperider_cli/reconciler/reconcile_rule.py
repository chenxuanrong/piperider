from typing import List

from dataclasses import dataclass

@dataclass
class ColumnReconcileRule:
    name: str
    base_column: str
    target_column: str
    base_compare_column: str
    target_compare_column: str
    description: str = None
    reconcile_condition: str = None


@dataclass
class ReconcileSuite:

    name: str
    base_table: str
    target_table: str
    base_join_key: str
    target_join_key: str    
    column_reconcile_rules: List[ColumnReconcileRule]
    description: str = None
    # base_source: str
    # target_source: str
    # base_table: str
    # target_table: str
    # base_join_key: str
    # target_join_key: str

    def validate(self):
        reasons = []

        if not self.name:
            reasons.append("Each reconcile set needs a name")

        for c_rule in self.column_reconcile_rules:
            if not c_rule.name:
                reasons.append("Column reconcile miss rule name")
            if not all([c_rule.base_compare_column , c_rule.target_compare_column]):
                reasons.append("Compare key is missing")
            
        return reasons == [], reasons
    
    def add_rule(self, rule: ColumnReconcileRule):
        self.column_reconcile_rules.append(rule)

    
@dataclass
class ReconcileProject:
    name: str
    base_source: str
    target_source: str
    description: str = None
    suites: List[ReconcileSuite] = None

    def validate(self):
        reasons = []
        if self.name is None:
            reasons.append("Project name is missing")
        return reasons == [], reasons

    def add_suite(self, suite: ReconcileSuite):
        self.suites.append(suite)
