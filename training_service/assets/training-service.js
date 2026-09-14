(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function selectTab(buttons, selected) {
    buttons.forEach(function (button, index) {
      const active = index === selected;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
  }

  function addArrowKeyNavigation(buttons, activate) {
    buttons.forEach(function (button, index) {
      button.addEventListener('keydown', function (event) {
        let next = null;
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % buttons.length;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + buttons.length) % buttons.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = buttons.length - 1;
        if (next === null) return;
        event.preventDefault();
        buttons[next].focus();
        activate(next);
      });
    });
  }

  /* Scroll entrances */
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    reveals.forEach(function (element) { element.classList.add('is-visible'); });
  } else {
    const revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    reveals.forEach(function (element) { revealObserver.observe(element); });
  }

  /* Public API lifecycle: create, generate, train, update, and save. */
  const apiStory = document.querySelector('[data-api-story]');
  let apiStoryController = null;
  if (apiStory) {
    const map = apiStory.querySelector('[data-api-map]');
    const replay = apiStory.querySelector('.api-replay');
    const motionLayers = Array.from(apiStory.querySelectorAll('.api-story-routes'));
    const note = apiStory.querySelector('.api-story-note');
    const noteLabel = apiStory.querySelector('[data-api-note-label]');
    const noteTitle = apiStory.querySelector('[data-api-note-title]');
    const noteCopy = apiStory.querySelector('[data-api-note-copy]');
    const callLabel = apiStory.querySelector('[data-api-call]');
    const returnLabel = apiStory.querySelector('[data-api-return]');
    const workerState = apiStory.querySelector('[data-api-worker-state]');
    const workerDetail = apiStory.querySelector('[data-api-worker-detail]');
    const progress = Array.from(apiStory.querySelectorAll('.api-story-progress i'));
    const phaseClasses = ['api-phase-create', 'api-phase-generate', 'api-phase-forward', 'api-phase-optim', 'api-phase-save'];
    const states = [
      { phase: 'api-phase-create', label: 'Client setup', title: 'Create a training or inference client.', copy: 'AutoInfra assigns GPU capacity for the selected model and workload.', call: '.create_client()', result: '', worker: 'Allocating', detail: 'Client capacity', duration: 4700 },
      { phase: 'api-phase-generate', label: 'Inference', title: 'Send tokens and receive completions.', copy: 'The worker returns generated responses with token-level log probabilities.', call: '.generate([1, 6, 12])', result: '{responses, logprobs}', worker: 'Generating', detail: 'Serving inference', duration: 5100 },
      { phase: 'api-phase-forward', label: 'Training', title: 'Train on the next packet.', copy: 'The worker evaluates the examples and returns the resulting loss.', call: '.forward_backward(ids=…, adv=…)', result: '{loss}', worker: 'Training', detail: 'Computing loss', duration: 4800 },
      { phase: 'api-phase-optim', label: 'Model update', title: 'Apply the optimizer step.', copy: 'The update is applied and its gradient norm is returned.', call: '.optim_step(ids=…, adv=…)', result: '{grad_norm}', worker: 'Updating', detail: 'Applying update', duration: 4600 },
      { phase: 'api-phase-save', label: 'Checkpoint', title: 'Save the updated model.', copy: 'The worker writes the new model state to persistent storage for later use.', call: '.save_model("ckpt-1")', result: '', worker: 'Saving', detail: 'Writing checkpoint', duration: 5000 }
    ];
    let apiIndex = reducedMotion.matches ? 1 : 0;
    let apiTimer = null;
    let apiPlaying = false;
    let apiAutoPlayed = reducedMotion.matches;

    function restartEntrance(element, className) {
      element.classList.remove(className);
      void element.offsetWidth;
      element.classList.add(className);
    }

    function setApiMotionPaused(paused) {
      motionLayers.forEach(function (layer) {
        if (paused && typeof layer.pauseAnimations === 'function') layer.pauseAnimations();
        if (!paused && typeof layer.unpauseAnimations === 'function') layer.unpauseAnimations();
      });
    }

    function renderApiStory() {
      const state = states[apiIndex];
      phaseClasses.forEach(function (phase) { map.classList.remove(phase); });
      map.classList.add(state.phase);
      noteLabel.textContent = state.label;
      noteTitle.textContent = state.title;
      noteCopy.textContent = state.copy;
      callLabel.textContent = state.call;
      returnLabel.textContent = state.result;
      workerState.textContent = state.worker;
      workerDetail.textContent = state.detail;
      progress.forEach(function (item, index) {
        item.classList.toggle('is-active', index === apiIndex);
        item.classList.toggle('is-done', index < apiIndex);
      });
      motionLayers.forEach(function (layer) {
        if (typeof layer.setCurrentTime === 'function') layer.setCurrentTime(0);
      });
      restartEntrance(note, 'api-note-enter');
      restartEntrance(callLabel, 'api-label-enter');
      restartEntrance(returnLabel, 'api-label-enter');
    }

    function pauseApiStory() {
      apiPlaying = false;
      window.clearTimeout(apiTimer);
      setApiMotionPaused(true);
    }

    function scheduleApiStory() {
      window.clearTimeout(apiTimer);
      if (!apiPlaying) return;
      apiTimer = window.setTimeout(function () {
        apiIndex = (apiIndex + 1) % states.length;
        renderApiStory();
        scheduleApiStory();
      }, states[apiIndex].duration);
    }

    function playApiStory(restart) {
      if (restart) apiIndex = 0;
      apiPlaying = true;
      renderApiStory();
      setApiMotionPaused(false);
      scheduleApiStory();
    }

    replay.addEventListener('click', function () {
      apiAutoPlayed = true;
      playApiStory(true);
    });
    renderApiStory();
    pauseApiStory();

    apiStoryController = {
      playOnce: function () {
        if (apiAutoPlayed || reducedMotion.matches) return;
        apiAutoPlayed = true;
        playApiStory(true);
      },
      pause: pauseApiStory
    };
  }

  /* Lightweight coordination and distributed payload movement. */
  const ticketFlow = document.querySelector('[data-ticket-flow]');
  let ticketFlowController = null;
  if (ticketFlow) {
    const map = ticketFlow.querySelector('[data-ticket-map]');
    const toggle = ticketFlow.querySelector('.ticket-toggle');
    const motionLayers = Array.from(ticketFlow.querySelectorAll('.ticket-routes'));
    const userOneState = ticketFlow.querySelector('[data-ticket-user-one-state]');
    const userTwoState = ticketFlow.querySelector('[data-ticket-user-two-state]');
    const userThreeState = ticketFlow.querySelector('[data-ticket-user-three-state]');
    const workerBState = ticketFlow.querySelector('[data-ticket-worker-b-state]');
    const workerBRun = ticketFlow.querySelector('[data-ticket-worker-b-run]');
    const ticketStates = [
      ['ticket-phase-one', 'Active', 'Waiting', 'Waiting', 'Waiting', '8 GPUs'],
      ['ticket-phase-two', 'Active', 'Active', 'Waiting', 'Allocated', 'User 2 · 8 GPUs'],
      ['ticket-phase-three', 'Active', 'Inactive', 'Active', 'Reused', 'User 3 · 8 GPUs']
    ];
    const ticketDurations = [5200, 5600, 4500];
    let ticketIndex = reducedMotion.matches ? 2 : 0;
    let ticketTimer = null;
    let ticketPlaying = false;
    let ticketAutoPlayed = reducedMotion.matches;

    function renderTicketFlow() {
      const state = ticketStates[ticketIndex];
      map.className = 'ticket-map ' + state[0];
      userOneState.textContent = state[1];
      userTwoState.textContent = state[2];
      userThreeState.textContent = state[3];
      workerBState.textContent = state[4];
      workerBRun.textContent = state[5];
    }

    function setTicketMotionPaused(paused) {
      motionLayers.forEach(function (layer) {
        if (paused && typeof layer.pauseAnimations === 'function') layer.pauseAnimations();
        if (!paused && typeof layer.unpauseAnimations === 'function') layer.unpauseAnimations();
      });
    }

    function updateTicketControl() {
      const label = toggle.querySelector('.control-label');
      toggle.classList.toggle('is-paused', !ticketPlaying);
      toggle.setAttribute('aria-label', ticketPlaying ? 'Pause command and payload animation' : 'Play command and payload animation');
      if (label) label.textContent = ticketPlaying ? 'Pause' : 'Play';
    }

    function pauseTicketFlow() {
      ticketPlaying = false;
      window.clearTimeout(ticketTimer);
      setTicketMotionPaused(true);
      updateTicketControl();
    }

    function scheduleTicketFlow() {
      window.clearTimeout(ticketTimer);
      if (!ticketPlaying) return;
      ticketTimer = window.setTimeout(function () {
        ticketIndex = (ticketIndex + 1) % ticketStates.length;
        renderTicketFlow();
        scheduleTicketFlow();
      }, ticketDurations[ticketIndex]);
    }

    function playTicketFlow(restart) {
      if (restart) {
        ticketIndex = 0;
        motionLayers.forEach(function (layer) {
          if (typeof layer.setCurrentTime === 'function') layer.setCurrentTime(0);
        });
      }
      ticketPlaying = true;
      renderTicketFlow();
      setTicketMotionPaused(false);
      updateTicketControl();
      scheduleTicketFlow();
    }

    toggle.addEventListener('click', function () {
      if (ticketPlaying) pauseTicketFlow();
      else playTicketFlow(false);
    });
    renderTicketFlow();
    pauseTicketFlow();

    ticketFlowController = {
      playOnce: function () {
        if (ticketAutoPlayed || reducedMotion.matches) return;
        ticketAutoPlayed = true;
        playTicketFlow(true);
      },
      pause: pauseTicketFlow
    };
  }

  /* Training efficiency comparison. */
  const efficiency = document.querySelector('[data-efficiency]');
  if (efficiency) {
    const modeTabs = Array.from(efficiency.querySelectorAll('[data-efficiency-mode]'));
    const panels = modeTabs.map(function (button) {
      return document.getElementById(button.getAttribute('aria-controls'));
    });
    function drawPanel(panel) {
      panel.classList.remove('is-drawn');
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { panel.classList.add('is-drawn'); });
      });
    }

    function setEfficiencyMode(index) {
      selectTab(modeTabs, index);
      panels.forEach(function (panel, panelIndex) {
        const active = panelIndex === index;
        panel.hidden = !active;
        if (active) drawPanel(panel);
      });
    }

    modeTabs.forEach(function (button, index) {
      button.addEventListener('click', function () { setEfficiencyMode(index); });
    });
    addArrowKeyNavigation(modeTabs, setEfficiencyMode);

    setEfficiencyMode(0);
  }

  /* Play each explanation once when it reaches the viewport. */
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    const players = [];
    if (apiStory && apiStoryController) players.push([apiStory, apiStoryController]);
    if (ticketFlow && ticketFlowController) players.push([ticketFlow, ticketFlowController]);
    const playerObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const match = players.find(function (item) { return item[0] === entry.target; });
        if (match) match[1].playOnce();
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.32 });
    players.forEach(function (item) { playerObserver.observe(item[0]); });
  }

  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) return;
    if (apiStoryController) apiStoryController.pause();
    if (ticketFlowController) ticketFlowController.pause();
  });
})();
