(function () {
  const app = document.getElementById("app");
  const M = window.MUSEUMS, CATS = window.CATS;
  const TOUR = { interior: "جولة داخل القاعات", site: "جولة في الساحة والموقع", aerial: "صورة جوية تفاعلية", walk: "جولة مصوّرة" };
  const state = { cat: "all", q: "", tour: "all" };
  let map = null;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const aerialUrl = (m) => `https://maps.google.com/maps?q=${m.lat},${m.lng}&t=k&z=${m.zoom || 17}&output=embed&hl=ar`;
  const svUrl = (m) => m.tour === "aerial" ? aerialUrl(m)
    : `https://maps.google.com/maps?layer=c&cbll=${m.lat},${m.lng}&cbp=11,${m.heading || 0},0,0,0&output=svembed&hl=ar`;
  const mapsUrl = (m) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.fr)}`;
  const img = (file, w) => `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${w}`;
  const filePage = (file) => `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;
  const norm = (s) => s.toLowerCase().replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");

  let speakBtn = null;
  function stopSpeak() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    if (speakBtn) { speakBtn.textContent = "▶ استمع إلى الشرح"; speakBtn = null; }
  }
  function speak(piece, btn) {
    if (!("speechSynthesis" in window)) return;
    if (speakBtn === btn) { stopSpeak(); return; }
    stopSpeak();
    const u = new SpeechSynthesisUtterance(piece.t + ". " + piece.d);
    u.lang = "ar-SA"; u.rate = 0.95;
    const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith("ar"));
    if (v) u.voice = v;
    u.onend = u.onerror = () => { if (speakBtn === btn) stopSpeak(); };
    speakBtn = btn; btn.textContent = "■ إيقاف الشرح";
    speechSynthesis.speak(u);
  }

  function card(m) {
    const pic = m.img
      ? `<img src="${img(m.img[0], 640)}" alt="" loading="lazy" decoding="async" onerror="this.remove()">`
      : "";
    return `<a class="card cat-${m.cat}" href="#/m/${m.id}">
      <div class="card-art">${pic}
        <span class="tag ${m.tour}">${TOUR[m.tour]}</span>
        ${m.tour === "aerial" || m.tour === "walk" ? "" : `<span class="badge360" aria-hidden="true">360°</span>`}
      </div>
      <div class="card-body">
        <p class="where">${esc(m.city)}</p>
        <h3>${esc(m.name)}</h3>
        <p class="lead">${esc(m.lead)}</p>
        <span class="go">${m.tour === "aerial" ? "استكشف الموقع" : m.tour === "walk" ? "ابدأ الجولة المصوّرة" : "ابدأ الجولة"} <span aria-hidden="true">←</span></span>
      </div>
    </a>`;
  }

  function filtered() {
    const q = norm(state.q.trim());
    return M.filter((m) =>
      (state.cat === "all" || m.cat === state.cat) &&
      (state.tour === "all" || m.tour === state.tour) &&
      (!q || norm([m.name, m.fr, m.city, m.region, m.era].join(" ")).includes(q)));
  }

  function renderGrid() {
    const list = filtered();
    document.getElementById("grid").innerHTML = list.length
      ? list.map(card).join("")
      : `<p class="empty">لا يوجد متحف مطابق. جرّب كلمة أخرى أو اختر «كل المتاحف».</p>`;
    document.getElementById("count").textContent = `${list.length} من ${M.length}`;
  }

  function buildMap() {
    const el = document.getElementById("map");
    if (!el || !window.L) { if (el) el.closest(".mapsec").hidden = true; return; }
    if (map) { map.remove(); map = null; }
    map = L.map(el, { scrollWheelZoom: false }).setView([34.6, 9.8], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    const color = { archaeology: "#a8482a", heritage: "#1d5c86", modern: "#5f6b2f" };
    const pts = [];
    M.forEach((m) => {
      pts.push([m.lat, m.lng]);
      L.circleMarker([m.lat, m.lng], { radius: 9, color: "#fff", weight: 2, fillColor: color[m.cat], fillOpacity: 1 })
        .addTo(map)
        .bindPopup(`<div dir="rtl" class="pop"><strong>${esc(m.name)}</strong><span>${esc(m.city)}</span><a href="#/m/${m.id}">${m.tour === "aerial" || m.tour === "walk" ? "استكشف الموقع" : "ابدأ الجولة 360°"} ←</a></div>`);
    });
    map.fitBounds(pts, { padding: [30, 30] });
  }

  function home(scrollToMap) {
    document.title = "متاحف تونس — جولات افتراضية 360°";
    const interior = M.filter((m) => m.tour === "interior").length;
    const H = window.HERO_IMG;
    app.innerHTML = `
      <section class="hero" style="--hero:url('${img(H[0], 1600)}')">
        <div class="hero-in">
          <p class="kicker">ثلاثة آلاف سنة من التاريخ</p>
          <h1>تجوّل داخل متاحف تونس <em>بزاوية 360 درجة</em></h1>
          <p class="sub">من فسيفساء باردو إلى بيوت كركوان البونية وقباب جربة: اختر متحفاً، ثم اسحب الصورة لتنظر حولك وتتنقّل بين القاعات.</p>
          <div class="cta">
            <a class="btn primary" href="#/m/bardo">ابدأ من متحف باردو</a>
            <a class="btn ghost" href="#/map">تصفّح الخريطة</a>
          </div>
          <dl class="stats">
            <div><dt>متحفاً وموقعاً</dt><dd>${M.length}</dd></div>
            <div><dt>جولة داخل القاعات</dt><dd>${interior}</dd></div>
            <div><dt>جهات من البلاد</dt><dd>${new Set(M.map((m) => m.region)).size}</dd></div>
          </dl>
        </div>
        <p class="hero-credit">فسيفساء فيرجيل، متحف باردو. تصوير ${esc(H[1])}، ${esc(H[2])}</p>
      </section>

      <section class="how">
        <div><b>1</b><h3>اختر متحفاً</h3><p>تصفّح حسب النوع أو ابحث باسم المدينة.</p></div>
        <div><b>2</b><h3>انظر حولك</h3><p>اسحب الصورة في كل الاتجاهات بالفأرة أو بالإصبع.</p></div>
        <div><b>3</b><h3>تنقّل واقرأ</h3><p>اضغط الأسهم للانتقال بين القاعات، واقرأ تاريخ المتحف أسفل الجولة.</p></div>
      </section>

      <section class="browse" id="museums">
        <div class="sec-head">
          <h2>المتاحف</h2>
          <span id="count" class="count"></span>
        </div>
        <div class="tools">
          <div class="chips" role="group" aria-label="التصنيف">
            ${Object.entries(CATS).map(([k, v]) => `<button type="button" data-cat="${k}" class="${state.cat === k ? "on" : ""}">${v}</button>`).join("")}
          </div>
          <div class="row">
            <label class="search"><span class="sr">بحث</span>
              <input id="q" type="search" placeholder="ابحث باسم المتحف أو المدينة…" value="${esc(state.q)}">
            </label>
            <select id="tour" aria-label="نوع الجولة">
              <option value="all">كل الجولات</option>
              <option value="interior">داخل القاعات فقط</option>
              <option value="site">الساحة والموقع</option>
              <option value="walk">جولة مصوّرة</option>
            </select>
          </div>
        </div>
        <div id="grid" class="grid"></div>
      </section>

      <section class="mapsec" id="mapsec">
        <div class="sec-head"><h2>المتاحف على الخريطة</h2>
          <p class="legend"><i style="background:#a8482a"></i>آثار <i style="background:#1d5c86"></i>تراث وفنون <i style="background:#5f6b2f"></i>علوم وتاريخ معاصر</p>
        </div>
        <div id="map" dir="ltr" role="region" aria-label="خريطة المتاحف"></div>
      </section>`;
    document.getElementById("tour").value = state.tour;
    renderGrid();
    buildMap();
    app.querySelector(".chips").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      state.cat = b.dataset.cat;
      app.querySelectorAll(".chips button").forEach((x) => x.classList.toggle("on", x === b));
      renderGrid();
    });
    document.getElementById("q").addEventListener("input", (e) => { state.q = e.target.value; renderGrid(); });
    document.getElementById("tour").addEventListener("change", (e) => { state.tour = e.target.value; renderGrid(); });
    if (scrollToMap) requestAnimationFrame(() => document.getElementById("mapsec").scrollIntoView());
  }

  function museum(id) {
    const i = M.findIndex((m) => m.id === id);
    if (i < 0) return notFound();
    const m = M[i], prev = M[(i - 1 + M.length) % M.length], next = M[(i + 1) % M.length];
    document.title = `${m.name} — ${m.tour === "aerial" ? "صورة جوية" : m.tour === "walk" ? "جولة مصوّرة" : "جولة 360°"}`;
    const P = (window.PIECES && window.PIECES[m.id]) || m.highlights.map((h) => ({ t: h, d: "" }));
    const W = (window.WALKS && window.WALKS[m.id]) || null;
    const shots = W ? W.flatMap((st, si) => st.shots.map((x) => ({ f: x[0], by: x[1], lic: x[2], si }))) : [];
    const RING = W && m.ring ? m.ring.map((f) => shots.find((x) => x.f === f)).filter(Boolean) : [];
    const bg = m.img ? ` style="--hero:url('${img(m.img[0], 1600)}')"` : "";
    app.innerHTML = `
      <article class="museum cat-${m.cat}">
        <header class="m-head"${bg}>
          <div class="m-head-in">
            <nav class="crumbs"><a href="#/">المتاحف</a> <span aria-hidden="true">‹</span> ${esc(m.region)}</nav>
            <span class="tag ${m.tour}">${TOUR[m.tour]}</span>
            <h1>${esc(m.name)}</h1>
            <p class="fr" dir="ltr" lang="fr">${esc(m.fr)}</p>
            <p class="lead">${esc(m.lead)}</p>
            <a class="btn primary" href="#tour-box" id="go-tour">${m.tour === "aerial" ? "شاهد الموقع من الجو" : m.tour === "walk" ? "ادخل الجولة المصوّرة" : "ادخل الجولة 360°"}</a>
          </div>
          ${m.img ? `<p class="hero-credit">تصوير ${esc(m.img[1])}، ${esc(m.img[2])}</p>` : ""}
        </header>

        <div class="wrap">
          <section class="tour" id="tour-box">
            <div class="frame" id="frame">
              ${W ? `<div class="walkv" id="walkv">
                <div class="w-bg" id="w-bg"></div>
                <img id="w-img" alt="">
                <div class="w-top">
                  <div class="w-stops" role="group" aria-label="معالم الجولة">${W.map((st, si) => `<button type="button" data-si="${si}">${esc(st.name)}</button>`).join("")}</div>
                  <span class="w-count" id="w-count"></span>
                </div>
                <button type="button" class="w-nav prev" id="w-prev" aria-label="الصورة السابقة">›</button>
                <button type="button" class="w-nav next" id="w-next" aria-label="الصورة التالية">‹</button>
                <p class="w-cap" id="w-cap"></p>
              </div>` : `<iframe id="sv" title="${m.tour === "aerial" ? "صورة جوية" : "جولة 360°"} — ${esc(m.name)}" src="${svUrl(m)}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>`}
              <div class="hud">
                <button type="button" id="b-guide" aria-expanded="false" aria-controls="guide"><span aria-hidden="true">◈</span> دليل القطع</button>
                <button type="button" id="b-walk"><span aria-hidden="true">⤢</span> <span class="lbl">وضع التجوال</span></button>
              </div>
              <aside class="guide" id="guide" hidden aria-label="دليل القطع">
                <header><h2>دليل القطع</h2><button type="button" id="g-close" aria-label="إغلاق الدليل">×</button></header>
                <p class="g-note">اختر قطعة لتقرأ عنها أو تسمع شرحها وأنت تتجوّل.</p>
                <ol class="g-list">
                  ${P.map((p, k) => `<li><button type="button" class="g-item" data-k="${k}" aria-expanded="false"><b>${k + 1}</b><span>${esc(p.t)}</span></button>
                    <div class="g-body" hidden>
                      ${p.img ? `<img src="${img(p.img[0], 640)}" alt="${esc(p.t)}" loading="lazy" onerror="this.remove()">` : ""}
                      <p>${esc(p.d)}</p>
                      <button type="button" class="g-speak" data-k="${k}">▶ استمع إلى الشرح</button>
                    </div></li>`).join("")}
                </ol>
              </aside>
            </div>
            <div class="tour-bar">
              <p class="hint">${W ? "جولة بصور حقيقية من الموقع: تقدّم بالسهمين أو بلوحة المفاتيح، واختر المعلَم من الأعلى. لا توجد بعدُ صور 360° لهذا الموقع على Google." : m.tour === "aerial" ? "لا توجد بعدُ صور 360° لهذا الموقع على Google، فنعرضه بصورة جوية: اسحب للتنقّل وكبّر لرؤية الأطلال." : `اسحب بالفأرة أو بالإصبع للدوران 360°، واضغط على الأسهم البيضاء للتنقّل.${m.tour === "site" ? " هذه الجولة تبدأ من ساحة المتحف أو الموقع الأثري." : ""}`}</p>
              <div class="btns">
                <button id="reset" type="button">العودة إلى نقطة البداية</button>
                <a class="btn" href="${mapsUrl(m)}" target="_blank" rel="noopener">الموقع على الخريطة</a>
              </div>
            </div>
          </section>

          ${RING.length ? `<section class="extra">
            <h2>غرفة صور الحمّام</h2>
            <div class="ring" id="ring" role="group" aria-label="غرفة صور دائرية، اسحب للدوران">
              <div class="ring-in" id="ring-in">${RING.map((x, i) => `<button type="button" class="rp" data-i="${i}" style="--i:${i}" aria-label="تكبير الصورة ${i + 1}"><img src="${img(x.f, 800)}" alt="${esc(m.name)}، الحمّام الروماني، صورة ${i + 1}" loading="lazy" draggable="false"></button>`).join("")}</div>
              <span class="ring-hint" aria-hidden="true">↔ اسحب للدوران</span>
            </div>
            <div class="ring-bar"><button type="button" id="ring-l" aria-label="دوران لليسار">‹</button><p class="xnote" id="ring-cap"></p><button type="button" id="ring-r" aria-label="دوران لليمين">›</button></div>
            <p class="xnote">غرفة افتراضية تحيط بك فيها صور حقيقية للحمّام الروماني، لكنها صور منفصلة وليست بانوراما 360° متصلة. اضغط على أي صورة لتكبيرها.</p>
            <div class="lb" id="lb" hidden><button type="button" id="lb-x" aria-label="إغلاق">×</button><img id="lb-img" alt=""><p id="lb-cap"></p></div>
          </section>` : ""}
          ${m.video ? `<section class="extra">
            <h2>جولة بالفيديو</h2>
            <div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/${m.video[0]}" title="${esc(m.video[1])}" loading="lazy" allowfullscreen allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"></iframe></div>
            <p class="xnote">${esc(m.video[1])}. المصدر: ${esc(m.video[2])} على يوتيوب.</p>
          </section>` : ""}
          ${W ? `<section class="extra">
            <h2>الموقع من الجو</h2>
            <div class="vid"><iframe src="${aerialUrl(m)}" title="صورة جوية — ${esc(m.name)}" loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe></div>
            <p class="xnote">صورة بالأقمار الصناعية من خرائط Google: اسحب للتنقّل وكبّر لرؤية مخطّط الأطلال.</p>
          </section>` : ""}

          <div class="cols">
            <section class="story">
              <h2>نبذة تاريخية</h2>
              ${m.history.map((p) => `<p>${esc(p)}</p>`).join("")}
              <h2>قطع ومعالم لا تفوّتها</h2>
              <div class="pieces">${P.map((p, k) => `<article class="piece">
                ${p.img ? `<img src="${img(p.img[0], 640)}" alt="${esc(p.t)}" loading="lazy" onerror="this.remove()">` : ""}
                <div><h3><b>${k + 1}</b>${esc(p.t)}</h3><p>${esc(p.d)}</p></div>
              </article>`).join("")}</div>
            </section>
            <aside class="facts">
              <h2>بطاقة المتحف</h2>
              <dl>
                <dt>المكان</dt><dd>${esc(m.city)}</dd>
                <dt>الجهة</dt><dd>${esc(m.region)}</dd>
                <dt>التأسيس</dt><dd>${esc(m.founded)}</dd>
                <dt>الحقب المعروضة</dt><dd>${esc(m.era)}</dd>
                <dt>التصنيف</dt><dd>${esc(CATS[m.cat])}</dd>
              </dl>
            </aside>
          </div>

          <nav class="pager" aria-label="متاحف أخرى">
            <a href="#/m/${prev.id}"><small>المتحف السابق</small>${esc(prev.name)}</a>
            <a href="#/m/${next.id}"><small>المتحف التالي</small>${esc(next.name)}</a>
          </nav>
        </div>
      </article>`;
    document.getElementById("go-tour").addEventListener("click", (e) => {
      e.preventDefault(); document.getElementById("tour-box").scrollIntoView({ behavior: "smooth" });
    });
    const frame = document.getElementById("frame"), guide = document.getElementById("guide");
    const bGuide = document.getElementById("b-guide"), bWalk = document.getElementById("b-walk");
    const openGuide = (on) => { guide.hidden = !on; bGuide.setAttribute("aria-expanded", on); if (!on) stopSpeak(); };
    bGuide.addEventListener("click", () => openGuide(guide.hidden));
    document.getElementById("g-close").addEventListener("click", () => openGuide(false));
    guide.addEventListener("click", (e) => {
      const it = e.target.closest(".g-item"), sp = e.target.closest(".g-speak");
      if (it) {
        const body = it.nextElementSibling, open = body.hidden;
        guide.querySelectorAll(".g-body").forEach((x) => { x.hidden = true; });
        guide.querySelectorAll(".g-item").forEach((x) => x.setAttribute("aria-expanded", "false"));
        stopSpeak();
        if (open) { body.hidden = false; it.setAttribute("aria-expanded", "true"); }
      }
      if (sp) speak(P[+sp.dataset.k], sp);
    });
    // زرّ الاستماع يظهر فقط إن وُجد صوت عربي على جهاز الزائر
    const refreshSpeak = () => {
      const has = "speechSynthesis" in window && speechSynthesis.getVoices().some((v) => v.lang && v.lang.toLowerCase().startsWith("ar"));
      guide.querySelectorAll(".g-speak").forEach((x) => { x.hidden = !has; });
    };
    refreshSpeak();
    if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = refreshSpeak;
    const syncWalk = () => {
      const on = document.fullscreenElement === frame;
      bWalk.querySelector(".lbl").textContent = on ? "الخروج من التجوال" : "وضع التجوال";
      frame.classList.toggle("walking", on);
    };
    bWalk.addEventListener("click", () => {
      if (document.fullscreenElement) { document.exitFullscreen(); return; }
      const req = frame.requestFullscreen || frame.webkitRequestFullscreen;
      if (req) Promise.resolve(req.call(frame)).catch(() => {});
    });
    document.onfullscreenchange = syncWalk;
    let wi = 0;
    const showShot = (k) => {
      if (!shots.length) return;
      wi = (k + shots.length) % shots.length;
      const sh = shots[wi], el = document.getElementById("w-img"), src = img(sh.f, 1280);
      el.classList.remove("in"); el.src = src; el.alt = `${W[sh.si].name}، ${m.name}`;
      el.onload = () => el.classList.add("in");
      el.onerror = () => { if (el.src === src && shots.length > 1) showShot(wi + 1); };
      document.getElementById("w-bg").style.backgroundImage = `url("${img(sh.f, 320)}")`;
      document.getElementById("w-count").textContent = `${wi + 1} / ${shots.length}`;
      document.getElementById("w-cap").innerHTML = `<b>${esc(W[sh.si].name)}</b> <span>تصوير ${esc(sh.by)}، ${esc(sh.lic)}</span>`;
      document.querySelectorAll(".w-stops button").forEach((x) => x.classList.toggle("on", +x.dataset.si === sh.si));
      new Image().src = img(shots[(wi + 1) % shots.length].f, 1280);
    };
    if (W) {
      const v = document.getElementById("walkv");
      document.getElementById("w-next").addEventListener("click", () => showShot(wi + 1));
      document.getElementById("w-prev").addEventListener("click", () => showShot(wi - 1));
      v.querySelector(".w-stops").addEventListener("click", (e) => {
        const bt = e.target.closest("button"); if (bt) showShot(shots.findIndex((x) => x.si === +bt.dataset.si));
      });
      document.onkeydown = (e) => {
        if (!document.getElementById("walkv") || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
        if (e.key === "ArrowLeft") showShot(wi + 1);
        if (e.key === "ArrowRight") showShot(wi - 1);
      };
      let x0 = null;
      v.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
      v.addEventListener("touchend", (e) => {
        if (x0 === null) return;
        const dx = e.changedTouches[0].clientX - x0; x0 = null;
        if (Math.abs(dx) > 40) showShot(wi + (dx > 0 ? 1 : -1));
      });
      showShot(0);
    }
    if (RING.length) {
      const ring = document.getElementById("ring"), inner = document.getElementById("ring-in");
      const n = RING.length, step = 360 / n, W0 = 520, H0 = 380, R0 = W0 / (2 * Math.tan(Math.PI / n)), P0 = 540;
      ring.style.perspective = P0 + "px";
      inner.style.setProperty("--w", W0 + "px"); inner.style.setProperty("--h", H0 + "px");
      inner.querySelectorAll(".rp").forEach((b) => { b.style.transform = `rotateY(${b.dataset.i * step}deg) translateZ(${-R0}px)`; });
      let ang = 0, vel = 0, down = false, moved = 0, lastX = 0, auto = !matchMedia("(prefers-reduced-motion: reduce)").matches, raf = 0;
      const front = () => ((Math.round(-ang / step) % n) + n) % n;
      const cap = () => { const x = RING[front()]; document.getElementById("ring-cap").textContent = `${front() + 1} / ${n}. تصوير ${x.by}، ${x.lic}`; };
      const draw = () => { inner.style.transform = `translateZ(${P0}px) rotateY(${ang}deg)`; cap(); };
      const tick = () => {
        if (!document.getElementById("ring")) return;
        if (!down) { ang += vel; vel *= 0.94; if (Math.abs(vel) < 0.02) vel = 0; if (auto && vel === 0) ang -= 0.06; }
        draw(); raf = requestAnimationFrame(tick);
      };
      ring.addEventListener("pointerdown", (e) => { down = true; moved = 0; lastX = e.clientX; vel = 0; auto = false; ring.setPointerCapture(e.pointerId); });
      ring.addEventListener("pointermove", (e) => { if (!down) return; const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx); ang += dx * 0.25; vel = dx * 0.25; });
      ring.addEventListener("pointerup", () => { down = false; });
      ring.addEventListener("pointercancel", () => { down = false; });
      const spin = (d) => { auto = false; vel = d * 3; };
      document.getElementById("ring-l").addEventListener("click", () => spin(1));
      document.getElementById("ring-r").addEventListener("click", () => spin(-1));
      const lb = document.getElementById("lb");
      const closeLb = () => { lb.hidden = true; };
      document.getElementById("lb-x").addEventListener("click", closeLb);
      lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
      inner.addEventListener("click", (e) => {
        const b = e.target.closest(".rp"); if (!b || moved > 6) return;
        const x = RING[+b.dataset.i];
        document.getElementById("lb-img").src = img(x.f, 1600);
        document.getElementById("lb-cap").textContent = `تصوير ${x.by}، ${x.lic}`;
        lb.hidden = false;
      });
      cancelAnimationFrame(window.__ringRaf); raf = requestAnimationFrame(tick); window.__ringRaf = raf;
    }
    document.getElementById("reset").addEventListener("click", () => {
      if (W) showShot(0); else document.getElementById("sv").src = svUrl(m);
    });
  }

  function about() {
    document.title = "عن الموقع — متاحف تونس";
    app.innerHTML = `
      <article class="page">
        <h1>عن الموقع</h1>
        <p class="lead">«متاحف تونس» دليل تاريخي يعرّف بأهم المتاحف التونسية ويتيح زيارتها افتراضياً بزاوية 360 درجة.</p>
        <h2>كيف تعمل الجولات؟</h2>
        <p>تُعرض الجولات مباشرة من Google Street View، وهي صور بانورامية التقطها Google أو زوّار المتاحف أنفسهم. لذلك تحتاج إلى اتصال بالإنترنت، وتختلف التغطية من متحف إلى آخر: بعض المتاحف مصوّرة من داخل القاعات، وأخرى من الساحة أو الموقع الأثري فقط، وقد ميّزنا ذلك بشارة على كل بطاقة.</p>
        <h2>المحتوى</h2>
        <p>النصوص التاريخية موجزة وغايتها التعريف. الصور من ويكيميديا كومنز برخص حرّة، وأسماء مصوّريها في صفحة <a href="#/credits">حقوق الصور</a>.</p>
        <h2>التصميم</h2>
        <p>صمّم هذا الموقع مروان سليماني.</p>
        <p><a class="btn" href="#/">العودة إلى المتاحف</a></p>
      </article>`;
  }

  function credits() {
    document.title = "حقوق الصور — متاحف تونس";
    const H = window.HERO_IMG;
    const row = (label, im) => `<tr><td>${esc(label)}</td><td>${esc(im[1])}</td><td>${esc(im[2])}</td><td><a href="${filePage(im[0])}" target="_blank" rel="noopener">المصدر</a></td></tr>`;
    app.innerHTML = `
      <article class="page wide">
        <h1>حقوق الصور</h1>
        <p class="lead">كل الصور من ويكيميديا كومنز وتُستعمل وفق رخصها. الجولات 360° من Google Street View.</p>
        <div class="tablewrap"><table>
          <thead><tr><th>الصورة</th><th>المصوّر</th><th>الرخصة</th><th>الملف الأصلي</th></tr></thead>
          <tbody>
            ${row("الواجهة: فسيفساء فيرجيل", H)}
            ${M.filter((m) => m.img).map((m) => row(m.name, m.img)).join("")}
          </tbody>
        </table></div>
        <p>صور القطع داخل دليل كل متحف: ${Object.values(window.PIECES || {}).flat().filter((p) => p.img).map((p) => `<a href="${filePage(p.img[0])}" target="_blank" rel="noopener">${esc(p.t)}</a> (${esc(p.img[1])}، ${esc(p.img[2])})`).join("، ")}.</p>
        <p>الجولات المصوّرة (تلابت والسليوم): صور ${[...new Set(Object.values(window.WALKS || {}).flat().flatMap((st) => st.shots.map((x) => `${x[1]} (${x[2]})`)))].map(esc).join("، ")}، من ويكيميديا كومنز، واسم المصوّر ظاهر تحت كل صورة.</p>
        <p>الخريطة: © المساهمون في OpenStreetMap.</p>
        <p><a class="btn" href="#/">العودة إلى المتاحف</a></p>
      </article>`;
  }

  function notFound() {
    app.innerHTML = `<article class="page"><h1>الصفحة غير موجودة</h1><p><a class="btn" href="#/">العودة إلى المتاحف</a></p></article>`;
  }

  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    let nav = "home";
    if (map) { map.remove(); map = null; }
    stopSpeak();
    if (!h) home(false);
    else if (h === "map") { home(true); nav = "map"; }
    else if (h === "about") { about(); nav = "about"; }
    else if (h === "credits") { credits(); nav = ""; }
    else if (h.startsWith("m/")) museum(decodeURIComponent(h.slice(2)));
    else if (h === "tour-box") return;
    else notFound();
    document.querySelectorAll(".topbar nav a").forEach((a) => a.classList.toggle("on", a.dataset.nav === nav));
    if (h !== "map") window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();
