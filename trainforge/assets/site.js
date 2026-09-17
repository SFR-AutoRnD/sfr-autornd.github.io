document.documentElement.classList.add("js");

// Always open the landing page on its hero. Some browsers restore the last
// scroll position even when the URL has no section hash, which can make a fresh
// visit appear to start at the demo video instead of the cover.
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
const showLandingCover = () => {
  if (!window.location.hash || window.location.hash === "#top") {
    window.scrollTo(0, 0);
  }
};
showLandingCover();
requestAnimationFrame(() => requestAnimationFrame(showLandingCover));
window.addEventListener("pageshow", showLandingCover);
window.addEventListener("load", showLandingCover, { once: true });

const video = document.querySelector("video");
document.addEventListener("visibilitychange", () => {
  if (document.hidden && video && !video.paused) {
    video.pause();
  }
});

// The landing page uses the shared navigation; standalone idea pages keep theirs.
if (!document.body.classList.contains("trainforge-page")) {
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
}

const ideaCardContent = {
  "algebraic-shadows": {
    domain: "Math training intervention",
    title: "Can the model learn from an algebraic error that almost looks correct?",
    method: "Collision-Calibrated Algebraic Shadow Training",
    failure: "A wrong algebraic step can look plausible and may even agree with the correct expression under one numerical check.",
    analysis: "A binary verifier says only right or wrong. It does not reveal how close the mistake came to behaving like a valid identity.",
    proposal: "Evaluate each proposed equality in several finite fields. Train most strongly on wrong steps whose residual pattern collides with the correct step in some fields but not others.",
    example: "Correct: (x + 1)² = x² + 2x + 1.\nWrong: (x + 1)² = x² + 2x + 6.\nThe wrong step is indistinguishable modulo 5 but fails modulo 7. That cross-field collision pattern becomes the training signal.",
    distinction: "The model learns from the geometry of near-collisions across checks, not only from a final pass-or-fail label.",
  },
  "premise-cut": {
    domain: "Math training intervention",
    title: "Which parts of a proof should fail when one premise disappears?",
    method: "Premise-Cut Jacobian Training",
    failure: "The model can continue repeating a familiar proof even after a premise that supports part of the argument has been removed.",
    analysis: "Final-answer supervision does not identify which proof steps depend on each premise and which steps should remain unchanged.",
    proposal: "Remove one premise from a proof graph and train a signed dependency map: affected steps must change, while unrelated steps must remain stable.",
    example: "Premises: n is even, and n > 2. Conclusion: n + 2 is even and greater than 4.\nRemove ‘n is even’: the parity argument must break, but the inequality argument should survive. Remove ‘n > 2’: the opposite should happen.",
    distinction: "The supervised object is a premise-to-step sensitivity map, not a single proof-validity score.",
  },
  "valuation-budget": {
    domain: "Math training intervention",
    title: "Can the model keep track of how many factors remain?",
    method: "Valuation-Budget Counterfactual Jacobian Contrast",
    failure: "The model consumes a factor in one step but silently reuses it later, or fails to update the remaining factor count when the premise changes.",
    analysis: "Answer supervision does not expose the per-prime accounting that makes divisibility and factorization steps consistent.",
    proposal: "Attach a factor budget to each reasoning state, create matched problems with one changed exponent, and train only the downstream budget entries that should change.",
    example: "Original: N = 2² × 3. Dividing by 2 × 3 leaves 2.\nChanged: N = 2³ × 3. The same division must now leave 4.\nOnly the budget for factor 2 should change; the factor-3 reasoning should remain fixed.",
    distinction: "The method supervises how a controlled factor change propagates through the derivation, not merely the updated answer.",
  },
  "induction-closure": {
    domain: "Math training intervention",
    title: "Train the model to recover missing proof steps",
    method: "Induction-Closure Round-Trip Conservation",
    failure: "The model repeats a correct formula but cannot supply the base case or the induction step that supports it.",
    analysis: "Final-answer supervision rewards the formula even when the proof structure is missing.",
    proposal: "Start with a complete induction proof, hide one structural step, and train the model to recover the omitted logic.",
    example: "Claim: 1 + 2 + ··· + n = n(n+1)/2.\nHide either ① the check for n = 1 or ② the transition from n to n+1.\nThe model must recover the hidden step before receiving the proof-recovery reward.",
    distinction: "Recovery of a missing proof step—not repetition of the final formula—provides the training signal.",
  },
  "contradiction-residue": {
    domain: "Math training intervention",
    title: "Train the model to resolve contradictions before stopping",
    method: "Contradiction-Residue Stop Filter",
    failure: "The reasoning contains both x = 3 and x = 5, yet the model confidently emits a final answer.",
    analysis: "Answer loss rewards the endpoint and does not explicitly penalize an unresolved conflict in the preceding reasoning.",
    proposal: "Label reasoning states as conflict-free or unresolved, then penalize answer termination while a contradiction remains.",
    example: "From x + 2 = 5, the model derives x = 3. If a later step says x = 5, training requires it to identify and repair that conflict before it may answer.",
    distinction: "A learned contradiction state directly controls whether producing the final answer is rewarded.",
  },
  "repair-diamonds": {
    domain: "Code training intervention",
    title: "Can two locally correct fixes be combined safely?",
    method: "Counterexample-Joined Repair Diamonds",
    failure: "Two repairs can each solve one failing example but conflict when they are applied to the same program.",
    analysis: "Linear repair trajectories teach one fix after another; they do not show whether independently motivated branches have a valid semantic join.",
    proposal: "Generate two fixes from the same untouched program using different counterexamples, then train on the least-cost executable join—or an explicit NO_JOIN label.",
    example: "Bug A: parse_int(\"\") crashes. Bug B: parse_int(\" 42 \") rejects spaces.\nOne branch checks for empty input; another strips whitespace. The safe join must strip first and then check empty, so an input containing only spaces does not crash.",
    distinction: "The training object is the executable join of two independently witnessed repair branches, not one evolving patch sequence.",
  },
  "execution-curvature": {
    domain: "Code training intervention",
    title: "When do code edits depend on order or only work together?",
    method: "Execution-Curvature Credit for Multi-Edit Repair",
    failure: "A multi-file repair fails because an edit that is harmless alone changes the meaning or applicability of another edit.",
    analysis: "Single-edit labels cannot distinguish additive fixes from order dependence, synergy, or one edit masking another.",
    proposal: "Execute every bounded subset and both orders of two or three guarded AST edits, then train next-edit decisions from their non-additive execution effects.",
    example: "Edit A renames cache.get to cache.fetch. Edit B inserts a new cache.get call.\nApply A before B and the new call keeps the old API; apply B before A and both calls are renamed. Their different execution results reveal an order effect.",
    distinction: "Credit comes from measured interactions among edits, rather than assigning each edit an independent pass-or-fail score.",
  },
  "return-provenance": {
    domain: "Code training intervention",
    title: "Does a repair preserve where its returned value comes from?",
    method: "Return-Value Provenance Cycle Training",
    failure: "A patch can return the expected value on a few examples while disconnecting the result from the inputs that should determine it.",
    analysis: "Output tests observe the value but not the dynamic data-flow slice that produced it.",
    proposal: "Trace the statements that determine the return value, apply and invert a semantics-preserving rewrite, and align the model only at execution-certified anchors.",
    example: "Original: return subtotal - discount.\nEquivalent: total = subtotal - discount; return total.\nBad repair: return 10. It may pass one example, but its return value no longer depends on subtotal or discount.",
    distinction: "Training preserves the executed provenance slice across a reversible transformation, not only the observed output.",
  },
  "hitting-test": {
    domain: "Code training intervention",
    title: "Select the smallest training-time checks that cover every known fault",
    method: "Minimal Hitting-Test Set",
    failure: "Many training-time unit tests repeat the same symptom, so one common fault dominates the repair signal.",
    analysis: "Treating every training check as independent overweights duplicated failures and hides rarer fault types.",
    proposal: "Using only training repositories and generated checks, build a check-to-fault map and select the smallest subset that covers every known training fault.",
    example: "In the training split, checks A and B both reveal the same null fault; check C reveals overflow. Select A + C because B adds no new fault coverage. Held-out benchmark tests are never inspected.",
    distinction: "Fault coverage compresses training supervision; frozen evaluation datasets remain completely separate.",
  },
  "precondition-cycle": {
    domain: "Code training intervention",
    title: "Train repairs to preserve valid-input rules",
    method: "Precondition Cycle",
    failure: "A patch passes ordinary examples but accepts an input that the original function was required to reject.",
    analysis: "Happy-path output tests often omit the function’s boundary conditions and valid-input contract.",
    proposal: "Infer a precondition, generate boundary probes, and reward the repair only when it preserves that contract.",
    example: "Contract: divide(a, b) requires b ≠ 0.\nAfter repair, divide(4, 2) must return 2 and divide(4, 0) must still be rejected.",
    distinction: "Previously implicit input assumptions become executable constraints in the repair objective.",
  },
  "branch-martingales": {
    domain: "Research-agent training intervention",
    title: "Can the agent predict every way a search could change its evidence?",
    method: "Branch-Calibrated Evidence Martingales",
    failure: "The agent searches as if every result will confirm its current belief, then overreacts when a source refutes or narrows the claim.",
    analysis: "Ordinary trajectories supervise only the result that happened. They never calibrate the support, refutation, scope-change, irrelevant, and tool-failure branches that could have happened.",
    proposal: "Before each action, predict every semantic outcome branch for each claim and require their probability-weighted posteriors to remain coherent with the current belief.",
    example: "Claim: a company was acquired in 2024. Before querying an SEC filing, the agent predicts five possible outcomes: confirmation, refutation, a corrected transaction date, irrelevant text, or retrieval failure. Training checks the entire distribution—not only the observed filing.",
    distinction: "The policy learns a coherent posterior over all possible evidence outcomes before acting, rather than receiving credit only for the realized branch.",
  },
  "route-capture": {
    domain: "Research-agent training intervention",
    title: "Is decisive counterevidence still hiding outside the routes already searched?",
    method: "Route-Capture Counterevidence Horizon",
    failure: "The agent sees many pages repeating the same source, mistakes repetition for coverage, and stops before finding an answer-changing document.",
    analysis: "Document count and current confidence do not estimate how much decisive evidence remains unseen across different retrieval routes.",
    proposal: "Compare overlaps among routes such as filings, company releases, news, and archives, correct for their dependence, and estimate an upper bound on the probability of a missing answer-changing witness.",
    example: "Ten news pages repeat one product-release date from the same press release. A separate archive route finds a later correction. The model learns that ten syndicated pages are one captured route—not ten independent confirmations.",
    distinction: "The stopping signal estimates remaining decisive counterevidence, rather than the number of documents already retrieved.",
  },
  "source-intervention": {
    domain: "Research-agent training intervention",
    title: "Train the agent to replace a missing source with independent evidence",
    method: "Cross-Fitted Source-Intervention Policy Optimization",
    failure: "An answer cites several pages but actually collapses when one favored source is unavailable.",
    analysis: "Citation matching after the answer cannot reveal which source truly caused the conclusion.",
    proposal: "Remove one source family before retrieval and train the agent to recover the claim from independent evidence, using separate folds to estimate and train on the source effect.",
    example: "Remove Reuters from an acquisition question. The agent must reroute to an SEC filing or the companies’ official announcement and retain the correct conclusion.",
    distinction: "The training signal measures whether the conclusion survives a controlled source-family intervention, rather than rewarding a larger citation count.",
  },
  "turn-toll": {
    domain: "Research-agent training intervention",
    title: "Train the agent to decide whether one more search is worth its cost",
    method: "Antithetic Turn-Toll Policy Optimization",
    failure: "The agent either stops with a key fact unverified or wastes turns searching after the evidence is already sufficient.",
    analysis: "A fixed turn limit gives every research state the same budget and never teaches the marginal value of the next search.",
    proposal: "Present matched research states with a low or high search cost, then train continuation only when the expected evidence gain exceeds that cost.",
    example: "If a date has only one weak source, another search is worth the toll. Once two independent primary sources agree, the trained policy should stop.",
    distinction: "Counterfactual search costs teach a state-specific stopping rule rather than imposing one global turn limit.",
  },
  "dyadic-credit": {
    domain: "Research-agent training intervention",
    title: "Train the agent to credit research steps that only work together",
    method: "Dyadic Interaction Credit",
    failure: "An early query discovers the clue, but only the final verification step receives reward.",
    analysis: "Terminal and single-turn scores miss steps whose value appears only when they are combined with later actions.",
    proposal: "Replay a multi-turn span with and without selected steps, estimate their interaction gain, and distribute credit across the cooperating span.",
    example: "Search an alias → discover a candidate person → verify the official biography. Removing any one step breaks the answer, so all three receive joint credit.",
    distinction: "Causal credit is assigned to a cooperating research subroutine, not automatically to the last turn.",
  },
};

const ideaTriggers = [...document.querySelectorAll("[data-dialog-target]")];
const ideaDialogs = [...document.querySelectorAll(".idea-detail-dialog")];
let ideaReturnFocus = null;

const renderIdeaCard = (trigger) => {
  const content = ideaCardContent[trigger.dataset.ideaCard];
  if (!content) return;
  document.getElementById("idea-card-domain").textContent = content.domain;
  document.getElementById("idea-card-title").textContent = content.title;
  document.getElementById("idea-card-method").textContent = content.method;
  document.getElementById("idea-card-failure").textContent = content.failure;
  document.getElementById("idea-card-analysis").textContent = content.analysis;
  document.getElementById("idea-card-proposal").textContent = content.proposal;
  document.getElementById("idea-card-example").textContent = content.example;
  document.getElementById("idea-card-distinction").textContent = content.distinction;
};

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
    renderIdeaCard(trigger);
    openIdeaDialog(dialog, trigger, { updateHash: !trigger.dataset.ideaCard });
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
