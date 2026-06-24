# A000 Full EDA Report

## Summary

This report records a full-dataset EDA pass for the Kaggle OTTO session dataset. It covers the complete train and test JSONL files, generates public SVG figures, and translates data observations into validation, candidate-generation, and feature-engineering hypotheses.

Primary artifacts:

| Artifact | Path |
| :-- | :-- |
| Summary JSON | `reports/eda/full_eda_summary.json` |
| Split summary table | `reports/eda/split_summary.csv` |
| Top-aid table | `reports/eda/top_aids_by_split.csv` |
| Public EDA page | `site/data_eda.md` |
| Figures | `site/assets/figures/*.svg` |

## Data Scope

| split | sessions | events | unique aids | time range |
| :-- | --: | --: | --: | :-- |
| train | 12,899,779 | 216,716,096 | 1,855,603 | 2022-07-31 to 2022-08-28 UTC |
| test | 1,671,803 | 13,851,293 | 1,019,357 | 2022-08-28 to 2022-09-04 UTC |

## Field Contract

```text
session -> events[]
event -> aid, ts, type
```

Recommended event-level representation:

```text
session:int64, aid:int64, ts:int64, type:string, event_idx:int32
```

## Core Findings

| Finding | Evidence | Engineering consequence |
| :-- | :-- | :-- |
| Test sessions are short | Mean session length is 8.29 in test vs 16.80 in train | Segment validation and baseline metrics by session length |
| Repeated item behavior is common | 69.20% of train sessions and 63.61% of test sessions repeat an aid | Include session-history candidates and count/recency features |
| Orders are sparse but important | Full train order ratio is 2.35%; metric order weight is 0.60 | Build order-specific candidate sources and diagnostics |
| Orders skew late | 54.66% of train orders and 73.75% of test orders occur in final 30% of session | Add relative-position and late-event weighting |
| Popularity drifts | Train/test top100 item Jaccard is 0.3072 | Compare global and recent-window popularity |
| Test items are not cold | 100% of test aids appear in train | Focus on observed item graph and co-visitation |
| Type transitions are asymmetric | Cart-to-order transition probability is about 9-10% | Build type-aware co-visitation matrices |

## Modeling Hypotheses

| Hypothesis | Planned experiment |
| :-- | :-- |
| Type-specific popularity improves over one global fallback | `B000_popularity_baseline` |
| Recent unique session history is a strong baseline candidate source | `B001_session_history_baseline` |
| Chronological validation is required to measure drift-sensitive methods | `V000_time_split` |
| Click-to-cart and cart-to-order co-visitation improve cart/order recall | `C000_covisit_baseline` |
| Relative-position and last-event-type features improve order ranking | `F000_session_item_features` |

## Figure Inventory

| Figure | Purpose |
| :-- | :-- |
| `eda_session_length_hist.svg` | Compare train/test session length distribution |
| `eda_event_type_mix.svg` | Show click/cart/order imbalance |
| `eda_session_signals.svg` | Compare repeated-aid and cart/order session signals |
| `eda_daily_event_volume.svg` | Show chronological structure and split boundary |
| `eda_item_popularity_loglog.svg` | Show item popularity long tail |
| `eda_type_transition_heatmap.svg` | Show type-to-type event transitions |
| `eda_type_position_deciles.svg` | Show where behavior types appear inside sessions |

## Next Steps

1. Build `V000_time_split` with weighted Recall@20 sanity checks.
2. Implement `B000_popularity_baseline` with global, recent, and target-specific variants.
3. Implement `B001_session_history_baseline` and report metrics by session length.
4. Build first co-visitation matrices guided by click-click, click-cart, and cart-order transitions.
