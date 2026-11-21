// works.js のデータからページを組み立てる
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const img = (key, alt, extra = "") => {
  const [w, h] = SIZES[key] || [4, 3];
  const cut = CUTS.has(key), comp = /^c\d/.test(key);
  const cls = comp ? ' class="comp"' : cut ? ' class="cut"' : "";
  return `<img src="images/${key}.${cut ? "png" : "jpg"}"${cls} alt="${esc(alt)}" width="${w}" height="${h}" loading="lazy" ${extra}>`;
};
const byNo = Object.fromEntries(WORKS.map((w) => [w.no, w]));


const themeVars = (no) => { const [c, t, on] = THEME[no]; return `--theme:${c};--theme-text:${t};--on:${on}`; };

/* ---------- トップ：表紙が動き出す ----------
   表紙の元データ（あ1.ai）から取り出した位置そのまま。
   [画像ファイル, 作品番号（空なら飾り）, 中心の横%, 中心の縦%, 幅%, 傾き(度)] */
const COVER = [
  ["o21", "10", 40.88, 55.18, 4.18, -16.4],
  ["o22", "15", 12.61, 70.30, 9.66, 35.1],
  ["o31", "12", 52.75, 42.69, 7.43, 21.8],
  ["o32", "01", 70.93, 65.79, 17.71, 0.0],
  ["o33", "03", 65.65, 32.60, 9.79, 3.5],
  ["o34", "08", 58.57, 53.96, 3.04, 33.8],
  ["o35", "13", 55.84, 73.20, 4.80, -159.2],
  ["o36", "06", 90.49, 28.76, 8.61, -6.1],
  ["o37", "07", 71.23, 46.96, 12.86, -133.5],
  ["o38", "02", 26.60, 41.48, 7.21, -138.7],
  ["o23", "06", 17.98, 52.31, 24.45, 0.5],
  ["o24", "14", 33.50, 76.13, 34.11, -18.2],
  ["o25", "", 37.87, 32.98, 18.26, 40.5],
  ["o3355", "16", 51.33, 62.09, 5.66, 57.5],
  ["o26", "16", 81.83, 81.72, 14.96, 97.2],
  ["o27", "15", 87.58, 66.29, 13.48, 0.0],
  ["o28", "08", 74.17, 26.10, 6.19, -28.0],
  ["o29", "11", 55.10, 25.09, 12.49, 31.8],
  ["o30", "09", 87.23, 43.37, 17.00, -67.1],
];

// 流れる帯：作品ごとに、その作品の色のタイルに「作品そのもの」の切り抜きをのせて並べる。
// 色と形でひと目で見分けられるように（切り抜きがない作品は写真）。同じ並びを2回つなげて切れ目なく流す
{
  const track = document.getElementById("marquee-track");
  const cut = {}; COVER.forEach(([f, no, , , w]) => { if (no && (!cut[no] || w > cut[no][1])) cut[no] = [f, w]; });
  const one = (hide) => WORKS.map((w) => {
    const c = cut[w.no], k = w.imgs[0][0];
    const im = c ? `<img class="mq-cut" src="images/cover/${c[0]}.png" alt="" loading="lazy">`
                 : `<img class="mq-photo" src="images/${k}.${CUTS.has(k) ? "png" : "jpg"}" alt="" loading="lazy">`;
    return `<a class="mq-item" href="#w${w.no}" style="--theme:${THEME[w.no][0]}"` +
      (hide ? ' aria-hidden="true" tabindex="-1"' : ` aria-label="${w.no} ${esc(w.title)}"`) + `>${im}</a>`;
  }).join("");
  if (track) track.innerHTML = one(false) + one(true);
}

