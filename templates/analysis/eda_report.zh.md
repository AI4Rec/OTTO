# <ANALYSIS_ID> EDA Report

## Executive Summary

| Item | Content |
| :-- | :-- |
| Dataset version |  |
| Scope |  |
| Main conclusion |  |
| Modeling implication |  |
| Next experiment |  |

## Questions

- What field contract should downstream code rely on?
- What are the full and sampled data scales?
- Which distributions shape validation, candidates, and features?
- Which data-quality risks need explicit checks?
- Which insights map to concrete experiments?

## Field Contract

| Field | Level | Type | Meaning | Valid values | Downstream use |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `session` | session |  |  |  |  |
| `events` | session |  |  |  |  |
| `aid` | event |  |  |  |  |
| `ts` | event |  |  |  |  |
| `type` | event |  |  |  |  |

## Data Scale

| Split | Sessions | Events | Unique aids | Time range | Notes |
| :-- | --: | --: | --: | :-- | :-- |
| train |  |  |  |  |  |
| test |  |  |  |  |  |

## Distribution Tables

### Session Length

| Split | Mean | p50 | p75 | p90 | p95 | p99 | Max |
| :-- | --: | --: | --: | --: | --: | --: | --: |
| train |  |  |  |  |  |  |  |
| test |  |  |  |  |  |  |  |

### Behavior Type

| Split | Clicks | Carts | Orders | Click ratio | Cart ratio | Order ratio |
| :-- | --: | --: | --: | --: | --: | --: |
| train |  |  |  |  |  |  |
| test |  |  |  |  |  |  |

### Item Popularity

| Metric | Value | Interpretation |
| :-- | --: | :-- |
| unique_aids |  |  |
| top_1_share |  |  |
| top_100_share |  |  |
| long_tail_share |  |  |

## Figures

| Figure | File | Question answered | Status |
| :-- | :-- | :-- | :-- |
| Session length histogram | `reports/figures/<name>.png` |  |  |
| Event type share | `reports/figures/<name>.png` |  |  |
| Item popularity log-log plot | `reports/figures/<name>.png` |  |  |
| Time trend | `reports/figures/<name>.png` |  |  |

## Data Quality

| Check | Result | Severity | Follow-up |
| :-- | :-- | :-- | :-- |
| Missing keys |  |  |  |
| Unknown behavior types |  |  |  |
| Time-order violations |  |  |  |
| Duplicate events |  |  |  |
| Extreme sessions |  |  |  |

## Insights

| Insight | Evidence | Modeling hypothesis | Experiment |
| :-- | :-- | :-- | :-- |
|  |  |  |  |

## Decisions

| Decision | Reason | Affected component |
| :-- | :-- | :-- |
|  |  |  |
