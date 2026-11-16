const ExplodedAlgebraNotation = (() => {
  const tokenPattern = /\\[a-zA-Z]+|\\[,;:! ]|(?:\d+(?:\.\d*)?|\.\d+)|[a-zA-Z\u0370-\u03ff]|[+\-−*×·⋅/÷^(){}\[\]]|\s+|./gu;
  const multiply = new Set(["*", "×", "·", "⋅", "\\times", "\\cdot"]);
  const divide = new Set(["/", "÷", "\\div"]);
  const fraction = new Set(["\\frac", "\\dfrac", "\\tfrac"]);
  const closes = { "(": ")", "[": "]", "{": "}" };
  const greek = {
    alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ϵ", varepsilon: "ε",
    zeta: "ζ", eta: "η", theta: "θ", vartheta: "ϑ", iota: "ι", kappa: "κ",
    lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", pi: "π", varpi: "ϖ", rho: "ρ",
    varrho: "ϱ", sigma: "σ", varsigma: "ς", tau: "τ", upsilon: "υ", phi: "ϕ",
    varphi: "φ", chi: "χ", psi: "ψ", omega: "ω", Gamma: "Γ", Delta: "Δ",
    Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π", Sigma: "Σ", Upsilon: "Υ",
    Phi: "Φ", Psi: "Ψ", Omega: "Ω"
  };
  const greekCommands = new Map(Object.entries(greek).map(([command, symbol]) => [symbol, `\\${command} `]));
  const superscript = "⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻";
  const maxCoefficient = 1n << 16384n;

  function tokens(source) {
    const text = String(source).trim()
      .replace(/^\$([^$]+)\$$|^\\\(([\s\S]*)\\\)$/, (_, dollars, parentheses) => dollars ?? parentheses)
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/gu, exponent =>
        "^{"+ Array.from(exponent, char => "0123456789+-"[superscript.indexOf(char)]).join("") + "}");
    if (text.length > 2000) throw new Error("This expression is too long to verify.");
    return Array.from(text.matchAll(tokenPattern), match => ({
      text: match[0],
      spaceBefore: /\s/.test(text[match.index - 1] || ""),
      spaceAfter: /\s/.test(text[match.index + match[0].length] || "")
    })).filter(token => !/^(?:\s+|\\[,;:! ])$/.test(token.text));
  }

  function polynomial(value) {
    return value === 0n ? new Map() : new Map([["", value]]);
  }

  function addTerm(poly, key, coefficient) {
    const next = (poly.get(key) || 0n) + coefficient;
    if (next > maxCoefficient || next < -maxCoefficient) throw new Error("This expression is too large to verify.");
    if (next === 0n) poly.delete(key);
    else poly.set(key, next);
    if (poly.size > 1500) throw new Error("This expression has too many terms to verify.");
  }

  function addPolynomials(left, right, sign = 1n) {
    const sum = new Map(left);
    for (const [key, value] of right) addTerm(sum, key, sign * value);
    return sum;
  }

  function multiplyMonomials(left, right) {
    const powers = new Map();
    for (const factor of [left, right]) {
      if (!factor) continue;
      for (const entry of factor.split(",")) {
        const [symbol, exponent] = entry.split(":");
        powers.set(symbol, (powers.get(symbol) || 0) + Number(exponent));
      }
    }
    return Array.from(powers).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([variable, exponent]) => `${variable}:${exponent}`).join(",");
  }

  function multiplyPolynomials(left, right) {
    if (left.size * right.size > 30000) throw new Error("This expression is too large to verify.");
    const product = new Map();
    for (const [leftKey, leftValue] of left) {
      for (const [rightKey, rightValue] of right) {
        addTerm(product, multiplyMonomials(leftKey, rightKey), leftValue * rightValue);
      }
    }
    return product;
  }

  function rational(numerator, denominator = polynomial(1n)) {
    if (!denominator.size) throw new Error("Division by zero is undefined.");
    return { numerator, denominator };
  }

  function add(left, right, sign = 1n) {
    return rational(
      addPolynomials(multiplyPolynomials(left.numerator, right.denominator),
        multiplyPolynomials(right.numerator, left.denominator), sign),
      multiplyPolynomials(left.denominator, right.denominator)
    );
  }

  function multiplyValues(left, right) {
    return rational(multiplyPolynomials(left.numerator, right.numerator),
      multiplyPolynomials(left.denominator, right.denominator));
  }

  function divideValues(left, right) {
    return multiplyValues(left, rational(right.denominator, right.numerator));
  }

  function wholeConstant(poly) {
    return poly.size === 0 ? 0n : poly.size === 1 ? poly.get("") : undefined;
  }

  function power(base, exponent) {
    const numerator = wholeConstant(exponent.numerator);
    const denominator = wholeConstant(exponent.denominator);
    if (numerator === undefined || denominator === undefined || numerator % denominator !== 0n) {
      throw new Error("Use an integer exponent.");
    }
    let remaining = numerator / denominator;
    if (remaining < -256n || remaining > 256n) {
      throw new Error("Use an exponent between −256 and 256.");
    }
    if (remaining < 0n) {
      base = rational(base.denominator, base.numerator);
      remaining = -remaining;
    }
    if (remaining === 0n && !base.numerator.size) throw new Error("Zero to the zeroth power is undefined.");
    let result = rational(polynomial(1n));
    while (remaining > 0n) {
      if (remaining % 2n) result = multiplyValues(result, base);
      remaining /= 2n;
      if (remaining > 0n) base = multiplyValues(base, base);
    }
    return result;
  }

  function readExpression(source) {
    const input = tokens(source);
    let cursor = 0;
    const peek = () => input[cursor]?.text;
    const next = () => input[cursor++]?.text;
    const isNumber = token => /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(token || "");
    function variableName(token) {
      if (/^[a-zA-Z\u0370-\u03ff]$/u.test(token || "")) return token;
      const command = token?.slice(1);
      return Object.hasOwn(greek, command) ? greek[command] : "";
    }
    const startsAtom = token => isNumber(token) || !!variableName(token) || !!closes[token] ||
      fraction.has(token) || token === "\\left";
    function isTimesLetter() {
      if (peek() !== "x") return false;
      const right = input[cursor + 1]?.text;
      const { spaceBefore, spaceAfter } = input[cursor];
      return (spaceBefore && spaceAfter && startsAtom(right)) ||
        (isNumber(input[cursor - 1]?.text) && isNumber(right));
    }
    const requireToken = expected => {
      if (next() !== expected) throw new Error(`Expected ${expected}.`);
    };

    function group(open) {
      const inner = sum();
      requireToken(closes[open]);
      return inner;
    }

    function atom() {
      const token = next();
      if (token === "\\left") {
        const open = next();
        if (open !== "(" && open !== "[") throw new Error("Expected an opening delimiter after \\left.");
        const inner = sum();
        requireToken("\\right");
        requireToken(closes[open]);
        return { value: inner.value, tex: `\\left${open}${inner.tex}\\right${closes[open]}` };
      }
      if (closes[token]) {
        const inner = group(token);
        const tex = token === "{" ? `(${inner.tex})` : `${token}${inner.tex}${closes[token]}`;
        return { value: inner.value, tex };
      }
      if (fraction.has(token)) {
        requireToken("{");
        const top = group("{");
        requireToken("{");
        const bottom = group("{");
        return { value: divideValues(top.value, bottom.value), tex: `${token}{${top.tex}}{${bottom.tex}}` };
      }
      if (isNumber(token)) {
        const [whole, decimals = ""] = token.split(".");
        return {
          value: rational(polynomial(BigInt(whole + decimals)), polynomial(10n ** BigInt(decimals.length))),
          tex: token
        };
      }
      const variable = variableName(token);
      if (variable) {
        return { value: rational(new Map([[`${variable}:1`, 1n]])), tex: greekCommands.get(variable) || variable };
      }
      throw new Error(token ? `Unexpected symbol ${token}.` : "Enter a complete expression.");
    }

    function factor() {
      if (["+", "-", "−"].includes(peek())) {
        const sign = next() === "+" ? "+" : "-";
        const child = factor();
        const value = sign === "+" ? child.value : rational(
          new Map(Array.from(child.value.numerator, ([key, coefficient]) => [key, -coefficient])),
          child.value.denominator
        );
        return { value, tex: sign + child.tex };
      }

      const base = atom();
      if (peek() !== "^") return base;
      next();
      let exponent;
      if (peek() === "{") {
        next();
        exponent = group("{");
      } else {
        exponent = factor();
      }
      return { value: power(base.value, exponent.value), tex: `${base.tex}^{${exponent.tex}}` };
    }

    function product() {
      let left = factor();
      while (multiply.has(peek()) || divide.has(peek()) || startsAtom(peek())) {
        const token = peek();
        const explicit = multiply.has(token) || divide.has(token) || isTimesLetter();
        if (explicit) next();
        const right = factor();
        const isDivision = divide.has(token);
        const operator = !explicit ? "" : isDivision ? "\\div " :
          ["x", "×", "\\times"].includes(token) ? "\\times " : "\\cdot ";
        if (!explicit && /[\d.]$/.test(left.tex) && /^[\d.]/.test(right.tex)) {
          throw new Error("Put a multiplication sign between consecutive numbers.");
        }
        left = {
          value: isDivision ? divideValues(left.value, right.value) : multiplyValues(left.value, right.value),
          tex: left.tex + operator + right.tex
        };
      }
      return left;
    }

    function sum() {
      let left = product();
      while (["+", "-", "−"].includes(peek())) {
        const sign = next() === "+" ? "+" : "-";
        const right = product();
        left = { value: add(left.value, right.value, sign === "+" ? 1n : -1n), tex: left.tex + sign + right.tex };
      }
      return left;
    }

    const expression = sum();
    if (cursor < input.length) throw new Error(`Unexpected symbol ${peek()}.`);
    return expression;
  }

  function verify(original, proposed) {
    const source = readExpression(original).value;
    const result = readExpression(proposed);
    const difference = addPolynomials(multiplyPolynomials(source.numerator, result.value.denominator),
      multiplyPolynomials(result.value.numerator, source.denominator), -1n);
    if (difference.size) throw new Error("This expression is not equivalent to the recorded step.");
    return result.tex;
  }

  return { verify };
})();
