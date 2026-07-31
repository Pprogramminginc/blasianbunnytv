(function () {
const PASSWORD_KEY = "bbtv_admin_password";

const loginForm = document.querySelector("[data-content-login-form]");
const loginError = document.querySelector("[data-content-login-error]");
const panel = document.querySelector("[data-content-panel]");

let state = { settings: {}, navLinks: [], videos: [], pages: [] };

function getPassword() {
  return sessionStorage.getItem(PASSWORD_KEY) || "";
}

function setPassword(password) {
  sessionStorage.setItem(PASSWORD_KEY, password);
}

function clearPassword() {
  sessionStorage.removeItem(PASSWORD_KEY);
}

async function callContent(action, payload) {
  let response;

  try {
    response = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: getPassword(), action, payload }),
    });
  } catch (error) {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }

  let data;
  try {
    data = await response.json();
  } catch (error) {
    return { ok: false, error: "Unexpected response from the server. Please try again." };
  }

  if (response.status === 401) {
    clearPassword();
    showLogin("Incorrect password. Please try again.");
  }

  return data;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(",")[1] || "";
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

async function uploadImage(file, statusEl) {
  if (file.size > 4 * 1024 * 1024) {
    if (statusEl) statusEl.textContent = "Image must be under 4MB.";
    return null;
  }

  if (statusEl) statusEl.textContent = "Uploading…";

  try {
    const dataBase64 = await fileToBase64(file);
    const response = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: getPassword(), contentType: file.type, dataBase64 }),
    });
    const data = await response.json();

    if (!data.ok) {
      if (statusEl) statusEl.textContent = data.error || "Could not upload image.";
      return null;
    }

    if (statusEl) statusEl.textContent = "Uploaded.";
    return data.url;
  } catch (error) {
    if (statusEl) statusEl.textContent = "Could not upload image.";
    return null;
  }
}

function showLogin(message) {
  panel.hidden = true;
  loginForm.hidden = false;
  loginError.textContent = message || "";
}

function showPanel() {
  loginForm.hidden = true;
  panel.hidden = false;
}

function extractVideoId(value) {
  const trimmed = (value || "").trim();
  const match = trimmed.match(/(?:youtu\.be\/|[?&]v=|\/embed\/|\/shorts\/)([a-zA-Z0-9_-]{6,})/);
  return match ? match[1] : trimmed;
}

function applyText(selector, value) {
  document.querySelectorAll(selector).forEach((el) => {
    el.textContent = value || "";
  });
}

function applyImgSrc(selector, value) {
  document.querySelectorAll(selector).forEach((el) => {
    el.src = value || "";
  });
}

// --- Settings-backed sections (ribbon, header, hero) ---

function renderSettingsPreview() {
  const s = state.settings || {};
  applyText('[data-preview="topRibbonText"]', s.topRibbonText);
  applyImgSrc('[data-preview-img="profileImageUrl"]', s.profileImageUrl);
  applyText('[data-preview="brandName"]', s.brandName);
  applyText('[data-preview="heroCardLabel"]', s.heroCardLabel);
  applyText('[data-preview="heroCardText"]', s.heroCardText);
  applyText('[data-preview="heroEyebrow"]', s.heroEyebrow);
  applyText('[data-preview="heroTitle"]', s.heroTitle);
  applyText('[data-preview="heroCopy"]', s.heroCopy);
  applyText('[data-preview="primaryButtonText"]', s.primaryButtonText);
  applyText('[data-preview="secondaryButtonText"]', s.secondaryButtonText);
}

function fillSettingsPanel(panelEl) {
  panelEl.querySelectorAll("[data-field]").forEach((input) => {
    input.value = (state.settings || {})[input.dataset.field] || "";
  });
}

async function saveSettingsFromPanel(panelEl, blockName) {
  const payload = {};
  panelEl.querySelectorAll("[data-field]").forEach((input) => {
    payload[input.dataset.field] = input.value.trim();
  });

  const statusEl = panelEl.querySelector(`[data-save-status="${blockName}"]`);
  if (statusEl) statusEl.textContent = "Saving…";

  const data = await callContent("update-settings", payload);

  if (!data.ok) {
    if (statusEl) statusEl.textContent = data.error || "Could not save changes.";
    return;
  }

  state.settings = data.settings;
  renderSettingsPreview();
  if (statusEl) statusEl.textContent = "Saved.";
}

// --- Generic list editor helper (used by nav, videos, pages) ---

