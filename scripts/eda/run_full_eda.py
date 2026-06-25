#!/usr/bin/env python3
"""Run full EDA for the Kaggle OTTO session dataset.

The script intentionally uses only the Python standard library so it can run on
bare remote machines. It streams JSONL members from the official zip archive,
builds aggregate statistics, writes compact JSON/CSV artifacts, and generates
SVG figures for the MkDocs knowledge base.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import zipfile
from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from html import escape
from pathlib import Path
from typing import Iterable


TARGET_TYPES = ("clicks", "carts", "orders")
TYPE_COLORS = {
    "clicks": "#2563eb",
    "carts": "#0f766e",
    "orders": "#b45309",
}
SPLIT_COLORS = {
    "train": "#334155",
    "test": "#0f766e",
}
LENGTH_BINS = [1, 2, 3, 4, 5, 10, 20, 50, 100, 200, 500, 1000]
DURATION_BINS_SECONDS = [0, 60, 300, 1800, 3600, 21600, 86400, 604800]
GAP_BINS_SECONDS = [0, 1, 5, 30, 60, 300, 1800, 3600, 21600, 86400]


def utc_iso_from_ms(ts_ms: int | None) -> str | None:
    if ts_ms is None:
        return None
    return datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).isoformat()


def utc_day_from_ms(ts_ms: int) -> str:
    return datetime.fromtimestamp(ts_ms / 1000, tz=timezone.utc).strftime("%Y-%m-%d")


def pct(values: list[int], q: float) -> float:
    if not values:
        return 0.0
    if len(values) == 1:
        return float(values[0])
    ordered = sorted(values)
    pos = (len(ordered) - 1) * q
    lo = int(math.floor(pos))
    hi = int(math.ceil(pos))
    if lo == hi:
        return float(ordered[lo])
    weight = pos - lo
    return float(ordered[lo] * (1 - weight) + ordered[hi] * weight)


def percentile_block(values: list[int]) -> dict[str, float]:
    return {
        "mean": sum(values) / len(values) if values else 0.0,
        "p50": pct(values, 0.50),
        "p75": pct(values, 0.75),
        "p90": pct(values, 0.90),
        "p95": pct(values, 0.95),
        "p99": pct(values, 0.99),
        "max": max(values) if values else 0,
    }


def hist_label(boundaries: list[int], value: int) -> str:
    prev = None
    for bound in boundaries:
        if value <= bound:
            if prev is None:
                return f"<= {bound}"
            return f"{prev + 1}-{bound}"
        prev = bound
    return f"> {boundaries[-1]}"


def add_hist(counter: Counter[str], boundaries: list[int], value: int) -> None:
    counter[hist_label(boundaries, value)] += 1


def gini_from_counts(counts: Iterable[int]) -> float:
    ordered = sorted(counts)
    n = len(ordered)
    total = sum(ordered)
    if n == 0 or total == 0:
        return 0.0
    weighted_sum = sum((idx + 1) * value for idx, value in enumerate(ordered))
    return (2 * weighted_sum) / (n * total) - (n + 1) / n


@dataclass
class SplitStats:
    split: str
    sessions: int = 0
    events: int = 0
    min_ts: int | None = None
    max_ts: int | None = None
    type_counts: Counter[str] = field(default_factory=Counter)
    aid_counts: Counter[int] = field(default_factory=Counter)
    type_aid_counts: dict[str, Counter[int]] = field(
        default_factory=lambda: {target: Counter() for target in TARGET_TYPES}
    )
    session_lengths: list[int] = field(default_factory=list)
    session_durations: list[int] = field(default_factory=list)
    unique_aids_per_session: list[int] = field(default_factory=list)
    session_length_hist: Counter[str] = field(default_factory=Counter)
    duration_hist: Counter[str] = field(default_factory=Counter)
    gap_hist: Counter[str] = field(default_factory=Counter)
    sessions_with_type: Counter[str] = field(default_factory=Counter)
    session_type_combos: Counter[str] = field(default_factory=Counter)
    sessions_with_repeated_aid: int = 0
    duplicate_events: int = 0
    first_type_counts: Counter[str] = field(default_factory=Counter)
    last_type_counts: Counter[str] = field(default_factory=Counter)
    transition_counts: Counter[str] = field(default_factory=Counter)
    position_deciles: dict[str, Counter[int]] = field(
        default_factory=lambda: {target: Counter() for target in TARGET_TYPES}
    )
    daily_type_counts: dict[int, Counter[str]] = field(default_factory=lambda: defaultdict(Counter))
    hourly_type_counts: dict[int, Counter[str]] = field(default_factory=lambda: defaultdict(Counter))

    def update_ts(self, ts: int) -> None:
        self.min_ts = ts if self.min_ts is None else min(self.min_ts, ts)
        self.max_ts = ts if self.max_ts is None else max(self.max_ts, ts)

    def update_session(self, events: list[dict]) -> None:
        self.sessions += 1
        n_events = len(events)
        self.events += n_events
        self.session_lengths.append(n_events)
        add_hist(self.session_length_hist, LENGTH_BINS, n_events)

        seen_aids: set[int] = set()
        seen_events: set[tuple[int, int, str]] = set()
        session_types: set[str] = set()
        first_ts = events[0]["ts"] if events else None
        last_ts = events[-1]["ts"] if events else None
        repeated_aid = False
        prev_type: str | None = None
        prev_ts: int | None = None

        if events:
            self.first_type_counts[events[0]["type"]] += 1
            self.last_type_counts[events[-1]["type"]] += 1

        for idx, event in enumerate(events):
            aid = int(event["aid"])
            ts = int(event["ts"])
            event_type = str(event["type"])
            self.update_ts(ts)
            self.type_counts[event_type] += 1
            self.aid_counts[aid] += 1
            self.type_aid_counts[event_type][aid] += 1
            session_types.add(event_type)

            day_key = ts // 86_400_000
            hour_key = ts // 3_600_000
            self.daily_type_counts[day_key][event_type] += 1
            self.hourly_type_counts[hour_key][event_type] += 1

            if aid in seen_aids:
                repeated_aid = True
            else:
                seen_aids.add(aid)

            event_key = (aid, ts, event_type)
            if event_key in seen_events:
                self.duplicate_events += 1
            else:
                seen_events.add(event_key)

            if prev_type is not None:
                self.transition_counts[f"{prev_type}->{event_type}"] += 1
            if prev_ts is not None:
                gap_seconds = max(0, (ts - prev_ts) // 1000)
                add_hist(self.gap_hist, GAP_BINS_SECONDS, gap_seconds)
            prev_type = event_type
            prev_ts = ts

            decile = min(9, int(idx * 10 / max(1, n_events)))
            self.position_deciles[event_type][decile] += 1

        if repeated_aid:
            self.sessions_with_repeated_aid += 1
        self.unique_aids_per_session.append(len(seen_aids))
        for target in session_types:
            self.sessions_with_type[target] += 1
        combo = "+".join(target for target in TARGET_TYPES if target in session_types)
        self.session_type_combos[combo or "none"] += 1

        if first_ts is not None and last_ts is not None:
            duration_seconds = max(0, (last_ts - first_ts) // 1000)
            self.session_durations.append(duration_seconds)
            add_hist(self.duration_hist, DURATION_BINS_SECONDS, duration_seconds)

    def to_summary(self, top_k: int = 100, top_curve_k: int = 5000) -> dict:
        total_events = max(1, self.events)
        aid_counts_sorted = self.aid_counts.most_common()
        top_counts = [count for _, count in aid_counts_sorted[:top_curve_k]]
        concentration = {}
        for k in (20, 100, 1000, 10000):
            concentration[f"top_{k}_event_share"] = (
                sum(count for _, count in aid_counts_sorted[:k]) / total_events
            )
        one_event_aids = sum(1 for count in self.aid_counts.values() if count == 1)
        le_2_event_aids = sum(1 for count in self.aid_counts.values() if count <= 2)
        le_10_event_aids = sum(1 for count in self.aid_counts.values() if count <= 10)

        daily_counts = []
        for day_key in sorted(self.daily_type_counts):
            counts = self.daily_type_counts[day_key]
            row = {"date": utc_day_from_ms(day_key * 86_400_000)}
            row.update({target: counts.get(target, 0) for target in TARGET_TYPES})
            row["total"] = sum(counts.values())
            daily_counts.append(row)

        hourly_counts = []
        for hour_key in sorted(self.hourly_type_counts):
            counts = self.hourly_type_counts[hour_key]
            hour_ts = hour_key * 3_600_000
            row = {
                "hour_utc": datetime.fromtimestamp(hour_ts / 1000, tz=timezone.utc).strftime(
                    "%Y-%m-%dT%H:00:00+00:00"
                )
            }
            row.update({target: counts.get(target, 0) for target in TARGET_TYPES})
            row["total"] = sum(counts.values())
            hourly_counts.append(row)

        return {
            "sessions": self.sessions,
            "events": self.events,
            "unique_aids": len(self.aid_counts),
            "min_ts_utc": utc_iso_from_ms(self.min_ts),
            "max_ts_utc": utc_iso_from_ms(self.max_ts),
            "type_counts": dict(self.type_counts),
            "type_ratios": {target: self.type_counts.get(target, 0) / total_events for target in TARGET_TYPES},
            "session_length": percentile_block(self.session_lengths),
            "session_duration_seconds": percentile_block(self.session_durations),
            "unique_aids_per_session": percentile_block(self.unique_aids_per_session),
            "session_length_hist": dict(self.session_length_hist),
            "duration_hist_seconds": dict(self.duration_hist),
            "gap_hist_seconds": dict(self.gap_hist),
            "sessions_with_type": dict(self.sessions_with_type),
            "sessions_with_type_ratio": {
                target: self.sessions_with_type.get(target, 0) / max(1, self.sessions)
                for target in TARGET_TYPES
            },
            "session_type_combos": dict(self.session_type_combos),
            "sessions_with_repeated_aid": self.sessions_with_repeated_aid,
            "sessions_with_repeated_aid_ratio": self.sessions_with_repeated_aid / max(1, self.sessions),
            "duplicate_events": self.duplicate_events,
            "first_type_counts": dict(self.first_type_counts),
            "last_type_counts": dict(self.last_type_counts),
            "transition_counts": dict(self.transition_counts),
            "position_deciles": {
                target: {str(k): self.position_deciles[target].get(k, 0) for k in range(10)}
                for target in TARGET_TYPES
            },
            "popularity": {
                "unique_aids": len(self.aid_counts),
                "gini": gini_from_counts(self.aid_counts.values()),
                "one_event_aids": one_event_aids,
                "one_event_aids_ratio": one_event_aids / max(1, len(self.aid_counts)),
                "le_2_event_aids_ratio": le_2_event_aids / max(1, len(self.aid_counts)),
                "le_10_event_aids_ratio": le_10_event_aids / max(1, len(self.aid_counts)),
                "concentration": concentration,
                "top_aids": [
                    {"aid": aid, "events": count, "event_share": count / total_events}
                    for aid, count in aid_counts_sorted[:top_k]
                ],
                "top_curve_counts": top_counts,
            },
            "top_aids_by_type": {
                target: [
                    {"aid": aid, "events": count, "event_share": count / max(1, self.type_counts.get(target, 0))}
                    for aid, count in self.type_aid_counts[target].most_common(top_k)
                ]
                for target in TARGET_TYPES
            },
            "daily_counts": daily_counts,
            "hourly_counts": hourly_counts,
        }


def process_member(
    archive: zipfile.ZipFile,
    member: str,
    split: str,
    max_sessions: int | None = None,
    progress_every: int = 200_000,
) -> SplitStats:
    stats = SplitStats(split=split)
    with archive.open(member) as fh:
        for idx, line in enumerate(fh, start=1):
            row = json.loads(line)
            stats.update_session(row["events"])
            if progress_every and idx % progress_every == 0:
                print(f"[{split}] sessions={idx:,} events={stats.events:,}", flush=True)
            if max_sessions is not None and idx >= max_sessions:
                break
    print(f"[{split}] complete sessions={stats.sessions:,} events={stats.events:,}", flush=True)
    return stats


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    with path.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def fmt_int(value: int | float) -> str:
    return f"{int(round(value)):,}"


def fmt_pct(value: float) -> str:
    return f"{value * 100:.2f}%"


def svg_header(width: int, height: int, title: str, subtitle: str = "") -> str:
    subtitle_svg = (
        f'<text x="32" y="58" class="subtitle">{escape(subtitle)}</text>' if subtitle else ""
    )
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-label="{escape(title)}">
<style>
  .bg {{ fill: #f8fafc; }}
  .panel {{ fill: #ffffff; stroke: #dbe3ea; stroke-width: 1; }}
  .title {{ font: 700 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #0f172a; }}
  .subtitle {{ font: 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #64748b; }}
  .axis {{ stroke: #94a3b8; stroke-width: 1; }}
  .grid {{ stroke: #e2e8f0; stroke-width: 1; }}
  .label {{ font: 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #475569; }}
  .small {{ font: 11px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #64748b; }}
  .legend {{ font: 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #334155; }}
  .value {{ font: 700 12px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #0f172a; }}
</style>
<rect class="bg" width="100%" height="100%" rx="16"/>
<rect class="panel" x="16" y="16" width="{width - 32}" height="{height - 32}" rx="14"/>
<text x="32" y="38" class="title">{escape(title)}</text>
{subtitle_svg}
'''


def svg_footer() -> str:
    return "</svg>\n"


def bar_chart(
    path: Path,
    title: str,
    subtitle: str,
    labels: list[str],
    series: dict[str, list[float]],
    colors: dict[str, str],
    value_format: str = "int",
    width: int = 1080,
    height: int = 560,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    left, right, top, bottom = 76, 32, 92, 88
    chart_w = width - left - right
    chart_h = height - top - bottom
    max_value = max([max(values) if values else 0 for values in series.values()] + [1])
    max_value *= 1.08
    group_gap = 18
    group_w = (chart_w - group_gap * (len(labels) - 1)) / max(1, len(labels))
    bar_gap = 5
    bar_w = (group_w - bar_gap * (len(series) - 1)) / max(1, len(series))

    parts = [svg_header(width, height, title, subtitle)]
    for tick in range(6):
        y = top + chart_h - chart_h * tick / 5
        value = max_value * tick / 5
        parts.append(f'<line x1="{left}" y1="{y:.1f}" x2="{width-right}" y2="{y:.1f}" class="grid"/>')
        tick_label = f"{value:.0%}" if value_format == "pct" else fmt_int(value)
        parts.append(f'<text x="{left-10}" y="{y+4:.1f}" class="small" text-anchor="end">{tick_label}</text>')
    parts.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{top+chart_h}" class="axis"/>')
    parts.append(f'<line x1="{left}" y1="{top+chart_h}" x2="{width-right}" y2="{top+chart_h}" class="axis"/>')

    names = list(series)
    for i, label in enumerate(labels):
        gx = left + i * (group_w + group_gap)
        parts.append(
            f'<text x="{gx + group_w/2:.1f}" y="{top + chart_h + 28}" class="label" text-anchor="middle">{escape(label)}</text>'
        )
        for j, name in enumerate(names):
            value = series[name][i]
            h = chart_h * value / max_value
            x = gx + j * (bar_w + bar_gap)
            y = top + chart_h - h
            parts.append(
                f'<rect x="{x:.1f}" y="{y:.1f}" width="{bar_w:.1f}" height="{h:.1f}" rx="5" fill="{colors[name]}"/>'
            )
            if len(labels) <= 8:
                label_value = f"{value:.1%}" if value_format == "pct" else fmt_int(value)
                parts.append(
                    f'<text x="{x + bar_w/2:.1f}" y="{y - 6:.1f}" class="small" text-anchor="middle">{label_value}</text>'
                )

    legend_x = left
    legend_y = height - 34
    for name in names:
        parts.append(f'<rect x="{legend_x}" y="{legend_y-10}" width="12" height="12" rx="3" fill="{colors[name]}"/>')
        parts.append(f'<text x="{legend_x+18}" y="{legend_y}" class="legend">{escape(name)}</text>')
        legend_x += 120
    parts.append(svg_footer())
    path.write_text("".join(parts), encoding="utf-8")


def line_chart(
    path: Path,
    title: str,
    subtitle: str,
    x_labels: list[str],
    series: dict[str, list[float]],
    colors: dict[str, str],
    width: int = 1120,
    height: int = 560,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    left, right, top, bottom = 82, 34, 92, 92
    chart_w = width - left - right
    chart_h = height - top - bottom
    max_value = max([max(values) if values else 0 for values in series.values()] + [1]) * 1.08
    n = max(1, len(x_labels) - 1)
    parts = [svg_header(width, height, title, subtitle)]
    for tick in range(6):
        y = top + chart_h - chart_h * tick / 5
        value = max_value * tick / 5
        parts.append(f'<line x1="{left}" y1="{y:.1f}" x2="{width-right}" y2="{y:.1f}" class="grid"/>')
        parts.append(f'<text x="{left-10}" y="{y+4:.1f}" class="small" text-anchor="end">{fmt_int(value)}</text>')
    parts.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{top+chart_h}" class="axis"/>')
    parts.append(f'<line x1="{left}" y1="{top+chart_h}" x2="{width-right}" y2="{top+chart_h}" class="axis"/>')

    for name, values in series.items():
        points = []
        for i, value in enumerate(values):
            x = left + chart_w * i / n
            y = top + chart_h - chart_h * value / max_value
            points.append(f"{x:.1f},{y:.1f}")
        parts.append(
            f'<polyline points="{" ".join(points)}" fill="none" stroke="{colors[name]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
        )

    step = max(1, len(x_labels) // 8)
    for i, label in enumerate(x_labels):
        if i % step != 0 and i != len(x_labels) - 1:
            continue
        x = left + chart_w * i / n
        parts.append(
            f'<text x="{x:.1f}" y="{top + chart_h + 28}" class="small" text-anchor="middle">{escape(label[5:] if len(label) > 5 else label)}</text>'
        )

    legend_x = left
    legend_y = height - 34
    for name in series:
        parts.append(f'<rect x="{legend_x}" y="{legend_y-10}" width="12" height="12" rx="3" fill="{colors[name]}"/>')
        parts.append(f'<text x="{legend_x+18}" y="{legend_y}" class="legend">{escape(name)}</text>')
        legend_x += 120
    parts.append(svg_footer())
    path.write_text("".join(parts), encoding="utf-8")


def loglog_chart(
    path: Path,
    title: str,
    subtitle: str,
    series: dict[str, list[int]],
    colors: dict[str, str],
    width: int = 1080,
    height: int = 560,
) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    left, right, top, bottom = 78, 36, 92, 80
    chart_w = width - left - right
    chart_h = height - top - bottom
    max_rank = max([len(v) for v in series.values()] + [1])
    max_count = max([max(v) if v else 1 for v in series.values()] + [1])
    min_count = 1
    lx_max = math.log10(max_rank)
    ly_max = math.log10(max_count)
    ly_min = math.log10(min_count)
    parts = [svg_header(width, height, title, subtitle)]
    for tick in range(6):
        y = top + chart_h - chart_h * tick / 5
        parts.append(f'<line x1="{left}" y1="{y:.1f}" x2="{width-right}" y2="{y:.1f}" class="grid"/>')
    parts.append(f'<line x1="{left}" y1="{top}" x2="{left}" y2="{top+chart_h}" class="axis"/>')
    parts.append(f'<line x1="{left}" y1="{top+chart_h}" x2="{width-right}" y2="{top+chart_h}" class="axis"/>')
    parts.append(f'<text x="{left}" y="{height-34}" class="small">rank, log scale</text>')
    parts.append(f'<text x="24" y="{top+20}" class="small" transform="rotate(-90 24,{top+20})">event count, log scale</text>')

    for name, counts in series.items():
        points = []
        for rank, count in enumerate(counts, start=1):
            x = left + chart_w * (math.log10(rank) / max(1e-9, lx_max))
            y = top + chart_h - chart_h * ((math.log10(max(1, count)) - ly_min) / max(1e-9, ly_max - ly_min))
            points.append(f"{x:.1f},{y:.1f}")
        parts.append(
            f'<polyline points="{" ".join(points)}" fill="none" stroke="{colors[name]}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
        )

    legend_x = left
    legend_y = height - 34
    for name in series:
        parts.append(f'<rect x="{legend_x}" y="{legend_y-10}" width="12" height="12" rx="3" fill="{colors[name]}"/>')
        parts.append(f'<text x="{legend_x+18}" y="{legend_y}" class="legend">{escape(name)}</text>')
        legend_x += 120
    parts.append(svg_footer())
    path.write_text("".join(parts), encoding="utf-8")


def transition_heatmap(path: Path, summary: dict, split: str = "train") -> None:
    width, height = 720, 560
    left, top, cell = 180, 130, 92
    stats = summary["splits"][split]
    counts = stats["transition_counts"]
    max_value = max(counts.values()) if counts else 1
    path.parent.mkdir(parents=True, exist_ok=True)
    parts = [svg_header(width, height, f"{split.title()} Event-Type Transitions", "Consecutive event transitions within a session")]
    for i, source in enumerate(TARGET_TYPES):
        parts.append(f'<text x="{left-16}" y="{top+i*cell+cell/2+4}" class="label" text-anchor="end">{source}</text>')
    for j, target in enumerate(TARGET_TYPES):
        parts.append(f'<text x="{left+j*cell+cell/2}" y="{top-18}" class="label" text-anchor="middle">{target}</text>')
    parts.append(f'<text x="{left+cell*1.5}" y="{top-56}" class="small" text-anchor="middle">下一个 event type</text>')
    parts.append(f'<text x="{left-116}" y="{top+cell*1.5}" class="small" transform="rotate(-90 {left-116},{top+cell*1.5})">上一个 event type</text>')
    for i, source in enumerate(TARGET_TYPES):
        for j, target in enumerate(TARGET_TYPES):
            value = counts.get(f"{source}->{target}", 0)
            alpha = 0.10 + 0.90 * math.sqrt(value / max_value)
            x = left + j * cell
            y = top + i * cell
            parts.append(
                f'<rect x="{x}" y="{y}" width="{cell-6}" height="{cell-6}" rx="12" fill="#2563eb" fill-opacity="{alpha:.3f}"/>'
            )
            parts.append(
                f'<text x="{x+(cell-6)/2}" y="{y+cell/2-2}" class="value" text-anchor="middle">{fmt_int(value)}</text>'
            )
    parts.append(svg_footer())
    path.write_text("".join(parts), encoding="utf-8")


def generate_figures(summary: dict, site_fig_dir: Path) -> None:
    splits = summary["splits"]

    labels = ["clicks", "carts", "orders"]
    bar_chart(
        site_fig_dir / "eda_event_type_mix.svg",
        "行为类型分布",
        "clicks 占事件频率大头，orders 占指标权重大头。",
        labels,
        {
            split: [splits[split]["type_ratios"][label] for label in labels]
            for split in splits
        },
        {split: SPLIT_COLORS.get(split, "#334155") for split in splits},
        value_format="pct",
    )

    length_labels = [hist_label(LENGTH_BINS, b) for b in LENGTH_BINS] + [f"> {LENGTH_BINS[-1]}"]
    length_labels = list(dict.fromkeys(length_labels))
    bar_chart(
        site_fig_dir / "eda_session_length_hist.svg",
        "Session 长度分布",
        "public test split 明显短于 train。",
        length_labels,
        {
            split: [splits[split]["session_length_hist"].get(label, 0) for label in length_labels]
            for split in splits
        },
        SPLIT_COLORS,
    )

    signal_labels = ["包含 carts", "包含 orders", "重复 aid"]
    bar_chart(
        site_fig_dir / "eda_session_signals.svg",
        "Session 级信号",
        "按 split 对比 cart/order presence 与 repeated item behavior。",
        signal_labels,
        {
            split: [
                splits[split]["sessions_with_type_ratio"].get("carts", 0),
                splits[split]["sessions_with_type_ratio"].get("orders", 0),
                splits[split]["sessions_with_repeated_aid_ratio"],
            ]
            for split in splits
        },
        SPLIT_COLORS,
        value_format="pct",
    )

    all_dates = sorted({row["date"] for split in splits for row in splits[split]["daily_counts"]})
    series = {}
    colors = {}
    for split in splits:
        by_date = {row["date"]: row["total"] for row in splits[split]["daily_counts"]}
        series[split] = [by_date.get(date, 0) for date in all_dates]
        colors[split] = SPLIT_COLORS[split]
    line_chart(
        site_fig_dir / "eda_daily_event_volume.svg",
        "每日事件量",
        "展示 train/test 时间边界与事件量变化。",
        all_dates,
        series,
        colors,
    )

    loglog_chart(
        site_fig_dir / "eda_item_popularity_loglog.svg",
        "Item popularity 长尾",
        "用 log-log 坐标展示 top item 事件数排名。",
        {split: splits[split]["popularity"]["top_curve_counts"] for split in splits},
        SPLIT_COLORS,
    )

    sequence_split = "train" if "train" in splits else next(iter(splits))
    transition_heatmap(site_fig_dir / "eda_type_transition_heatmap.svg", summary, split=sequence_split)

    decile_labels = [f"{i*10}-{(i+1)*10}%" for i in range(10)]
    train_deciles = splits[sequence_split]["position_deciles"]
    totals_by_target = {
        target: max(1, sum(train_deciles[target].values())) for target in TARGET_TYPES
    }
    bar_chart(
        site_fig_dir / "eda_type_position_deciles.svg",
        "行为类型相对位置",
        "展示各行为类型在 train session 中的位置。",
        decile_labels,
        {
            target: [
                train_deciles[target].get(str(i), 0) / totals_by_target[target]
                for i in range(10)
            ]
            for target in TARGET_TYPES
        },
        TYPE_COLORS,
        value_format="pct",
        width=1160,
    )


def derive_cross_split(summary: dict, stats_by_split: dict[str, SplitStats]) -> None:
    if "train" not in stats_by_split or "test" not in stats_by_split:
        summary["cross_split"] = {}
        return
    train_aids = set(stats_by_split["train"].aid_counts)
    test_aids = set(stats_by_split["test"].aid_counts)
    overlap = train_aids & test_aids
    cold_test_aids = test_aids - train_aids
    test_events = max(1, stats_by_split["test"].events)
    cold_test_events = sum(stats_by_split["test"].aid_counts[aid] for aid in cold_test_aids)
    top_overlap = {}
    for k in (20, 100, 1000):
        train_top = {aid for aid, _ in stats_by_split["train"].aid_counts.most_common(k)}
        test_top = {aid for aid, _ in stats_by_split["test"].aid_counts.most_common(k)}
        top_overlap[f"top_{k}_jaccard"] = len(train_top & test_top) / max(1, len(train_top | test_top))
        top_overlap[f"top_{k}_intersection"] = len(train_top & test_top)

    summary["cross_split"] = {
        "aid_overlap": len(overlap),
        "train_unique_aids": len(train_aids),
        "test_unique_aids": len(test_aids),
        "test_aids_seen_in_train_ratio": len(overlap) / max(1, len(test_aids)),
        "cold_test_aids": len(cold_test_aids),
        "cold_test_aid_ratio": len(cold_test_aids) / max(1, len(test_aids)),
        "cold_test_event_ratio": cold_test_events / test_events,
        "top_overlap": top_overlap,
    }


def build_markdown(summary: dict, figure_dir_relative: str = "assets/figures") -> str:
    train = summary["splits"].get("train", {})
    test = summary["splits"].get("test", {})
    cross = summary.get("cross_split", {})

    def split_row(split: str, stats: dict) -> str:
        return (
            f"| {split} | {fmt_int(stats['sessions'])} | {fmt_int(stats['events'])} | "
            f"{fmt_int(stats['unique_aids'])} | {stats['min_ts_utc']} | {stats['max_ts_utc']} |"
        )

    def length_row(split: str, stats: dict) -> str:
        p = stats["session_length"]
        return (
            f"| {split} | {p['mean']:.2f} | {p['p50']:.0f} | {p['p75']:.0f} | "
            f"{p['p90']:.0f} | {p['p95']:.0f} | {p['p99']:.0f} | {fmt_int(p['max'])} |"
        )

    def type_row(split: str, stats: dict) -> str:
        return (
            f"| {split} | {fmt_int(stats['type_counts'].get('clicks', 0))} | "
            f"{fmt_int(stats['type_counts'].get('carts', 0))} | "
            f"{fmt_int(stats['type_counts'].get('orders', 0))} | "
            f"{fmt_pct(stats['type_ratios'].get('clicks', 0))} | "
            f"{fmt_pct(stats['type_ratios'].get('carts', 0))} | "
            f"{fmt_pct(stats['type_ratios'].get('orders', 0))} |"
        )

    def session_signal_row(split: str, stats: dict) -> str:
        return (
            f"| {split} | {fmt_pct(stats['sessions_with_type_ratio'].get('carts', 0))} | "
            f"{fmt_pct(stats['sessions_with_type_ratio'].get('orders', 0))} | "
            f"{fmt_pct(stats['sessions_with_repeated_aid_ratio'])} | "
            f"{stats['unique_aids_per_session']['mean']:.2f} | "
            f"{stats['session_duration_seconds']['p50']:.0f} | "
            f"{stats['session_duration_seconds']['p95']:.0f} |"
        )

    lines = [
        "# 数据与 EDA",
        "",
        "## 一句话结论",
        "",
        "本页汇总 Kaggle OTTO session 数据集的全量 EDA。这里的 EDA 不只是看分布，而是为后续工程做侦察：每个统计都应该验证字段口径、暴露建模风险，或指向明确的 baseline、candidate、feature、validation 决策。",
        "",
        "核心发现：",
        "",
        "- 任务强依赖 session 内行为：重复 item 交互非常常见，session history 应作为第一候选源。",
        "- public test session 明显短于 train，短 session fallback 必须单独设计。",
        "- clicks 占事件量大头，但 orders 占指标权重大头，需要 target-specific 候选与排序。",
        "- item popularity 极度长尾，热门 fallback 有价值但远远不够。",
        "- train/test 是时间相邻窗口，验证必须按时间切分，并显式做泄漏检查。",
        "",
        "## 全量数据规模",
        "",
        "| split | sessions | events | unique_aids | min_ts_utc | max_ts_utc |",
        "| :-- | --: | --: | --: | :-- | :-- |",
    ]
    if train:
        lines.append(split_row("train", train))
    if test:
        lines.append(split_row("test", test))

    lines += [
        "",
        "## 字段口径",
        "",
        "| 字段 | 粒度 | 类型 | 含义 | 下游用途 |",
        "| :-- | :-- | :-- | :-- | :-- |",
        "| `session` | session | integer | 匿名 session id | group key、验证标签 key、submission key |",
        "| `events` | session | list | 按时间排序的事件序列 | session history、序列特征 |",
        "| `aid` | event | integer | item id | candidate id、item features、co-visitation entity |",
        "| `ts` | event | integer | 毫秒级时间戳 | 时间切分、recency、drift、co-visitation window |",
        "| `type` | event | string | `clicks`、`carts`、`orders` | target labels、权重、行为特征 |",
        "",
        "推荐事件级表结构：",
        "",
        "```text",
        "session:int64, aid:int64, ts:int64, type:string, event_idx:int32",
        "```",
        "",
        "## Session 长度",
        "",
        f"![Session 长度分布]({figure_dir_relative}/eda_session_length_hist.svg)",
        "",
        "| split | mean | p50 | p75 | p90 | p95 | p99 | max |",
        "| :-- | --: | --: | --: | --: | --: | --: | --: |",
    ]
    if train:
        lines.append(length_row("train", train))
    if test:
        lines.append(length_row("test", test))

    lines += [
        "",
        "特征影响：",
        "",
        "- 短 session 需要单独逻辑，因为历史行为太少，排序依据不足。",
        "- recent unique session items 应作为第一层 baseline source。",
        "- co-visitation 与特征任务要对超长 session 做截断或分批，避免长尾 runtime spike。",
        "",
        "## 行为类型分布",
        "",
        f"![行为类型分布]({figure_dir_relative}/eda_event_type_mix.svg)",
        "",
        "| split | clicks | carts | orders | clicks_ratio | carts_ratio | orders_ratio |",
        "| :-- | --: | --: | --: | --: | --: | --: |",
    ]
    if train:
        lines.append(type_row("train", train))
    if test:
        lines.append(type_row("test", test))

    lines += [
        "",
        "特征影响：",
        "",
        "- 指标必须按 target 单独汇报，weighted recall 可能掩盖局部退化。",
        "- orders 稀疏但高价值，需要单独检查 order-oriented candidate coverage。",
        "- event type 应是一等特征，而不是事后展示标签。",
        "",
        "## Session 级信号",
        "",
        f"![Session 级信号]({figure_dir_relative}/eda_session_signals.svg)",
        "",
        "| split | 包含 carts 的 sessions | 包含 orders 的 sessions | 重复 aid sessions | mean unique aids/session | p50 duration sec | p95 duration sec |",
        "| :-- | --: | --: | --: | --: | --: | --: |",
    ]
    if train:
        lines.append(session_signal_row("train", train))
    if test:
        lines.append(session_signal_row("test", test))

    lines += [
        "",
        "特征影响：",
        "",
        "- repeated-aid 行为支持 count、recency、last-seen-position 特征。",
        "- carts/orders presence 可用于定义 session intent segment。",
        "- session duration 与 time gap 可帮助区分快速浏览和深度购买意图。",
        "",
        "## 时间结构",
        "",
        f"![每日事件量]({figure_dir_relative}/eda_daily_event_volume.svg)",
        "",
        "train 与 test 是时间相邻窗口。这意味着随机验证不合适：它会泄漏未来热度，并高估模型泛化能力。本地验证应使用最近时间窗口，并把未来事件作为 label。",
        "",
        "## Item Popularity 与长尾",
        "",
        f"![Item popularity 长尾]({figure_dir_relative}/eda_item_popularity_loglog.svg)",
        "",
        "| split | unique aids | gini | top20 share | top100 share | top1000 share | one-event aid ratio | <=10-event aid ratio |",
        "| :-- | --: | --: | --: | --: | --: | --: | --: |",
    ]
    for split, stats in summary["splits"].items():
        pop = stats["popularity"]
        conc = pop["concentration"]
        lines.append(
            f"| {split} | {fmt_int(pop['unique_aids'])} | {pop['gini']:.4f} | "
            f"{fmt_pct(conc['top_20_event_share'])} | {fmt_pct(conc['top_100_event_share'])} | "
            f"{fmt_pct(conc['top_1000_event_share'])} | {fmt_pct(pop['one_event_aids_ratio'])} | "
            f"{fmt_pct(pop['le_10_event_aids_ratio'])} |"
        )

    if cross:
        lines += [
            "",
            "## Train/Test Item Overlap",
            "",
            "| metric | value |",
            "| :-- | --: |",
            f"| test aids seen in train | {fmt_pct(cross['test_aids_seen_in_train_ratio'])} |",
            f"| cold test aid ratio | {fmt_pct(cross['cold_test_aid_ratio'])} |",
            f"| cold test event ratio | {fmt_pct(cross['cold_test_event_ratio'])} |",
            f"| top100 train/test aid overlap | {cross['top_overlap']['top_100_intersection']} |",
            f"| top100 train/test Jaccard | {cross['top_overlap']['top_100_jaccard']:.4f} |",
            "",
            "特征影响：",
            "",
            "- popularity 与 co-visitation 可行，因为 test 交互 item 都在 train 里出现过。",
            "- rare item 仍需 fallback，尤其影响长尾覆盖与候选多样性。",
            "- recent popularity 应与 global popularity 对比，因为热门 item 会随时间漂移。",
        ]

    lines += [
        "",
        "## 序列行为",
        "",
        f"![行为类型转移热力图]({figure_dir_relative}/eda_type_transition_heatmap.svg)",
        "",
        f"![行为类型相对位置]({figure_dir_relative}/eda_type_position_deciles.svg)",
        "",
        "特征影响：",
        "",
        "- 转移统计支持 type-aware co-visitation，例如 click-to-cart 与 cart-to-order。",
        "- 相对位置可作为特征：最后几个事件通常比早期浏览噪声更重要。",
        "- 首尾 event type 分布有助于构建 session-intent features。",
        "",
        "## 洞察到实验的映射",
        "",
        "| 洞察 | 证据 | 特征或方法假设 | 实验 |",
        "| :-- | :-- | :-- | :-- |",
        "| 短 test session 需要可靠 fallback | test session length 明显短于 train | session history + target-specific popularity fallback | `B000`, `B001` |",
        "| 重复 item 是强 session 信号 | 大量 session 重复出现同一 `aid` | recent unique aids、session 内频次、last-seen position | `B001_session_history_baseline` |",
        "| orders 稀疏但权重高 | order ratio 低，metric weight 为 0.60 | 构建 order-specific candidates 与 features | `C000_target_candidates` |",
        "| popularity 长尾明显 | Gini 高，低频 item 多 | 使用 popularity fallback，但按 session length 与 tail bucket 评估 coverage | `B000_popularity_baseline` |",
        "| 时间顺序重要 | train/test 时间连续 | 使用 chronological validation 与 recent-window features | `V000_time_split` |",
        "| type transitions 携带意图 | click/cart/order 转移不对称 | 构建 type-aware co-visitation 与 transition features | `C000_covisit_baseline` |",
        "",
        "## 生成产物",
        "",
        "| 产物 | 路径 |",
        "| :-- | :-- |",
        "| 全量摘要 JSON | `reports/eda/full_eda_summary.json` |",
        "| split summary CSV | `reports/eda/split_summary.csv` |",
        "| top aids CSV | `reports/eda/top_aids_by_split.csv` |",
        "| EDA 图表 | `site/assets/figures/*.svg` |",
    ]
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--raw-archive", default="data/raw/recsys-dataset.zip")
    parser.add_argument("--output-root", default=".")
    parser.add_argument("--max-sessions", type=int, default=None)
    parser.add_argument("--members", nargs="*", default=["train", "test"], choices=["train", "test"])
    parser.add_argument("--progress-every", type=int, default=200_000)
    args = parser.parse_args()

    output_root = Path(args.output_root)
    report_dir = output_root / "reports" / "eda"
    figure_dir = output_root / "site" / "assets" / "figures"
    report_dir.mkdir(parents=True, exist_ok=True)
    figure_dir.mkdir(parents=True, exist_ok=True)

    member_map = {
        "train": "otto-recsys-train.jsonl",
        "test": "otto-recsys-test.jsonl",
    }
    stats_by_split: dict[str, SplitStats] = {}
    with zipfile.ZipFile(args.raw_archive) as archive:
        for split in args.members:
            stats_by_split[split] = process_member(
                archive,
                member_map[split],
                split,
                max_sessions=args.max_sessions,
                progress_every=args.progress_every,
            )

    summary = {
        "generated_at_utc": datetime.now(timezone.utc).isoformat(),
        "dataset": "kaggle:otto/recsys-dataset",
        "scope": "full" if args.max_sessions is None else f"first_{args.max_sessions}_sessions",
        "raw_archive_name": Path(args.raw_archive).name,
        "splits": {
            split: stats.to_summary()
            for split, stats in stats_by_split.items()
        },
    }
    derive_cross_split(summary, stats_by_split)
    generate_figures(summary, figure_dir)

    (report_dir / "full_eda_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    split_rows = []
    for split, stats in summary["splits"].items():
        split_rows.append(
            {
                "split": split,
                "sessions": stats["sessions"],
                "events": stats["events"],
                "unique_aids": stats["unique_aids"],
                "avg_session_len": stats["session_length"]["mean"],
                "p50_session_len": stats["session_length"]["p50"],
                "p95_session_len": stats["session_length"]["p95"],
                "clicks_ratio": stats["type_ratios"].get("clicks", 0),
                "carts_ratio": stats["type_ratios"].get("carts", 0),
                "orders_ratio": stats["type_ratios"].get("orders", 0),
                "repeated_aid_session_ratio": stats["sessions_with_repeated_aid_ratio"],
            }
        )
    write_csv(report_dir / "split_summary.csv", split_rows)

    top_rows = []
    for split, stats in summary["splits"].items():
        for rank, row in enumerate(stats["popularity"]["top_aids"], start=1):
            top_rows.append({"split": split, "rank": rank, **row})
    write_csv(report_dir / "top_aids_by_split.csv", top_rows)

    (output_root / "site" / "data_eda.md").write_text(
        build_markdown(summary),
        encoding="utf-8",
    )
    print(f"Wrote summary to {report_dir / 'full_eda_summary.json'}", flush=True)
    print(f"Wrote figures to {figure_dir}", flush=True)


if __name__ == "__main__":
    main()
