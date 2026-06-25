const fs = require("fs");
const path = require("path");

const root = process.cwd();
const sourcePath = path.join(root, "reports/eda/full_eda_summary.json");
const outputDir = path.join(root, "site/assets/data");
const outputPath = path.join(outputDir, "eda_interactive.json");

const summary = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const splits = summary.splits;
const targetTypes = ["clicks", "carts", "orders"];
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const weekdayZh = {
  Monday: "周一",
  Tuesday: "周二",
  Wednesday: "周三",
  Thursday: "周四",
  Friday: "周五",
  Saturday: "周六",
  Sunday: "周日",
};

function parseBinStart(label) {
  return Number(label.split("-")[0].replace(/[^\d]/g, ""));
}

function orderedLengthBins() {
  const labels = new Set();
  for (const split of Object.values(splits)) {
    Object.keys(split.session_length_hist || {}).forEach((label) => labels.add(label));
  }
  return Array.from(labels).sort((a, b) => parseBinStart(a) - parseBinStart(b));
}

function withWeekday(row) {
  const date = new Date(`${row.date}T00:00:00Z`);
  const weekday = weekdays[(date.getUTCDay() + 6) % 7];
  return {
    ...row,
    weekday,
    weekday_zh: weekdayZh[weekday],
    order_ratio: row.total ? row.orders / row.total : 0,
    cart_ratio: row.total ? row.carts / row.total : 0,
    click_ratio: row.total ? row.clicks / row.total : 0,
  };
}

function weekdayAggregates(splitName) {
  const rows = (splits[splitName].daily_counts || [])
    .filter((row) => !(splitName === "train" && row.date === "2022-07-31"))
    .filter((row) => !(splitName === "test" && row.date === "2022-08-28"))
    .map(withWeekday);
  const byWeekday = new Map();
  for (const row of rows) {
    const bucket = byWeekday.get(row.weekday) || {
      weekday: row.weekday,
      weekday_zh: row.weekday_zh,
      days: 0,
      total: 0,
      clicks: 0,
      carts: 0,
      orders: 0,
    };
    bucket.days += 1;
    for (const key of ["total", "clicks", "carts", "orders"]) bucket[key] += row[key];
    byWeekday.set(row.weekday, bucket);
  }
  return weekdays
    .filter((weekday) => byWeekday.has(weekday))
    .map((weekday) => {
      const row = byWeekday.get(weekday);
      return {
        weekday,
        weekday_zh: row.weekday_zh,
        days: row.days,
        avg_total: Math.round(row.total / row.days),
        avg_clicks: Math.round(row.clicks / row.days),
        avg_carts: Math.round(row.carts / row.days),
        avg_orders: Math.round(row.orders / row.days),
        click_ratio: row.clicks / row.total,
        cart_ratio: row.carts / row.total,
        order_ratio: row.orders / row.total,
      };
    });
}

function transitionMatrix(splitName) {
  const counts = splits[splitName].transition_counts || {};
  return targetTypes.map((from) => {
    const rowTotal = targetTypes.reduce((sum, to) => sum + (counts[`${from}->${to}`] || 0), 0);
    return targetTypes.map((to) => {
      const count = counts[`${from}->${to}`] || 0;
      return { from, to, count, probability: rowTotal ? count / rowTotal : 0 };
    });
  });
}

function positionDeciles(splitName) {
  const raw = splits[splitName].position_deciles || {};
  return targetTypes.map((type) => {
    const counts = raw[type] || {};
    const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1;
    return {
      type,
      ratios: Array.from({ length: 10 }, (_, index) => (counts[String(index)] || 0) / total),
    };
  });
}

function popularityCurve(splitName) {
  return (splits[splitName].popularity.top_curve_counts || []).map((count, index) => [
    index + 1,
    count,
  ]);
}

const lengthBins = orderedLengthBins();
const payload = {
  generated_at_utc: summary.generated_at_utc,
  scope: summary.scope,
  splits: Object.fromEntries(
    Object.entries(splits).map(([name, split]) => [
      name,
      {
        sessions: split.sessions,
        events: split.events,
        unique_aids: split.unique_aids,
        daily_counts: (split.daily_counts || []).map(withWeekday),
        type_counts: split.type_counts,
        type_ratios: split.type_ratios,
        session_length: split.session_length,
        session_length_bins: lengthBins.map((label) => ({
          label,
          count: split.session_length_hist?.[label] || 0,
        })),
        session_signals: {
          carts: split.sessions_with_type_ratio?.carts || 0,
          orders: split.sessions_with_type_ratio?.orders || 0,
          repeated_aid: split.sessions_with_repeated_aid_ratio || 0,
        },
        popularity: {
          unique_aids: split.popularity.unique_aids,
          gini: split.popularity.gini,
          top_curve_counts: popularityCurve(name),
        },
        transition_matrix: transitionMatrix(name),
        position_deciles: positionDeciles(name),
        weekday: weekdayAggregates(name),
      },
    ]),
  ),
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(payload)}\n`);
console.log(`Wrote ${path.relative(root, outputPath)}`);
