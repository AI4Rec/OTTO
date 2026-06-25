(function () {
  const scriptElement =
    document.currentScript || document.querySelector('script[src$="eda_charts.js"]');
  const scriptBase = scriptElement ? new URL(".", scriptElement.src) : new URL("assets/javascripts/", document.baseURI);
  const dataUrl = new URL("../data/eda_interactive.json", scriptBase).toString();
  let dataPromise = null;

  const colors = {
    train: "#334155",
    test: "#0f766e",
    clicks: "#2563eb",
    carts: "#d97706",
    orders: "#dc2626",
  };

  function fmtInt(value) {
    return Math.round(value).toLocaleString("en-US");
  }

  function fmtPct(value) {
    return `${(value * 100).toFixed(2)}%`;
  }

  function loadData() {
    if (!dataPromise) {
      dataPromise = fetch(dataUrl).then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${dataUrl}`);
        return response.json();
      });
    }
    return dataPromise;
  }

  function baseOptions(title, subtitle) {
    return {
      backgroundColor: "transparent",
      title: {
        text: title,
        subtext: subtitle,
        left: 12,
        top: 10,
        textStyle: { fontSize: 17, fontWeight: 700 },
        subtextStyle: { fontSize: 12 },
      },
      grid: { left: 64, right: 28, top: 88, bottom: 72 },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      legend: { top: 44, right: 16 },
      toolbox: {
        right: 16,
        top: 8,
        feature: { saveAsImage: {}, dataZoom: {}, restore: {} },
      },
    };
  }

  function dailyOptions(data) {
    const dates = Array.from(
      new Set(Object.values(data.splits).flatMap((split) => split.daily_counts.map((row) => row.date))),
    ).sort();
    const option = baseOptions("每日事件量", "hover 查看日期、星期与三类行为量；legend 可开关系列");
    return {
      ...option,
      tooltip: {
        trigger: "axis",
        formatter(params) {
          const date = params[0].axisValue;
          const rows = [];
          for (const splitName of ["train", "test"]) {
            const row = data.splits[splitName].daily_counts.find((item) => item.date === date);
            if (row) {
              rows.push(
                `<b>${splitName}</b> ${row.weekday_zh}<br/>total: ${fmtInt(row.total)}<br/>clicks: ${fmtInt(row.clicks)}<br/>carts: ${fmtInt(row.carts)}<br/>orders: ${fmtInt(row.orders)}<br/>order ratio: ${fmtPct(row.order_ratio)}`,
              );
            }
          }
          return `<b>${date}</b><br/>${rows.join("<br/><br/>")}`;
        },
      },
      xAxis: { type: "category", data: dates, axisLabel: { rotate: 35 } },
      yAxis: { type: "value", axisLabel: { formatter: (value) => fmtInt(value) } },
      dataZoom: [{ type: "inside" }, { type: "slider", bottom: 24 }],
      series: ["train", "test"].flatMap((splitName) =>
        ["total", "clicks", "carts", "orders"].map((metric) => ({
          name: `${splitName} ${metric}`,
          type: "line",
          smooth: true,
          showSymbol: false,
          emphasis: { focus: "series" },
          itemStyle: { color: metric === "total" ? colors[splitName] : colors[metric] },
          lineStyle: {
            width: metric === "total" ? 3 : 1.8,
            type: splitName === "train" ? "solid" : "dashed",
            opacity: metric === "total" ? 1 : 0.72,
          },
          data: dates.map((date) => {
            const row = data.splits[splitName].daily_counts.find((item) => item.date === date);
            return row ? row[metric] : null;
          }),
        })),
      ),
    };
  }

  function typeMixOptions(data) {
    const option = baseOptions("行为类型分布", "clicks 占频率大头，orders 占指标权重大头");
    return {
      ...option,
      tooltip: {
        trigger: "axis",
        formatter(params) {
          const splitName = params[0].axisValue;
          return params
            .map((p) => {
              const ratio = data.splits[splitName].type_ratios[p.seriesName];
              return `${p.marker}${p.seriesName}: ${fmtInt(p.value)} (${fmtPct(ratio)})`;
            })
            .join("<br/>");
        },
      },
      xAxis: { type: "category", data: ["train", "test"] },
      yAxis: { type: "value", axisLabel: { formatter: (value) => fmtInt(value) } },
      series: ["clicks", "carts", "orders"].map((type) => ({
        name: type,
        type: "bar",
        stack: "events",
        itemStyle: { color: colors[type] },
        data: ["train", "test"].map((splitName) => data.splits[splitName].type_counts[type]),
      })),
    };
  }

  function lengthOptions(data) {
    const bins = data.splits.train.session_length_bins.map((row) => row.label);
    const option = baseOptions("Session 长度分布", "test session 明显更短；支持区域缩放查看短 session");
    return {
      ...option,
      tooltip: {
        trigger: "axis",
        formatter(params) {
          return [`长度桶: <b>${params[0].axisValue}</b>`]
            .concat(params.map((p) => `${p.marker}${p.seriesName}: ${fmtInt(p.value)} sessions`))
            .join("<br/>");
        },
      },
      xAxis: { type: "category", data: bins, axisLabel: { rotate: 35 } },
      yAxis: { type: "log", logBase: 10, axisLabel: { formatter: (value) => fmtInt(value) } },
      dataZoom: [{ type: "inside" }, { type: "slider", bottom: 24 }],
      series: ["train", "test"].map((splitName) => ({
        name: splitName,
        type: "bar",
        itemStyle: { color: colors[splitName] },
        data: data.splits[splitName].session_length_bins.map((row) => row.count),
      })),
    };
  }

  function sessionSignalsOptions(data) {
    const option = baseOptions("Session 级信号", "含 carts/orders 与重复 aid 的 session 占比");
    const labels = ["包含 carts", "包含 orders", "重复 aid"];
    const keys = ["carts", "orders", "repeated_aid"];
    return {
      ...option,
      tooltip: { trigger: "axis", valueFormatter: (value) => fmtPct(value) },
      xAxis: { type: "category", data: labels },
      yAxis: { type: "value", axisLabel: { formatter: (value) => `${Math.round(value * 100)}%` } },
      series: ["train", "test"].map((splitName) => ({
        name: splitName,
        type: "bar",
        itemStyle: { color: colors[splitName] },
        data: keys.map((key) => data.splits[splitName].session_signals[key]),
      })),
    };
  }

  function weekdayOptions(data) {
    const rows = data.splits.train.weekday;
    const option = baseOptions("周几模式", "事件量高峰和成交强度不是同一个模式");
    return {
      ...option,
      tooltip: {
        trigger: "axis",
        formatter(params) {
          const row = rows[params[0].dataIndex];
          return `<b>${row.weekday_zh}</b><br/>avg events: ${fmtInt(row.avg_total)}<br/>avg orders: ${fmtInt(row.avg_orders)}<br/>order ratio: ${fmtPct(row.order_ratio)}<br/>cart ratio: ${fmtPct(row.cart_ratio)}`;
        },
      },
      xAxis: { type: "category", data: rows.map((row) => row.weekday_zh) },
      yAxis: [
        { type: "value", name: "events/day", axisLabel: { formatter: (value) => fmtInt(value) } },
        { type: "value", name: "ratio", axisLabel: { formatter: (value) => `${(value * 100).toFixed(1)}%` } },
      ],
      series: [
        {
          name: "avg events/day",
          type: "bar",
          itemStyle: { color: "#334155" },
          data: rows.map((row) => row.avg_total),
        },
        {
          name: "order ratio",
          type: "line",
          yAxisIndex: 1,
          itemStyle: { color: colors.orders },
          data: rows.map((row) => row.order_ratio),
        },
        {
          name: "cart ratio",
          type: "line",
          yAxisIndex: 1,
          itemStyle: { color: colors.carts },
          data: rows.map((row) => row.cart_ratio),
        },
      ],
    };
  }

  function popularityOptions(data) {
    const option = baseOptions("Item popularity 长尾", "log-log 视图；hover 查看 rank 与 event count");
    return {
      ...option,
      tooltip: {
        trigger: "axis",
        formatter(params) {
          return params
            .map((p) => `${p.marker}${p.seriesName}: rank ${fmtInt(p.value[0])}, count ${fmtInt(p.value[1])}`)
            .join("<br/>");
        },
      },
      xAxis: { type: "log", name: "rank", logBase: 10 },
      yAxis: { type: "log", name: "event count", logBase: 10 },
      dataZoom: [{ type: "inside" }, { type: "slider", bottom: 24 }],
      series: ["train", "test"].map((splitName) => ({
        name: splitName,
        type: "line",
        showSymbol: false,
        itemStyle: { color: colors[splitName] },
        data: data.splits[splitName].popularity.top_curve_counts,
      })),
    };
  }

  function transitionOptions(data) {
    const splitName = "train";
    const matrix = data.splits[splitName].transition_matrix;
    const cells = [];
    for (let row = 0; row < matrix.length; row += 1) {
      for (let col = 0; col < matrix[row].length; col += 1) {
        cells.push([col, row, matrix[row][col].probability, matrix[row][col].count]);
      }
    }
    return {
      ...baseOptions("行为类型转移热力图", "颜色表示条件概率，hover 显示 count 与 probability"),
      tooltip: {
        position: "top",
        formatter(params) {
          const from = ["clicks", "carts", "orders"][params.value[1]];
          const to = ["clicks", "carts", "orders"][params.value[0]];
          return `${from} -> ${to}<br/>count: ${fmtInt(params.value[3])}<br/>probability: ${fmtPct(params.value[2])}`;
        },
      },
      grid: { left: 90, right: 40, top: 95, bottom: 55 },
      xAxis: { type: "category", data: ["clicks", "carts", "orders"], splitArea: { show: true } },
      yAxis: { type: "category", data: ["clicks", "carts", "orders"], splitArea: { show: true } },
      visualMap: {
        min: 0,
        max: 1,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 8,
        inRange: { color: ["#eff6ff", "#60a5fa", "#1d4ed8"] },
      },
      series: [
        {
          name: "transition probability",
          type: "heatmap",
          data: cells,
          label: { show: true, formatter: (params) => fmtPct(params.value[2]) },
        },
      ],
    };
  }

  function positionOptions(data) {
    const option = baseOptions("行为类型相对位置", "orders 更集中在 session 后段");
    const x = Array.from({ length: 10 }, (_, index) => `${index * 10}-${(index + 1) * 10}%`);
    return {
      ...option,
      tooltip: { trigger: "axis", valueFormatter: (value) => fmtPct(value) },
      xAxis: { type: "category", data: x },
      yAxis: { type: "value", axisLabel: { formatter: (value) => `${Math.round(value * 100)}%` } },
      series: data.splits.train.position_deciles.map((row) => ({
        name: row.type,
        type: "line",
        smooth: true,
        itemStyle: { color: colors[row.type] },
        data: row.ratios,
      })),
    };
  }

  const renderers = {
    daily: dailyOptions,
    "type-mix": typeMixOptions,
    length: lengthOptions,
    signals: sessionSignalsOptions,
    weekday: weekdayOptions,
    popularity: popularityOptions,
    transition: transitionOptions,
    position: positionOptions,
  };

  async function renderCharts() {
    if (!window.echarts) return;
    const data = await loadData();
    document.querySelectorAll("[data-eda-chart]").forEach((element) => {
      const chartType = element.getAttribute("data-eda-chart");
      const getOptions = renderers[chartType];
      if (!getOptions) return;
      const instance = echarts.getInstanceByDom(element) || echarts.init(element);
      instance.setOption(getOptions(data), true);
      const resize = () => instance.resize();
      if (!element.dataset.resizeBound) {
        window.addEventListener("resize", resize);
        element.dataset.resizeBound = "1";
      }
    });
  }

  if (typeof document$ !== "undefined") {
    document$.subscribe(() => {
      renderCharts().catch((error) => console.error(error));
    });
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      renderCharts().catch((error) => console.error(error));
    });
  }
})();
