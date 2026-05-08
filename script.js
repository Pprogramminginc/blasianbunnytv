const year = document.querySelector("#year");
const releaseForm = document.querySelector("#release-form");
const formNote = document.querySelector("#form-note");
const videoShowcase = document.querySelector("[data-video-showcase]");
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

if (videoShowcase) {
  const player = videoShowcase.querySelector("[data-video-player]");
  const image = videoShowcase.querySelector("[data-video-image]");
  const title = videoShowcase.querySelector("[data-video-title]");
  const cards = Array.from(videoShowcase.querySelectorAll("[data-video-card]"));
  let activeIndex = 0;
  let rotation;

  const setActiveVideo = (index, shouldPlay = false) => {
    const card = cards[index];

    if (!card || !player || !title) {
      return;
    }

    const videoId = card.dataset.videoId;
    const videoTitle = card.dataset.videoTitle;
    activeIndex = index;

    cards.forEach((item) => item.classList.toggle("is-active", item === card));
    title.textContent = videoTitle;
    player.dataset.videoId = videoId;

    if (shouldPlay && window.location.protocol === "file:") {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank", "noopener,noreferrer");
      return;
    }

    if (shouldPlay) {
      player.innerHTML = "";
      const iframe = document.createElement("iframe");
      const origin = encodeURIComponent(window.location.origin);
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&origin=${origin}`;
      iframe.title = videoTitle;
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      player.append(iframe);
      return;
    }

    if (image) {
      image.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }
  };

  const stopRotation = () => {
    window.clearInterval(rotation);
    rotation = undefined;
  };

  rotation = window.setInterval(() => {
    setActiveVideo((activeIndex + 1) % cards.length);
  }, 3000);

  const playActiveVideo = () => {
    stopRotation();
    setActiveVideo(activeIndex, true);
  };

  player.addEventListener("click", playActiveVideo);
  player.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      playActiveVideo();
    }
  });

  cards.forEach((card, index) => {
    card.addEventListener("click", () => {
      stopRotation();
      setActiveVideo(index, true);
    });
  });
}
