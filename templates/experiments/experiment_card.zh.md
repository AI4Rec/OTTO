# <EXPERIMENT_ID> <TITLE>

## 元信息

| 字段 | 值 |
| :-- | :-- |
| Experiment ID |  |
| 阶段 |  |
| 状态 | 计划中 / 运行中 / 已完成 / 已拒绝 |
| 配置 | `configs/experiment/<EXPERIMENT_ID>.yaml` |
| 数据版本 |  |
| Split 版本 |  |

## 假设

说明预期改进和背后的机制。

```text
如果我们……，那么……会提升，因为……
```

## 方法设计

用可复现所需的粒度描述方法。

```text
Input sessions
  -> candidate source / model component
  -> scoring or ranking
  -> top-k output
```

## 输入

| 输入 | 版本/路径 | 备注 |
| :-- | :-- | :-- |
| Dataset |  |  |
| Split |  |  |
| Config |  |  |

## 命令

```bash
# exact command here
```

## 输出

| 输出 | 路径 | 备注 |
| :-- | :-- | :-- |
| Metrics |  |  |
| Predictions |  |  |
| Figures |  |  |

## 指标

| 指标 | 数值 | 相比 baseline 变化 |
| :-- | --: | --: |
| clicks_recall20 |  |  |
| carts_recall20 |  |  |
| orders_recall20 |  |  |
| weighted_recall20 |  |  |

## 诊断

| 诊断 | 结果 | 解读 |
| :-- | :-- | :-- |
| Candidate recall by target |  |  |
| Coverage by session length |  |  |
| Runtime |  |  |
| Memory |  |  |

## 决策

采用 / 拒绝 / 延后。

原因：

- 

## 下一步

- [ ] 
