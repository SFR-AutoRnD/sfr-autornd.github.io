/* Homepage: a continuous research loop and a persistent, selectable step guide. */
(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    reveals.forEach(element => element.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, {rootMargin: '0px 0px -24px 0px', threshold: 0.05});
    reveals.forEach(element => revealObserver.observe(element));
  }
  document.documentElement.classList.remove('no-js');

  const menuTrigger = document.querySelector('.pages-trigger');
  const menu = document.querySelector('.pages-menu');
  if (menuTrigger && menu) {
    const closeMenu = () => {
      menu.hidden = true;
      menuTrigger.setAttribute('aria-expanded', 'false');
    };
    closeMenu();
    menuTrigger.addEventListener('click', () => {
      const open = menu.hidden;
      menu.hidden = !open;
      menuTrigger.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', event => {
      if (!menu.contains(event.target) && !menuTrigger.contains(event.target)) closeMenu();
    });
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || menu.hidden) return;
      const returnFocus = menu.contains(document.activeElement);
      closeMenu();
      if (returnFocus) menuTrigger.focus();
    });
    menu.addEventListener('click', event => {
      if (event.target.closest('a')) closeMenu();
    });
  }

  const loop = document.querySelector('[data-research-loop]');
  if (!loop) return;

  const phases = ['discover', 'build', 'evaluate', 'learn'];
  const nodes = Array.from(loop.querySelectorAll('[data-loop-phase]'));
  const guide = loop.querySelector('.loop-guide');
  const announcement = loop.querySelector('[data-loop-announcement]');
  const phaseDuration = 3600;
  let phaseIndex = 0;
  let inView = !('IntersectionObserver' in window);
  let pageActive = true;
  let timer = null;
  let startedAt = null;
  let remaining = phaseDuration;

  function stopTimer() {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
    remaining = Math.max(0, remaining - (performance.now() - startedAt));
    startedAt = null;
  }

  function renderPhase() {
    const phase = phases[phaseIndex];
    loop.dataset.phase = phase;
    nodes.forEach(node => node.setAttribute('aria-pressed', String(node.dataset.loopPhase === phase)));
    if (typeof loop.getAnimations === 'function') {
      loop.getAnimations({subtree: true}).forEach(animation => {
        if (animation.animationName && animation.animationName.startsWith('research-')) animation.currentTime = 0;
      });
    }
  }

  function syncAnimation() {
    const running = !reducedMotion.matches && inView && pageActive && !document.hidden;
    loop.dataset.running = String(running);
    if (!running) {stopTimer(); return;}
    if (timer !== null) return;
    startedAt = performance.now();
    timer = setTimeout(() => {
      timer = null;
      startedAt = null;
      remaining = phaseDuration;
      phaseIndex = (phaseIndex + 1) % phases.length;
      renderPhase();
      syncAnimation();
    }, remaining);
  }

  nodes.forEach(node => node.addEventListener('click', () => {
    stopTimer();
    phaseIndex = Math.max(0, phases.indexOf(node.dataset.loopPhase));
    remaining = phaseDuration;
    renderPhase();
    const activeGuide = guide.querySelector('[data-loop-phase="' + phases[phaseIndex] + '"]');
    announcement.textContent = activeGuide.querySelector('.step-guide-heading strong').textContent + '. ' + activeGuide.querySelector('.step-guide-description').textContent;
    syncAnimation();
  }));
  document.addEventListener('visibilitychange', syncAnimation);
  window.addEventListener('pagehide', () => {pageActive = false; syncAnimation();});
  window.addEventListener('pageshow', () => {pageActive = true; syncAnimation();});
  reducedMotion.addEventListener('change', syncAnimation);
  if ('IntersectionObserver' in window) {
    const loopObserver = new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.15);
      syncAnimation();
    }, {threshold: 0.15});
    loopObserver.observe(loop.querySelector('.research-orbit'));
  }
  renderPhase();
  syncAnimation();
})();
