/* TrainForge's research cycle and selectable programs. Content lives in the HTML. */
(function () {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-research-loop]').forEach(loop => {
    const choices = Array.from(loop.querySelectorAll('[data-loop-choice]'));
    const panels = Array.from(loop.querySelectorAll('[data-loop-panel]'));
    const toggle = loop.querySelector('[data-loop-toggle]');
    const duration = Number(loop.dataset.loopDuration) || 9000;
    loop.style.setProperty('--cycle-duration', `${duration}ms`);
    let selected = 0;
    let autoplay = !motion.matches;
    let visible = !('IntersectionObserver' in window);
    let timer = null;
    let startedAt = null;
    let remaining = duration;

    function stopTimer() {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
        remaining = Math.max(0, remaining - (performance.now() - startedAt));
      }
      startedAt = null;
    }

    function syncPlayback() {
      stopTimer();
      const playing = autoplay && visible && !document.hidden;
      loop.dataset.playing = String(playing);
      toggle.setAttribute('aria-pressed', String(autoplay));
      loop.querySelector('[data-loop-toggle-icon]').textContent = autoplay ? 'Ⅱ' : '▶';
      loop.querySelector('[data-loop-toggle-label]').textContent = autoplay ? 'Pause animation' : 'Play animation';
      if (playing) {
        startedAt = performance.now();
        timer = setTimeout(() => {
          timer = null;
          select((selected + 1) % choices.length);
        }, remaining);
      }
    }

    function select(index) {
      stopTimer();
      selected = index;
      const phase = choices[index].dataset.loopChoice;
      loop.dataset.loopPhase = phase;
      choices.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
      panels.forEach(panel => { panel.hidden = panel.dataset.loopPanel !== phase; });
      loop.querySelector('[data-loop-position]').textContent = `${index + 1} / ${choices.length}`;
      remaining = duration;
      // Restart the visual progress when a stage is explicitly reselected.
      choices[index].getAnimations({subtree: true}).forEach(animation => { animation.currentTime = 0; });
      loop.querySelectorAll('.cycle-signal').forEach(path => {
        path.getAnimations().forEach(animation => { animation.currentTime = 0; });
      });
      syncPlayback();
    }

    function sizePanels() {
      if (!panels.length) return;
      // Reserve the tallest explanation so playback never shifts the page.
      loop.style.setProperty('--panel-height', '0px');
      panels.forEach(panel => { panel.hidden = false; });
      const height = Math.ceil(Math.max(...panels.map(panel => panel.getBoundingClientRect().height)));
      loop.style.setProperty('--panel-height', `${height}px`);
      panels.forEach(panel => { panel.hidden = panel.dataset.loopPanel !== choices[selected].dataset.loopChoice; });
    }

    choices.forEach((button, index) => button.addEventListener('click', () => {
      autoplay = false;
      select(index);
    }));
    toggle.addEventListener('click', () => {
      autoplay = !autoplay;
      syncPlayback();
    });
    document.addEventListener('visibilitychange', syncPlayback);
    motion.addEventListener('change', () => {
      if (motion.matches) autoplay = false;
      syncPlayback();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        syncPlayback();
      }, {threshold: 0.25}).observe(loop);
    }
    loop.dataset.enhanced = 'true';
    loop.querySelector('[data-cycle-diagram]').hidden = false;
    loop.querySelector('[data-loop-controls]').hidden = false;
    select(0);
    sizePanels();
    window.addEventListener('resize', sizePanels);
    if (document.fonts) document.fonts.ready.then(sizePanels);
  });

  const picker = document.querySelector('[data-program-picker]');
  if (picker) {
    const tabs = Array.from(picker.querySelectorAll('[data-program-choice]'));
    const panels = Array.from(document.querySelectorAll('[data-program-panel]'));
    const mobile = window.matchMedia('(max-width: 640px)');

    function selectProgram(id) {
      const selected = panels.find(panel => panel.id === id) || panels[0];
      panels.forEach(panel => { panel.hidden = panel !== selected; });
      tabs.forEach(tab => {
        const active = tab.dataset.programChoice === selected.id;
        tab.setAttribute('aria-selected', String(active));
        tab.tabIndex = active ? 0 : -1;
      });
    }

    function readHash() {
      const id = window.location.hash.slice(1);
      if (panels.some(panel => panel.id === id)) selectProgram(id);
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        selectProgram(tab.dataset.programChoice);
        history.replaceState(null, '', `#${tab.dataset.programChoice}`);
      });
      tab.addEventListener('keydown', event => {
        let next;
        const forward = mobile.matches ? 'ArrowDown' : 'ArrowRight';
        const backward = mobile.matches ? 'ArrowUp' : 'ArrowLeft';
        if (event.key === forward) next = (index + 1) % tabs.length;
        else if (event.key === backward) next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        if (next === undefined) return;
        event.preventDefault();
        tabs[next].click();
        tabs[next].focus({preventScroll: true});
      });
    });
    panels.forEach(panel => {
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', `tab-${panel.id}`);
      panel.tabIndex = 0;
    });
    const setOrientation = () => picker.setAttribute('aria-orientation', mobile.matches ? 'vertical' : 'horizontal');
    setOrientation();
    mobile.addEventListener('change', setOrientation);
    selectProgram(window.location.hash.slice(1));
    picker.hidden = false;
    window.addEventListener('hashchange', readHash);
  }
})();
