const ExplodedAlgebraTransfer = (() => {
  const storageKey = "explodedAlgebra.currentCustomLevel";
  const namePrefix = "__EXPLODED_ALGEBRA_LEVEL__:";
  const fileStorageKey = key => `${storageKey}.${key}`;

  function open(page, params, payload, target = window.open("about:blank", "_blank") || window) {
    const key = params.fileKey ? fileStorageKey(params.fileKey) : storageKey;
    const text = JSON.stringify(params.fileKey ? { ...payload, transferKey: key } : payload);
    try {
      target.sessionStorage.setItem(key, text);
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
    if (!useLocalStorage && key !== storageKey && payload?.transferKey !== key) {
      throw new Error("The level data is no longer available. Open the level again.");
    }
    if (typeof payload?.text !== "string") throw new Error("The transferred level data is incomplete.");
    return payload;
  }

  return { open, read, fileStorageKey };
})();
