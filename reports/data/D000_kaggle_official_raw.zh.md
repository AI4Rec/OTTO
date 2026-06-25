# D000 Kaggle 官方 Raw 数据集卡

状态：available
一句话结论：Kaggle 官方 raw zip 包含完整 train/test JSONL，schema 一致，可作为后续 parquet、split、baseline 的父数据版本。
关键证据：`recsys-dataset.zip` 大小 2,127,848,819 bytes，zip 内 train/test 均可流式读取；train 12,899,779 sessions，test 1,671,803 sessions。
下一步：基于该版本生成 parquet，并建立时间切分与 labels。

## 基本信息

- 数据集 ID：D000_kaggle_official_raw
- 名称：OTTO RecSys Dataset raw JSONL zip
- 来源：Kaggle dataset `otto/recsys-dataset`
- 创建/下载日期：2026-06-24
- 验收日期：2026-06-25
- 状态：available

## 路径

| 类型 | 路径 | 说明 |
| :-- | :-- | :-- |
| raw | `data/raw/recsys-dataset.zip` | 官方完整 train/test JSONL 压缩包，本地文件不进入 git。 |
| raw smoke | `data/raw/otto-recsys-test.jsonl.zip` | 早期链路 smoke download 文件，本地文件不进入 git。 |
| parquet | `data/parquet/` | 待生成，本地文件不进入 git。 |
| split | `data/splits/` | 待生成，本地文件不进入 git。 |
| labels | `data/labels/` | 待生成，本地文件不进入 git。 |

## 文件校验

| 文件 | 压缩大小 | 解压后大小 | 行数/session 数 | 校验方式 | 结果 |
| :-- | --: | --: | --: | :-- | :-- |
| `recsys-dataset.zip` | 2,127,848,819 | - | - | `zipfile.ZipFile(...).infolist()` | 可打开，成员可读取。 |
| `otto-recsys-train.jsonl` | 2,000,011,111 | 11,307,535,945 | 12,899,779 | zip 内流式数行 | 通过。 |
| `otto-recsys-test.jsonl` | 127,837,364 | 750,426,722 | 1,671,803 | zip 内流式数行 | 通过。 |

补充说明：此前已对 `recsys-dataset.zip` 执行过 `testzip`，结果为 `None`。本次 EDA 为节省时间，主要采用成员读取、样本解析和全量数行验证。

## 字段字典

| 字段 | 类型 | 含义 | 样例 | 备注/风险 |
| :-- | :-- | :-- | :-- | :-- |
| `session` | integer | 会话 ID。train 与 test session id 连续衔接。 | `0` | 不代表用户长期身份，只代表匿名 session。 |
| `events` | list[object] | 当前 session 中按时间排序的行为事件。 | `[{"aid": ..., "ts": ..., "type": ...}]` | 事件数量长尾明显。 |
| `aid` | integer | 商品 ID / article id。 | `1460571` | 热度长尾强，适合 popularity 和 item-item 召回。 |
| `ts` | integer | 毫秒级 Unix timestamp。 | `1661724000278` | 后续切分必须按时间，避免泄漏。 |
| `type` | string | 行为类型。 | `clicks` / `carts` / `orders` | 三类目标权重不同，orders 权重最高。 |

## 数据接口

原始 JSONL 每行是一条 session：

```text
session -> events[]
event -> aid, ts, type
```

推荐下游统一展开为 event-level 表：

```text
session: int64
aid: int64
ts: int64
type: categorical/string
event_idx: int32
```

session-level 任务输入仍需保留原始顺序，用于 recent/history/co-visitation 特征。

## 全量规模

| split | sessions | first_session | last_session | 时间范围 |
| :-- | --: | --: | --: | :-- |
| train | 12,899,779 | 0 | 12,899,778 | 2022-07-31 22:00:00 UTC 至 2022-08-28 21:59:59 UTC。 |
| test | 1,671,803 | 12,899,779 | 14,571,581 | 2022-08-28 22:00:00 UTC 至 2022-09-04 21:59:58 UTC。 |

## 样本统计

样本方式：从 train/test 各流式读取前 100,000 个 session。

| split | sample_sessions | events | unique_aids | avg_session_len | p50 | p90 | p99 | max |
| :-- | --: | --: | --: | --: | --: | --: | --: | --: |
| train | 100,000 | 5,227,653 | 663,079 | 52.2765 | 19 | 152 | 362 | 495 |
| test | 100,000 | 968,596 | 257,143 | 9.6860 | 4 | 21 | 80 | 485 |

## 数据质量

| 检查项 | train 前 100k | test 前 100k | 说明 |
| :-- | --: | --: | :-- |
| 缺 top-level key | 0 | 0 | 均包含 `session/events`。 |
| 缺 event key | 0 | 0 | 均包含 `aid/ts/type`。 |
| 未知 type | 0 | 0 | 样本中只出现 `clicks/carts/orders`。 |
| 时间乱序事件 | 0 | 0 | 样本中 session 内事件按 `ts` 非降序。 |
| 重复事件 | 5,541 | 2,147 | 存在完全相同 `(aid, ts, type)` 重复，后续需决定是否保留。 |

## 建模风险

- train/test 时间相邻，验证集应按时间切分，不能随机切。
- test session 明显更短，线上预测更偏向短上下文补全。
- clicks 占绝对多数，但评价权重更偏向 orders，不能只优化 clicks。
- session 内重复 `aid` 很常见，recent/repeated item 特征会很重要。
- item 热度长尾明显，热门兜底和 item-item 召回都应优先实现。

## 下游用途

- `P000_raw_to_parquet`：raw JSONL 转 event-level parquet。
- `V000_time_split`：构造本地时间验证集。
- `B000_popularity_baseline`：全局/分行为热门 baseline。
- `B001_session_history_baseline`：基于最近行为和重复行为的 baseline。
