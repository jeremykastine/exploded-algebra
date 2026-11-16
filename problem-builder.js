(() => {
  "use strict";

  const byId = id => document.getElementById(id);
  const editorQuery = new URLSearchParams(window.location.search);
  let draft;

  async function waitForApi() {
    const workspace = byId("eaWorkspace");
    for (let attempt = 0; attempt < 120; attempt++) {
      const api = workspace.contentWindow?.ExplodedAlgebraProblemEditor;
      if (api) return api;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error("The Problem Editor could not load. Reload the page and try again.");
  }

  async function openRecording(history) {
    const api = await waitForApi();
    const imported = api.inspectMoveHistory(history, true);
    const authored = history.kind === "demoOnly" ? null : history;
    const title = authored?.title || history.sourceLevelTitle || "New problem";
    const rows = [
      {
        expression: imported.initial, katex: imported.initialKatex, isInitial: true
      },
      ...imported.moves.map((move, moveIndex) => ({ ...move, moveIndex }))
    ].map((row, index) => ({
      ...row,
      beforeKatex: row.katex,
      afterKatex: row.katex,
      major: index === 0 || index === imported.moves.length
    }));

    let nextIndex = 0;
    for (const saved of [...(authored?.steps || []), ...(authored?.minorSteps || [])]) {
      const index = Number.isInteger(saved.recordedMoveIndex)
        ? saved.recordedMoveIndex + 1
        : rows.findIndex((row, index) => index >= nextIndex && row.expression === saved.expression);
      const row = rows[index];
      if (row?.expression !== saved.expression) continue;
      row.major = saved.majorStep !== false;
      row.beforeKatex = saved.beforeKatex || saved.katex || row.beforeKatex;
      row.afterKatex = saved.afterKatex || saved.katex || row.afterKatex;
      nextIndex = index + 1;
    }

    draft = { ...imported, rows };
    byId("problemTitle").value = title;
    byId("setupForm").hidden = true;
    byId("editorWorkspace").hidden = false;
    renderCurationTable();
  }

  async function openMoves(event) {
    event.preventDefault();
    const button = byId("openMovesButton");
    const status = byId("setupError");
    status.textContent = "";
    button.disabled = true;
    try {
      const file = byId("moveFile").files[0];
      let history;
      try {
        history = JSON.parse(await file.text());
      } catch {
        throw new Error("The recording must contain valid JSON.");
      }
      await openRecording(history);
    } catch (error) {
      status.textContent = error.message || "The moves could not be opened.";
    } finally {
      button.disabled = false;
    }
  }

  function buildExportLevel(title, id) {
    const demoSteps = [];
    const recordedActions = [];
    const moveEnds = [];
    for (const move of draft.moves) {
      demoSteps.push(...move.demo);
      const lastIndex = move.actions.length - 1;
      recordedActions.push(...move.actions.map((action, index) =>
        index === lastIndex && move.numericalRewrite ? { ...action, numericalRewrite: move.numericalRewrite } : action
      ));
      moveEnds.push(demoSteps.length);
    }

    let previousEnd = 0;
    const steps = [];
    const minorSteps = [];
    draft.rows.forEach((row, index) => {
      const afterKatex = row.afterKatex.trim() || row.katex;
      const step = {
        expression: row.expression,
        explodedExpression: row.expression,
        katex: afterKatex,
        beforeKatex: row.beforeKatex.trim() || row.katex,
        afterKatex,
        majorStep: row.major
      };
      if (!row.isInitial) step.recordedMoveIndex = row.moveIndex;
      if (!row.major && !row.isInitial && index < draft.rows.length - 1) {
        minorSteps.push(step);
        return;
      }
      if (!row.isInitial) {
        step.actionStartIndex = previousEnd;
        step.actionEndIndex = moveEnds[row.moveIndex];
        previousEnd = step.actionEndIndex;
      }
      steps.push(step);
    });
    return {
      format: "exploded-algebra-level",
      formatVersion: 1,
      kind: "guidedCapable",
      id,
      title,
      startExpression: draft.initial,
      initialKatex: steps[0].afterKatex,
      ...(draft.initialBuilderActions && { initialBuilderActions: draft.initialBuilderActions }),
      finalExpression: steps.at(-1).expression,
      finalKatex: steps.at(-1).afterKatex,
      requireFullDemo: true,
      steps,
      ...(minorSteps.length && { minorSteps }),
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

  function renderCurationTable() {
    const container = byId("curationTable");
    container.innerHTML = draft.rows.map((row, index) => {
      const label = row.isInitial ? "Starting expression" : `Step ${index}`;
      return `
        <tr data-step-index="${index}" class="${row.major ? "" : "minor-step"}">
          <td class="major-step-cell">
            <label class="major-step-check">
              <input type="checkbox" data-major-step aria-label="Major step for ${label}"${row.major ? " checked" : ""}>
            </label>
          </td>
          <td>
            <label class="step-label" for="step-notation-${index}">${label}</label>
            <div class="notation-entry">
              <textarea id="step-notation-${index}" rows="2" spellcheck="false" data-conventional-notation aria-describedby="notation-status-${index}">${escapeHtml(row.afterKatex)}</textarea>
              <div class="notation-actions" data-notation-actions hidden>
                <button type="button" class="primary-button" data-verify-notation>Verify and Save</button>
                <button type="button" class="secondary-button" data-revert-notation>Revert</button>
              </div>
            </div>
            <p class="notation-status" role="status" id="notation-status-${index}"></p>
          </td>
        </tr>`;
    }).join("");
  }

  function updateExportButtons(busy = false) {
    const pending = draft.rows.some(row => row.pending);
    byId("openInPlayerButton").disabled = busy || pending;
    byId("downloadLevelButton").disabled = busy || pending;
    if (!busy) {
      const status = byId("exportStatus");
      if (pending) status.textContent = "Verify or revert your notation edits before opening or downloading.";
      else if (status.textContent.startsWith("Verify or revert")) status.textContent = "";
    }
  }

  function handleNotationChange(tableRow, entry) {
    const row = draft.rows[Number(tableRow.dataset.stepIndex)];
    row.pending = entry.value !== row.afterKatex;
    tableRow.querySelector("[data-notation-actions]").hidden = !row.pending;
    tableRow.querySelector(".notation-status").textContent = "";
    entry.removeAttribute("aria-invalid");
    updateExportButtons();
  }

  function verifyNotation(tableRow) {
    const row = draft.rows[Number(tableRow.dataset.stepIndex)];
    const entry = tableRow.querySelector("[data-conventional-notation]");
    const status = tableRow.querySelector(".notation-status");
    try {
      const notation = ExplodedAlgebraNotation.verify(row.expression, entry.value);
      if (!window.katex) throw new Error("The notation renderer is unavailable.");
      window.katex.renderToString(notation, { throwOnError: true });
      row.beforeKatex = notation;
      row.afterKatex = notation;
      entry.value = notation;
      handleNotationChange(tableRow, entry);
      status.textContent = "Saved.";
    } catch (error) {
      entry.setAttribute("aria-invalid", "true");
      status.textContent = error.message || "The notation could not be verified.";
      entry.focus({ preventScroll: true });
    }
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
    updateExportButtons(true);
    try {
      const title = byId("problemTitle").value.trim();
      if (!title) throw new Error("Enter a problem name.");
      const id = slugify(title) || "problem";
      const level = (await waitForApi()).validateLevel(buildExportLevel(title, id));
      if (preview) {
        const fileName = `${level.id}.json`;
        const params = {
          source: "problem-editor",
          level: fileName,
          mode: "unguided",
          build: "1",
          rewrites: "prescribed"
        };
        const playerVersion = new URL(byId("eaWorkspace").src).searchParams.get("v");
        if (playerVersion) params.v = playerVersion;
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
      updateExportButtons();
    }
  }

  async function loadTransferredLevel() {
    if (editorQuery.get("source") !== "transfer") return;
    const setup = byId("setupForm");
    setup.hidden = true;
    try {
      const payload = ExplodedAlgebraTransfer.read();
      await openRecording(JSON.parse(payload.text));
    } catch (error) {
      setup.hidden = false;
      byId("setupError").textContent = error.message || "The level could not be transferred.";
    }
  }

  byId("setupForm").addEventListener("submit", openMoves);
  byId("curationTable").addEventListener("input", event => {
    if (!event.target.matches("[data-conventional-notation]")) return;
    handleNotationChange(event.target.closest("[data-step-index]"), event.target);
  });
  byId("curationTable").addEventListener("click", event => {
    const button = event.target.closest("[data-verify-notation], [data-revert-notation]");
    if (!button) return;
    const tableRow = button.closest("[data-step-index]");
    if (button.matches("[data-verify-notation]")) {
      verifyNotation(tableRow);
    } else {
      const entry = tableRow.querySelector("[data-conventional-notation]");
      entry.value = draft.rows[Number(tableRow.dataset.stepIndex)].afterKatex;
      handleNotationChange(tableRow, entry);
      entry.focus({ preventScroll: true });
    }
  });
  byId("curationTable").addEventListener("change", event => {
    if (!event.target.matches("[data-major-step]")) return;
    const tableRow = event.target.closest("[data-step-index]");
    draft.rows[Number(tableRow.dataset.stepIndex)].major = event.target.checked;
    tableRow.classList.toggle("minor-step", !event.target.checked);
  });
  byId("openInPlayerButton").addEventListener("click", () => exportProblem(true));
  byId("downloadLevelButton").addEventListener("click", () => exportProblem(false));
  loadTransferredLevel();

})();
