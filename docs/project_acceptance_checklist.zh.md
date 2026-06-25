# 项目成熟度检查表

本检查表定义一个完整 OTTO 推荐系统复盘应包含的内容。

状态说明：

- `[x]` 已完成
- `[~]` 部分完成
- `[ ]` 待完成

| 模块 | 状态 | 标准 | 当前状态 |
| :-- | :--: | :-- | :-- |
| 任务定义 | `[~]` | 解释 session-based recommendation、三个 target 与 weighted Recall@20。 | 已在 `site/task_metric.md` 起草。 |
| 数据理解 | `[~]` | 记录字段口径、全量规模、分布、数据质量、图表和洞察。 | 已完成第一版全量 EDA 与图表。 |
| 验证体系 | `[ ]` | 实现 time split、labels、weighted Recall@20 和 metric sanity checks。 | 计划为 `V000_time_split`。 |
| 基线 | `[ ]` | 实现 popularity 与 session-history baselines，并汇报 target-level metrics。 | 计划为 `B000` 与 `B001`。 |
| 候选召回 | `[ ]` | 增加 co-visitation 与 target-specific candidate pools，并报告 coverage diagnostics。 | 计划中。 |
| 特征 | `[ ]` | 定义 session、item、session-item、time、candidate-source features。 | 方法路线已起草。 |
| 排序 | `[ ]` | 训练并评估 target-specific rankers。 | 计划中。 |
| 消融 | `[ ]` | 记录受控实验与决策。 | 实验看板已起草。 |
| 可复现性 | `[~]` | 使用 configs、registry、experiment cards 和 release checks。 | 公开工作区结构已建立。 |
| 最终报告 | `[ ]` | 总结架构、指标、取舍和复盘。 | 项目讲述模板已起草。 |

## 目标交付

1. 带生成图表和洞察映射的 EDA 页面。
2. 包含 split definition 与 metric sanity checks 的验证报告。
3. baseline scorecard。
4. candidate recall coverage table。
5. ranking feature 与 ablation table。
6. 最终架构图与项目讲述。
