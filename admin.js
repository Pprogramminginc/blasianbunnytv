const PASSWORD_KEY = "bbtv_admin_password";

const year = document.querySelector("#year");
if (year) {
  year.textContent = new Date().getFullYear();
}

const loginForm = document.querySelector("[data-login-form]");
const loginError = document.querySelector("[data-login-error]");
const panel = document.querySelector("[data-admin-panel]");
const generateButtons = document.querySelectorAll("[data-generate]");
const resultBox = document.querySelector("[data-generate-result]");
const codesBody = document.querySelector("[data-codes-body]");
const refreshButton = document.querySelector("[data-refresh]");

function getPassword() {
  return sessionStorage.getItem(PASSWORD_KEY) || "";
}

function setPassword(password) {
  sessionStorage.setItem(PASSWORD_KEY, password);
}

function clearPassword() {
  sessionStorage.removeItem(PASSWORD_KEY);
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

async function callAdmin(path, extraBody = {}) {
  let response;

  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: getPassword(), ...extraBody }),
    });
  } catch (error) {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }

  const data = await response.json();

  if (response.status === 401) {
    clearPassword();
    showLogin("Incorrect password. Please try again.");
  }

  return data;
}

function formatDate(value) {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
}

function statusFor(row) {
  if (row.used_at) {
    return "Used";
  }
  if (new Date(row.expires_at) < new Date()) {
    return "Expired";
  }
  return "Active";
}

function renderCodes(codes) {
  if (codes.length === 0) {
    codesBody.innerHTML = "<tr><td colspan=\"6\">No codes generated yet.</td></tr>";
    return;
  }

  codesBody.innerHTML = "";

  codes.forEach((row) => {
    const status = statusFor(row);
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${row.product_id}</td>
      <td><code>${row.code}</code></td>
      <td>${formatDate(row.created_at)}</td>
      <td>${formatDate(row.expires_at)}</td>
      <td><span class="status-pill status-${status.toLowerCase()}">${status}</span></td>
      <td></td>
    `;

    if (status === "Active") {
      const revokeButton = document.createElement("button");
      revokeButton.type = "button";
      revokeButton.className = "revoke-button";
      revokeButton.textContent = "Revoke";
      revokeButton.addEventListener("click", async () => {
        revokeButton.disabled = true;
        await callAdmin("/api/admin/revoke", { id: row.id });
        loadCodes();
      });
      tr.lastElementChild.append(revokeButton);
    }

    codesBody.append(tr);
  });
}

async function loadCodes() {
  codesBody.innerHTML = "<tr><td colspan=\"6\">Loading…</td></tr>";

  const data = await callAdmin("/api/admin/list");

  if (!data.ok) {
    codesBody.innerHTML = "<tr><td colspan=\"6\">Could not load codes.</td></tr>";
    return;
  }

  renderCodes(data.codes);
}

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = loginForm.querySelector("input");
    setPassword(input.value.trim());
    input.value = "";

    const data = await callAdmin("/api/admin/list");
    if (!data.ok) {
      if (data.error) {
        loginError.textContent = data.error;
      }
      return;
    }

    showPanel();
    renderCodes(data.codes);
  });
}

generateButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const productId = button.dataset.generate;
    button.disabled = true;

    const data = await callAdmin("/api/admin/generate", { productId });

    button.disabled = false;

    if (!data.ok) {
      resultBox.hidden = false;
      resultBox.textContent = data.error || "Could not generate code.";
      return;
    }

    resultBox.hidden = false;
    resultBox.innerHTML = `
      New code for <strong>${productId}</strong>:
      <code>${data.code}</code>
      <small>Expires ${formatDate(data.expiresAt)} — one-time use.</small>
    `;

    loadCodes();
  });
});

if (refreshButton) {
  refreshButton.addEventListener("click", loadCodes);
}

if (getPassword()) {
  callAdmin("/api/admin/list").then((data) => {
    if (data.ok) {
      showPanel();
      renderCodes(data.codes);
    }
  });
}
