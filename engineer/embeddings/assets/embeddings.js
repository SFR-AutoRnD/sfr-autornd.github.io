/* The benchmark tables are static; controls enhance the public chart when data is available. */
(async function () {
  'use strict';
  const source = new URL('results.json', document.currentScript.src);
  let data;
  try {
    const response = await fetch(source);
    if (!response.ok) return;
    data = await response.json();
    if (!Array.isArray(data.models) || !data.models.some(model => model.id === 'baseline')) return;
  } catch { return; }
  const models = Object.fromEntries(data.models.map(model => [model.id, model]));
  function signedDelta(value, digits) {
    return (value > 0 ? '+' : value < 0 ? '−' : '') + Math.abs(value).toFixed(digits);
  }

  const publicModels = data.models.filter(model => model.public);
  const publicButtons = [...document.querySelectorAll('[data-public-choice]')];
  function selectPublicMetric(metric) {
    const retrieval = metric === 'retrieval';
    publicButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.publicChoice === metric)));
    document.querySelectorAll('[data-chart-model]').forEach(row => {
      const score = models[row.dataset.chartModel].public[metric];
      row.querySelector('.score-number').textContent = score.toFixed(2);
      row.querySelector('.score-fill').style.setProperty('--score', score + '%');
      const delta = row.querySelector('.score-delta');
      if (delta) delta.textContent = '(' + signedDelta(score - models.baseline.public[metric], 2) + ')';
    });
    document.getElementById('public-chart-title').textContent = retrieval ? 'Retrieval quality' : 'Overall embedding quality';
    document.getElementById('public-chart-description').textContent = retrieval
      ? 'Mean nDCG@10 · 10 retrieval tasks · higher is better'
      : 'Mean task score · 41 MTEB tasks · higher is better';
    const rGain = models.R.public[metric] - models.baseline.public[metric];
    const pGain = models.P.public[metric] - models.baseline.public[metric];
    document.getElementById('public-gain').textContent = '+' + rGain.toFixed(2);
    document.getElementById('public-gain-description').textContent = retrieval
      ? 'points in mean retrieval nDCG@10.'
      : 'points in the 41-task MTEB mean.';
    document.getElementById('production-gain').textContent = '+' + pGain.toFixed(2) + ' points';
    document.getElementById('public-chart-status').textContent = (retrieval ? 'Retrieval' : 'Overall MTEB') + ' scores: ' + publicModels.map(model => model.name + ' ' + model.public[metric].toFixed(2) + (['R', 'P'].includes(model.id) ? ', change ' + signedDelta(model.public[metric] - models.baseline.public[metric], 2) + ' from Embedding Gemma 2' : '')).join('; ') + '.';
  }
  publicButtons.forEach(button => button.addEventListener('click', () => selectPublicMetric(button.dataset.publicChoice)));
  document.querySelector('[data-public-chart-controls]').hidden = false;

  // Animate the measured bar lengths once on entry; replay remains an explicit action.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const charts = [...document.querySelectorAll('[data-animate-chart]')];
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {threshold: 0.15}) : null;

  charts.forEach(chart => {
    const replay = chart.querySelector('[data-replay]');
    replay.hidden = reduceMotion.matches;
    if (!reduceMotion.matches && observer) {
      chart.dataset.motion = 'on';
      observer.observe(chart);
    }
    replay.addEventListener('click', () => {
      if (reduceMotion.matches) return;
      chart.dataset.motion = 'on';
      chart.classList.remove('is-visible');
      requestAnimationFrame(() => requestAnimationFrame(() => chart.classList.add('is-visible')));
    });
  });
  reduceMotion.addEventListener('change', () => {
    charts.forEach(chart => {
      chart.querySelector('[data-replay]').hidden = reduceMotion.matches;
      if (reduceMotion.matches) {
        delete chart.dataset.motion;
        chart.classList.add('is-visible');
        if (observer) observer.unobserve(chart);
      }
    });
  });
})();
