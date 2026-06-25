# 项目讲述

<section class="story-hero">
  <div class="story-hero__eyebrow">项目讲述</div>
  <h1>一个可复现的会话推荐系统复盘</h1>
  <p class="story-hero__summary">本页用于沉淀最终项目案例：从 OTTO 的三目标推荐任务出发，说明数据理解、验证体系、候选召回、排序建模和工程取舍。当前处于框架阶段，后续会随着基线、共访召回与排序实验逐步填入结果。</p>
  <div class="story-metrics">
    <div class="story-metric"><b>216.7M</b><span>训练事件数</span></div>
    <div class="story-metric"><b>12.9M</b><span>训练会话数</span></div>
    <div class="story-metric"><b>0.60</b><span>orders 指标权重</span></div>
    <div class="story-metric"><b>8.29</b><span>测试平均长度</span></div>
  </div>
</section>

状态：计划中

当验证、基线、候选召回和排序实验完成后，本页会整理成最终项目案例。目标是能清楚说明：问题是什么、为什么这样建模、每一步如何验证、哪些方法有效、哪些权衡最重要。

## 讲述框架

| 区块 | 内容 |
| :-- | :-- |
| 问题 | 面向 clicks、carts、orders 的 session-based multi-objective recommendation |
| 指标 | weighted Recall@20，orders 权重最高 |
| 数据 | 嵌套事件 session、明显时间结构、item 长尾 |
| 验证 | 模拟未来预测的 time-based local split |
| 基线 | popularity 与 session-history recommenders |
| 候选召回 | co-visitation 与 target-specific candidate pools |
| 排序 | 基于特征的 target-specific reranking |
| 复盘 | 哪些方法提升 recall，哪些失败，工程和指标之间如何取舍 |

## 最终交付

- 系统架构图
- 主指标表
- candidate recall coverage 表
- feature 与 ablation 表
- 典型失败案例
- 可复现运行命令
