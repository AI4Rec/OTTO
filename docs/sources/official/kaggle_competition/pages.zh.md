# OTTO Recommender System Kaggle 竞赛页面中文归档

原链接：[https://www.kaggle.com/competitions/otto-recommender-system](https://www.kaggle.com/competitions/otto-recommender-system)

拉取方式：

```bash
.venv-kaggle/bin/kaggle competitions pages otto-recommender-system --content --page-name <PAGE_NAME>
```

页面清单：

- [Description](https://www.kaggle.com/competitions/otto-recommender-system/overview/description)
- [Evaluation](https://www.kaggle.com/competitions/otto-recommender-system/overview/evaluation)
- [Data](https://www.kaggle.com/competitions/otto-recommender-system/data)
- [Timeline](https://www.kaggle.com/competitions/otto-recommender-system/overview/timeline)
- [Prizes](https://www.kaggle.com/competitions/otto-recommender-system/overview/prizes)
- [Rules](https://www.kaggle.com/competitions/otto-recommender-system/rules)

## Description：竞赛目标与背景

### 竞赛目标

本竞赛的目标是预测电商场景中的点击、加购和下单行为。参赛者需要基于用户会话中的历史事件，构建一个多目标推荐系统。

这项工作将帮助改善各方的购物体验。消费者会获得更贴合自身需求的推荐，在线零售商也可能提升销售额。

### 背景

在线购物者可以从大型零售商提供的数百万种商品中选择。尽管这种丰富性令人印象深刻，但过多的选择也可能让探索过程变得令人疲惫，最终导致购物者空手离开。这既不利于想要购买商品的消费者，也不利于错失销售机会的零售商。因此，在线零售商依赖推荐系统，引导购物者找到最符合其兴趣和动机的商品。通过数据科学增强零售商实时预测每位顾客在访问过程中的任一时刻真正想看、想加入购物车和想下单的商品的能力，有望改善你下一次在喜爱的零售商网站购物时的客户体验。

当前推荐系统由多种采用不同方法的模型组成，从简单的矩阵分解到 Transformer 类型的深度神经网络不等。然而，目前不存在一个能够同时优化多个目标的单一模型。在本竞赛中，你需要构建一个单一提交方案，基于同一会话内的历史事件预测点击率、加购率和转化率。

[OTTO](https://otto.de) 拥有来自 19,000 多个品牌的超过 1000 万件商品，是德国最大的在线商店。OTTO 是总部位于汉堡的跨国 Otto Group 成员，该集团旗下还包括 Crate & Barrel（美国）和 3 Suisses（法国）。

你的工作将帮助在线零售商从海量商品中选择更相关的物品，并基于顾客的实时行为进行推荐。改进推荐将让购物者在看似无尽的选择中导航时更加轻松、更具参与感。

## Evaluation：评估与提交格式

提交结果会分别按每种行为 `type` 的 [Recall](https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)#Recall)@20 进行评估，并对三个召回率做加权平均：

$$
score = 0.10 \cdot R\_{clicks} + 0.30 \cdot R\_{carts} + 0.60 \cdot R\_{orders}
$$

其中 \( R \) 定义为：

$$
R\_{type} = \frac{\sum\_{i}^{N} | \\{ \text{predicted aids} \\}\_{i, type} \cap \\{ \text{ground truth aids} \\}\_{i, type} | }{\sum\_{i}^{N} \min{\( 20, | \\{ \text{ground truth aids} \\}\_{i, type} | \)}}
$$

这里 \( N \) 是测试集中的会话总数，\( \text{predicted aids} \) 是每个 session-type 的预测结果，例如提交文件中的每一行，并且会在前 20 个预测之后截断。

对于测试数据中的每个 `session`，你的任务是预测在该测试会话最后一个时间戳 `ts` 之后发生的每种 `type` 对应的 `aid` 值。换言之，测试数据包含按时间戳截断后的会话，你需要预测截断点之后发生的行为。

对于 `clicks`，每个会话只有一个真实标签，即会话中下一次被点击的 `aid`，不过你仍然可以最多预测 20 个 `aid` 值。`carts` 和 `orders` 的真实标签分别包含该会话后续被加入购物车和被下单的所有 `aid` 值。

![Ground Truth](https://github.com/otto-de/recsys-dataset/blob/main/.readme/ground_truth.png?raw=true)

每个 `session` 和 `type` 的组合都应在提交文件中单独占据一行 `session_type`，预测值用空格分隔。

### 提交文件

对于测试集中的每个 `session` id 和 `type` 组合，你必须在 `label` 列中预测 `aid` 值，多个值用空格分隔。每一行最多可以预测 20 个 `aid` 值。文件应包含表头，并采用如下格式：

```csv
session_type,labels
12906577_clicks,135193 129431 119318 ...
12906577_carts,135193 129431 119318 ...
12906577_orders,135193 129431 119318 ...
12906578_clicks,135193 129431 119318 ...
etc.
```

## Data：数据说明

本竞赛的目标是预测电商点击、加购和下单。你将基于用户会话中的历史事件构建一个多目标推荐系统。

训练数据包含完整的电商 `session` 信息。对于测试数据中的每个 `session`，你的任务是预测在测试会话最后一个时间戳 `ts` 之后发生的每个会话 `type` 对应的 `aid` 值。换言之，测试数据包含按时间戳截断后的会话，你需要预测截断点之后发生的内容。

更多背景信息请参见已发布的 [OTTO Recommender Systems Dataset](https://github.com/otto-de/recsys-dataset) GitHub 仓库。

### 文件

- **train.jsonl**：训练数据，包含完整会话数据
  - `session`：唯一会话 ID
  - `events`：会话中按时间排序的事件序列
    - `aid`：相关事件对应的商品 ID（产品代码）
    - `ts`：事件的 Unix 时间戳
    - `type`：事件类型，即商品是在会话中被点击、加入购物车，还是被下单
- **test.jsonl**：测试数据，包含截断后的会话数据
  - 你的任务是预测会话截断后下一个被点击的 `aid`，以及后续加入 `carts` 和 `orders` 的剩余 `aid`；每个会话 `type` 最多可以预测 20 个值
- **sample_submission.csv**：符合正确格式的提交示例文件

## Timeline：时间线

- **2022 年 11 月 1 日**：开始日期。
- **2023 年 1 月 24 日**：参赛截止日期。必须在该日期前接受竞赛规则，才能参加竞赛。
- **2023 年 1 月 24 日**：团队合并截止日期。这是参赛者加入或合并团队的最后一天。
- **2023 年 1 月 31 日**：最终提交截止日期。

除非另有说明，所有截止时间均为对应日期的 UTC 时间晚上 11:59。竞赛组织者保留在认为必要时更新时间线的权利。

## Prizes：奖金

- 第一名：15,000 美元
- 第二名：10,000 美元
- 第三名：5,000 美元
