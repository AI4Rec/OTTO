# 公开文档工作流

## 目的

本文定义公开知识库的构建和发布方式。文档站点应呈现为一个连贯的推荐系统项目案例，而不是零散笔记集合。

## 站点范围

公开站点应包含：

- 任务与指标说明。
- 数据 schema、分布表、图表和 EDA 洞察。
- 验证设计与泄漏检查。
- baseline、candidate、feature、ranking 的方法路线。
- 包含假设、指标和决策的实验看板。
- 工程与可复现规范。
- 核心实验完成后的最终项目讲述。

公开站点不应包含：

- 本地机器路径或基础设施细节。
- 凭证、token 路径或认证流程。
- 内部协作记录。
- 临时草稿日志。
- 原始数据或生成模型产物。

## 构建命令

```bash
mkdocs build --strict
```

本地预览：

```bash
mkdocs serve
```

## 发布检查

提交或推送前运行公开内容检查：

```bash
bash scripts/check_public_release.sh
```

该脚本扫描本地路径、主机名、token 文件名，以及不适合公开仓库的内部表述。

## 页面维护规则

| 页面 | 用途 | 更新时机 |
| :-- | :-- | :-- |
| `site/index.md` | 项目摘要与路线图 | 重要里程碑变化 |
| `site/task_metric.md` | 任务与指标定义 | metric 或 target 定义变化 |
| `site/data_eda.md` | 数据口径、分布、图表、洞察 | 新增 EDA 图表或统计 |
| `site/validation.md` | split 与 metric 设计 | 验证实现变化 |
| `site/methods.md` | 建模路线 | 新增方法族或架构变化 |
| `site/experiments.md` | 实验看板与 scorecard | 每次正式实验 |
| `site/engineering.md` | 可复现与发布流程 | 仓库或 pipeline 变化 |
| `site/project_story.md` | 最终项目讲述 | 最终报告阶段 |
