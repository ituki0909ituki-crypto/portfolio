// ===== エフェクト（動き）。main.js のあとに読み込む =====
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

/* --- 1. 表紙が動き出す（ローディング画面はなし） --- */
function startAll() {
  startStage();
  // 表紙の作品が飛び出し終わったら、ドラッグできる状態に
  setTimeout(() => document.querySelectorAll(".float").forEach((f) => f.classList.add("settled")), 3200);
}
startAll();

/* --- 2. 詳細を開くときに帯が横切る --- */
const wipe = document.createElement("div");
wipe.className = "wipe";
wipe.innerHTML = "<i></i><i></i><i></i>";
document.body.appendChild(wipe);
let wiping = false;
window.playWipe = (cat, done, fromEl) => {
  if (reduce || wiping) return done();
  wiping = true;
  if (fromEl) fromEl.classList.add("pop");
  wipe.style.setProperty("--c", THEME[cat] ? THEME[cat][0] : "var(--red)");
  setTimeout(() => {
    wipe.className = "wipe in";
    setTimeout(() => {
      // 帯で隠れているあいだに開くので、作品ページのせり上がりは不要
      const d = document.getElementById("detail"); d.classList.add("instant");
      done();
      setTimeout(() => d.classList.remove("instant"), 100);
      if (fromEl) fromEl.classList.remove("pop");
      wipe.className = "wipe out";
      setTimeout(() => { wipe.className = "wipe"; wiping = false; }, 750);
    }, 620);
  }, fromEl ? 220 : 0);
};
// 作品一覧のカードや、詳細の「前／次」も帯で切り替え
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#w"]');
  if (!a) return;
  const no = a.getAttribute("href").slice(2);
  const w = WORKS.find((x) => x.no === no);
  if (!w) return;
  e.preventDefault();
  playWipe(no, () => { location.hash = "w" + no; });
});

/* --- 3. 表紙：スクロールで奥行き・ドラッグ --- */
const stageEl = document.getElementById("stage");
let ticking = false;
addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { stageEl.style.setProperty("--sy", Math.min(scrollY, 1200).toFixed(0)); ticking = false; });
}, { passive: true });

stageEl.querySelectorAll("button.float").forEach((b) => {
  let sx, sy, ox, oy, moved = false, down = false;
  b.addEventListener("pointerdown", (e) => {
    if (!b.classList.contains("settled")) return;
    down = true; moved = false;
    sx = e.clientX; sy = e.clientY;
    ox = parseFloat(b.style.getPropertyValue("--dx")) || 0;
    oy = parseFloat(b.style.getPropertyValue("--dy")) || 0;
    b.setPointerCapture(e.pointerId);
  });
  b.addEventListener("pointermove", (e) => {
    if (!down) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!moved && Math.hypot(dx, dy) < 6) return;
    moved = true;
    b.classList.add("dragging");
    b.style.setProperty("--dx", ox + dx + "px");
    b.style.setProperty("--dy", oy + dy + "px");
  });
  const up = () => { down = false; b.classList.remove("dragging"); };
  b.addEventListener("pointerup", up);
  b.addEventListener("pointercancel", up);
  // ドラッグしたときは詳細を開かない
  b.addEventListener("click", (e) => { if (moved) { e.stopImmediatePropagation(); moved = false; } }, true);
});