function buildListRow(fields, values, { onSave, onDelete }) {
  const row = document.createElement("div");
  row.className = "list-item";
  const inputs = {};

  fields.forEach((field) => {
    if (field.type === "checkbox") {
      const label = document.createElement("label");
      label.className = "list-item-checkbox";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = Boolean(values[field.key]);
      label.append(input, document.createTextNode(` ${field.label}`));
      row.append(label);
      inputs[field.key] = input;
    } else if (field.type === "textarea") {
      const input = document.createElement("textarea");
      input.placeholder = field.label;
      input.value = values[field.key] || "";
      row.append(input);
      inputs[field.key] = input;
    } else {
      const input = document.createElement("input");
      input.type = field.type || "text";
      input.placeholder = field.label;
      input.value = values[field.key] ?? "";
      row.append(input);
      inputs[field.key] = input;
    }
  });

  const actions = document.createElement("div");
  actions.className = "list-item-actions";

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.className = "button secondary";
  saveBtn.textContent = "Save";
  saveBtn.addEventListener("click", () => {
    const result = {};
    fields.forEach((field) => {
      const input = inputs[field.key];
      if (field.type === "checkbox") {
        result[field.key] = input.checked;
      } else if (field.type === "number") {
        result[field.key] = Number(input.value) || 0;
      } else {
        result[field.key] = input.value.trim();
      }
    });
    onSave(result);
  });
  actions.append(saveBtn);

  if (onDelete) {
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "button danger";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", onDelete);
    actions.append(deleteBtn);
  }

  row.append(actions);
  return row;
}

// --- Navigation ---

const NAV_FIELDS = [
  { key: "label", label: "Label" },
  { key: "href", label: "Link (https://..., #section, or page.html?slug=...)" },
  { key: "openNewTab", label: "New tab", type: "checkbox" },
  { key: "isActive", label: "Active", type: "checkbox" },
  { key: "position", label: "Order", type: "number" },
];

function renderNavPreview() {
  const nav = document.querySelector("[data-preview-nav]");
  if (!nav) return;
  nav.innerHTML = "";

  state.navLinks
    .filter((link) => link.isActive)
    .slice()
    .sort((a, b) => a.position - b.position)
    .forEach((link) => {
      const span = document.createElement("span");
      span.textContent = link.label;
      nav.append(span);
    });
}

function renderNavList() {
  const list = document.querySelector("[data-nav-list]");
  if (!list) return;
  list.innerHTML = "";

  state.navLinks
    .slice()
    .sort((a, b) => a.position - b.position)
    .forEach((link) => {
      const row = buildListRow(NAV_FIELDS, link, {
        onSave: async (values) => {
          const status = document.querySelector('[data-save-status="nav"]');
          status.textContent = "Saving…";
          const data = await callContent("upsert-nav", { id: link.id, ...values });
          if (data.ok) {
            status.textContent = "Saved.";
            await refreshContent();
          } else {
            status.textContent = data.error || "Could not save.";
          }
        },
        onDelete: async () => {
          if (!window.confirm(`Delete the "${link.label}" nav link?`)) return;
          const data = await callContent("delete-nav", { id: link.id });
          if (data.ok) await refreshContent();
        },
      });
      list.append(row);
    });
}

function wireAddNav() {
  const button = document.querySelector("[data-add-nav]");
  if (!button) return;

  button.addEventListener("click", async () => {
    const label = document.querySelector("[data-new-nav-label]").value.trim();
    const href = document.querySelector("[data-new-nav-href]").value.trim();
    const openNewTab = document.querySelector("[data-new-nav-blank]").checked;
    const status = document.querySelector('[data-save-status="nav"]');

    if (!label || !href) {
      status.textContent = "Add a label and a link first.";
      return;
    }

    const position = state.navLinks.length > 0 ? Math.max(...state.navLinks.map((l) => l.position)) + 1 : 1;
    const data = await callContent("upsert-nav", { label, href, openNewTab, isActive: true, position });

    if (data.ok) {
      document.querySelector("[data-new-nav-label]").value = "";
      document.querySelector("[data-new-nav-href]").value = "";
      document.querySelector("[data-new-nav-blank]").checked = false;
      status.textContent = "Added.";
      await refreshContent();
    } else {
      status.textContent = data.error || "Could not add link.";
    }
  });
}

// --- YouTube videos ---

const VIDEO_FIELDS = [
  { key: "videoId", label: "Video ID or URL" },
  { key: "title", label: "Title" },
  { key: "shortLabel", label: "Short label" },
  { key: "isActive", label: "Active", type: "checkbox" },
  { key: "position", label: "Order", type: "number" },
];

