# Thanh Lam — Portfolio

A dark, editorial portfolio showcasing 18 selected projects (2023–2026)
across **Product**, **Experience** and **Communication** design.

Three pages:

- **index.html** — selected work (scroll-driven project wheel)
- **archive.html** — the full project index/table
- **about.html** — about + contact, merged

Animation-driven, inspired by modern award-site interaction patterns:

- **GSAP 3 + ScrollTrigger** — masked text reveals, section reveals, counters
- **Lenis** — buttery smooth scrolling
- **Scroll-driven project wheel** — sticky full-screen list with category
  filters and crossfading image previews
- **Archive index** — full project table with cursor-following image preview
- **Expanding menu** — logo left, pill button right; opens a spring-animated
  white rounded panel with the site nav
- Custom cursor, marquees, grain overlay, preloader

## Run it

Option 1 — just open `index.html` in a browser (Chrome/Edge). Everything
works from the file system.

Option 2 — local server (nicer URLs):

```powershell
powershell -ExecutionPolicy Bypass -File serve.ps1
# then open http://localhost:8080/
```

> Internet connection is required for the Google Fonts + GSAP/Lenis CDNs.

## Structure

```
index.html          # work wheel
archive.html        # full project index/table
about.html          # about → contact
css/style.css       # dark design system (Space Grotesk + Space Mono)
js/data.js          # the 18 projects: title / origin / category / tags / year / image
js/main.js          # all animation + interaction logic
assets/logo.svg     # nav logo
assets/img/         # optimized project images (1600×900 JPEG)
serve.ps1           # tiny local static server (PowerShell, no dependencies)
```

## Editing projects

All content lives in `js/data.js`. Each project:

```js
{
  num: 1,                        // matches assets/img/<num>.jpg
  title: "K-Derma Skin Care",
  origin: "Lubylab",
  category: "PRODUCT",           // PRODUCT | EXPERIENCE | COMMUNICATION
  tags: ["Branding", "Social", "UI UX"],
  year: 2026,
  img: "assets/img/1.jpg"
}
```

Contact email, social links and about copy are in `about.html`. The nav
(logo + menu links) is duplicated at the top of both HTML files.