const stage = document.getElementById("stage");
// スマホ（縦長）用の並べ方 [画像: 中心の横%, 中心の縦%, 幅%]
// スマホ：パソコンの表紙と同じ「人と作品がいっしょに飛び出す」並びを、人の絵と同じ縮尺で上半分に置く
// （CSS の .human のスマホ用の位置・幅と同じ数字）
const MT = { x: -5, y: 3, w: 110, h: 110 * (858.9 / 1207.56) / 1.6 };
// スマホ：奥（空のまん中あたり）に小さい作品、手前（画面のふち）に大きい作品を置いて、空間の奥行きを出す。
// 人の体（左上）には作品を重ねない。 [中心の横%, 中心の縦%, 幅%, 奥行き 0=奥〜1=手前]
const MOBILE = {
  // 作品どうしが重ならないように（実際の大きさを測って押しはなした位置）。人と弧・上のメニューをよけて、画面全体にまんべんなく散らす。押しやすいよう、いちばん小さくても幅11%（約45px）
  o35: [66.5, 29.2, 11, .2], o21: [8, 30, 11, .2], o31: [23.8, 29.7, 11, .2], o3355: [43.6, 25.9, 20, .6], o33: [84.3, 31, 12, .4],
  o34: [8, 42.1, 11, .2], o37: [36.9, 42.3, 15, .5], o22: [62, 45.8, 12, .4], o36: [93, 44.5, 11, .4],
  o23: [8.4, 56.1, 28, .8], o38: [29.3, 61, 13, .4], o28: [92.4, 62.5, 12, .3], o30: [59, 64, 22, 1], o27: [7, 70.1, 18, .8],
  o26: [12.2, 81.5, 15, .6], o24: [49.7, 90.1, 40, 1], o29: [87, 84, 15, .6], o25: [7, 95.1, 18, 1], o32: [93, 97.2, 22, 1],
};
const mq = matchMedia("(max-width: 700px)");
COVER.forEach(([file, no, x, y, wd, rot], i) => {
  const w = byNo[no];
  const b = document.createElement(w ? "button" : "span");
  b.className = "float" + (w ? "" : " deco");
  b.dataset.file = file;
  b.style.setProperty("--rot", rot + "deg");
  b.style.setProperty("--i", i);
  b.style.setProperty("--dur", `${4.5 + (i % 5) * 0.9}s`);
  b.style.setProperty("--depth", (0.5 + (i % 4) * 0.4).toFixed(2));
  b.innerHTML = `<span class="float-in"><img src="images/cover/${file}.png" alt="${w ? esc(w.title) : ""}"></span>` +
    (w ? `<span class="label"><b>${no}</b>${esc(w.title)}</span>` : "");
  if (w) {
    b.setAttribute("aria-label", `${no} ${w.title} を見る`);
    b.onclick = () => openWork(no, b);
  }
  stage.appendChild(b);
});
// 画面の幅でパソコン用／スマホ用の位置を切り替える
function placeCover() {
  stage.querySelectorAll(".float").forEach((b) => {
    const [, , px, py, pw] = COVER.find((c) => c[0] === b.dataset.file);
    const m = mq.matches;
    let [x, y, wd] = m ? [MT.x + px * MT.w / 100, MT.y + py * MT.h / 100, pw * MT.w / 100] : [px, py, pw];
    if (m) [x, y, wd] = MOBILE[b.dataset.file];
    b.style.setProperty("--z", m ? MOBILE[b.dataset.file][3] : 1);
    Object.assign(b.style, { left: x + "%", top: y + "%", width: wd + "%" });
    // 人の中心あたりから飛び出してくる距離
    const ox = m ? 12 : 50, oy = m ? 18 : 45; // スマホは人のあたりから飛び出す
    b.style.setProperty("--fx", `${(ox - x) * 0.8}cqw`);
    b.style.setProperty("--fy", `${(oy - y) * 0.8}cqh`);
  });
}
placeCover();
mq.addEventListener("change", placeCover);
// 表紙の動きを始める（effects.js のローディング後に呼ばれる）
window.startStage = () => stage.classList.add("ready");
setTimeout(() => stage.classList.contains("ready") || startStage(), 4000); // 万一のための保険

