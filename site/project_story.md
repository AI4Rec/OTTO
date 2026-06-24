# Project Story

Status: planned

This page will become the final case-study narrative after baseline, validation, candidate generation, and ranking experiments are complete.

## Narrative Template

| Section | Content |
| :-- | :-- |
| Problem | Session-based multi-objective recommendation for clicks, carts, and orders |
| Metric | Weighted Recall@20 with high order weight |
| Data | Nested event sessions, strong temporal structure, long-tail items |
| Validation | Time-based local split that mimics future prediction |
| Baseline | Popularity and session-history recommenders |
| Candidate generation | Co-visitation and target-specific candidate pools |
| Ranking | Feature-based target-specific reranking |
| Lessons | What improved recall, what failed, and what tradeoffs mattered |

## Final Deliverables

- Architecture diagram
- Main metric table
- Candidate recall coverage table
- Feature and ablation table
- Failure cases
- Reproducible run commands
