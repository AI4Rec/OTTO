# E000_smoke_download 数据访问冒烟检查

## 元信息

| 字段 | 值 |
| :-- | :-- |
| Experiment ID | E000_smoke_download |
| 阶段 | data_access |
| 状态 | 已完成 |
| 配置 | `configs/experiment/E000_smoke_download.yaml` |
| 数据版本 | Kaggle `otto/recsys-dataset` |
| Split 版本 | 不适用 |

## 假设

如果 Kaggle dataset 能下载到标准目录，并能解析其中的 JSONL 成员，那么后续 EDA、验证和 baseline 可以共用同一套数据入口。

## 方法设计

```text
Kaggle dataset archive
  -> data/raw/
  -> inspect zip members
  -> parse a small JSONL sample
  -> confirm session/events schema
```

## 输入

| 输入 | 版本/路径 | 备注 |
| :-- | :-- | :-- |
| Kaggle dataset | `otto/recsys-dataset` | 官方公开数据源 |
| Raw directory | `data/raw/` | 本地目录，不进入 git |
| Config | `configs/experiment/E000_smoke_download.yaml` | 冒烟检查配置 |

## 命令

```bash
kaggle datasets download -d otto/recsys-dataset -p data/raw
```

## 输出

| 输出 | 结果 |
| :-- | :-- |
| Download status | 已完成 |
| JSONL parse check | 已完成 |
| Schema check | `session -> events[] -> aid, ts, type` |

## 结论

数据访问路径可用。下一步应将完整原始压缩包登记为 `D000_kaggle_official_raw`，再把 raw JSONL 转成事件级 parquet，用于 EDA、validation 和 baseline experiments。