/* --- 4. スクロールで登場 --- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => {
    if (!en.isIntersecting) return;
    const t = en.target;
    if (t.dataset.reveal === "band") {
      // 帯はいつも左から右へ伸びる（右へ出ていった帯が、次の行で左から入ってくる）。
      // 伸びきってから写真を順番に出す
      const BAND = 0.7, STEP = 0.15;
      t.style.setProperty("--dur", `${BAND}s`);
      t.querySelectorAll("figure").forEach((f, i) => { f.style.transitionDelay = `${(BAND + i * STEP).toFixed(2)}s`; });
      t.getBoundingClientRect();
      requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("shown")));
    } else t.classList.add("shown");
    io.unobserve(t);
  });
}, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

function splitChars(el) {
  if (el.dataset.split) return;
  el.dataset.split = 1;
  el.innerHTML = [...el.textContent].map((c, i) => `<span style="transition-delay:${i * 0.04}s">${c === " " ? "&nbsp;" : c}</span>`).join("");
  el.classList.add("chars");
}
function reveal(root) {
  const add = (sel, type = "") => root.querySelectorAll(sel).forEach((el, i) => {
    if (el.dataset.reveal !== undefined) return;
    el.dataset.reveal = type;
    el.style.setProperty("--d", `${(i % 4) * 0.08}s`);
    io.observe(el);
  });
  add(".row-text"); add(".frow", "band"); add(".meta div");
  add(".card"); add(".group-head"); add(".about-grid > *"); add(".timeline li"); add(".work-cover", "wipe");
  // 作品ページの見出しは文字ごとに動かさない（段ごとの動きと重なってピクッとするため）
  root.querySelectorAll(".sec-title span").forEach((el) => { splitChars(el); io.observe(el); });
}
reveal(document);

// 詳細が開いたとき：中身に登場の動きをつける
window.onWorkShown = (body) => {
  // その作品の最初の帯はスタート地点：左へはみ出さず、最初の写真の左端から始める
  const first = body.querySelector(".frow");
  if (first) {
    first.classList.add("first");
    requestAnimationFrame(() => first.style.setProperty("--bl", `${first.querySelector("figure").offsetLeft}px`));
  }
  // 帯で切り替わったあとに、もう一度動くとしつこいので、
  // 最初の画面に見えている物は、はじめから出た状態にする（下の段はスクロールで登場）
  reveal(body);
  const vh = innerHeight, top0 = body.getBoundingClientRect().top; // 詳細はまだ画面の下にあるので、詳細の上端からの位置で判定
  body.querySelectorAll("[data-reveal]").forEach((el) => {
    if (el.getBoundingClientRect().top - top0 < vh) { el.classList.add("instant", "shown"); }
  });
  requestAnimationFrame(() => requestAnimationFrame(() => body.querySelectorAll(".instant").forEach((el) => el.classList.remove("instant"))));
};

// URLの #w08 などから直接開いたときは、main.js が先に動くので、ここで同じ準備をする
{ const d = document.getElementById("detail"); if (d && !d.hidden) onWorkShown(document.getElementById("detail-body")); }

/* --- 5. マウス：ついてくる丸・写真が傾く --- */
if (fine && !reduce) {
  const cur = document.createElement("div");
  cur.className = "cursor";
  document.body.appendChild(cur);
  let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
  addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; });
  (function loop() {
    cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
    cur.style.transform = `translate(${cx}px, ${cy}px)`;
    requestAnimationFrame(loop);
  })();
  const VIEW = "button.float, .human-hit, .peek, .card, [data-key], .pager a";
  document.addEventListener("pointerover", (e) => {
    const t = e.target.closest(VIEW);
    cur.classList.toggle("big", !!t);
  });
  document.addEventListener("pointerleave", () => cur.classList.add("hide"));
  document.addEventListener("pointerenter", () => cur.classList.remove("hide"));

  // 写真やカードがマウスの方に傾く
  let tilted = null;
  document.addEventListener("pointermove", (e) => {
    const el = e.target.closest(".card-img, .row figure img, .about-grid img");
    if (tilted && tilted !== el) { tilted.style.transform = ""; tilted = null; }
    if (!el) return;
    tilted = el;
    el.classList.add("tilt");
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) scale(1.02)`;
  });
}

/* --- 6. 作品一覧の端から、表紙の作品がひょこっと顔を出す --- */
// [画像, 作品番号, 左右(l/r), 縦の位置%, 傾き（表紙と同じ角度）, 出てくるまでの秒]
const PEEKS = [
  ["o38", "02", "l", 14, -139, 0], ["o30", "09", "r", 20, -67, 2.5], ["o23", "06", "l", 40, 0, 5],
  ["o29", "11", "r", 50, 32, 1.2], ["o22", "15", "l", 68, 35, 3.6], ["o27", "15", "r", 80, 0, 6.2],
];
const worksSec = document.getElementById("works");
PEEKS.forEach(([file, no, side, top, rot, delay]) => {
  const w = byNo[no];
  const b = document.createElement("button");
  b.className = `peek ${side}`;
  b.style.top = top + "%";
  b.style.setProperty("--r", rot + "deg");
  b.style.setProperty("--delay", delay + "s");
  b.style.setProperty("--t", 7 + (delay % 3) + "s");
  b.setAttribute("aria-label", `${no} ${w.title} を見る`);
  b.innerHTML = `<img src="images/cover/${file}.webp" alt="">`;
  b.onclick = () => openWork(no, b);
  worksSec.appendChild(b);
});

/* --- 7. 遊び心：全進全力の人 --- */
const humanEl = document.querySelector(".human");
// (1) 表紙の人を押すと、もう一回作品を蹴飛ばす
document.getElementById("human-hit").addEventListener("click", () => {
  if (!stageEl.classList.contains("ready")) return;
  humanEl.classList.remove("kick", "hop"); void humanEl.offsetWidth; humanEl.classList.add("kick");
  setTimeout(() => humanEl.classList.remove("kick"), 600);
  if (navigator.vibrate) navigator.vibrate(18);
  stageEl.querySelectorAll(".float").forEach((f) => {
    f.classList.remove("settled", "refly");
    f.style.removeProperty("--dx"); f.style.removeProperty("--dy");
    void f.offsetWidth;
    f.classList.add("refly");
  });
  clearTimeout(window._refly);
  window._refly = setTimeout(() => stageEl.querySelectorAll(".float").forEach((f) => { f.classList.remove("refly"); f.classList.add("settled"); }), 2000);
});
// 押せるとわかるように、表紙が見えているあいだ、ときどき跳ねる
if (!reduce) setInterval(() => {
  if (scrollY > innerHeight * 0.6 || humanEl.classList.contains("kick")) return;
  humanEl.classList.add("hop");
  setTimeout(() => humanEl.classList.remove("hop"), 520);
}, 5200);

// (2) 作品ページへ切り替えるとき、人が画面を横切る
{
  const m = document.createElement("img"); m.className = "wipe-man"; m.src = "images/cover/runner.svg"; m.alt = ""; wipe.appendChild(m);
  const orig = window.playWipe;
  window.playWipe = (cat, done, fromEl) => {
    if (!reduce && !wiping) m.animate(
      [{ transform: "translateX(-60vmin) scaleX(-1)", opacity: 1 }, { transform: "translateX(calc(100vw + 20vmin)) scaleX(-1)", opacity: 1 }],
      { duration: 640, delay: fromEl ? 230 : 10, easing: "cubic-bezier(.3, 0, .6, 1)", fill: "backwards" });
    orig(cat, done, fromEl);
  };
}

// (3) スクロールに合わせて画面の下を人が走る。走った跡が進み具合
if (!reduce) {
  const r = document.createElement("div");
  r.className = "runner"; r.setAttribute("aria-hidden", "true");
  r.innerHTML = '<i class="runner-trail"></i><img class="runner-man" src="images/cover/runner.svg" alt="">';
  document.body.appendChild(r);
  const detail = document.getElementById("detail");
  let last = -1, stopT, raf = 0, finaleSeen = false;
  const update = () => {
    raf = 0;
    const inDetail = detail && !detail.hidden;
    const sc = inDetail ? detail : document.scrollingElement;
    const max = sc.scrollHeight - sc.clientHeight;
    const y = sc.scrollTop;
    const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    // 表紙が見えているあいだと、最後の「全進全力」が見えているあいだは出さない
    const fin = !inDetail && document.getElementById("finale").getBoundingClientRect().top < innerHeight - 40;
    r.classList.toggle("on", (inDetail ? y > 40 : y > innerHeight * 0.5) && !fin);
    r.style.setProperty("--px", (p * (innerWidth - 16)).toFixed(1) + "px");
    if (last >= 0 && y !== last) {
      r.style.setProperty("--dir", y > last ? -1 : 1);
      r.classList.add("run");
      clearTimeout(stopT); stopT = setTimeout(() => r.classList.remove("run"), 140);
    }
    last = y;
  };
  const req = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener("scroll", req, { passive: true });
  detail && detail.addEventListener("scroll", req, { passive: true });
  addEventListener("resize", req);
  addEventListener("hashchange", () => { last = -1; setTimeout(req, 50); });
  req();
}

// (4) 最後まで見た人へ：人が駆け抜けて「全進全力」
{
  const fin = document.getElementById("finale");
  if (reduce) fin.classList.add("go");
  else new IntersectionObserver((es, o) => es.forEach((e) => {
    if (e.isIntersecting) { fin.classList.add("go"); o.disconnect(); }
  }), { threshold: 0.6 }).observe(fin);
}
