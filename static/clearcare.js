(() => {
  const form = document.getElementById("clearcare-form");
  if (!form) return;
  const resultSection = document.getElementById("clearcare-results-section");
  const itemsRoot = document.getElementById("clearcare-items");
  const summary = document.getElementById("clearcare-summary");
  const methodNote = document.getElementById("clearcare-method-note");
  const sourceText = document.getElementById("clearcare-source-text");
  const notice = document.getElementById("notice");
  const submit = document.getElementById("clearcare-submit");
  const dialog = document.getElementById("care-task-dialog");
  const taskForm = document.getElementById("care-task-confirm-form");
  const saveButton = document.getElementById("care-task-save");
  let lastFocus = null;

  const esc = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[ch]));
  function showNotice(message, isError=false) {
    if (!notice) return;
    notice.textContent = message;
    notice.classList.add("show");
    notice.classList.toggle("notice-error", isError);
  }
  async function api(url, options={}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
  }
  const categoryLabels = {
    appointment:"Appointments & follow-up",
    medication:"Medication instructions",
    care:"Care instructions",
    warning:"Warning signs & follow-up",
    other:"Other important information"
  };
  const categoryOrder = ["appointment","medication","care","warning","other"];
  function renderItems(items) {
    if (!Array.isArray(items) || !items.length) {
      itemsRoot.innerHTML = '<div class="clearcare-empty"><strong>No clear instruction items were identified.</strong><p>Review the original text, or try a clearer text-based PDF. No checklist items have been invented.</p></div>';
      return;
    }
    itemsRoot.innerHTML = categoryOrder.map(category => {
      const subset = items.filter(item => item.category === category);
      if (!subset.length) return "";
      return `<section class="clearcare-category"><h3>${categoryLabels[category]}</h3><div class="clearcare-category-items">${subset.map(item => {
        const urgent = item.urgency === "urgent";
        const needs = item.needs_verification;
        const badge = needs
          ? '<span class="clearcare-status needs-verification">Needs verification</span>'
          : urgent
            ? '<span class="clearcare-status urgent-status">Urgent wording in source</span>'
            : '<span class="clearcare-status source-status">From source</span>';
        const action = item.actionable && !needs && category !== "medication" && category !== "warning"
          ? `<button type="button" class="btn btn-primary clearcare-add-task" data-title="${esc(item.title)}" data-details="${esc(item.original_text)}" data-category="${category === "appointment" ? "Appointment" : "Follow-up"}">Add to Care Plan</button>`
          : "";
        const caution = category === "medication"
          ? '<p class="clearcare-caution">Check this wording against the original prescription. ClearCare does not create medication schedules or recommend dose changes.</p>'
          : "";
        return `<article class="clearcare-item-card ${needs ? "is-unverified" : ""}">
          <div class="clearcare-item-top"><h4>${esc(item.title)}</h4>${badge}</div>
          <div class="clearcare-source-quote"><span>Original wording</span><blockquote>${esc(item.original_text)}</blockquote></div>
          <div class="clearcare-explanation"><span>Plain-language note</span><p>${esc(item.explanation)}</p></div>
          ${needs ? `<div class="clearcare-verification-note"><strong>Check before acting</strong><p>${esc(item.verification_reason || "Compare this item with the original document and confirm it with a healthcare professional.")}</p></div>` : ""}
          ${caution}
          ${urgent ? '<p class="clearcare-urgent-note">The source uses urgent wording. Follow the original instruction and seek the level of help it specifies; this app does not add emergency thresholds.</p>' : ""}
          <div class="clearcare-item-actions">${action}</div>
        </article>`;
      }).join("")}</div></section>`;
    }).join("");
  }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    const text = form.elements.instructions.value.trim();
    const file = form.elements.file.files[0];
    if (!text && !file) {
      showNotice("Paste instructions or choose a PDF first.", true);
      form.elements.instructions.focus();
      return;
    }
    submit.disabled = true;
    submit.textContent = "Reviewing source…";
    resultSection.hidden = true;
    showNotice("Reading the provided source. Do not use this tool for emergency advice.");
    try {
      const result = await api("/api/clearcare", {method:"POST", body:new FormData(form)});
      summary.textContent = result.summary || "Reading aid only. Compare with the original source.";
      methodNote.hidden = false;
      methodNote.textContent = result.ai_available
        ? "AI-assisted reading aid. Extracted quotes were checked against the supplied source; explanations can still be imperfect."
        : "AI is unavailable, so this is a conservative source-only extraction. No separate AI explanation was generated.";
      methodNote.classList.toggle("method-fallback", !result.ai_available);
      sourceText.textContent = result.source_excerpt || "";
      renderItems(result.items || []);
      resultSection.hidden = false;
      showNotice("Reading aid ready. Verify all details against the original instructions.");
      resultSection.scrollIntoView({behavior:"smooth", block:"start"});
    } catch (error) {
      showNotice(error.message, true);
    } finally {
      submit.disabled = false;
      submit.textContent = "Review instructions →";
    }
  });

  itemsRoot.addEventListener("click", event => {
    const button = event.target.closest(".clearcare-add-task");
    if (!button) return;
    lastFocus = button;
    taskForm.elements.title.value = button.dataset.title || "";
    taskForm.elements.details.value = button.dataset.details || "";
    taskForm.elements.due_date.value = "";
    taskForm.elements.category.value = button.dataset.category || "Follow-up";
    dialog.hidden = false;
    document.body.classList.add("dialog-open");
    taskForm.elements.title.focus();
  });

  function closeDialog() {
    dialog.hidden = true;
    document.body.classList.remove("dialog-open");
    if (lastFocus) lastFocus.focus();
  }
  dialog.querySelectorAll("[data-close-task-dialog]").forEach(button => button.addEventListener("click", closeDialog));
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !dialog.hidden) closeDialog();
  });

  taskForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (saveButton.disabled) return;
    saveButton.disabled = true;
    saveButton.textContent = "Saving…";
    try {
      const result = await api("/api/tasks", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          title:taskForm.elements.title.value.trim(),
          details:taskForm.elements.details.value.trim(),
          due_date:taskForm.elements.due_date.value,
          category:taskForm.elements.category.value
        })
      });
      closeDialog();
      showNotice(result.duplicate ? "This task was already in your Care Plan." : "Task saved to your Care Plan.");
      document.dispatchEvent(new CustomEvent("curo:care-plan-updated"));
    } catch (error) {
      showNotice(error.message, true);
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = "Confirm and save";
    }
  });
})();