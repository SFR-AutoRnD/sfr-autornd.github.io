document.documentElement.classList.add("js");

const video = document.querySelector("video");
document.addEventListener("visibilitychange", () => {
  if (document.hidden && video && !video.paused) {
    video.pause();
  }
});

const sectionLinks = [...document.querySelectorAll(".site-nav a")].filter(
  (link) => {
    const target = new URL(link.href, window.location.href);
    return target.pathname === window.location.pathname && Boolean(target.hash);
  },
);
const sectionById = new Map(
  sectionLinks.map((link) => [
    new URL(link.href, window.location.href).hash.slice(1),
    link,
  ]),
);

if ("IntersectionObserver" in window && sectionById.size) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      for (const link of sectionLinks) {
        link.classList.toggle(
          "active",
          link === sectionById.get(visible.target.id),
        );
      }
    },
    { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.2, 0.5] },
  );
  for (const id of sectionById.keys()) {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  }
}

