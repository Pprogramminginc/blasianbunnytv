const year = document.querySelector("#year");
if (year) {
  year.textContent = new Date().getFullYear();
}

const loading = document.querySelector("[data-page-loading]");
const content = document.querySelector("[data-page-content]");
const notFound = document.querySelector("[data-page-not-found]");

function renderBody(container, text) {
  container.innerHTML = "";
  String(text || "")
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .forEach((paragraph) => {
      const p = document.createElement("p");
      p.textContent = paragraph;
      container.append(p);
    });
}

async function loadPage() {
  const slug = new URLSearchParams(window.location.search).get("slug");

  if (!slug) {
    loading.hidden = true;
    notFound.hidden = false;
    return;
  }

  try {
    const response = await fetch(`/api/page?slug=${encodeURIComponent(slug)}`);
    const data = await response.json();

    if (!data.ok) {
      loading.hidden = true;
      notFound.hidden = false;
      return;
    }

    document.title = `${data.page.title} · Blasian Bunny TV`;
    content.querySelector("[data-page-title]").textContent = data.page.title;

    const subtitleEl = content.querySelector("[data-page-subtitle]");
    if (data.page.subtitle) {
      subtitleEl.textContent = data.page.subtitle;
      subtitleEl.hidden = false;
    }

    const imageEl = content.querySelector("[data-page-image]");
    if (data.page.imageUrl) {
      imageEl.src = data.page.imageUrl;
      imageEl.hidden = false;
    }

    renderBody(content.querySelector("[data-page-body]"), data.page.body);

    loading.hidden = true;
    content.hidden = false;
  } catch (error) {
    loading.hidden = true;
    notFound.hidden = false;
  }
}

loadPage();
