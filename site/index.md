# OTTO Recommender System Study

This knowledge base documents a reproducible study of the Kaggle OTTO Recommender System competition. It is organized as a project report: task framing, data understanding, validation, methods, experiments, engineering, and final narrative.

## Executive Summary

OTTO is a session-based, multi-objective recommendation task. Given a truncated session, the system predicts future `clicks`, `carts`, and `orders`. The evaluation metric is weighted Recall@20, with the largest weight assigned to `orders`, so the project must handle both high-volume click behavior and sparse high-value purchase behavior.

The first EDA pass shows:

| Finding | Evidence | Modeling consequence |
| :-- | :-- | :-- |
| Train/test share the same nested session schema | `session -> events[] -> aid, ts, type` | A single event-level interface can support EDA, validation, and features. |
| Test sessions are much shorter in the sampled data | Train sample avg length 52.28; test sample avg length 9.69 | Fallback strategies and recent-item signals matter. |
| Clicks dominate frequency, orders dominate metric weight | Train sample clicks 91.25%, orders 1.78%; metric order weight 0.60 | Use target-specific candidate and ranking strategies. |
| Train and test are time-contiguous | Test sample starts immediately after train sample window | Use time-based validation, not random split. |
| Repeated items are common | 83.08% of sampled train sessions repeat at least one item | Session history should be a baseline candidate source. |

## Project Roadmap

| Stage | Goal | Status | Public artifact |
| :-- | :-- | :--: | :-- |
| Task framing | Define objective, metric, and constraints | done | [Task & Metric](task_metric.md) |
| Data & EDA | Build schema contract, distributions, insights | draft | [Data & EDA](data_eda.md) |
| Validation | Create local time split and labels | next | [Validation](validation.md) |
| Baseline | Implement popularity and session-history recommenders | next | [Experiments](experiments.md) |
| Candidate generation | Add co-visitation and target-specific candidates | planned | [Methods](methods.md) |
| Ranking | Add ranker features and GBDT reranking | planned | [Methods](methods.md) |
| Project narrative | Summarize final system and lessons | planned | [Project Story](project_story.md) |

## Knowledge Base

- [Task & Metric](task_metric.md): task definition, weighted Recall@20, and implications.
- [Data & EDA](data_eda.md): field contract, data statistics, quality checks, charts, and insights.
- [Validation](validation.md): time split, label generation, metric checks, and leakage risks.
- [Methods](methods.md): baseline, co-visitation, candidate generation, ranking, and ablation roadmap.
- [Experiments](experiments.md): experiment board, design records, metrics, and decisions.
- [Engineering](engineering.md): repository layout, reproducibility standards, and public-release checks.
- [Project Story](project_story.md): final case-study narrative template.
