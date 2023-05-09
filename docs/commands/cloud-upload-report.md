
# cloud upload-report

    Upload a single run report to PipeRider Cloud
    
## Usage
```
Usage: piperider cloud upload-report [OPTIONS]
```
## Options
* `run`: 
  * Type: Path 
  * Default: `none`
  * Usage: `--run`

  Specify the raw result file.


* `report_dir`: 
  * Type: STRING 
  * Default: `none`
  * Usage: `--report-dir`

  Use a different report directory.


* `datasource`: 
  * Type: STRING 
  * Default: `none`
  * Usage: `--datasource`

  Specify the datasource.


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
Usage: piperider cloud upload-report [OPTIONS]

  Upload a single run report to PipeRider Cloud

Options:
  --run PATH                    Specify the raw result file.
  --report-dir TEXT             Use a different report directory.
  --datasource DATASOURCE_NAME  Specify the datasource.
  --debug                       Enable debug mode.
  --help                        Show this message and exit.
```
