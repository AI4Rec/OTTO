# Project Maturity Checklist

This checklist defines what a complete public OTTO recommender-system study should contain.

Status legend:

- `[x]` complete
- `[~]` partially complete
- `[ ]` pending

| Area | Status | Standard | Current state |
| :-- | :--: | :-- | :-- |
| Task framing | `[~]` | Explain session-based recommendation, three targets, and weighted Recall@20. | Drafted in `site/task_metric.md`. |
| Data understanding | `[~]` | Document field contract, full scale, sample distributions, data quality, figures, and insights. | Initial EDA report exists; full figures are planned. |
| Validation | `[ ]` | Implement time split, labels, weighted Recall@20, and metric sanity checks. | Planned as `V000_time_split`. |
| Baselines | `[ ]` | Implement popularity and session-history baselines with target-level metrics. | Planned as `B000` and `B001`. |
| Candidate generation | `[ ]` | Add co-visitation and target-specific candidate pools with coverage diagnostics. | Planned. |
| Features | `[ ]` | Define session, item, session-item, time, and candidate-source features. | Method roadmap drafted. |
| Ranking | `[ ]` | Train and evaluate target-specific rankers. | Planned. |
| Ablation | `[ ]` | Record controlled experiments and decisions. | Experiment board drafted. |
| Reproducibility | `[~]` | Use configs, registry, experiment cards, and release checks. | Public workspace structure is in place. |
| Final report | `[ ]` | Summarize architecture, metrics, tradeoffs, and lessons. | Story template drafted. |

## Target Deliverables

1. EDA page with generated charts and insight-to-experiment mapping.
2. Validation report with split definition and metric sanity checks.
3. Baseline scorecard.
4. Candidate recall coverage table.
5. Ranking feature and ablation table.
6. Final architecture diagram and project story.
