# OTTO 推荐系统复盘

<section class="home-shell">
  <section class="home-hero">
    <div class="home-hero__main">
      <p class="home-hero__eyebrow">Kaggle · OTTO Recommender System</p>
      <h2>会话级多目标推荐系统复盘</h2>
      <p class="home-hero__lede">给定被截断的 <code>session</code>，分别预测未来的 <code>clicks</code>、<code>carts</code>、<code>orders</code>。官方指标是 weighted <code>Recall@20</code>，其中 <code>orders</code> 权重最高。</p>
      <div class="home-hero__actions">
        <a class="home-chip home-chip--primary" href="task_metric/">任务与指标</a>
        <a class="home-chip" href="data_eda/">数据与 EDA</a>
        <a class="home-chip" href="validation/">验证体系</a>
        <a class="home-chip" href="methods/">方法路线</a>
      </div>
    </div>
    <div class="home-hero__stats">
      <div class="home-kpi">
        <span>Train Sessions</span>
        <b>12.9M</b>
        <small>训练会话</small>
      </div>
      <div class="home-kpi">
        <span>Train Events</span>
        <b>216.7M</b>
        <small>训练事件</small>
      </div>
      <div class="home-kpi">
        <span>Targets</span>
        <b>3</b>
        <small>clicks / carts / orders</small>
      </div>
      <div class="home-kpi">
        <span>Metric</span>
        <b>Recall@20</b>
        <small>official weighted metric</small>
      </div>
    </div>
  </section>

  <section class="home-strip">
    <article class="home-strip-card">
      <span class="home-strip-card__label">任务本质</span>
      <strong>多目标、短会话、时间漂移同时存在。</strong>
      <p><code>orders</code> 稀疏但权重最高，不能只追点击。</p>
    </article>
    <article class="home-strip-card">
      <span class="home-strip-card__label">当前状态</span>
      <strong>EDA 已完成。</strong>
      <p>验证闭环、标签构建与 baseline 还在执行中。</p>
    </article>
    <article class="home-strip-card">
      <span class="home-strip-card__label">下一步</span>
      <strong>时间切分 -> 标签生成 -> baseline</strong>
      <p>先完成 popularity 与 session history，再扩展候选召回。</p>
    </article>
  </section>

  <section class="home-nav">
    <a class="home-nav-card" href="task_metric/">
      <span class="home-nav-card__tag">01</span>
      <strong>任务与指标</strong>
      <p>目标定义、Recall@20、三种行为的业务语义。</p>
    </a>
    <a class="home-nav-card" href="data_eda/">
      <span class="home-nav-card__tag">02</span>
      <strong>数据与 EDA</strong>
      <p>字段口径、时间结构、长尾、短会话与关键分布。</p>
    </a>
    <a class="home-nav-card" href="validation/">
      <span class="home-nav-card__tag">03</span>
      <strong>验证体系</strong>
      <p>时间切分、标签生成、指标检查与泄漏风险。</p>
    </a>
    <a class="home-nav-card" href="methods/">
      <span class="home-nav-card__tag">04</span>
      <strong>方法路线</strong>
      <p>基线、候选召回、特征工程、排序与消融设计。</p>
    </a>
    <a class="home-nav-card" href="experiments/">
      <span class="home-nav-card__tag">05</span>
      <strong>实验看板</strong>
      <p>实验编号、假设、主指标、结论与后续动作。</p>
    </a>
    <a class="home-nav-card" href="engineering/">
      <span class="home-nav-card__tag">06</span>
      <strong>工程规范</strong>
      <p>目录契约、发布检查、可复现要求与协作边界。</p>
    </a>
  </section>

</section>