function renderVideosPreview() {
  const grid = document.querySelector("[data-preview-video-grid]");
  if (!grid) return;
  grid.innerHTML = "";

  state.videos
    .filter((video) => video.isActive)
    .slice()
    .sort((a, b) => a.position - b.position)
    .forEach((video) => {
      const card = document.createElement("div");
      card.className = "video-card";

      const img = document.createElement("img");
      img.src = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
      img.alt = "";
      card.append(img);

      const span = document.createElement("span");
      span.textContent = video.shortLabel || video.title;
      card.append(span);

      grid.append(card);
    });
}

function renderVideosList() {
  const list = document.querySelector("[data-video-list]");
  if (!list) return;
  list.innerHTML = "";

  state.videos
    .slice()
    .sort((a, b) => a.position - b.position)
    .forEach((video) => {
      const row = buildListRow(VIDEO_FIELDS, video, {
        onSave: async (values) => {
          const status = document.querySelector('[data-save-status="videos"]');
          status.textContent = "Saving…";
          const data = await callContent("upsert-video", {
            id: video.id,
            ...values,
            videoId: extractVideoId(values.videoId),
          });
          if (data.ok) {
            status.textContent = "Saved.";
            await refreshContent();
          } else {
            status.textContent = data.error || "Could not save.";
          }
        },
        onDelete: async () => {
          if (!window.confirm(`Delete "${video.title}"?`)) return;
          const data = await callContent("delete-video", { id: video.id });
          if (data.ok) await refreshContent();
        },
      });
      list.append(row);
    });
}

function wireAddVideo() {
  const button = document.querySelector("[data-add-video]");
  if (!button) return;

  button.addEventListener("click", async () => {
    const videoId = extractVideoId(document.querySelector("[data-new-video-id]").value);
    const title = document.querySelector("[data-new-video-title]").value.trim();
    const shortLabel = document.querySelector("[data-new-video-label]").value.trim();
    const status = document.querySelector('[data-save-status="videos"]');

    if (!videoId || !title) {
      status.textContent = "Add a video ID and a title first.";
      return;
    }

    const position = state.videos.length > 0 ? Math.max(...state.videos.map((v) => v.position)) + 1 : 1;
    const data = await callContent("upsert-video", { videoId, title, shortLabel, isActive: true, position });

    if (data.ok) {
      document.querySelector("[data-new-video-id]").value = "";
      document.querySelector("[data-new-video-title]").value = "";
      document.querySelector("[data-new-video-label]").value = "";
      status.textContent = "Added.";
      await refreshContent();
    } else {
      status.textContent = data.error || "Could not add video.";
    }
  });
}

// --- Custom pages ---

const PAGE_FIELDS = [
  { key: "title", label: "Title" },
  { key: "slug", label: "URL slug" },
  { key: "subtitle", label: "Subtitle" },
  { key: "body", label: "Body", type: "textarea" },
  { key: "imageUrl", label: "Image URL" },
  { key: "isPublished", label: "Published", type: "checkbox" },
];

function renderPagesPreview() {
  const list = document.querySelector("[data-preview-pages-list]");
  if (!list) return;
  list.innerHTML = "";

  if (state.pages.length === 0) {
    const empty = document.createElement("p");
    empty.className = "cp-pages-empty";
    empty.textContent = "No custom pages yet.";
    list.append(empty);
    return;
  }

  state.pages.forEach((page) => {
    const chip = document.createElement("div");
    chip.className = "cp-page-chip";

    const left = document.createElement("span");
    left.textContent = page.title;

    const right = document.createElement("small");
    right.textContent = `${page.isPublished ? "Published" : "Draft"} · page.html?slug=${page.slug}`;

    chip.append(left, right);
    list.append(chip);
  });
}

function renderPagesList() {
  const list = document.querySelector("[data-pages-list]");
  if (!list) return;
  list.innerHTML = "";

  state.pages.forEach((page) => {
    const row = buildListRow(PAGE_FIELDS, page, {
      onSave: async (values) => {
        const status = document.querySelector('[data-save-status="pages"]');
        status.textContent = "Saving…";
        const data = await callContent("upsert-page", { id: page.id, ...values });
        if (data.ok) {
          status.textContent = "Saved.";
          await refreshContent();
        } else {
          status.textContent = data.error || "Could not save.";
        }
      },
      onDelete: async () => {
        if (!window.confirm(`Delete the "${page.title}" page?`)) return;
        const data = await callContent("delete-page", { id: page.id });
        if (data.ok) await refreshContent();
      },
    });
    list.append(row);
  });
}

