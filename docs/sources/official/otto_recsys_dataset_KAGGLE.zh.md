# OTTO 推荐系统竞赛

本文档说明如何在 [Kaggle 竞赛](https://www.kaggle.com/competitions/otto-recommender-system) 的背景下使用 OTTO 数据集。该竞赛已于 2023 年结束，主题是基于会话的多目标推荐，参赛者需要预测用户点击、加购和下单行为。

## 提交格式

对于测试集中的每个 `session` id 和 `type` 组合，你必须在 `label` 列中预测 `aid` 值，多个值用空格分隔。每一行最多可以预测 20 个 `aid` 值。文件应包含表头，并采用如下格式：

```CSV
session_type,labels
42_clicks,0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19
42_carts,0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19
42_orders,0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19
```

## 安装

要运行我们的脚本，你需要安装 [Python 3](https://www.python.org/downloads/) 和 [Pipenv](https://pipenv.pypa.io/en/latest/)。然后可使用以下命令安装依赖：

```bash
pipenv sync
```

## 评估

提交结果会分别按每种行为 `type` 的 [Recall](https://en.wikipedia.org/wiki/Evaluation_measures_(information_retrieval)#Recall)@20 进行评估，并对三个召回率做加权平均：

$$
score = 0.10 \cdot R_{clicks} + 0.30 \cdot R_{carts} + 0.60 \cdot R_{orders}
$$

其中 $R$ 定义为：

$$
R_{type} = \frac{ \sum\limits_{i=1}^N | \\\{ \text{predicted aids} \\\}\_{i, type} \cap \\\{ \text{ground truth aids} \\\}\_{i, type} | }{ \sum\limits_{i=1}^N \min{( 20, | \\\{ \text{ground truth aids} \\\}_{i, type} | )}}
$$

这里 $N$ 是测试集中的会话总数，$\text{predicted aids}$ 是每个 session-type 的预测结果，例如提交文件中的每一行，并且会在前 20 个预测之后截断。

对于测试数据中的每个 `session`，你的任务是预测在该测试会话最后一个时间戳 `ts` 之后发生的每种 `type` 对应的 `aid` 值。换言之，测试数据包含按时间戳截断后的会话，你需要预测截断点之后发生的行为。

对于 `clicks`，每个会话只有一个真实标签，即会话中下一次被点击的 `aid`，不过你仍然可以最多预测 20 个 `aid` 值。`carts` 和 `orders` 的真实标签分别包含该会话后续被加入购物车和被下单的所有 `aid` 值。

<img src=".readme/ground_truth.png" width="100%">

<details>
  <summary><strong>点击此处查看上方已标注会话对应的 <code>JSON</code></strong></summary>

```JSON
[
    {
        "aid": 0,
        "ts": 1661200010000,
        "type": "clicks",
        "labels": {
            "clicks": 1,
            "carts": [2, 3],
            "orders": [2, 3]
        }
    },
    {
        "aid": 1,
        "ts": 1661200020000,
        "type": "clicks",
        "labels": {
            "clicks": 2,
            "carts": [2, 3],
            "orders": [2, 3]
        }
    },
    {
        "aid": 2,
        "ts": 1661200030000,
        "type": "clicks",
        "labels": {
            "clicks": 3,
            "carts": [2, 3],
            "orders": [2, 3]
        }
    },
    {
        "aid": 2,
        "ts": 1661200040000,
        "type": "carts",
        "labels": {
            "clicks": 3,
            "carts": [3],
            "orders": [2, 3]
        }
    },
    {
        "aid": 3,
        "ts": 1661200050000,
        "type": "clicks",
        "labels": {
            "clicks": 4,
            "carts": [3],
            "orders": [2, 3]
        }
    },
    {
        "aid": 3,
        "ts": 1661200060000,
        "type": "carts",
        "labels": {
            "clicks": 4,
            "orders": [2, 3]
        }
    },
    {
        "aid": 4,
        "ts": 1661200070000,
        "type": "clicks",
        "labels": {
            "orders": [2, 3]
        }
    },
    {
        "aid": 2,
        "ts": 1661200080000,
        "type": "orders",
        "labels": {
            "orders": [3]
        }
    }
]
```

</details>

要从未标注会话生成这些标签，可以使用 [labels.py](src/labels.py) 中的 `ground_truth` 函数。

## 训练/测试划分

Kaggle [竞赛](https://www.kaggle.com/competitions/otto-recommender-system) 结束后，最终测试集已经发布。你可以在[这里](https://www.kaggle.com/datasets/otto/recsys-dataset)访问完整数据集。竞赛参与者可以从训练会话中创建自己的截断测试集，用于离线评估模型。为此，我们提供了一个名为 `testset.py` 的 Python 脚本：

```Shell
pipenv run python -m src.testset --train-set train.jsonl --days 2 --output-path 'out/' --seed 42 
```

## 指标计算

你可以使用 `evaluate.py` 脚本计算每种行为类型的 Recall@20，以及提交结果的加权平均 Recall@20：

```Shell
pipenv run python -m src.evaluate --test-labels test_labels.jsonl --predictions predictions.csv
```

## FAQ

### 是否允许在截断后的测试会话上训练？

- 是的，在竞赛范围内，你可以使用我们提供的所有数据。

### 如果真实标签超过 20 个，Recall@20 如何计算？

- 如果你在真实标签中正确预测出 20 个物品，得分仍为 1.0。

### 在哪里可以找到物品和用户元数据？

- 该数据集有意只包含匿名化 ID。考虑到数据集本身已经很大，我们刻意没有纳入内容特征，以便让数据更易管理，并聚焦于解决多目标问题的协同过滤技术。
