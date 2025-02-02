<p>
  <a href="https://piperider.io" alt="piperider logo" title="Piperider Home">
    <img width="450px" src=".github/images/logo.svg" border="0" alt="PipeRider">
  </a>
</p>
<p>
  Data reliability tool for profiling and testing your data
</p>


# Table of Contents

- [Data Reliability = Profiling + Testing](#data-reliability--profiling--testing)
- [Quickstart](#quickstart)
  - [Installation](#installation)
  - [Initialize Project & Diagnose Settings](#initialize-project--diagnose-settings)
  - [Profiling and Testing Your Data](#profiling-and-testing-your-data)
  - [Comparing Your Data Profiles](#comparing-your-data-profiles)
  - [Reconcile datasets](#reconcile-datasets)

# Data Reliability = Profiling + Testing

Piperider is a CLI tool that allows you to build data profiles and write assertion tests for easily evaluating and tracking your data's reliability over time.

## Core Concepts

1. **Profile Your Data** to explore/understand what kind of dataset you're dealing with
   _e.g. completeness, duplicates, missing values, distributions_
2. **Test Your Data** to verify that your data is within acceptable range and formatted correctly
3. **Observe & Monitor Your Data** to keep an eye on how that data changes over time

## Key Features

- **SQL-based** (additionally supports CSV)
- **Data Profiling Characteristics**
  - Provides rich data profiling [metrics](https://github.com/InfuseAI/piperider/blob/main/docs/metrics.md)
  - e.g. `missing`, `uniqueness`, `duplicate_rows`, `quantiles`, `histogram`
- **Test datasets with a mix of custom and built-in assertion definitions**
- **Auto-generates recommended assertions based on your single-run profiles**
- **Generates single-run reports** to visualize your data profile and assertion test results ([example](https://piperider-github-readme.s3.ap-northeast-1.amazonaws.com/run-0.16.0/index.html))
- **Generates comparison reports** to visualize how your data has changed over time ([example](https://piperider-github-readme.s3.ap-northeast-1.amazonaws.com/comparison-0.16.0/index.html))
- **Supported Datasources**: Snowflake, BigQuery, Redshift, Postgres, SQLite, DuckDB, CSV, Parquet.


# Quickstart

This repo is a fork version of piperider package that includes `reconcile` feature.

## Get Started

Create a [github personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

## Installation

```bash
pip install "piperider @ git+https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/chenxuanrong/piperider@domain"

# To install database drives
pip install "piperider[snowflake] @ git+https://${GITHUB_USER}:${GITHUB_TOKEN}@github.com/chenxuanrong/piperider@domain"

```

By default, PipeRider supports built-in SQLite connector, extra connectors are available:

| connectors | install                              |
| ---------- | ------------------------------------ |
| snowflake  | `pip install 'piperider[snowflake] @GITHUB_REPO'` |
| postgres   | `pip install 'piperider[postgres]' @GITHUB_REPO`  |
| bigquery   | `pip install 'piperider[bigquery]' @GITHUB_REPO`  |
| redshift   | `pip install 'piperider[redshift]' @GITHUB_REPO`  |
| parquet    | `pip install 'piperider[parquet]' @GITHUB_REPO`   |
| csv        | `pip install 'piperider[csv]' @GITHUB_REPO`       |
| duckdb     | `pip install 'piperider[duckdb]' @GITHUB_REPO`    |

Use comma to install multiple connectors in one line:

```bash
pip install 'piperider[postgres,snowflake] @@GITHUB_REPO'
```

## Initialize Project & Diagnose Settings

Once installed, initialize a new project with the following command.

```bash
piperider init        # initializes project config
piperider diagnose    # verifies your data source connection & project config
```

## Profiling and Testing Your Data

Next, execute `piperider run`, which will do a number of things:

1. Create a single-run profile of your data source
1. Auto-generate recommended or template assertions files (first-run only)
1. Test that single-run profile against any available assertions, including custom and/or recommended assertions
1. Generate a static HTML report, which helps visualize the single-run profile and its assertion results.

Common Usages/Tips:

```bash
piperider run                           # profile all tables in the data source.

piperider run --table $TABLENAME        # profile a specific table

piperider generate-report -o $PATHNAME  # Specify the output location of the generated report

piperider generate-assertions           # To re-generate the recommended assertions after the first-run
```

## Comparing Your Data Profiles

With at least two runs completed, you can then run `piperider compare-reports`, which will generate a comparison report that presents the changes between them (e.g. schema changes, column renaming, distributions).

Common Usages/Tips:

```bash
piperider compare-reports --last        # Compare the last two reports automatically using
```

For more details on the generated report, see the [doc](https://docs.piperider.io/how-to-guides/generate-report)

## Example Report Demo

[See Generated Single-Run Report](https://piperider-github-readme.s3.ap-northeast-1.amazonaws.com/run-0.16.0/index.html)

[See Comparison Report](https://piperider-github-readme.s3.ap-northeast-1.amazonaws.com/comparison-0.16.0/index.html)


## Reconcile datasets

Create a file `.piperider/reconcile.yml` after initialisation.

A sample reconcile declaration 

```yaml
Reconciles:
  - name: migration
    description: This project reconciles v1 and v2 migration
    base_source: v1
    target_source: v2

    suites:
    - name: address_table
      description: Compare property address table in v1 and v2
      base:
        table: property_address
        join_key: address_id
      target:
        table: address
        join_key: id
      
      rules:
        - name: street_name
          description: Compare street name
          base_column: street_name
          target_column: street_name
        - name: postcode
          description: Compare postcode
          base_column: postcode
          target_column: postcode

    - name: <another_suite>
    
  - name: <second_project>
  - name: <third_project>

```

Common Usage

```
piperider reconcile
piperider reconcile --project migration
```

The result is saved to `.piperider/reconciles/latest/reconcile.json`


**Notes:**

- `base_source` and `target_source` are defined in `config.yml` and `credential.yml`

**Limitations:**

- `join_key` only support string now. If multiple columns are required to join base and target table, user can string concatenation. List of columns configuration will be supported in the future.
- By default, the first project defined in `reconcile.yml` is executed. User can select project by pass `--project <name>`.



# Development

See [setup dev environment](DEVELOP.md) and the [contributing guildlines](CONTRIBUTING.md) to get started.