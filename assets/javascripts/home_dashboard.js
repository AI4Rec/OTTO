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
    benchmarkLine: "#a16207",
    benchmarkBand: "#1d4ed8",
    internalWeighted: "#1d4ed8",
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

  function fmtBenchmark(value) {
    return value == null ? "-" : Number(value).toFixed(3);
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

  function renderBenchmarks(data) {
    const element = document.querySelector('[data-home-block="benchmarks"]');
    if (!element || !Array.isArray(data.external_benchmarks)) return;
    element.innerHTML = data.external_benchmarks
      .map(
        (item) =>
          `<a class="exec-benchmark-pill exec-benchmark-pill--${escapeHtml(item.group)}" href="${escapeHtml(item.href)}" target="_blank" rel="noopener">` +
          `<span>${escapeHtml(item.short_label)}</span>` +
          `<strong>${escapeHtml(fmtBenchmark(item.score))}</strong>` +
          `<small>${escapeHtml(item.note)}</small>` +
          `</a>`,
      )
      .join("");
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

  function getTrendRange(data, internalScores) {
    const benchmarkScores = (data.external_benchmarks || [])
      .map((item) => item.score)
      .filter((value) => value != null);
    const ownScores = (internalScores || []).filter((value) => value != null);
    const allScores = [...benchmarkScores, ...ownScores];

    if (!allScores.length) {
      return { min: 0, max: 1 };
    }

    const minScore = Math.min(...allScores);
    const maxScore = Math.max(...allScores);
    const padding = Math.max(0.0025, (maxScore - minScore || 0.01) * 0.18);
    return {
      min: Number((minScore - padding).toFixed(4)),
      max: Number((maxScore + padding).toFixed(4)),
    };
  }

  function buildBenchmarkOverlay(data) {
    const benchmarks = data.external_benchmarks || [];
    const bandItems = benchmarks.filter((item) => item.group === "highscore_band");
    const referenceItems = benchmarks.filter((item) => item.group !== "highscore_band");

    const markLineData = referenceItems.map((item) => ({
      name: item.short_label,
      yAxis: item.score,
      lineStyle: {
        color: colors.benchmarkLine,
        type: "dashed",
        width: 1.6,
      },
      label: {
        formatter: `${item.short_label} ${fmtBenchmark(item.score)}`,
        position: "insideStartTop",
        color: colors.benchmarkLine,
        backgroundColor: "rgba(255, 247, 237, 0.96)",
        borderRadius: 6,
        padding: [4, 6],
      },
    }));

    let markArea = undefined;

    if (bandItems.length) {
      const bandScores = bandItems.map((item) => item.score);
      const bandMin = Math.min(...bandScores);
      const bandMax = Math.max(...bandScores);

      markArea = {
        silent: true,
        itemStyle: {
          color: "rgba(29, 78, 216, 0.06)",
        },
        label: {
          show: true,
          color: colors.benchmarkBand,
          fontWeight: 700,
          formatter: `开源高分带 ${fmtBenchmark(bandMin)} - ${fmtBenchmark(bandMax)}`,
        },
        data: [[{ yAxis: bandMin }, { yAxis: bandMax }]],
      };

      markLineData.push({
        name: "Open-source ceiling",
        yAxis: bandMax,
        lineStyle: {
          color: colors.benchmarkBand,
          width: 1.8,
        },
        label: {
          formatter: `天花板 ${fmtBenchmark(bandMax)}`,
          position: "insideStartTop",
          color: colors.benchmarkBand,
          backgroundColor: "rgba(239, 246, 255, 0.98)",
          borderRadius: 6,
          padding: [4, 6],
        },
      });
    }

    return {
      markArea,
      markLine: {
        silent: true,
        symbol: "none",
        lineStyle: {
          cap: "round",
        },
        data: markLineData,
      },
    };
  }

  function emptyTrendOptions(data) {
    const categories = data.experiment_history.map((item) => item.run_id);
    const range = getTrendRange(data, []);
    const overlay = buildBenchmarkOverlay(data);

    return {
      ...baseChartOptions(),
      grid: { left: 54, right: 26, top: 28, bottom: 40 },
      xAxis: {
        type: "category",
        data: categories,
        axisLine: { lineStyle: { color: "rgba(15, 23, 42, 0.16)" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        min: range.min,
        max: range.max,
        axisLabel: { formatter: (value) => Number(value).toFixed(3) },
        splitLine: { lineStyle: { color: "rgba(15, 23, 42, 0.08)" } },
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
          name: "internal_weighted",
          type: "line",
          data: categories.map(() => range.min),
          symbol: "none",
          lineStyle: { opacity: 0 },
          areaStyle: { opacity: 0 },
          emphasis: { disabled: true },
          markArea: overlay.markArea,
          markLine: overlay.markLine,
        },
      ],
      graphic: [
        {
          type: "group",
          left: "center",
          top: "44%",
          children: [
            {
              type: "text",
              style: {
                text: "内部正式 run 暂未回填",
                fill: "#0f172a",
                fontSize: 20,
                fontWeight: 700,
                textAlign: "center",
              },
            },
            {
              type: "text",
              top: 28,
              style: {
                text: "先用外部 benchmark 看天花板：rules-only 0.590，开源高分带 0.604 - 0.605",
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
    const overlay = buildBenchmarkOverlay(data);
    const range = getTrendRange(
      data,
      scored.map((item) => item.weighted),
    );

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
          min: range.min,
          max: range.max,
          axisLabel: { formatter: (value) => Number(value).toFixed(4) },
          splitLine: { lineStyle: { color: "rgba(15, 23, 42, 0.08)" } },
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
          itemStyle: { color: colors.internalWeighted },
          areaStyle: { color: "rgba(29, 78, 216, 0.08)" },
          data: scored.map((item) => item.weighted),
          markArea: overlay.markArea,
          markLine: overlay.markLine,
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
    renderBenchmarks(data);
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
