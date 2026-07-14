"use strict";

// Badge placement only — token numbers never come from the DOM, so if GitHub
// redesigns its markup the worst case is a worse-placed badge, never a wrong
// number. All DOM writes are try/catch-guarded appends of our own nodes.

(() => {
  const GHTD = (globalThis.GHTD = globalThis.GHTD || {});

  // Hashed Primer class names are unstable across GitHub deploys — anchor on
  // ARIA/data attributes first, classic classes second, floating badge last.
  const HEADER_ANCHORS = [
    { selector: 'nav[aria-label="Pull request navigation tabs"]', place: "append" },
    { selector: ".tabnav-tabs", place: "append" },
    { selector: ".js-issue-title", place: "after" },
    { selector: 'h1[data-component="PH_Title"]', place: "after" },
  ];

  const format = (n) => n.toLocaleString();

  function tokenSpans(added, removed) {
    const addedEl = document.createElement("span");
    addedEl.className = "ghtd-added";
    addedEl.textContent = `+${format(added)}`;
    const removedEl = document.createElement("span");
    removedEl.className = "ghtd-removed";
    removedEl.textContent = `−${format(removed)}`;
    return [addedEl, document.createTextNode(" "), removedEl];
  }

  GHTD.injectHeaderBadge = function injectHeaderBadge(key, total, note) {
    try {
      const existing = document.querySelector('[data-ghtd-badge="header"]');
      if (existing) {
        if (existing.dataset.ghtdKey === key) return;
        existing.remove();
      }
      const badge = document.createElement("span");
      badge.className = "ghtd-badge";
      badge.dataset.ghtdBadge = "header";
      badge.dataset.ghtdKey = key;
      if (total) {
        badge.append(...tokenSpans(total.added, total.removed), document.createTextNode(" tokens"));
        badge.title = `Estimated token diff: ${format(total.added)} added, ${format(total.removed)} removed (heuristic)`;
      } else {
        badge.textContent = "tokens: n/a";
        badge.title = note || "Token estimate unavailable";
      }
      for (const { selector, place } of HEADER_ANCHORS) {
        const anchor = document.querySelector(selector);
        if (!anchor) continue;
        if (place === "append") anchor.appendChild(badge);
        else anchor.insertAdjacentElement("afterend", badge);
        return;
      }
      // Last resort: feature never silently disappears.
      badge.classList.add("ghtd-floating");
      document.body.appendChild(badge);
    } catch {
      // never break GitHub's page
    }
  };

  GHTD.injectFileBadges = function injectFileBadges(key, perFile) {
    try {
      const byPath = new Map();
      for (const f of perFile) {
        if (f.path) byPath.set(f.path, f);
        if (f.oldPath && !byPath.has(f.oldPath)) byPath.set(f.oldPath, f);
      }
      const headers = document.querySelectorAll(".file-header[data-path]");
      for (const header of headers) {
        injectFileBadge(header, header.getAttribute("data-path"), key, byPath);
      }
      if (headers.length) return;
      // Fallback markup: wrapper div carries data-tagsearch-path.
      for (const wrapper of document.querySelectorAll("[data-tagsearch-path]")) {
        const target =
          wrapper.querySelector(".file-header, .file-info, h3") || wrapper.firstElementChild;
        if (target) {
          injectFileBadge(target, wrapper.getAttribute("data-tagsearch-path"), key, byPath);
        }
      }
    } catch {
      // fail soft — header badge still works
    }
  };

  function injectFileBadge(container, path, key, byPath) {
    const stats = byPath.get(path);
    if (!stats || stats.binary) return;
    const existing = container.querySelector('[data-ghtd-badge="file"]');
    if (existing) {
      if (existing.dataset.ghtdKey === key) return;
      existing.remove();
    }
    const badge = document.createElement("span");
    badge.className = "ghtd-badge ghtd-file-badge";
    badge.dataset.ghtdBadge = "file";
    badge.dataset.ghtdKey = key;
    badge.append(...tokenSpans(stats.added, stats.removed), document.createTextNode(" tok"));
    badge.title = `Estimated token diff: ${format(stats.added)} added, ${format(stats.removed)} removed (heuristic)`;
    const diffstat = container.querySelector(".diffstat");
    if (diffstat) diffstat.insertAdjacentElement("afterend", badge);
    else container.appendChild(badge);
  }

  GHTD.removeBadges = function removeBadges() {
    try {
      for (const el of document.querySelectorAll("[data-ghtd-badge]")) el.remove();
    } catch {
      // ignore
    }
  };
})();
