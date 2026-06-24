# Public Documentation Workflow

## Purpose

This document defines how the public knowledge base is built and published. The documentation site should present the project as a coherent case study rather than a raw collection of notes.

## Site Scope

The public site should contain:

- Task and metric explanation.
- Data schema, distribution tables, figures, and EDA insights.
- Validation design and leakage checks.
- Method roadmap for baselines, candidates, features, and ranking.
- Experiment board with hypotheses, metrics, and decisions.
- Engineering and reproducibility standards.
- Final project narrative after the core experiments are complete.

The public site should not contain:

- Local machine paths or infrastructure details.
- Credentials, token paths, or authentication procedures.
- Internal collaboration notes.
- Temporary scratch logs.
- Raw data or generated model artifacts.

## Build Commands

```bash
mkdocs build --strict
```

Local preview:

```bash
mkdocs serve
```

## Release Check

Run the public-release guard before committing or pushing:

```bash
bash scripts/check_public_release.sh
```

The guard scans for local paths, hostnames, token filenames, and internal wording that should not appear in a public repository.

## Page Ownership

| Page | Purpose | Update trigger |
| :-- | :-- | :-- |
| `site/index.md` | Executive summary and roadmap | Any major project milestone |
| `site/task_metric.md` | Task and metric framing | Metric or target definition changes |
| `site/data_eda.md` | Data contract, distributions, figures, insights | New EDA figures or statistics |
| `site/validation.md` | Split and metric design | Validation implementation changes |
| `site/methods.md` | Modeling roadmap | New method family or architecture change |
| `site/experiments.md` | Experiment board and scorecard | Every formal experiment |
| `site/engineering.md` | Reproducibility and release process | Repo or pipeline changes |
| `site/project_story.md` | Final project narrative | Final reporting phase |
