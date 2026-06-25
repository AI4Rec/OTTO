# OTTO 推荐系统复盘

<section class="home-shell">
  <section class="exec-board">
    <header class="exec-board__top">
      <div class="exec-board__title">
        <p class="exec-board__eyebrow">OTTO / Recommendation Program Board</p>
        <h2>多目标推荐项目驾驶舱</h2>
        <p class="exec-board__sub">North Star 公式、实验收益、阶段门、下一步决策。</p>
        <div class="exec-board__links">
          <a class="exec-link exec-link--primary" href="task_metric/">任务与指标</a>
          <a class="exec-link" href="data_eda/">数据与 EDA</a>
          <a class="exec-link" href="validation/">验证体系</a>
          <a class="exec-link" href="experiments/">实验看板</a>
        </div>
      </div>
      <div class="exec-board__summary">
        <article class="exec-summary-card">
          <span>North Star</span>
          <strong data-home-field="summary.north_star">weighted Recall@20</strong>
          <small>唯一业务目标</small>
        </article>
        <article class="exec-summary-card">
          <span>Current Best</span>
          <strong data-home-field="summary.best_run">Not Logged</strong>
          <small>当前最优正式 run</small>
        </article>
        <article class="exec-summary-card">
          <span>Current Phase</span>
          <strong data-home-field="summary.current_phase">Validation Setup</strong>
          <small>当前执行关口</small>
        </article>
        <article class="exec-summary-card">
          <span>Scored Runs</span>
          <strong data-home-field="summary.scored_runs">0</strong>
          <small>已完成正式回填</small>
        </article>
      </div>
    </header>

    <section class="exec-grid exec-grid--primary">
      <article class="exec-card exec-card--objective">
        <div class="exec-card__head">
          <div>
            <span class="exec-card__eyebrow">Business Objective</span>
            <strong>weighted Recall@20</strong>
          </div>
          <a class="exec-card__link" href="task_metric/">指标定义</a>
        </div>
        <div class="exec-formula">
          <p class="exec-formula__label">Objective Formula</p>
          <pre>score = 0.10 * recall_clicks@20
      + 0.30 * recall_carts@20
      + 0.60 * recall_orders@20</pre>
        </div>
        <div class="home-board-chart home-board-chart--weights" data-home-chart="objective-breakdown"></div>
        <div class="exec-objective-grid">
          <article class="exec-weight-card exec-weight-card--clicks">
            <span>0.10</span>
            <strong>clicks</strong>
            <p>保留浏览延续性，不作为主拉分项。</p>
          </article>
          <article class="exec-weight-card exec-weight-card--carts">
            <span>0.30</span>
            <strong>carts</strong>
            <p>连接浏览与购买，决定中段转化质量。</p>
          </article>
          <article class="exec-weight-card exec-weight-card--orders">
            <span>0.60</span>
            <strong>orders</strong>
            <p>核心拉分项，优先级最高。</p>
          </article>
        </div>
      </article>

      <article class="exec-card exec-card--trend">
        <div class="exec-card__head">
          <div>
            <span class="exec-card__eyebrow">Experiment Momentum</span>
            <strong>实验收益曲线</strong>
          </div>
          <a class="exec-card__link" href="experiments/">实验记录</a>
        </div>
        <p class="exec-card__meta">记录口径固定为 <code>clicks@20</code>、<code>carts@20</code>、<code>orders@20</code>、<code>weighted@20</code>、<code>delta_vs_prev</code>。</p>
        <div class="home-board-chart home-board-chart--trend" data-home-chart="experiment-trend"></div>
        <p class="exec-card__foot">正式 run 按 <code>V000</code> → <code>B000</code> → <code>B001</code> → <code>C000</code> 顺序进板。</p>
      </article>
    </section>

    <section class="exec-grid exec-grid--secondary">
      <article class="exec-card exec-card--gates">
        <div class="exec-card__head">
          <div>
            <span class="exec-card__eyebrow">Stage Gates</span>
            <strong>阶段门</strong>
          </div>
        </div>
        <div class="exec-gate-list" data-home-block="stage-gates"></div>
      </article>

      <article class="exec-card exec-card--ledger">
        <div class="exec-card__head">
          <div>
            <span class="exec-card__eyebrow">Run Ledger</span>
            <strong>实验账本</strong>
          </div>
        </div>
        <div class="exec-ledger" data-home-block="run-ledger"></div>
      </article>
    </section>

    <section class="exec-grid exec-grid--footer">
      <article class="exec-card">
        <div class="exec-card__head">
          <div>
            <span class="exec-card__eyebrow">Current Judgement</span>
            <strong>当前判断</strong>
          </div>
        </div>
        <ol class="exec-list" data-home-block="judgements"></ol>
      </article>

      <article class="exec-card">
        <div class="exec-card__head">
          <div>
            <span class="exec-card__eyebrow">Next Decisions</span>
            <strong>下一步</strong>
          </div>
        </div>
        <ol class="exec-list" data-home-block="next-actions"></ol>
      </article>
    </section>
  </section>

</section>
