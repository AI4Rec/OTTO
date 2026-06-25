# OTTO 推荐系统复盘

本仓库是 Kaggle OTTO 推荐系统竞赛的可复现复盘项目。目标不是追逐已经结束的榜单名次，而是把一个会话推荐任务拆成成熟项目应有的形态：任务定义、指标理解、全量 EDA、验证体系、基线、候选召回、特征与排序、实验迭代记录、最终项目讲述。

仓库同时承担两件事：

| 模块 | 项目报告产物 | 工程产物 |
| :-- | :-- | :-- |
| 任务理解 | `site/task_metric.md` 中的任务与指标说明 | 指标实现与检查用例 |
| 数据理解 | `site/data_eda.md` 中的字段口径、分布图、洞察 | 原始数据到事件表、验证集的数据管线 |
| 验证体系 | `site/validation.md` 中的时间切分与泄漏检查 | split、label、weighted Recall@20 代码 |
| 方法路线 | `site/methods.md` 中的基线、共现召回、排序路线 | 配置驱动的实验运行 |
| 实验管理 | `site/experiments.md` 中的实验看板 | `configs/`、`experiments/`、`registry/` |
| 可复现性 | `site/engineering.md` 中的工程规范 | 发布检查与公开仓库结构 |

## 当前状态

当前仓库已经包含公开项目骨架和第一版全量 EDA 报告。下一阶段的最小闭环是：

1. 将原始 JSONL 转成事件级 parquet。
2. 构建按时间切分的本地验证集和标签。
3. 实现 popularity 与 session history 两个基线。
4. 把指标、结论和后续动作写入实验卡片，并同步更新实验看板。

## 目录结构

```text
configs/      实验与数据管线配置
docs/         公开背景资料与工程规范
experiments/  实验卡片：设计、命令、指标、结论
registry/     数据集、实验、特征、提交索引
reports/      深入分析报告与生成图表
site/         MkDocs 知识库源码
src/          可复用项目代码
templates/    报告与实验模板
scripts/      发布检查与工具脚本
```

## 数据

OTTO 原始数据不进入仓库，需要从 Kaggle 下载：

```bash
kaggle datasets download -d otto/recsys-dataset -p data/raw
```

建议本地数据目录：

```text
data/raw/
data/parquet/
data/splits/
data/labels/
outputs/
```

大数据文件、模型产物、本地环境、日志和密钥文件都不应提交。

## 文档站点

构建知识库：

```bash
mkdocs build --strict
```

本地预览：

```bash
mkdocs serve
```

发布前运行公开内容检查：

```bash
bash scripts/check_public_release.sh
```
