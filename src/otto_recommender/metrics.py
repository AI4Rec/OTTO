"""Metric utilities for the OTTO study."""

from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence


TARGET_WEIGHTS: dict[str, float] = {
    "clicks": 0.10,
    "carts": 0.30,
    "orders": 0.60,
}


def recall_at_k(predictions: Sequence[int], labels: Iterable[int], k: int = 20) -> float:
    """Compute recall@k for a single target list."""

    label_set = set(labels)
    if not label_set:
        return 0.0
    top_k = list(dict.fromkeys(predictions))[:k]
    hits = len(set(top_k) & label_set)
    return hits / min(k, len(label_set))


def weighted_recall_at_20(
    recalls: Mapping[str, float],
    weights: Mapping[str, float] = TARGET_WEIGHTS,
) -> float:
    """Combine target-level recall values using OTTO metric weights."""

    return sum(weights[target] * recalls.get(target, 0.0) for target in weights)
