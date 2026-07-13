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
    "MARKETING CASE STUDY": "DỰ ÁN MARKETING",
    "CREATIVE WORK": "DỰ ÁN SÁNG TẠO"
  };
  var TAGS = {
    "Branding": "Xây dựng thương hiệu", "Social": "Mạng xã hội", "UI UX": "Giao diện & trải nghiệm người dùng",
    "UI": "Giao diện người dùng", "Story-telling": "Kể chuyện", "Photography": "Nhiếp ảnh",
    "Packaging": "Bao bì", "Merchandise": "Vật phẩm thương hiệu", "Merch": "Vật phẩm thương hiệu",
    "Illustration": "Minh họa", "Prints": "Ấn phẩm", "3D": "3D",
    "B2B Communicate": "Truyền thông B2B", "Logo": "Logo", "Mockup": "Bản mô phỏng",
    "Stage Design": "Thiết kế sân khấu", "Art": "Nghệ thuật",
    "Photograph": "Nhiếp ảnh", "Product Design": "Thiết kế sản phẩm",
    "Website": "Thiết kế website", "Identity": "Nhận diện thương hiệu",
    "Marketing Lead": "Trưởng nhóm Marketing",
    "Booth Design": "Thiết kế gian hàng", "B2B Communication": "Truyền thông B2B",
    "Product Development": "Phát triển sản phẩm", "Design": "Thiết kế",
    "Brand Marketing": "Marketing thương hiệu",
    "Customer Relations Management": "Quản lý quan hệ khách hàng",
    "Web Builder": "Phát triển website", "Social Media": "Truyền thông mạng xã hội",
    "Brand Designer": "Nhà thiết kế thương hiệu"
  };
  var ORIGINS = {
    "New Year 2025": "Tết 2025", "Poster Design": "Thiết kế áp phích",
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
    nav_work: "DỰ ÁN TIÊU BIỂU",
    nav_archive: "TẤT CẢ DỰ ÁN",
    nav_about: "GIỚI THIỆU",
    nav_home_aria: "Thanh Lam — trang chủ",
    nav_site_aria: "Điều hướng website",
    lang_group_aria: "Chọn ngôn ngữ",
    work_filters_aria: "Lọc dự án",
    work_list_aria: "Danh sách dự án",
    contact_cta_aria: "Gửi email để hợp tác cùng Thanh Lam",
    contact_socials_aria: "Liên kết mạng xã hội",

    /* document titles (browser tab) */
    doc_home: "Thanh Lam — Nhà thiết kế sáng tạo — Dự án",
    doc_archive: "Tất cả dự án — Thanh Lam — Nhà thiết kế sáng tạo",
    doc_about: "Giới thiệu — Thanh Lam — Chuyên gia Marketing Thương hiệu & Thương mại",
    home_og_title: "Thanh Lam — Nhà thiết kế sáng tạo — Dự án",
    archive_og_title: "Tất cả dự án — Thanh Lam — Nhà thiết kế sáng tạo",
    about_og_title: "Giới thiệu — Thanh Lam — Chuyên gia Marketing Thương hiệu & Thương mại",
    home_meta_desc: "Thanh Lam là nhà thiết kế đa lĩnh vực tại Việt Nam, hoạt động trong thiết kế sản phẩm, trải nghiệm và truyền thông — từ xây dựng thương hiệu, bao bì, minh họa, UI/UX đến nhiếp ảnh.",
    home_og_desc: "19 dự án tiêu biểu trong thiết kế sản phẩm, trải nghiệm và truyền thông, giai đoạn 2023–2026.",
    archive_meta_desc: "Toàn bộ dự án của Thanh Lam — 19 dự án về thiết kế sản phẩm, trải nghiệm và truyền thông, giai đoạn 2023–2026.",
    archive_og_desc: "Toàn bộ 19 dự án về thiết kế sản phẩm, trải nghiệm và truyền thông, giai đoạn 2023–2026.",
    about_meta_desc: "Giới thiệu Thanh Lam — chuyên gia marketing thương hiệu và thương mại với kinh nghiệm phát triển đối tác B2B, trải nghiệm thương mại điện tử, nội dung và sản xuất hình ảnh. Sẵn sàng cho cơ hội hợp tác mới.",
    about_og_desc: "Chuyên gia marketing thương hiệu và thương mại tại Việt Nam — marketing thương hiệu, phát triển đối tác B2B, thương mại điện tử, nội dung và thiết kế.",

    /* home */
    home_sr: "Dự án tiêu biểu",

    /* archive */
    arch_index: "01 — DANH MỤC",
    arch_all_az: "TOÀN BỘ DỰ ÁN A→Z",
    arch_title: "DỰ ÁN",
    th_no: "STT",
    th_project: "DỰ ÁN",
    th_origin: "THƯƠNG HIỆU",
    th_category: "LĨNH VỰC",
    th_year: "NĂM",

    /* about — hero description */
    svc_desc: "Tôi là Thanh Lam — chuyên gia marketing thương hiệu và thương mại tại Việt Nam. Tôi phụ trách chiến dịch từ chiến lược đến triển khai, phát triển thương hiệu cùng các đối tác B2B và bán lẻ, đồng thời thiết kế trải nghiệm mua sắm giúp chuyển lượt truy cập thương mại điện tử thành đơn hàng — với hiệu quả được chứng minh bằng số liệu.",

    /* about — service cards */
    svc1_title: "MARKETING THƯƠNG HIỆU",
    svc1_tag: "ĐỊNH VỊ ĐỂ ĐƯỢC GHI NHỚ",
    svc1_text: "Tôi xây dựng nhận diện và định vị thành một hệ thống thống nhất — từ giọng điệu, hình ảnh đến thông điệp trên mọi điểm chạm — để khách hàng luôn nhận ra thương hiệu, dù gặp ở bất kỳ đâu.",
    svc2_title: "MARKETING THƯƠNG MẠI & B2B",
    svc2_tag: "ĐƯA THƯƠNG HIỆU ĐẾN ĐÚNG ĐỐI TÁC",
    svc2_text: "Tôi kết nối thương hiệu với đúng đối tác B2B và bán lẻ — từ tiếp cận nhà phân phối, xây dựng hồ sơ chào hàng đến triển khai hoạt động tại kênh — để biến cơ hội hợp tác thành hiện diện thực tế trên quầy kệ.",
    svc3_title: "THƯƠNG MẠI ĐIỆN TỬ & TRẢI NGHIỆM MUA SẮM",
    svc3_tag: "BIẾN LƯỢT XEM THÀNH ĐƠN HÀNG",
    svc3_text: "Tôi thiết kế hành trình mua sắm trên nền tảng thương mại điện tử — từ điểm thu hút, gian hàng đến cách trình bày sản phẩm — nhằm giữ chân khách và dẫn họ từ xem đến mua.",
    svc4_title: "NỘI DUNG & SÁNG TẠO CÂU CHỮ",
    svc4_tag: "NGÔN TỪ NHẤT QUÁN VỚI THƯƠNG HIỆU",
    svc4_text: "Tôi viết nội dung rõ ràng, đúng giọng thương hiệu cho mạng xã hội, email và trang đích — phù hợp với từng kênh, từng nhóm khách hàng và sẵn sàng triển khai với ít vòng chỉnh sửa.",
    svc5_title: "THIẾT KẾ & SẢN XUẤT HÌNH ẢNH",
    svc5_tag: "HÌNH ẢNH SẴN SÀNG ĐÚNG LÚC",
    svc5_text: "Tôi trực tiếp sản xuất hình ảnh chiến dịch, thiết kế gian hàng và vật phẩm thương hiệu — kết hợp tư duy thiết kế với tốc độ triển khai để tạo ra sản phẩm chỉn chu mà không phụ thuộc vào nhiều khâu trung gian.",
    project_view: "XEM DỰ ÁN ↗",

    /* about — contact */
    contact_label: "LIÊN HỆ",
    contact_open: "SẴN SÀNG HỢP TÁC",
    cta_l1: "HÃY CÙNG",
    cta_l2: "LÀM VIỆC ↗",
    contact_marquee: "THANH LAM — CHUYÊN GIA MARKETING THƯƠNG HIỆU & THƯƠNG MẠI — ",
    contact_copyright: "© 2026 THANH LAM — BẢO LƯU MỌI QUYỀN",
    contact_back_work: "XEM DỰ ÁN ↗",
    contact_back_top: "LÊN ĐẦU TRANG ↑"
  };
  window.tlUI = function (key) { return DICT[key]; };

  /* about-page hero title — rebuilt word-by-word for VI so the
     scroll-reveal animation (services.js) still finds .svc-word */
  var HERO_VI = [["MARKETING"], ["KẾT", "NỐI", "ĐỐI", "TÁC"], ["&", "CHINH", "PHỤC", "KHÁCH", "HÀNG"]];
  var HERO_ARIA_VI = "Marketing kết nối đối tác và chinh phục khách hàng";

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
      document.querySelectorAll("[data-i18n-content]").forEach(function (el) {
        var v = DICT[el.getAttribute("data-i18n-content")];
        if (v != null) el.setAttribute("content", v);
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
      el.setAttribute("aria-pressed", to === LANG ? "true" : "false");
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
