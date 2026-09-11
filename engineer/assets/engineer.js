/* Illustrated research process and complete, selectable research records. */
(function () {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const findings = document.getElementById('findings');
  if (findings) {
    const projects = Array.from(findings.querySelectorAll('[data-finding-panel]'));
    const choices = Array.from(findings.querySelectorAll('[data-finding-choice]'));
    const selectedOptimizations = new Map();
    let selectedProject = 'pandas';
    let scrollFrame = null;

    function selectOptimization(project, id) {
      const panels = Array.from(project.querySelectorAll('[data-optimization-panel]'));
      if (!panels.length) return;
      const selected = panels.find(panel => panel.id === id) || panels[0];
      selectedOptimizations.set(project.id, selected.id);
      panels.forEach(panel => {panel.hidden = panel !== selected;});
      project.querySelectorAll('[data-optimization-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.optimizationChoice === selected.id)));
    }
    function selectProject(id) {
      const selected = projects.find(project => project.id === id) || projects[0];
      selectedProject = selected.id;
      projects.forEach(project => {project.hidden = project !== selected;});
      choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.findingChoice === selected.id)));
      selectOptimization(selected, selectedOptimizations.get(selected.id));
    }
    choices.forEach(button => button.addEventListener('click', () => selectProject(button.dataset.findingChoice)));
    projects.forEach(project => {
      project.querySelectorAll('[data-optimization-choice]').forEach(button => button.addEventListener('click', () => selectOptimization(project, button.dataset.optimizationChoice)));
    });
    function revealFinding(hash) {
      if (!hash || hash === '#') return;
      let id;
      try {id = decodeURIComponent(hash.slice(1));} catch (_) {return;}
      const target = id === 'takeaways' ? findings.querySelector('.section-title') : document.getElementById(id);
      if (!target || !findings.contains(target)) return;
      const project = target.closest('[data-finding-panel]');
      if (project) {
        selectProject(project.id);
        const optimization = target.closest('[data-optimization-panel]');
        if (optimization) selectOptimization(project, optimization.id);
      }
      for (let element = target; element && element !== findings; element = element.parentElement) {
        if (element.tagName === 'DETAILS') element.open = true;
      }
      if (scrollFrame !== null) cancelAnimationFrame(scrollFrame);
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = null;
        target.scrollIntoView({block: 'start', behavior: 'auto'});
        const focusTarget = target.matches('[data-finding-panel]') ? target.querySelector('h3') : target.matches('[data-optimization-panel]') ? target.querySelector('h4') : target;
        if (!focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
        focusTarget.focus({preventScroll: true});
      });
    }
    window.addEventListener('hashchange', () => revealFinding(window.location.hash));
    document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (href.startsWith('#') && href === window.location.hash) revealFinding(href);
    });
    projects.forEach(project => selectOptimization(project));
    selectProject(selectedProject);
    findings.querySelectorAll('[data-findings-picker], [data-optimization-picker]').forEach(element => {element.hidden = false;});
    revealFinding(window.location.hash);
  }

  const lab = document.querySelector('[data-discovery-lab]');
  if (!lab) return;
  const studies = {
    hnswlib: {
      label: 'hnswlib · worker leases', finding: '#hnswlib', code: 'https://github.com/nmslib/hnswlib/pull/676',
      titles: ['Trace the repeated borrowing.', 'Give each worker a longer-lived lease.', 'Put baseline and candidate side by side.', 'Less coordination. A measured gain.'],
      descriptions: [
        'Engineer identifies shared-pool locking around every query. The opportunity is repeated coordination, with search arithmetic left unchanged.',
        'It proposes one scratch-memory lease per worker for the whole batch, then implements it with fresh visited state for every query.',
        'It alternates baseline and candidate across independently built indexes, retaining noisy runs as part of the comparison.',
        'It checks outputs and scratch-state safety, then packages the patch with the measurements that support the gain.'
      ],
      diagramLabels: ['Inspect: each query borrows scratch memory from a shared pool and returns it afterward.', 'Hypothesis: one worker holds its own scratch-memory lease across the batch. Each query gets fresh visited state.'],
      value: '+4.1%', unit: 'more queries / second', scope: 'Median across three independently built indexes; exploratory A/B result.',
      correctness: 'Identical output hashes; fresh visited state, exclusive ownership, and exception recovery checked.',
      measurement: 'All 31 timed repetitions retained. Per-build gains: 3.96%, 4.12%, and 4.34%.',
      ratio: 1.0412, ratioLabel: '1.041×', comparisonLabel: 'Normalized query throughput', comparisonNote: 'Median across three independent index builds.'
    },
    pandas: {
      label: 'pandas · nullable buffer views', finding: '#pandas-nullable', code: 'https://github.com/pandas-dev/pandas/pull/68422',
      titles: ['Find the allocation hiding in the hot path.', 'Change the view, preserve the kernel.', 'Test the idea across the workload matrix.', 'A faster method, with its proof.'],
      descriptions: [
        'Engineer traces row-wise reductions and identifies a throwaway row-label array allocated for every element in the frame.',
        'It proposes compatible views of the existing data and mask, then builds a guarded patch that keeps the numerical kernel and reduction order.',
        'It pairs baseline and candidate on fixed hardware and inputs, alternating run order across reductions, nullable dtypes, and frame shapes.',
        'It checks values, masks, dtypes, and exceptions, then keeps the guarded patch with its benchmark record and technical report.'
      ],
      diagramLabels: ['Inspect: data and mask buffers require a large temporary row-label array before the grouped reduction kernel.', 'Hypothesis: compatible views of the existing data and mask remove the large row-label array; the numerical kernel stays the same.'],
      value: '1.38×', unit: 'median reduction speedup', scope: 'Up to 1.84× across 40 benchmark cells; the full range is 1.22–1.84×.',
      correctness: '134,064 differential cases for this optimization. Zero differences in values, masks, dtypes, or exceptions.',
      measurement: 'Paired, CPU-pinned measurements. Every bootstrap interval is above parity.',
      ratio: 1.38, ratioLabel: '1.38×', comparisonLabel: 'Median reduction speedup', comparisonNote: '40 benchmark cells · four operations · five dtypes · two shapes.'
    },
    usearch: {
      label: 'USearch · norm caching', finding: '#usearch', code: 'https://github.com/unum-cloud/USearch/pull/787',
      titles: ['Spot the arithmetic that repeats.', 'Calculate once, then reuse.', 'Compare the same search workload.', 'More queries from the same core.'],
      descriptions: [
        'Engineer identifies vector norms recalculated during cosine comparisons, even though stored vectors have not changed.',
        'It proposes caching each stored norm and computing the query norm once, then implements reuse within the existing graph traversal.',
        'It runs both binaries on the same graph and held-out queries, repeating paired comparisons with two compilers.',
        'It verifies preserved recall and measures numerical differences, then delivers the cache with compiler-specific benchmark evidence.'
      ],
      diagramLabels: ['Inspect: each cosine comparison recalculates vector norms as the query visits stored vectors.', 'Hypothesis: compute the query norm once and reuse a cached norm for each stored vector. The graph traversal stays the same.'],
      value: '+17.5%', unit: 'more queries / second', scope: 'GCC 11.4 · one pinned core · Wiki-1M. GCC 13.4 also improves, by 7.4%.',
      correctness: 'Recall preserved across 10,240 top-10 outputs. Maximum distance change: 4.1 × 10⁻⁷.',
      measurement: 'Seven paired rounds per compiler. GCC 11.4 interval: +17.14% to +17.76%.',
      ratio: 1.1754, ratioLabel: '1.175×', comparisonLabel: 'Normalized query throughput', comparisonNote: 'GCC 11.4 · one pinned core · the same Wiki-1M graph.'
    },
    hashing: {
      label: 'pandas · native StringArray hashing', finding: '#pandas-hashing', code: 'https://github.com/pandas-dev/pandas/pull/68423',
      titles: ['Find the work surrounding the kernel.', 'Use the buffer the kernel already accepts.', 'Measure each operation and option.', 'Less adapter work. Verified results.'],
      descriptions: [
        'Engineer identifies mask creation and array conversions around a hash kernel that already accepts StringArray’s backing data.',
        'It proposes direct access to the backing array, then implements checked guards, correct result wrapping, and the original fallback.',
        'It alternates baseline and candidate on the same million-value input, measuring counting and each duplicate-detection mode separately.',
        'It checks values, indexes, dtypes, Unicode, and missing values, then preserves the patch and the evidence for each operation.'
      ],
      diagramLabels: ['Inspect: missing-value masks and conversions surround the existing hash kernel.', 'Hypothesis: send the existing backing array directly to the same hash kernel under a checked guard, retaining the original path for other options.'],
      value: '4.4–12.2%', unit: 'faster string operations', scope: 'One million values · 500K distinct · 10% missing. Gains depend on the operation and its options.',
      correctness: '130 differential cases with identical serialized output hashes, including Unicode and missing values.',
      measurement: '30 alternating paired timings per case. Simultaneous upper time-ratio bounds below parity.'
    }
  };
  const stepIds = ['before', 'after', 'experiment', 'evidence'];
  const stepNames = ['Inspect', 'Hypothesize', 'Experiment', 'Verify & deliver'];
  const handoffs = ['Bottleneck + correctness contract', 'Candidate method + guarded patch', 'Paired measurements + uncertainty estimates', 'Verified patch + benchmark record + technical report'];
  const durations = [5600, 6400, 6400, 8000];
  const choices = Array.from(lab.querySelectorAll('[data-study-choice]'));
  const steps = Array.from(lab.querySelectorAll('[data-study-step]'));
  const visuals = Array.from(lab.querySelectorAll('[data-study-visual]'));
  const previous = lab.querySelector('[data-study-previous]');
  const next = lab.querySelector('[data-study-next]');
  const autoplayButton = lab.querySelector('[data-study-autoplay]');
  const announcement = lab.querySelector('[data-study-announcement]');
  let selected = 'hnswlib', step = 0;
  let autoplay = !motion.matches;
  let visible = !('IntersectionObserver' in window), pageActive = true;
  let timer = null, startedAt = null, remaining = durations[0];
  const setText = (key, value) => {lab.querySelector('[data-' + key + ']').textContent = value;};

  function stopTimer() {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
    remaining = Math.max(0, remaining - (performance.now() - startedAt));
    startedAt = null;
  }
  function syncAutoplay() {
    const running = autoplay && visible && pageActive && !document.hidden;
    lab.dataset.playing = String(running);
    autoplayButton.setAttribute('aria-pressed', String(autoplay));
    autoplayButton.setAttribute('aria-label', autoplay ? 'Pause automatic research walkthrough' : 'Play automatic research walkthrough');
    setText('autoplay-label', autoplay ? 'Auto' : 'Play');
    autoplayButton.querySelector('.autoplay-icon').textContent = autoplay ? 'Ⅱ' : '▶';
    if (!running) {stopTimer(); return;}
    if (timer !== null) return;
    startedAt = performance.now();
    timer = setTimeout(() => {
      timer = null; startedAt = null;
      step = (step + 1) % stepIds.length;
      remaining = durations[step];
      render(); syncAutoplay();
    }, remaining);
  }
  function render(announce = false) {
    const study = studies[selected];
    lab.dataset.study = selected;
    lab.dataset.step = stepIds[step];
    lab.style.setProperty('--study-duration', durations[step] + 'ms');
    choices.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.studyChoice === selected)));
    steps.forEach((button, index) => {button.setAttribute('aria-pressed', String(index === step)); button.dataset.complete = String(index < step);});
    visuals.forEach(visual => {visual.hidden = visual.dataset.studyVisual !== selected; if (!visual.hidden) visual.setAttribute('aria-label', study.diagramLabels[Math.min(step, 1)]);});
    lab.querySelector('[data-discovery-canvas]').hidden = step > 1;
    lab.querySelector('[data-discovery-experiment]').hidden = step !== 2;
    lab.querySelector('[data-discovery-proof]').hidden = step !== 3;
    setText('study-label', study.label);
    setText('study-title', study.titles[step]); setText('study-description', study.descriptions[step]);
    setText('study-handoff', handoffs[step]);
    setText('proof-value', study.value); setText('proof-unit', study.unit); setText('proof-scope', study.scope);
    setText('proof-correctness', study.correctness); setText('proof-measurement', study.measurement);
    const hashing = selected === 'hashing';
    lab.querySelector('[data-experiment-comparison]').hidden = hashing;
    lab.querySelector('[data-hashing-comparison]').hidden = !hashing;
    if (!hashing) {
      setText('comparison-label', study.comparisonLabel); setText('comparison-note', study.comparisonNote); setText('comparison-ratio', study.ratioLabel);
      lab.querySelector('[data-comparison-baseline]').style.width = (100 / study.ratio).toFixed(2) + '%';
    }
    lab.querySelector('[data-study-finding]').href = study.finding;
    lab.querySelector('[data-study-code]').href = study.code;
    previous.disabled = false;
    next.textContent = ['Follow the hypothesis →', 'Run the comparison →', 'See the verified gain →', 'Replay the process ↺'][step];
    setText('study-progress', 'Step ' + (step + 1) + ' of 4');
    if (typeof lab.getAnimations === 'function') lab.getAnimations({subtree: true}).forEach(animation => {
      if (animation.animationName && animation.animationName.startsWith('study-')) animation.currentTime = 0;
    });
    if (announce) announcement.textContent = study.label + '. Step ' + (step + 1) + ': ' + stepNames[step] + '. ' + study.descriptions[step];
  }
  function selectStep(index) {
    stopTimer(); step = index; remaining = durations[step]; render(true); syncAutoplay();
  }
  choices.forEach(button => button.addEventListener('click', () => {selected = button.dataset.studyChoice; selectStep(0);}));
  steps.forEach((button, index) => button.addEventListener('click', () => selectStep(index)));
  previous.addEventListener('click', () => selectStep((step + stepIds.length - 1) % stepIds.length));
  next.addEventListener('click', () => selectStep((step + 1) % stepIds.length));
  autoplayButton.addEventListener('click', () => {autoplay = !autoplay; syncAutoplay();});
  document.addEventListener('visibilitychange', syncAutoplay);
  window.addEventListener('pagehide', () => {pageActive = false; syncAutoplay();});
  window.addEventListener('pageshow', () => {pageActive = true; syncAutoplay();});
  motion.addEventListener('change', event => {if (event.matches) autoplay = false; syncAutoplay();});
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {visible = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .15); syncAutoplay();}, {threshold: .15});
    observer.observe(lab.querySelector('.discovery-story'));
  }
  lab.querySelectorAll('[data-discovery-picker], [data-discovery-steps], [data-discovery-navigation]').forEach(element => {element.hidden = false;});
  render(); syncAutoplay();
})();
