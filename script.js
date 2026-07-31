const year = document.querySelector("#year");
const releaseForm = document.querySelector("#release-form");
const formNote = document.querySelector("#form-note");
const revealItems = document.querySelectorAll(
  ".stats-strip, .section-intro, .link-card, .section-copy, .feature-grid article, .youtube-copy, .video-showcase, .book-cover, .contact-actions",
);

if (year) {
  year.textContent = new Date().getFullYear();
}

if (releaseForm && formNote) {
  releaseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    releaseForm.reset();
    formNote.textContent = "You're on the list. Book updates are coming soon.";
  });
}

if (revealItems.length > 0) {
  revealItems.forEach((item) => item.classList.add("reveal"));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
}
