(function () {
  const app = document.getElementById("app");
  const M = window.MUSEUMS, CATS = window.CATS;
  const TOUR = { interior: "جولة داخل القاعات", site: "جولة في الساحة والموقع" };
  const state = { cat: "all", q: "", tour: "all" };

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const svUrl = (m) => `https://maps.google.com/maps?layer=c&cbll=${m.lat},${m.lng}&cbp=11,${m.heading || 0},0,0,0&output=svembed&hl=ar`;
  const mapsUrl = (m) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.fr)}`;
  const norm = (s) => s.toLowerCase().replace(/[ً-ْـ]/g, "").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");

  function card(m, i) {
    return `<a class="card cat-${m.cat}" href="#/m/${m.id}" style="--i:${i}">
      <div class="card-art" aria-hidden="true"><span>${esc(m.founded !== "—" ? m.founded : "360°")}</span></div>
      <div class="card-body">
        <span class="tag ${m.tour}">${TOUR[m.tour]}</span>
        <h3>${esc(m.name)}</h3>
        <p class="where">${esc(m.city)}</p>
        <p class="lead">${esc(m.lead)}</p>
        <span class="go">ابدأ الجولة 360° ←</span>
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

  function home() {
    document.title = "متاحف تونس — جولات 360°";
    const interior = M.filter((m) => m.tour === "interior").length;
    app.innerHTML = `
      <section class="hero">
        <p class="kicker">ثلاثة آلاف سنة من التاريخ</p>
        <h1>تجوّل داخل متاحف تونس<br><em>بزاوية 360 درجة</em></h1>
        <p class="sub">من فسيفساء باردو إلى بيوت كركوان البونية وقباب جربة: اختر متحفاً، ثم اسحب الصورة لتنظر حولك وتتنقّل بين القاعات.</p>
        <div class="stats">
          <div><b>${M.length}</b><span>متحفاً وموقعاً</span></div>
          <div><b>${interior}</b><span>جولة داخل القاعات</span></div>
          <div><b>${new Set(M.map((m) => m.region)).size}</b><span>جهات</span></div>
        </div>
      </section>
      <section class="browse">
        <div class="tools">
          <div class="chips" role="group" aria-label="التصنيف">
            ${Object.entries(CATS).map(([k, v]) => `<button data-cat="${k}" class="${state.cat === k ? "on" : ""}">${v}</button>`).join("")}
          </div>
          <div class="row">
            <label class="search"><span class="sr">بحث</span>
              <input id="q" type="search" placeholder="ابحث باسم المتحف أو المدينة…" value="${esc(state.q)}">
            </label>
            <select id="tour" aria-label="نوع الجولة">
              <option value="all">كل الجولات</option>
              <option value="interior">داخل القاعات فقط</option>
              <option value="site">الساحة والموقع</option>
            </select>
            <span id="count" class="count"></span>
          </div>
        </div>
        <div id="grid" class="grid"></div>
      </section>`;
    document.getElementById("tour").value = state.tour;
    renderGrid();
    app.querySelector(".chips").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      state.cat = b.dataset.cat;
      app.querySelectorAll(".chips button").forEach((x) => x.classList.toggle("on", x === b));
      renderGrid();
    });
    document.getElementById("q").addEventListener("input", (e) => { state.q = e.target.value; renderGrid(); });
    document.getElementById("tour").addEventListener("change", (e) => { state.tour = e.target.value; renderGrid(); });
  }

  function museum(id) {
    const i = M.findIndex((m) => m.id === id);
    if (i < 0) return notFound();
    const m = M[i], prev = M[(i - 1 + M.length) % M.length], next = M[(i + 1) % M.length];
    document.title = `${m.name} — جولة 360°`;
    app.innerHTML = `
      <article class="museum cat-${m.cat}">
        <nav class="crumbs"><a href="#/">المتاحف</a> <span>‹</span> ${esc(m.name)}</nav>
        <header class="m-head">
          <span class="tag ${m.tour}">${TOUR[m.tour]}</span>
          <h1>${esc(m.name)}</h1>
          <p class="fr" dir="ltr" lang="fr">${esc(m.fr)}</p>
          <p class="lead">${esc(m.lead)}</p>
        </header>

        <section class="tour" id="tour-box">
          <div class="frame">
            <iframe id="sv" title="جولة 360° — ${esc(m.name)}" src="${svUrl(m)}" loading="eager" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe>
          </div>
          <div class="tour-bar">
            <p class="hint">اسحب بالفأرة أو بالإصبع للدوران 360°، واضغط على الأسهم البيضاء للتنقّل.${m.tour === "site" ? " هذه الجولة تبدأ من ساحة المتحف أو الموقع الأثري." : ""}</p>
            <div class="btns">
              <button id="fs" type="button">ملء الشاشة</button>
              <button id="reset" type="button">إعادة إلى نقطة البداية</button>
              <a class="btn" href="${mapsUrl(m)}" target="_blank" rel="noopener">الموقع على الخريطة</a>
            </div>
          </div>
        </section>

        <div class="cols">
          <section class="story">
            <h2>نبذة تاريخية</h2>
            ${m.history.map((p) => `<p>${esc(p)}</p>`).join("")}
            <h2>لا تفوّت</h2>
            <ul class="hl">${m.highlights.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>
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

        <nav class="pager">
          <a href="#/m/${prev.id}"><small>السابق</small>${esc(prev.name)}</a>
          <a href="#/m/${next.id}"><small>التالي</small>${esc(next.name)}</a>
        </nav>
      </article>`;
    document.getElementById("fs").addEventListener("click", () => {
      const el = document.querySelector("#tour-box .frame");
      if (document.fullscreenElement) document.exitFullscreen();
      else (el.requestFullscreen || el.webkitRequestFullscreen).call(el);
    });
    document.getElementById("reset").addEventListener("click", () => {
      const f = document.getElementById("sv"); f.src = svUrl(m);
    });
  }

  function about() {
    document.title = "عن الموقع — متاحف تونس";
    app.innerHTML = `
      <article class="page">
        <h1>عن الموقع</h1>
        <p>«متاحف تونس» دليل تاريخي يعرّف بأهم المتاحف التونسية ويتيح زيارتها افتراضياً بزاوية 360 درجة.</p>
        <h2>كيف تعمل الجولات؟</h2>
        <p>تُعرض الجولات مباشرة من Google Street View، وهي صور بانورامية التقطها Google أو زوّار المتاحف أنفسهم. لذلك تحتاج إلى اتصال بالإنترنت، وتختلف التغطية من متحف إلى آخر: بعض المتاحف مصوّرة من داخل القاعات، وأخرى من الساحة أو الموقع الأثري فقط، وقد ميّزنا ذلك بشارة على كل بطاقة.</p>
        <h2>إضافة متحف</h2>
        <p>كل البيانات في الملف <code dir="ltr">js/museums.js</code>. يكفي نسخ عنصر وتغيير الاسم والنصوص والإحداثيات <code dir="ltr">lat / lng</code> لنقطة فيها صورة 360° على خرائط Google.</p>
        <p><a href="#/">← العودة إلى المتاحف</a></p>
      </article>`;
  }

  function notFound() {
    app.innerHTML = `<article class="page"><h1>الصفحة غير موجودة</h1><p><a href="#/">← العودة إلى المتاحف</a></p></article>`;
  }

  function route() {
    const h = location.hash.replace(/^#\/?/, "");
    if (!h) home();
    else if (h === "about") about();
    else if (h.startsWith("m/")) museum(decodeURIComponent(h.slice(2)));
    else notFound();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);
  route();
})();
