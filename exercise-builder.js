(() => {
  "use strict";

  const TEST_STORAGE_PREFIX = "explodedAlgebra.builderTest.";
  const LEVEL_WINDOW_NAME_PREFIX = "__EXPLODED_ALGEBRA_LEVEL__:";
  const FORMAT_VERSION = 1;
  const VARIABLES = ["x"];

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
  let draft = makeFreshDraft();

  function makeFreshDraft() {
    return {
      metadata: { title: "", id: "", instruction: "", completionMessage: "" },
      settings: {
        numericalRewrite: {
          addition: "expression-terms",
          multiplication: "unrestricted",
          allowNegativeOne: true,
          allowInverses: true
        },
        includeUndoActions: true,
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
          populateToolPermissions(api.getToolCatalog());
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

  function sameExpressionText(first, second) {
    return String(first || "").replace(/\s+/g, "") === String(second || "").replace(/\s+/g, "");
  }

  function collectSetup() {
    draft.metadata = {
      title: byId("exerciseTitle").value.trim(),
      id: byId("exerciseId").value.trim(),
      instruction: byId("exerciseInstruction").value.trim(),
      completionMessage: byId("completionMessage").value.trim()
    };
    draft.settings.numericalRewrite = {
      addition: byId("additionPermission").value,
      multiplication: byId("multiplicationPermission").value,
      allowNegativeOne: byId("allowNegativeOne").checked,
      allowInverses: byId("allowInverses").checked
    };
    draft.settings.includeUndoActions = document.querySelector('input[name="includeUndo"]:checked').value === "yes";
    draft.settings.excludedDefaultTools = Array.from(document.querySelectorAll("#toolPermissionList input[data-tool-key]"))
      .filter(input => !input.checked)
      .map(input => input.dataset.toolKey);
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
    const includedCandidates = (draft.recording.candidates || []).filter(candidate => candidate.included !== false);
    const initialCandidate = includedCandidates.find(candidate => candidate.isInitial);
    const steps = includedCandidates.map(candidate => {
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
      finalExpression: draft.recording.finalExpression || includedCandidates.at(-1)?.expression || draft.initial.expression,
      finalKatex: includedCandidates.at(-1)?.afterKatex || draft.recording.finalKatex || draft.initial.katex
    };
    const initialInstruction = initialCandidate && initialCandidate.instruction
      ? initialCandidate.instruction.trim()
      : "";
    if (initialInstruction) level.instruction = initialInstruction;
    else delete level.instruction;
    return level;
  }

  function populateToolPermissions(catalog) {
    const container = byId("toolPermissionList");
    if (!container || container.dataset.loaded === "yes") return;
    container.dataset.loaded = "yes";
    container.innerHTML = catalog.map(tool => `<label><input type="checkbox" data-tool-key="${escapeHtml(tool.key)}" checked> ${escapeHtml(tool.label)}</label>`).join("");
    applyToolExclusions();
  }

  function applyToolExclusions() {
    const excluded = new Set(draft.settings.excludedDefaultTools || []);
    document.querySelectorAll("#toolPermissionList input[data-tool-key]").forEach(input => {
      input.checked = !excluded.has(input.dataset.toolKey);
    });
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
    syncFinishRecordingButton(api.getSnapshot());
    api.refreshLayout();
  }

  function syncFinishRecordingButton(snapshot) {
    byId("finishRecordingButton").hidden = currentPhase !== 3 || !snapshot || snapshot.preselectionActive !== true;
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
      included: true,
      required: true,
      isInitial: true
    };
  }

  function deriveStepCandidates(snapshot, api) {
    const recorder = snapshot && snapshot.recorder ? snapshot.recorder : { actions: [] };
    const actions = Array.isArray(recorder.actions) ? recorder.actions : [];
    const previous = Array.isArray(draft.recording.candidates) ? draft.recording.candidates : [];
    const previousByExpression = new Map();
    previous.filter(candidate => !candidate.isInitial).forEach(candidate => {
      const key = String(candidate.expression || "").replace(/\s+/g, "");
      if (!previousByExpression.has(key)) previousByExpression.set(key, []);
      previousByExpression.get(key).push(candidate);
    });

    const candidates = [];
    let currentExpression = draft.initial.expression;
    let actionStartIndex = 0;
    const occurrences = new Map();

    const addCandidate = (nextExpression, actionEndIndex) => {
      const expression = String(nextExpression || "").trim();
      if (!expression || sameExpressionText(expression, currentExpression)) return;
      const expressionKey = expression.replace(/\s+/g, "");
      const occurrence = (occurrences.get(expressionKey) || 0) + 1;
      occurrences.set(expressionKey, occurrence);
      const key = `${expressionKey}::${occurrence}`;
      const generatedStepKatex = api.generateKatex(expression);
      const priorList = previousByExpression.get(expressionKey) || [];
      const prior = priorList.shift();
      candidates.push({
        key,
        expression,
        beforeExpression: currentExpression,
        beforeKatex: prior && prior.beforeKatex || generatedStepKatex,
        afterKatex: prior && prior.afterKatex || generatedStepKatex,
        instruction: prior && prior.instruction || "",
        actionStartIndex,
        actionEndIndex,
        included: prior ? prior.included !== false : true,
        required: false
      });
      currentExpression = expression;
      actionStartIndex = actionEndIndex;
    };

    actions.forEach((action, index) => {
      addCandidate(action && action.beforeExpression, index);
      addCandidate(action && action.afterExpression, index + 1);
    });
    addCandidate(snapshot && snapshot.currentExpression, actions.length);
    if (candidates.length) {
      candidates.forEach(candidate => { candidate.required = false; });
      candidates[candidates.length - 1].required = true;
      candidates[candidates.length - 1].included = true;
    }
    return candidates;
  }

  function renderCurationTable() {
    const container = byId("curationTable");
    const candidates = draft.recording.candidates || [];
    if (!candidates.length) {
      container.innerHTML = '<p class="empty-curation">No expression changes were recorded.</p>';
      byId("completeExerciseButton").hidden = true;
      return;
    }
    currentCurationIndex = Math.max(0, Math.min(currentCurationIndex, candidates.length - 1));
    const index = currentCurationIndex;
    const candidate = candidates[index];
    const included = candidate.included !== false;
    const editing = currentCurationMode === "edit";
    const stepNumber = candidate.isInitial ? 0 : index;
    const isFinalSlide = index === candidates.length - 1;
    container.innerHTML = `
      <article class="step-carousel-slide card ${included ? "is-included" : "is-disabled"}" data-candidate-index="${index}" role="group" aria-roledescription="slide" aria-label="Step ${stepNumber}, slide ${index + 1} of ${candidates.length}" tabindex="-1">
        <header class="step-slide-header">
          <label class="step-include-label">
            <input type="checkbox" data-toggle-step="${index}"${included ? " checked" : ""}${candidate.required ? " disabled" : ""}>
            <span>Step ${stepNumber}</span>
          </label>
          <div class="step-mode-toggle" role="group" aria-label="Step display mode">
            <button type="button" data-curation-mode="view" aria-pressed="${editing ? "false" : "true"}">View</button>
            <button type="button" data-curation-mode="edit" aria-pressed="${editing ? "true" : "false"}">Edit</button>
          </div>
        </header>
        ${editing ? `
          <fieldset class="step-editor-fields"${included ? "" : " disabled"}>
            <label class="step-edit-field"><span>Pre-completion</span>
              <textarea rows="3" spellcheck="false" data-step-field="beforeKatex">${escapeHtml(candidate.beforeKatex)}</textarea>
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
              <div class="step-math-view" data-step-view="beforeKatex" aria-label="Pre-completion expression for step ${stepNumber}"></div>
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
      </article>
      <nav class="step-carousel-navigation" aria-label="Step carousel navigation">
        <button type="button" class="secondary-button" data-carousel-direction="previous"${index === 0 ? " disabled" : ""}>Previous</button>
        <p class="step-carousel-position" aria-live="polite">${index + 1} of ${candidates.length}</p>
        <button type="button" class="secondary-button" data-carousel-direction="next"${index === candidates.length - 1 ? " disabled" : ""}>Next</button>
      </nav>`;
    const slide = container.querySelector("[data-candidate-index]");
    const instructionField = slide.querySelector('[data-step-field="instruction"]');
    if (instructionField) instructionField.value = candidate.instruction || "";
    renderKatex(slide.querySelector('[data-step-view="beforeKatex"]'), candidate.beforeKatex);
    renderKatex(slide.querySelector('[data-step-view="afterKatex"]'), candidate.afterKatex);
    renderMixedInstruction(slide.querySelector(".step-instruction-view"), candidate.instruction);
    byId("completeExerciseButton").hidden = !isFinalSlide;
  }

  function renderCuration() {
    renderCurationTable();
  }

  async function finishRecording() {
    const api = await waitForApi();
    const snapshot = api.getSnapshot();
    draft.recording.workspaceSnapshot = snapshot;
    const actions = snapshot.recorder ? snapshot.recorder.actions || [] : [];
    if (!actions.length) {
      window.alert("Perform at least one solution action before choosing All Done.");
      return;
    }
    const candidates = deriveStepCandidates(snapshot, api);
    if (!candidates.length) {
      window.alert("The final expression is unchanged. Complete at least one expression-changing step before choosing All Done.");
      return;
    }
    draft.recording.candidates = [makeInitialCurationCandidate(api), ...candidates];
    currentCurationIndex = 0;
    currentCurationMode = "view";
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

    byId("finishRecordingButton").addEventListener("click", finishRecording);
    byId("curationTable").addEventListener("input", event => {
      const field = event.target.dataset.stepField;
      if (!field) return;
      const row = event.target.closest("[data-candidate-index]");
      const candidate = draft.recording.candidates[Number(row.dataset.candidateIndex)];
      if (!candidate) return;
      candidate[field] = event.target.value;
    });
    byId("curationTable").addEventListener("change", event => {
      const checkbox = event.target.closest("[data-toggle-step]");
      if (!checkbox) return;
      const candidate = draft.recording.candidates[Number(checkbox.dataset.toggleStep)];
      if (!candidate || candidate.required) return;
      candidate.included = checkbox.checked;
      renderCurationTable();
    });
    byId("curationTable").addEventListener("click", event => {
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
    byId("completeExerciseButton").addEventListener("click", finishExercise);

    window.addEventListener("message", event => {
      if (event.source !== workspace.contentWindow || !event.data || event.data.source !== "exploded-algebra-authoring") return;
      if (event.data.type === "ready") {
        iframeReady = true;
        const api = getApi();
        if (api) populateToolPermissions(api.getToolCatalog());
      }
      if (event.data.type === "interaction-state") {
        syncFinishRecordingButton(event.data.detail);
      }
      if (event.data.type === "initial-expression-committed") {
        acceptInitialExpressionAndSolve();
      } else if (event.data.type === "state-change") {
        captureWorkspaceSnapshot();
        const api = getApi();
        const snapshot = api && api.getSnapshot();
        if (currentPhase === 3) syncFinishRecordingButton(snapshot);
        if (currentPhase === 2 && snapshot && !snapshot.builderActive && !snapshot.initialCommitted) {
          api.startInitialExpressionBuilder(null);
        }
      }
    });
  }

  initializeSetupDefaults();
  installEventHandlers();
  waitForApi().catch(error => window.alert(error.message));
  setPhase(1);
})();
