# OTTO 竞赛高分方案讨论帖中文归档

来源：Kaggle OTTO Recommender System 竞赛讨论区

说明：本文件整理并翻译高价值主帖内容，主要用于复现实验路线和理解竞赛方法。评论区未纳入。

## 1st place solution

原链接：[https://www.kaggle.com/competitions/otto-recommender-system/discussion/384022](https://www.kaggle.com/competitions/otto-recommender-system/discussion/384022)

发布时间：2023-02-06

非常感谢组织这场有趣的竞赛。这个问题设置与作者的实际工作相对接近，也因此学到了很多。

### 候选生成

平均候选数量约为 1200。

候选来源包括：

- 会话中访问过的 `aid`
- 共访矩阵
  - 使用多个版本，按行为类型和聚合时间段采用不同权重
  - 像 beam search 一样多次应用共访矩阵
- 预测后续 `aid` 的神经网络
  - 使用多个版本生成候选并提供重排特征
  - 网络结构为 MLP 或 Transformer，二者差异不大
  - 尝试关注那些预测不好的样本
  - 对 `x_aid` 和 `y_aid` 使用相同 embedding
  - 将未来多个 `aid` 作为正样本目标
  - 在计算 session embedding 时使用预测目标 `aid` 的类型信息，使 session embedding 随预测目标类型调整
  - 某些模型只使用未访问过的 `aid` 作为目标训练，以避免与基于重复访问的候选和特征信息重叠

原帖图片：

![candidate figure 1](https://www.googleapis.com/download/storage/v1/b/kaggle-forum-message-attachments/o/inbox%2F1019365%2Fb39461ef4b594a17799b4b06f1ae6fb2%2F2023-02-06%2017.12.38.png?generation=1675671185056988&alt=media)

![candidate figure 2](https://www.googleapis.com/download/storage/v1/b/kaggle-forum-message-attachments/o/inbox%2F1019365%2Faff8177d9e576a6e40a08ed9f80f2140%2F2023-02-06%2017.04.33.png?generation=1675670729353616&alt=media)

### 重排器

模型：

- 单个 `LGBMRanker`：LB 0.604
- 9 个不同超参数的 `LGBMRanker` 集成：LB 0.605
- 集成方式为对各 ranker 的预测分数取平均；作者未测试这种方式是否优于投票等方法

特征：

- session * aid
  - 候选生成阶段的共访矩阵排名
  - 候选生成阶段的 NN 余弦相似度
  - 会话中的 `aid` 信息，例如出现时间、类型等
- aid
  - `aid` 热度
  - 排名化后效果较好
  - 使用多个时间窗口计算
  - 行为类型比例
- session
  - 长度
  - `aid` 重复率
  - 最后一个 `aid` 与倒数第二个 `aid` 之间的时间差

总共创建约 200 个特征。为了减少内存使用，根据 LightGBM gain importance 为每个目标选择约 100 个特征。

负采样率：

- clicks：5%
- carts：25%
- orders：40%

这些值的设置是为了让训练数据能在作者机器上处理；每类目标的数据大小约为 35GB。

### CV 策略

作者沿用了 Radek 的设置：

[https://www.kaggle.com/competitions/otto-recommender-system/discussion/364991](https://www.kaggle.com/competitions/otto-recommender-system/discussion/364991)

本地验证和 LB 之间几乎可以得到完美相关性。为了快速迭代改进，作者使用 5% 数据训练，并用另外 10% 数据评估。

### 消融实验

消融实验基于本地验证进行。若信息同时参与候选生成和重排器特征，则会从两处同时移除。

| 条件 | clicks_recall@20 | carts_recall@20 | orders_recall@20 | weighted_recall@20 |
| :-- | --: | --: | --: | --: |
| my solution (LB604) | 0.556607 | 0.436375 | 0.669644 | 0.588359 |
| without visited aid | 0.555677 | 0.435616 | 0.666456 | 0.586126 |
| without covisitation | 0.547493 | 0.430180 | 0.665553 | 0.583136 |
| without nn | 0.544811 | 0.429904 | 0.666004 | 0.583055 |
| without aid feats | 0.550472 | 0.433442 | 0.666275 | 0.584845 |
| without session feats | 0.555922 | 0.435805 | 0.669734 | 0.588174 |
| only single nn | 0.532279 | 0.410148 | 0.564768 | 0.515133 |

## 2nd Place Solution (ONODERA part)

原链接：[https://www.kaggle.com/competitions/otto-recommender-system/discussion/382790](https://www.kaggle.com/competitions/otto-recommender-system/discussion/382790)

发布时间：2023-02-01

作者首先感谢主办方发起并组织这场优秀竞赛，并说明这里解释的是其本人负责的部分。

### 候选

当作者与队友组队时，队友已有比作者更强的候选，因此作者决定使用队友的候选。

### 特征

#### Item2item 特征

队友已有很好的特征，但协同过滤特征仍有改进空间。作者聚焦于 item2item 特征，包含：

- count
- time difference
- sequence difference（由队友提出）
- 上述特征的两种加权形式
- 上述特征的聚合

总计得到 93 个特征。之后通过不同组合，例如 click to order、cart to order 等，可以生成接近 5000 个特征；最终只使用约 400 到 500 个。

原帖图片：

![item2item features](https://www.googleapis.com/download/storage/v1/b/kaggle-forum-message-attachments/o/inbox%2F317344%2F209f3518a4ec064f4bbd8e3c0d1677d0%2F2023-02-17%205.10.31.png?generation=1676579857970702&alt=media)

#### 第一阶段预测特征

![first stage prediction features](https://www.googleapis.com/download/storage/v1/b/kaggle-forum-message-attachments/o/inbox%2F317344%2F6041fac8d79269776d88f8350774950a%2F2023-02-17%205.10.47.png?generation=1676579712049232&alt=media)

#### 伪事件特征

![pseudo event features](https://www.googleapis.com/download/storage/v1/b/kaggle-forum-message-attachments/o/inbox%2F317344%2Feac4b9290d28bf9725b59969745f0459%2F2023-02-17%205.11.11.png?generation=1676579770675159&alt=media)

### 模型

作者使用了 XGBoost 和 CatBoost。

![models](https://www.googleapis.com/download/storage/v1/b/kaggle-forum-message-attachments/o/inbox%2F317344%2Ffc93d88efbabc29bb619f7a8d5cd8858%2F2023-02-17%205.10.08.png?generation=1676579918058966&alt=media)

### Pipeline

第二阶段之后，团队按 rank 混合了多位队友的结果。

![pipeline](https://www.googleapis.com/download/storage/v1/b/kaggle-forum-message-attachments/o/inbox%2F317344%2F7c88b62d96eb550b66d392c4a9d46413%2F2023-02-03%209.07.35.png?generation=1675382887632198&alt=media)

队友方案链接：

[https://www.kaggle.com/competitions/otto-recommender-system/discussion/382839](https://www.kaggle.com/competitions/otto-recommender-system/discussion/382839)

![final blend](https://www.googleapis.com/download/storage/v1/b/kaggle-forum-message-attachments/o/inbox%2F317344%2Fb89de93b7508e672fc007b50232dea1f%2F2023-02-17%205.09.49.png?generation=1676580022020358&alt=media)

### 致谢

作者表示如果没有使用 cuDF 和 cuML，就无法管理大量实验，并感谢 RAPIDS。

![RAPIDS](https://www.googleapis.com/download/storage/v1/b/kaggle-forum-message-attachments/o/inbox%2F317344%2F2fad8cb1ed63c9d91ed4822fbdf133e4%2FRAPIDS-logo-white.png?generation=1675217750447580&alt=media)

## 3rd Place - Using Only Rules Achieves LB 0.590!

原链接：[https://www.kaggle.com/competitions/otto-recommender-system/discussion/383013](https://www.kaggle.com/competitions/otto-recommender-system/discussion/383013)

发布时间：2023-02-15

说明：该帖在 CLI 输出中非常长，且包含大量评论。这里归档其核心信息：该方案强调仅使用规则和共访类方法即可达到很强 LB 表现，标题给出的 LB 为 0.590。后续若需要完整逐段翻译，可单独拉取该帖主帖 HTML 并处理。

方法价值：

- 说明 OTTO 任务中强规则、共访矩阵、最近行为和行为类型权重非常关键。
- 为轻量 baseline 和资源受限复现提供重要参考。
- 可作为后续构建候选生成模块的优先阅读材料。

## 5th place Solution

原链接：[https://www.kaggle.com/competitions/otto-recommender-system/discussion/382802](https://www.kaggle.com/competitions/otto-recommender-system/discussion/382802)

发布时间：2023-02-01

作者感谢大家在这个问题上的大量分享，并特别感谢多位社区成员：

- Carno：分享 numba pipeline。作者所有候选生成和许多特征都使用 numba 创建；此前几乎没有使用过 numba，因此在本竞赛中学到了很多。
- Chris：从竞赛开始到结束分享了大量内容。作者认为每位参赛者都受益于此，也提到 Chris 直到竞赛最后一天仍在回答有关排序模型的问题。
- Radek：介绍 polars。polars 在表连接方面的速度显著加快了作者实验。
- Senkin：其 H&M 竞赛第一名方案启发了作者在 OTTO 中的许多想法。

作者私榜最佳方案几乎是单模型，分数与集成几乎相同，因此描述单模型。公开榜约 0.604，私榜约 0.603。

整体流程：

```text
候选生成（Numba） -> 特征创建（Numba、Polars） -> 排序模型（LightGBM） -> 推理（Treelite）
```

### 候选生成

强候选生成方法对作者帮助很大。

每个会话的候选数量：

- 竞赛大部分时间生成 80 个候选
- 最后一周提升到 120 个候选，带来约 0.001 的分数提升
- 在验证集上，80 个候选的最大召回达到约 0.648
- 曾尝试 200 个候选，但没有提升分数
- 如果只取第一阶段候选生成模型的前 20 个候选，LB 可达到 0.585

候选生成使用了类似共访矩阵的方法。对于任意两个 `aid`，作者将会话中的用户行为划分为多个类别，例如：

- 任意行为到任意行为
- 点击到加购
- 加购到下单
- 下单到下单
- 等等

为了降低内存使用，只保留 top `(k * 100)` 候选，其中 `k` 是希望生成的候选数量。

矩阵权重按第一个物品的频率进行归一化。直观上类似于：在 100 次购买牛奶的情况下，有多少次同时购买鸡蛋。

矩阵中的权重还会按两个 `aid` 之间访问过的物品数量归一化。

例如有 5 个 `aid`：`aid1, aid2, aid3, aid4, aid5`。

则 `(aid1, aid5)` 的权重为 `(5-1)/(aid1 的频率)`。

而 `(aid5, aid1)` 的权重为 `(aid1, aid5)` 权重的一半，用于表达“购买 aid5 是由购买 aid1 驱动，而不是反过来”的倾向。

在推理阶段，为决定应该取哪些 top k 候选，作者使用 Optuna，将各共访矩阵权重、物品近期性权重、物品归一化整体频率等作为参数。

### 特征生成

特征包括：

- 基础特征：物品频率、点击到加购比例、近期访问程度等。若会话候选数超过 20，近期访问特征帮助很大。
- 生成候选与会话中已见 `aid` 的关联。可以通过共访矩阵权重创建。深入构造这类特征显著提升了分数。

共访矩阵可以用不同方式建立两个物品之间的关系，例如：

- 只取两个 `aid` 之间平均距离，即中间隔了多少个 `aid`
- 距离也可用时间戳差衡量
- 只考虑第一邻域中的候选，即直接候选
- 只考虑最后一周的关系，等等

### 训练排序模型

作者使用 LightGBM，负采样 5%，约 400 个特征，并使用最后两周数据。加入倒数第二周数据约提升 0.0005。

有效技巧：

1. 使用单个模型同时训练 clicks、carts 和 orders，而不是三个独立模型。本地可观察到约 0.001 到 0.002 的提升。数据按 session 分组，而不是按 session/type 分组。
2. 排序时对 clicks、carts 和 orders 使用不同标签，并设置 ranking label gain 为 Orders(6) -> Carts(3) -> Clicks(1)，而不是用户发生任意行为时标 1、未发生时标 0。这约提升 0.0005。
3. 将第一阶段候选生成模型的排名作为第二阶段模型的特征。考虑到第一阶段模型在 LB 上可达 0.585，这个排名是模型中的重要特征。

### 推理

推理部分没有太多特别之处，作者使用 Treelite 来减少推理时间。

作者最后祝贺所有获奖者，并说明原帖是在上班前匆忙写成，如有细节错误欢迎指出。

## How To Build a GBT Ranker Model

原链接：[https://www.kaggle.com/competitions/otto-recommender-system/discussion/370210](https://www.kaggle.com/competitions/otto-recommender-system/discussion/370210)

发布时间：2022-12-03

说明：该帖是高票教程帖，CLI 输出包含大量正文和评论，完整输出极长。建议将其作为后续排序模型实现参考单独精读。当前归档其定位和用途：

- 面向如何构建 GBT/LightGBM/XGBoost/CatBoost 类排序模型。
- 与本竞赛常见两阶段路线直接相关：先做候选生成，再用 GBT ranker 重排。
- 可与第 5 名方案中的 LightGBM + 特征工程路线互相印证。
- 适合作为后续实现 baseline ranker 时的教程来源。
