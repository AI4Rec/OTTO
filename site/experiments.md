# 实验看板

## 实验总表

实验看板用于记录假设、设计选择、指标和决策。每一行都应对应 `experiments/` 下的一张实验卡片。

| ID | 阶段 | 假设 | 主指标 | 状态 | 决策 |
| :-- | :-- | :-- | :-- | :-- | :-- |
| E000_smoke_download | 数据访问 | Kaggle source 能按标准数据目录下载并解析 | download_ok | 已完成 | 保留为环境检查 |
| A000_full_eda | 分析 | 全量分布能暴露验证、候选和特征优先级 | EDA artifacts | 已完成 | 用于驱动 `V000`、`B000`、`B001`、`C000` |
| V000_time_split | 验证 | 时间切分比随机切分更接近 test 预测设定 | metric_sanity | 计划中 | 待执行 |
| B000_popularity_baseline | 基线 | 全局与 target-specific popularity 能提供稳健 fallback | weighted_recall@20 | 计划中 | 待执行 |
| B001_session_history_baseline | 基线 | recent session items 是所有 target 的强候选 | weighted_recall@20 | 计划中 | 待执行 |
| C000_covisit_baseline | 候选 | item-item co-visitation 能提升 candidate recall，尤其 carts/orders | candidate_recall@K | 计划中 | 待执行 |

## 基线指标表

| 实验 | clicks@20 | carts@20 | orders@20 | weighted@20 | 备注 |
| :-- | --: | --: | --: | --: | :-- |
| B000_popularity_baseline | - | - | - | - | 计划中 |
| B001_session_history_baseline | - | - | - | - | 计划中 |
| C000_covisit_baseline | - | - | - | - | 计划中 |

## 实验卡片标准

每张实验卡片应包含：

| 区块 | 内容要求 |
| :-- | :-- |
| 假设 | 改动是什么，为什么可能提升 recall |
| 设计 | 方法、数据切分、候选/排序流程，必要时加图 |
| 输入 | dataset version、split version、config path |
| 命令 | 可复现命令或 notebook 入口 |
| 输出 | 指标、产物路径、图表 |
| 分析 | 哪个 target 提升，原因是什么 |
| 决策 | 采用、拒绝、延后 |

## 计划图表

| 图表 | 使用场景 | 状态 |
| :-- | :-- | :-- |
| Baseline flow | `B000`、`B001` | 计划中 |
| Time split flow | `V000` | 计划中 |
| Candidate-generation architecture | `C000` | 计划中 |
| Ranking feature pipeline | ranker experiments | 计划中 |
