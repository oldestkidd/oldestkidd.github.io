(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");

  /* ---------- Header, progress bar, year ---------- */

  const header = document.getElementById("site-header");
  const progressBar = document.getElementById("scroll-progress-bar");
  const year = document.getElementById("year");

  if (year) year.textContent = String(new Date().getFullYear());

  const onScroll = () => {
    const scrollY = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", scrollY > 12);

    if (progressBar) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(scrollY / max, 1) : 0;
      progressBar.style.width = `${progress * 100}%`;
    }
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });

  /* ---------- Mobile navigation ---------- */

  const nav = document.getElementById("primary-nav");
  const navToggle = document.getElementById("nav-toggle");

  const closeNav = () => {
    if (!nav || !navToggle) return;
    nav.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    document.body.classList.remove("nav-open");
    if (header) header.classList.remove("nav-visible");
  };

  const openNav = () => {
    if (!nav || !navToggle) return;
    nav.classList.add("is-open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close menu");
    document.body.classList.add("nav-open");
    if (header) header.classList.add("nav-visible");
  };

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeNav();
      else openNav();
    });

    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeNav();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        closeNav();
        navToggle.focus();
      }
    });

    document.addEventListener("click", (event) => {
      if (navToggle.getAttribute("aria-expanded") !== "true") return;
      if (nav.contains(event.target) || navToggle.contains(event.target)) return;
      closeNav();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ---------- Reveal on scroll ---------- */

  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));

  if ("IntersectionObserver" in window && !prefersReducedMotion.matches) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -36px 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ---------- Scroll spy ---------- */

  const navLinks = Array.from(document.querySelectorAll(".nav__link"));
  const sections = navLinks
    .map((link) => {
      const id = link.getAttribute("href");
      return id && id.startsWith("#") ? document.querySelector(id) : null;
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
            link.classList.toggle("is-active", isCurrent);
            if (isCurrent) link.setAttribute("aria-current", "true");
            else link.removeAttribute("aria-current");
          });
        });
      },
      { rootMargin: "-38% 0px -54% 0px", threshold: 0 }
    );

    sections.forEach((section) => spy.observe(section));

    window.addEventListener(
      "scroll",
      () => {
        if (window.scrollY > 180) return;
        navLinks.forEach((link) => {
          link.classList.remove("is-active");
          link.removeAttribute("aria-current");
        });
      },
      { passive: true }
    );
  }

  /* ---------- Project filters ---------- */

  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const projects = Array.from(document.querySelectorAll(".project"));

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      projects.forEach((project) => {
        const match = filter === "all" || project.dataset.cat === filter;
        project.classList.toggle("is-hidden", !match);
        if (match) {
          project.classList.add("is-visible");
          project.style.animation = "none";
          void project.offsetWidth;
          project.style.animation = "";
        }
      });
    });
  });

  /* ---------- Copy email ---------- */

  const copyButton = document.querySelector("[data-copy]");
  const copyStatus = document.querySelector(".copy-status");

  const legacyCopy = (text) => {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    field.remove();
    return copied;
  };

  if (copyButton) {
    copyButton.addEventListener("click", async () => {
      const text = copyButton.dataset.copy || "";
      let copied = false;

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          copied = true;
        } catch {
          copied = false;
        }
      }

      if (!copied) copied = legacyCopy(text);

      if (copyStatus) {
        copyStatus.textContent = copied ? "Copied to clipboard" : "Press Ctrl+C to copy";
        window.setTimeout(() => {
          copyStatus.textContent = "";
        }, 2400);
      }
    });
  }

  /* ---------- Project hover spotlight ---------- */

  if (canHover.matches && !prefersReducedMotion.matches) {
    projects.forEach((project) => {
      project.addEventListener("pointermove", (event) => {
        const rect = project.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        project.style.setProperty("--mx", `${x}%`);
        project.style.setProperty("--my", `${y}%`);
      });

      project.addEventListener("pointerleave", () => {
        project.style.removeProperty("--mx");
        project.style.removeProperty("--my");
      });
    });
  }
})();
