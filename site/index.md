# OTTO 推荐系统复盘

本知识库记录 Kaggle OTTO Recommender System 竞赛的可复现复盘。组织方式按一个完整推荐系统项目展开：任务与指标、数据理解、验证体系、方法路线、实验迭代、工程规范和最终项目讲述。

## 一句话结论

OTTO 是一个会话级、多目标推荐任务。给定被截断的 session，需要分别预测未来的 `clicks`、`carts`、`orders`。官方指标是 weighted Recall@20，其中 `orders` 权重最高，因此项目不能只优化高频点击，还必须单独处理低频但高价值的购买行为。

第一轮全量 EDA 给出的关键信号：

| 发现 | 证据 | 建模影响 |
| :-- | :-- | :-- |
| train/test 使用同一套嵌套 session schema | `session -> events[] -> aid, ts, type` | 可以统一抽象成事件级表，支撑 EDA、验证和特征。 |
| test session 明显更短 | train 平均长度 16.80，test 平均长度 8.29 | 需要专门设计短 session 召回与 fallback。 |
| clicks 占大多数，orders 指标权重最高 | train clicks 占 89.85%，orders 占 2.35%；orders 权重 0.60 | 需要 target-specific 候选与排序策略。 |
| train/test 时间相邻 | test 紧接 train 之后开始 | 验证集必须按时间切分，不能随机切分。 |
| 重复交互很常见 | train 69.20%、test 63.61% 的 session 重复出现同一 `aid` | session history 应作为第一层基线候选。 |
| orders 更集中在 session 后段 | train 54.66%、test 73.75% 的 order 发生在 session 最后 30% | order 排序需要 recency 与相对位置特征。 |

## 项目路线

| 阶段 | 目标 | 状态 | 产物 |
| :-- | :-- | :--: | :-- |
| 任务定义 | 明确目标、指标和约束 | 已完成 | [任务与指标](task_metric.md) |
| 数据与 EDA | 建立字段口径、全量统计、图表和洞察 | 已完成 | [数据与 EDA](data_eda.md) |
| 验证体系 | 构建本地时间切分与标签 | 下一步 | [验证体系](validation.md) |
| 基线 | 实现 popularity 与 session-history 推荐 | 下一步 | [实验看板](experiments.md) |
| 候选召回 | 加入共现矩阵和 target-specific 候选池 | 计划中 | [方法路线](methods.md) |
| 排序 | 加入特征工程与 GBDT reranking | 计划中 | [方法路线](methods.md) |
| 项目讲述 | 汇总系统、指标、取舍和复盘 | 计划中 | [项目讲述](project_story.md) |

## 页面导航

- [任务与指标](task_metric.md)：任务定义、weighted Recall@20、建模约束。
- [数据与 EDA](data_eda.md)：字段口径、数据规模、质量检查、图表和实验洞察。
- [验证体系](validation.md)：时间切分、标签生成、指标检查和泄漏风险。
- [方法路线](methods.md)：基线、共现召回、候选生成、排序和消融路线。
- [实验看板](experiments.md)：实验设计、指标、结论与决策记录。
- [工程规范](engineering.md)：目录结构、可复现要求和公开发布检查。
- [项目讲述](project_story.md)：最终项目案例的讲述框架。
