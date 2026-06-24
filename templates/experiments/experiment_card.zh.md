# <EXPERIMENT_ID> <TITLE>

## Metadata

| Field | Value |
| :-- | :-- |
| Experiment ID |  |
| Stage |  |
| Status | planned / running / succeeded / rejected |
| Config | `configs/experiment/<EXPERIMENT_ID>.yaml` |
| Dataset version |  |
| Split version |  |

## Hypothesis

State the expected improvement and the mechanism behind it.

```text
If we ..., then ... should improve because ...
```

## Method Design

Describe the method at the level needed for reproducibility.

```text
Input sessions
  -> candidate source / model component
  -> scoring or ranking
  -> top-k output
```

## Inputs

| Input | Version/path | Notes |
| :-- | :-- | :-- |
| Dataset |  |  |
| Split |  |  |
| Config |  |  |

## Command

```bash
# exact command here
```

## Outputs

| Output | Path | Notes |
| :-- | :-- | :-- |
| Metrics |  |  |
| Predictions |  |  |
| Figures |  |  |

## Metrics

| Metric | Value | Delta vs baseline |
| :-- | --: | --: |
| clicks_recall20 |  |  |
| carts_recall20 |  |  |
| orders_recall20 |  |  |
| weighted_recall20 |  |  |

## Diagnostics

| Diagnostic | Result | Interpretation |
| :-- | :-- | :-- |
| Candidate recall by target |  |  |
| Coverage by session length |  |  |
| Runtime |  |  |
| Memory |  |  |

## Decision

Adopt / reject / keep for later.

Reason:

- 

## Next Step

- [ ] 
