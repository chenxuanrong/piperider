import os
import shutil
import json

from rich.console import Console

from piperider_cli.generate_report import setup_report_variables
from piperider_cli.filesystem import FileSystem

from piperider_cli import datetime_to_str, str_to_datetime, clone_directory, \
    raise_exception_when_directory_not_writable 
from piperider_cli.error import PipeRiderNoReconcileResultError 


def _validate_input_result(result):
    for f in ['id', 'project', 'created_at', 'profiling', 'reconcile']:
        if f not in result:
            return False
    return True

def _get_run_json_path(filesystem: FileSystem, input):
    console = Console() 
    run_json = None
    if input:
        if not os.path.exists(input):
            console.print(f'[bold red]Error: {input} not found[/bold red]')
            return
        if os.path.isdir(input):
            run_json = os.path.join(input, 'reconcile.json')
        else:
            run_json = input
    else:
        latest = os.path.join(filesystem.get_reconcile_dir(), 'latest')
        run_json = os.path.join(latest, 'reconcile.json')
    return run_json

class ReconcileReport:

    @staticmethod
    def exec(input=None, report_dir=None, output=None, debug=False):

        filesystem = FileSystem(report_dir=report_dir)
        
        raise_exception_when_directory_not_writable(output)

        console = Console()
        from piperider_cli import data
        report_template_dir = os.path.join(os.path.dirname(data.__file__), 'report', 'reconcile-report')
        with open(os.path.join(report_template_dir, 'index.html')) as f:
            report_template_html = f.read()

        def output_report(target_directory):
            clone_directory(report_template_dir, target_directory)
            filename = os.path.join(target_directory, "index.html")
            with open(filename, 'w') as f:
                html = setup_report_variables(report_template_html, False, result, 'reconcile')
                f.write(html)
        
        run_json_path = _get_run_json_path(filesystem, input)
        if not os.path.isfile(run_json_path):
            print(os.path.abspath(run_json_path))
            raise PipeRiderNoReconcileResultError(run_json_path)
        
        with open(run_json_path) as f:
            result = json.loads(f.read())
        if not _validate_input_result(result):
            console.print(f'[bold red]Error: {run_json_path} is invalid[/bold red]')
            return
        
        console.print(f'[bold dark_orange]Generating reports from:[/bold dark_orange] {run_json_path}')

        def output_report(target_directory):
            clone_directory(report_template_dir, target_directory)
            filename = os.path.join(target_directory, "index.html")
            with open(filename, 'w') as f:
                html = setup_report_variables(report_template_html, False, result, 'reconcile')
                f.write(html)
        
        default_output_directory = os.path.dirname(run_json_path)
        output_report(default_output_directory)

        if output:
            output_report(output)
            shutil.copyfile(run_json_path, os.path.join(output, os.path.basename(run_json_path)))
            console.print(f"Report generated at: {output}/index.html")
        else:
            console.print(f"Report generated at: {default_output_directory}/index.html")
