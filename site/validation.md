# Validation

## Goal

The validation design should simulate the competition setting: given a session prefix, predict future clicks, carts, and orders. A random split is not suitable because OTTO is time-sensitive and train/test are sequential.

## Proposed Split

```text
raw train sessions
  -> sort/filter by timestamp
  -> choose a recent validation window
  -> split each selected session into input prefix and future labels
  -> evaluate top-20 predictions for clicks/carts/orders
```

EDA motivation:

- Train and test are chronological neighbors.
- Full train covers 2022-07-31 to 2022-08-28; test covers 2022-08-28 to 2022-09-04.
- Top popularity drifts across the boundary: train/test top100 item Jaccard is 0.3072.
- Random splitting would mix popularity regimes and overstate generalization.

## Validation Artifacts

| Artifact | Description | Status |
| :-- | :-- | :-- |
| `V000_time_split` | Time-based split definition | planned |
| `labels.parquet` | Future target items grouped by session and target | planned |
| `valid_input.parquet` | Truncated session events used as model input | planned |
| `metric.py` | Weighted Recall@20 implementation | planned |
| `metric_sanity.md` | Small hand-checked metric cases | planned |

## Metric Contract

For each target:

```text
recall@20 = hits(predicted_top_20, true_items) / min(20, number_of_true_items)
```

Final score:

```text
0.10 * clicks + 0.30 * carts + 0.60 * orders
```

## Leakage Checks

| Risk | Check |
| :-- | :-- |
| Future events included in input | Ensure all input timestamps are before label timestamps. |
| Random session splitting | Use chronological split as the default validation protocol. |
| Test labels assumed | Never derive labels from the public test split. |
| Duplicate predictions | Deduplicate candidates before metric computation. |
| Target leakage across types | Evaluate clicks, carts, and orders separately. |

## Required Diagnostics

| Diagnostic | Why it matters |
| :-- | :-- |
| Metric sanity examples | Prevents silent weighted Recall@20 implementation errors. |
| Score by session length bucket | Test is much shorter than train. |
| Score by target | Orders dominate the metric but are sparse. |
| Candidate recall before ranking | Separates retrieval bottlenecks from ranking bottlenecks. |
| Recent vs global popularity comparison | Popular items drift over time. |
