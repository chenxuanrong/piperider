
# piperider
An open-source toolkit for detecting data issues across pipelines that works with CI systems for continuous data quality assessment.
## Usage
```
Usage: piperider [OPTIONS] COMMAND [ARGS]...
```
## Options
* `help`: 
  * Type: BOOL 
  * Default: `false`
  * Usage: `--help`

  Show this message and exit.


## CLI Help
```
Usage: piperider [OPTIONS] COMMAND [ARGS]...

  An open-source toolkit for detecting data issues across pipelines that works
  with CI systems for continuous data quality assessment.

Options:
  --help  Show this message and exit.

Commands:
  compare-reports      Compare two existing reports.
  diagnose             Check project configuration.
  feedback             Send your feedback to help us improve the PipeRider.
  generate-assertions  Generate recommended assertions.
  generate-report      Generate a report.
  init                 Initialize a PipeRider project.
  list-datasource      (Experimental) List DataSources in current PipeRider
                       project
  reconcile            Compare two tables and generate reconcil reports.
  run                  Profile data source, run assertions, and generate
                       report(s).
  version              Show version information.
```
