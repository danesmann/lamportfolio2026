/* ============================================================
   THANH LAM — ABOUT / SERVICES PAGE
   Hero reveals + mouse parallax + scroll-out
   Wall-fall pinned service cards (desktop)
   Runs after main.js (gsap / ScrollTrigger / Lenis already set up)
   ============================================================ */

(function () {
  "use strict";

  var hero = document.querySelector(".svc-hero");
  if (!hero) return; /* only on about.html */

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  /* require the real libs, not main.js's no-op CDN-failure stubs — with a
     stub ScrollTrigger the scrub tweens would play immediately and hide
     everything (scrollTrigger would be treated as an unknown property) */
  var HAS_GSAP =
    typeof window.gsap !== "undefined" && !!window.gsap.core &&
    typeof window.ScrollTrigger !== "undefined" && !!window.ScrollTrigger.version;

  var PARAMS = new URLSearchParams(window.location.search);
  /* animations play regardless of the OS reduced-motion signal (owner
     preference, same policy as main.js). Use ?rm=1 to simulate reduced. */
  var RM = PARAMS.get("rm") === "1";
  var FINE = window.matchMedia("(pointer: fine)").matches;

  /* without real GSAP everything stays visible in its natural position —
     no hidden states are ever applied, so just bail out */
  if (!HAS_GSAP || RM) return;

  /* ============================================================
     HERO — masked title words + description lines + floats
     ============================================================ */
  var words = hero.querySelectorAll(".svc-word__visible");
  var wordScrolls = hero.querySelectorAll(".svc-word__scroll");
  var floats = hero.querySelectorAll(".svc-float");
  var floatImgs = hero.querySelectorAll(".svc-float img");
  var desc = document.getElementById("svcDesc");
  var descText = desc ? desc.textContent.replace(/\s+/g, " ").trim() : "";
  var revealed = false;

  /* --- split the description into measured lines, each in a mask --- */
  function measureLines(el, text) {
    var probe = document.createElement("span");
    probe.style.cssText = "visibility:hidden;position:absolute;white-space:nowrap;";
    var cs = getComputedStyle(el);
    probe.style.font = cs.font;
    probe.style.letterSpacing = cs.letterSpacing;
    probe.style.textTransform = cs.textTransform;
    el.appendChild(probe);

    var max = el.getBoundingClientRect().width;
    var lines = [];
    var line = "";
    text.split(" ").forEach(function (word) {
      var attempt = line ? line + " " + word : word;
      probe.textContent = attempt;
      if (probe.getBoundingClientRect().width > max && line) {
        lines.push(line);
        line = word;
      } else {
        line = attempt;
      }
    });
    if (line) lines.push(line);
    el.removeChild(probe);
    return lines;
  }

  function buildDescLines() {
    if (!desc) return;
    var lines = measureLines(desc, descText);
    desc.textContent = "";
    lines.forEach(function (lineText) {
      var mask = document.createElement("span");
      mask.className = "svc-desc__mask";
      var scroll = document.createElement("span");
      scroll.className = "svc-desc__scroll";
      var visible = document.createElement("span");
      visible.className = "svc-desc__visible";
      visible.textContent = lineText;
      scroll.appendChild(visible);
      mask.appendChild(scroll);
      desc.appendChild(mask);
    });
    gsap.set(desc.querySelectorAll(".svc-desc__visible"), { yPercent: revealed ? 0 : 110 });
    buildDescScrub();
  }

  /* --- scroll-out scrub for desc lines (rebuilt after each split) --- */
  var descScrub = null;
  function buildDescScrub() {
    if (!desc) return;
    if (descScrub) {
      descScrub.scrollTrigger && descScrub.scrollTrigger.kill();
      descScrub.kill();
    }
    descScrub = gsap.to(desc.querySelectorAll(".svc-desc__scroll"), {
      yPercent: -100,
      ease: "none",
      stagger: 0.03,
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "60% top",
        scrub: true
      }
    });
  }

  /* --- deterministic shuffle (stable across loads, no flicker) --- */
  function shuffledIndices(n, mult, add) {
    var order = [];
    for (var i = 0; i < n; i++) order.push(i);
    for (var j = n - 1; j > 0; j--) {
      var k = (j * mult + add) % (j + 1);
      var tmp = order[j];
      order[j] = order[k];
      order[k] = tmp;
    }
    return order;
  }

  /* --- initial hidden states --- */
  gsap.set(words, { yPercent: 100 });
  gsap.set(floats, { scale: 0 });

  if (desc) {
    buildDescLines();

    /* re-split when the container width changes or fonts finish loading */
    var lastW = desc.clientWidth;
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        var w = desc.clientWidth;
        if (w !== lastW) {
          lastW = w;
          buildDescLines();
        }
      }).observe(desc);
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { buildDescLines(); });
    }
  }

  /* --- load-in reveal --- */
  function reveal() {
    if (revealed) return;
    revealed = true;

    gsap.to(words, {
      yPercent: 0,
      duration: 1.2,
      ease: "power3.out",
      stagger: 0.06
    });

    if (desc) {
      gsap.to(desc.querySelectorAll(".svc-desc__visible"), {
        yPercent: 0,
        duration: 1,
        ease: "power3.out",
        stagger: 0.08,
        delay: 0.9
      });
    }

    shuffledIndices(floats.length, 7, 3).forEach(function (idx, i) {
      gsap.to(floats[idx], {
        scale: 1,
        duration: 1,
        ease: "power2.out",
        delay: 0.3 + i * 0.1
      });
    });
  }

  /* --- mouse parallax on the floats (desktop pointers only) --- */
  if (FINE && floats.length) {
    var movers = Array.prototype.map.call(floats, function (el) {
      return {
        x: gsap.quickTo(el, "x", { duration: 1.1, ease: "power3.out" }),
        y: gsap.quickTo(el, "y", { duration: 1.1, ease: "power3.out" }),
        factor: parseFloat(el.getAttribute("data-factor") || "0.5")
      };
    });
    var STRENGTH = 30;
    window.addEventListener("mousemove", function (e) {
      var nx = (e.clientX / window.innerWidth - 0.5) * 2;
      var ny = (e.clientY / window.innerHeight - 0.5) * 2;
      movers.forEach(function (m) {
        m.x(nx * m.factor * STRENGTH);
        m.y(ny * m.factor * STRENGTH);
      });
    });
  }

  /* --- scroll-out: title words slide up, floats shrink away --- */
  gsap.to(wordScrolls, {
    yPercent: -100,
    ease: "none",
    stagger: 0.05,
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "60% top",
      scrub: true
    }
  });

  shuffledIndices(floatImgs.length, 11, 5).forEach(function (idx, i) {
    gsap.to(floatImgs[idx], {
      scale: 0,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: function () { return "top+=" + i * 30 + " top"; },
        end: "50% top",
        scrub: true
      }
    });
  });

  /* ============================================================
     SERVICE CARDS — pinned wall-fall (desktop only)
     ============================================================ */
  var cards = document.querySelectorAll(".svc-card");

  /* nothing happens until halfway through the pin, then the card
     falls backwards with a quadratic ramp */
  function fallEase(p) {
    if (p < 0.5) return 0;
    var q = (p - 0.5) * 2;
    return q * q;
  }

  var mm = gsap.matchMedia();

  /* pin + fall needs a viewport tall enough to show a full card — short
     landscape screens (>=768px wide but <=600px tall) use the static stack */
  mm.add("(min-width: 768px) and (min-height: 601px)", function () {
    /* the last card needs 2 viewport-heights of scroll room past its top;
       the section's run-out padding tops up whatever the footer can't give */
    var cardsSection = document.querySelector(".svc-cards");
    var footer = document.querySelector(".svc-after");
    function sizeRunout() {
      if (!cardsSection) return;
      var fh = footer ? footer.offsetHeight : 0;
      var vh = window.innerHeight;
      cardsSection.style.paddingBottom = Math.max(vh, 2 * vh - fh) + "px";
    }
    sizeRunout();
    ScrollTrigger.addEventListener("refreshInit", sizeRunout);

    cards.forEach(function (card) {
      var wrapper = card.querySelector(".svc-card__wrapper");
      var content = card.querySelector(".svc-card__content");
      if (!wrapper || !content) return;

      var items = content.querySelectorAll(".svc-card__showcase-item");
      var tiltZ = (Math.random() - 0.5) * 10;

      gsap.set(items, { autoAlpha: 0 });

      /* entry: name / tag / text / number fade up as the card arrives */
      var textBits = content.querySelectorAll(
        ".svc-card__top, .svc-card__tag, .svc-card__text, .svc-card__num"
      );
      gsap.set(textBits, { opacity: 0, y: 40 });
      ScrollTrigger.create({
        trigger: card,
        start: "top 70%",
        once: true,
        onEnter: function () {
          gsap.to(textBits, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            stagger: 0.08,
            ease: "power3.out"
          });
        }
      });

      /* the wall falls while the card is pinned for 2 viewport heights */
      gsap.to(content, {
        rotationX: 40,
        rotationZ: tiltZ,
        scale: 0.7,
        ease: fallEase,
        scrollTrigger: {
          pin: wrapper,
          trigger: card,
          start: "top top",
          end: function () { return "+=" + window.innerHeight * 2; },
          scrub: true,
          invalidateOnRefresh: true
        }
      });

      /* showcase images fade in one by one while pinned */
      gsap.to(items, {
        autoAlpha: 1,
        stagger: 0.25,
        ease: "power2.out",
        scrollTrigger: {
          trigger: card,
          start: "top top",
          end: function () { return "+=" + window.innerHeight * 0.8; },
          scrub: true,
          invalidateOnRefresh: true
        }
      });

      /* fade the fallen card away before the next one arrives */
      gsap.to(content, {
        autoAlpha: 0,
        ease: "power1.in",
        scrollTrigger: {
          trigger: content,
          start: "top -180%",
          end: function () { return "+=" + window.innerHeight * 0.2; },
          scrub: true,
          invalidateOnRefresh: true
        }
      });
    });

    return function () {
      ScrollTrigger.removeEventListener("refreshInit", sizeRunout);
      if (cardsSection) cardsSection.style.paddingBottom = "";
      cards.forEach(function (card) {
        var items = card.querySelectorAll(".svc-card__showcase-item");
        gsap.set(items, { clearProps: "opacity,visibility" });
        gsap.set(card.querySelector(".svc-card__content"), { clearProps: "all" });
        gsap.set(
          card.querySelectorAll(".svc-card__top, .svc-card__tag, .svc-card__text, .svc-card__num"),
          { clearProps: "all" }
        );
      });
    };
  });

  /* mobile + short-landscape: static stack — texts and images fade up
     as they enter */
  mm.add("(max-width: 767px), (max-height: 600px)", function () {
    cards.forEach(function (card) {
      var parts = card.querySelectorAll(
        ".svc-card__top, .svc-card__showcase-item, .svc-card__bottom"
      );
      gsap.set(parts, { opacity: 0, y: 30 });
      ScrollTrigger.create({
        trigger: card,
        start: "top 75%",
        once: true,
        onEnter: function () {
          gsap.to(parts, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.12,
            ease: "power3.out"
          });
        }
      });
    });

    return function () {
      cards.forEach(function (card) {
        gsap.set(
          card.querySelectorAll(".svc-card__top, .svc-card__showcase-item, .svc-card__bottom"),
          { clearProps: "all" }
        );
      });
    };
  });

  /* ============================================================
     GO — main.js has already faded the page in
     ============================================================ */
  function start() {
    /* wait one frame so main.js init (Lenis, nav, page fade) settles */
    requestAnimationFrame(function () {
      reveal();
      ScrollTrigger.refresh();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
