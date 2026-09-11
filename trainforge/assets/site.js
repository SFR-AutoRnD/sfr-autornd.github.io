document.documentElement.classList.add("js");

const video = document.querySelector("video");
document.addEventListener("visibilitychange", () => {
  if (document.hidden && video && !video.paused) {
    video.pause();
  }
});

const familyNav = document.querySelector(".family-nav");
const sectionNav = document.querySelector(".section-nav");
const syncNavHeights = () => {
  document.documentElement.style.setProperty(
    "--nav-h",
    `${familyNav?.offsetHeight || 67}px`,
  );
  document.documentElement.style.setProperty(
    "--subnav-h",
    `${sectionNav?.offsetHeight || 52}px`,
  );
};
syncNavHeights();
window.addEventListener("resize", syncNavHeights, { passive: true });

const sectionLinks = [...document.querySelectorAll(".section-nav a")].filter(
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
        const active = link === sectionById.get(visible.target.id);
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      }
    },
    { rootMargin: "-18% 0px -68% 0px", threshold: [0, 0.2, 0.5] },
  );
  for (const id of sectionById.keys()) {
    const section = document.getElementById(id);
    if (section) observer.observe(section);
  }
}

const ideaTriggers = [...document.querySelectorAll("[data-dialog-target]")];
const ideaDialogs = [...document.querySelectorAll(".idea-detail-dialog")];
let ideaReturnFocus = null;

const setIdeaDialogState = () => {
  document.documentElement.classList.toggle(
    "idea-dialog-open",
    ideaDialogs.some((dialog) => dialog.open),
  );
};

const closeIdeaDialog = (dialog, { updateHash = true } = {}) => {
  if (!dialog?.open) return;
  dialog.close();
  setIdeaDialogState();
  if (updateHash && window.location.hash === `#${dialog.id}`) {
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}#programs`);
  }
  if (ideaReturnFocus?.isConnected) ideaReturnFocus.focus();
  ideaReturnFocus = null;
};

const openIdeaDialog = (dialog, trigger = null, { updateHash = true } = {}) => {
  if (!dialog) return;
  for (const candidate of ideaDialogs) {
    if (candidate !== dialog && candidate.open) {
      closeIdeaDialog(candidate, { updateHash: false });
    }
  }
  ideaReturnFocus = trigger || ideaReturnFocus;
  if (!dialog.open) dialog.showModal();
  setIdeaDialogState();
  if (updateHash && window.location.hash !== `#${dialog.id}`) {
    history.pushState({ ideaDialog: dialog.id }, "", `#${dialog.id}`);
  }
};

for (const trigger of ideaTriggers) {
  trigger.addEventListener("click", () => {
    const dialog = document.getElementById(trigger.dataset.dialogTarget);
    openIdeaDialog(dialog, trigger);
  });
}

for (const dialog of ideaDialogs) {
  for (const closeButton of dialog.querySelectorAll("[data-dialog-close]")) {
    closeButton.addEventListener("click", () => closeIdeaDialog(dialog));
  }
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeIdeaDialog(dialog);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeIdeaDialog(dialog);
  });
}

const syncIdeaDialogFromHash = () => {
  const target = document.getElementById(window.location.hash.slice(1));
  if (target?.classList.contains("idea-detail-dialog")) {
    openIdeaDialog(target, null, { updateHash: false });
    return;
  }
  for (const dialog of ideaDialogs) {
    closeIdeaDialog(dialog, { updateHash: false });
  }
};

window.addEventListener("hashchange", syncIdeaDialogFromHash);
syncIdeaDialogFromHash();
