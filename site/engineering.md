# Engineering

## Repository Role

The repository is structured as a reproducible experiment workspace. Public documentation explains the project; source code and configs make experiments repeatable.

## Directory Contract

```text
configs/      Experiment and pipeline configs
docs/         Background notes and standards
experiments/  Experiment cards
registry/     Lightweight indexes
reports/      Detailed reports and figures
site/         Public knowledge base
src/          Reusable implementation code
templates/    Report and experiment templates
scripts/      Release checks and utilities
```

Local-only paths:

```text
data/raw/
data/parquet/
data/splits/
data/labels/
outputs/
logs/
```

These paths are intentionally excluded from git.

## Experiment Contract

Every formal experiment should include:

| Field | Purpose |
| :-- | :-- |
| Experiment ID | Stable reference in docs, configs, and registry |
| Hypothesis | What change is expected to help |
| Input data version | Which dataset and split were used |
| Config | Reproducible parameters |
| Command | Exact run entry point |
| Metrics | Click/cart/order and weighted Recall@20 |
| Cost | Runtime, memory, and storage where relevant |
| Decision | Adopt, reject, or keep for later |

## Public Release Guard

Before pushing, run:

```bash
bash scripts/check_public_release.sh
```

The guard checks for common private artifacts, local absolute paths, hostnames, token file names, and internal collaboration language.
