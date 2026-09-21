(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const svg = $('progress-chart');
  const wrap = $('chart-wrap');
  const picker = document.querySelector('.task-picker');
  const tabs = [...picker.querySelectorAll('[data-task]')];
  const chart = { width: 800, height: 430, left: 42, right: 18, top: 174, bottom: 36, max: 1 };
  const state = { data: null, task: null, metric: 'v', time: 24, playing: false, raf: 0, gainIndex: -2, visible: false, autoplay: true };
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const timeLabel = hours => {
    const minutes = Math.round(hours * 60);
    return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
  };
  const fixed = value => Number.isFinite(value) ? value.toFixed(3) : '—';
  const measured = value => Number.isFinite(value) ? Number(value.toPrecision(6)).toLocaleString('en-US', { maximumFractionDigits: 8 }) : '—';
  const deltaLabel = gain => `+${(gain.after - gain.before).toFixed(gain.after - gain.before >= .001 ? 3 : 6)} validation reward`;
  const x = time => chart.left + time / 24 * (chart.width - chart.left - chart.right);
  const y = value => chart.height - chart.bottom - (value / chart.max) * (chart.height - chart.top - chart.bottom);
  const valueAt = (points, time) => {
    let value = 0;
    for (const point of points) {
      if (point.t > time + 1e-8) break;
      if (Number.isFinite(point[state.metric])) value = point[state.metric];
    }
    return value;
  };

  function updatePlayButton() {
    $('replay-label').textContent = state.playing ? 'Pause replay' : state.time > 0 && state.time < 24 ? 'Resume replay' : 'Replay research';
    $('replay-icon').textContent = state.playing ? 'Ⅱ' : '▶';
    $('replay-button').setAttribute('aria-label', $('replay-label').textContent);
  }

  function stop() {
    state.playing = false;
    cancelAnimationFrame(state.raf);
    updatePlayButton();
  }

  function positionIdea() {
    const gain = state.task?.gains[state.gainIndex];
    const connector = $('idea-connector');
    const dot = $('idea-point');
    if (!gain) {
      if (connector) connector.style.opacity = '0';
      if (dot) dot.style.opacity = '0';
      return;
    }
    const popup = $('idea-popup');
    const anchor = x(gain.t);
    const maxLeft = Math.max(0, chart.width - popup.offsetWidth - 4);
    const left = Math.max(Math.min(chart.left, maxLeft), Math.min(maxLeft, anchor - popup.offsetWidth / 2));
    popup.style.left = `${Math.max(0, left)}px`;
    const originX = Math.max(left + 18, Math.min(left + popup.offsetWidth - 18, anchor));
    const originY = popup.offsetTop + popup.offsetHeight + 3;
    const valueY = y(valueAt(state.task.ours, gain.t));
    if (connector) {
      connector.setAttribute('d', `M${originX} ${originY}L${anchor} ${chart.top - 6}V${valueY}`);
      connector.style.opacity = '1';
    }
    if (dot) {
      dot.setAttribute('cx', anchor); dot.setAttribute('cy', valueY); dot.style.opacity = '1';
    }
  }

  function showIdea(index) {
    const gain = state.task.gains[index];
    state.gainIndex = index;
    $('idea-popup').hidden = !gain;
    $('replay-hint').hidden = Boolean(gain);
    $('idea-select').value = String(index);
    $('previous-idea').disabled = index <= 0;
    $('next-idea').disabled = index >= state.task.gains.length - 1;
    $('idea-count').textContent = gain ? `${index + 1} / ${state.task.gains.length}` : `${state.task.gains.length} ideas`;
    if (gain) {
      $('idea-time').textContent = `${timeLabel(gain.t)} · Checkpoint ${gain.checkpoint}`;
      $('idea-gain').textContent = gain.kind === 'remeasurement' ? 'Remeasured' : 'New validation best';
      $('idea-title').textContent = gain.title;
      $('idea-summary').textContent = gain.summary;
      $('idea-popup').classList.remove('is-arriving');
      if (state.playing && !motion.matches) {
        void $('idea-popup').offsetWidth;
        $('idea-popup').classList.add('is-arriving');
      }
    }
    positionIdea();
  }

  function renderFrame() {
    const visibleX = x(state.time);
    $('research-reveal')?.setAttribute('width', Math.max(0, visibleX - chart.left + 2));
    const cursor = $('playback-cursor');
    if (cursor) {
      cursor.setAttribute('x1', visibleX); cursor.setAttribute('x2', visibleX);
      cursor.style.opacity = state.time < 23.999 ? '1' : '0';
    }
    for (const [name, points] of [['ours', state.task.ours], ['baseline', state.task.baseline]]) {
      const dot = $(`endpoint-${name}`);
      if (dot) {
        dot.setAttribute('cx', x(state.time)); dot.setAttribute('cy', y(valueAt(points, state.time)));
        dot.style.opacity = state.time >= points[0].t ? '1' : '0';
      }
    }
    $('research-time').value = state.time;
    $('research-time-output').value = timeLabel(state.time);
    $('research-time').setAttribute('aria-valuetext', timeLabel(state.time));
    let index = -1;
    state.task.gains.forEach((gain, i) => { if (gain.t <= state.time + 1e-8) index = i; });
    if (index !== state.gainIndex) showIdea(index);
    else positionIdea();
    renderResult();
  }

  function renderResult() {
    const complete = state.time >= 24;
    const revealed = !$('result-reveal').hidden;
    $('result-pending').hidden = complete;
    $('result-reveal').hidden = !complete;
    $('result-panel').classList.toggle('is-complete', complete);
    if (complete && !revealed) {
      $('result-reveal').classList.remove('is-arriving');
      void $('result-reveal').offsetWidth;
      $('result-reveal').classList.add('is-arriving');
    }
    $('result-progress-ring').style.strokeDashoffset = String(100 - state.time / 24 * 100);
    $('result-pending-time').textContent = timeLabel(state.time);
  }

  function play() {
    if (!state.task) return;
    state.autoplay = false;
    if (state.playing) { stop(); return; }
    if (state.time >= 23.999) state.time = 0;
    state.playing = true;
    pointerLeave();
    updatePlayButton();
    let last = performance.now();
    let hold = 0;
    // Research time remains linear between checkpoints. Each new validation
    // best gets a reading pause; the measured timestamps never change.
    const frame = now => {
      if (!state.playing) return;
      const elapsed = Math.min(now - last, 100);
      last = now;
      if (hold > 0) hold = Math.max(0, hold - elapsed);
      else {
        const next = state.task.gains.find(gain => gain.t > state.time + 1e-8);
        const target = Math.min(24, state.time + elapsed * 24 / 12000);
        if (next && next.t <= target) { state.time = next.t; hold = 3000; }
        else state.time = target;
      }
      renderFrame();
      if (state.time >= 24) stop();
      else state.raf = requestAnimationFrame(frame);
    };
    renderFrame();
    state.raf = requestAnimationFrame(frame);
  }

  function stepPath(points, end) {
    let path = `M${x(0)} ${y(0)}`;
    let value = 0;
    for (const point of points) {
      if (point.t > end) break;
      if (!Number.isFinite(point[state.metric])) continue;
      path += `H${x(point.t)}V${y(point[state.metric])}`;
      value = point[state.metric];
    }
    return { path: `${path}H${x(end)}`, end, value };
  }

  function drawChart() {
    if (!state.task) return;
    chart.width = Math.max(220, wrap.clientWidth);
    chart.height = wrap.clientHeight;
    chart.left = chart.width < 400 ? 32 : 42;
    chart.right = chart.width < 400 ? 10 : 18;
    const max = Math.max(.15, ...[...state.task.ours, ...state.task.baseline].map(p => p[state.metric] || 0));
    chart.max = Math.min(1, Math.ceil((max + .025) * 10) / 10);
    svg.setAttribute('viewBox', `0 0 ${chart.width} ${chart.height}`);
    const ours = stepPath(state.task.ours, state.task.horizon);
    const baseline = stepPath(state.task.baseline, 24);
    const area = `${ours.path}L${x(ours.end)} ${y(0)}Z`;
    const held = state.task.horizon < 24 ? `<path id="held-continuation" d="M${x(ours.end)} ${y(ours.value)}H${x(24)}" fill="none" stroke="#0875d1" stroke-width="2.6" stroke-dasharray="8 5"/><text x="${x(14)}" y="${y(ours.value) - 10}" text-anchor="middle" fill="#0866b7" font-size="10">Final checkpoint held</text>` : '';
    let grid = '';
    for (let i = 0; i <= 4; i++) {
      const value = chart.max * i / 4;
      grid += `<line x1="${chart.left}" y1="${y(value)}" x2="${chart.width - chart.right}" y2="${y(value)}" stroke="#e7eef5" stroke-dasharray="${i ? '3 4' : '0'}"/><text x="${chart.left - 8}" y="${y(value) + 3}" text-anchor="end" fill="#526b84" font-size="10">${value.toFixed(2)}</text>`;
    }
    const ticks = chart.width < 450 ? [0, 6, 12, 18, 24] : [0, 4, 8, 12, 16, 20, 24];
    for (const hour of ticks) grid += `<text x="${x(hour)}" y="${chart.height - 14}" text-anchor="${hour === 0 ? 'start' : hour === 24 ? 'end' : 'middle'}" fill="#526b84" font-size="10">${hour}h</text>`;
    const dots = state.task.gains.map(gain => `<circle cx="${x(gain.t)}" cy="${y(valueAt(state.task.ours, gain.t))}" r="2.5" fill="#fff" stroke="#0875d1" stroke-width="1.3"/>`).join('');
    svg.innerHTML = `<title id="chart-title">${escape(state.task.short)}: ${state.metric === 'v' ? 'best validation reward' : 'hidden-test reward of the validation-selected checkpoint'}</title><desc id="chart-desc">Recorded step curves on a 24-hour axis. Blue: our Astra campaign. Dashed gray: published Terminus 2 using Astra. ${state.task.horizon < 24 ? 'Dashed blue holds the final local result after the 3.92-hour stop.' : ''} Explore every validation improvement using the idea selector and details button.</desc><defs><linearGradient id="research-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1083e4" stop-opacity=".13"/><stop offset="1" stop-color="#1083e4" stop-opacity=".015"/></linearGradient><clipPath id="research-clip"><rect id="research-reveal" x="${chart.left}" y="0" width="${chart.width}" height="${chart.height}"/></clipPath></defs>${grid}<g clip-path="url(#research-clip)"><path d="${area}" fill="url(#research-area)"/><path d="${baseline.path}" fill="none" stroke="#7188a2" stroke-width="2" stroke-dasharray="5 5" stroke-linejoin="round"/><path d="${ours.path}" fill="none" stroke="#0875d1" stroke-width="2.6" stroke-linejoin="round"/>${held}${dots}</g><path id="idea-connector" fill="none" stroke="#93bde0" stroke-width="1.2" stroke-dasharray="3 4"/><circle id="idea-point" r="6" fill="#fff" stroke="#0875d1" stroke-width="2.5"/><line id="playback-cursor" x1="${x(state.time)}" x2="${x(state.time)}" y1="${chart.top}" y2="${y(0)}" stroke="#3d94d8" stroke-opacity=".5" stroke-dasharray="3 4"/><circle id="endpoint-baseline" r="3.5" fill="#7188a2" stroke="#fff" stroke-width="1.5"/><circle id="endpoint-ours" r="4.5" fill="#0875d1" stroke="#fff" stroke-width="2"/><line id="hover-cursor" x1="0" x2="0" y1="${chart.top}" y2="${y(0)}" stroke="#57728e" stroke-width="1" stroke-dasharray="3 4" opacity="0"/>`;
    $('chart-subtitle').textContent = state.metric === 'v' ? 'Best validation reward · higher is better' : 'Hidden reward of the validation-selected solution · higher is better';
    $('chart-note').textContent = state.task.horizon < 24 ? 'Dashed blue: final result held after the 3.92h stop; no additional evaluations.' : 'Recorded checkpoints; rewards are held between evaluations.';
    renderFrame();
  }

  function renderTask(id, options = {}) {
    const task = state.data.tasks.find(t => t.id === id) || state.data.tasks[0];
    stop(); state.task = task;
    state.metric = task.kind === 'auarc' ? 'h' : 'v';
    state.autoplay = options.animate ?? state.autoplay;
    state.time = state.autoplay && !motion.matches ? 0 : 24; state.gainIndex = -2;
    tabs.forEach(tab => {
      const selected = tab.dataset.task === task.id;
      tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
    });
    $('task-panel').setAttribute('aria-labelledby', `tab-${task.id}`);
    $('task-title').textContent = task.title;
    $('task-goal').textContent = task.goal;
    $('task-source').href = task.source;
    $('metric-select').value = state.metric;
    $('result-gain').textContent = task.gain;
    $('result-gain-label').textContent = task.gainLabel;
    $('result-metric').textContent = task.metric;
    $('our-result').textContent = task.oursValue.toFixed(task.precision) + task.unit;
    $('baseline-result').textContent = task.baselineValue.toFixed(task.precision) + task.unit;
    const barMax = Math.max(task.oursValue, task.baselineValue);
    $('our-result-bar').style.width = `${task.oursValue / barMax * 100}%`;
    $('baseline-result-bar').style.width = `${task.baselineValue / barMax * 100}%`;
    const explanations = {
      'cpu-decoding': 'Speedup against the task reference. Higher is better.',
      'decoder-graphs': 'Our selected checkpoint vs. the published 24h result. Higher is better.',
      'sparse-embeddings': 'Recommendation ranking quality. At most eight nonzero values per item.',
      'subset-selection': 'Discrepancy measures uneven coverage. Lower is better.'
    };
    $('metric-explanation').textContent = explanations[task.id] || 'Average hidden-test reward across 24 hours. Earlier improvements count for longer.';
    $('idea-select').innerHTML = '<option value="-1" disabled>Explore an improvement</option>' + task.gains.map((gain, i) => `<option value="${i}">${timeLabel(gain.t)} — ${escape(gain.title)}</option>`).join('');
    $('idea-select').disabled = false;
    pointerLeave();
    $('selection-status').textContent = `${task.short}. ${task.gain} ${task.gainLabel}. ${task.gains.length} recorded improvements to explore.`;
    drawChart(); updatePlayButton();
    if (options.updateHash) history.replaceState(null, '', `#${task.id}`);
    if (state.autoplay && state.visible && !motion.matches) play();
  }

  function goToIdea(index) {
    const gain = state.task?.gains[index];
    if (!gain) return;
    state.autoplay = false; stop(); pointerLeave();
    state.time = gain.t; renderFrame(); updatePlayButton();
    $('selection-status').textContent = `${timeLabel(gain.t)}. ${gain.title}. Use Explore this idea for details.`;
  }

  function openDetails() {
    const gain = state.task.gains[state.gainIndex];
    if (!gain) return;
    stop();
    const rawMetrics = {
      'cpu-decoding': ['Validation speedup', 'Hidden-test speedup', '×'],
      'decoder-graphs': ['Validation speedup', 'Hidden-test speedup', '×'],
      'sparse-embeddings': ['Validation nDCG', 'Hidden-test nDCG', ''],
      'subset-selection': ['Validation discrepancy', 'Hidden-test discrepancy', ''],
      'categorical-learning': ['Validation AUC', 'Hidden-test AUC', ''],
      'covariance': ['Validation error', 'Hidden-test error', '']
    };
    const [validationLabel, hiddenLabel, unit] = rawMetrics[state.task.id];
    $('detail-context').textContent = `${state.task.short} · ${timeLabel(gain.t)} · Checkpoint ${gain.checkpoint}`;
    $('detail-title').textContent = gain.title;
    $('detail-summary').textContent = gain.summary;
    $('detail-explanation').textContent = gain.detail;
    const rewardPrecision = gain.after - gain.before < .001 ? 6 : 3;
    $('detail-measurements').innerHTML = `<div><dt>Validation reward</dt><dd>${gain.before.toFixed(rewardPrecision)} <span aria-hidden="true">→</span><span class="sr-only">to</span> ${gain.after.toFixed(rewardPrecision)}</dd><small>${escape(deltaLabel(gain))}</small></div><div><dt>${validationLabel}</dt><dd>${measured(gain.rawValidation)}${unit}</dd></div><div><dt>${hiddenLabel}</dt><dd>${measured(gain.rawTest)}${unit}</dd></div>`;
    $('detail-note').textContent = gain.kind === 'remeasurement' ? 'This is a recorded remeasurement. A higher timing result alone does not establish a new algorithmic improvement.' : 'The measurement covers the cumulative implementation at this checkpoint; it does not isolate the contribution of this change from all earlier work.';
    $('detail-source').href = state.task.source;
    $('idea-dialog').showModal();
  }

  function pointerMove(event) {
    if (!state.task || event.pointerType === 'touch' || state.playing) return;
    const rect = svg.getBoundingClientRect();
    if (event.clientY - rect.top < chart.top) { pointerLeave(); return; }
    const position = Math.max(chart.left, Math.min(chart.width - chart.right, event.clientX - rect.left));
    const time = (position - chart.left) / (chart.width - chart.left - chart.right) * 24;
    const cursor = $('hover-cursor');
    cursor.setAttribute('x1', position); cursor.setAttribute('x2', position); cursor.setAttribute('opacity', '1');
    const tooltip = $('chart-tooltip');
    const ours = fixed(valueAt(state.task.ours, time)) + (time > state.task.horizon ? ' · held final result' : '');
    tooltip.innerHTML = `<strong>${timeLabel(time)} into research</strong><div class="tooltip-row is-ours"><span>Our campaign</span><b>${ours}</b></div><div class="tooltip-row"><span>Published Astra</span><b>${fixed(valueAt(state.task.baseline, time))}</b></div>`;
    tooltip.hidden = false;
    tooltip.style.left = `${Math.max(0, Math.min(wrap.clientWidth - tooltip.offsetWidth, position + 12))}px`;
    tooltip.style.top = `${Math.max(chart.top, Math.min(chart.height - tooltip.offsetHeight - 5, event.clientY - rect.top - tooltip.offsetHeight - 15))}px`;
  }
  function pointerLeave() {
    $('chart-tooltip').hidden = true; $('hover-cursor')?.setAttribute('opacity', '0');
  }

  const runIcons = {
    documents: '<rect x="5" y="4" width="12" height="16" rx="2"/><path d="M9 8h4M9 12h4M9 16h2M17 7h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9"/>',
    table: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 3v18M15 9v6M9 15h6"/><path d="m16 18 2 2 4-5"/>',
    control: '<path d="M3 15h4l3-9 4 13 3-8h4"/><circle cx="3" cy="15" r="1.5"/><circle cx="21" cy="11" r="1.5"/>',
    branch: '<rect x="9" y="2" width="6" height="5" rx="1"/><rect x="2" y="17" width="6" height="5" rx="1"/><rect x="16" y="17" width="6" height="5" rx="1"/><path d="M12 7v5H5v5M12 12h7v5"/>'
  };
  const runIcon = task => `<svg viewBox="0 0 24 26" aria-hidden="true">${runIcons[task.icon] || runIcons.table}</svg>`;
  const runMetric = (task, value) => (value * task.multiplier).toLocaleString('en-US', { maximumFractionDigits: task.unit === '%' ? 1 : task.precision, minimumFractionDigits: task.unit === '%' ? 0 : task.precision }) + task.unit;
  const matchLabel = task => Math.abs(task.relativeDifferencePercent) < 1e-8 ? 'Matched Astra' : `Within ${Math.abs(task.relativeDifferencePercent).toFixed(1)}%`;

  function sparkline(task) {
    const width = 220, height = 48, pad = 3;
    const max = Math.max(.1, ...task.oursCurve.map(p => p.v));
    const sx = time => pad + time / 24 * (width - pad * 2);
    const sy = value => height - pad - value / max * (height - pad * 2);
    let path = `M${sx(0)} ${sy(0)}`;
    let value = 0;
    for (const point of task.oursCurve) {
      path += `H${sx(point.t)}V${sy(point.v)}`;
      value = point.v;
    }
    path += `H${sx(24)}`;
    return `<svg class="near-sparkline" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(task.short)}: recorded validation progress over 24 hours"><path d="${path}L${sx(24)} ${sy(0)}Z" fill="currentColor" opacity=".06"/><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><circle cx="${sx(24)}" cy="${sy(value)}" r="2.5" fill="currentColor"/></svg>`;
  }

  function renderRunCards() {
    $('near-tie-tasks').innerHTML = state.data.nearTies.tasks.map(task => `<li><button type="button" class="near-story" data-run="${escape(task.slug)}" aria-haspopup="dialog" aria-controls="run-dialog"><span class="near-card-top"><span class="near-card-icon">${runIcon(task)}</span><span class="near-match">${escape(matchLabel(task))}</span></span><strong class="near-card-title">${escape(task.short)}</strong><span class="near-card-teaser">${escape(task.teaser)}</span><span class="near-card-progress">${sparkline(task)}<span>Validation progress <span>0–24h</span></span></span><span class="near-card-meta"><b>${task.checkpoints}</b> checkpoints <span aria-hidden="true">·</span> <b>${task.gains.length}</b> improvements</span><span class="near-card-cta">Explore the ideas <span aria-hidden="true">→</span></span></button></li>`).join('');
  }

  function openRun(slug) {
    const task = state.data.nearTies.tasks.find(task => task.slug === slug);
    if (!task) return;
    stop();
    $('run-icon').innerHTML = runIcon(task);
    $('run-task-name').textContent = task.short;
    $('run-title').textContent = task.approach;
    $('run-goal').textContent = task.goal;
    $('run-checkpoints').textContent = task.checkpoints;
    $('run-gains').textContent = task.gains.length;
    $('run-metric').textContent = task.metric;
    $('run-ours').textContent = runMetric(task, task.ours);
    $('run-baseline').textContent = runMetric(task, task.publishedAstra);
    $('run-match').textContent = Math.abs(task.relativeDifferencePercent) < 1e-8 ? 'Matched the published final result.' : `Within ${Math.abs(task.relativeDifferencePercent).toFixed(1)}% of the published final result.`;
    $('run-direction').textContent = task.direction === 'lower' ? 'Lower is better.' : 'Higher is better.';
    $('run-source').href = task.source;
    $('run-steps').innerHTML = task.gains.map((gain, i) => `<details class="run-step" name="run-improvement"${i === 0 ? ' open' : ''}><summary><span class="run-step-dot" aria-hidden="true"></span><span><small>${timeLabel(gain.t)} · Checkpoint ${gain.checkpoint}</small><strong>${escape(gain.title)}</strong></span><span class="run-step-toggle" aria-hidden="true">+</span></summary><div class="run-step-body"><p>${escape(gain.detail)}</p><div class="run-step-measure"><span>Validation ${escape(task.metric)}</span><strong><span>${runMetric(task, gain.before)}</span> <span aria-hidden="true">→</span><span class="sr-only">to</span> ${runMetric(task, gain.after)}</strong></div></div></details>`).join('');
    $('run-dialog').showModal();
    $('run-dialog').scrollTop = 0;
  }

  picker.addEventListener('click', event => {
    const tab = event.target.closest('[data-task]');
    if (tab && state.data) renderTask(tab.dataset.task, { updateHash: true, animate: true });
  });
  picker.addEventListener('keydown', event => {
    const index = tabs.indexOf(document.activeElement);
    if (index < 0 || !state.data) return;
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault(); tabs[next].focus(); renderTask(tabs[next].dataset.task, { updateHash: true, animate: true });
  });
  $('replay-button').addEventListener('click', play);
  $('show-result').addEventListener('click', () => {
    state.autoplay = false; stop(); state.time = 24; renderFrame(); updatePlayButton();
    $('selection-status').textContent = `${state.task.short}: ${state.task.gain} ${state.task.gainLabel}. Final comparison revealed.`;
  });
  $('restart-replay').addEventListener('click', () => { stop(); state.time = 0; play(); });
  $('research-time').addEventListener('input', event => { state.autoplay = false; stop(); state.time = Number(event.target.value); renderFrame(); updatePlayButton(); });
  $('metric-select').addEventListener('change', event => { state.autoplay = false; stop(); state.metric = event.target.value; pointerLeave(); drawChart(); });
  $('idea-select').addEventListener('change', event => goToIdea(Number(event.target.value)));
  $('previous-idea').addEventListener('click', () => goToIdea(state.gainIndex - 1));
  $('next-idea').addEventListener('click', () => goToIdea(state.gainIndex + 1));
  $('idea-details').addEventListener('click', openDetails);
  $('idea-popup').addEventListener('pointerenter', event => { if (event.pointerType !== 'touch' && state.playing) stop(); });
  $('idea-popup').addEventListener('focusin', () => { if (state.playing) stop(); });
  $('near-tie-tasks').addEventListener('click', event => {
    const button = event.target.closest('[data-run]');
    if (button && state.data) openRun(button.dataset.run);
  });
  $('run-dialog').addEventListener('click', event => {
    if (event.target !== $('run-dialog')) return;
    const rect = event.target.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close();
  });
  $('idea-dialog').addEventListener('click', event => {
    if (event.target !== $('idea-dialog')) return;
    const rect = event.target.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.target.close();
  });
  svg.addEventListener('pointermove', pointerMove);
  svg.addEventListener('pointerleave', pointerLeave);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  window.addEventListener('hashchange', () => { if (state.data) renderTask(location.hash.slice(1), { animate: false }); });
  motion.addEventListener('change', () => { if (motion.matches && state.task) { stop(); state.time = 24; renderFrame(); updatePlayButton(); } });
  new ResizeObserver(drawChart).observe(wrap);
  const visibility = new IntersectionObserver(entries => {
    state.visible = entries[0].isIntersecting;
    if (!state.visible && state.playing) stop();
    if (state.visible && state.task && state.autoplay && !motion.matches) play();
  }, { threshold: .4 });

  fetch('assets/results.json').then(response => {
    if (!response.ok) throw new Error('Results unavailable');
    return response.json();
  }).then(data => {
    state.data = data;
    $('loading-note').hidden = true;
    $('replay-button').disabled = false;
    $('restart-replay').disabled = false;
    $('research-time').disabled = false;
    renderRunCards();
    renderTask(location.hash.slice(1) || data.tasks[0].id);
    visibility.observe(wrap);
  }).catch(error => {
    console.error('Benchmark page:', error);
    $('loading-note').hidden = false;
    $('loading-note').textContent = 'The interactive results could not load. Refresh the page to try again.';
  });
})();
