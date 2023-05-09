
# piperider init
Initialize a PipeRider project in interactive mode. The configurations are saved in ".piperider".
## Usage
```
Usage: piperider init [OPTIONS]
```
## Options
* `no_auto_search`: 
  * Type: BOOL 
  * Default: `false`
  * Usage: `--no-auto-search`

  Disable auto detection of dbt projects.


* `dbt_project_dir`: 
  * Type: Path 
  * Default: `none`
  * Usage: `--dbt-project-dir`

  Directory to search for dbt_project.yml.


* `dbt_profiles_dir`: 
  * Type: Path 
  * Default: `none`
  * Usage: `--dbt-profiles-dir`

  Directory to search for dbt profiles.yml.


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
Usage: piperider init [OPTIONS]

  Initialize a PipeRider project in interactive mode. The configurations are
  saved in ".piperider".

Options:
  --no-auto-search         Disable auto detection of dbt projects.
  --dbt-project-dir PATH   Directory to search for dbt_project.yml.
  --dbt-profiles-dir PATH  Directory to search for dbt profiles.yml.
  --debug                  Enable debug mode.
  --help                   Show this message and exit.
```
