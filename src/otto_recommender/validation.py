"""Validation split contracts for the OTTO study."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class TimeSplitConfig:
    """Configuration for a chronological validation split."""

    split_name: str
    train_end_ts: int
    valid_start_ts: int
    valid_end_ts: int
    min_session_events: int = 2


def label_targets() -> tuple[str, str, str]:
    """Return the target order used across validation and reporting."""

    return ("clicks", "carts", "orders")
