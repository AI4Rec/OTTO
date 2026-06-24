"""Baseline recommender contracts.

The first implementation milestone is to replace these contracts with
streaming/parquet-backed implementations and formal experiment cards.
"""

from __future__ import annotations

from collections import Counter
from collections.abc import Iterable, Sequence


def top_items_by_frequency(events: Iterable[int], k: int = 20) -> list[int]:
    """Return the most frequent item ids from an iterable of item ids."""

    return [aid for aid, _ in Counter(events).most_common(k)]


def recent_unique_items(session_aids: Sequence[int], k: int = 20) -> list[int]:
    """Return unique session items in reverse chronological order."""

    seen: set[int] = set()
    result: list[int] = []
    for aid in reversed(session_aids):
        if aid in seen:
            continue
        seen.add(aid)
        result.append(aid)
        if len(result) >= k:
            break
    return result
