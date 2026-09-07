/* Shared navigation, section highlighting, and demo playback behavior. */
(function () {
  const root = document.documentElement;
  const nav = document.querySelector('.site-nav');
  const sectionNav = document.querySelector('.section-nav');
  const track = document.querySelector('.section-nav-track');
  const links = Array.from(document.querySelectorAll('.section-nav .sn-link'));
  const sections = links.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = null;
  let currentId = null;

  function setOffsets() {
    const navHeight = nav && getComputedStyle(nav).position === 'sticky' ? nav.getBoundingClientRect().height : 0;
    root.style.setProperty('--nav-h', Math.ceil(navHeight) + 'px');
    root.style.setProperty('--subnav-h', sectionNav ? Math.ceil(sectionNav.getBoundingClientRect().height) + 'px' : '0px');
    requestUpdate();
  }

  function update() {
    frame = null;
    if (!sectionNav || !sections.length) return;
    const marker = (parseFloat(root.style.getPropertyValue('--nav-h')) || 0) + sectionNav.getBoundingClientRect().height + 24;
    // Team can appear in the hero; sort by document position rather than menu order.
    const ordered = sections.slice().sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    let current = null;
    ordered.forEach(section => {
      if (section.getBoundingClientRect().top <= marker) current = section;
    });
    if (window.innerHeight + window.scrollY >= root.scrollHeight - 2) current = ordered[ordered.length - 1];
    links.forEach(link => {
      if (current && link.hash === '#' + current.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const nextId = current ? current.id : null;
    if (nextId !== currentId && track) {
      currentId = nextId;
      const active = links.find(link => link.hash === '#' + nextId);
      if (active) track.scrollTo({left: Math.max(0, active.offsetLeft - (track.clientWidth - active.offsetWidth) / 2), behavior: reduceMotion.matches ? 'auto' : 'smooth'});
    }
  }

  function requestUpdate() {
    if (!frame) frame = requestAnimationFrame(update);
  }

  setOffsets();
  window.addEventListener('scroll', requestUpdate, {passive: true});
  window.addEventListener('resize', setOffsets);
  window.addEventListener('load', setOffsets);
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(setOffsets);
    if (nav) observer.observe(nav);
    if (sectionNav) observer.observe(sectionNav);
  }

  const videos = Array.from(document.querySelectorAll('video'));
  if (videos.length) {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) videos.forEach(video => video.pause());
    });
  }
})();
