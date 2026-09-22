(() => {
  "use strict";

  const TEST_STORAGE_PREFIX = "explodedAlgebra.builderTest.";
  const LEVEL_WINDOW_NAME_PREFIX = "__EXPLODED_ALGEBRA_LEVEL__:";
  const FORMAT_VERSION = 1;
  const VARIABLES = ["x"];
  const NUMERICAL_REWRITE_RULES = [
    { id: "nonnegativeArithmetic", label: "Nonnegative addition and multiplication", example: "23 + 14 ↔ 37; 24 · 37 ↔ 888", forward: ["automatic", "manual"], reverse: ["manual"] },
    { id: "signedArithmetic", label: "Signed number addition and multiplication", example: "8 + (−1) · 12 ↔ (−1) · 4; (−1) · 4 · 7 ↔ (−1) · 28", forward: ["automatic", "manual", "not-allowed"], reverse: ["manual", "not-allowed"] },
    { id: "nonnegativeFractionSimplification", label: "Non-negative fraction simplification", example: "18 · inverse(24) ↔ 3 · inverse(4)", forward: ["automatic", "manual", "not-allowed"], reverse: ["manual", "not-allowed"] },
    { id: "signedFractionSimplification", label: "Signed fraction simplification", example: "(−1) · 18 · inverse(24) ↔ (−1) · 3 · inverse(4)", forward: ["automatic", "manual", "not-allowed"], reverse: ["manual", "not-allowed"] },
    { id: "inverseOne", label: "Inverse of one", example: "inverse(1) ↔ 1", forward: ["automatic", "manual"], reverse: ["manual"] },
    { id: "inverseNegativeOne", label: "Inverse of negative one", example: "inverse(−1) ↔ −1", forward: ["automatic", "manual"], reverse: ["manual"] },
    { id: "doubleNegative", label: "Negative one times negative one", example: "(−1) · (−1) ↔ 1", forward: ["automatic", "manual"], reverse: ["manual"] }
  ];
  const CONFIGURABLE_NUMERICAL_REWRITE_RULES = NUMERICAL_REWRITE_RULES;
  const NUMERICAL_PERMISSION_LABELS = {
    automatic: "Automatic",
    manual: "Manual",
    "not-allowed": "Not allowed"
  };

  const byId = id => document.getElementById(id);
  const workspace = byId("eaWorkspace");
  const workspaceShell = byId("workspaceShell");
  const phases = Array.from(document.querySelectorAll(".phase"));
  let currentPhase = 1;
  let loadedWorkspacePhase = 0;
  let iframeReady = false;
  let idWasEdited = false;
  let initialCommitInProgress = false;
  let currentCurationIndex = 0;
  let currentCurationMode = "view";
  let curationStage = "select";
  let curationSelectionIndex = 0;
  let curationSelectionSource = [];
  let curationKeepDecisions = [];
  let draft = makeFreshDraft();

  function makeFreshDraft() {
    return {
      metadata: { title: "", id: "", instruction: "", completionMessage: "" },
      settings: {
        numericalRewrite: {
          rules: Object.fromEntries(CONFIGURABLE_NUMERICAL_REWRITE_RULES.map(rule => [
            rule.id,
            { forward: "manual", reverse: "manual" }
          ]))
        },
        includeUndoActions: false,
        excludedDefaultTools: [],
        allowedUnavailableTools: []
      },
      initial: {
        expression: "",
        katex: "",
        eaLocked: false,
        conventionalLocked: false,
        workspaceSnapshot: null
      },
      recording: {
        workspaceSnapshot: null,
        candidates: [],
        finalExpression: "",
        finalKatex: "",
        finished: false
      }
    };
  }

  function getApi() {
    try {
      return workspace.contentWindow && workspace.contentWindow.ExplodedAlgebraAuthoring;
    } catch (error) {
      return null;
    }
  }

  function waitForApi(timeoutMs = 12000) {
    const started = Date.now();
    return new Promise((resolve, reject) => {
      const check = () => {
        const api = getApi();
        if (api) {
          iframeReady = true;
          resolve(api);
          return;
        }
        if (Date.now() - started > timeoutMs) {
          reject(new Error("The Exploded Algebra workspace did not finish loading."));
          return;
        }
        setTimeout(check, 80);
      };
      check();
    });
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

  function initializeSetupDefaults() {
    const timestamp = String(Date.now());
    byId("exerciseTitle").value = timestamp;
    byId("exerciseId").value = slugify(timestamp);
  }

  function renderNumericalPermissionTable() {
    const target = byId("numericalPermissionsTable");
    target.innerHTML = NUMERICAL_REWRITE_RULES.map((rule, index) => {
        const forwardName = `numerical-${rule.id}-forward`;
        const reverseName = `numerical-${rule.id}-reverse`;
        const headingId = `numerical-${rule.id}-heading`;
        const forwardId = `numerical-${rule.id}-forward-heading`;
        const reverseId = `numerical-${rule.id}-reverse-heading`;
        const inputs = (name, options) => options.map(value =>
          `<label><input type="radio" name="${name}" value="${value}"${value === "manual" ? " checked" : ""}> ${NUMERICAL_PERMISSION_LABELS[value]}</label>`
        ).join("");
        return `
          <section class="numerical-permission-rule" role="listitem" aria-labelledby="${headingId}">
            <h3 id="${headingId}" class="numerical-rule-name"><span>${index + 1}.</span> ${escapeHtml(rule.label)}</h3>
            <p class="numerical-rule-example">${escapeHtml(rule.example)}</p>
            <div class="permission-direction" role="group" aria-labelledby="${forwardId}">
              <h4 id="${forwardId}" class="permission-direction-title">Forward</h4>
              <div class="permission-options">
                ${inputs(forwardName, rule.forward)}
              </div>
            </div>
            <div class="permission-direction" role="group" aria-labelledby="${reverseId}">
              <h4 id="${reverseId}" class="permission-direction-title">Reverse</h4>
              <div class="permission-options">
                ${inputs(reverseName, rule.reverse)}
              </div>
            </div>
          </section>`;
      }).join("");
  }

  function readNumericalPermissionChoices() {
    return Object.fromEntries(CONFIGURABLE_NUMERICAL_REWRITE_RULES.map(rule => [
      rule.id,
      {
        forward: document.querySelector(`input[name="numerical-${rule.id}-forward"]:checked`).value,
        reverse: document.querySelector(`input[name="numerical-${rule.id}-reverse"]:checked`).value
      }
    ]));
  }

  function sameExpressionText(first, second) {
    return String(first || "").replace(/\s+/g, "") === String(second || "").replace(/\s+/g, "");
  }

  function collectSetup() {
    draft.metadata = {
      title: byId("exerciseTitle").value.trim(),
      id: byId("exerciseId").value.trim(),
      instruction: "",
      completionMessage: ""
    };
    draft.settings.numericalRewrite = { rules: readNumericalPermissionChoices() };
    draft.settings.includeUndoActions = document.querySelector('input[name="includeUndo"]:checked').value === "yes";
    draft.settings.excludedDefaultTools = [];
  }

  function validateSetup(showError = true) {
    collectSetup();
    let message = "";
    if (!draft.metadata.title) message = "Enter an exercise or level name.";
    else if (!draft.metadata.id) message = "Enter an ID / slug.";
    else if (!/^[A-Za-z0-9_-]+$/.test(draft.metadata.id)) message = "The ID may contain only letters, numbers, hyphens, and underscores.";
    if (showError) byId("setupError").textContent = message;
    return !message;
  }

  function inferVariables(expression) {
    return /(^|[^A-Za-z])x([^A-Za-z]|$)/.test(String(expression || "")) ? ["x"] : [];
  }

  function getLevelBase() {
    const level = {
      format: "exploded-algebra-level",
      formatVersion: FORMAT_VERSION,
      kind: "guidedCapable",
      id: draft.metadata.id,
      title: draft.metadata.title,
      startExpression: draft.initial.expression,
      initialKatex: draft.initial.katex,
      numericalRewrite: { ...draft.settings.numericalRewrite },
      variables: inferVariables(draft.initial.expression),
      excludedDefaultTools: [...draft.settings.excludedDefaultTools],
      allowedUnavailableTools: [...draft.settings.allowedUnavailableTools],
      includeUndoActions: draft.settings.includeUndoActions
    };
    if (draft.metadata.instruction) level.instruction = draft.metadata.instruction;
    if (draft.metadata.completionMessage) level.completionMessage = draft.metadata.completionMessage;
    return level;
  }

  function buildExportLevel() {
    const snapshot = draft.recording.workspaceSnapshot;
    const recorder = snapshot && snapshot.recorder ? snapshot.recorder : { actions: [], demoSteps: [] };
    const recordedCandidates = draft.recording.candidates || [];
    const initialCandidate = recordedCandidates.find(candidate => candidate.isInitial);
    const steps = recordedCandidates.map(candidate => {
      const step = {
        expression: candidate.expression,
        explodedExpression: candidate.expression,
        katex: candidate.afterKatex,
        beforeKatex: candidate.beforeKatex,
        afterKatex: candidate.afterKatex
      };
      if (!candidate.isInitial) {
        step.actionStartIndex = candidate.actionStartIndex;
        step.actionEndIndex = candidate.actionEndIndex;
      }
      if (candidate.instruction && candidate.instruction.trim()) step.guidance = candidate.instruction.trim();
      return step;
    });
    const level = {
      ...getLevelBase(),
      initialKatex: initialCandidate && initialCandidate.afterKatex || draft.initial.katex,
      steps,
      demo: {
        format: "exploded-algebra-guided-actions-v1",
        steps: JSON.parse(JSON.stringify(recorder.demoSteps || []))
      },
      recordedActions: JSON.parse(JSON.stringify(recorder.actions || [])),
      finalExpression: draft.recording.finalExpression || recordedCandidates.at(-1)?.expression || draft.initial.expression,
      finalKatex: recordedCandidates.at(-1)?.afterKatex || draft.recording.finalKatex || draft.initial.katex
    };
    const initialInstruction = initialCandidate && initialCandidate.instruction
      ? initialCandidate.instruction.trim()
      : "";
    if (initialInstruction) level.instruction = initialInstruction;
    else delete level.instruction;
    return level;
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

  function renderMixedInstruction(target, source) {
    if (!target) return;
    target.replaceChildren();
    const text = String(source || "");
    let cursor = 0;

    const appendText = value => {
      if (value) target.appendChild(document.createTextNode(value));
    };

    while (cursor < text.length) {
      const inlineStart = text.indexOf("\\(", cursor);
      const displayStart = text.indexOf("\\[", cursor);
      const starts = [
        { index: inlineStart, close: "\\)", displayMode: false },
        { index: displayStart, close: "\\]", displayMode: true }
      ].filter(item => item.index >= 0).sort((left, right) => left.index - right.index);
      if (!starts.length) {
        appendText(text.slice(cursor));
        break;
      }

      const match = starts[0];
      appendText(text.slice(cursor, match.index));
      const mathStart = match.index + 2;
      const mathEnd = text.indexOf(match.close, mathStart);
      if (mathEnd < 0) {
        appendText(text.slice(match.index));
        break;
      }

      const math = text.slice(mathStart, mathEnd);
      const mathTarget = document.createElement(match.displayMode ? "div" : "span");
      mathTarget.className = match.displayMode ? "instruction-math-display" : "instruction-math-inline";
      if (window.katex) {
        window.katex.render(math, mathTarget, { throwOnError: false, displayMode: match.displayMode });
      } else {
        mathTarget.textContent = `${match.displayMode ? "\\[" : "\\("}${math}${match.close}`;
      }
      target.appendChild(mathTarget);
      cursor = mathEnd + 2;
    }
  }

  function moveWorkspaceTo(slotId) {
    const slot = byId(slotId);
    if (slot && workspaceShell.parentElement !== slot) slot.appendChild(workspaceShell);
    workspaceShell.style.display = "block";
    requestAnimationFrame(() => {
      const api = getApi();
      if (api) api.refreshLayout();
    });
  }

  async function preparePhase2() {
    moveWorkspaceTo("phase2WorkspaceSlot");
    const api = await waitForApi();
    let snapshot;
    if (loadedWorkspacePhase !== 2) {
      const resume = draft.initial.workspaceSnapshot || (draft.initial.expression ? {
        currentExpression: draft.initial.expression,
        initialCommitted: true
      } : null);
      snapshot = api.loadInitialSession({
        ...getLevelBase(),
        initialKatex: draft.initial.katex || undefined,
        variables: VARIABLES
      }, resume);
      loadedWorkspacePhase = 2;
    } else {
      snapshot = api.getSnapshot();
    }
    if (!snapshot.builderActive) {
      api.startInitialExpressionBuilder(snapshot.builderDraft || null);
      snapshot = api.getSnapshot();
    }
    draft.initial.workspaceSnapshot = snapshot;
    document.body.classList.add("phase2-expression-building");
    byId("initialExpressionStatus").textContent = "Enter values and operations, then tap each operation in the expression to resolve its grouping.";
  }

  async function preparePhase3() {
    moveWorkspaceTo("phase3WorkspaceSlot");
    const api = await waitForApi();
    if (loadedWorkspacePhase !== 3) {
      draft.recording.workspaceSnapshot = api.loadRecordingSession(getLevelBase(), draft.recording.workspaceSnapshot);
      loadedWorkspacePhase = 3;
    }
    document.body.classList.add("phase3-recording");
    syncFinishRecordingControl(api.getSnapshot());
    api.refreshLayout();
  }

  function syncFinishRecordingControl(snapshot) {
    const api = getApi();
    const isAvailable = currentPhase === 3 && !!snapshot && snapshot.preselectionActive === true;
    if (!api || typeof api.setFinishRecordingControlVisible !== "function") return;
    api.setFinishRecordingControlVisible(isAvailable);
  }

  function makeInitialCurationCandidate(api) {
    const prior = (draft.recording.candidates || []).find(candidate => candidate.isInitial);
    const generatedKatex = draft.initial.katex || api.generateKatex(draft.initial.expression);
    return {
      key: "initial-expression",
      expression: draft.initial.expression,
      beforeExpression: draft.initial.expression,
      beforeKatex: prior && prior.beforeKatex || generatedKatex,
      afterKatex: prior && prior.afterKatex || generatedKatex,
      instruction: prior ? prior.instruction || "" : draft.metadata.instruction || "",
      isInitial: true
    };
  }

  function getRecordedActions(snapshot) {
    const recorder = snapshot && snapshot.recorder ? snapshot.recorder : { actions: [] };
    return Array.isArray(recorder.actions) ? recorder.actions : [];
  }

  function getActionPrefix(actions, actionEndIndex) {
    return JSON.stringify(actions.slice(0, actionEndIndex));
  }

  function reconcileRecordedSteps(snapshot) {
    const actions = getRecordedActions(snapshot);
    draft.recording.candidates = (draft.recording.candidates || []).filter(candidate => {
      if (candidate.isInitial) return true;
      return candidate.actionEndIndex <= actions.length &&
        candidate.actionPrefix === getActionPrefix(actions, candidate.actionEndIndex);
    });
  }

  function recordAutomaticMajorStep(snapshot, api) {
    reconcileRecordedSteps(snapshot);
    const actions = getRecordedActions(snapshot);
    const previous = (draft.recording.candidates || []).at(-1);
    const beforeExpression = previous && !previous.isInitial ? previous.expression : draft.initial.expression;
    const actionStartIndex = previous && !previous.isInitial ? previous.actionEndIndex : 0;
    const expression = String(snapshot && snapshot.currentExpression || "").trim();
    if (!expression || actions.length <= actionStartIndex || sameExpressionText(expression, beforeExpression)) {
      return false;
    }
    const generatedStepKatex = api.generateKatex(expression);
    draft.recording.candidates.push({
      key: `recorded-step-${draft.recording.candidates.length + 1}-${actions.length}`,
      expression,
      beforeExpression,
      beforeKatex: generatedStepKatex,
      afterKatex: generatedStepKatex,
      instruction: "",
      actionStartIndex,
      actionEndIndex: actions.length,
      actionPrefix: getActionPrefix(actions, actions.length),
      isInitial: false
    });
    draft.recording.workspaceSnapshot = snapshot;
    return true;
  }

  async function finishRecordingFromControl() {
    const api = await waitForApi();
    const snapshot = api.getSnapshot();
    await finishRecording(snapshot, api);
  }

  function startCurationSelection() {
    curationStage = "select";
    curationSelectionIndex = 0;
    curationSelectionSource = JSON.parse(JSON.stringify(draft.recording.candidates || []));
    curationKeepDecisions = curationSelectionSource.map(() => true);
    renderCurationTable();
  }

  function restartCurationSelection() {
    curationKeepDecisions = curationSelectionSource.map(() => true);
    renderCurationTable();
  }

  function finishCurationSelection() {
    const kept = curationSelectionSource.filter((candidate, index) => curationKeepDecisions[index] !== false);
    if (!kept.length) {
      window.alert("Show at least one recorded expression.");
      return;
    }
    const originalFirst = curationSelectionSource[0];
    if (originalFirst && originalFirst.isInitial && !kept.some(candidate => candidate.isInitial)) {
      kept.unshift(originalFirst);
    }
    for (let index = 1; index < kept.length; index += 1) {
      const previousKept = kept[index - 1];
      const candidate = kept[index];
      if (!candidate.isInitial) {
        candidate.beforeExpression = previousKept.expression;
        candidate.beforeKatex = previousKept.afterKatex;
        const sourceIndex = curationSelectionSource.findIndex(item => item.key === candidate.key);
        const previousSourceIndex = curationSelectionSource.findIndex(item => item.key === previousKept.key);
        const firstRemovedAfterPrevious = curationSelectionSource
          .slice(Math.max(0, previousSourceIndex + 1), Math.max(0, sourceIndex))
          .find(item => Number.isInteger(item.actionStartIndex));
        if (firstRemovedAfterPrevious) candidate.actionStartIndex = firstRemovedAfterPrevious.actionStartIndex;
      }
    }
    draft.recording.candidates = kept;
    curationStage = "edit";
    currentCurationIndex = 0;
    currentCurationMode = "view";
    renderCurationTable();
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
          <button type="button" class="secondary-button restart-selection-button" data-curation-restart>Reset to Show All</button>
        </header>
        <div class="step-selection-rows">
          ${candidates.map((candidate, index) => {
            const shown = curationKeepDecisions[index] !== false;
            return `
              <section class="step-selection-row" data-selection-index="${index}">
                <div class="step-selection-row-label">Step ${candidate.isInitial ? 0 : index}</div>
                <div class="step-selection-expression" data-selection-expression="${index}" aria-label="Recorded expression for step ${candidate.isInitial ? 0 : index}"></div>
                <div class="step-visibility-choice" role="radiogroup" aria-label="Visibility for step ${candidate.isInitial ? 0 : index}">
                  <label><input type="radio" name="step-visibility-${index}" value="show"${shown ? " checked" : ""}> Show</label>
                  <label><input type="radio" name="step-visibility-${index}" value="hide"${shown ? "" : " checked"}> Hide</label>
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
        candidate.afterKatex || candidate.beforeKatex || candidate.expression
      );
    });
    byId("deleteStepButton").hidden = true;
    byId("completeExerciseButton").hidden = true;
  }

  function deleteCurationCandidateAt(candidates, index) {
    if (!Array.isArray(candidates) || index <= 0 || index >= candidates.length - 1) {
      return false;
    }
    const removed = candidates[index];
    const next = candidates[index + 1];
    if (next && !next.isInitial) {
      if (Number.isInteger(removed.actionStartIndex)) {
        next.actionStartIndex = removed.actionStartIndex;
      }
      if (removed.beforeExpression) {
        next.beforeExpression = removed.beforeExpression;
      }
    }
    candidates.splice(index, 1);
    return true;
  }

  function deleteCurrentCurationStep() {
    const candidates = draft.recording.candidates || [];
    if (!deleteCurationCandidateAt(candidates, currentCurationIndex)) return;
    currentCurationIndex = Math.min(currentCurationIndex, candidates.length - 1);
    renderCurationTable();
    byId("curationTable").querySelector(".step-carousel-slide")?.focus({ preventScroll: true });
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
      byId("deleteStepButton").hidden = true;
      byId("completeExerciseButton").hidden = true;
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
            <label class="step-edit-field"><span>Instructions</span>
              <textarea rows="3" data-step-field="instruction"></textarea>
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
              <h3>Instructions</h3>
              <div class="step-instruction-view"></div>
            </div>
            <div class="step-view-field">
              <h3>Post-completion</h3>
              <div class="step-math-view" data-step-view="afterKatex" aria-label="Post-completion expression for step ${stepNumber}"></div>
            </div>
          </section>`}
      </article>`;
    const slide = container.querySelector("[data-candidate-index]");
    const instructionField = slide.querySelector('[data-step-field="instruction"]');
    if (instructionField) instructionField.value = candidate.instruction || "";
    if (!candidate.isInitial) {
      renderKatex(slide.querySelector('[data-step-view="beforeKatex"]'), candidate.beforeKatex);
    }
    renderKatex(slide.querySelector('[data-step-view="afterKatex"]'), candidate.afterKatex);
    renderMixedInstruction(slide.querySelector(".step-instruction-view"), candidate.instruction);
    byId("deleteStepButton").hidden = index === 0 || isFinalSlide;
    byId("completeExerciseButton").hidden = !isFinalSlide;
  }

  function renderCuration() {
    renderCurationTable();
  }

  async function finishRecording(providedSnapshot = null, providedApi = null) {
    const api = providedApi || await waitForApi();
    const snapshot = providedSnapshot || api.getSnapshot();
    draft.recording.workspaceSnapshot = snapshot;
    recordAutomaticMajorStep(snapshot, api);
    reconcileRecordedSteps(snapshot);
    if (!draft.recording.candidates.length) {
      window.alert("Complete at least one expression-changing solution step before choosing All Done.");
      return;
    }
    draft.recording.candidates = [makeInitialCurationCandidate(api), ...draft.recording.candidates];
    currentCurationIndex = 0;
    currentCurationMode = "view";
    curationStage = "select";
    curationSelectionIndex = 0;
    curationSelectionSource = JSON.parse(JSON.stringify(draft.recording.candidates));
    curationKeepDecisions = curationSelectionSource.map(() => true);
    draft.recording.finalExpression = snapshot.currentExpression;
    draft.recording.finalKatex = api.generateKatex(snapshot.currentExpression);
    draft.recording.finished = true;
    setPhase(4);
  }

  async function validateExportLevel() {
    const api = await waitForApi();
    return api.validateLevel(buildExportLevel());
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

  async function finishExercise() {
    const status = byId("exportStatus");
    const previewWindow = window.open("about:blank", "_blank");
    try {
      const level = await validateExportLevel();
      downloadLevel(level);
      const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const storageKey = TEST_STORAGE_PREFIX + token;
      const payloadText = JSON.stringify({
        version: 1,
        fileName: `${level.id}.json`,
        text: JSON.stringify(level)
      });
      try { localStorage.setItem(storageKey, payloadText); } catch (error) { /* window.name is the fallback */ }
      if (!previewWindow) {
        status.textContent = `Downloaded ${level.id}.json, but the browser blocked the preview tab.`;
        return;
      }
      const previewUrl = `exploded-algebra.html?source=builder&draftKey=${encodeURIComponent(storageKey)}&level=${encodeURIComponent(`${level.id}.json`)}`;
      previewWindow.name = LEVEL_WINDOW_NAME_PREFIX + payloadText;
      previewWindow.location.href = previewUrl;
      status.textContent = `Downloaded ${level.id}.json and opened its preview.`;
    } catch (error) {
      if (previewWindow) previewWindow.close();
      status.textContent = error.message || "The exercise could not be completed.";
    }
  }

  async function setPhase(number) {
    const target = Number(number);
    if (currentPhase === 2 && loadedWorkspacePhase === 2) captureWorkspaceSnapshot();
    if (currentPhase === 3 && loadedWorkspacePhase === 3) captureWorkspaceSnapshot();
    currentPhase = target;
    document.body.classList.remove("phase2-expression-building", "phase3-recording");
    phases.forEach(section => { section.hidden = Number(section.dataset.phase) !== target; });
    workspaceShell.style.display = "none";
    window.scrollTo({ top: 0, behavior: target >= 3 ? "auto" : "smooth" });
    if (target === 2) await preparePhase2();
    else if (target === 3) await preparePhase3();
    else if (target === 4) await renderCuration();
  }

  function captureWorkspaceSnapshot() {
    const api = getApi();
    if (!api) return false;
    const snapshot = api.getSnapshot();
    if (loadedWorkspacePhase === 2) draft.initial.workspaceSnapshot = snapshot;
    else if (loadedWorkspacePhase === 3) draft.recording.workspaceSnapshot = snapshot;
    return true;
  }

  function resetDownstreamRecording() {
    draft.recording = {
      workspaceSnapshot: null,
      candidates: [],
      finalExpression: "",
      finalKatex: "",
      finished: false
    };
  }

  async function acceptInitialExpressionAndSolve() {
    if (initialCommitInProgress || currentPhase !== 2) return;
    const api = await waitForApi();
    const snapshot = api.getSnapshot();
    if (!snapshot.initialCommitted || snapshot.builderActive || !snapshot.currentExpression) return;
    initialCommitInProgress = true;
    const changed = draft.initial.expression && !sameExpressionText(draft.initial.expression, snapshot.currentExpression);
    if (changed || draft.recording.workspaceSnapshot) resetDownstreamRecording();
    draft.initial.expression = snapshot.currentExpression;
    draft.initial.katex = snapshot.currentKatex || api.generateKatex(snapshot.currentExpression);
    draft.initial.eaLocked = true;
    draft.initial.conventionalLocked = true;
    draft.initial.workspaceSnapshot = snapshot;
    loadedWorkspacePhase = 0;
    try {
      await setPhase(3);
    } finally {
      initialCommitInProgress = false;
    }
  }

  function installEventHandlers() {
    byId("exerciseTitle").addEventListener("input", event => {
      if (!idWasEdited) byId("exerciseId").value = slugify(event.target.value);
    });
    byId("exerciseId").addEventListener("input", () => { idWasEdited = true; });
    byId("setupForm").addEventListener("submit", event => {
      event.preventDefault();
      if (validateSetup(true)) setPhase(2);
    });

    byId("curationTable").addEventListener("input", event => {
      const field = event.target.dataset.stepField;
      if (!field) return;
      const row = event.target.closest("[data-candidate-index]");
      const candidate = draft.recording.candidates[Number(row.dataset.candidateIndex)];
      if (!candidate) return;
      candidate[field] = event.target.value;
    });
    byId("curationTable").addEventListener("click", event => {
      const restartButton = event.target.closest("[data-curation-restart]");
      if (restartButton) {
        restartCurationSelection();
        return;
      }
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
    byId("deleteStepButton").addEventListener("click", deleteCurrentCurationStep);
    byId("completeExerciseButton").addEventListener("click", finishExercise);

    window.addEventListener("message", event => {
      if (event.source !== workspace.contentWindow || !event.data || event.data.source !== "exploded-algebra-authoring") return;
      if (event.data.type === "ready") {
        iframeReady = true;
      }
      if (event.data.type === "interaction-state") {
        const api = getApi();
        const snapshot = api && api.getSnapshot();
        if (currentPhase === 3 && event.data.detail && event.data.detail.preselectionActive && snapshot) {
          recordAutomaticMajorStep(snapshot, api);
        }
        syncFinishRecordingControl(event.data.detail);
      }
      if (event.data.type === "finish-recording") {
        finishRecordingFromControl();
      }
      if (event.data.type === "initial-expression-committed") {
        acceptInitialExpressionAndSolve();
      } else if (event.data.type === "state-change") {
        captureWorkspaceSnapshot();
        const api = getApi();
        const snapshot = api && api.getSnapshot();
        if (currentPhase === 3) syncFinishRecordingControl(snapshot);
        if (currentPhase === 2 && snapshot && !snapshot.builderActive && !snapshot.initialCommitted) {
          api.startInitialExpressionBuilder(null);
        }
      }
    });
  }

  renderNumericalPermissionTable();
  initializeSetupDefaults();
  installEventHandlers();
  waitForApi().catch(error => window.alert(error.message));
  setPhase(1);
})();
