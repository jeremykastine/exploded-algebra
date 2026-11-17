/* Version 1 is permanent: never reorder the button or position alphabets. */
const ExplodedAlgebraMoves = (() => {
  const buttons = "0123456789ABCDEFGHIJKLMNOPQRSTUV";
  const positions = "WXYZabcdefghijklmnopqrstuvwxyz-_";
  const commands = Object.freeze([
    ...Array.from({ length: 10 }, (_, n) => `digit:${n}`),
    "value:x", "value:y", "value:z", "cycleVariable", "sum", "prod", "inv", "negativeOne", "submit",
    "inverse", "commuteTerms", "commuteFactors", "numericalRewrite", "distribute-left", "distribute-right",
    "additive-identity", "multiplicative-identity", "additive-inverse", "multiplicative-inverse", "double-inverse", "zero-product"
  ]);
  const maxLength = 100000;

  function checksum(text) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 0x01000193);
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  function encode(events, build = true) {
    const body = events.map(event => {
      if (event.type === "position") {
        const n = event.index;
        if (!Number.isInteger(n) || n < 0 || n >= 1024) throw new Error("This selection is too large to share (maximum 1,024 positions).");
        // Ordinary positions 0–31 are one character. V extends larger positions.
        return n < 32 ? positions[n] : `V${positions[Math.floor(n / 32)]}${positions[n % 32]}`;
      }
      const index = commands.indexOf(event.command);
      if (event.type !== "button" || index < 0) throw new Error("This recording contains an unsupported action.");
      return buttons[index];
    }).join("");
    if (body.length > maxLength) throw new Error("This recording is too long to share.");
    const content = `1.${build ? 1 : 0}.${body}`;
    return `${content}.${checksum(content)}`;
  }

  function decode(input) {
    const text = String(input || "").trim();
    if (text.length > maxLength + 20) throw new Error("This recording is too long to open.");
    const parts = text.split(".");
    if (parts.length !== 4 || parts[0] !== "1") throw new Error("This is not a supported moves recording.");
    const [version, build, body, check] = parts;
    if (!/^[01]$/.test(build) || !/^[A-Za-z0-9_-]*$/.test(body) ||
        check !== checksum(`${version}.${build}.${body}`)) {
      throw new Error("The moves recording is incomplete or has been changed. Open the original text file or copy the full link again.");
    }
    const events = [];
    for (let i = 0; i < body.length; i++) {
      const char = body[i];
      if (char === "V") {
        const high = positions.indexOf(body[++i]);
        const low = positions.indexOf(body[++i]);
        if (high < 0 || low < 0 || high === 0) throw new Error("The moves recording has an invalid position.");
        events.push({ type: "position", index: high * 32 + low });
      } else if (positions.includes(char)) {
        events.push({ type: "position", index: positions.indexOf(char) });
      } else {
        const command = commands[buttons.indexOf(char)];
        if (!command) throw new Error("The moves recording has an invalid button.");
        events.push({ type: "button", command });
      }
    }
    return { version: 1, build: build === "1", events, text };
  }

  // Number values left to right. An inverse gets a position before its input.
  function targets(root) {
    const result = [];
    function visit(node, path) {
      if (!node) return;
      if (node.type === "value" || node.type === "inv") result.push({ node, path });
      (node.args || []).forEach((child, index) => visit(child, path.concat(index)));
    }
    visit(root, []);
    return result;
  }

  function selectionPositions(root, selection) {
    const all = targets(root);
    const at = path => {
      let node = root;
      for (const index of path) node = node?.args?.[index];
      if (!node) throw new Error("The recorded selection no longer matches the expression.");
      return node;
    };
    function endpoint(path, last) {
      const node = at(path);
      if (node.type === "value" || node.type === "inv") {
        const index = all.findIndex(target => target.path.length === path.length && target.path.every((p, i) => p === path[i]));
        if (index < 0) throw new Error("The recorded selection could not be numbered.");
        return index;
      }
      if (!node.args?.length) throw new Error("The recorded selection is empty.");
      return endpoint(path.concat(last ? node.args.length - 1 : 0), last);
    }
    const path = selection.path || [];
    const node = at(path);
    if (node.type !== "sum" && node.type !== "prod") return [endpoint(path, false)];
    const first = endpoint(path.concat(selection.firstPart), false);
    const last = endpoint(path.concat(selection.lastPart), true);
    return first === last ? [first] : [first, last];
  }

  return Object.freeze({ encode, decode, targets, selectionPositions, commands, positions });
})();
if (typeof module !== "undefined" && module.exports) module.exports = ExplodedAlgebraMoves;
