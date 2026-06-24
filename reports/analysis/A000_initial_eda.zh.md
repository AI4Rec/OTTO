# A000 Initial EDA Report

## Summary

OTTO is a session-based, multi-objective recommendation task. Train and test share the same nested session schema, test sessions are much shorter in the sampled data, clicks dominate event frequency, orders dominate metric weight, and train/test are time-contiguous. The first baselines should combine session history, type-specific popularity, and global fallback items.

## Metadata

| Field | Value |
| :-- | :-- |
| Analysis ID | A000_initial_eda |
| Date | 2026-06-25 |
| Dataset version | D000_kaggle_official_raw |
| Input archive | `data/raw/recsys-dataset.zip` |
| Scope | First 100,000 sessions from train and test, plus full JSONL row counts |

## Questions

- What is the raw schema?
- Are train and test schema-compatible?
- What are the basic scale and distribution properties?
- Which observations should drive validation and baseline design?

## Schema

```text
session -> events[]
event -> aid, ts, type
```

Recommended event-level interface:

```text
session:int64
aid:int64
ts:int64
type:string
event_idx:int32
```

## Full-File Scale

| split | sessions | first_session | last_session | raw jsonl size |
| :-- | --: | --: | --: | --: |
| train | 12,899,779 | 0 | 12,899,778 | 11,307,535,945 |
| test | 1,671,803 | 12,899,779 | 14,571,581 | 750,426,722 |

## Sample Session-Length Distribution

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

## Time Range

| split | min_ts_utc | max_ts_utc |
| :-- | :-- | :-- |
| train sample | 2022-07-31T22:00:00.025000+00:00 | 2022-08-28T21:59:59.941000+00:00 |
| test sample | 2022-08-28T22:00:00.278000+00:00 | 2022-09-04T21:59:58.745000+00:00 |

## Data Quality Checks

| Check | train sample | test sample | Interpretation |
| :-- | --: | --: | :-- |
| Missing top-level keys | 0 | 0 | `session/events` are present. |
| Missing event keys | 0 | 0 | `aid/ts/type` are present. |
| Unknown event type | 0 | 0 | Only expected behavior types observed. |
| Out-of-order events | 0 | 0 | Session events are non-decreasing by timestamp in the sample. |
| Exact duplicate events | 5,541 | 2,147 | Duplicates may be real repeated logging or repeated behavior. |

## Insights and Hypotheses

| Insight | Evidence | Hypothesis | Planned experiment |
| :-- | :-- | :-- | :-- |
| Test sessions are much shorter | Test sample avg length 9.69 vs train 52.28 | Popularity fallback will matter for short sessions | `B000_popularity_baseline` |
| Session history is a strong signal | 64.98% sampled test sessions repeat at least one item | Recently seen items should be candidate sources | `B001_session_history_baseline` |
| Orders need target-specific handling | Orders are sparse but metric weight is 0.60 | Separate target candidate pools should improve weighted recall | `C000_target_candidates` |
| Time-aware validation is necessary | Test starts after train period | Chronological validation should be the default | `V000_time_split` |

## Figure Backlog

| Figure | File | Status |
| :-- | :-- | :-- |
| Session length histogram | `reports/figures/session_length_hist.png` | planned |
| Event type share | `reports/figures/event_type_share.png` | planned |
| Item popularity log-log plot | `reports/figures/item_popularity_loglog.png` | planned |
| Daily event volume | `reports/figures/daily_event_volume.png` | planned |
| Repeated item ratio | `reports/figures/repeat_item_ratio.png` | planned |
