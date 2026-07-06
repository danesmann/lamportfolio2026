/* ============================================================
   THANH LAM — PORTFOLIO
   GSAP + ScrollTrigger + Lenis · original implementation
   ============================================================ */

(function () {
  "use strict";

  /* ---------- debug helpers (only active with ?debug=1) ---------- */
  var PARAMS = new URLSearchParams(window.location.search);
  var DEBUG = PARAMS.has("debug");
  window.__errors = [];
  window.addEventListener("error", function (e) {
    window.__errors.push(String(e.message || e));
    if (DEBUG) {
      var box = document.getElementById("__errors__");
      if (!box) {
        box = document.createElement("div");
        box.id = "__errors__";
        box.style.cssText =
          "position:fixed;bottom:0;left:0;z-index:9999;background:#900;color:#fff;" +
          "font:11px monospace;padding:6px 10px;max-width:100vw;white-space:pre-wrap;";
        document.body.appendChild(box);
      }
      box.textContent = "JS ERRORS: " + window.__errors.join(" | ");
    }
  });

  /* if the animation libs failed to load (offline, blocked CDN), degrade
     gracefully: drop the preloader and let the page scroll */
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    var preEl = document.getElementById("preloader");
    if (preEl) preEl.style.display = "none";
    document.body.classList.remove("is-loading");
    return;
  }

  var RM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  /* headless browsers force reduced-motion; allow override for testing */
  if (DEBUG && PARAMS.get("rm") === "0") RM = false;
  var FINE = window.matchMedia("(pointer: fine)").matches;

  /* debug: fast-forward all animation (?debug=1&ts=50) */
  if (DEBUG && PARAMS.get("ts")) {
    gsap.globalTimeline.timeScale(parseFloat(PARAMS.get("ts")) || 1);
  }

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  var PROJECTS = window.PROJECTS || [];
  var CATEGORIES = window.CATEGORIES || ["ALL"];

  gsap.registerPlugin(ScrollTrigger);

  /* ============================================================
     LENIS SMOOTH SCROLL
     ============================================================ */
  var lenis = null;
  if (!RM && typeof Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToY(y, opts) {
    opts = opts || {};
    if (lenis) {
      lenis.scrollTo(y, {
        duration: opts.immediate ? 0 : opts.duration || 1.2,
        immediate: !!opts.immediate
      });
    } else {
      window.scrollTo({ top: y, behavior: opts.immediate ? "auto" : "smooth" });
    }
  }

  function stopScroll() {
    if (lenis) lenis.stop();
    document.body.classList.add("is-loading");
  }
  function startScroll() {
    if (lenis) lenis.start();
    document.body.classList.remove("is-loading");
  }

  /* ============================================================
     TEXT SPLITTING (lightweight SplitText substitute)
     ============================================================ */
  function splitChars(el) {
    var text = el.textContent;
    /* keep the accessible name intact — the char spans are presentation */
    if (!el.hasAttribute("aria-label")) el.setAttribute("aria-label", text);
    el.textContent = "";
    var chars = [];
    for (var i = 0; i < text.length; i++) {
      var mask = document.createElement("span");
      mask.className = "split-mask";
      mask.setAttribute("aria-hidden", "true");
      var ch = document.createElement("span");
      ch.className = "split-char";
      ch.textContent = text[i] === " " ? " " : text[i];
      mask.appendChild(ch);
      el.appendChild(mask);
      chars.push(ch);
    }
    return chars;
  }

  function splitWords(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    var out = [];
    words.forEach(function (w, i) {
      var span = document.createElement("span");
      span.className = "word";
      span.textContent = w;
      el.appendChild(span);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      out.push(span);
    });
    return out;
  }

  /* ============================================================
     CUSTOM CURSOR
     ============================================================ */
  (function cursor() {
    if (!FINE || RM) return;
    var root = document.querySelector(".cursor");
    if (!root) return;
    var xTo = gsap.quickTo(root, "x", { duration: 0.35, ease: "power3.out" });
    var yTo = gsap.quickTo(root, "y", { duration: 0.35, ease: "power3.out" });
    var shown = false;
    window.addEventListener("mousemove", function (e) {
      if (!shown) {
        shown = true;
        gsap.set(root, { x: e.clientX, y: e.clientY });
        root.classList.add("is-on");
      }
      xTo(e.clientX);
      yTo(e.clientY);
    });
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest("[data-cursor], a, button")) root.classList.add("is-hover");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest("[data-cursor], a, button")) root.classList.remove("is-hover");
    });
  })();

  /* ============================================================
     MARQUEES — seamless loop via duplicated groups
     ============================================================ */
  function buildMarquees() {
    document.querySelectorAll("[data-marquee]").forEach(function (track) {
      var inner = track.querySelector(".marquee__inner");
      if (!inner) return;
      var group = document.createElement("div");
      group.style.display = "inline-block";
      group.style.whiteSpace = "nowrap";
      group.appendChild(inner);
      track.appendChild(group);

      var w = group.offsetWidth || 1;
      var copies = Math.max(1, Math.ceil((window.innerWidth * 1.4) / w));
      for (var i = 0; i < copies - 1; i++) {
        group.appendChild(inner.cloneNode(true));
      }
      var clone = group.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);

      if (RM) return;
      var speed = parseFloat(track.getAttribute("data-marquee-speed")) || 24;
      var tween = gsap.to(track, { xPercent: -50, ease: "none", duration: speed, repeat: -1 });
      /* don't burn frames while the marquee is off-screen */
      ScrollTrigger.create({
        trigger: track.parentNode,
        start: "top bottom",
        end: "bottom top",
        onToggle: function (self) {
          if (self.isActive) tween.play();
          else tween.pause();
        }
      });
    });
  }

  /* ============================================================
     WORK WHEEL — input-driven project list
     [filter rail] [name] [origin] [scope] · loops when showing ALL
     ============================================================ */
  var wheel = {
    items: PROJECTS.slice(),
    els: [],
    rows: [],
    imgs: {},
    activeImg: null,
    current: 0,
    target: 0,
    active: -1,
    itemH: 48,
    filter: "ALL",
    loop: false,
    transitioning: false
  };

  var workWrap = document.getElementById("workWrap");
  var workList = document.getElementById("workList");
  var workBg = document.getElementById("workBg");
  var workFilters = document.getElementById("workFilters");

  /* the wheel only exists on index.html — archive.html links back to it */
  function wheelExists() {
    return !!(workWrap && workList && workBg && workFilters);
  }

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function buildWheelImages() {
    PROJECTS.forEach(function (p) {
      var img = document.createElement("img");
      /* load on demand (active project + neighbors) instead of all 18 at once */
      img.setAttribute("data-src", p.img);
      img.alt = "";
      img.decoding = "async";
      workBg.appendChild(img);
      wheel.imgs[p.num] = img;
    });
    /* warm the rest of the images once the page has settled */
    window.addEventListener("load", function () {
      setTimeout(function () {
        PROJECTS.forEach(function (p) { ensureImg(wheel.imgs[p.num]); });
      }, 2500);
    });
  }

  function ensureImg(img) {
    if (img && !img.src) {
      var src = img.getAttribute("data-src");
      if (src) img.src = src;
    }
  }

  function buildWheelList() {
    workList.innerHTML = "";
    wheel.els = [];
    wheel.rows = [];
    wheel.loop = wheel.filter === "ALL" && wheel.items.length >= 12;
    wheel.items.forEach(function (p, i) {
      var li = document.createElement("li");
      li.className = "work__item";
      var btn = document.createElement("button");
      btn.className = "work__row";
      btn.type = "button";
      btn.setAttribute("data-cursor", "");
      btn.setAttribute("aria-label", p.title + ", " + p.origin + ", " + p.tags.join(", "));

      var name = document.createElement("span");
      name.className = "work__row-name";
      name.textContent = p.title;
      var origin = document.createElement("span");
      origin.className = "work__row-origin";
      origin.textContent = p.origin;
      var scope = document.createElement("span");
      scope.className = "work__row-scope";
      scope.textContent = p.tags.join(", ");

      btn.appendChild(name);
      btn.appendChild(origin);
      btn.appendChild(scope);

      btn.addEventListener("click", function () {
        wheelGoTo(i);
      });
      /* keyboard focus: keep the overflow:hidden stage from scrolling itself
         out of alignment, and bring the focused project to the center */
      btn.addEventListener("focus", function () {
        if (workWrap) { workWrap.scrollTop = 0; workWrap.scrollLeft = 0; }
        wheelGoTo(i);
      });
      li.appendChild(btn);
      workList.appendChild(li);
      wheel.els.push(li);
      wheel.rows.push(btn);
    });
    wheel.active = -1;
    measureWheel();
    renderWheel(true);
  }

  function measureWheel() {
    if (!workWrap) return;
    var first = wheel.els[0];
    if (first) wheel.itemH = first.offsetHeight || 48;
  }

  /* move the wheel to an item — shortest way around when looping */
  function wheelGoTo(i) {
    var n = wheel.items.length;
    if (!n) return;
    if (wheel.loop) {
      var curMod = ((wheel.current % n) + n) % n;
      var delta = i - curMod;
      if (delta > n / 2) delta -= n;
      if (delta < -n / 2) delta += n;
      wheel.target = wheel.current + delta;
    } else {
      wheel.target = i;
    }
  }

  /* settle on a row once input goes quiet */
  var snapT = null;
  function scheduleSnap() {
    clearTimeout(snapT);
    snapT = setTimeout(function () {
      wheel.target = Math.round(wheel.target);
      if (!wheel.loop) {
        wheel.target = Math.min(Math.max(wheel.target, 0), wheel.items.length - 1);
      }
    }, 160);
  }

  /* the page doesn't scroll — wheel / touch / arrows drive the list */
  function initWheelInput() {
    workWrap.addEventListener(
      "wheel",
      function (e) {
        e.preventDefault();
        if (wheel.transitioning) return;
        var dy = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? window.innerHeight : 1);
        wheel.target += dy * 0.006;
        scheduleSnap();
      },
      { passive: false }
    );

    var touchY = null;
    workWrap.addEventListener(
      "touchstart",
      function (e) {
        touchY = e.touches[0].clientY;
      },
      { passive: true }
    );
    workWrap.addEventListener(
      "touchmove",
      function (e) {
        if (touchY === null || wheel.transitioning) return;
        e.preventDefault();
        var y = e.touches[0].clientY;
        wheel.target += (touchY - y) / wheel.itemH;
        touchY = y;
        scheduleSnap();
      },
      { passive: false }
    );
    workWrap.addEventListener("touchend", function () {
      touchY = null;
      scheduleSnap();
    });

    window.addEventListener("keydown", function (e) {
      if (wheel.transitioning || document.body.classList.contains("menu-open")) return;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        wheel.target = Math.round(wheel.target) + 1;
        scheduleSnap();
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        wheel.target = Math.round(wheel.target) - 1;
        scheduleSnap();
      }
    });
  }

  function setActive(idx) {
    if (idx === wheel.active) return;
    wheel.active = idx;
    var p = wheel.items[idx];
    if (!p) return;

    wheel.els.forEach(function (el, i) {
      el.classList.toggle("is-active", i === idx);
    });

    /* load active image + neighbors, then crossfade */
    var n = wheel.items.length;
    var img = wheel.imgs[p.num];
    ensureImg(img);
    var next = wheel.items[(idx + 1) % n];
    var prev = wheel.items[(idx - 1 + n) % n];
    if (next) ensureImg(wheel.imgs[next.num]);
    if (prev) ensureImg(wheel.imgs[prev.num]);
    if (img && img !== wheel.activeImg) {
      if (wheel.activeImg) {
        gsap.to(wheel.activeImg, { opacity: 0, duration: 0.55, ease: "power2.out", overwrite: true });
      }
      gsap.fromTo(
        img,
        { opacity: 0, scale: 1.07 },
        { opacity: 1, scale: 1, duration: 0.9, ease: "power2.out", overwrite: true }
      );
      wheel.activeImg = img;
    }
  }

  function renderWheel(force) {
    var n = wheel.items.length;
    if (!n) return;

    if (!wheel.loop) {
      if (wheel.target < 0) wheel.target = 0;
      if (wheel.target > n - 1) wheel.target = n - 1;
    }

    var ease = RM ? 1 : 0.09;
    wheel.current += (wheel.target - wheel.current) * ease;
    if (Math.abs(wheel.target - wheel.current) < 0.0005) wheel.current = wheel.target;

    /* keep the running position bounded so floats stay precise */
    if (wheel.loop && Math.abs(wheel.current) > n * 1000) {
      var shift = Math.floor(wheel.current / n) * n;
      wheel.current -= shift;
      wheel.target -= shift;
    }

    var visRange = Math.ceil(window.innerHeight / (wheel.itemH * 2)) + 1;

    for (var i = 0; i < n; i++) {
      var d;
      if (wheel.loop) {
        /* wrap each row to its nearest position around the center */
        d = (((i - wheel.current) % n) + n) % n;
        if (d > n / 2) d -= n;
      } else {
        d = i - wheel.current;
      }
      var ad = Math.abs(d);
      var el = wheel.els[i];
      if (!el) continue;
      if (ad > visRange && !force) {
        el.style.visibility = "hidden";
        continue;
      }
      el.style.visibility = "visible";
      el.style.transform = "translate3d(0," + (d * wheel.itemH).toFixed(2) + "px,0)";
      /* far rows sit uniformly dim; rows brighten as they pass the center */
      var mix = Math.max(0, 1 - ad);
      el.style.opacity = (0.26 + 0.74 * mix).toFixed(3);
    }

    var activeIdx = wheel.loop
      ? ((Math.round(wheel.current) % n) + n) % n
      : Math.min(Math.max(Math.round(wheel.current), 0), n - 1);
    setActive(activeIdx);
  }

  function renderWheelTick() {
    renderWheel(false);
  }

  function buildFilters() {
    workFilters.innerHTML = "";
    CATEGORIES.forEach(function (cat) {
      var count =
        cat === "ALL"
          ? PROJECTS.length
          : PROJECTS.filter(function (p) { return p.category === cat; }).length;
      var btn = document.createElement("button");
      btn.className = "work__filter mono" + (cat === wheel.filter ? " is-active" : "");
      btn.type = "button";
      btn.setAttribute("data-cursor", "");
      btn.setAttribute("aria-pressed", cat === wheel.filter ? "true" : "false");
      btn.textContent = cat + " ";
      var sup = document.createElement("sup");
      sup.textContent = String(count);
      btn.appendChild(sup);
      btn.addEventListener("click", function () {
        applyFilter(cat);
      });
      workFilters.appendChild(btn);
    });
  }

  function applyFilter(cat) {
    if (cat === wheel.filter || wheel.transitioning) return;
    wheel.filter = cat;
    wheel.transitioning = true;

    Array.prototype.forEach.call(workFilters.children, function (b) {
      var on = b.textContent.indexOf(cat + " ") === 0;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });

    var newItems =
      cat === "ALL"
        ? PROJECTS.slice()
        : PROJECTS.filter(function (p) { return p.category === cat; });

    /* current group drifts down + fades out, new group rises in from below */
    var oldRows = wheel.rows.slice();
    gsap.to(oldRows, {
      y: 46,
      opacity: 0,
      duration: RM ? 0.01 : 0.45,
      stagger: RM ? 0 : 0.018,
      ease: "power2.in",
      onComplete: function () {
        wheel.items = newItems;
        wheel.current = 0;
        wheel.target = 0;
        buildWheelList();
        gsap.fromTo(
          wheel.rows,
          { y: 46, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: RM ? 0.01 : 0.6,
            stagger: RM ? 0 : 0.03,
            ease: "power3.out",
            onComplete: function () {
              gsap.set(wheel.rows, { clearProps: "transform,opacity" });
              wheel.transitioning = false;
            }
          }
        );
      }
    });
  }

  /* ============================================================
     ARCHIVE TABLE
     ============================================================ */
  var archiveFloat = document.getElementById("archiveFloat");

  function buildArchive() {
    var table = document.getElementById("archiveTable");
    PROJECTS.forEach(function (p, i) {
      var row = document.createElement("div");
      row.className = "archive__row archive__row--item";
      row.setAttribute("data-num", String(p.num));
      row.setAttribute("data-cursor", "");
      row.setAttribute("tabindex", "0");
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", p.title + ", " + p.origin + ", " + p.year);

      var num = document.createElement("span");
      num.className = "archive__num";
      num.textContent = pad2(p.num);

      var name = document.createElement("span");
      name.className = "archive__name";
      name.textContent = p.title;

      var origin = document.createElement("span");
      origin.className = "archive__origin";
      origin.textContent = p.origin;

      var cat = document.createElement("span");
      cat.className = "archive__cat";
      cat.textContent = p.category + " — " + p.tags.join(", ");

      var year = document.createElement("span");
      year.className = "archive__year";
      year.textContent = String(p.year);

      row.appendChild(num);
      row.appendChild(name);
      row.appendChild(origin);
      row.appendChild(cat);
      row.appendChild(year);
      table.appendChild(row);

      /* hover preview */
      if (FINE && !RM) {
        row.addEventListener("mouseenter", function () {
          archiveFloat.src = p.img;
          gsap.to(archiveFloat, {
            autoAlpha: 1,
            rotation: (i % 2 === 0 ? 1 : -1) * 2.2,
            duration: 0.4,
            ease: "power2.out"
          });
        });
        row.addEventListener("mouseleave", function () {
          gsap.to(archiveFloat, { autoAlpha: 0, duration: 0.3, ease: "power2.out" });
        });
      }

      /* click → jump to this project in the wheel (same page on index.html,
         cross-page via ?p= when the archive lives on its own page) */
      function go() {
        if (!wheelExists()) {
          location.href = "index.html?p=" + p.num;
          return;
        }
        if (wheel.filter !== "ALL") applyFilter("ALL");
        var idx = wheel.items.indexOf(p);
        if (idx < 0) idx = p.num - 1;
        wheelGoTo(idx);
      }
      row.addEventListener("click", go);
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      });
    });

    /* floating image follows cursor */
    if (FINE && !RM) {
      var fx = gsap.quickTo(archiveFloat, "x", { duration: 0.5, ease: "power3.out" });
      var fy = gsap.quickTo(archiveFloat, "y", { duration: 0.5, ease: "power3.out" });
      window.addEventListener("mousemove", function (e) {
        fx(e.clientX + 28);
        fy(e.clientY - archiveFloat.offsetHeight / 2);
      });
      gsap.set(archiveFloat, { autoAlpha: 0 });
    }
  }

  /* ============================================================
     NAV + MOBILE MENU + ANCHORS
     ============================================================ */
  function initNav() {
    var btn = document.getElementById("menuBtn");
    var panel = document.getElementById("menuPanel");
    var label = btn ? btn.querySelector(".menu-btn__label") : null;
    var menuOpen = false;
    var closeMenu = null;

    if (btn && panel) {
      var links = panel.querySelectorAll(".menu-panel__link");
      var foot = panel.querySelector(".menu-panel__foot");

      gsap.set(panel, { scale: 0.4, opacity: 0, visibility: "hidden" });

      var openMenu = function () {
        menuOpen = true;
        document.body.classList.add("menu-open");
        btn.setAttribute("aria-expanded", "true");
        panel.setAttribute("aria-hidden", "false");
        if (label) label.textContent = "close";
        gsap.killTweensOf([panel, links, foot]);
        gsap.set(panel, { visibility: "visible" });
        /* spring pop from the button corner */
        gsap.fromTo(
          panel,
          { scale: 0.4, opacity: 0 },
          { scale: 1, opacity: 1, duration: RM ? 0.01 : 0.85, ease: RM ? "none" : "elastic.out(1, 0.62)" }
        );
        gsap.fromTo(
          links,
          { y: 28, opacity: 0 },
          { y: 0, opacity: 1, duration: RM ? 0.01 : 0.5, stagger: RM ? 0 : 0.06, delay: RM ? 0 : 0.12, ease: "power3.out" }
        );
        if (foot) {
          gsap.fromTo(foot, { opacity: 0 }, { opacity: 1, duration: RM ? 0.01 : 0.4, delay: RM ? 0 : 0.3 });
        }
        if (links[0]) links[0].focus();
      };

      closeMenu = function (refocus) {
        menuOpen = false;
        document.body.classList.remove("menu-open");
        btn.setAttribute("aria-expanded", "false");
        panel.setAttribute("aria-hidden", "true");
        if (label) label.textContent = "menu";
        gsap.killTweensOf([panel, links, foot]);
        gsap.to(panel, {
          scale: 0.5,
          opacity: 0,
          duration: RM ? 0.01 : 0.28,
          ease: "power3.in",
          onComplete: function () {
            gsap.set(panel, { visibility: "hidden" });
          }
        });
        if (refocus !== false) btn.focus();
      };

      btn.addEventListener("click", function () {
        if (menuOpen) closeMenu();
        else openMenu();
      });

      /* click outside the panel closes it */
      document.addEventListener("pointerdown", function (e) {
        if (menuOpen && !panel.contains(e.target) && !btn.contains(e.target)) {
          closeMenu(false);
        }
      });

      /* following any menu link closes the panel */
      panel.querySelectorAll("a").forEach(function (a) {
        a.addEventListener("click", function () {
          closeMenu(false);
        });
      });

      /* debug: open the menu for screenshots (?debug=1&menu=1) */
      if (DEBUG && PARAMS.get("menu") === "1") {
        window.addEventListener("load", function () {
          setTimeout(openMenu, 700);
        });
      }

      /* keyboard: Escape closes, Tab cycles inside the open menu */
      document.addEventListener("keydown", function (e) {
        if (!menuOpen) return;
        if (e.key === "Escape") {
          e.preventDefault();
          closeMenu();
          return;
        }
        if (e.key === "Tab") {
          var focusables = [btn].concat(
            Array.prototype.slice.call(panel.querySelectorAll("a"))
          );
          var idx = focusables.indexOf(document.activeElement);
          if (idx === -1) {
            e.preventDefault();
            focusables[0].focus();
            return;
          }
          var next = idx + (e.shiftKey ? -1 : 1);
          if (next < 0 || next >= focusables.length) {
            e.preventDefault();
            focusables[next < 0 ? focusables.length - 1 : 0].focus();
          }
        }
      });
    }

    /* smooth same-page anchors */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id === "#") {
          /* placeholder links (socials) — don't jump the page to the top */
          e.preventDefault();
          return;
        }
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (menuOpen && closeMenu) closeMenu(false);
        var y = target.getBoundingClientRect().top + window.scrollY;
        scrollToY(y, { duration: 1.4 });
      });
    });
  }

  /* ============================================================
     SCROLL REVEALS
     ============================================================ */
  function initReveals() {
    /* section head rules grow in */
    document.querySelectorAll(".section-head__rule").forEach(function (rule) {
      gsap.fromTo(
        rule,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: RM ? 0.01 : 1.1,
          ease: "power3.inOut",
          scrollTrigger: { trigger: rule, start: "top 88%" }
        }
      );
    });

    /* big split titles (page titles + contact) */
    document.querySelectorAll(".page-title[data-split], .contact__line[data-split]").forEach(function (el) {
      var chars = splitChars(el);
      gsap.fromTo(
        chars,
        { yPercent: 115 },
        {
          yPercent: 0,
          duration: RM ? 0.01 : 0.9,
          stagger: 0.028,
          ease: "power4.out",
          scrollTrigger: { trigger: el, start: "top 88%" }
        }
      );
    });

    /* archive rows cascade */
    var rows = document.querySelectorAll(".archive__row--item");
    gsap.set(rows, { opacity: 0, y: 28 });
    ScrollTrigger.batch(rows, {
      start: "top 92%",
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          duration: RM ? 0.01 : 0.7,
          stagger: 0.05,
          ease: "power3.out"
        });
      }
    });

    /* about statement word scrub */
    var statement = document.getElementById("aboutStatement");
    if (statement) {
      var words = splitWords(statement);
      gsap.to(words, {
        opacity: 1,
        stagger: RM ? 0 : 0.04,
        ease: "none",
        scrollTrigger: {
          trigger: statement,
          start: "top 78%",
          end: "bottom 45%",
          scrub: RM ? false : true
        }
      });
    }

    /* stat counters */
    document.querySelectorAll("[data-count]").forEach(function (el) {
      var end = parseInt(el.getAttribute("data-count"), 10) || 0;
      var suffix = el.getAttribute("data-suffix") || "";
      var pad = el.textContent.length;
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el,
        start: "top 88%",
        once: true,
        onEnter: function () {
          gsap.to(obj, {
            v: end,
            duration: RM ? 0.01 : 1.6,
            ease: "power2.out",
            onUpdate: function () {
              el.textContent = String(Math.round(obj.v)).padStart(pad, "0") + suffix;
            }
          });
        }
      });
    });

    /* about columns fade */
    if (document.querySelector(".about__grid")) {
      gsap.fromTo(
        ".about__col",
        { opacity: 0, y: 34 },
        {
          opacity: 1,
          y: 0,
          duration: RM ? 0.01 : 0.8,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: ".about__grid", start: "top 82%" }
        }
      );
    }

    /* contact bottom rows */
    if (document.querySelector(".contact__row")) {
      gsap.fromTo(
        ".contact__row, .contact__bottom",
        { opacity: 0 },
        {
          opacity: 1,
          duration: RM ? 0.01 : 0.9,
          ease: "power2.out",
          scrollTrigger: { trigger: ".contact__row", start: "top 94%" }
        }
      );
    }
  }

  /* ============================================================
     PRELOADER
     ============================================================ */
  function jumpToHash() {
    if (!location.hash) return;
    var target = null;
    try { target = document.querySelector(location.hash); } catch (err) {}
    if (!target) return;
    setTimeout(function () {
      scrollToY(target.getBoundingClientRect().top + window.scrollY, { immediate: true });
    }, 60);
  }

  /* land on a specific project after following an archive.html link
     (index.html?p=<num>) */
  function jumpToProject(num) {
    if (!wheelExists() || isNaN(num)) return;
    var idx = -1;
    for (var i = 0; i < wheel.items.length; i++) {
      if (wheel.items[i].num === num) { idx = i; break; }
    }
    if (idx < 0) return;
    wheel.current = idx;
    wheel.target = idx;
    renderWheel(true);
  }

  function initPreloader() {
    var pre = document.getElementById("preloader");

    /* pages without a preloader (about) get a simple fade-in */
    if (!pre) {
      startScroll();
      gsap.fromTo(
        "main",
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: RM ? 0.01 : 0.7, ease: "power3.out", clearProps: "all" }
      );
      ScrollTrigger.refresh();
      jumpToHash();
      return;
    }

    var count = document.getElementById("preCount");
    var name = document.getElementById("preName");
    var nameChars = splitChars(name);

    stopScroll();

    var obj = { v: 0 };
    var fast = DEBUG || RM;
    var tl = gsap.timeline({
      onComplete: function () {
        pre.style.display = "none";
        startScroll();
        ScrollTrigger.refresh();
        measureWheel();
        var pParam = PARAMS.get("p");
        if (pParam) {
          jumpToProject(parseInt(pParam, 10));
        } else {
          jumpToHash();
        }
      }
    });

    tl.fromTo(
      nameChars,
      { yPercent: 115 },
      { yPercent: 0, duration: fast ? 0.01 : 0.9, stagger: fast ? 0 : 0.05, ease: "power4.out" }
    )
      .to(
        obj,
        {
          v: 100,
          duration: fast ? 0.05 : 1.8,
          ease: "power2.inOut",
          onUpdate: function () {
            count.textContent = String(Math.round(obj.v)).padStart(3, "0");
          }
        },
        fast ? ">" : "-=0.4"
      )
      .to(pre, {
        yPercent: -100,
        duration: fast ? 0.05 : 0.9,
        ease: "power4.inOut",
        delay: fast ? 0 : 0.15
      });
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    var navCount = document.getElementById("navWorkCount");
    if (navCount) navCount.textContent = String(PROJECTS.length);

    /* the work wheel only exists on index.html */
    var hasWheel = wheelExists();

    if (hasWheel) {
      buildWheelImages();
      buildWheelList();
      buildFilters();
      initWheelInput();
    }
    if (document.getElementById("archiveTable")) buildArchive();
    buildMarquees();
    initNav();
    initReveals();

    if (hasWheel) {
      renderWheel(true);
      gsap.ticker.add(renderWheelTick);
    }

    /* keep measurements fresh */
    var resizeT = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () {
        if (hasWheel) measureWheel();
        ScrollTrigger.refresh();
      }, 200);
    });
    window.addEventListener("load", function () {
      ScrollTrigger.refresh();
      if (hasWheel) measureWheel();
    });

    initPreloader();

    /* debug: report animation state (?debug=1) */
    if (DEBUG) {
      window.addEventListener("load", function () {
        setTimeout(function () {
          var box = document.createElement("div");
          box.id = "__state__";
          box.style.cssText =
            "position:fixed;top:0;right:0;z-index:9999;background:#036;color:#fff;" +
            "font:10px monospace;padding:4px 8px;white-space:pre;";
          box.textContent = [
            "RM=" + RM,
            "lenis=" + !!lenis,
            "sy=" + Math.round(window.scrollY)
          ].join(" | ");
          document.body.appendChild(box);
        }, 2500);
      });
    }

    /* debug: shift viewport without scrolling (?debug=1&shift=index)
       headless screenshots don't repaint after programmatic scroll, so we
       translate the body instead and force all reveals to end state */
    if (DEBUG && PARAMS.get("shift")) {
      window.addEventListener("load", function () {
        setTimeout(function () {
          ScrollTrigger.getAll().forEach(function (st) { st.kill(); });
          gsap.set(".section-head__rule", { scaleX: 1 });
          gsap.set(".split-char", { yPercent: 0 });
          gsap.set(".archive__row--item", { opacity: 1, y: 0 });
          gsap.set(".about__statement .word", { opacity: 1 });
          gsap.set(".about__col", { opacity: 1, y: 0 });
          gsap.set(".contact__row, .contact__bottom", { opacity: 1 });
          var lock = PARAMS.get("wheellock");
          if (lock !== null && wheel.els.length) {
            var idx = Math.min(parseInt(lock, 10) || 0, wheel.items.length - 1);
            gsap.ticker.remove(renderWheelTick);
            wheel.current = wheel.target = idx;
            renderWheel(true);
          }
          var sec = PARAMS.get("shift");
          var el = document.getElementById(sec);
          var y = el ? el.getBoundingClientRect().top + window.scrollY : 0;
          if (PARAMS.get("off")) y += parseInt(PARAMS.get("off"), 10);
          document.body.style.transform = "translateY(" + -y + "px)";
        }, 900);
      });
    }

    /* debug: trigger a filter switch (?debug=1&filter=PRODUCT) */
    if (DEBUG && PARAMS.get("filter") && hasWheel) {
      window.addEventListener("load", function () {
        setTimeout(function () {
          applyFilter(PARAMS.get("filter"));
        }, 800);
      });
    }

    /* debug: jump to a scroll position or section (?debug=1&go=work) */
    if (DEBUG && PARAMS.get("go")) {
      window.addEventListener("load", function () {
        setTimeout(function () {
          var go = PARAMS.get("go");
          var y = /^\d+$/.test(go)
            ? parseInt(go, 10)
            : (document.getElementById(go)
                ? document.getElementById(go).getBoundingClientRect().top + window.scrollY
                : 0);
          if (PARAMS.get("off")) y += parseInt(PARAMS.get("off"), 10);
          scrollToY(y, { immediate: true });
          window.dispatchEvent(new Event("scroll"));
        }, 600);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
