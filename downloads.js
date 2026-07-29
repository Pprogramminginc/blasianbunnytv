const year = document.querySelector("#year");
if (year) {
  year.textContent = new Date().getFullYear();
}

document.querySelectorAll("[data-download-card]").forEach((card) => {
  const productId = card.dataset.productId;
  const form = card.querySelector("[data-code-form]");
  const note = card.querySelector("[data-code-note]");
  const input = form?.querySelector("input");
  const button = form?.querySelector("button");
  const downloadLinks = card.querySelector("[data-download-links]");

  if (!productId || !form || !note || !input || !downloadLinks) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const code = input.value.trim();
    if (!code) {
      return;
    }

    button.disabled = true;
    note.textContent = "Checking code…";

    try {
      const response = await fetch("/api/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, code }),
      });
      const data = await response.json();

      if (!data.ok) {
        note.textContent = "Incorrect, already used, or expired code. Please check and try again.";
        button.disabled = false;
        return;
      }

      note.textContent = data.files.length > 1
        ? "Unlocked! Your downloads are ready below."
        : "Unlocked! Your download is ready below.";
      card.classList.add("is-unlocked");

      data.files.forEach((file) => {
        const link = document.createElement("a");
        link.className = "button primary download-link";
        link.href = file.url;
        link.download = "";
        link.textContent = `Download ${file.label}`;
        downloadLinks.append(link);
      });
      downloadLinks.hidden = false;

      form.hidden = true;
    } catch (error) {
      note.textContent = "Something went wrong. Please try again in a moment.";
      button.disabled = false;
    }
  });
});
