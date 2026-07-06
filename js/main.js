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

  /* if the animation libs fail to load (offline, blocked CDN, file://),
     keep the content renderer alive with tiny no-op fallbacks. */
  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  var Lenis = window.Lenis;
  var HAS_GSAP = typeof gsap !== "undefined";
  var HAS_SCROLL_TRIGGER = typeof ScrollTrigger !== "undefined";

  function fallbackTargets(target) {
    if (!target) return [];
    if (typeof target === "string") return Array.prototype.slice.call(document.querySelectorAll(target));
    if (target.nodeType || target === window) return [target];
    if (typeof target.length === "number") return Array.prototype.slice.call(target);
    return [target];
  }

  function fallbackSet(target, vars) {
    fallbackTargets(target).forEach(function (el) {
      if (!el || !el.style || !vars) return;
      if (vars.opacity !== undefined) el.style.opacity = vars.opacity;
      if (vars.autoAlpha !== undefined) {
        el.style.opacity = vars.autoAlpha;
        el.style.visibility = vars.autoAlpha ? "visible" : "hidden";
      }
      if (vars.visibility !== undefined) el.style.visibility = vars.visibility;
      if (vars.y !== undefined || vars.yPercent !== undefined || vars.scale !== undefined) {
        el.style.transform = "none";
      }
      if (vars.clearProps) el.removeAttribute("style");
    });
  }

  if (!HAS_GSAP) {
    window.gsap = {
      globalTimeline: { timeScale: function () {} },
      registerPlugin: function () {},
      ticker: { add: function () {}, remove: function () {}, lagSmoothing: function () {} },
      utils: {
        toArray: function (target) { return fallbackTargets(target); }
      },
      quickTo: function (target, prop) {
        return function (value) {
          var el = fallbackTargets(target)[0];
          if (!el || !el.style) return;
          if (prop === "x" || prop === "y") el.style[prop === "x" ? "left" : "top"] = value + "px";
        };
      },
      killTweensOf: function () {},
      set: fallbackSet,
      to: function (target, vars) {
        fallbackSet(target, vars);
        if (vars && typeof vars.onUpdate === "function") vars.onUpdate();
        if (vars && typeof vars.onComplete === "function") setTimeout(vars.onComplete, 0);
        return this;
      },
      fromTo: function (target, fromVars, toVars) {
        fallbackSet(target, toVars);
        if (toVars && typeof toVars.onComplete === "function") setTimeout(toVars.onComplete, 0);
        return this;
      },
      timeline: function (vars) {
        var api = {
          fromTo: function () { return api; },
          to: function () { return api; }
        };
        if (vars && typeof vars.onComplete === "function") setTimeout(vars.onComplete, 0);
        return api;
      }
    };
    gsap = window.gsap;
  }

  if (!HAS_SCROLL_TRIGGER) {
    window.ScrollTrigger = {
      create: function (vars) {
        if (vars && typeof vars.onEnter === "function") setTimeout(vars.onEnter, 0);
        return { kill: function () {} };
      },
      batch: function (target, vars) {
        if (vars && typeof vars.onEnter === "function") setTimeout(function () {
          vars.onEnter(fallbackTargets(target));
        }, 0);
      },
      refresh: function () {},
      update: function () {},
      getAll: function () { return []; }
    };
    ScrollTrigger = window.ScrollTrigger;
  }

  /* animations play regardless of the OS reduced-motion signal (owner
     preference — Windows "animation effects off" would otherwise freeze
     the whole site). Use ?rm=1 to simulate the reduced experience. */
  var RM = PARAMS.get("rm") === "1";
  /* lets CSS join the simulation (noise, marquee, transitions) */
  if (RM) document.documentElement.classList.add("is-rm");
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
    hover: null,
    pointer: { x: 0, y: 0, inStage: false },
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

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function projectSlug(p) {
    return p.slug || slugify(p.origin || p.title);
  }

  function projectUrl(p) {
    return projectSlug(p) + ".html";
  }

  function findProjectBySlug(slug) {
    for (var i = 0; i < PROJECTS.length; i++) {
      if (projectSlug(PROJECTS[i]) === slug || String(PROJECTS[i].num) === slug) return PROJECTS[i];
    }
    return null;
  }

  function currentProjectSlug() {
    var host = document.getElementById("projectPage");
    var attr = host ? host.getAttribute("data-project-slug") : "";
    if (attr) return attr;
    if (window.PROJECT_PAGE_SLUG) return window.PROJECT_PAGE_SLUG;
    if (PARAMS.get("p")) return PARAMS.get("p");
    var file = location.pathname.split("/").pop().replace(/\.html$/i, "");
    if (file && ["index", "archive", "about", "project"].indexOf(file) < 0) return file;
    return PROJECTS[0] ? projectSlug(PROJECTS[0]) : "";
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
    wheel.hover = null;
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

      btn.addEventListener("pointerdown", function () {
        btn.setAttribute("data-pointer-focus", "true");
      });
      btn.addEventListener("click", function () {
        btn.removeAttribute("data-pointer-focus");
        location.href = projectUrl(p);
      });
      /* keyboard focus: keep the overflow:hidden stage from scrolling itself
         out of alignment, and bring the focused project to the center */
      btn.addEventListener("focus", function () {
        if (btn.getAttribute("data-pointer-focus") === "true") {
          btn.removeAttribute("data-pointer-focus");
          return;
        }
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
    if (FINE) {
      workWrap.addEventListener("pointermove", function (e) {
        wheel.pointer.x = e.clientX;
        wheel.pointer.y = e.clientY;
        wheel.pointer.inStage = true;
      });
      workWrap.addEventListener("pointerleave", function () {
        wheel.pointer.inStage = false;
        wheel.hover = null;
        renderWheel(true);
      });
      window.addEventListener("blur", function () {
        wheel.pointer.inStage = false;
        wheel.hover = null;
      });
    }

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

  function updateWheelHoverFromPointer() {
    if (!FINE || !wheel.pointer.inStage || wheel.transitioning) {
      wheel.hover = null;
      return null;
    }

    var best = null;
    var bestDist = Infinity;
    var rowReach = Math.max(wheel.itemH * 0.65, 30);

    var hit = null;
    for (var i = 0; i < wheel.rows.length; i++) {
      var row = wheel.rows[i];
      var item = wheel.els[i];
      if (!row || !item || item.style.visibility === "hidden") continue;

      var name = row.querySelector(".work__row-name");
      if (!name) continue;

      var colRect = name.getBoundingClientRect();
      var rowRect = item.getBoundingClientRect();
      if (
        wheel.pointer.x < colRect.left ||
        wheel.pointer.x > colRect.right ||
        wheel.pointer.y < rowRect.top - rowReach ||
        wheel.pointer.y > rowRect.bottom + rowReach
      ) {
        continue;
      }

      var rowCenter = (rowRect.top + rowRect.bottom) / 2;
      var dist = Math.abs(wheel.pointer.y - rowCenter);
      if (
        wheel.pointer.y >= rowRect.top - 4 &&
        wheel.pointer.y <= rowRect.bottom + 4
      ) {
        hit = i;
        break;
      }

      if (dist < bestDist) {
        best = i;
        bestDist = dist;
      }
    }

    if (hit === null && bestDist <= rowReach) hit = best;
    wheel.hover = hit;
    return hit;
  }

  function setActive(idx) {
    if (idx === wheel.active) return;
    wheel.active = idx;
    var p = wheel.items[idx];
    if (!p) return;

    wheel.els.forEach(function (el, i) {
      el.classList.toggle("is-active", i === idx);
      el.classList.toggle("is-preview", i === idx);
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
    }

    var activeIdx = wheel.loop
      ? ((Math.round(wheel.current) % n) + n) % n
      : Math.min(Math.max(Math.round(wheel.current), 0), n - 1);
    var hoverIdx = updateWheelHoverFromPointer();
    var previewIdx = hoverIdx !== null ? hoverIdx : activeIdx;
    setActive(previewIdx);

    for (var j = 0; j < n; j++) {
      var d2;
      if (wheel.loop) {
        d2 = (((j - wheel.current) % n) + n) % n;
        if (d2 > n / 2) d2 -= n;
      } else {
        d2 = j - wheel.current;
      }
      var ad2 = Math.abs(d2);
      var el2 = wheel.els[j];
      if (!el2 || el2.style.visibility === "hidden") continue;
      el2.classList.toggle("is-hovered", hoverIdx === j);
      /* far rows sit uniformly dim; rows brighten as they pass the center */
      var mix2 = Math.max(0, 1 - ad2);
      var opacity2 = 0.26 + 0.74 * mix2;
      if (hoverIdx !== null && hoverIdx !== j) opacity2 = Math.min(opacity2, 0.42);
      if (previewIdx === j) opacity2 = 1;
      el2.style.opacity = opacity2.toFixed(3);
    }
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
     PROJECT DETAIL PAGE
     ============================================================ */
  function makeEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function appendMeta(parent, label, value) {
    var item = makeEl("div", "project-meta__item");
    item.appendChild(makeEl("span", "project-meta__label mono", label));
    item.appendChild(makeEl("span", "project-meta__value", value || "TBC"));
    parent.appendChild(item);
  }

  function makeProjectImage(p, className, alt, position) {
    var img = document.createElement("img");
    img.className = className || "";
    img.src = p.img;
    img.alt = alt || "";
    img.loading = "lazy";
    img.decoding = "async";
    if (position) img.style.objectPosition = position;
    return img;
  }

  function projectLead(p) {
    var sub = p.subCategory || p.tags.join(", ");
    return p.title + " is a " + p.category.toLowerCase() + " project for " + p.origin +
      ", shaped around " + sub.toLowerCase() + ". The page structure frames the work as a compact case study: context first, then image-led evidence, then a focused breakdown of the design decisions behind the final direction.";
  }

  function projectNotes(p) {
    return [
      {
        title: "Context",
        body: "The project starts from the visual and strategic world of " + p.origin +
          ". Its role is to make the core idea immediately readable while keeping enough detail for the audience to understand the system, mood, and intended use."
      },
      {
        title: "Design Response",
        body: "The direction uses " + (p.subCategory || p.tags.join(", ")).toLowerCase() +
          " as the main language. Scale, rhythm, and image sequencing are used to keep the work editorial, direct, and easy to scan across the page."
      },
      {
        title: "Case Study Breakdown",
        body: "Each following section is built as a reusable case-study block: one image-led moment, one explanation panel, and one closing image field. The same framework can hold deeper process notes once final project writing is ready."
      }
    ];
  }

  function buildTextBlock(title, body, className) {
    var section = makeEl("section", className || "project-copy project-reveal");
    var h = makeEl("h2", "project-copy__title", title);
    var p = makeEl("p", "project-copy__body", body);
    section.appendChild(h);
    section.appendChild(p);
    return section;
  }

  function buildProjectDetail() {
    var page = document.getElementById("projectPage");
    if (!page) return;

    var p = findProjectBySlug(currentProjectSlug());
    if (!p) p = PROJECTS[0];
    if (!p) return;

    var idx = PROJECTS.indexOf(p);
    var next = PROJECTS[(idx + 1) % PROJECTS.length];

    document.body.classList.add("project-page");

    if (PARAMS.get("p") && history.replaceState) {
      history.replaceState(null, "", projectUrl(p));
    }

    document.title = p.title + " - " + p.origin + " - Thanh Lam";
    var metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) metaDescription.setAttribute("content", projectLead(p));
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", p.title + " - " + p.origin);
    var ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute("content", p.img);

    page.setAttribute("data-project-slug", projectSlug(p));
    page.innerHTML = "";

    var intro = makeEl("section", "project-intro");
    var eyebrow = makeEl("div", "project-eyebrow mono");
    var back = makeEl("a", "project-back", "BACK TO PORTFOLIO");
    back.href = "index.html";
    back.setAttribute("data-cursor", "");
    eyebrow.appendChild(back);
    intro.appendChild(eyebrow);

    var meta = makeEl("div", "project-meta");
    appendMeta(meta, "PROJECT NAME", p.title);
    appendMeta(meta, "ORIGIN", p.origin);
    appendMeta(meta, "DATE", p.date || String(p.year));
    appendMeta(meta, "SUB CATEGORY", p.subCategory || p.tags.join(", "));
    intro.appendChild(meta);

    var titleRow = makeEl("div", "project-title-row");
    titleRow.appendChild(makeEl("span", "project-number mono", "BN " + pad2(p.num)));
    titleRow.appendChild(makeEl("h1", "project-title", p.title));
    intro.appendChild(titleRow);
    page.appendChild(intro);

    var hero = makeEl("figure", "project-hero project-reveal");
    hero.appendChild(makeProjectImage(p, "project-hero__img", p.title + " hero image", "center center"));
    page.appendChild(hero);

    page.appendChild(buildTextBlock("Overview", projectLead(p), "project-copy project-copy--center project-reveal"));

    var fullOne = makeEl("figure", "project-media project-reveal");
    fullOne.appendChild(makeProjectImage(p, "project-media__img", p.title + " project image", "center center"));
    page.appendChild(fullOne);

    var notes = projectNotes(p);
    var splitOne = makeEl("section", "project-split project-reveal");
    var splitImg = makeEl("figure", "project-split__media");
    splitImg.appendChild(makeProjectImage(p, "project-split__img", p.title + " detail image", "30% center"));
    splitOne.appendChild(splitImg);
    splitOne.appendChild(buildTextBlock(notes[0].title, notes[0].body, "project-panel"));
    page.appendChild(splitOne);

    var splitTwo = makeEl("section", "project-split project-split--reverse project-reveal");
    splitTwo.appendChild(buildTextBlock(notes[1].title, notes[1].body, "project-panel"));
    var splitImgTwo = makeEl("figure", "project-split__media");
    splitImgTwo.appendChild(makeProjectImage(p, "project-split__img", p.title + " process image", "70% center"));
    splitTwo.appendChild(splitImgTwo);
    page.appendChild(splitTwo);

    var duo = makeEl("section", "project-duo project-reveal");
    var d1 = makeEl("figure", "project-duo__item");
    d1.appendChild(makeProjectImage(p, "project-duo__img", p.title + " image variation one", "left center"));
    var d2 = makeEl("figure", "project-duo__item");
    d2.appendChild(makeProjectImage(p, "project-duo__img", p.title + " image variation two", "right center"));
    duo.appendChild(d1);
    duo.appendChild(d2);
    page.appendChild(duo);

    page.appendChild(buildTextBlock(notes[2].title, notes[2].body, "project-copy project-copy--center project-reveal"));

    var outro = makeEl("nav", "project-next project-reveal");
    var nextLink = makeEl("a", "project-next__link", "");
    nextLink.href = projectUrl(next);
    nextLink.setAttribute("data-cursor", "");
    nextLink.appendChild(makeEl("span", "project-next__label mono", "NEXT PROJECT"));
    nextLink.appendChild(makeEl("span", "project-next__title", next.title));
    nextLink.appendChild(makeEl("span", "project-next__meta mono", next.origin + " / " + (next.date || next.year)));
    outro.appendChild(nextLink);
    page.appendChild(outro);
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
        location.href = projectUrl(p);
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

    if (document.querySelector(".project-detail")) {
      /* ---- intro: masked title chars + staggered meta (about-style) ---- */
      var pTitle = document.querySelector(".project-title");
      if (pTitle) {
        var pChars = splitChars(pTitle);
        gsap.fromTo(
          pChars,
          { yPercent: 130 },
          {
            yPercent: 0,
            duration: RM ? 0.01 : 1,
            stagger: RM ? 0 : 0.024,
            ease: "power4.out",
            delay: RM ? 0 : 0.12
          }
        );
      }

      gsap.fromTo(
        ".project-eyebrow, .project-meta__item, .project-number",
        { opacity: 0, y: 34 },
        {
          opacity: 1,
          y: 0,
          duration: RM ? 0.01 : 0.9,
          stagger: RM ? 0 : 0.06,
          ease: "power3.out",
          delay: RM ? 0 : 0.15
        }
      );

      /* ---- copy blocks: title then body rise in ---- */
      gsap.utils.toArray(".project-copy, .project-panel").forEach(function (sec) {
        var bits = sec.querySelectorAll(".project-copy__title, .project-copy__body");
        if (!bits.length) return;
        gsap.fromTo(
          bits,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: RM ? 0.01 : 0.9,
            stagger: RM ? 0 : 0.12,
            ease: "power3.out",
            scrollTrigger: { trigger: sec, start: "top 80%", once: true }
          }
        );
      });

      /* ---- images: clip-wipe entry + parallax drift inside the frame ---- */
      function wipeIn(fig, fromClip, delay) {
        gsap.fromTo(
          fig,
          { clipPath: fromClip, webkitClipPath: fromClip },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            webkitClipPath: "inset(0% 0% 0% 0%)",
            duration: RM ? 0.01 : 1.15,
            ease: "power4.inOut",
            delay: RM ? 0 : delay || 0,
            scrollTrigger: { trigger: fig, start: "top 88%", once: true }
          }
        );
      }
      function drift(fig) {
        var img = fig.querySelector("img");
        if (!img) return;
        /* extra scale gives the drift headroom so edges never show */
        gsap.set(img, { scale: 1.14 });
        gsap.fromTo(
          img,
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: "none",
            scrollTrigger: {
              trigger: fig,
              start: "top bottom",
              end: "bottom top",
              scrub: RM ? false : true
            }
          }
        );
      }

      gsap.utils.toArray(".project-hero, .project-media, .project-duo__item").forEach(function (fig, i) {
        var delay = 0;
        if (i === 0) delay = 0.25; /* hero settles just after the title */
        else if (fig.matches(".project-duo__item:nth-child(2)")) delay = 0.15;
        wipeIn(fig, "inset(100% 0% 0% 0%)", delay);
        drift(fig);
      });

      /* split sections wipe from the text side for direction contrast */
      gsap.utils.toArray(".project-split").forEach(function (sec) {
        var media = sec.querySelector(".project-split__media");
        if (!media) return;
        var fromSide = sec.classList.contains("project-split--reverse")
          ? "inset(0% 0% 0% 100%)"
          : "inset(0% 100% 0% 0%)";
        wipeIn(media, fromSide, 0);
        drift(media);
      });

      /* ---- next-project bar: masked title on approach ---- */
      var nextTitle = document.querySelector(".project-next__title");
      if (nextTitle) {
        var nChars = splitChars(nextTitle);
        gsap.set(nChars, { yPercent: 130 });
        ScrollTrigger.create({
          trigger: ".project-next",
          start: "top 85%",
          once: true,
          onEnter: function () {
            gsap.to(nChars, {
              yPercent: 0,
              duration: RM ? 0.01 : 0.9,
              stagger: RM ? 0 : 0.03,
              ease: "power4.out"
            });
          }
        });
      }
      gsap.fromTo(
        ".project-next__label, .project-next__meta",
        { opacity: 0 },
        {
          opacity: 1,
          duration: RM ? 0.01 : 0.8,
          ease: "power2.out",
          delay: RM ? 0 : 0.25,
          scrollTrigger: { trigger: ".project-next", start: "top 85%", once: true }
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
    startScroll();
    /* opacity-only: a transformed <main> ancestor would break ScrollTrigger
       pinning (services wall-fall on about.html) */
    gsap.fromTo(
      "main",
      { opacity: 0 },
      { opacity: 1, duration: RM ? 0.01 : 0.7, ease: "power3.out", clearProps: "all" }
    );
    ScrollTrigger.refresh();
    if (wheelExists()) measureWheel();

    var pParam = PARAMS.get("p");
    if (pParam) {
      jumpToProject(parseInt(pParam, 10));
    } else {
      jumpToHash();
    }
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
    buildProjectDetail();
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
