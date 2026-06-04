const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const headerHeight = () =>
  document.querySelector(".site-header")?.getBoundingClientRect().height || 0;

const initMenu = () => {
  const button = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".mobile-menu");
  const links = [...document.querySelectorAll(".mobile-menu a")];

  if (!button || !menu) return;

  const setOpen = (open) => {
    button.classList.toggle("is-open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Close menu" : "Open menu");

    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add("is-open"));
    } else {
      menu.classList.remove("is-open");
      window.setTimeout(() => {
        if (!menu.classList.contains("is-open")) menu.hidden = true;
      }, 190);
    }
  };

  button.addEventListener("click", () => {
    setOpen(button.getAttribute("aria-expanded") !== "true");
  });

  links.forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });
};

const initAnchorScroll = () => {
  [...document.querySelectorAll('a[href^="#"]')].forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));

      if (!target) return;

      event.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - headerHeight() - 14;
      window.scrollTo({ top, behavior: prefersReducedMotion ? "auto" : "smooth" });
    });
  });
};

const initReveal = () => {
  const items = document.querySelectorAll(".reveal");

  if (!items.length) return;

  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18 }
  );

  items.forEach((item) => observer.observe(item));
};

const initMinimalText = () => {
  const headings = [...document.querySelectorAll("[data-minimal-text]")];

  if (!headings.length) return;

  headings.forEach((heading) => {
    const text = heading.textContent.trim();
    heading.dataset.text = text;
    heading.style.setProperty("--spot-x", "50%");
    heading.style.setProperty("--spot-y", "46%");

    const updateSpot = (event) => {
      const rect = heading.getBoundingClientRect();
      const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
      const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));

      heading.style.setProperty("--spot-x", `${x.toFixed(2)}%`);
      heading.style.setProperty("--spot-y", `${y.toFixed(2)}%`);
    };

    heading.addEventListener("pointerenter", (event) => {
      heading.classList.add("is-hovered");
      updateSpot(event);
    }, { passive: true });
    heading.addEventListener("pointermove", updateSpot, { passive: true });
    heading.addEventListener("pointerleave", () => {
      heading.classList.remove("is-hovered");
      heading.style.setProperty("--spot-x", "50%");
      heading.style.setProperty("--spot-y", "46%");
    });

    if ("IntersectionObserver" in window && !prefersReducedMotion) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry?.isIntersecting) return;
          heading.classList.add("is-visible");
          observer.unobserve(heading);
        },
        { threshold: 0.6 }
      );

      observer.observe(heading);
    } else {
      heading.classList.add("is-visible");
    }
  });
};

const initFloatingHero = () => {
  const root = document.querySelector("[data-floating-root]");

  if (!root || prefersReducedMotion) return;

  const items = [...root.querySelectorAll("[data-depth]")].map((element) => ({
    element,
    depth: Number(element.dataset.depth || "1"),
    currentX: 0,
    currentY: 0,
  }));

  let bounds = root.getBoundingClientRect();
  let frame = 0;
  let active = true;
  const pointer = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };

  const refreshBounds = () => {
    bounds = root.getBoundingClientRect();
  };

  const tick = () => {
    if (!active) {
      frame = 0;
      return;
    }

    let moving = false;

    items.forEach((item) => {
      const strength = item.depth * -0.018;
      const targetX = (pointer.x - bounds.left - bounds.width / 2) * strength;
      const targetY = (pointer.y - bounds.top - bounds.height / 2) * strength;
      const dx = targetX - item.currentX;
      const dy = targetY - item.currentY;

      item.currentX += dx * 0.12;
      item.currentY += dy * 0.12;
      item.element.style.translate = `${item.currentX.toFixed(2)}px ${item.currentY.toFixed(2)}px`;

      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) moving = true;
    });

    frame = moving ? requestAnimationFrame(tick) : 0;
  };

  const requestTick = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      requestTick();
    },
    { passive: true }
  );

  window.addEventListener("resize", refreshBounds, { passive: true });
  window.addEventListener("scroll", refreshBounds, { passive: true });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        active = entry?.isIntersecting ?? true;
        if (active) {
          refreshBounds();
          requestTick();
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(root);
  }
};

const initTiltCards = () => {
  const cards = [...document.querySelectorAll("[data-tilt-card]")];

  if (!cards.length || prefersReducedMotion) return;

  cards.forEach((card) => {
    const setTilt = (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * 7;
      const rotateY = (x - 0.5) * 7;

      card.style.setProperty("--tilt-x", `${rotateY.toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${rotateX.toFixed(2)}deg`);
      card.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    };

    const resetTilt = () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
      card.style.setProperty("--mx", "50%");
      card.style.setProperty("--my", "50%");
    };

    card.addEventListener("pointermove", setTilt, { passive: true });
    card.addEventListener("pointerleave", resetTilt);
  });
};

const initReel = () => {
  const reel = document.querySelector("[data-reel]");
  const image = document.querySelector("[data-reel-image]");
  const label = document.querySelector("[data-reel-label]");
  const time = document.querySelector("[data-reel-time]");
  const buttons = [...document.querySelectorAll("[data-reel-src]")];

  if (!reel || !image || !label || !time || !buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      buttons.forEach((item) => item.classList.toggle("is-active", item === button));
      reel.classList.add("is-swapping");

      window.setTimeout(() => {
        image.src = button.dataset.reelSrc;
        label.textContent = button.dataset.reelLabel;
        time.textContent = button.dataset.reelTime;
        reel.classList.remove("is-swapping");
      }, 140);
    });
  });
};

const initWorkCarousel = () => {
  const carousel = document.querySelector("[data-work-carousel]");
  const cards = [...document.querySelectorAll("[data-carousel-card]")];
  const prevButton = document.querySelector("[data-carousel-prev]");
  const nextButton = document.querySelector("[data-carousel-next]");

  if (!carousel || cards.length < 3 || !prevButton || !nextButton) return;

  let positions = cards.slice();
  let transitionTimer = null;

  const render = (direction) => {
    carousel.dataset.direction = direction;
    carousel.classList.add("is-transitioning");

    positions.forEach((card, index) => {
      card.classList.remove("is-center", "is-left", "is-right", "is-hidden");

      if (index === 1) {
        card.classList.add("is-center");
      } else if (index === 0) {
        card.classList.add("is-left");
      } else {
        card.classList.add("is-right");
      }
    });

    clearTimeout(transitionTimer);
    transitionTimer = window.setTimeout(() => {
      carousel.classList.remove("is-transitioning");
    }, 900);
  };

  const rotateLeft = () => {
    positions = [...positions.slice(1), positions[0]];
    render("next");
  };

  const rotateRight = () => {
    positions = [positions[positions.length - 1], ...positions.slice(0, -1)];
    render("prev");
  };

  nextButton.addEventListener("click", rotateLeft);
  prevButton.addEventListener("click", rotateRight);

  render("next");
};

const initYear = () => {
  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());
};

const init = () => {
  initMenu();
  initAnchorScroll();
  initReveal();
  initMinimalText();
  initFloatingHero();
  initTiltCards();
  initWorkCarousel();
  initReel();
  initYear();
};

document.addEventListener("DOMContentLoaded", init);
