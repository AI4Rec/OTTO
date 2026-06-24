# Experiment Versioning Standard

## Goal

Every formal experiment should be traceable from four pieces of information:

1. Code version.
2. Dataset and split version.
3. Config file.
4. Metrics, artifacts, and conclusion.

## Repository Structure

```text
configs/
  data/
  experiment/
  recall/
  ranker/
experiments/
registry/
reports/
src/
```

Local generated files should follow this layout and remain outside git:

```text
data/raw/
data/parquet/
data/splits/
data/labels/
outputs/experiments/
outputs/submissions/
logs/
```

## Experiment ID Rules

| Prefix | Meaning |
| :-- | :-- |
| `D000_*` | Dataset version or derived data artifact |
| `A000_*` | Analysis and EDA |
| `V000_*` | Validation split and metric |
| `B000_*` | Baseline |
| `C000_*` | Candidate generation and recall |
| `F000_*` | Features |
| `R000_*` | Ranking |
| `S000_*` | Submission |

Examples:

```text
V000_time_split
B000_popularity_baseline
B001_session_history_baseline
C000_covisit_baseline
R000_lgbm_ranker
```

## Required Files

Every formal experiment should have:

```text
configs/experiment/<EXPERIMENT_ID>.yaml
experiments/<EXPERIMENT_ID>.md
registry/experiments.tsv entry
outputs/experiments/<EXPERIMENT_ID>/ local run directory
```

## Config Requirements

Config files should include:

- Experiment ID.
- Dataset version.
- Split version.
- Input artifact paths.
- Method parameters.
- Random seed when applicable.
- Output directory.
- Metrics to compute.

Config files must not contain credentials, private machine details, or absolute infrastructure paths.

## Experiment Card Requirements

Each experiment card should record:

- Hypothesis.
- Method design.
- Inputs and config.
- Exact command.
- Output artifacts.
- Metrics.
- Diagnostics.
- Decision.
- Follow-up.

## Registry Fields

`registry/experiments.tsv` should contain:

```text
experiment_id
stage
status
config_path
card_path
output
best_metric
created_at
notes
```

The registry is an index, not a replacement for the experiment card.
