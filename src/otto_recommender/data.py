"""Data loading contracts for OTTO session data."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class RawDatasetPaths:
    """Filesystem contract for the Kaggle OTTO raw dataset."""

    raw_dir: Path = Path("data/raw")
    archive_name: str = "recsys-dataset.zip"
    train_member: str = "otto-recsys-train.jsonl"
    test_member: str = "otto-recsys-test.jsonl"

    @property
    def archive_path(self) -> Path:
        return self.raw_dir / self.archive_name


EVENT_COLUMNS = ["session", "aid", "ts", "type", "event_idx"]


def event_schema() -> dict[str, str]:
    """Return the public event-level schema contract used by this project."""

    return {
        "session": "int64",
        "aid": "int64",
        "ts": "int64",
        "type": "string",
        "event_idx": "int32",
    }
