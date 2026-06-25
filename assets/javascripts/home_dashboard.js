(function () {
  const scriptElement =
    document.currentScript || document.querySelector('script[src$="home_dashboard.js"]');
  const scriptBase = scriptElement
    ? new URL(".", scriptElement.src)
    : new URL("assets/javascripts/", document.baseURI);
  const dataUrl = new URL("../data/home_dashboard.json", scriptBase).toString();
  let dataPromise = null;

  const colors = {
    clicks: "#64748b",
    carts: "#0f766e",
    orders: "#1d4ed8",
    planned: "#c0841a",
    running: "#2563eb",
    done: "#0f766e",
    blocked: "#b91c1c",
  };

  function loadData() {
    if (!dataPromise) {
      dataPromise = fetch(dataUrl).then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${dataUrl}`);
        return response.json();
      });
    }
    return dataPromise;
  }

  function getValueByPath(object, path) {
    return path.split(".").reduce((result, key) => (result ? result[key] : undefined), object);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatStatus(status) {
    const labels = {
      planned: "Planned",
      running: "Running",
      done: "Done",
      blocked: "Blocked",
    };
    return labels[status] || status;
  }

  function fmtScore(value) {
    return value == null ? "待回填" : Number(value).toFixed(5);
  }

  function hydrateSummary(data) {
    const scored = data.experiment_history.filter((item) => item.weighted != null);
    const bestRun = scored.reduce((best, current) => {
      if (!best) return current;
      return current.weighted > best.weighted ? current : best;
    }, null);
    const liveGate = data.stage_gates.find((gate) => gate.status !== "done");

    data.summary = {
      ...data.summary,
      best_run: bestRun ? `${bestRun.run_id} / ${fmtScore(bestRun.weighted)}` : "Formal Score Pending",
      current_phase: liveGate ? `${liveGate.id} · ${liveGate.title}` : data.summary.current_phase,
      scored_runs: scored.length,
    };
    return data;
  }

  function renderFields(data) {
    document.querySelectorAll("[data-home-field]").forEach((element) => {
      const value = getValueByPath(data, element.getAttribute("data-home-field"));
      if (value != null) element.textContent = value;
    });
  }

  function renderStageGates(data) {
    const element = document.querySelector('[data-home-block="stage-gates"]');
    if (!element) return;
    element.innerHTML = data.stage_gates
      .map(
        (gate) =>
          `<a class="exec-gate-card" href="${escapeHtml(gate.href)}">` +
          `<div class="exec-gate-card__top">` +
          `<span class="exec-gate-card__id">${escapeHtml(gate.id)}</span>` +
          `<span class="exec-status exec-status--${escapeHtml(gate.status)}">${escapeHtml(formatStatus(gate.status))}</span>` +
          `</div>` +
          `<strong>${escapeHtml(gate.title)}</strong>` +
          `<p>${escapeHtml(gate.detail)}</p>` +
          `</a>`,
      )
      .join("");
  }

  function renderLedger(data) {
    const element = document.querySelector('[data-home-block="run-ledger"]');
    if (!element) return;
    element.innerHTML =
      `<table class="exec-table">` +
      `<thead><tr>` +
      `<th>Run</th><th>Stage</th><th>Status</th><th>Metric</th><th>Best</th><th>Decision</th>` +
      `</tr></thead>` +
      `<tbody>` +
      data.ledger
        .map(
          (row) =>
            `<tr>` +
            `<td><a href="${escapeHtml(row.href)}"><strong>${escapeHtml(row.id)}</strong></a></td>` +
            `<td>${escapeHtml(row.stage)}</td>` +
            `<td><span class="exec-status exec-status--${escapeHtml(row.status)}">${escapeHtml(formatStatus(row.status))}</span></td>` +
            `<td>${escapeHtml(row.metric)}</td>` +
            `<td>${escapeHtml(row.best)}</td>` +
            `<td>${escapeHtml(row.decision)}</td>` +
            `</tr>`,
        )
        .join("") +
      `</tbody></table>`;
  }

  function renderList(blockName, items) {
    const element = document.querySelector(`[data-home-block="${blockName}"]`);
    if (!element) return;
    element.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  function baseChartOptions() {
    return {
      animationDuration: 450,
      backgroundColor: "transparent",
      textStyle: {
        fontFamily: '"Avenir Next", "Neue Haas Grotesk Text Pro", "PingFang SC", "Source Han Sans SC", sans-serif',
      },
    };
  }

  function objectiveOptions(data) {
    const components = data.objective.components.slice().sort((a, b) => b.weight - a.weight);
    return {
      ...baseChartOptions(),
      grid: { left: 8, right: 10, top: 8, bottom: 8, containLabel: true },
      xAxis: {
        type: "value",
        max: 0.65,
        axisLabel: { formatter: (value) => `${Math.round(value * 100)}%` },
        splitLine: { lineStyle: { color: "rgba(15, 23, 42, 0.08)" } },
      },
      yAxis: {
        type: "category",
        data: components.map((item) => item.name),
        axisTick: { show: false },
        axisLine: { show: false },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        formatter(params) {
          const item = components[params[0].dataIndex];
          return `<b>${escapeHtml(item.metric)}</b><br/>weight: ${(item.weight * 100).toFixed(0)}%`;
        },
      },
      series: [
        {
          type: "bar",
          barWidth: 16,
          data: components.map((item) => ({
            value: item.weight,
            itemStyle: {
              color: colors[item.name],
              borderRadius: [0, 8, 8, 0],
            },
          })),
          label: {
            show: true,
            position: "right",
            formatter: ({ value }) => `${(value * 100).toFixed(0)}%`,
            color: "#0f172a",
            fontWeight: 700,
          },
        },
      ],
    };
  }

  function emptyTrendOptions(data) {
    return {
      ...baseChartOptions(),
      grid: { left: 32, right: 20, top: 32, bottom: 44 },
      xAxis: {
        type: "category",
        data: data.experiment_history.map((item) => item.run_id),
        axisLine: { lineStyle: { color: "rgba(15, 23, 42, 0.16)" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 1,
        show: false,
      },
      tooltip: {
        trigger: "item",
        formatter(params) {
          const row = data.experiment_history[params.dataIndex];
          return `<b>${escapeHtml(row.run_id)} · ${escapeHtml(row.label)}</b><br/>stage: ${escapeHtml(row.stage)}<br/>status: ${escapeHtml(formatStatus(row.status))}<br/>next: ${escapeHtml(row.decision)}`;
        },
      },
      series: [
        {
          type: "scatter",
          symbolSize: 18,
          data: data.experiment_history.map((item) => 0.5),
          itemStyle: {
            color: (params) => colors[data.experiment_history[params.dataIndex].status] || colors.planned,
          },
        },
      ],
      graphic: [
        {
          type: "group",
          left: "center",
          top: "middle",
          children: [
            {
              type: "text",
              style: {
                text: "暂无正式 score 回填",
                fill: "#0f172a",
                fontSize: 22,
                fontWeight: 700,
                textAlign: "center",
              },
            },
            {
              type: "text",
              top: 30,
              style: {
                text: "V000 / B000 / B001 / C000 完成后，这里切换为 weighted@20 与 delta 曲线",
                fill: "#64748b",
                fontSize: 12,
                textAlign: "center",
              },
            },
          ],
        },
      ],
    };
  }

  function scoredTrendOptions(data) {
    const scored = data.experiment_history.filter((item) => item.weighted != null);
    return {
      ...baseChartOptions(),
      legend: { top: 0, right: 0 },
      grid: { left: 56, right: 36, top: 38, bottom: 42 },
      xAxis: {
        type: "category",
        data: scored.map((item) => item.run_id),
        axisTick: { show: false },
      },
      yAxis: [
        {
          type: "value",
          name: "weighted@20",
          axisLabel: { formatter: (value) => Number(value).toFixed(4) },
        },
        {
          type: "value",
          name: "delta",
          axisLabel: { formatter: (value) => Number(value).toFixed(4) },
        },
      ],
      tooltip: {
        trigger: "axis",
        formatter(params) {
          const row = scored[params[0].dataIndex];
          return [
            `<b>${escapeHtml(row.run_id)} · ${escapeHtml(row.label)}</b>`,
            `weighted@20: ${fmtScore(row.weighted)}`,
            `delta: ${fmtScore(row.delta)}`,
            `clicks@20: ${fmtScore(row.clicks)}`,
            `carts@20: ${fmtScore(row.carts)}`,
            `orders@20: ${fmtScore(row.orders)}`,
          ].join("<br/>");
        },
      },
      series: [
        {
          name: "weighted@20",
          type: "line",
          smooth: true,
          itemStyle: { color: "#1d4ed8" },
          areaStyle: { color: "rgba(29, 78, 216, 0.08)" },
          data: scored.map((item) => item.weighted),
        },
        {
          name: "delta",
          type: "bar",
          yAxisIndex: 1,
          itemStyle: {
            color: (params) => (params.value >= 0 ? "#0f766e" : "#b91c1c"),
            borderRadius: [6, 6, 0, 0],
          },
          data: scored.map((item) => item.delta || 0),
        },
      ],
    };
  }

  function renderCharts(data) {
    if (!window.echarts) return;
    document.querySelectorAll("[data-home-chart]").forEach((element) => {
      const kind = element.getAttribute("data-home-chart");
      const instance = echarts.getInstanceByDom(element) || echarts.init(element);
      if (kind === "objective-breakdown") {
        instance.setOption(objectiveOptions(data), true);
      } else if (kind === "experiment-trend") {
        const hasScores = data.experiment_history.some((item) => item.weighted != null);
        instance.setOption(hasScores ? scoredTrendOptions(data) : emptyTrendOptions(data), true);
      }
      if (!element.dataset.resizeBound) {
        window.addEventListener("resize", () => instance.resize());
        element.dataset.resizeBound = "1";
      }
    });
  }

  async function renderDashboard() {
    if (!document.querySelector(".exec-board")) return;
    const data = hydrateSummary(await loadData());
    renderFields(data);
    renderStageGates(data);
    renderLedger(data);
    renderList("judgements", data.judgements);
    renderList("next-actions", data["next_actions"]);
    renderCharts(data);
  }

  if (typeof document$ !== "undefined") {
    document$.subscribe(() => {
      renderDashboard().catch((error) => console.error(error));
    });
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      renderDashboard().catch((error) => console.error(error));
    });
  }
})();
