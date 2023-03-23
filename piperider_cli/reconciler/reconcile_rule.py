from typing import List

from dataclasses import dataclass

@dataclass
class ColumnReconcileRule:
    name: str
    base_column: str
    target_column: str
    base_compare_key: str
    target_compare_key: str
    reconcile_condition: str = None
    description: str = None


@dataclass
class ReconcileRule:

    name: str
    base_source: str
    target_source: str
    base_table: str
    target_table: str
    base_join_key: str
    target_join_key: str
    column_reconcile_rules: List[ColumnReconcileRule]
    description: str = None

    def validate(self):
        reasons = []

        if not self.name:
            reasons.append("Each reconcile set needs a name")

        for c_rule in self.column_reconcile_rules:
            if not c_rule.name:
                reasons.append("Column reconcile miss rule name")
            if not all([c_rule.base_compare_key , c_rule.target_compare_key]):
                reasons.append("Compare key is missing")
            
        return reasons == [], reasons
