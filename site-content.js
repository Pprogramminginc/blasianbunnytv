(function () {
  function applyText(selector, text) {
    if (!text) return;
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = text;
    });
  }

  function applySrc(selector, src) {
    if (!src) return;
    document.querySelectorAll(selector).forEach((el) => {
      el.src = src;
    });
  }

  function renderSettings(settings) {
    if (!settings) return;

    applySrc("[data-site-photo]", settings.profileImageUrl);
    applyText("[data-site-brand]", settings.brandName);
    applyText("[data-site-ribbon-text]", settings.topRibbonText);
    applyText("[data-site-hero-eyebrow]", settings.heroEyebrow);
    applyText("[data-site-hero-title]", settings.heroTitle);
    applyText("[data-site-hero-copy]", settings.heroCopy);
    applyText("[data-site-hero-card-label]", settings.heroCardLabel);
    applyText("[data-site-hero-card-text]", settings.heroCardText);

    if (settings.topRibbonUrl) {
      document.querySelectorAll("[data-site-ribbon-link]").forEach((el) => {
        el.href = settings.topRibbonUrl;
      });
    }

    const primary = document.querySelector("[data-site-primary-button]");
    if (primary) {
      if (settings.primaryButtonText) primary.textContent = settings.primaryButtonText.trim();
      if (settings.primaryButtonUrl) primary.href = settings.primaryButtonUrl;
    }

    const secondary = document.querySelector("[data-site-secondary-button]");
    if (secondary) {
      if (settings.secondaryButtonText) secondary.textContent = settings.secondaryButtonText.trim();
      if (settings.secondaryButtonUrl) secondary.href = settings.secondaryButtonUrl;
    }
  }

  function resolveNavHref(href) {
    const isHomePage = /(^|\/)index\.html$/.test(window.location.pathname) || window.location.pathname.endsWith("/");
    if (href.startsWith("#") && !isHomePage) {
      return `index.html${href}`;
    }
    return href;
  }

  function renderNav(navLinks) {
    const nav = document.querySelector("[data-site-nav]");
    if (!nav || !Array.isArray(navLinks) || navLinks.length === 0) return;

    nav.innerHTML = "";
    navLinks.forEach((link) => {
      const a = document.createElement("a");
      a.href = resolveNavHref(link.href);
      a.textContent = link.label;
      if (link.openNewTab) {
        a.target = "_blank";
        a.rel = "noreferrer";
      }
      nav.append(a);
    });
  }

  function readFallbackVideos(selector) {
    return Array.from(selector.querySelectorAll("[data-video-card]")).map((card) => ({
      videoId: card.dataset.videoId,
      title: card.dataset.videoTitle,
      shortLabel: card.querySelector("span") ? card.querySelector("span").textContent : card.dataset.videoTitle,
    }));
  }

  function initVideoShowcase(videos) {
    const showcase = document.querySelector("[data-video-showcase]");
    if (!showcase) return;

    const player = showcase.querySelector("[data-video-player]");
    const image = showcase.querySelector("[data-video-image]");
    const titleEl = showcase.querySelector("[data-video-title]");
    const selectorEl = showcase.querySelector("[data-video-selector]");

    if (!player || !image || !titleEl || !selectorEl) return;

    const list = Array.isArray(videos) && videos.length > 0 ? videos : readFallbackVideos(selectorEl);
    if (list.length === 0) return;

    selectorEl.innerHTML = "";
    const cards = list.map((video) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "video-card";
      button.dataset.videoCard = "";
      button.dataset.videoId = video.videoId;
      button.dataset.videoTitle = video.title;

      const img = document.createElement("img");
      img.src = `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;
      img.alt = "";
      button.append(img);

      const span = document.createElement("span");
      span.textContent = video.shortLabel || video.title;
      button.append(span);

      selectorEl.append(button);
      return button;
    });

    let activeIndex = 0;
    let rotation;

    const setActiveVideo = (index, shouldPlay = false) => {
      const card = cards[index];
      if (!card) return;

      const videoId = card.dataset.videoId;
      const videoTitle = card.dataset.videoTitle;
      activeIndex = index;

      cards.forEach((item) => item.classList.toggle("is-active", item === card));
      titleEl.textContent = videoTitle;
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

      image.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    };

    const stopRotation = () => {
      window.clearInterval(rotation);
      rotation = undefined;
    };

    setActiveVideo(0, false);

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

  async function init() {
    let data = null;

    try {
      const response = await fetch("/api/content");
      const json = await response.json();
      if (json.ok) {
        data = json;
      }
    } catch (error) {
      data = null;
    }

    if (data) {
      renderSettings(data.settings);
      renderNav(data.navLinks);
    }

    initVideoShowcase(data ? data.videos : null);
  }

  init();
})();
