# Methods

## System Architecture

```text
Raw session events
  -> event-level table
  -> validation split
  -> candidate generation
       - session history
       - global popularity
       - recent popularity
       - co-visitation
       - target-specific candidate pools
  -> feature construction
       - session features
       - item features
       - session-item features
       - candidate-source features
  -> target-specific ranking
  -> top-20 submission
```

## Baseline Layer

| Method | Description | Expected value |
| :-- | :-- | :-- |
| Global popularity | Recommend globally frequent items | Robust fallback for short sessions |
| Type-specific popularity | Separate popular items by click/cart/order | Better target alignment |
| Session history | Recommend recently interacted items | Strong continuation signal |
| Weighted session history | Weight recency and event type | Improves order-sensitive ranking |

EDA-driven additions:

- Use separate fallback lists for `clicks`, `carts`, and `orders`; top items differ by target.
- Segment metrics by session length because the test split is much shorter than train.
- Add a stronger order path based on late-session events and cart-to-order transitions.

## Candidate Generation

Candidate generation should be evaluated by target-level recall coverage before ranking.

| Candidate source | Idea | Planned diagnostics |
| :-- | :-- | :-- |
| Session history | Seen items in reverse chronological order | Coverage by session length |
| Recent popularity | Items popular near validation/test window | Drift vs global popularity |
| Click-click co-visitation | Items viewed together | Click target recall |
| Cart/order co-visitation | Items carted or ordered together | Cart/order target recall |
| Mixed target pool | Different source mix by target | Weighted recall contribution |

EDA points to these first co-visitation matrices:

| Matrix | Motivation | Target |
| :-- | :-- | :-- |
| click -> click | Most transitions are click continuation | clicks |
| click -> cart | 8-9% of click transitions move into cart | carts |
| cart -> order | Roughly 9-10% of cart transitions move into order | orders |
| order -> order | Orders often repeat after orders | orders |

## Ranking Layer

After candidate recall is strong enough, ranking can use a GBDT model such as LightGBM or XGBoost.

Feature groups:

| Group | Examples |
| :-- | :-- |
| Session features | Length, unique item count, repeated item ratio, last event type |
| Item features | Global popularity, recent popularity, cart/order ratios |
| Session-item features | Last seen position, count in session, max event type weight |
| Candidate-source features | Source id, source rank, number of sources |
| Time features | Recency, time gap, window-specific counts |

EDA-backed high-priority features:

| Feature | Reason |
| :-- | :-- |
| `session_len`, `unique_aid_count` | Test sessions are short and need different fallback behavior. |
| `aid_count_in_session` | Repeated-aid sessions are common. |
| `last_seen_rank`, `relative_position` | Orders are concentrated near the session tail. |
| `last_event_type` | Last cart/order is an intent signal. |
| `target_popularity_rank` | Popular items differ by target. |
| `source_count`, `best_source_rank` | Candidate-source agreement can improve reranking. |

## Ablation Strategy

Every method should answer:

- Which target improved?
- Did the gain come from candidate recall or ranking?
- How much compute and memory did it add?
- Does the method help short sessions, long sessions, or both?
- Does it improve local validation consistently?

## Solution-Study Backlog

| Source | Topic to extract | Planned output |
| :-- | :-- | :-- |
| Top Kaggle solutions | Candidate generation, co-visitation variants, ranker features | Method map |
| Public validation discussions | Time split and leaderboard correlation | Validation report |
| OTTO dataset notes | Data release context and schema details | Data card |
