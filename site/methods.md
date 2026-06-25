# 方法路线

## 系统架构

```text
Raw session events
  -> event-level table
  -> validation split
  -> candidate generation
       - session history
       - global popularity
       - recent popularity
       - co-visitation
       - target-specific candidate pools
  -> feature construction
       - session features
       - item features
       - session-item features
       - candidate-source features
  -> target-specific ranking
  -> top-20 submission
```

## 基线层

| 方法 | 描述 | 预期价值 |
| :-- | :-- | :-- |
| Global popularity | 推荐全局高频 item | 短 session 的稳健 fallback |
| Type-specific popularity | 分别统计 click/cart/order 热门 item | 与不同 target 更对齐 |
| Session history | 推荐 session 内最近交互过的 item | 强 session continuation 信号 |
| Weighted session history | 按 recency 和 event type 加权 | 更适合 order-sensitive 排序 |

EDA 驱动的补充：

- `clicks`、`carts`、`orders` 应分别维护 fallback list，因为热门 item 不同。
- 指标需要按 session length 分桶，因为 test 明显短于 train。
- orders 路径需要额外加强，重点利用 late-session events 与 cart-to-order transitions。

## 候选召回

候选生成需要先按 target 评估 recall coverage，再进入排序阶段。

| 候选来源 | 思路 | 计划诊断 |
| :-- | :-- | :-- |
| Session history | 按时间倒序取 session 内已见 item | 按 session length 看 coverage |
| Recent popularity | 使用验证或测试窗口附近的热门 item | 对比 recent 与 global popularity |
| Click-click co-visitation | 同一 session 中共同浏览的 item | clicks target recall |
| Cart/order co-visitation | 共同加购或购买的 item | carts/orders target recall |
| Mixed target pool | 每个 target 使用不同候选源比例 | weighted recall contribution |

EDA 优先支持的共现矩阵：

| 矩阵 | 动机 | target |
| :-- | :-- | :-- |
| click -> click | 大多数转移是 click continuation | clicks |
| click -> cart | 约 8-9% 的 click transition 进入 cart | carts |
| cart -> order | 约 9-10% 的 cart transition 进入 order | orders |
| order -> order | order 之后继续 order 的概率较高 | orders |

## 排序层

当 candidate recall 足够后，可以使用 LightGBM 或 XGBoost 这类 GBDT 模型做 reranking。

特征分组：

| 分组 | 示例 |
| :-- | :-- |
| Session features | 长度、unique item 数、重复 item 比例、last event type |
| Item features | 全局热度、近期热度、cart/order ratio |
| Session-item features | last seen position、session 内出现次数、max event type weight |
| Candidate-source features | source id、source rank、source count |
| Time features | recency、time gap、window-specific counts |

高优先级 EDA 特征：

| 特征 | 理由 |
| :-- | :-- |
| `session_len`, `unique_aid_count` | test session 短，需要不同 fallback 行为。 |
| `aid_count_in_session` | repeated-aid session 很常见。 |
| `last_seen_rank`, `relative_position` | orders 集中在 session 后段。 |
| `last_event_type` | last cart/order 是意图信号。 |
| `target_popularity_rank` | 不同 target 的热门 item 不同。 |
| `source_count`, `best_source_rank` | 多候选源一致性可提升 reranking。 |

## 消融策略

每个方法都要回答：

- 哪个 target 提升了？
- 增益来自 candidate recall 还是 ranking？
- 新方法增加了多少运行时间、内存和存储？
- 方法更适合短 session、长 session，还是两者都有效？
- 本地验证是否稳定提升？

## 高分方案研读清单

| 来源 | 需要提取的内容 | 计划产物 |
| :-- | :-- | :-- |
| Kaggle top solutions | 候选生成、共现变体、ranker features | 方法图谱 |
| 公开验证讨论 | 时间切分与 leaderboard 相关性 | 验证报告 |
| OTTO 数据说明 | 数据发布背景与 schema 细节 | 数据卡片 |
