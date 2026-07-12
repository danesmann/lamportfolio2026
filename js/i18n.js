/* ============================================================
   THANH LAM — LIGHTWEIGHT I18N (EN default / VI)
   Loaded FIRST, before data.js / main.js / services.js, so
   window.TL_LANG is available synchronously to every renderer.

   - Language is stored in localStorage("tl-lang"). First-ever
     visit (or any non-"vi" value) resolves to English — the
     browser language is deliberately NOT auto-detected.
   - English is the source of truth in the HTML: nothing is
     rewritten for EN. Only when VI is active do we swap text,
     so the English markup is never coupled to this dictionary.
   - Switching language just persists the choice and reloads, so
     all GSAP-animated / JS-generated DOM re-renders correctly.
   ============================================================ */
(function () {
  "use strict";

  var stored = null;
  try { stored = localStorage.getItem("tl-lang"); } catch (e) {}
  /* an explicit ?lang=vi|en in the URL is a deliberate choice: it overrides
     and is persisted. A normal first visit (no param, no stored value) still
     resolves to English — the browser language is never auto-detected. */
  try {
    var qlang = new URLSearchParams(location.search || "").get("lang");
    if (qlang === "vi" || qlang === "en") {
      stored = qlang;
      try { localStorage.setItem("tl-lang", qlang); } catch (e2) {}
    }
  } catch (e) {}
  var LANG = stored === "vi" ? "vi" : "en"; /* default EN, never auto-detect */
  window.TL_LANG = LANG;
  var VI = LANG === "vi";
  try { document.documentElement.lang = LANG; } catch (e) {}

  /* choose between an English and a Vietnamese value */
  function pick(en, vi) { return VI && vi != null ? vi : en; }
  window.tlPick = pick;

  /* ---------- shared project-data maps ---------- */
  var CATS = {
    "ALL": "TẤT CẢ",
    "MARKETING CASE STUDY": "CASE STUDY MARKETING",
    "CREATIVE WORK": "TÁC PHẨM SÁNG TẠO"
  };
  var TAGS = {
    "Branding": "Thương hiệu", "Social": "Mạng xã hội", "UI UX": "UI UX",
    "UI": "UI", "Story-telling": "Kể chuyện", "Photography": "Nhiếp ảnh",
    "Packaging": "Bao bì", "Merchandise": "Merch", "Merch": "Merch",
    "Illustration": "Minh họa", "Prints": "Ấn phẩm", "3D": "3D",
    "B2B Communicate": "Truyền thông B2B", "Logo": "Logo", "Mockup": "Mockup",
    "Stage Design": "Thiết kế sân khấu", "Art": "Nghệ thuật",
    "Photograph": "Nhiếp ảnh", "Product Design": "Thiết kế sản phẩm",
    "Website": "Website", "Identity": "Nhận diện",
    "Marketing Lead": "Trưởng nhóm Marketing",
    "Booth Design": "Thiết kế gian hàng", "B2B Communication": "Truyền thông B2B",
    "Product Development": "Phát triển sản phẩm", "Design": "Thiết kế",
    "Brand Marketing": "Marketing thương hiệu",
    "Customer Relations Management": "Quản lý quan hệ khách hàng",
    "Web Builder": "Xây dựng website", "Social Media": "Mạng xã hội",
    "Brand Designer": "Thiết kế thương hiệu"
  };
  var ORIGINS = {
    "New Year 2025": "Tết 2025", "Poster Design": "Thiết kế Poster",
    "Photograph": "Nhiếp ảnh"
  };

  function tagOne(t) { return VI && TAGS[t] ? TAGS[t] : t; }

  window.tlCategory = function (s) { return VI && CATS[s] ? CATS[s] : s; };
  window.tlTags = function (arr) { return (arr || []).map(tagOne); };
  window.tlSub = function (s) {
    if (!VI || !s) return s;
    return String(s).split(",").map(function (x) { return tagOne(x.trim()); }).join(", ");
  };
  window.tlOrigin = function (s) { return VI && ORIGINS[s] ? ORIGINS[s] : s; };
  window.tlTitle = function (p) { return pick(p.title, p.title_vi); };

  /* ---------- static-UI Vietnamese dictionary ----------
     Keys map to the VI string only; English stays in the HTML. */
  var DICT = {
    /* nav + menu (shared) */
    nav_navigation: "ĐIỀU HƯỚNG",
    nav_work: "KINH NGHIỆM LÀM VIỆC",
    nav_archive: "LƯU TRỮ",
    nav_about: "GIỚI THIỆU",
    nav_home_aria: "Thanh Lam — trang chủ",
    lang_label: "NGÔN NGỮ",

    /* document titles (browser tab) */
    doc_home: "Thanh Lam — Nhà thiết kế sáng tạo — Tác phẩm",
    doc_archive: "Lưu trữ — Thanh Lam — Nhà thiết kế sáng tạo",
    doc_about: "Giới thiệu — Thanh Lam — Brand & Trade Marketer",

    /* home */
    home_sr: "Tác phẩm chọn lọc",

    /* archive */
    arch_index: "01 — MỤC LỤC",
    arch_all_az: "TẤT CẢ DỰ ÁN A→Z",
    arch_title: "LƯU TRỮ",
    th_no: "SỐ",
    th_project: "DỰ ÁN",
    th_origin: "THƯƠNG HIỆU",
    th_category: "DANH MỤC",
    th_year: "NĂM",

    /* about — hero description */
    svc_desc: "Tôi là Thanh Lam — một brand & trade marketer đến từ Việt Nam. Tôi triển khai chiến dịch từ đầu đến cuối, phát triển thương hiệu cùng đối tác B2B và bán lẻ, và thiết kế trải nghiệm mua sắm biến lượt truy cập e-commerce thành người mua — từ chiến lược cho tới những con số chứng minh hiệu quả.",

    /* about — service cards */
    svc1_title: "MARKETING THƯƠNG HIỆU",
    svc1_tag: "ĐỊNH VỊ ĐỂ GHI NHỚ",
    svc1_text: "Tôi xây dựng nhận diện và định vị thương hiệu như một hệ thống thống nhất — giọng nói, hình ảnh và thông điệp nhất quán trên mọi điểm chạm, để thương hiệu luôn được nhận ra ở bất cứ nơi nào khách hàng gặp nó.",
    svc2_title: "MARKETING THƯƠNG MẠI & B2B",
    svc2_tag: "THƯƠNG HIỆU CHẠM ĐẾN ĐỐI TÁC",
    svc2_text: "Đưa thương hiệu đến đúng đối tác B2B và bán lẻ — tiếp cận nhà phân phối, hồ sơ chào hàng và hoạt động kênh thương mại giúp mở cánh cửa và biến đối tác thành vị trí trưng bày.",
    svc3_title: "E-COMMERCE & TRẢI NGHIỆM MUA SẮM",
    svc3_tag: "LƯỢT GHÉ THÀNH NGƯỜI MUA",
    svc3_text: "Thiết kế hành trình mua sắm trên e-commerce — điểm thu hút, gian hàng và cách trình bày sản phẩm được định hình để giữ chân khách và dẫn họ từ xem đến mua.",
    svc4_title: "NỘI DUNG & COPYWRITING",
    svc4_tag: "NGÔN TỪ ĐÚNG CHẤT THƯƠNG HIỆU",
    svc4_text: "Nội dung rõ ràng, đúng chất thương hiệu trên mạng xã hội, email và landing page — viết vừa vặn với từng kênh và tệp khán giả, sẵn sàng triển khai với chỉnh sửa tối thiểu.",
    svc5_title: "THIẾT KẾ & SẢN XUẤT HÌNH ẢNH",
    svc5_tag: "HÌNH ẢNH KHÔNG PHẢI CHỜ",
    svc5_text: "Tự sản xuất hình ảnh chiến dịch, gian hàng và merch — con mắt của một designer giúp cho ra sản phẩm chỉn chu thật nhanh, không phải chờ người khác làm từng tài sản.",

    /* about — contact */
    contact_label: "LIÊN HỆ",
    contact_open: "SẴN SÀNG NHẬN DỰ ÁN",
    cta_l1: "HÃY CÙNG",
    cta_l2: "HỢP TÁC ↗",
    contact_marquee: "THANH LAM — NHÀ THIẾT KẾ SÁNG TẠO — ",
    contact_copyright: "© 2026 THANH LAM — BẢO LƯU MỌI QUYỀN",
    contact_back_work: "XEM TÁC PHẨM ↗",
    contact_back_top: "LÊN ĐẦU TRANG ↑"
  };
  window.tlUI = function (key) { return DICT[key]; };

  /* about-page hero title — rebuilt word-by-word for VI so the
     scroll-reveal animation (services.js) still finds .svc-word */
  var HERO_VI = [["MARKETING"], ["TIẾP", "CẬN", "ĐỐI", "TÁC"], ["&", "THÚC", "ĐẨY", "NGƯỜI", "MUA"]];
  var HERO_ARIA_VI = "Marketing tiếp cận đối tác và thúc đẩy người mua";

  function buildHeroTitle(h1) {
    var html = "";
    HERO_VI.forEach(function (line, li) {
      if (li) html += "<br />";
      line.forEach(function (w, wi) {
        if (wi) html += " "; /* keep spaces between words on a line */
        html += '<span class="svc-word" aria-hidden="true">' +
          '<span class="svc-word__hidden">' + w + '</span>' +
          '<span class="svc-word__scroll"><span class="svc-word__visible">' + w + '</span></span>' +
          '</span>';
      });
    });
    h1.innerHTML = html;
    h1.setAttribute("aria-label", HERO_ARIA_VI);
  }

  /* ---------- apply the VI dictionary to the static DOM ---------- */
  function applyStatic() {
    if (VI) {
      document.querySelectorAll("[data-i18n]").forEach(function (el) {
        var v = DICT[el.getAttribute("data-i18n")];
        if (v != null) el.textContent = v;
      });
      document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
        var v = DICT[el.getAttribute("data-i18n-aria")];
        if (v != null) el.setAttribute("aria-label", v);
      });
      var body = document.body;
      var tKey = body && body.getAttribute("data-i18n-title");
      if (tKey && DICT[tKey]) document.title = DICT[tKey];
      var hero = document.querySelector("[data-hero-title]");
      if (hero) buildHeroTitle(hero);
    }

    /* language switch (VIE / ENG) — active state + wiring, both langs */
    document.querySelectorAll("[data-lang-set]").forEach(function (el) {
      var to = el.getAttribute("data-lang-set");
      if (to === LANG) el.classList.add("is-active");
      el.addEventListener("click", function (e) {
        e.preventDefault();
        window.tlSetLang(to);
      });
    });
  }

  window.tlSetLang = function (lang) {
    lang = lang === "vi" ? "vi" : "en";
    try { localStorage.setItem("tl-lang", lang); } catch (e) {}
    if (lang !== LANG) location.reload();
  };

  /* run synchronously: i18n.js is loaded at end-of-body, so every content
     element already exists — and the about-page hero must be rebuilt for VI
     BEFORE main.js / services.js capture its word-spans at their own load. */
  applyStatic();
}());
