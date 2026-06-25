# 验证体系

## 目标

本地验证要模拟比赛设定：给定 session 前缀，预测未来的 `clicks`、`carts`、`orders`。OTTO 具有明显时间结构，train/test 又是前后相邻的时间窗口，因此随机切分不适合作为主验证方案。

## 切分方案

```text
原始训练会话
  -> 按时间排序或筛选
  -> 选择最近一段作为 validation window
  -> 将每个 session 切成 input prefix 与 future labels
  -> 评估 clicks/carts/orders 的 top-20 预测
```

EDA 支持这个设计：

- train 与 test 是时间相邻窗口。
- full train 覆盖 2022-07-31 至 2022-08-28；test 覆盖 2022-08-28 至 2022-09-04。
- train/test top100 item Jaccard 只有 0.3072，说明热门 item 会漂移。
- 随机切分会混合未来热度，容易高估泛化能力。

## 验证产物

| 产物 | 说明 | 状态 |
| :-- | :-- | :-- |
| `V000_time_split` | 按时间切分的验证集定义 | 计划中 |
| `labels.parquet` | 按 session 和 target 聚合的未来标签 | 计划中 |
| `valid_input.parquet` | 截断后的 session 输入事件 | 计划中 |
| `metric.py` | weighted Recall@20 实现 | 计划中 |
| `metric_sanity.md` | 手工可检查的指标样例 | 计划中 |

## 指标口径

单个 target：

```text
recall@20 = hits(predicted_top_20, true_items) / min(20, number_of_true_items)
```

最终分数：

```text
0.10 * clicks + 0.30 * carts + 0.60 * orders
```

## 泄漏检查

| 风险 | 检查方式 |
| :-- | :-- |
| input 中混入未来事件 | 确保所有 input timestamp 都早于 label timestamp。 |
| 随机切分 session | 默认只使用时间切分协议。 |
| 假设 test label | 不从公开 test split 中推导标签。 |
| 重复预测 | 指标计算前对候选 item 去重。 |
| target 间泄漏 | `clicks`、`carts`、`orders` 分开评估。 |

## 必要诊断

| 诊断 | 作用 |
| :-- | :-- |
| 指标手工样例 | 防止 weighted Recall@20 实现静默出错。 |
| 按 session 长度分桶得分 | test session 显著短于 train。 |
| 按 target 分解得分 | orders 稀疏但权重最高。 |
| ranking 前的 candidate recall | 区分召回瓶颈和排序瓶颈。 |
| recent popularity vs global popularity | 衡量热门 item 漂移影响。 |
