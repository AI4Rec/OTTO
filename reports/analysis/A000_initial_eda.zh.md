# A000 全量 EDA 报告

## 摘要

本报告记录 Kaggle OTTO session 数据集的一次全量 EDA。分析覆盖完整 train/test JSONL 文件，生成公开 SVG 图表，并将数据观察转化为验证、候选召回和特征工程假设。

主要产物：

| 产物 | 路径 |
| :-- | :-- |
| 摘要 JSON | `reports/eda/full_eda_summary.json` |
| split summary 表 | `reports/eda/split_summary.csv` |
| top-aid 表 | `reports/eda/top_aids_by_split.csv` |
| 公开 EDA 页面 | `site/data_eda.md` |
| 图表 | `site/assets/figures/*.svg` |

## 数据范围

| split | sessions | events | unique aids | 时间范围 |
| :-- | --: | --: | --: | :-- |
| train | 12,899,779 | 216,716,096 | 1,855,603 | 2022-07-31 至 2022-08-28 UTC |
| test | 1,671,803 | 13,851,293 | 1,019,357 | 2022-08-28 至 2022-09-04 UTC |

## 字段口径

```text
session -> events[]
event -> aid, ts, type
```

推荐事件级表结构：

```text
session:int64, aid:int64, ts:int64, type:string, event_idx:int32
```

## 核心发现

| 发现 | 证据 | 工程影响 |
| :-- | :-- | :-- |
| test session 更短 | test 平均长度 8.29，train 平均长度 16.80 | 验证和基线指标应按 session length 分层 |
| 重复 item 行为常见 | 69.20% 的 train session、63.61% 的 test session 重复出现同一 aid | 加入 session-history candidates 与 count/recency features |
| orders 稀疏但重要 | full train order ratio 为 2.35%；metric order weight 为 0.60 | 建立 order-specific candidate sources 与 diagnostics |
| orders 偏向后段 | train 54.66%、test 73.75% 的 orders 出现在 session 最后 30% | 加入 relative-position 与 late-event weighting |
| 热门 item 漂移 | train/test top100 item Jaccard 为 0.3072 | 对比 global 与 recent-window popularity |
| test item 不是冷启动 | test 中 100% 的 aids 都在 train 出现过 | 优先利用 observed item graph 与 co-visitation |
| type transitions 不对称 | cart-to-order transition probability 约 9-10% | 构建 type-aware co-visitation matrices |

## 建模假设

| 假设 | 计划实验 |
| :-- | :-- |
| target-specific popularity 优于单一 global fallback | `B000_popularity_baseline` |
| recent unique session history 是强 baseline candidate source | `B001_session_history_baseline` |
| chronological validation 对 drift-sensitive 方法是必要的 | `V000_time_split` |
| click-to-cart 与 cart-to-order co-visitation 能提升 cart/order recall | `C000_covisit_baseline` |
| relative-position 与 last-event-type features 能提升 order ranking | `F000_session_item_features` |

## 图表清单

| 图表 | 用途 |
| :-- | :-- |
| `eda_session_length_hist.svg` | 对比 train/test session length distribution |
| `eda_event_type_mix.svg` | 展示 click/cart/order imbalance |
| `eda_session_signals.svg` | 对比 repeated-aid 与 cart/order session signals |
| `eda_daily_event_volume.svg` | 展示时间结构与 split boundary |
| `eda_item_popularity_loglog.svg` | 展示 item popularity long tail |
| `eda_type_transition_heatmap.svg` | 展示 event type transition |
| `eda_type_position_deciles.svg` | 展示不同行为类型在 session 内的位置 |

## 下一步

1. 构建 `V000_time_split`，并补齐 weighted Recall@20 sanity checks。
2. 实现 `B000_popularity_baseline`，包含 global、recent、target-specific 三种变体。
3. 实现 `B001_session_history_baseline`，并按 session length 汇报指标。
4. 基于 click-click、click-cart、cart-order transitions 构建第一版 co-visitation matrices。
