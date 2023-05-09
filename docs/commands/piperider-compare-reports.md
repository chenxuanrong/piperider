
# piperider compare-reports
Compare two existing reports selected in interactive mode or by option.
## Usage
```
Usage: piperider compare-reports [OPTIONS]
```
## Options
* `base`: 
  * Type: Path 
  * Default: `none`
  * Usage: `--base`

  Specify the base report file.


* `target`: 
  * Type: Path 
  * Default: `none`
  * Usage: `--target`

  Specify the report file to be compared.


* `last`: 
  * Type: BOOL 
  * Default: `none`
  * Usage: `--last`

  Compare the last two reports.


* `datasource`: 
  * Type: STRING 
  * Default: `none`
  * Usage: `--datasource`

  Specify the datasource.


* `output`: 
  * Type: STRING 
  * Default: `none`
  * Usage: `--output
-o`

  Directory to save the results.


* `report_dir`: 
  * Type: STRING 
  * Default: `none`
  * Usage: `--report-dir`

  Use a different report directory.


* `tables_from`: 
  * Type: Choice(['all', 'target-only', 'base-only']) 
  * Default: `all`
  * Usage: `--tables-from`

  Show table comparison from base or target.


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
Usage: piperider compare-reports [OPTIONS]

  Compare two existing reports selected in interactive mode or by option.

Options:
  --base PATH                     Specify the base report file.
  --target PATH                   Specify the report file to be compared.
  --last                          Compare the last two reports.
  --datasource DATASOURCE_NAME    Specify the datasource.
  -o, --output TEXT               Directory to save the results.
  --report-dir TEXT               Use a different report directory.
  --tables-from [all|target-only|base-only]
                                  Show table comparison from base or target.
  --debug                         Enable debug mode.
  --help                          Show this message and exit.
```