function wireAddPage() {
  const button = document.querySelector("[data-add-page]");
  if (!button) return;

  const photoInput = document.querySelector("[data-new-page-photo]");
  const uploadStatus = document.querySelector('[data-upload-status="new-page"]');

  button.addEventListener("click", async () => {
    const title = document.querySelector("[data-new-page-title]").value.trim();
    const slug = document.querySelector("[data-new-page-slug]").value.trim();
    const subtitle = document.querySelector("[data-new-page-subtitle]").value.trim();
    const body = document.querySelector("[data-new-page-body]").value.trim();
    let imageUrl = document.querySelector("[data-new-page-image]").value.trim();
    const status = document.querySelector('[data-save-status="pages"]');

    if (!title || !slug) {
      status.textContent = "Add a title and a URL slug first.";
      return;
    }

    if (photoInput.files && photoInput.files[0]) {
      const uploadedUrl = await uploadImage(photoInput.files[0], uploadStatus);
      if (uploadedUrl) imageUrl = uploadedUrl;
    }

    const data = await callContent("upsert-page", {
      title,
      slug,
      subtitle,
      body,
      imageUrl,
      isPublished: true,
    });

    if (data.ok) {
      document.querySelector("[data-new-page-title]").value = "";
      document.querySelector("[data-new-page-slug]").value = "";
      document.querySelector("[data-new-page-subtitle]").value = "";
      document.querySelector("[data-new-page-body]").value = "";
      document.querySelector("[data-new-page-image]").value = "";
      photoInput.value = "";
      if (uploadStatus) uploadStatus.textContent = "";
      status.textContent = "Page created.";
      await refreshContent();
    } else {
      status.textContent = data.error || "Could not create page.";
    }
  });
}

// --- Shared render + wiring ---

function renderAll() {
  renderSettingsPreview();
  renderNavPreview();
  renderNavList();
  renderVideosPreview();
  renderVideosList();
  renderPagesPreview();
  renderPagesList();
}

async function refreshContent() {
  const data = await callContent("get", {});
  if (!data.ok) return;
  state = { settings: data.settings, navLinks: data.navLinks, videos: data.videos, pages: data.pages };
  renderAll();
}

function wirePencils() {
  document.querySelectorAll("[data-edit-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.dataset.editToggle;
      const block = document.querySelector(`[data-block="${name}"]`);
      const panelEl = document.querySelector(`[data-panel="${name}"]`);
      if (!block || !panelEl) return;

      const opening = panelEl.hidden;
      panelEl.hidden = !opening;
      block.classList.toggle("is-editing", opening);

      if (opening && panelEl.querySelector("[data-field]")) {
        fillSettingsPanel(panelEl);
      }
    });
  });

  document.querySelectorAll("[data-cancel]").forEach((button) => {
    button.addEventListener("click", () => {
      const panelEl = button.closest(".edit-panel");
      const block = button.closest(".preview-block");
      if (panelEl) panelEl.hidden = true;
      if (block) block.classList.remove("is-editing");
    });
  });

  document.querySelectorAll("[data-save-settings]").forEach((button) => {
    button.addEventListener("click", () => {
      const panelEl = button.closest(".edit-panel");
      const block = button.closest(".preview-block");
      if (!panelEl || !block) return;
      saveSettingsFromPanel(panelEl, block.dataset.block);
    });
  });

  const headerPhotoInput = document.querySelector('[data-photo-input="header"]');
  if (headerPhotoInput) {
    headerPhotoInput.addEventListener("change", async () => {
      const file = headerPhotoInput.files[0];
      if (!file) return;
      const statusEl = document.querySelector('[data-upload-status="header"]');
      const url = await uploadImage(file, statusEl);
      if (url) {
        document.querySelectorAll('[data-panel="header"] [data-field="profileImageUrl"]').forEach((input) => {
          input.value = url;
        });
      }
    });
  }
}

// Prevent any preview markup (mirrored from the live site) from navigating away.
document.addEventListener("click", (event) => {
  const preview = event.target.closest(".content-preview .cp-embed a, .content-preview .cp-embed button");
  if (preview) {
    event.preventDefault();
  }
});

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = loginForm.querySelector("input");
    setPassword(input.value.trim());
    input.value = "";

    const data = await callContent("get", {});
    if (!data.ok) {
      if (data.error) loginError.textContent = data.error;
      return;
    }

    state = { settings: data.settings, navLinks: data.navLinks, videos: data.videos, pages: data.pages };
    showPanel();
    renderAll();
  });
}

wirePencils();
wireAddNav();
wireAddVideo();
wireAddPage();

if (getPassword()) {
  callContent("get", {}).then((data) => {
    if (data.ok) {
      state = { settings: data.settings, navLinks: data.navLinks, videos: data.videos, pages: data.pages };
      showPanel();
      renderAll();
    }
  });
}

})();
