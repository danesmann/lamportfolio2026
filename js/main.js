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
    el.textContent = "";
    var chars = [];
    for (var i = 0; i < text.length; i++) {
      var mask = document.createElement("span");
      mask.className = "split-mask";
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
    window.addEventListener("mousemove", function (e) {
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
      gsap.to(track, { xPercent: -50, ease: "none", duration: speed, repeat: -1 });
    });
  }

  /* ============================================================
     WORK WHEEL — scroll-driven infinite-feeling project list
     ============================================================ */
  var wheel = {
    items: PROJECTS.slice(),
    els: [],
    imgs: {},
    activeImg: null,
    current: 0,
    target: 0,
    active: -1,
    wrapTop: 0,
    travel: 1,
    itemH: 80,
    filter: "ALL",
    STEP: 160,
    DWELL: 260
  };

  var workWrap = document.getElementById("workWrap");
  var workList = document.getElementById("workList");
  var workBg = document.getElementById("workBg");
  var workFilters = document.getElementById("workFilters");
  var metaIndex = document.getElementById("metaIndex");
  var metaOrigin = document.getElementById("metaOrigin");
  var metaTags = document.getElementById("metaTags");
  var metaYear = document.getElementById("metaYear");
  var progCurrent = document.getElementById("progCurrent");
  var progTotal = document.getElementById("progTotal");
  var progFill = document.getElementById("progFill");

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  function buildWheelImages() {
    PROJECTS.forEach(function (p) {
      var img = document.createElement("img");
      img.src = p.img;
      img.alt = "";
      img.decoding = "async";
      workBg.appendChild(img);
      wheel.imgs[p.num] = img;
    });
  }

  function buildWheelList() {
    workList.innerHTML = "";
    wheel.els = [];
    wheel.items.forEach(function (p, i) {
      var li = document.createElement("li");
      li.className = "work__item";
      var btn = document.createElement("button");
      btn.className = "work__item-btn";
      btn.type = "button";
      btn.textContent = p.title;
      btn.setAttribute("data-cursor", "");
      btn.addEventListener("click", function () {
        wheelScrollToIndex(i);
      });
      li.appendChild(btn);
      workList.appendChild(li);
      wheel.els.push(li);
    });
    wheel.active = -1;
    renderWheel(true);
  }

  function setWrapHeight() {
    var n = Math.max(wheel.items.length, 1);
    var travel = (n - 1) * wheel.STEP + wheel.DWELL;
    workWrap.style.height = "calc(100vh + " + travel + "px)";
  }

  function measureWheel() {
    var rect = workWrap.getBoundingClientRect();
    wheel.wrapTop = rect.top + window.scrollY;
    wheel.travel = Math.max(workWrap.offsetHeight - window.innerHeight, 1);
    var first = wheel.els[0];
    if (first) wheel.itemH = first.offsetHeight || 80;
  }

  function wheelScrollToIndex(i) {
    var n = wheel.items.length;
    var p = n > 1 ? i / (n - 1) : 0;
    scrollToY(wheel.wrapTop + p * wheel.travel, { duration: 1.1 });
  }

  function setMetaValue(el, text) {
    el.textContent = "";
    var s = document.createElement("span");
    s.style.display = "inline-block";
    s.textContent = text;
    el.appendChild(s);
    if (!RM) {
      gsap.fromTo(s, { yPercent: 130 }, { yPercent: 0, duration: 0.5, ease: "power3.out" });
    }
  }

  function setActive(idx) {
    if (idx === wheel.active) return;
    wheel.active = idx;
    var p = wheel.items[idx];
    if (!p) return;

    wheel.els.forEach(function (el, i) {
      el.classList.toggle("is-active", i === idx);
    });

    /* crossfade background image */
    var img = wheel.imgs[p.num];
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

    /* meta panel */
    setMetaValue(metaIndex, pad2(idx + 1) + " / " + pad2(wheel.items.length));
    setMetaValue(metaOrigin, p.origin);
    setMetaValue(metaTags, p.tags.join(" · "));
    setMetaValue(metaYear, String(p.year));
    progCurrent.textContent = pad2(idx + 1);
    progTotal.textContent = pad2(wheel.items.length);
  }

  function renderWheel(force) {
    var n = wheel.items.length;
    if (!n) return;

    var sy = window.scrollY;
    var pRaw = (sy - wheel.wrapTop) / wheel.travel;
    var p = Math.min(Math.max(pRaw, 0), 1);
    wheel.target = p * (n - 1);

    var ease = RM ? 1 : 0.09;
    wheel.current += (wheel.target - wheel.current) * ease;
    if (Math.abs(wheel.target - wheel.current) < 0.001) wheel.current = wheel.target;

    for (var i = 0; i < n; i++) {
      var d = i - wheel.current;
      var ad = Math.abs(d);
      var el = wheel.els[i];
      if (!el) continue;
      if (ad > 4.6 && !force) {
        el.style.opacity = "0";
        el.style.visibility = "hidden";
        continue;
      }
      el.style.visibility = "visible";
      el.style.transform =
        "translate3d(0," + (d * wheel.itemH).toFixed(2) + "px,0) scale(" +
        Math.max(1 - ad * 0.055, 0.7).toFixed(3) + ")";
      el.style.opacity = String(Math.max(1 - ad * 0.26, 0.08).toFixed(3));
    }

    if (progFill) progFill.style.transform = "scaleY(" + p.toFixed(4) + ")";
    setActive(Math.min(Math.max(Math.round(wheel.current), 0), n - 1));
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
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", cat === wheel.filter ? "true" : "false");
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
    if (cat === wheel.filter) return;
    wheel.filter = cat;

    Array.prototype.forEach.call(workFilters.children, function (b) {
      var on = b.textContent.indexOf(cat) === 0;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });

    wheel.items =
      cat === "ALL"
        ? PROJECTS.slice()
        : PROJECTS.filter(function (p) { return p.category === cat; });

    /* rebuild + re-measure */
    buildWheelList();
    setWrapHeight();
    measureWheel();
    ScrollTrigger.refresh();
    measureWheel();

    /* snap back to the start of the wheel & reset state */
    wheel.current = 0;
    wheel.target = 0;
    scrollToY(wheel.wrapTop, { duration: 0.7 });

    if (!RM) {
      gsap.fromTo(workList, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" });
    }
    renderWheel(true);
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

      /* click → jump to this project in the wheel */
      function go() {
        if (wheel.filter !== "ALL") applyFilter("ALL");
        var idx = wheel.items.indexOf(p);
        if (idx < 0) idx = p.num - 1;
        measureWheel();
        var n = wheel.items.length;
        var prog = n > 1 ? idx / (n - 1) : 0;
        scrollToY(wheel.wrapTop + prog * wheel.travel, { duration: 1.4 });
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
    var nav = document.getElementById("nav");
    var burger = document.getElementById("burger");
    var menu = document.getElementById("menu");
    var menuOpen = false;
    var lastY = 0;

    /* hide on scroll down, show on scroll up */
    if (!RM) {
      window.addEventListener(
        "scroll",
        function () {
          var y = window.scrollY;
          if (menuOpen) return;
          if (y > 200 && y > lastY + 4) {
            gsap.to(nav, { yPercent: -110, duration: 0.45, ease: "power3.out", overwrite: true });
          } else if (y < lastY - 4 || y <= 200) {
            gsap.to(nav, { yPercent: 0, duration: 0.45, ease: "power3.out", overwrite: true });
          }
          lastY = y;
        },
        { passive: true }
      );
    }

    var menuTl = gsap.timeline({ paused: true });
    menuTl
      .set(menu, { visibility: "visible" })
      .fromTo(
        menu,
        { clipPath: "inset(0 0 100% 0)" },
        { clipPath: "inset(0 0 0% 0)", duration: RM ? 0.01 : 0.65, ease: "power4.inOut" }
      )
      .fromTo(
        menu.querySelectorAll(".menu__link"),
        { yPercent: 60, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: RM ? 0.01 : 0.5, stagger: RM ? 0 : 0.07, ease: "power3.out" },
        RM ? ">" : "-=0.25"
      );

    function toggleMenu(open) {
      menuOpen = open;
      document.body.classList.toggle("menu-open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      menu.setAttribute("aria-hidden", open ? "false" : "true");
      if (open) {
        stopScroll();
        menuTl.timeScale(1).play();
      } else {
        startScroll();
        menuTl.timeScale(1.6).reverse();
      }
    }

    burger.addEventListener("click", function () {
      toggleMenu(!menuOpen);
    });

    /* smooth anchors */
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("href");
        if (id === "#") return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        if (menuOpen) toggleMenu(false);
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

    /* big split titles (archive + contact) */
    document.querySelectorAll(".archive__title[data-split], .contact__line[data-split]").forEach(function (el) {
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

    /* contact bottom rows */
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

  /* ============================================================
     HERO INTRO + PRELOADER
     ============================================================ */
  var heroChars = [];

  function prepareHero() {
    document.querySelectorAll(".hero__line[data-split]").forEach(function (el) {
      heroChars.push(splitChars(el));
    });
    gsap.set(".hero__line .split-char", { yPercent: 115 });
    gsap.set(".hero__meta-item, .hero__desc, .hero__scroll", { opacity: 0, y: 16 });
    gsap.set(".hero__marquee", { opacity: 0 });
  }

  function heroIntro() {
    var tl = gsap.timeline();
    window.__heroTl = tl;
    tl.to(".hero__line .split-char", {
      yPercent: 0,
      duration: RM ? 0.01 : 1.1,
      stagger: RM ? 0 : 0.045,
      ease: "power4.out"
    })
      .to(
        ".hero__meta-item",
        { opacity: 1, y: 0, duration: RM ? 0.01 : 0.6, stagger: RM ? 0 : 0.08, ease: "power3.out" },
        RM ? ">" : "-=0.7"
      )
      .to(
        ".hero__desc, .hero__scroll",
        { opacity: 1, y: 0, duration: RM ? 0.01 : 0.7, stagger: RM ? 0 : 0.1, ease: "power3.out" },
        RM ? ">" : "-=0.5"
      )
      .to(".hero__marquee", { opacity: 1, duration: RM ? 0.01 : 0.8 }, RM ? ">" : "-=0.4");

    if (!RM) {
      gsap.to(".hero__scroll-arrow", {
        y: 6,
        duration: 0.7,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut"
      });
    }
    return tl;
  }

  function initPreloader() {
    var pre = document.getElementById("preloader");
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
      })
      .add(heroIntro(), fast ? ">" : "-=0.45");
  }

  /* ============================================================
     INIT
     ============================================================ */
  function init() {
    buildWheelImages();
    buildWheelList();
    buildFilters();
    setWrapHeight();
    buildArchive();
    buildMarquees();
    prepareHero();
    initNav();
    initReveals();

    measureWheel();
    setActive(0);
    renderWheel(true);

    /* wheel render loop */
    gsap.ticker.add(renderWheelTick);

    /* keep measurements fresh */
    var resizeT = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () {
        setWrapHeight();
        measureWheel();
        ScrollTrigger.refresh();
        measureWheel();
      }, 200);
    });
    window.addEventListener("load", function () {
      ScrollTrigger.refresh();
      measureWheel();
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
          var h = window.__heroTl;
          var c1 = h && h.getChildren(false)[0];
          var l2 = document.querySelector(".hero__line--right");
          var l2cs = l2 ? getComputedStyle(l2) : null;
          var l2r = l2 ? l2.getBoundingClientRect() : null;
          box.textContent = [
            "RM=" + RM,
            "lenis=" + !!lenis,
            "heroTl=" + (h ? h.progress().toFixed(2) + "/" + h.totalDuration().toFixed(2) : "none"),
            "c1=" + (c1 ? c1.progress().toFixed(2) + " t:" + c1.targets().length : "none"),
            "sy=" + Math.round(window.scrollY),
            l2cs ? "l2 disp=" + l2cs.display + " ta=" + l2cs.textAlign + " fs=" + l2cs.fontSize + " w=" + Math.round(l2r.width) + " x=" + Math.round(l2r.left) + " r=" + Math.round(l2r.right) + " vw=" + window.innerWidth : ""
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
          if (lock !== null) {
            var idx = Math.min(parseInt(lock, 10) || 0, wheel.items.length - 1);
            wheel.current = wheel.target = idx;
            gsap.ticker.remove(renderWheelTick);
            for (var k = 0; k < wheel.els.length; k++) wheel.els[k].style.visibility = "visible";
            var save = wheel.wrapTop;
            wheel.wrapTop = window.scrollY - idx / Math.max(wheel.items.length - 1, 1) * wheel.travel;
            renderWheel(true);
            wheel.wrapTop = save;
          }
          var sec = PARAMS.get("shift");
          var el = document.getElementById(sec);
          var y = el ? el.getBoundingClientRect().top + window.scrollY : 0;
          if (PARAMS.get("off")) y += parseInt(PARAMS.get("off"), 10);
          document.body.style.transform = "translateY(" + -y + "px)";
        }, 900);
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
