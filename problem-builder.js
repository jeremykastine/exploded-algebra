(() => {
  "use strict";

  const byId = id => document.getElementById(id);
  const phases = Array.from(document.querySelectorAll(".phase"));

  let draft;
  let transferredLevel;
  let currentCurationIndex = 0;
  let currentCurationMode = "view";
  let currentGuidanceMode = "view";
  let curationStage = "select";
  let curationSelectionSource = [];
  let curationKeepDecisions = [];

  async function waitForApi() {
    const workspace = byId("eaWorkspace");
    for (let attempt = 0; attempt < 120; attempt++) {
      const api = workspace.contentWindow?.ExplodedAlgebraProblemEditor;
      if (api) return api;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error("The Problem Editor could not load. Reload the page and try again.");
  }

  function setPhase(number) {
    phases.forEach(phase => { phase.hidden = Number(phase.dataset.phase) !== number; });
    byId("editorActions").hidden = number === 1;
    if (number === 2) renderCurationTable();
    if (number === 3) renderGuidancePhase();
    window.scrollTo(0, 0);
  }

  async function openMoves(event) {
    event.preventDefault();
    const button = byId("openMovesButton");
    const status = byId("setupError");
    status.textContent = "";
    button.disabled = true;
    try {
      const file = byId("moveFile").files[0];
      const title = byId("problemTitle").value.trim();
      const id = slugify(title);
      if (!title) throw new Error("Enter a problem name.");
      let history;
      try {
        history = transferredLevel || JSON.parse(await file.text());
      } catch (error) {
        throw new Error("The move history file must contain valid JSON.");
      }
      const api = await waitForApi();
      const imported = api.inspectMoveHistory(history, true);
      const rewriteMode = new FormData(event.target).get("rewriteMode");
      if (imported.moves.some(move => move.isRecordedNumerical &&
          (rewriteMode === "prescribed" || move.demo[move.toolIndex].tool === "automaticNumericalRewrite") &&
          !move.numericalRewrite)) {
        throw new Error("A recorded numerical replacement could not be recovered. Recreate that rewrite in Creative Mode and download the moves again.");
      }
      const authored = history.kind !== "demoOnly" ? history : null;
      draft = {
        ...imported,
        metadata: {
          title,
          id: id || `problem-${Date.now()}`,
          exerciseGuidance: Array.isArray(authored?.exerciseGuidance)
            ? authored.exerciseGuidance.join("\n\n") : (authored?.exerciseGuidance || "").replace(
                /\n\n## Numerical Rewrites\n\n(?:Build any equivalent numerical expression\.|Choose from the recorded equivalent replacements when Numerical Manipulation is available\.)$/, ""
              )
        },
        rewriteMode,
        recording: { candidates: [] }
      };
      curationSelectionSource = [
        { key: "initial-expression", expression: draft.initial, katex: draft.initialKatex, isInitial: true },
        ...draft.moves.map((move, index) => ({ ...move, key: index, moveIndex: index }))
      ].map(candidate => ({
        ...candidate,
        beforeKatex: candidate.katex,
        afterKatex: candidate.katex
      }));
      curationKeepDecisions = curationSelectionSource.map((_, index) =>
        index === 0 || index === curationSelectionSource.length - 1);
      let nextIndex = 0;
      for (const saved of authored?.steps || []) {
        const index = Number.isInteger(saved.recordedMoveIndex)
          ? saved.recordedMoveIndex + 1
          : curationSelectionSource.findIndex((step, index) => index >= nextIndex && step.expression === saved.expression);
        const candidate = curationSelectionSource[index];
        if (candidate?.expression !== saved.expression) continue;
        curationKeepDecisions[index] = true;
        candidate.beforeKatex = saved.beforeKatex || saved.katex || candidate.beforeKatex;
        candidate.afterKatex = saved.afterKatex || saved.katex || candidate.afterKatex;
        nextIndex = index + 1;
      }
      curationStage = "select";
      setPhase(2);
    } catch (error) {
      status.textContent = error.message || "The moves could not be opened.";
    } finally {
      button.disabled = false;
    }
  }

  function finishCurationSelection() {
    draft.recording.candidates = curationSelectionSource.filter((_, index) => curationKeepDecisions[index]);
    curationStage = "edit";
    currentCurationIndex = 0;
    currentCurationMode = "view";
    renderCurationTable();
  }

  function buildExportLevel(candidates = draft.recording.candidates) {
    const demoSteps = [];
    const recordedActions = [];
    const moveEnds = [];
    const rewritePairs = new Map();
    for (const move of draft.moves) {
      if (move.numericalRewrite) {
        rewritePairs.set(JSON.stringify(move.numericalRewrite), move.numericalRewrite);
      }
      const useChoice = move.isRecordedNumerical &&
        (draft.rewriteMode === "prescribed" || move.demo[move.toolIndex].tool === "automaticNumericalRewrite");
      if (useChoice) {
        const { to } = move.numericalRewrite;
        const choice = { type: "action", action: "chooseNumericalRewrite", value: to };
        const tool = { type: "tool", tool: "numericalRewrite" };
        const beforeExpression = move.actions[0].beforeExpression;
        demoSteps.push(move.demo[0], tool, choice);
        recordedActions.push(move.actions[0], { ...tool, beforeExpression }, {
          ...choice,
          beforeExpression,
          afterExpression: move.expression,
          numericalRewrite: move.numericalRewrite
        });
      } else {
        demoSteps.push(...move.demo);
        recordedActions.push(...move.actions);
      }
      moveEnds.push(demoSteps.length);
    }

    let previousEnd = 0;
    const steps = candidates.map(candidate => {
      const afterKatex = candidate.afterKatex.trim() || candidate.katex;
      const step = {
        expression: candidate.expression,
        explodedExpression: candidate.expression,
        katex: afterKatex,
        beforeKatex: candidate.beforeKatex.trim() || candidate.katex,
        afterKatex
      };
      if (!candidate.isInitial) {
        step.recordedMoveIndex = candidate.moveIndex;
        step.actionStartIndex = previousEnd;
        step.actionEndIndex = moveEnds[candidate.moveIndex];
        previousEnd = step.actionEndIndex;
      }
      return step;
    });
    return {
      format: "exploded-algebra-level",
      formatVersion: 1,
      kind: "guidedCapable",
      id: draft.metadata.id,
      title: draft.metadata.title,
      startExpression: draft.initial,
      initialKatex: steps[0].afterKatex,
      ...(draft.initialBuilderActions && { initialBuilderActions: draft.initialBuilderActions }),
      finalExpression: steps.at(-1).expression,
      finalKatex: steps.at(-1).afterKatex,
      numericalRewriteMode: draft.rewriteMode,
      ...(draft.rewriteMode === "prescribed" && {
        prescribedNumericalRewrites: [...rewritePairs.values()],
        moveHistory: {
          startExpression: draft.initial,
          finalExpression: steps.at(-1).expression,
          initialBuilderActions: draft.initialBuilderActions,
          recordedActions: draft.moves.flatMap(move => move.actions)
            .map((action, index) => ({ ...action, index })),
          demo: { steps: draft.moves.flatMap(move => move.demo) }
        }
      }),
      exerciseGuidance: draft.metadata.exerciseGuidance.trim() || defaultExerciseGuidance(),
      exerciseGuidanceIsComplete: true,
      requireFullDemo: true,
      steps,
      demo: { format: "exploded-algebra-guided-actions-v1", steps: demoSteps },
      recordedActions: recordedActions.map((action, index) => ({ ...action, index }))
    };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }


  function renderKatex(target, source) {
    if (!target) return;
    target.replaceChildren();
    if (!source) return;
    if (!window.katex) {
      target.textContent = source;
      return;
    }
    window.katex.render(source, target, { throwOnError: false, displayMode: true });
  }


  function renderCurationSelection() {
    const container = byId("curationTable");
    const candidates = curationSelectionSource;
    if (!candidates.length) {
      container.innerHTML = '<p class="empty-curation">No expression changes were recorded.</p>';
      return;
    }
    container.innerHTML = `
      <article class="step-selection-list card">
        <header class="step-selection-header">
          <h2>Choose Steps to Show</h2>
        </header>
        <div class="step-selection-rows">
          ${candidates.map((candidate, index) => {
            const shown = curationKeepDecisions[index] !== false;
            return `
              <section class="step-selection-row" data-selection-index="${index}">
                <div class="step-selection-row-label">Step ${candidate.isInitial ? 0 : index}</div>
                <div class="step-selection-expression" data-selection-expression="${index}" aria-label="Recorded expression for step ${candidate.isInitial ? 0 : index}"></div>
                <div class="step-visibility-choice" role="radiogroup" aria-label="Visibility for step ${candidate.isInitial ? 0 : index}">
                  ${index === 0 || index === candidates.length - 1
                    ? '<span class="step-visibility-fixed">Show</span>'
                    : `<label><input type="radio" name="step-visibility-${index}" value="show"${shown ? " checked" : ""}> Show</label>
                       <label><input type="radio" name="step-visibility-${index}" value="hide"${shown ? "" : " checked"}> Hide</label>`}
                </div>
              </section>`;
          }).join("")}
        </div>
        <div class="step-selection-finish">
          <button type="button" class="primary-button" data-curation-finish-selection>Continue to Edit Steps</button>
        </div>
      </article>`;
    candidates.forEach((candidate, index) => {
      renderKatex(
        container.querySelector(`[data-selection-expression="${index}"]`),
        candidate.afterKatex || candidate.katex
      );
    });
    byId("continueToGuidanceButton").hidden = true;
  }

  function renderCurationTable() {
    if (curationStage === "select") {
      renderCurationSelection();
      return;
    }
    const container = byId("curationTable");
    const candidates = draft.recording.candidates || [];
    if (!candidates.length) {
      container.innerHTML = '<p class="empty-curation">No expression changes were recorded.</p>';
      byId("continueToGuidanceButton").hidden = true;
      return;
    }
    currentCurationIndex = Math.max(0, Math.min(currentCurationIndex, candidates.length - 1));
    const index = currentCurationIndex;
    const candidate = candidates[index];
    const editing = currentCurationMode === "edit";
    const stepNumber = candidate.isInitial ? 0 : index;
    const isFinalSlide = index === candidates.length - 1;
    const preCompletionEditor = candidate.isInitial
      ? '<div class="step-na-value" aria-label="Pre-completion is not applicable for step 0">N/A</div>'
      : `<textarea rows="3" spellcheck="false" data-step-field="beforeKatex">${escapeHtml(candidate.beforeKatex)}</textarea>`;
    const preCompletionView = candidate.isInitial
      ? '<div class="step-math-view step-na-value" aria-label="Pre-completion is not applicable for step 0">N/A</div>'
      : `<div class="step-math-view" data-step-view="beforeKatex" aria-label="Pre-completion expression for step ${stepNumber}"></div>`;
    container.innerHTML = `
      <article class="step-carousel-slide card" data-candidate-index="${index}" role="group" aria-roledescription="slide" aria-label="Step ${stepNumber}, slide ${index + 1} of ${candidates.length}" tabindex="-1">
        <header class="step-slide-header">
          <nav class="step-carousel-navigation" aria-label="Step carousel navigation">
            <button type="button" class="secondary-button" data-carousel-direction="previous"${index === 0 ? " disabled" : ""}>Previous</button>
            <span class="step-number" aria-live="polite">Step ${stepNumber}</span>
            <button type="button" class="secondary-button" data-carousel-direction="next"${index === candidates.length - 1 ? " disabled" : ""}>Next</button>
          </nav>
          <div class="step-mode-toggle" role="group" aria-label="Step display mode">
            <button type="button" data-curation-mode="view" aria-pressed="${editing ? "false" : "true"}">View</button>
            <button type="button" data-curation-mode="edit" aria-pressed="${editing ? "true" : "false"}">Edit</button>
          </div>
        </header>
        ${editing ? `
          <fieldset class="step-editor-fields">
            <label class="step-edit-field"><span>Pre-completion</span>
              ${preCompletionEditor}
            </label>
            <label class="step-edit-field"><span>Post-completion</span>
              <textarea rows="3" spellcheck="false" data-step-field="afterKatex">${escapeHtml(candidate.afterKatex)}</textarea>
            </label>
          </fieldset>` : `
          <section class="step-view-fields">
            <div class="step-view-field">
              <h3>Pre-completion</h3>
              ${preCompletionView}
            </div>
            <div class="step-view-field">
              <h3>Post-completion</h3>
              <div class="step-math-view" data-step-view="afterKatex" aria-label="Post-completion expression for step ${stepNumber}"></div>
            </div>
          </section>`}
      </article>`;
    const slide = container.querySelector("[data-candidate-index]");
    if (!candidate.isInitial) {
      renderKatex(slide.querySelector('[data-step-view="beforeKatex"]'), candidate.beforeKatex);
    }
    renderKatex(slide.querySelector('[data-step-view="afterKatex"]'), candidate.afterKatex);
    byId("continueToGuidanceButton").hidden = !isFinalSlide;
  }


  function getGuidanceInlineHtml(source) {
    const text = String(source || "");
    let cursor = 0;
    let html = "";
    while (cursor < text.length) {
      const start = text.indexOf("\\(", cursor);
      if (start < 0) {
        html += escapeHtml(text.slice(cursor));
        break;
      }
      html += escapeHtml(text.slice(cursor, start));
      const end = text.indexOf("\\)", start + 2);
      if (end < 0) {
        html += escapeHtml(text.slice(start));
        break;
      }
      const expression = text.slice(start + 2, end).trim();
      html += `<span class="guidance-math" data-guidance-math="${escapeHtml(expression)}" data-display-mode="false"></span>`;
      cursor = end + 2;
    }
    return html;
  }

  function getGuidancePreviewHtml(source) {
    const lines = String(source || "").replace(/\r\n?/g, "\n").split("\n");
    const html = [];
    let index = 0;
    while (index < lines.length) {
      const line = lines[index];
      const trimmed = line.trim();
      if (!trimmed) {
        index += 1;
        continue;
      }
      const heading = trimmed.match(/^#{1,6}\s+(.+)$/);
      if (heading) {
        html.push(`<h3>${getGuidanceInlineHtml(heading[1])}</h3>`);
        index += 1;
        continue;
      }
      if (trimmed === "\\[") {
        const expressionLines = [];
        index += 1;
        while (index < lines.length && lines[index].trim() !== "\\]") {
          expressionLines.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) index += 1;
        html.push(`<div class="guidance-math guidance-math-display" data-guidance-math="${escapeHtml(expressionLines.join("\n").trim())}" data-display-mode="true"></div>`);
        continue;
      }
      const topBullet = line.match(/^-\s+(.+)$/);
      if (topBullet) {
        const items = [];
        while (index < lines.length) {
          const itemMatch = lines[index].match(/^-\s+(.+)$/);
          if (!itemMatch) break;
          index += 1;
          const nested = [];
          while (index < lines.length) {
            const nestedMatch = lines[index].match(/^\s{2,}-\s+(.+)$/);
            if (!nestedMatch) break;
            nested.push(`<li>${getGuidanceInlineHtml(nestedMatch[1])}</li>`);
            index += 1;
          }
          items.push(`<li><span>${getGuidanceInlineHtml(itemMatch[1])}</span>${nested.length ? `<ul>${nested.join("")}</ul>` : ""}</li>`);
        }
        html.push(`<ul class="guidance-preview-list">${items.join("")}</ul>`);
        continue;
      }
      html.push(`<p>${getGuidanceInlineHtml(trimmed)}</p>`);
      index += 1;
    }
    return html.join("");
  }

  function renderGuidancePreview() {
    const target = byId("exerciseGuidanceView");
    target.innerHTML = getGuidancePreviewHtml(draft.metadata.exerciseGuidance);
    target.querySelectorAll("[data-guidance-math]").forEach(node => {
      const expression = node.dataset.guidanceMath || "";
      if (!window.katex) {
        node.textContent = expression;
        return;
      }
      window.katex.render(expression, node, {
        throwOnError: false,
        displayMode: node.dataset.displayMode === "true"
      });
    });
  }

  function renderGuidanceMode() {
    const editing = currentGuidanceMode === "edit";
    byId("exerciseGuidanceView").hidden = editing;
    byId("exerciseGuidanceEditor").hidden = !editing;
    document.querySelectorAll("[data-guidance-mode]").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.guidanceMode === currentGuidanceMode));
    });
    if (!editing) renderGuidancePreview();
  }

  function defaultExerciseGuidance() {
    return ["## Problem Statement", "", "\\[", draft.initialKatex, "\\]"].join("\n");
  }

  function renderGuidancePhase() {
    if (!draft.metadata.exerciseGuidance.trim()) {
      draft.metadata.exerciseGuidance = defaultExerciseGuidance();
    }
    byId("exerciseGuidance").value = draft.metadata.exerciseGuidance;
    currentGuidanceMode = "view";
    renderGuidanceMode();
  }

  function downloadLevel(level) {
    const blob = new Blob([`${JSON.stringify(level, null, 2)}\n`], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${level.id}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  }

  async function exportProblem(openPlayer) {
    const status = byId("exportStatus");
    const preview = openPlayer ? window.open("about:blank", "_blank") || window : null;
    const buttons = [byId("openInPlayerButton"), byId("downloadLevelButton")];
    buttons.forEach(button => { button.disabled = true; });
    try {
      const candidates = curationStage === "select"
        ? curationSelectionSource.filter((_, index) => curationKeepDecisions[index])
        : draft.recording.candidates;
      const level = (await waitForApi()).validateLevel(buildExportLevel(candidates));
      if (preview) {
        const fileName = `${level.id}.json`;
        const params = { source: "problem-editor", level: fileName, mode: "guided", build: "1" };
        ExplodedAlgebraTransfer.open("exploded-algebra.html", params,
          { fileName, text: JSON.stringify(level) }, preview);
        status.textContent = "Opened in Player.";
      } else {
        downloadLevel(level);
        status.textContent = `Downloaded ${level.id}.json.`;
      }
    } catch (error) {
      if (preview && preview !== window) preview.close();
      status.textContent = error.message || "The problem could not be opened or downloaded.";
    } finally {
      buttons.forEach(button => { button.disabled = false; });
    }
  }

  function loadTransferredLevel() {
    if (new URLSearchParams(window.location.search).get("source") !== "transfer") return;
    try {
      const payload = ExplodedAlgebraTransfer.read();
      transferredLevel = JSON.parse(payload.text);
      byId("moveFile").required = false;
      byId("moveFileLabel").hidden = true;
      byId("transferredFile").hidden = false;
      byId("transferredFile").textContent = `Editing a copy of ${payload.fileName}.`;
      byId("problemTitle").value = transferredLevel.kind === "demoOnly"
        ? (transferredLevel.sourceLevelTitle || "New problem")
        : (transferredLevel.title || "New problem");
      const prescribed = transferredLevel.kind !== "demoOnly" && transferredLevel.numericalRewriteMode === "prescribed";
      byId("setupForm").elements.rewriteMode.value = prescribed ? "prescribed" : "free";
    } catch (error) {
      byId("setupError").textContent = error.message || "The level could not be transferred.";
    }
  }

  byId("setupForm").addEventListener("submit", openMoves);
  byId("curationTable").addEventListener("input", event => {
    const field = event.target.dataset.stepField;
    if (!field) return;
    const row = event.target.closest("[data-candidate-index]");
    const candidate = draft.recording.candidates[Number(row.dataset.candidateIndex)];
    if (!candidate) return;
    candidate[field] = event.target.value;
  });
  byId("curationTable").addEventListener("click", event => {
    const visibilityChoice = event.target.closest('input[type="radio"][name^="step-visibility-"]');
    if (visibilityChoice && curationStage === "select") {
      const row = visibilityChoice.closest("[data-selection-index]");
      const index = Number(row && row.dataset.selectionIndex);
      if (Number.isInteger(index) && index >= 0 && index < curationKeepDecisions.length) {
        curationKeepDecisions[index] = visibilityChoice.value === "show";
      }
      return;
    }
    const finishSelectionButton = event.target.closest("[data-curation-finish-selection]");
    if (finishSelectionButton && curationStage === "select") {
      finishCurationSelection();
      return;
    }
    const modeButton = event.target.closest("[data-curation-mode]");
    if (modeButton) {
      currentCurationMode = modeButton.dataset.curationMode;
      renderCurationTable();
      byId("curationTable").querySelector(`[data-curation-mode="${currentCurationMode}"]`)?.focus({ preventScroll: true });
      return;
    }
    const button = event.target.closest("[data-carousel-direction]");
    if (!button || button.disabled) return;
    const offset = button.dataset.carouselDirection === "next" ? 1 : -1;
    currentCurationIndex += offset;
    renderCurationTable();
    byId("curationTable").querySelector(".step-carousel-slide")?.focus({ preventScroll: true });
  });
  byId("continueToGuidanceButton").addEventListener("click", () => setPhase(3));
  document.querySelectorAll("[data-guidance-mode]").forEach(button => {
    button.addEventListener("click", () => {
      currentGuidanceMode = button.dataset.guidanceMode;
      renderGuidanceMode();
      if (currentGuidanceMode === "edit") {
        byId("exerciseGuidance").focus({ preventScroll: true });
      } else {
        button.focus({ preventScroll: true });
      }
    });
  });
  byId("exerciseGuidance").addEventListener("input", event => {
    draft.metadata.exerciseGuidance = event.target.value;
  });
  byId("openInPlayerButton").addEventListener("click", () => exportProblem(true));
  byId("downloadLevelButton").addEventListener("click", () => exportProblem(false));
  loadTransferredLevel();

})();
