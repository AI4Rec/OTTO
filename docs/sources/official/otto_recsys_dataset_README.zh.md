<div align="center">

# OTTO 推荐系统数据集

[![GitHub stars](https://img.shields.io/github/stars/otto-de/recsys-dataset.svg?style=for-the-badge&color=yellow)](https://github.com/otto-de/recsys-dataset)
[![Test suite](https://img.shields.io/github/actions/workflow/status/otto-de/recsys-dataset/test.yml?branch=main&style=for-the-badge)](https://github.com/otto-de/recsys-dataset/actions/workflows/test.yml)
[![Kaggle competition](https://img.shields.io/badge/kaggle-competition-20BEFF?style=for-the-badge&logo=kaggle)](https://www.kaggle.com/competitions/otto-recommender-system)
[![OTTO jobs](https://img.shields.io/badge/otto-jobs-F00020?style=for-the-badge&logo=otto)](https://www.otto.de/jobs/technology/ueberblick/)

**一个面向基于会话推荐系统研究的真实世界电商数据集。**

<img src=".readme/header.png" width="100%">

---
<p align="center">
  <a href="#获取数据">获取数据</a> •
  <a href="#数据格式">数据格式</a> •
  <a href="#安装">安装</a> •
  <a href="#评估">评估</a> •
  <a href="#faq">FAQ</a> •
  <a href="#许可证">许可证</a>
</p>

</div>

`OTTO` 会话数据集是一个大规模、工业级数据集，旨在弥合学术研究与真实世界应用在基于会话和序列推荐方面的差距。它包含来自 [OTTO](https://otto.de) 网店和应用的匿名化行为日志，支持多目标任务（预测点击、加购和下单）以及单目标任务。该数据集提供开箱即用的数据格式、清晰的评估指标，并聚焦于真实、可扩展的研究场景，旨在推动推荐系统社区的创新，也曾用于我们的 [Kaggle 竞赛](https://www.kaggle.com/competitions/otto-recommender-system)。

## 主要特性

- 1200 万个真实世界匿名化用户会话
- 2.2 亿个事件，包括 `clicks`、`carts` 和 `orders`
- 商品目录中有 180 万个唯一商品
- 提供可直接使用的 `.jsonl` 格式数据
- 提供单目标和多目标任务的评估指标

## 数据集统计

| 数据集 |  #sessions |    #items |     #events |     #clicks |     #carts |   #orders | Density [%] |
| :------ | ---------: | --------: | ----------: | ----------: | ---------: | --------: | ----------: |
| Train   | 12.899.779 | 1.855.603 | 216.716.096 | 194.720.954 | 16.896.191 | 5.098.951 |      0.0005 |
| Test    |  1.671.803 | 1.019.357 |  13.851.293 |  12.340.303 |  1.155.698 |   355.292 |      0.0005 |

|                           |  mean |   std |  min |  50% |  75% |  90% |  95% |  max |
| :------------------------ | ----: | ----: | ---: | ---: | ---: | ---: | ---: | ---: |
| Train 每会话事件数 | 16.80 | 33.58 |    2 |    6 |   15 |   39 |   68 |  500 |
| Test 每会话事件数  |  8.29 | 13.74 |    2 |    4 |    8 |   18 |   28 |  498 |

<details>
    <summary><strong>每会话事件数直方图（第 90 百分位）</strong></summary>
    <img src=".readme/events_per_session_p90.svg" width="800px">
</details>

|                        |   mean |    std |  min |  50% |  75% |  90% |  95% |    max |
| :--------------------- | -----: | -----: | ---: | ---: | ---: | ---: | ---: | -----: |
| Train 每物品事件数 | 116.79 | 728.85 |    3 |   20 |   56 |  183 |  398 | 129004 |
| Test 每物品事件数  |  13.59 |  70.48 |    1 |    3 |    9 |   24 |   46 |  17068 |

<details>
    <summary><strong>每物品事件数直方图（第 90 百分位）</strong></summary>
    <img src=".readme/events_per_item_p90.svg" width="800px">
</details>

## 获取数据

数据存储在 [Kaggle](https://www.kaggle.com/competitions/otto-recommender-system/data) 平台，可以使用其 API 下载：

```Shell
kaggle datasets download -d otto/recsys-dataset
```

## 数据格式

会话以 `JSON` 对象存储，包含唯一的 `session` ID 和一个 `events` 列表：

```JSON
{
    "session": 42,
    "events": [
        { "aid": 0, "ts": 1661200010000, "type": "clicks" },
        { "aid": 1, "ts": 1661200020000, "type": "clicks" },
        { "aid": 2, "ts": 1661200030000, "type": "clicks" },
        { "aid": 2, "ts": 1661200040000, "type": "carts"  },
        { "aid": 3, "ts": 1661200050000, "type": "clicks" },
        { "aid": 3, "ts": 1661200060000, "type": "carts"  },
        { "aid": 4, "ts": 1661200070000, "type": "clicks" },
        { "aid": 2, "ts": 1661200080000, "type": "orders" },
        { "aid": 3, "ts": 1661200080000, "type": "orders" }
    ]
}
```

- `session` - 唯一会话 ID
- `events` - 会话中按时间排序的事件序列
  - `aid` - 相关事件对应的商品 ID（产品代码）
  - `ts` - 事件的 Unix 时间戳
  - `type` - 事件类型，即商品是在会话中被点击、加入购物车，还是被下单

## 训练/测试划分

为了评估模型预测未来行为的能力，也就是模型部署到真实网店所需的能力，我们使用基于时间的验证划分。训练集包含 4 周时间范围内的用户会话，测试集包含随后一周的会话。为了防止信息泄漏，任何与测试时间段重叠的训练会话都经过裁剪，确保过去数据和未来数据之间有明确分离。下图展示了这一过程：

<div align="center">
  <img src=".readme/train_test_split.png" width="100%">
</div>

## 评估指标

为了确保研究相关性和工业适用性，我们提供了与真实世界表现高度相关的标准化评估协议。为了进行一致且可靠的基准测试，我们强烈建议：

- **使用提供的训练/测试划分**，确保能够与其他研究结果直接比较，并且评估时不遗漏任何物品或会话
- 在**完整测试序列**上评估，不进行截断
- 评估期间**绝不要使用采样**，因为这会导致误导性结果（[详见此处](https://dl.acm.org/doi/10.1145/3394486.3403226)）

### 单目标评估

对于点击预测任务，我们推荐使用 **Recall@20**（首选）和 **MRR@20**。在我们的生产系统中，这些指标与业务影响指标表现出很强相关性，这一点已在我们的[研究论文](https://arxiv.org/abs/2307.14906)中得到验证。

| Model | Recall@20 | MRR@20 | Epochs/h |
|---------------|-------|--------|----------|
| [GRU4Rec⁺](https://arxiv.org/abs/1706.03847) | 0.443 | 0.205 | 0.019 |
| [SASRec](https://arxiv.org/abs/1808.09781) | 0.307 | 0.180 | **0.248** |
| [TRON](https://arxiv.org/abs/2307.14906) | **0.472** | **0.219** | 0.227 |

### 多目标评估

对于预测多种用户行为的模型，我们提供两种方法：

1. **联合召回指标**：为我们的 [Kaggle 竞赛](https://www.kaggle.com/competitions/otto-recommender-system) 开发，该指标将点击、加购和下单的召回分数整合为一个综合指标
2. **MultiTRON**：一种同时优化点击和下单的方法，能够评估不同偏好权衡，详见我们的[研究论文](https://arxiv.org/abs/2407.16828)

请注意，多目标推荐评估仍是一个活跃研究领域，尚无最终确定的基准。我们欢迎更多研究和贡献，以改进这些复杂场景下的评估方法。

## Kaggle 竞赛

有关竞赛的详细使用说明和评估指南，请参阅 [KAGGLE.md](KAGGLE.md) 文件。

## FAQ

### 用户 `session` 是如何定义的？

- 一个会话指单个用户在训练集或测试集中的所有活动。

### 训练数据和测试数据中是否有相同用户？

- 没有，训练用户和测试用户完全不相交。

### 所有测试 `aids` 是否都包含在训练集中？

- 是的，所有测试物品也都包含在训练集中。

### 一个会话为什么会以订单或购物车事件开头？

- 如果被下单的商品在数据抽取周期开始前已经在顾客购物车中，就可能发生这种情况。类似地，我们商店中的愿望清单也可能导致没有前置点击的加购行为。

### `aids` 是否与 [otto.de](otto.de) 上的商品编号相同？

- 不是，所有商品 ID 和会话 ID 都经过匿名化。

### 大部分点击是否由我们当前的推荐生成？

- 不是，我们当前的推荐只生成了数据集中约 20% 的商品页浏览。大多数用户是通过搜索结果和商品列表进入商品页的。

## 许可证

OTTO 数据集基于 [CC-BY 4.0 License](https://creativecommons.org/licenses/by/4.0/) 发布，代码则基于 [MIT License](LICENSE) 授权。

## 引用

BibTeX 条目：

```BibTeX
@online{philipp_normann_sophie_baumeister_timo_wilm_2023,
 title={OTTO Recommender Systems Dataset: A real-world e-commerce dataset for session-based recommender systems research},
 url={https://www.kaggle.com/dsv/4991874},
 doi={10.34740/KAGGLE/DSV/4991874},
 publisher={Kaggle},
 author={Philipp Normann and Sophie Baumeister and Timo Wilm},
 year={2023}
}
```
