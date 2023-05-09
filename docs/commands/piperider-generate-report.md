
# piperider generate-report
Generate a report from the latest raw result or specified result. By default, the raw results are saved in ".piperider/outputs".
## Usage
```
Usage: piperider generate-report [OPTIONS]
```
## Options
* `input`: 
  * Type: Path 
  * Default: `none`
  * Usage: `--input`

  Specify the raw result file.


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
Usage: piperider generate-report [OPTIONS]

  Generate a report from the latest raw result or specified result. By
  default, the raw results are saved in ".piperider/outputs".

Options:
  --input PATH       Specify the raw result file.
  -o, --output TEXT  Directory to save the results.
  --report-dir TEXT  Use a different report directory.
  --debug            Enable debug mode.
  --help             Show this message and exit.
```
