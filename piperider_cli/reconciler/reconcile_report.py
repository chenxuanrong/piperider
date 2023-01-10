from rich.console import Console

from piperider_cli import datetime_to_str, str_to_datetime, clone_directory, \
    raise_exception_when_directory_not_writable 


class ReconcileReport(object):

    def __init__(self, reconcile_output_path):
        self.reconcile_output_path = reconcile_output_path
        self.console = Console()

    @staticmethod
    def exec(output=None, debug=False):
        console = Console()
        raise_exception_when_directory_not_writable(output)

        console.print()
        console.print(f"Reconcile report is WIP")



