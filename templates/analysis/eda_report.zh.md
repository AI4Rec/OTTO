# <ANALYSIS_ID> EDA 报告

## 摘要

| 项目 | 内容 |
| :-- | :-- |
| 数据版本 |  |
| 分析范围 |  |
| 主要结论 |  |
| 建模影响 |  |
| 下一步实验 |  |

## 问题清单

- 下游代码应依赖哪些字段口径？
- 全量与抽样数据规模分别是多少？
- 哪些分布会影响验证、候选和特征？
- 哪些数据质量风险需要显式检查？
- 哪些洞察能映射到具体实验？

## 字段口径

| 字段 | 粒度 | 类型 | 含义 | 合法取值 | 下游用途 |
| :-- | :-- | :-- | :-- | :-- | :-- |
| `session` | session |  |  |  |  |
| `events` | session |  |  |  |  |
| `aid` | event |  |  |  |  |
| `ts` | event |  |  |  |  |
| `type` | event |  |  |  |  |

## 数据规模

| Split | Sessions | Events | Unique aids | 时间范围 | 备注 |
| :-- | --: | --: | --: | :-- | :-- |
| train |  |  |  |  |  |
| test |  |  |  |  |  |

## 分布表

### Session Length

| Split | Mean | p50 | p75 | p90 | p95 | p99 | Max |
| :-- | --: | --: | --: | --: | --: | --: | --: |
| train |  |  |  |  |  |  |  |
| test |  |  |  |  |  |  |  |

### 行为类型

| Split | Clicks | Carts | Orders | Click ratio | Cart ratio | Order ratio |
| :-- | --: | --: | --: | --: | --: | --: |
| train |  |  |  |  |  |  |
| test |  |  |  |  |  |  |

### Item Popularity

| 指标 | 数值 | 解读 |
| :-- | --: | :-- |
| unique_aids |  |  |
| top_1_share |  |  |
| top_100_share |  |  |
| long_tail_share |  |  |

## 图表

| 图表 | 文件 | 回答的问题 | 状态 |
| :-- | :-- | :-- | :-- |
| Session length histogram | `reports/figures/<name>.png` |  |  |
| Event type share | `reports/figures/<name>.png` |  |  |
| Item popularity log-log plot | `reports/figures/<name>.png` |  |  |
| Time trend | `reports/figures/<name>.png` |  |  |

## 数据质量

| 检查项 | 结果 | 严重程度 | 后续动作 |
| :-- | :-- | :-- | :-- |
| 缺失字段 |  |  |  |
| 未知行为类型 |  |  |  |
| 时间顺序异常 |  |  |  |
| 重复事件 |  |  |  |
| 极端 session |  |  |  |

## 洞察

| 洞察 | 证据 | 建模假设 | 实验 |
| :-- | :-- | :-- | :-- |
|  |  |  |  |

## 决策

| 决策 | 原因 | 影响组件 |
| :-- | :-- | :-- |
|  |  |  |
