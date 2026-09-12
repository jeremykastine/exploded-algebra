(() => {
  "use strict";

  const DRAFT_STORAGE_KEY = "explodedAlgebra.exerciseBuilderDraft.v1";
  const TEST_STORAGE_PREFIX = "explodedAlgebra.builderTest.";
  const LEVEL_WINDOW_NAME_PREFIX = "__EXPLODED_ALGEBRA_LEVEL__:";
  const FORMAT_VERSION = 1;
  const VARIABLES = ["x", "y", "z", "a", "b", "c"];

  const byId = id => document.getElementById(id);
  const workspace = byId("eaWorkspace");
  const workspaceShell = byId("workspaceShell");
  const phases = Array.from(document.querySelectorAll(".phase"));
  const phaseButtons = Array.from(document.querySelectorAll(".phase-nav [data-go-phase]"));
  let currentPhase = 1;
  let loadedWorkspacePhase = 0;
  let iframeReady = false;
  let idWasEdited = false;
  let checkpointEditIndex = -1;
  let finishAfterCheckpoint = false;
  let saveTimer = null;
  let lastWorkspaceSnapshotFingerprint = "";
  let draft = makeFreshDraft();

  function makeFreshDraft() {
    return {
      draftVersion: 1,
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
        checkpoints: [],
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

  function readSavedDraft() {
    try {
      const parsed = JSON.parse(localStorage.getItem(DRAFT_STORAGE_KEY) || "null");
      return parsed && parsed.draftVersion === 1 ? parsed : null;
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

  function inferVariables(expression) {
    return Array.from(new Set((String(expression || "").match(/[A-Za-z][A-Za-z0-9_]*/g) || [])
      .filter(value => !value.startsWith("__ea_")))).sort();
  }

  function buildExportLevel() {
    const snapshot = draft.recording.workspaceSnapshot;
    const recorder = snapshot && snapshot.recorder ? snapshot.recorder : { actions: [], demoSteps: [] };
    const checkpoints = draft.recording.checkpoints || [];
    const steps = [{
      expression: draft.initial.expression,
      katex: draft.initial.katex,
      afterKatex: draft.initial.katex
    }, ...checkpoints.map(checkpoint => ({
      expression: checkpoint.afterExpression,
      explodedExpression: checkpoint.afterExpression,
      beforeExplodedExpression: checkpoint.beforeExpression,
      afterExplodedExpression: checkpoint.afterExpression,
      katex: checkpoint.afterKatex,
      beforeKatex: checkpoint.beforeKatex,
      afterKatex: checkpoint.afterKatex,
      guidance: checkpoint.instruction,
      actionStartIndex: checkpoint.actionStartIndex,
      actionEndIndex: checkpoint.actionEndIndex
    }))];
    return {
      ...getLevelBase(),
      steps,
      demo: {
        format: "exploded-algebra-guided-actions-v1",
        steps: JSON.parse(JSON.stringify(recorder.demoSteps || []))
      },
      recordedActions: JSON.parse(JSON.stringify(recorder.actions || [])),
      finalExpression: draft.recording.finalExpression || checkpoints.at(-1)?.afterExpression || draft.initial.expression,
      finalKatex: draft.recording.finalKatex || checkpoints.at(-1)?.afterKatex || draft.initial.katex
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
    target.replaceChildren();
    if (!source) {
      target.textContent = "Enter KaTeX source to preview it.";
      return;
    }
    if (!window.katex) {
      target.textContent = source;
      return;
    }
    window.katex.render(source, target, { throwOnError: false, displayMode: true });
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
    if (loadedWorkspacePhase !== 2) {
      const resume = draft.initial.workspaceSnapshot || (draft.initial.expression ? {
        currentExpression: draft.initial.expression,
        initialCommitted: true
      } : null);
      draft.initial.workspaceSnapshot = api.loadInitialSession({
        ...getLevelBase(),
        initialKatex: draft.initial.katex || undefined,
        variables: VARIABLES
      }, resume);
      loadedWorkspacePhase = 2;
    }
    refreshInitialControls(draft.initial.workspaceSnapshot || api.getSnapshot());
  }

  function refreshInitialControls(snapshot) {
    if (!snapshot) return;
    const ready = snapshot.initialCommitted && !snapshot.builderActive;
    byId("lockInitialExpressionButton").disabled = !ready;
    byId("editInitialExpressionButton").disabled = snapshot.builderActive;
    if (snapshot.builderActive) {
      byId("initialExpressionStatus").textContent = "Build the expression in the shared Expression Builder, then press Next / Enter there to submit it.";
    } else if (ready) {
      byId("initialExpressionStatus").textContent = `Expression ready to lock: ${snapshot.currentExpression}`;
    } else {
      byId("initialExpressionStatus").textContent = "Choose Edit Starting Expression to reopen the Expression Builder.";
    }
    byId("initialConventionalCard").hidden = !draft.initial.eaLocked;
    byId("phase2NextButton").disabled = !draft.initial.eaLocked || !draft.initial.conventionalLocked;
    if (draft.initial.eaLocked) {
      byId("initialKatexInput").value = draft.initial.katex || snapshot.currentKatex || "";
      renderKatex(byId("initialKatexPreview"), byId("initialKatexInput").value);
    }
  }

  async function preparePhase3() {
    moveWorkspaceTo("phase3WorkspaceSlot");
    const api = await waitForApi();
    if (loadedWorkspacePhase !== 3) {
      draft.recording.workspaceSnapshot = api.loadRecordingSession(getLevelBase(), draft.recording.workspaceSnapshot);
      loadedWorkspacePhase = 3;
    }
    refreshRecordingUi(draft.recording.workspaceSnapshot || api.getSnapshot());
  }

  function actionLabel(action) {
    if (!action) return "Unknown action";
    if (action.type === "select") return `Select ${action.expression || "expression"}`;
    if (action.type === "tool") return `Choose ${action.tool || "tool"}`;
    if (action.type === "builder") return `Expression Builder: ${action.action}${action.value ? ` (${action.value})` : ""}`;
    if (action.type === "action") return `${action.action}${action.value ? `: ${action.value}` : ""}`;
    if (action.type === "commuteChoice") return `Commute choice: ${action.expression || action.relativeIndex}`;
    if (action.type === "undo") return "Undo";
    return action.type;
  }

  function refreshRecordingUi(snapshot) {
    const actionCount = snapshot && snapshot.recorder && snapshot.recorder.actions ? snapshot.recorder.actions.length : 0;
    byId("recordingActionCount").textContent = `${actionCount} recorded action${actionCount === 1 ? "" : "s"}`;
    byId("undoRecordingLabel").textContent = draft.settings.includeUndoActions
      ? "Undo actions will be preserved in the guided solution."
      : "Undo removes the abandoned branch from the recorded solution.";
    renderCheckpointList();
  }

  function renderCheckpointList() {
    const container = byId("checkpointList");
    const checkpoints = draft.recording.checkpoints || [];
    if (!checkpoints.length) {
      container.innerHTML = '<p class="muted">No checkpoints marked yet.</p>';
      return;
    }
    container.innerHTML = checkpoints.map((checkpoint, index) => `
      <article class="checkpoint-item">
        <span class="checkpoint-number">${index + 1}</span>
        <div><p>${escapeHtml(checkpoint.instruction)}</p><small>Actions ${checkpoint.actionStartIndex + 1}–${checkpoint.actionEndIndex}</small></div>
        <button type="button" data-edit-checkpoint="${index}">Edit</button>
      </article>`).join("");
  }

  async function openCheckpointEditor(index = -1, finishing = false) {
    const api = await waitForApi();
    const snapshot = api.getSnapshot();
    draft.recording.workspaceSnapshot = snapshot;
    const recorder = snapshot.recorder || { actions: [] };
    const previous = draft.recording.checkpoints.at(-1);
    const actionStartIndex = previous ? previous.actionEndIndex : 0;
    if (index < 0 && recorder.actions.length <= actionStartIndex) {
      window.alert("Perform at least one new EA action before marking an important step.");
      return false;
    }
    checkpointEditIndex = index;
    finishAfterCheckpoint = finishing;
    const existing = index >= 0 ? draft.recording.checkpoints[index] : null;
    const beforeExpression = existing ? existing.beforeExpression : (previous ? previous.afterExpression : draft.initial.expression);
    const afterExpression = existing ? existing.afterExpression : snapshot.currentExpression;
    byId("checkpointRangeSummary").textContent = existing
      ? `Editing checkpoint ${index + 1}.`
      : `This checkpoint covers recorded actions ${actionStartIndex + 1} through ${recorder.actions.length}.`;
    byId("checkpointBeforeKatex").value = existing ? existing.beforeKatex : api.generateKatex(beforeExpression);
    byId("checkpointInstruction").value = existing ? existing.instruction : "";
    byId("checkpointAfterKatex").value = existing ? existing.afterKatex : api.generateKatex(afterExpression);
    byId("checkpointBackdrop").dataset.beforeExpression = beforeExpression;
    byId("checkpointBackdrop").dataset.afterExpression = afterExpression;
    byId("checkpointBackdrop").dataset.actionStartIndex = String(existing ? existing.actionStartIndex : actionStartIndex);
    byId("checkpointBackdrop").dataset.actionEndIndex = String(existing ? existing.actionEndIndex : recorder.actions.length);
    byId("checkpointError").textContent = "";
    renderKatex(byId("checkpointBeforePreview"), byId("checkpointBeforeKatex").value);
    renderKatex(byId("checkpointAfterPreview"), byId("checkpointAfterKatex").value);
    byId("checkpointBackdrop").hidden = false;
    byId("checkpointInstruction").focus();
    return true;
  }

  function saveCheckpoint() {
    const instruction = byId("checkpointInstruction").value.trim();
    const beforeKatex = byId("checkpointBeforeKatex").value.trim();
    const afterKatex = byId("checkpointAfterKatex").value.trim();
    if (!instruction || !beforeKatex || !afterKatex) {
      byId("checkpointError").textContent = "Complete the before notation, instruction, and after notation.";
      return;
    }
    const backdrop = byId("checkpointBackdrop");
    const checkpoint = {
      beforeExpression: backdrop.dataset.beforeExpression,
      afterExpression: backdrop.dataset.afterExpression,
      beforeKatex,
      instruction,
      afterKatex,
      actionStartIndex: Number(backdrop.dataset.actionStartIndex),
      actionEndIndex: Number(backdrop.dataset.actionEndIndex)
    };
    if (checkpointEditIndex >= 0) draft.recording.checkpoints[checkpointEditIndex] = checkpoint;
    else draft.recording.checkpoints.push(checkpoint);
    backdrop.hidden = true;
    renderCheckpointList();
    scheduleSave();
    if (finishAfterCheckpoint) finalizeRecording();
  }

  async function finishRecording() {
    const api = await waitForApi();
    const snapshot = api.getSnapshot();
    draft.recording.workspaceSnapshot = snapshot;
    const actions = snapshot.recorder ? snapshot.recorder.actions || [] : [];
    if (!actions.length) {
      window.alert("Record at least one solution action before finishing.");
      return;
    }
    const lastCheckpoint = draft.recording.checkpoints.at(-1);
    if (!lastCheckpoint || lastCheckpoint.afterExpression !== snapshot.currentExpression || lastCheckpoint.actionEndIndex !== actions.length) {
      await openCheckpointEditor(-1, true);
      return;
    }
    finalizeRecording();
  }

  function finalizeRecording() {
    const snapshot = draft.recording.workspaceSnapshot;
    const lastCheckpoint = draft.recording.checkpoints.at(-1);
    draft.recording.finalExpression = snapshot.currentExpression;
    draft.recording.finalKatex = lastCheckpoint.afterKatex;
    draft.recording.finished = true;
    saveDraftNow();
    setPhase(4, true);
  }

  function summarizeActions(actions) {
    const counts = new Map();
    actions.forEach(action => counts.set(action.type || "unknown", (counts.get(action.type || "unknown") || 0) + 1));
    return Array.from(counts.entries()).map(([type, count]) => `<span class="action-chip">${escapeHtml(type)}: ${count}</span>`).join("");
  }

  async function renderReview() {
    const api = await waitForApi();
    const level = buildExportLevel();
    const actions = level.recordedActions || [];
    const settings = level.numericalRewrite;
    const checkpointItems = level.steps.slice(1).map((step, index) => `<li><strong>Step ${index + 1}:</strong> ${escapeHtml(step.guidance)}<br><small>${escapeHtml(step.beforeKatex)} → ${escapeHtml(step.afterKatex)} · actions ${step.actionStartIndex + 1}–${step.actionEndIndex}</small></li>`).join("");
    byId("reviewContent").innerHTML = `
      <section class="card review-card"><h3>Metadata and settings</h3>
        <ul class="review-list"><li><strong>${escapeHtml(level.title)}</strong></li><li>ID: ${escapeHtml(level.id)}</li>
        <li>Addition: ${escapeHtml(settings.addition)}</li><li>Multiplication: ${escapeHtml(settings.multiplication)}</li>
        <li>Negative one: ${settings.allowNegativeOne ? "allowed" : "not allowed"}</li><li>Inverses: ${settings.allowInverses ? "allowed" : "not allowed"}</li>
        <li>Undo actions: ${level.includeUndoActions ? "included" : "removed from the surviving path"}</li></ul></section>
      <section class="card review-card"><h3>Initial expression</h3>
        <div class="review-expression">${api.renderExpression(level.startExpression)}</div>
        <div class="math-preview compact" data-review-katex="${escapeHtml(level.initialKatex)}"></div>
        <small>${escapeHtml(level.initialKatex)}</small></section>
      <section class="card review-card full"><h3>Recorded action stream</h3>
        <div class="action-summary">${summarizeActions(actions)}</div>
        <ol class="action-stream">${actions.map(action => `<li>${escapeHtml(actionLabel(action))}</li>`).join("")}</ol></section>
      <section class="card review-card full"><h3>Pedagogical checkpoints</h3><ol class="review-list">${checkpointItems}</ol></section>
      <section class="card review-card"><h3>Final expression</h3>
        <div class="review-expression">${api.renderExpression(level.finalExpression)}</div>
        <div class="math-preview compact" data-review-katex="${escapeHtml(level.finalKatex)}"></div>
        <small>${escapeHtml(level.finalKatex)}</small></section>
      <section class="card review-card"><h3>Compatibility</h3><ul class="review-list"><li>Format version ${level.formatVersion}</li><li>${level.demo.steps.length} deterministic guided actions</li><li>${level.steps.length - 1} meaningful solution steps</li><li>High, Medium, and Low assistance use this one definition.</li></ul></section>`;
    document.querySelectorAll("[data-review-katex]").forEach(node => renderKatex(node, node.dataset.reviewKatex));
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
    return draft.recording.finished;
  }

  async function setPhase(number, force = false) {
    const target = Number(number);
    if (!force && !phaseIsAvailable(target)) return;
    if (currentPhase === 2 && loadedWorkspacePhase === 2) captureWorkspaceSnapshot();
    if (currentPhase === 3 && loadedWorkspacePhase === 3) captureWorkspaceSnapshot();
    currentPhase = target;
    draft.phase = target;
    phases.forEach(section => { section.hidden = Number(section.dataset.phase) !== target; });
    phaseButtons.forEach(button => {
      const phase = Number(button.dataset.goPhase);
      button.classList.toggle("is-active", phase === target);
      button.classList.toggle("is-complete", phase < target && phaseIsAvailable(phase + 1));
      button.disabled = !phaseIsAvailable(phase);
    });
    workspaceShell.style.display = "none";
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (target === 2) await preparePhase2();
    else if (target === 3) await preparePhase3();
    else if (target === 4) await renderReview();
    scheduleSave();
  }

  function captureWorkspaceSnapshot() {
    const api = getApi();
    if (!api) return false;
    const snapshot = api.getSnapshot();
    const fingerprint = JSON.stringify(snapshot);
    const changed = fingerprint !== lastWorkspaceSnapshotFingerprint;
    lastWorkspaceSnapshotFingerprint = fingerprint;
    if (loadedWorkspacePhase === 2) {
      draft.initial.workspaceSnapshot = snapshot;
      refreshInitialControls(snapshot);
    } else if (loadedWorkspacePhase === 3) {
      draft.recording.workspaceSnapshot = snapshot;
      refreshRecordingUi(snapshot);
    }
    return changed;
  }

  function resetDownstreamRecording() {
    draft.recording = {
      workspaceSnapshot: null,
      checkpoints: [],
      finalExpression: "",
      finalKatex: "",
      finished: false
    };
  }

  function hydrateAll() {
    hydrateSetup();
    byId("initialKatexInput").value = draft.initial.katex || "";
    renderKatex(byId("initialKatexPreview"), draft.initial.katex || "");
    renderCheckpointList();
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
      if (phaseButton && !phaseButton.disabled) setPhase(Number(phaseButton.dataset.goPhase));
    });

    byId("editInitialExpressionButton").addEventListener("click", async () => {
      if (draft.recording.workspaceSnapshot && !window.confirm("Editing the starting expression will clear the recorded solution and checkpoints. Continue?")) return;
      const api = await waitForApi();
      resetDownstreamRecording();
      draft.initial.eaLocked = false;
      draft.initial.conventionalLocked = false;
      api.startInitialExpressionBuilder();
      captureWorkspaceSnapshot();
      scheduleSave();
    });
    byId("lockInitialExpressionButton").addEventListener("click", async () => {
      const api = await waitForApi();
      const snapshot = api.getSnapshot();
      if (!snapshot.initialCommitted || snapshot.builderActive) return;
      const changed = draft.initial.expression && draft.initial.expression !== snapshot.currentExpression;
      if (changed) resetDownstreamRecording();
      draft.initial.expression = snapshot.currentExpression;
      draft.initial.eaLocked = true;
      draft.initial.conventionalLocked = false;
      draft.initial.katex = snapshot.currentKatex;
      byId("initialKatexInput").value = draft.initial.katex;
      byId("initialConventionalCard").hidden = false;
      renderKatex(byId("initialKatexPreview"), draft.initial.katex);
      refreshInitialControls(snapshot);
      scheduleSave();
    });
    byId("initialKatexInput").addEventListener("input", event => {
      draft.initial.katex = event.target.value;
      draft.initial.conventionalLocked = false;
      byId("phase2NextButton").disabled = true;
      renderKatex(byId("initialKatexPreview"), event.target.value);
      scheduleSave();
    });
    byId("acceptInitialKatexButton").addEventListener("click", () => {
      const value = byId("initialKatexInput").value.trim();
      if (!value) return;
      draft.initial.katex = value;
      draft.initial.conventionalLocked = true;
      byId("phase2NextButton").disabled = false;
      scheduleSave();
    });
    byId("phase2NextButton").addEventListener("click", () => setPhase(3, true));
    byId("markStepButton").addEventListener("click", () => openCheckpointEditor());
    byId("finishRecordingButton").addEventListener("click", finishRecording);
    byId("checkpointList").addEventListener("click", event => {
      const button = event.target.closest("[data-edit-checkpoint]");
      if (button) openCheckpointEditor(Number(button.dataset.editCheckpoint));
    });
    byId("checkpointBeforeKatex").addEventListener("input", event => renderKatex(byId("checkpointBeforePreview"), event.target.value));
    byId("checkpointAfterKatex").addEventListener("input", event => renderKatex(byId("checkpointAfterPreview"), event.target.value));
    byId("cancelCheckpointButton").addEventListener("click", () => { byId("checkpointBackdrop").hidden = true; finishAfterCheckpoint = false; });
    byId("saveCheckpointButton").addEventListener("click", saveCheckpoint);
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
      setPhase(Math.max(1, Math.min(4, draft.phase || 1)), true);
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
      if (event.data.type === "initial-expression-committed") captureWorkspaceSnapshot();
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
