
# piperider run
Profile data source, run assertions, and generate report(s). By default, the raw results and reports are saved in ".piperider/outputs".
## Usage
```
Usage: piperider run [OPTIONS]
```
## Options
* `datasource`: 
  * Type: STRING 
  * Default: `none`
  * Usage: `--datasource`

  Datasource to use.


* `table`: 
  * Type: STRING 
  * Default: `none`
  * Usage: `--table`

  Table to use.


* `output`: 
  * Type: STRING 
  * Default: `none`
  * Usage: `--output
-o`

  Directory to save the results.


* `skip_report`: 
  * Type: BOOL 
  * Default: `false`
  * Usage: `--skip-report`

  Skip generating report.


* `dbt_state`: 
  * Type: STRING 
  * Default: `none`
  * Usage: `--dbt-state`

  Directory of the the dbt state.


* `report_dir`: 
  * Type: STRING 
  * Default: `none`
  * Usage: `--report-dir`

  Use a different report directory.


* `upload`: 
  * Type: BOOL 
  * Default: `false`
  * Usage: `--upload`

  Upload the report to the PipeRider Cloud.


* `open`: 
  * Type: BOOL 
  * Default: `false`
  * Usage: `--open`

  Opens the generated report in the system's default browser


* `debug`: 
  * Type: BOOL 
  * Default: `false`
  * Usage: `--debug`

  Enable debug mode.


* `help`: 
  * Type: BOOL 
  * Default: `false`
  * Usage: `--help`

  Show this message and exit.


## CLI Help
```
Usage: piperider run [OPTIONS]

  Profile data source, run assertions, and generate report(s). By default, the
  raw results and reports are saved in ".piperider/outputs".

Options:
  --datasource DATASOURCE_NAME  Datasource to use.
  --table TABLE_NAME            Table to use.
  -o, --output TEXT             Directory to save the results.
  --skip-report                 Skip generating report.
  --dbt-state TEXT              Directory of the the dbt state.
  --report-dir TEXT             Use a different report directory.
  --upload                      Upload the report to the PipeRider Cloud.
  --open                        Opens the generated report in the system's
                                default browser
  --debug                       Enable debug mode.
  --help                        Show this message and exit.
```