// マウスの動きで少し奥行きを出す
stage.addEventListener("pointermove", (e) => {
  const r = stage.getBoundingClientRect();
  stage.style.setProperty("--mx", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
  stage.style.setProperty("--my", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
});
stage.addEventListener("pointerleave", () => { stage.style.setProperty("--mx", 0); stage.style.setProperty("--my", 0); });

/* ---------- 作品一覧 ---------- */
document.getElementById("work-list").innerHTML = CATEGORIES.map((c) => `
  <div class="group">
    <div class="group-head">
      <h3><span>${c.en}</span>${c.name}</h3>
      <p>${esc(c.lead)}</p>
    </div>
    <div class="cards">
      ${WORKS.filter((w) => w.cat === c.id).map((w) => `
        <a class="card" href="#w${w.no}" style="${themeVars(w.no)}">
          <span class="card-img">${img(w.imgs[0][0], w.title)}</span>
          <span class="card-t"><b>${w.no}</b>${esc(w.title)}<small>${esc(w.sub)}</small></span>
        </a>`).join("")}
    </div>
  </div>`).join("");

/* ---------- 作品の詳細 ---------- */
const detail = document.getElementById("detail");
const detailBody = document.getElementById("detail-body");
const catName = (id) => CATEGORIES.find((c) => c.id === id);

let curNo = "";
function workHTML(w) {
  curNo = w.no;
  const [cover, ...rest] = w.imgs;
  const cap = Object.fromEntries(w.imgs);
  // PDFと同じ「枠からはみ出す切り抜き」画像に置きかえる（一緒に入っている写真は重ねて出さない）
  const skip = new Set(), shown = new Set();
  (PAIRS[w.no] || []).flat().forEach((k) => COMP[k] && COMP[k][1].forEach((m) => skip.add(m)));
  const swap = (ks) => ks.filter((k) => !skip.has(k)).map((k) => {
    if (!COMP[k]) return k;
    cap[COMP[k][0]] = cap[k];
    return COMP[k][0];
  }).filter((k) => !shown.has(k) && shown.add(k));
  const pairs = (PAIRS[w.no] || []).map(swap);
  const wide = WIDE[w.no] || [];
  const used = new Set([...(PAIRS[w.no] || []).flat(), ...skip]);
  const others = rest.filter(([k]) => !used.has(k)).map(([k]) => k);
  const i = WORKS.indexOf(w);
  const prev = WORKS[(i - 1 + WORKS.length) % WORKS.length];
  const next = WORKS[(i + 1) % WORKS.length];
  // --ar は写真の横÷縦。3枚並びのとき高さをそろえるのに使う
  const fig = (k) => { const [fw, fh] = SIZES[k] || [4, 3];
    return `<figure data-key="${k}" data-cap="${esc(cap[k])}"${/^c\d/.test(k) ? ' class="comp"' : ""} style="--ar:${(fw / fh).toFixed(3)}">${img(k, cap[k])}</figure>`; };
  // 写真を行ごとに分ける（同じ行の写真は高さをそろえる）。3枚なら1行、それ以外は2枚ずつ
  const lines = (ks, n) => {
    const per = wide.includes(n) && ks.length <= 2 ? 1 : ks.length === 3 ? 3 : 2;
    let html = "";
    for (let i = 0; i < ks.length; i += per) html += `<div class="frow">${ks.slice(i, i + per).map(fig).join("")}</div>`;
    return html;
  };
  let side = 0;
  const rowHTML = (h, t, ks, n) => {
    const big = ks.length >= 2 || wide.includes(n);   // 写真が2枚以上なら文章の下に横幅いっぱいで
    const cls = !ks.length ? "row solo" : big ? `row wide n${ks.length}` : `row ${side++ % 2 ? "flip" : ""} n${ks.length}`;
    const dg = (DIAGRAMS[curNo] || {})[n];
    const dgHTML = dg ? `<div class="diagram-row"><figure class="diagram"><picture><source media="(max-width: 700px)" srcset="images/${dg[0].replace(".svg", "-v.svg")}"><img src="images/${dg[0]}" alt="${esc(dg[1])}" loading="lazy"></picture></figure></div>` : "";
    const text = h ? `<div class="row-text"><span class="row-no">${String(n + 1).padStart(2, "0")}</span><h3>${esc(h)}</h3><p>${esc(t)}</p></div>` : "";
    return `<section class="${cls}">${text}${ks.length ? `<div class="figs">${lines(ks, n)}</div>` : ""}</section>${dgHTML}`;
  };
  return `
  <article class="work" data-no="${w.no}" style="${themeVars(w.no)}">
    <header class="work-hero">
      <div class="work-hero-in">
        <p class="work-cat">${catName(w.cat).en}　${catName(w.cat).name}</p>
        <div class="work-head">
          <span class="no">${w.no}</span>
          <div><p>${esc(w.sub)}</p><h2>${esc(w.title)}</h2></div>
        </div>
        <ul class="tags">${w.tags.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>
      </div>
    </header>
    <div class="work-cover" data-key="${cover[0]}" data-cap="${esc(cover[1])}">${img(cover[0], w.title + "：" + cover[1])}</div>
    ${w.meta.length ? `<dl class="meta">${w.meta.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>` : ""}
    <div class="rows">
      ${w.text.map(([h, t], n) => rowHTML(h, t, pairs[n] || [], n)).join("")}
      ${others.length ? rowHTML("", "", others, w.text.length) : ""}
    </div>
    <nav class="pager">
      <a href="#w${prev.no}"><small>PREV</small>${prev.no} ${esc(prev.title)}</a>
      <a href="#w${next.no}"><small>NEXT</small>${next.no} ${esc(next.title)}</a>
    </nav>
  </article>`;
}

function openWork(no, from) {
  const go = () => { location.hash = "w" + no; };
  window.playWipe ? playWipe(no, go, from) : go();
}
function closeWork() {
  history.pushState(null, "", location.pathname + location.search);
  route();
}
function route() {
  const m = location.hash.match(/^#w(\d\d)$/);
  if (m && byNo[m[1]]) {
    detailBody.innerHTML = workHTML(byNo[m[1]]);
    detail.hidden = false;
    detail.scrollTop = 0;
    document.body.classList.add("lock");
    requestAnimationFrame(() => detail.classList.add("open"));
    window.onWorkShown && onWorkShown(detailBody);
  } else if (!detail.hidden) {
    detail.classList.remove("open");
    document.body.classList.remove("lock");
    setTimeout(() => { if (!detail.classList.contains("open")) detail.hidden = true; }, 350);
  }
}
window.addEventListener("hashchange", route);
document.getElementById("detail-close").onclick = closeWork;
route();

/* ---------- 写真の拡大表示 ---------- */
const lb = document.getElementById("lb");
const lbImg = document.getElementById("lb-img");
const lbCap = document.getElementById("lb-cap");
let group = [], idx = 0;
function show(i) {
  idx = (i + group.length) % group.length;
  const el = group[idx];
  lbImg.src = `images/${el.dataset.key}.${CUTS.has(el.dataset.key) ? "png" : "jpg"}`;
  lbImg.alt = lbCap.textContent = el.dataset.cap;
}
detail.addEventListener("click", (e) => {
  const el = e.target.closest("[data-key]");
  if (!el) return;
  group = [...detail.querySelectorAll("[data-key]")];
  show(group.indexOf(el));
  lb.hidden = false;
});
const closeLb = () => { lb.hidden = true; };
lb.querySelector(".lb-close").onclick = closeLb;
lb.querySelector(".lb-prev").onclick = () => show(idx - 1);
lb.querySelector(".lb-next").onclick = () => show(idx + 1);
lb.addEventListener("click", (e) => { if (e.target === lb) closeLb(); });
document.addEventListener("keydown", (e) => {
  if (!lb.hidden) {
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  } else if (!detail.hidden && e.key === "Escape") closeWork();
});
