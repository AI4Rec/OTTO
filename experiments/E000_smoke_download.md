# E000 Smoke Download

## Basic Information

| Field | Value |
| :-- | :-- |
| Experiment ID | E000_smoke_download |
| Stage | Data access |
| Status | succeeded |
| Config | `configs/experiment/E000_smoke_download.yaml` |

## Hypothesis

The Kaggle OTTO dataset can be downloaded into the standard local data directory and at least one JSONL member can be parsed into the expected session schema.

## Design

```text
Kaggle dataset
  -> data/raw/
  -> inspect archive members
  -> stream one JSONL row
  -> validate session/events/aid/ts/type fields
```

## Inputs

| Input | Value |
| :-- | :-- |
| Dataset | `kaggle:otto/recsys-dataset` |
| Sample member | `otto-recsys-test.jsonl` |

## Command

```bash
kaggle datasets download -d otto/recsys-dataset -p data/raw
```

## Outputs

| Output | Value |
| :-- | :-- |
| Raw directory | `data/raw/` |
| Download status | succeeded |
| JSONL parse check | succeeded |

## Conclusion

The data access path is valid. The next step is to register the full raw archive as `D000_kaggle_official_raw`, then convert raw JSONL into event-level parquet for EDA, validation, and baseline experiments.
