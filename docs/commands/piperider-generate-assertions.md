
# piperider generate-assertions
Generate recommended assertions based on the latest result. By default, the profiling result will be loaded from ".piperider/outputs".
## Usage
```
Usage: piperider generate-assertions [OPTIONS]
```
## Options
* `input`: 
  * Type: Path 
  * Default: `none`
  * Usage: `--input`

  Specify the raw result file.


* `no_recommend`: 
  * Type: BOOL 
  * Default: `false`
  * Usage: `--no-recommend`

  Generate assertions templates only.


* `report_dir`: 
  * Type: STRING 
  * Default: `none`
  * Usage: `--report-dir`

  Use a different report directory.


* `table`: 
  * Type: STRING 
  * Default: `none`
  * Usage: `--table`

  Generate assertions for the given table


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
Usage: piperider generate-assertions [OPTIONS]

  Generate recommended assertions based on the latest result. By default, the
  profiling result will be loaded from ".piperider/outputs".

Options:
  --input PATH       Specify the raw result file.
  --no-recommend     Generate assertions templates only.
  --report-dir TEXT  Use a different report directory.
  --table TEXT       Generate assertions for the given table
  --debug            Enable debug mode.
  --help             Show this message and exit.
```
