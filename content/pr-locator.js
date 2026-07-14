"use strict";

(() => {
  const GHTD = (globalThis.GHTD = globalThis.GHTD || {});

  // /{owner}/{repo}/pull/{n}[/(files|commits|checks)...]
  GHTD.parseGithubPrLocation = function parseGithubPrLocation(pathname) {
    const m = pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/(files|commits|checks))?(?:\/|$)/);
    if (!m) return null;
    return { owner: m[1], repo: m[2], prNumber: m[3], view: m[4] || "conversation" };
  };
})();
