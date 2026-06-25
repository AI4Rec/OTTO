# 实验版本规范

## 目标

每个正式实验都应能从四类信息追溯：

1. 代码版本。
2. 数据集与 split 版本。
3. 配置文件。
4. 指标、产物和结论。

## 仓库结构

```text
configs/
  data/
  experiment/
  recall/
  ranker/
experiments/
registry/
reports/
src/
```

本地生成文件遵循以下结构，并保持在 git 之外：

```text
data/raw/
data/parquet/
data/splits/
data/labels/
outputs/experiments/
outputs/submissions/
logs/
```

## 实验 ID 规则

| 前缀 | 含义 |
| :-- | :-- |
| `D000_*` | dataset version 或 derived data artifact |
| `A000_*` | analysis 与 EDA |
| `V000_*` | validation split 与 metric |
| `B000_*` | baseline |
| `C000_*` | candidate generation 与 recall |
| `F000_*` | features |
| `R000_*` | ranking |
| `S000_*` | submission |

示例：

```text
V000_time_split
B000_popularity_baseline
B001_session_history_baseline
C000_covisit_baseline
R000_lgbm_ranker
```

## 必需文件

每个正式实验应包含：

```text
configs/experiment/<EXPERIMENT_ID>.yaml
experiments/<EXPERIMENT_ID>.md
registry/experiments.tsv entry
outputs/experiments/<EXPERIMENT_ID>/ local run directory
```

## 配置要求

配置文件应包含：

- Experiment ID。
- Dataset version。
- Split version。
- 输入产物路径。
- 方法参数。
- 需要时记录 random seed。
- 输出目录。
- 需要计算的指标。

配置文件不得包含凭证、私有机器信息或基础设施绝对路径。

## 实验卡片要求

每张实验卡片应记录：

- 假设。
- 方法设计。
- 输入与配置。
- 精确命令。
- 输出产物。
- 指标。
- 诊断。
- 决策。
- 后续动作。

## Registry 字段

`registry/experiments.tsv` 应包含：

```text
experiment_id
stage
status
config_path
card_path
output
best_metric
created_at
notes
```

registry 是索引，不替代实验卡片。
