# Experiments

## Experiment Board

The experiment board tracks hypotheses, design choices, metrics, and decisions. Each row should connect to an experiment card under `experiments/`.

| ID | Stage | Hypothesis | Primary metric | Status | Decision |
| :-- | :-- | :-- | :-- | :-- | :-- |
| E000_smoke_download | Data access | Kaggle source can be downloaded and inspected through the standard data directory | download_ok | succeeded | keep as environment check |
| A000_full_eda | Analysis | Full-dataset distributions expose validation, candidate, and feature priorities | EDA artifacts | succeeded | use insights to drive `V000`, `B000`, `B001`, `C000` |
| V000_time_split | Validation | A chronological split better simulates test prediction than random splitting | metric_sanity | planned | pending |
| B000_popularity_baseline | Baseline | Global and type-specific popularity provide a robust fallback | weighted_recall@20 | planned | pending |
| B001_session_history_baseline | Baseline | Recent session items are strong candidates for all targets | weighted_recall@20 | planned | pending |
| C000_covisit_baseline | Candidates | Item-item co-visitation improves candidate recall, especially carts/orders | candidate_recall@K | planned | pending |

## Baseline Scorecard

| Experiment | clicks@20 | carts@20 | orders@20 | weighted@20 | Notes |
| :-- | --: | --: | --: | --: | :-- |
| B000_popularity_baseline | - | - | - | - | planned |
| B001_session_history_baseline | - | - | - | - | planned |
| C000_covisit_baseline | - | - | - | - | planned |

## Experiment Card Standard

Every experiment card should include:

| Section | Expected content |
| :-- | :-- |
| Hypothesis | The change and why it may improve recall |
| Design | Method, data split, candidate/ranking flow, and diagram if helpful |
| Inputs | Dataset version, split version, config path |
| Command | Reproducible command or notebook entry point |
| Outputs | Metrics, artifact paths, figures |
| Analysis | Which target improved and why |
| Decision | Adopt, reject, or keep for later |

## Planned Diagrams

| Diagram | Used by | Status |
| :-- | :-- | :-- |
| Baseline flow | `B000`, `B001` | planned |
| Time split flow | `V000` | planned |
| Candidate-generation architecture | `C000` | planned |
| Ranking feature pipeline | ranker experiments | planned |
