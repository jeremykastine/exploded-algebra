(() => {
  "use strict";

  const DRAFT_STORAGE_KEY = "explodedAlgebra.exerciseBuilderDraft.v1";
  const TEST_STORAGE_PREFIX = "explodedAlgebra.builderTest.";
  const LEVEL_WINDOW_NAME_PREFIX = "__EXPLODED_ALGEBRA_LEVEL__:";
  const FORMAT_VERSION = 1;
  const DRAFT_VERSION = 2;
  const VARIABLES = ["x"];

  const byId = id => document.getElementById(id);
  const workspace = byId("eaWorkspace");
  const workspaceShell = byId("workspaceShell");
  const phases = Array.from(document.querySelectorAll(".phase"));
  const phaseButtons = Array.from(document.querySelectorAll(".phase-nav [data-go-phase]"));
  let currentPhase = 1;
  let loadedWorkspacePhase = 0;
  let iframeReady = false;
  let idWasEdited = false;
  let saveTimer = null;
  let initialCommitInProgress = false;
  let lastWorkspaceSnapshotFingerprint = "";
  let currentCurationIndex = 0;
  let currentCurationMode = "view";
  let draft = makeFreshDraft();

  function makeFreshDraft() {
    return {
      draftVersion: DRAFT_VERSION,
      updatedAt: null,
      phase: 1,
      metadata: { title: "", id: "", instruction: "", completionMessage: "" },
      settings: {
        evaluationLevel: 2,
        numericalRewrite: {
          addition: "no-carry",
          multiplication: "one-significant-figure",
          allowNegativeOne: false,
          allowInverses: false
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

  function normalizeSavedDraft(saved) {
    if (!saved || (saved.draftVersion !== 1 && saved.draftVersion !== DRAFT_VERSION)) return null;
    const normalized = makeFreshDraft();
    normalized.updatedAt = saved.updatedAt || null;
    normalized.phase = Number(saved.phase) || 1;
    normalized.metadata = { ...normalized.metadata, ...(saved.metadata || {}) };
    normalized.settings = {
      ...normalized.settings,
      ...(saved.settings || {}),
      numericalRewrite: {
        ...normalized.settings.numericalRewrite,
        ...(saved.settings && saved.settings.numericalRewrite || {})
      },
      excludedDefaultTools: Array.isArray(saved.settings && saved.settings.excludedDefaultTools)
        ? saved.settings.excludedDefaultTools.slice()
        : [],
      allowedUnavailableTools: Array.isArray(saved.settings && saved.settings.allowedUnavailableTools)
        ? saved.settings.allowedUnavailableTools.slice()
        : []
    };
    normalized.initial = { ...normalized.initial, ...(saved.initial || {}) };
    normalized.recording = { ...normalized.recording, ...(saved.recording || {}) };
    normalized.recording.candidates = Array.isArray(saved.recording && saved.recording.candidates)
      ? saved.recording.candidates.map(candidate => ({ ...candidate }))
      : Array.isArray(saved.recording && saved.recording.checkpoints)
        ? saved.recording.checkpoints.map((checkpoint, index, checkpoints) => ({
          key: `legacy-${index}`,
          expression: checkpoint.afterExpression,
          beforeExpression: checkpoint.beforeExpression,
          beforeKatex: checkpoint.beforeKatex || checkpoint.afterKatex,
          afterKatex: checkpoint.afterKatex,
          instruction: checkpoint.instruction || "",
          actionStartIndex: checkpoint.actionStartIndex,
          actionEndIndex: checkpoint.actionEndIndex,
          included: true,
          required: index === checkpoints.length - 1
        }))
        : [];
    delete normalized.recording.checkpoints;
    normalized.draftVersion = DRAFT_VERSION;
    return normalized;
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

  function sameExpressionText(first, second) {
    return String(first || "").replace(/\s+/g, "") === String(second || "").replace(/\s+/g, "");
  }

  function readSavedDraft() {
    try {
      return normalizeSavedDraft(JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || "null"));
    } catch (error) {
      return null;
    }
  }

  function draftHasWork(saved) {
    return !!saved && !!(
      saved.metadata && (saved.metadata.title || saved.metadata.id) ||
      saved.initial && (saved.initial.expression || saved.initial.workspaceSnapshot) ||
      saved.recording && saved.recording.workspaceSnapshot && saved.recording.workspaceSnapshot.recorder &&
      saved.recording.workspaceSnapshot.recorder.actions.length
    );
  }

  function updateSaveStatus(message) {
    byId("saveStatus").textContent = message;
  }

  function saveDraftNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    draft.phase = currentPhase;
    draft.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      const time = new Date(draft.updatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" });
      updateSaveStatus(`Draft saved locally at ${time}.`);
    } catch (error) {
      updateSaveStatus("Local autosave is unavailable in this browser.");
    }
  }

  function scheduleSave() {
    updateSaveStatus("Saving draft…");
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveDraftNow, 250);
  }

  function collectSetup() {
    draft.metadata = {
      title: byId("exerciseTitle").value.trim(),
      id: byId("exerciseId").value.trim(),
      instruction: byId("exerciseInstruction").value.trim(),
      completionMessage: byId("completionMessage").value.trim()
    };
    draft.settings.evaluationLevel = Number(byId("evaluationLevel").value);
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

  function hydrateSetup() {
    byId("exerciseTitle").value = draft.metadata.title || "";
    byId("exerciseId").value = draft.metadata.id || "";
    byId("exerciseInstruction").value = draft.metadata.instruction || "";
    byId("completionMessage").value = draft.metadata.completionMessage || "";
    byId("evaluationLevel").value = String(draft.settings.evaluationLevel ?? 2);
    byId("additionPermission").value = draft.settings.numericalRewrite.addition || "no-carry";
    byId("multiplicationPermission").value = draft.settings.numericalRewrite.multiplication || "one-significant-figure";
    byId("allowNegativeOne").checked = !!draft.settings.numericalRewrite.allowNegativeOne;
    byId("allowInverses").checked = !!draft.settings.numericalRewrite.allowInverses;
    const undoValue = draft.settings.includeUndoActions === false ? "no" : "yes";
    const undoRadio = document.querySelector(`input[name="includeUndo"][value="${undoValue}"]`);
    if (undoRadio) undoRadio.checked = true;
    idWasEdited = !!draft.metadata.id;
    applyToolExclusions();
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
      evaluationLevel: draft.settings.evaluationLevel,
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
    const steps = [{
      expression: draft.initial.expression,
      katex: draft.initial.katex,
      afterKatex: draft.initial.katex
    }, ...includedCandidates.map(candidate => {
      const step = {
        expression: candidate.expression,
        explodedExpression: candidate.expression,
        katex: candidate.afterKatex,
        beforeKatex: candidate.beforeKatex,
        afterKatex: candidate.afterKatex,
        actionStartIndex: candidate.actionStartIndex,
        actionEndIndex: candidate.actionEndIndex
      };
      if (candidate.instruction && candidate.instruction.trim()) step.guidance = candidate.instruction.trim();
      return step;
    })];
    return {
      ...getLevelBase(),
      steps,
      demo: {
        format: "exploded-algebra-guided-actions-v1",
        steps: JSON.parse(JSON.stringify(recorder.demoSteps || []))
      },
      recordedActions: JSON.parse(JSON.stringify(recorder.actions || [])),
      finalExpression: draft.recording.finalExpression || includedCandidates.at(-1)?.expression || draft.initial.expression,
      finalKatex: includedCandidates.at(-1)?.afterKatex || draft.recording.finalKatex || draft.initial.katex
    };
  }

  function populateToolPermissions(catalog) {
    const container = byId("toolPermissionList");
    if (!container || container.dataset.loaded === "yes") return;
    container.dataset.loaded = "yes";
    container.innerHTML = catalog.map(tool => `<label><input type="checkbox" data-tool-key="${escapeHtml(tool.key)}" checked> ${escapeHtml(tool.label)}</label>`).join("");
    container.addEventListener("change", () => {
      collectSetup();
      scheduleSave();
    });
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
    api.refreshLayout();
  }

  function deriveStepCandidates(snapshot, api) {
    const recorder = snapshot && snapshot.recorder ? snapshot.recorder : { actions: [] };
    const actions = Array.isArray(recorder.actions) ? recorder.actions : [];
    const previous = Array.isArray(draft.recording.candidates) ? draft.recording.candidates : [];
    const previousByExpression = new Map();
    previous.forEach(candidate => {
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
      return;
    }
    currentCurationIndex = Math.max(0, Math.min(currentCurationIndex, candidates.length - 1));
    const index = currentCurationIndex;
    const candidate = candidates[index];
    const included = candidate.included !== false;
    const editing = currentCurationMode === "edit";
    container.innerHTML = `
      <article class="step-carousel-slide card ${included ? "is-included" : "is-disabled"}" data-candidate-index="${index}" role="group" aria-roledescription="slide" aria-label="Step ${index + 1} of ${candidates.length}" tabindex="-1">
        <header class="step-slide-header">
          <label class="step-include-label">
            <input type="checkbox" data-toggle-step="${index}"${included ? " checked" : ""}${candidate.required ? " disabled" : ""}>
            <span>Step ${index + 1}</span>
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
              <div class="step-math-view" data-step-view="beforeKatex" aria-label="Pre-completion expression for step ${index + 1}"></div>
            </div>
            <div class="step-view-field">
              <h3>Instructions</h3>
              <div class="step-instruction-view"></div>
            </div>
            <div class="step-view-field">
              <h3>Post-completion</h3>
              <div class="step-math-view" data-step-view="afterKatex" aria-label="Post-completion expression for step ${index + 1}"></div>
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
    draft.recording.candidates = candidates;
    currentCurationIndex = 0;
    currentCurationMode = "view";
    draft.recording.finalExpression = snapshot.currentExpression;
    draft.recording.finalKatex = api.generateKatex(snapshot.currentExpression);
    draft.recording.finished = true;
    saveDraftNow();
    setPhase(4, true);
  }

  async function validateExportLevel() {
    const api = await waitForApi();
    return api.validateLevel(buildExportLevel());
  }

  async function testLevel() {
    const status = byId("exportStatus");
    try {
      const level = await validateExportLevel();
      const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const storageKey = TEST_STORAGE_PREFIX + token;
      const payloadText = JSON.stringify({
        version: 1,
        fileName: `${level.id}.json`,
        text: JSON.stringify(level)
      });
      try { localStorage.setItem(storageKey, payloadText); } catch (error) { /* window.name is the fallback */ }
      const assistance = byId("testAssistanceLevel").value;
      const url = `exploded-algebra.html?source=builder&draftKey=${encodeURIComponent(storageKey)}&level=${encodeURIComponent(`${level.id}.json`)}&assistance=${encodeURIComponent(assistance)}`;
      const testWindow = window.open("about:blank", "_blank");
      if (!testWindow) throw new Error("The browser blocked the test tab. Allow pop-ups for this site and try again.");
      testWindow.name = LEVEL_WINDOW_NAME_PREFIX + payloadText;
      testWindow.location.href = url;
      status.textContent = `Opened the current draft with ${assistance} assistance.`;
    } catch (error) {
      status.textContent = error.message || "The level could not be tested.";
    }
  }

  async function downloadJson() {
    const status = byId("exportStatus");
    try {
      const level = await validateExportLevel();
      const blob = new Blob([`${JSON.stringify(level, null, 2)}\n`], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${level.id}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent = `Downloaded ${level.id}.json.`;
    } catch (error) {
      status.textContent = error.message || "The JSON could not be downloaded.";
    }
  }

  function phaseIsAvailable(number) {
    if (number === 1) return true;
    if (number === 2) return validateSetup(false);
    if (number === 3) return draft.initial.eaLocked && draft.initial.conventionalLocked;
    return draft.recording.finished && (draft.recording.candidates || []).length > 0;
  }

  async function setPhase(number, force = false) {
    const target = Number(number);
    if (!force && !phaseIsAvailable(target)) return;
    if (currentPhase === 2 && loadedWorkspacePhase === 2) captureWorkspaceSnapshot();
    if (currentPhase === 3 && loadedWorkspacePhase === 3) captureWorkspaceSnapshot();
    currentPhase = target;
    draft.phase = target;
    document.body.classList.remove("phase2-expression-building", "phase3-recording");
    phases.forEach(section => { section.hidden = Number(section.dataset.phase) !== target; });
    phaseButtons.forEach(button => {
      const phase = Number(button.dataset.goPhase);
      button.classList.toggle("is-active", phase === target);
      button.classList.toggle("is-complete", phase < target && phaseIsAvailable(phase + 1));
      button.disabled = !phaseIsAvailable(phase);
    });
    workspaceShell.style.display = "none";
    window.scrollTo({ top: 0, behavior: target >= 3 ? "auto" : "smooth" });
    if (target === 2) await preparePhase2();
    else if (target === 3) await preparePhase3();
    else if (target === 4) await renderCuration();
    scheduleSave();
  }

  function captureWorkspaceSnapshot() {
    const api = getApi();
    if (!api) return false;
    const snapshot = api.getSnapshot();
    const fingerprint = JSON.stringify(snapshot);
    const changed = fingerprint !== lastWorkspaceSnapshotFingerprint;
    lastWorkspaceSnapshotFingerprint = fingerprint;
    if (loadedWorkspacePhase === 2) draft.initial.workspaceSnapshot = snapshot;
    else if (loadedWorkspacePhase === 3) draft.recording.workspaceSnapshot = snapshot;
    return changed;
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
    saveDraftNow();
    try {
      await setPhase(3, true);
    } finally {
      initialCommitInProgress = false;
    }
  }

  async function editStartingExpression() {
    const recorder = draft.recording.workspaceSnapshot && draft.recording.workspaceSnapshot.recorder;
    const hasRecording = !!(recorder && recorder.actions && recorder.actions.length);
    if (hasRecording && !window.confirm("Editing the starting expression will clear the recorded solution and curated steps. Continue?")) return;
    resetDownstreamRecording();
    draft.initial.eaLocked = false;
    draft.initial.conventionalLocked = false;
    loadedWorkspacePhase = 0;
    await setPhase(2, true);
  }

  async function resumeRecording() {
    draft.recording.finished = false;
    await setPhase(3, true);
  }

  function hydrateAll() {
    hydrateSetup();
  }

  function installEventHandlers() {
    byId("exerciseTitle").addEventListener("input", event => {
      if (!idWasEdited) byId("exerciseId").value = slugify(event.target.value);
    });
    byId("exerciseId").addEventListener("input", () => { idWasEdited = true; });
    byId("setupForm").addEventListener("input", () => {
      collectSetup();
      loadedWorkspacePhase = 0;
      scheduleSave();
    });
    byId("setupForm").addEventListener("change", () => {
      collectSetup();
      loadedWorkspacePhase = 0;
      scheduleSave();
    });
    byId("setupForm").addEventListener("submit", event => {
      event.preventDefault();
      if (validateSetup(true)) setPhase(2, true);
    });
    document.addEventListener("click", event => {
      const phaseButton = event.target.closest("[data-go-phase]");
      if (!phaseButton || phaseButton.disabled) return;
      const target = Number(phaseButton.dataset.goPhase);
      if (target === 2 && currentPhase > 2) editStartingExpression();
      else if (target === 3 && currentPhase === 4) resumeRecording();
      else setPhase(target);
    });

    byId("finishRecordingButton").addEventListener("click", finishRecording);
    byId("resumeRecordingButton").addEventListener("click", resumeRecording);
    byId("editInitialExpressionButton").addEventListener("click", editStartingExpression);
    byId("curationTable").addEventListener("input", event => {
      const field = event.target.dataset.stepField;
      if (!field) return;
      const row = event.target.closest("[data-candidate-index]");
      const candidate = draft.recording.candidates[Number(row.dataset.candidateIndex)];
      if (!candidate) return;
      candidate[field] = event.target.value;
      scheduleSave();
    });
    byId("curationTable").addEventListener("change", event => {
      const checkbox = event.target.closest("[data-toggle-step]");
      if (!checkbox) return;
      const candidate = draft.recording.candidates[Number(checkbox.dataset.toggleStep)];
      if (!candidate || candidate.required) return;
      candidate.included = checkbox.checked;
      renderCurationTable();
      scheduleSave();
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
    byId("testLevelButton").addEventListener("click", testLevel);
    byId("downloadJsonButton").addEventListener("click", downloadJson);

    byId("discardDraftButton").addEventListener("click", () => {
      if (!window.confirm("Discard the entire unfinished exercise draft?")) return;
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      draft = makeFreshDraft();
      loadedWorkspacePhase = 0;
      hydrateAll();
      setPhase(1, true);
    });
    byId("resumeDraftButton").addEventListener("click", () => {
      const saved = readSavedDraft();
      if (saved) draft = saved;
      byId("resumeBackdrop").hidden = true;
      hydrateAll();
      let resumePhase = Math.max(1, Math.min(4, draft.phase || 1));
      if (resumePhase === 2 && draft.initial.eaLocked) resumePhase = 3;
      if (resumePhase === 4 && !phaseIsAvailable(4)) resumePhase = phaseIsAvailable(3) ? 3 : 1;
      setPhase(resumePhase, true);
    });
    byId("startFreshButton").addEventListener("click", () => {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      draft = makeFreshDraft();
      byId("resumeBackdrop").hidden = true;
      hydrateAll();
      setPhase(1, true);
    });

    window.addEventListener("message", event => {
      if (event.source !== workspace.contentWindow || !event.data || event.data.source !== "exploded-algebra-authoring") return;
      if (event.data.type === "ready") {
        iframeReady = true;
        const api = getApi();
        if (api) populateToolPermissions(api.getToolCatalog());
      }
      if (event.data.type === "initial-expression-committed") {
        acceptInitialExpressionAndSolve();
      } else if (event.data.type === "state-change") {
        captureWorkspaceSnapshot();
        const api = getApi();
        const snapshot = api && api.getSnapshot();
        if (currentPhase === 2 && snapshot && !snapshot.builderActive && !snapshot.initialCommitted) {
          setPhase(1, true);
        }
      }
    });
    window.addEventListener("beforeunload", () => {
      captureWorkspaceSnapshot();
      saveDraftNow();
    });
    setInterval(() => {
      if (iframeReady && (currentPhase === 2 || currentPhase === 3)) {
        if (captureWorkspaceSnapshot()) scheduleSave();
      }
    }, 800);
  }

  installEventHandlers();
  hydrateAll();
  waitForApi().catch(error => updateSaveStatus(error.message));
  const saved = readSavedDraft();
  if (draftHasWork(saved)) {
    const updated = saved.updatedAt ? new Date(saved.updatedAt).toLocaleString() : "an earlier visit";
    byId("resumeDescription").textContent = `A draft saved ${updated} is available on this device.`;
    byId("resumeBackdrop").hidden = false;
  } else {
    setPhase(1, true);
  }
})();
