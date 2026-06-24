# OTTO Recommender System Study

This repository is a reproducible recommender-system study of the Kaggle OTTO competition. It is designed as both a public project report and an experiment-iteration workspace.

The goal is to build the project like a mature recommendation case study: define the task and metric, inspect the full data schema, build EDA tables and visualizations, design validation, implement baselines, iterate on candidate generation and ranking, and record each experiment with clear evidence.

## What This Project Should Demonstrate

| Area | Public artifact | Engineering artifact |
| :-- | :-- | :-- |
| Task understanding | Metric and business framing in `site/task_metric.md` | Metric implementation plan |
| Data understanding | Field contract, distribution tables, EDA insights in `site/data_eda.md` | Raw-to-parquet and validation data pipeline |
| Validation | Time split design in `site/validation.md` | Split, label, and weighted Recall@20 code |
| Modeling | Baseline, co-visitation, and ranking roadmap in `site/methods.md` | Config-driven experiment runs |
| Experiment tracking | Experiment board in `site/experiments.md` | `configs/`, `experiments/`, `registry/` |
| Reproducibility | Engineering notes in `site/engineering.md` | Release guard and public-safe repository layout |

## Current Status

The repository currently contains the public project skeleton and the first EDA report. The next implementation milestone is a minimum reproducible baseline:

1. Convert raw JSONL into event-level parquet.
2. Build a time-based validation split and labels.
3. Implement popularity and session-history baselines.
4. Record results in an experiment card and update the experiment board.

## Repository Layout

```text
configs/      Versioned experiment and pipeline configs
docs/         Public background notes and workflow standards
experiments/  Experiment cards with design, commands, metrics, and conclusions
registry/     Dataset, experiment, feature, and submission indexes
reports/      Detailed analysis reports and generated figures
site/         MkDocs knowledge base source
src/          Reusable project code
templates/    Report and experiment templates
scripts/      Release checks and utility scripts
```

## Data

The raw OTTO dataset is not committed. Download it from Kaggle:

```bash
kaggle datasets download -d otto/recsys-dataset -p data/raw
```

Recommended local layout:

```text
data/raw/
data/parquet/
data/splits/
data/labels/
outputs/
```

Large data files, model artifacts, local environments, logs, and secrets are excluded from git.

## Documentation

Build the public knowledge base:

```bash
mkdocs build --strict
```

Preview locally:

```bash
mkdocs serve
```

Run the public-release guard before pushing:

```bash
bash scripts/check_public_release.sh
```
