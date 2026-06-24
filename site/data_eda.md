# Data & EDA

## EDA Objective

The first EDA stage defines the data contract and turns raw JSONL sessions into modeling decisions. A mature EDA report for this project should answer:

- What is the exact field schema and type contract?
- How large are train/test and each event type?
- How do session lengths, repeated items, item popularity, and time ranges differ?
- What data quality risks can affect validation and features?
- Which observations directly motivate baseline and candidate-generation design?

## Field Contract

| Field | Level | Type | Meaning | Downstream use |
| :-- | :-- | :-- | :-- | :-- |
| `session` | session | integer | Anonymous session id | Group key, submission key |
| `events` | session | list | Ordered event sequence | Session-history features |
| `aid` | event | integer | Item id | Candidate id and ranking entity |
| `ts` | event | integer | Millisecond timestamp | Time split, recency, co-visitation windows |
| `type` | event | string | `clicks`, `carts`, or `orders` | Target-specific features and labels |

Recommended event-level interface:

```text
session:int64
aid:int64
ts:int64
type:string
event_idx:int32
```

## Dataset Scale

| split | sessions | first_session | last_session | raw jsonl size |
| :-- | --: | --: | --: | --: |
| train | 12,899,779 | 0 | 12,899,778 | 11,307,535,945 |
| test | 1,671,803 | 12,899,779 | 14,571,581 | 750,426,722 |

## Sample Distribution

The current EDA sample uses the first 100,000 sessions from each split.

| split | sample_sessions | events | unique_aids | avg_session_len | p50 | p75 | p90 | p95 | p99 | max |
| :-- | --: | --: | --: | --: | --: | --: | --: | --: | --: | --: |
| train | 100,000 | 5,227,653 | 663,079 | 52.2765 | 19 | 63 | 152 | 227 | 362 | 495 |
| test | 100,000 | 968,596 | 257,143 | 9.6860 | 4 | 10 | 21 | 34 | 80 | 485 |

## Behavior Distribution

| split | clicks | carts | orders | clicks_ratio | carts_ratio | orders_ratio |
| :-- | --: | --: | --: | --: | --: | --: |
| train sample | 4,770,172 | 364,579 | 92,902 | 0.912488 | 0.069740 | 0.017771 |
| test sample | 855,801 | 83,618 | 29,177 | 0.883548 | 0.086329 | 0.030123 |

## Session Signals

| split | sessions_with_carts | ratio | sessions_with_orders | ratio | sessions_with_repeated_aid | ratio |
| :-- | --: | --: | --: | --: | --: | --: |
| train sample | 46,300 | 0.4630 | 23,432 | 0.2343 | 83,079 | 0.8308 |
| test sample | 26,006 | 0.2601 | 11,587 | 0.1159 | 64,977 | 0.6498 |

## Time Window

| split | min_ts_utc | max_ts_utc |
| :-- | :-- | :-- |
| train sample | 2022-07-31T22:00:00.025000+00:00 | 2022-08-28T21:59:59.941000+00:00 |
| test sample | 2022-08-28T22:00:00.278000+00:00 | 2022-09-04T21:59:58.745000+00:00 |

## Figure Plan

The final EDA page should include generated figures under `reports/figures/`:

| Figure | Purpose | Status |
| :-- | :-- | :-- |
| `session_length_hist.png` | Compare train/test session length distribution | planned |
| `event_type_share.png` | Show click/cart/order imbalance | planned |
| `item_popularity_loglog.png` | Show item long-tail behavior | planned |
| `daily_event_volume.png` | Check time trend and split boundary | planned |
| `repeat_item_ratio.png` | Quantify repeated-aid session signal | planned |

## Insights

| Insight | Evidence | Hypothesis | Experiment |
| :-- | :-- | :-- | :-- |
| Short test sessions need fallback | Test sample avg length is 9.69 vs train 52.28 | Global and recent popularity improve short-session recall | `B000_popularity_baseline` |
| Session history is a strong baseline | 64.98% of sampled test sessions repeat an item | Recent seen items should be included as candidates | `B001_session_history_baseline` |
| Orders require separate treatment | Orders are sparse but metric weight is 0.60 | Target-specific candidate mixes improve weighted recall | `C000_target_candidates` |
| Time order matters | Test starts after train window | Time-based validation correlates better than random split | `V000_time_split` |

## Full Report

Detailed notes are tracked in:

```text
reports/analysis/A000_initial_eda.zh.md
```
