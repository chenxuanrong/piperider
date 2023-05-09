
# cloud compare-reports

    Generate comparison report on PipeRider Cloud
    
## Usage
```
Usage: piperider cloud compare-reports [OPTIONS]
```
## Options
* `base` (REQUIRED): 
  * Type: STRING 
  * Default: `none`
  * Usage: `--base`

  Specify the base report id or data source name. e.g., 123 or datasource:<name>


* `target` (REQUIRED): 
  * Type: STRING 
  * Default: `none`
  * Usage: `--target`

  Specify the target report id or data source name. e.g., 123 or datasource:<name>


* `tables_from`: 
  * Type: Choice(['all', 'target-only', 'base-only']) 
  * Default: `all`
  * Usage: `--tables-from`

  Show table comparison from base or target.


* `summary_file`: 
  * Type: STRING 
  * Default: `none`
  * Usage: `--summary-file`

  Download the comparison summary markdown file.


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
Usage: piperider cloud compare-reports [OPTIONS]

  Generate comparison report on PipeRider Cloud

Options:
  --base TEXT                     Specify the base report id or data source
                                  name. e.g., 123 or datasource:<name>
                                  [required]
  --target TEXT                   Specify the target report id or data source
                                  name. e.g., 123 or datasource:<name>
                                  [required]
  --tables-from [all|target-only|base-only]
                                  Show table comparison from base or target.
  --summary-file TEXT             Download the comparison summary markdown
                                  file.
  --debug                         Enable debug mode.
  --help                          Show this message and exit.
```
