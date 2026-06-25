# 任务与指标

## 任务定义

OTTO 是一个 session-based recommendation 任务。每条输入是一个用户 session，session 内部是一串按时间排序的事件。每个事件包含：

```text
aid: item id
ts: 毫秒级时间戳
type: clicks | carts | orders
```

对每个 test session，系统需要分别为三个目标预测最多 20 个候选商品：

```text
<session>_clicks
<session>_carts
<session>_orders
```

## 评价指标

官方指标是 weighted Recall@20：

```text
score = 0.10 * recall_clicks@20
      + 0.30 * recall_carts@20
      + 0.60 * recall_orders@20
```

这带来一个核心张力：

| 目标 | 事件频率 | 指标权重 | 建模含义 |
| :-- | :-- | --: | :-- |
| clicks | 高 | 0.10 | 代表 session 延续和短期兴趣，但单项权重低。 |
| carts | 中 | 0.30 | 连接浏览意图和购买意图，是重要过渡行为。 |
| orders | 低 | 0.60 | 对最终分数影响最大，需要单独召回和排序。 |

## 系统视角

这个任务天然适合拆成两阶段推荐系统：

```text
Session events
  -> candidate generation
  -> feature construction
  -> target-specific ranking
  -> top-20 predictions for clicks/carts/orders
```

## 设计约束

- 验证集切分必须尊重时间顺序。
- 每个 target 最多只能提交 20 个 item，候选召回质量非常关键。
- 最近 session 行为是强基线信号。
- orders 不能被当作 clicks 预测的附属结果处理。
- 候选池和排序头应尽量按 `clicks`、`carts`、`orders` 分目标设计。

## 资料来源

- Kaggle competition：`otto-recommender-system`
- Kaggle dataset：`otto/recsys-dataset`
- OTTO RecSys Challenge 公开数据说明
