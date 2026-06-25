# <DATASET_ID> 数据集卡

## 基本信息

- 数据集 ID：
- 名称：
- 来源：
- 创建/下载日期：
- 负责人：
- 状态：planned / available / transformed / deprecated

## 路径

| 类型 | 路径 | 说明 |
| :-- | :-- | :-- |
| raw | | |
| parquet | | |
| split | | |
| labels | | |

## 文件校验

| 文件 | 大小 | 行数 | 校验方式 | 结果 |
| :-- | --: | --: | :-- | :-- |
| | | | | |

## 字段字典

| 字段 | 类型 | 含义 | 样例 | 备注/风险 |
| :-- | :-- | :-- | :-- | :-- |
| session | | | | |
| events | | | | |
| aid | | | | |
| ts | | | | |
| type | | | | |

## 数据接口

说明下游代码如何读取该数据，以及期望 schema。

```text
session -> events[]
event -> aid, ts, type
```

## 基础统计

| 指标 | 值 |
| :-- | --: |
| sessions | |
| events | |
| unique_aids | |
| min_ts | |
| max_ts | |

## 数据质量

- 空值：
- 异常 type：
- session 内时间乱序：
- 重复事件：
- 超长 session：

## 建模风险

- 

## 下游用途

- 
