# 工程规范

## 仓库定位

本仓库是一个可复现的推荐系统实验工作区。公开文档负责解释项目，源码、配置和 registry 负责让实验可复跑、可追踪、可复盘。

## 目录约定

```text
configs/      实验与数据管线配置
docs/         背景资料与规范
experiments/  实验卡片
registry/     轻量索引
reports/      深入报告与图表
site/         公开知识库
src/          可复用实现代码
templates/    报告与实验模板
scripts/      发布检查与工具脚本
```

只保留在本地的目录：

```text
data/raw/
data/parquet/
data/splits/
data/labels/
outputs/
logs/
```

这些路径应排除在 git 之外。

## 实验契约

每个正式实验都应包含：

| 字段 | 作用 |
| :-- | :-- |
| Experiment ID | 文档、配置和 registry 中的稳定引用 |
| Hypothesis | 预期改动和机制 |
| Input data version | 使用的数据集和 split |
| Config | 可复现参数 |
| Command | 精确运行入口 |
| Metrics | clicks/carts/orders 与 weighted Recall@20 |
| Cost | 需要时记录运行时间、内存和存储 |
| Decision | 采用、拒绝或延后 |

## 公开发布检查

推送前运行：

```bash
bash scripts/check_public_release.sh
```

检查项包括常见私有产物、本地绝对路径、主机名、token 文件名和不适合公开仓库的协作表述。
