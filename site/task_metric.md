# Task & Metric

## Task Definition

The OTTO competition is a session-based recommendation task. Each input is a user session represented as an ordered list of events. Every event contains:

```text
aid: item id
ts: millisecond timestamp
type: clicks | carts | orders
```

For each test session, the system predicts up to 20 candidate items for three targets:

```text
<session>_clicks
<session>_carts
<session>_orders
```

## Evaluation Metric

The official score is weighted Recall@20:

```text
score = 0.10 * recall_clicks@20
      + 0.30 * recall_carts@20
      + 0.60 * recall_orders@20
```

The metric creates an important tension:

| Target | Event frequency | Metric weight | Implication |
| :-- | :-- | --: | :-- |
| clicks | high | 0.10 | Strong for session continuation and short-term interest. |
| carts | medium | 0.30 | Often bridges browsing intent and purchase intent. |
| orders | sparse | 0.60 | Highest impact on final score; needs target-specific treatment. |

## System Framing

The task is naturally a two-stage recommender system:

```text
Session events
  -> candidate generation
  -> feature construction
  -> target-specific ranking
  -> top-20 predictions for clicks/carts/orders
```

## Design Consequences

- The validation split must respect time order.
- Candidate generation is critical because only 20 items per target can be submitted.
- Recent session behavior is a strong baseline signal.
- Orders should not be treated as a small side effect of click prediction.
- Separate target heads or target-specific candidate mixes are likely useful.

## References

- Kaggle competition: `otto-recommender-system`
- Kaggle dataset: `otto/recsys-dataset`
- OTTO RecSys Challenge public dataset repository
