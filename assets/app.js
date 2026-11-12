/* O'QI — ilova mantiqi */
(function () {
  "use strict";

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  const KEY = "kitobxon.v1";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const defaults = {
    route: "home",
    query: "",
    genre: "all",
    lang: "all",
    sort: "new",
    libTab: "all",
    library: [],
    progress: {},          // id -> {pct, chapter, at}
    bookmarks: {},         // id -> [{chapter, pct}]
    settings: {
      theme: "light",
      readerTheme: "light",
      font: 19,
      lang: "uz",
      collapsed: false
    }
  };

  let state = load();
  let BOOKS = window.BOOKS || [];
  const genres = Object.fromEntries(GENRES.map(g => [g.id, g.label]));
  const langs = Object.fromEntries(LANGS.map(l => [l.id, l.label]));

  /* ---------- storage ---------- */
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(defaults);
      const parsed = JSON.parse(raw);
      return Object.assign(structuredClone(defaults), parsed, {
        settings: Object.assign({}, defaults.settings, parsed.settings || {})
      });
    } catch (e) {
      return structuredClone(defaults);
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { toast("Saqlashda xatolik. Diskda joy yetarli emasligi mumkin."); }
  }

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function pctOf(id) {
    const p = state.progress[id];
    return p ? Math.round(p.pct) : 0;
  }
  function inLib(id) { return state.library.includes(id); }
  function bookById(id) { return BOOKS.find(b => b.id === id); }

  let toastTimer = null;
  function toast(msg) {
    const el = $("#toast");
    el.innerHTML = '<span class="toast__dot"></span><span>' + esc(msg) + "</span>";
    el.hidden = false;
    el.style.animation = "none";
    void el.offsetWidth;
    el.style.animation = "";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 2600);
  }

  /* ---------- cover ---------- */
  function coverHTML(b, small) {
    return (
      '<div class="cover' + (small ? " cover--sm" : "") + (b.cover.ink ? " cover--ink" : "") + '" style="background:linear-gradient(150deg,' + b.cover.c1 + ',' + b.cover.c2 + ')">' +
        '<span class="cover__spine"></span>' +
        '<div class="cover__body">' +
          '<span class="cover__top"></span>' +
          '<div class="cover__center">' +
            '<span class="cover__orn"></span>' +
            '<div class="cover__title">' + esc(b.title) + "</div>" +
            '<div class="cover__rule"></div>' +
            '<div class="cover__author">' + esc(b.author) + "</div>" +
          "</div>" +
          '<span class="cover__genre">' + esc(genres[b.genre] || "") + "</span>" +
        "</div>" +
      "</div>"
    );
  }

  function cardHTML(b) {
    return (
      '<button class="card" data-open="' + b.id + '" aria-label="' + esc(b.title + ", " + b.author) + '">' +
        '<span class="card__cover-wrap">' + coverHTML(b) + "</span>" +
        '<span class="card__name">' + esc(b.title) + "</span>" +
        '<span class="card__meta">' + (b.textKind === "pending" ? "Matn kutilmoqda" : esc(genres[b.genre] || "") + " · " + b.pages + " bet") + "</span>" +
      "</button>"
    );
  }

  function skeletonGrid(n) {
    let out = '<div class="grid" aria-hidden="true">';
    for (let i = 0; i < (n || 8); i++) {
      out += '<div class="sk"><div class="sk__cover"></div><div class="sk__line"></div><div class="sk__line sk__line--short"></div></div>';
    }
    return out + "</div>";
  }

  /* ---------- sorting / filtering ---------- */
  function filtered() {
    const q = state.query.trim().toLowerCase();
    let list = BOOKS.filter(b => {
      if (state.genre !== "all" && b.genre !== state.genre) return false;
      if (state.lang !== "all" && b.lang !== state.lang) return false;
      if (!q) return true;
      return (b.title + " " + b.original + " " + b.author + " " + b.authorFull + " " + (genres[b.genre] || ""))
        .toLowerCase().includes(q);
    });
    if (state.sort === "new") list.sort((a, b) => a.added - b.added);
    else if (state.sort === "popular") list.sort((a, b) => b.popularity - a.popularity);
    else if (state.sort === "az") list.sort((a, b) => a.title.localeCompare(b.title, "uz"));
    return list;
  }

  function inProgress() {
    return BOOKS.filter(b => pctOf(b.id) > 0 && pctOf(b.id) < 100)
      .sort((a, b) => (state.progress[b.id].at || 0) - (state.progress[a.id].at || 0));
  }

  /* ---------- views ---------- */
  function viewHome() {
    const cont = inProgress()[0];
    const fresh = BOOKS.slice().sort((a, b) => a.added - b.added).slice(0, 8);
    const popular = BOOKS.slice().sort((a, b) => b.popularity - a.popularity).slice(0, 8);
    const startedGenres = new Set(inProgress().map(b => b.genre));
    let forYou = BOOKS.filter(b => !pctOf(b.id) && (startedGenres.size ? startedGenres.has(b.genre) : true));
    if (forYou.length < 4) forYou = BOOKS.filter(b => !pctOf(b.id));
    forYou = forYou.slice(0, 8);

    return (
      '<div class="page">' +
        '<section class="hero">' +
          '<div class="hero__intro">' +
            '<p class="eyebrow">Shaxsiy kutubxona</p>' +
            '<h1 class="h1">Bugun nima o\'qiymiz?</h1>' +
            '<p class="lede">Katalogda ' + BOOKS.length + " ta asar bor. O'qish joyingiz avtomatik saqlanadi — qayerda to'xtasangiz, o'sha yerdan davom etasiz.</p>" +
            '<div class="hero__stats">' +
              '<div><div class="stat__num">' + BOOKS.length + '</div><div class="stat__lbl">katalogdagi kitob</div></div>' +
              '<div><div class="stat__num">' + state.library.length + '</div><div class="stat__lbl">kutubxonangizda</div></div>' +
              '<div><div class="stat__num">' + inProgress().length + '</div><div class="stat__lbl">o\'qilmoqda</div></div>' +
            "</div>" +
          "</div>" +
          (cont
            ? '<button class="continue" data-open="' + cont.id + '">' +
                coverHTML(cont, true) +
                '<span class="continue__meta">' +
                  '<span class="eyebrow" style="display:block">Davom ettirish</span>' +
                  '<span class="continue__name">' + esc(cont.title) + "</span>" +
                  '<span class="continue__author">' + esc(cont.author) + "</span>" +
                  '<span class="continue__bar"><span style="width:' + pctOf(cont.id) + '%"></span></span>' +
                  '<span class="continue__pct">' + pctOf(cont.id) + "% o'qildi</span>" +
                "</span>" +
              "</button>"
            : '<div class="continue" style="align-items:center">' +
                '<div style="padding:6px 4px">' +
                  '<p class="eyebrow">Boshlash uchun</p>' +
                  '<div class="continue__name" style="margin-bottom:10px">Birinchi kitobingizni tanlang</div>' +
                  '<p class="continue__author" style="margin-bottom:14px">Qisqa asardan boshlash oson — masalan, «Baxtli shahzoda».</p>' +
                  '<button class="btn btn--primary" data-open="baxtli-shahzoda">O\'qishni boshlash</button>' +
                "</div>" +
              "</div>") +
        "</section>" +

        '<section class="section">' +
          '<div class="section__head"><h2 class="section__title">Yangi qo\'shilganlar</h2>' +
          '<button class="section__link" data-route="catalog">Butun katalog</button></div>' +
          '<div class="rail">' + fresh.map(cardHTML).join("") + "</div>" +
        "</section>" +

        '<section class="section">' +
          '<div class="section__head"><h2 class="section__title">Ommabop kitoblar</h2>' +
          '<span class="section__sub">O\'quvchilar ko\'p tanlagan asarlar</span></div>' +
          '<div class="rail">' + popular.map(cardHTML).join("") + "</div>" +
        "</section>" +

        '<section class="section">' +
          '<div class="section__head"><h2 class="section__title">Siz uchun</h2>' +
          '<span class="section__sub">O\'qigan janrlaringizga mos</span></div>' +
          '<div class="rail">' + forYou.map(cardHTML).join("") + "</div>" +
        "</section>" +

        '<section class="section">' +
          '<div class="section__head"><h2 class="section__title">Janrlar</h2></div>' +
          '<div class="chips">' + GENRES.map(g =>
            '<button class="chip" data-genre="' + g.id + '">' + esc(g.label) + "</button>").join("") + "</div>" +
        "</section>" +
      "</div>"
    );
  }

  function viewCatalog() {
    const list = filtered();
    return (
      '<div class="page">' +
        '<div class="section__head" style="margin-bottom:6px">' +
          '<div><p class="eyebrow">Katalog</p><h1 class="h1">Barcha kitoblar</h1></div>' +
        "</div>" +
        '<div class="filters">' +
          '<select class="select" id="fGenre" aria-label="Janr bo\'yicha saralash">' +
            '<option value="all">Barcha janrlar</option>' +
            GENRES.map(g => '<option value="' + g.id + '"' + (state.genre === g.id ? " selected" : "") + ">" + esc(g.label) + "</option>").join("") +
          "</select>" +
          '<select class="select" id="fLang" aria-label="Til bo\'yicha saralash">' +
            '<option value="all">Barcha tillar</option>' +
            LANGS.map(l => '<option value="' + l.id + '"' + (state.lang === l.id ? " selected" : "") + ">" + esc(l.label) + "</option>").join("") +
          "</select>" +
          '<select class="select" id="fSort" aria-label="Tartib">' +
            '<option value="new"' + (state.sort === "new" ? " selected" : "") + ">Yangi qo'shilganlar</option>" +
            '<option value="popular"' + (state.sort === "popular" ? " selected" : "") + ">Ommabop</option>" +
            '<option value="az"' + (state.sort === "az" ? " selected" : "") + ">Alifbo bo'yicha</option>" +
          "</select>" +
          (state.genre !== "all" || state.lang !== "all" || state.query
            ? '<button class="btn btn--quiet" id="clearFilters">Filtrlarni tozalash</button>' : "") +
        "</div>" +
        '<div class="result-line"><span>' + list.length + " ta kitob topildi</span>" +
          (state.query ? "<span>«" + esc(state.query) + "» bo'yicha</span>" : "") + "</div>" +
        (list.length
          ? '<div class="grid">' + list.map(cardHTML).join("") + "</div>"
          : stateHTML("search", state.query)) +
      "</div>"
    );
  }

  function viewBook(id) {
    const b = bookById(id);
    if (!b) return stateHTML("error", "");
    const pct = pctOf(id);
    const saved = inLib(id);
    return (
      '<div class="page detail">' +
        '<div class="detail__cover">' + coverHTML(b) + "</div>" +
        "<div>" +
          '<button class="btn btn--quiet" data-route="catalog" style="margin-left:-8px">← Katalogga qaytish</button>' +
          '<h1 class="detail__title">' + esc(b.title) + "</h1>" +
          '<div class="detail__author">' + esc(b.authorFull) + (b.original !== b.title ? " · «" + esc(b.original) + "»" : "") + "</div>" +
          '<div class="detail__meta">' +
            '<div><div class="meta__lbl">Janr</div><div class="meta__val">' + esc(genres[b.genre]) + "</div></div>" +
            '<div><div class="meta__lbl">Til</div><div class="meta__val">' + esc(langs[b.lang]) + "</div></div>" +
            '<div><div class="meta__lbl">Sahifalar</div><div class="meta__val">' + b.pages + "</div></div>" +
            '<div><div class="meta__lbl">Yil</div><div class="meta__val">' + b.year + "</div></div>" +
            (pct ? '<div><div class="meta__lbl">O\'qilgan</div><div class="meta__val">' + pct + "%</div></div>" : "") +
          "</div>" +
          '<p class="detail__desc">' + esc(b.desc) + "</p>" +
          '<div class="detail__actions">' +
            (b.textKind === "pending"
              ? '<button class="btn btn--primary" disabled>Matn tayyorlanmoqda</button>'
              : '<button class="btn btn--primary" data-read="' + b.id + '">' + (pct ? "Davom ettirish" : "O'qishni boshlash") + "</button>") +
            '<button class="btn btn--outline" data-lib="' + b.id + '">' + (saved ? "Kutubxonamda" : "Kutubxonamga qo'shish") + "</button>" +
          "</div>" +
          '<div class="license">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v6c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6z"/><path d="M9.5 12.2l1.8 1.8 3.4-3.6"/></svg>' +
            "<div><strong>Huquq holati:</strong> " +
              (b.license === "public-domain"
                ? "public domain — erkin tarqatish mumkin."
                : b.license === "cc-by-4.0"
                  ? "<a href='https://creativecommons.org/licenses/by/4.0/' target='_blank' rel='noopener noreferrer'>CC BY 4.0</a> — manbani ko'rsatgan holda tarqatish va moslashtirish mumkin."
                  : "tekshirilmoqda.") +
            "<br><span style=\"color:var(--ink-3)\">Manba: " + esc(b.source) + "</span>" +
            (b.translation ? "<br><span style=\"color:var(--ink-3)\">Tarjima: " + esc(b.translation) + "</span>" : "") + "</div>" +
          "</div>" +
        "</div>" +
        (function () {
          const same = BOOKS.filter(x => x.id !== b.id && x.genre === b.genre).slice(0, 6);
          if (!same.length) return "";
          return '<section class="section" style="grid-column:1/-1"><div class="section__head">' +
            '<h2 class="section__title">Shu janrdagi boshqa kitoblar</h2>' +
            '<button class="section__link" data-route="catalog">Katalog</button></div>' +
            '<div class="rail">' + same.map(cardHTML).join("") + "</div></section>";
        })() +
      "</div>"
    );
  }

  function viewLibrary() {
    const tabs = [
      ["all", "Hammasi"],
      ["reading", "O'qilayotgan"],
      ["done", "Tugatilgan"],
      ["saved", "Saqlangan"]
    ];
    let list = BOOKS.filter(b => inLib(b.id) || pctOf(b.id) > 0);
    if (state.libTab === "reading") list = list.filter(b => pctOf(b.id) > 0 && pctOf(b.id) < 100);
    if (state.libTab === "done") list = list.filter(b => pctOf(b.id) >= 100);
    if (state.libTab === "saved") list = BOOKS.filter(b => inLib(b.id));

    return (
      '<div class="page">' +
        '<p class="eyebrow">Kutubxonam</p><h1 class="h1">Saqlangan kitoblar</h1>' +
        '<div class="tabs">' + tabs.map(t =>
          '<button class="tab' + (state.libTab === t[0] ? " is-active" : "") + '" data-tab="' + t[0] + '">' + t[1] + "</button>").join("") +
        "</div>" +
        (list.length
          ? list.map(b => {
              const p = pctOf(b.id);
              return '<div class="lib-item">' +
                '<button data-open="' + b.id + '" style="display:block;width:64px">' + coverHTML(b, true) + "</button>" +
                '<div><div class="lib-item__name">' + esc(b.title) + '</div><div class="lib-item__author">' + esc(b.author) + "</div>" +
                  '<div class="lib-item__bar"><span style="width:' + p + '%"></span></div></div>' +
                '<div style="text-align:right">' +
                  '<div class="lib-item__pct">' + (p >= 100 ? "Tugatilgan" : p > 0 ? p + "%" : "Boshlanmagan") + "</div>" +
                  (b.textKind !== "pending" ? '<button class="btn btn--quiet" data-read="' + b.id + '">' + (p > 0 ? "Davom" : "O'qish") + "</button>" : "") +
                "</div>" +
              "</div>";
            }).join("")
          : stateHTML(state.libTab === "saved" ? "empty-saved" : "empty-library", "")) +
      "</div>"
    );
  }

  function viewSettings() {
    return (
      '<div class="page">' +
        '<p class="eyebrow">Sozlamalar</p><h1 class="h1">Ilova sozlamalari</h1>' +
        '<div class="panel" style="margin-top:24px">' +
          '<div class="row"><div><div class="row__label">Ko\'rinish mavzusi</div>' +
            '<div class="row__hint">Kunduzgi yoki kechki rejim</div></div>' +
            '<div class="seg" id="themeSeg"><button data-theme="light"' + (state.settings.theme === "light" ? ' class="is-active"' : "") + ">Yorug'</button>" +
            '<button data-theme="dark"' + (state.settings.theme === "dark" ? ' class="is-active"' : "") + ">Qorong'i</button></div></div>" +

          '<div class="row"><div><div class="row__label">O\'qish mavzusi</div>' +
            '<div class="row__hint">O\'quvchi oynasining foni</div></div>' +
            '<div class="seg" id="readerSeg">' +
              ["light|Oq", "sepia|Sepiya", "dark|Qorong'i"].map(x => {
                const [v, l] = x.split("|");
                return '<button data-rtheme="' + v + '"' + (state.settings.readerTheme === v ? ' class="is-active"' : "") + ">" + l + "</button>";
              }).join("") + "</div></div>" +

          '<div class="row"><div><div class="row__label">Shrift kattaligi</div>' +
            '<div class="row__hint">O\'quvchi oynasidagi matn o\'lchami</div></div>' +
            '<div style="display:flex;align-items:center;gap:10px">' +
              '<input class="range" type="range" min="16" max="24" step="1" id="fontRange" value="' + state.settings.font + '" aria-label="Shrift kattaligi">' +
              '<span style="font-size:13px;color:var(--ink-3);min-width:34px">' + state.settings.font + "px</span></div></div>" +

          '<div class="row"><div><div class="row__label">Interfeys tili</div>' +
            '<div class="row__hint">Boshqa tillar keyingi versiyada qo\'shiladi</div></div>' +
            '<div class="seg"><button class="is-active">O\'zbekcha</button>' +
            '<button disabled title="Tez orada">Кирилл</button><button disabled title="Tez orada">Русский</button></div></div>' +

          '<div class="row"><div><div class="row__label">Ma\'lumotlarni tozalash</div>' +
            '<div class="row__hint">O\'qish joyi, xatcho\'plar va kutubxona o\'chiriladi</div></div>' +
            '<button class="btn btn--outline danger" id="clearData">Tozalash</button></div>' +
        "</div>" +
        '<p class="row__hint" style="margin-top:16px;max-width:56ch">O\'QI 1.0 · barcha ma\'lumotlar shu qurilmada saqlanadi, internet talab qilinmaydi. Katalog faqat public domain yoki aniq litsenziyali asarlardan iborat.</p>' +
      "</div>"
    );
  }

  function stateHTML(kind, q) {
    const map = {
      "empty-library": {
        mark: '<path d="M6 4h12v16l-6-4-6 4z"/>',
        title: "Kutubxonangiz hali bo'sh",
        text: "Kitobni saqlab qo'ysangiz, u shu yerda turadi va o'qish joyingiz eslab qolinadi.",
        cta: '<button class="btn btn--primary" data-route="catalog">Katalogga o\'tish</button>'
      },
      "empty-saved": {
        mark: '<path d="M6 4h12v16l-6-4-6 4z"/>',
        title: "Saqlangan kitob yo'q",
        text: "Kitob sahifasidagi «Kutubxonamga qo'shish» tugmasi orqali saqlang.",
        cta: '<button class="btn btn--outline" data-route="catalog">Kitob tanlash</button>'
      },
      "search": {
        mark: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
        title: "Hech narsa topilmadi",
        text: q ? "«" + esc(q) + "» bo'yicha kitob yo'q. Imloni tekshiring yoki janr filtrini olib tashlang." : "Filtrlarga mos kitob yo'q.",
        cta: '<button class="btn btn--outline" id="clearFilters">Filtrlarni tozalash</button>'
      },
      "pending": {
        mark: '<path d="M12 8v5l3 2"/><circle cx="12" cy="12" r="8.5"/>',
        title: "Matn hali tayyor emas",
        text: "Bu asarning huquqi toza, lekin raqamli matni hali qo'shilmagan. Kutubxonaga saqlab qo'ysangiz, matn tayyor bo'lganda shu yerda ochiladi.",
        cta: '<button class="btn btn--primary" id="errLib">Kutubxonamga qo\'shish</button>'
      },
      "error": {
        mark: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v5M12 16.5v.01"/>',
        title: "Kitob ochilmadi",
        text: "Yozuv topilmadi yoki shikastlangan. Katalogga qaytib, boshqa kitobni tanlang.",
        cta: '<button class="btn btn--primary" data-route="catalog">Katalogga qaytish</button>'
      }
    };
    const s = map[kind] || map.error;
    return '<div class="state"><svg class="state__mark" viewBox="0 0 24 24" aria-hidden="true">' + s.mark + "</svg>" +
      '<h2 class="state__title">' + s.title + "</h2>" +
      '<p class="state__text">' + s.text + "</p>" + (s.cta || "") + "</div>";
  }

  /* ---------- render ---------- */
  let firstPaint = true;
  function render() {
    const view = $("#view");
    const route = state.route;

    $$("#nav .nav__item").forEach(b => {
      const active = b.dataset.route === route || (route === "book" && b.dataset.route === "catalog");
      b.classList.toggle("is-active", active);
      if (active) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });

    // skeleton on the very first paint
    if (firstPaint && !reduced) {
      view.innerHTML = '<div class="page"><div class="sk" style="height:140px;border-radius:20px;margin-bottom:34px"></div>' + skeletonGrid(8) + "</div>";
      firstPaint = false;
      setTimeout(() => { paint(); }, 520);
      return;
    }
    paint();

    function paint() {
      if (route === "home") view.innerHTML = viewHome();
      else if (route === "catalog") view.innerHTML = viewCatalog();
      else if (route === "library") view.innerHTML = viewLibrary();
      else if (route === "settings") view.innerHTML = viewSettings();
      else if (route === "book") view.innerHTML = viewBook(state.bookId);
      else view.innerHTML = viewHome();
      $("#streakNum").textContent = state.library.length;
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    }
  }

  /* ---------- reader ---------- */
  const reader = {
    id: null,
    ch: 0,
    page: 0,
    pageCount: 1,
    coverOpen: true,
    turning: false,
    pagesPerSpread() {
      return window.matchMedia("(max-width: 760px)").matches ? 1 : 2;
    },
    open(id) {
      const b = bookById(id);
      const data = window.TEXTS && window.TEXTS[id];
      if (!b) return;
      if (!data) { toast("Bu kitobning matni hali qo'shilmagan"); return; }
      this.id = id;
      const saved = state.progress[id];
      this.ch = Math.min(saved ? saved.chapter || 0 : 0, data.chapters.length - 1);
      this.coverOpen = true;
      this.turning = false;
      $("#reader").hidden = false;
      $("#reader").dataset.readerTheme = state.settings.readerTheme;
      $("#reader").style.setProperty("--reader-font", state.settings.font + "px");
      $("#readerTitle").textContent = b.title + " · " + b.author;
      $("#readerCoverFront").innerHTML = coverHTML(b);
      $("#readerCover").hidden = false;
      $("#readerCover").className = "reader__cover";
      $("#readerBook").classList.add("reader__book--covered");
      this.paintChapter();
      document.body.style.overflow = "hidden";
      $("#readerClose").focus();
      save();
    },
    paintChapter() {
      const data = window.TEXTS[this.id];
      const ch = data.chapters[this.ch] || data.chapters[0];
      const el = $("#readerScroll");
      $("#readerPage").innerHTML = "<h2>" + esc(ch.title) + "</h2>" + ch.paragraphs.map(p => "<p>" + esc(p) + "</p>").join("");
      el.scrollLeft = 0;
      el.scrollTop = 0;
      const saved = state.progress[this.id];
      const restore = saved && saved.chapter === this.ch;
      const lastPage = this._openLastPage;
      this._openLastPage = false;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        this.pageCount = this.measurePages();
        if (lastPage) this.page = this.pageCount - 1;
        else if (restore) {
          this.page = Number.isInteger(saved.page)
            ? saved.page
            : Math.round((saved.scroll || 0) * (this.pageCount - 1));
        } else this.page = 0;
        this.goToPage(this.page);
        this.updateProgress();
        this.updateButtons();
      }));
      $("#bookmarkBtn").style.color = (state.bookmarks[this.id] || []).length ? "var(--brass)" : "";
    },
    measurePages() {
      const el = $("#readerScroll");
      return Math.max(1, Math.ceil((el.scrollWidth - 1) / Math.max(1, el.clientWidth)));
    },
    goToPage(page) {
      const el = $("#readerScroll");
      this.page = Math.max(0, Math.min(this.pageCount - 1, page));
      el.scrollLeft = this.page * el.clientWidth;
      this.updateButtons();
    },
    updateButtons() {
      if (!this.id) return;
      const data = window.TEXTS[this.id];
      const perSpread = this.pagesPerSpread();
      const start = this.page * perSpread + 1;
      const end = Math.min(start + perSpread - 1, this.pageCount * perSpread);
      $("#readerCounter").textContent = this.coverOpen
        ? "Muqova"
        : start + (end > start ? "–" + end : "") + " / " + this.pageCount * perSpread;
      $("#prevCh").disabled = this.turning || this.coverOpen;
      $("#nextCh").disabled = this.turning || (!this.coverOpen && this.ch === data.chapters.length - 1 && this.page === this.pageCount - 1);
    },
    turnCover(open) {
      if (this.turning) return;
      this.turning = true;
      const cover = $("#readerCover");
      const book = $("#readerBook");
      if (open) {
        cover.className = "reader__cover reader__cover--opening";
      } else {
        cover.hidden = false;
        book.classList.add("reader__book--covered");
        cover.className = "reader__cover reader__cover--closing";
      }
      this.updateButtons();
      const finish = () => {
        cover.removeEventListener("animationend", finish);
        cover.hidden = open;
        cover.className = "reader__cover";
        this.coverOpen = !open;
        this.turning = false;
        if (open) book.classList.remove("reader__book--covered");
        this.updateProgress();
        this.updateButtons();
      };
      cover.addEventListener("animationend", finish, { once: true });
    },
    turnPage(direction, done) {
      if (this.turning) return;
      this.turning = true;
      const flip = $("#readerFlip");
      flip.hidden = false;
      flip.className = "reader__flip";
      void flip.offsetWidth;
      flip.classList.add(direction === "next" ? "reader__flip--next" : "reader__flip--prev");
      this.updateButtons();
      const finish = () => {
        flip.removeEventListener("animationend", finish);
        flip.hidden = true;
        flip.className = "reader__flip";
        this.turning = false;
        done();
      };
      flip.addEventListener("animationend", finish, { once: true });
    },
    updateProgress() {
      if (!this.id) return;
      const data = window.TEXTS[this.id];
      if (!data) return;
      const ratio = this.coverOpen ? 0 : this.pageCount > 1 ? this.page / (this.pageCount - 1) : 1;
      const total = data.chapters.length;
      const pct = Math.min(100, Math.round(((this.ch + ratio) / total) * 100));
      $("#readerProgress").style.width = pct + "%";
      $("#readerPct").textContent = pct + "%";
      state.progress[this.id] = { pct, chapter: this.ch, page: this.page, at: Date.now(), scroll: ratio };
      clearTimeout(this._t);
      this._t = setTimeout(save, 350);
    },
    reflow() {
      if (!this.id || this.turning) return;
      const ratio = this.pageCount > 1 ? this.page / (this.pageCount - 1) : 0;
      requestAnimationFrame(() => {
        this.pageCount = this.measurePages();
        this.goToPage(Math.round(ratio * (this.pageCount - 1)));
        this.updateProgress();
      });
    },
    close() {
      $("#reader").hidden = true;
      $("#readerCover").hidden = true;
      $("#readerFlip").hidden = true;
      $("#readerBook").classList.remove("reader__book--covered");
      document.body.style.overflow = "";
      this.id = null;
      this.turning = false;
      render();
    },
    next() {
      if (!this.id || this.turning) return;
      if (this.coverOpen) { this.turnCover(true); return; }
      const data = window.TEXTS[this.id];
      if (this.page < this.pageCount - 1) {
        this.turnPage("next", () => {
          this.goToPage(this.page + 1);
          this.updateProgress();
        });
      } else if (this.ch < data.chapters.length - 1) {
        this.turnPage("next", () => {
          this.ch++;
          this.paintChapter();
        });
      }
    },
    prev() {
      if (!this.id || this.turning || this.coverOpen) return;
      if (this.page > 0) {
        this.turnPage("prev", () => {
          this.goToPage(this.page - 1);
          this.updateProgress();
        });
      } else if (this.ch > 0) {
        this.turnPage("prev", () => {
          this.ch--;
          this._openLastPage = true;
          this.paintChapter();
        });
      } else this.turnCover(false);
    },
    bookmark() {
      if (!this.id) return;
      const arr = state.bookmarks[this.id] || [];
      const pct = pctOf(this.id);
      arr.push({ chapter: this.ch, pct });
      state.bookmarks[this.id] = arr;
      save();
      $("#bookmarkBtn").style.color = "var(--brass)";
      toast("Xatcho'p qo'yildi · " + pct + "%");
    }
  };

  /* ---------- actions ---------- */
  function openBook(id) {
    state.route = "book"; state.bookId = id;
    history.replaceState(null, "", "#/kitob/" + id);
    render();
  }
  function go(route) {
    state.route = route;
    history.replaceState(null, "", "#/" + route);
    if (window.innerWidth <= 820) { $("#app").classList.remove("is-open"); $("#scrim").hidden = true; }
    render();
  }
  function toggleLib(id) {
    const i = state.library.indexOf(id);
    if (i >= 0) { state.library.splice(i, 1); toast("Kutubxonadan olib tashlandi"); }
    else { state.library.push(id); toast("Kutubxonamga qo'shildi"); }
    save(); render();
  }

  /* ---------- events ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-open],[data-route],[data-read],[data-lib],[data-genre],[data-tab],[data-theme],[data-rtheme]");
    if (!t) return;

    if (t.dataset.open) { openBook(t.dataset.open); return; }
    if (t.dataset.route) { go(t.dataset.route); return; }
    if (t.dataset.read) { reader.open(t.dataset.read); return; }
    if (t.dataset.lib) { toggleLib(t.dataset.lib); return; }
    if (t.dataset.genre) {
      state.genre = t.dataset.genre; state.route = "catalog";
      history.replaceState(null, "", "#/catalog"); render(); return;
    }
    if (t.dataset.tab) { state.libTab = t.dataset.tab; render(); return; }
    if (t.dataset.theme) {
      state.settings.theme = t.dataset.theme; document.body.dataset.theme = t.dataset.theme; save(); render(); return;
    }
    if (t.dataset.rtheme) {
      state.settings.readerTheme = t.dataset.rtheme; $("#reader").dataset.readerTheme = t.dataset.rtheme; save(); render(); return;
    }
  });

  // filters
  document.addEventListener("change", (e) => {
    const id = e.target.id;
    if (id === "fGenre") { state.genre = e.target.value; render(); }
    if (id === "fLang") { state.lang = e.target.value; render(); }
    if (id === "fSort") { state.sort = e.target.value; render(); }
    if (id === "fontRange") {
      state.settings.font = Number(e.target.value);
      $("#reader").style.setProperty("--reader-font", state.settings.font + "px");
      save();
      const lbl = e.target.nextElementSibling;
      if (lbl) lbl.textContent = state.settings.font + "px";
    }
  });

  document.addEventListener("input", (e) => {
    if (e.target.id === "searchInput") {
      state.query = e.target.value;
      if (state.route !== "catalog") { state.route = "catalog"; }
      render();
      const inp = $("#searchInput");
      if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
    }
  });

  $("#searchInput").addEventListener("keydown", (e) => {
    if (e.key === "Escape") { e.target.value = ""; state.query = ""; render(); }
  });

  document.addEventListener("click", (e) => {
    if (e.target.id === "clearFilters") {
      state.query = ""; state.genre = "all"; state.lang = "all";
      $("#searchInput").value = "";
      render();
    }
    if (e.target.id === "errLib" && reader.pendingId) toggleLib(reader.pendingId);
    if (e.target.id === "clearData") {
      if (confirm("O'qish joyi, xatcho'plar va kutubxona o'chiriladi. Davom etasizmi?")) {
        const theme = state.settings.theme;
        state = structuredClone(defaults);
        state.settings.theme = theme;
        save(); render(); toast("Ma'lumotlar tozalandi");
      }
    }
  });

  $("#readerClose").addEventListener("click", () => reader.close());
  $("#prevCh").addEventListener("click", () => reader.prev());
  $("#nextCh").addEventListener("click", () => reader.next());
  $("#bookmarkBtn").addEventListener("click", () => reader.bookmark());
  $("#fontPlus").addEventListener("click", () => bumpFont(1));
  $("#fontMinus").addEventListener("click", () => bumpFont(-1));
  $("#readerTheme").addEventListener("click", () => {
    const order = ["light", "sepia", "dark"];
    const next = order[(order.indexOf(state.settings.readerTheme) + 1) % 3];
    state.settings.readerTheme = next;
    $("#reader").dataset.readerTheme = next;
    save();
    toast("O'qish mavzusi: " + ({ light: "oq", sepia: "sepiya", dark: "qorong'i" })[next]);
  });
  let touchStartX = null;
  $("#readerScroll").addEventListener("pointerdown", (e) => {
    touchStartX = e.pointerType === "touch" ? e.clientX : null;
  });
  $("#readerScroll").addEventListener("pointerup", (e) => {
    if (touchStartX === null) return;
    const distance = e.clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(distance) > 55) distance < 0 ? reader.next() : reader.prev();
  });
  $("#readerScroll").addEventListener("pointercancel", () => { touchStartX = null; });
  window.addEventListener("resize", () => reader.reflow());

  function bumpFont(d) {
    const v = Math.min(24, Math.max(16, state.settings.font + d));
    state.settings.font = v;
    $("#reader").style.setProperty("--reader-font", v + "px");
    reader.reflow();
    save();
    toast("Shrift: " + v + "px");
  }

  $("#themeBtn").addEventListener("click", () => {
    state.settings.theme = state.settings.theme === "dark" ? "light" : "dark";
    document.body.dataset.theme = state.settings.theme;
    save();
  });

  $("#collapseBtn").addEventListener("click", () => {
    const app = $("#app");
    state.settings.collapsed = !state.settings.collapsed;
    app.classList.toggle("is-collapsed", state.settings.collapsed);
    $("#collapseBtn").setAttribute("aria-expanded", String(!state.settings.collapsed));
    save();
  });

  $("#menuBtn").addEventListener("click", () => {
    const app = $("#app");
    const open = app.classList.toggle("is-open");
    $("#scrim").hidden = !open;
  });
  $("#scrim").addEventListener("click", () => {
    $("#app").classList.remove("is-open");
    $("#scrim").hidden = true;
  });

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault(); $("#searchInput").focus(); $("#searchInput").select();
    }
    if (e.key === "Escape") {
      if (!$("#reader").hidden) reader.close();
      else if ($("#app").classList.contains("is-open")) {
        $("#app").classList.remove("is-open"); $("#scrim").hidden = true;
      }
    }
    if (!$("#reader").hidden) {
      if (e.key === "ArrowRight") { e.preventDefault(); reader.next(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); reader.prev(); }
    }
  });

  /* ---------- boot ---------- */
  document.body.dataset.theme = state.settings.theme;
  $("#app").classList.toggle("is-collapsed", !!state.settings.collapsed);

  const hash = location.hash.replace("#/", "");
  if (hash.startsWith("kitob/")) { state.route = "book"; state.bookId = hash.split("/")[1]; }
  else if (["home", "catalog", "library", "settings"].includes(hash)) state.route = hash;

  render();

  // Katalog ma'lumotlari — data/books.json (Pages CMS shu faylni tahrirlaydi).
  // Fayl topilmasa yoki file:// rejimida bo'lsa, assets/data.js dagi zaxira ishlatiladi.
  fetch("data/books.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (Array.isArray(d) && d.length) { BOOKS = d; render(); }
    })
    .catch(function () {});
})();
