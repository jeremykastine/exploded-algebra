const ExplodedAlgebraTransfer = (() => {
  const storageKey = "explodedAlgebra.currentCustomLevel";
  const namePrefix = "__EXPLODED_ALGEBRA_LEVEL__:";

  function open(page, params, payload, target = window.open("about:blank", "_blank") || window) {
    const text = JSON.stringify(payload);
    try {
      target.sessionStorage.setItem(storageKey, text);
    } catch {
      // The tab name also carries the data for browsers with restricted storage.
    }
    target.name = namePrefix + text;
    const url = new URL(page, window.location.href);
    url.search = new URLSearchParams(params);
    target.location.assign(url.href);
  }

  function read(key = storageKey, useLocalStorage = false) {
    let text;
    try {
      text = (useLocalStorage ? window.localStorage : window.sessionStorage).getItem(key);
    } catch {
      // Fall back to the tab name.
    }
    if (!text && window.name.startsWith(namePrefix)) {
      text = window.name.slice(namePrefix.length);
    }
    if (!text) throw new Error("The level data is no longer available. Open the level again.");
    const payload = JSON.parse(text);
    if (typeof payload?.text !== "string") throw new Error("The transferred level data is incomplete.");
    return payload;
  }

  return { open, read };
})();
