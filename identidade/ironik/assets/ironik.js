/* Ironik · manual vivo (v3) — feito com a skill motion-senior.
   Tudo que conta a história anda com a rolagem; o que roda sozinho pausa fora da tela. */
(() => {
  "use strict";
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const MOBILE = matchMedia("(max-width: 900px)").matches;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, t) => a + (b - a) * t;
  const E = { out: t => 1 - Math.pow(1 - t, 3), io: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) };
  const seg = (t, a, b, e = x => x) => e(clamp((t - a) / (b - a)));
  const OUT = "expo.out", IO = "power3.inOut";
  const scene = (id, fn) => { if (RM) { fn(1); return; } fn(0); ScrollTrigger.create({ trigger: "#" + id, start: "top top", end: "bottom bottom", onUpdate: s => fn(s.progress), onRefresh: s => fn(s.progress) }); };
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  scrollTo(0, 0);
  matchMedia("(max-width: 900px)").addEventListener("change", () => location.reload());

  /* rolagem suave só no desktop */
  let lenis = null;
  if (!RM && FINE && window.Lenis) {
    lenis = new window.Lenis({ lerp: .085, wheelMultiplier: .9, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); lenis.stop();
  }

  /* faixa que corre */
  $$(".mt").forEach(m => { const s = `<span>${m.dataset.t}</span>`.repeat(10); m.innerHTML = s + s; });

  /* divisão de texto */
  function split(el, mode) {
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    const out = [];
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 1) return walk(n);
      if (n.nodeType !== 3 || !n.textContent.trim()) return;
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.append(" ");
        const w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true");
        if (mode === "words") { w.textContent = part; out.push(w); }
        else [...part].forEach(ch => { const c = document.createElement("span"); c.className = "ch"; c.textContent = ch; w.append(c); out.push(c); });
        frag.append(w);
      });
      n.replaceWith(frag);
    });
    walk(el); return out;
  }
  const charsOf = new Map(); $$("[data-split]").forEach(el => charsOf.set(el, split(el)));
  const readWords = $$("[data-read]").map(el => split(el, "words"));

  /* aviso e cópia */
  let toastT;
  const toast = t => { const el = $("#toast"); el.textContent = t; gsap.fromTo(el, { y: 20, opacity: 0, xPercent: -50 }, { y: 0, opacity: 1, xPercent: -50, duration: .4, ease: OUT, overwrite: true }); clearTimeout(toastT); toastT = setTimeout(() => gsap.to(el, { opacity: 0, y: 20, duration: .3 }), 1800); };
  const copy = h => { const ok = () => toast("copiado " + h); navigator.clipboard && isSecureContext ? navigator.clipboard.writeText(h).then(ok, ok) : ok(); };

  /* ---------- capítulos que se sobrepõem ---------- */
  const secs = $$("#main > section"); secs.forEach((s, i) => (s.style.zIndex = i + 1));
  const covers = $$("#main > .cover"), stuck = covers.map(c => c.previousElementSibling);
  ScrollTrigger.addEventListener("refreshInit", () => stuck.forEach(s => { s.style.position = ""; s.style.top = ""; }));
  ScrollTrigger.addEventListener("refresh", () => stuck.forEach(s => { s.style.position = "sticky"; s.style.top = `${Math.min(0, innerHeight - s.offsetHeight)}px`; }));
  function setupCovers() {
    covers.forEach((cover, i) => {
      const prev = stuck[i], shade = document.createElement("div"); shade.className = "shade"; prev.appendChild(shade);
      const st = { trigger: cover, start: "top bottom", end: "top top", scrub: true };
      gsap.fromTo(shade, { opacity: 0 }, { opacity: .6, ease: "none", scrollTrigger: st });
      const sheet = prev.querySelector(":scope > .wrap");
      if (sheet) gsap.fromTo(sheet, { scale: 1, y: 0 }, { scale: .94, y: -50, ease: "none", scrollTrigger: { ...st } });
      gsap.fromTo(cover, { "--r": "36px" }, { "--r": "0px", ease: "none", scrollTrigger: { trigger: cover, start: "top bottom", end: "top 35%", scrub: true } });
      ScrollTrigger.create({ trigger: cover, start: "top top", onEnter: () => (prev.style.visibility = "hidden"), onLeaveBack: () => (prev.style.visibility = "") });
    });
  }

  /* ---------- revelações ---------- */
  function setupReveals() {
    $$("[data-reveal]").forEach(el => gsap.fromTo(el, { y: 56, opacity: 0 }, { y: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 100%", end: "top 78%", scrub: .6 } }));
    charsOf.forEach((chars, el) => {
      if (el.id === "heroTitle") return;
      const pinned = el.closest(".scene");
      const trig = pinned ? { trigger: pinned, start: "top 85%", end: "top 20%", scrub: .5 } : { trigger: el, start: "top 98%", end: "top 70%", scrub: .5 };
      gsap.fromTo(chars, FINE ? { opacity: 0, y: 10, filter: "blur(12px)" } : { opacity: 0, y: 10 }, { opacity: 1, y: 0, ...(FINE ? { filter: "blur(0px)" } : {}), ease: "none", stagger: .02, duration: .6, scrollTrigger: trig });
    });
    readWords.forEach(ws => gsap.to(ws, { opacity: 1, stagger: .1, ease: "none", scrollTrigger: { trigger: ws[0].parentElement, start: "top 78%", end: "bottom 45%", scrub: true } }));
    $$("[data-count]").forEach(el => { const to = +el.dataset.count; const f = s => (el.textContent = Math.round(to * E.out(s.progress))); ScrollTrigger.create({ trigger: el, start: "top 100%", end: "top 70%", scrub: true, onUpdate: f, onRefresh: f }); });
    $$("[data-giant]").forEach(l => gsap.fromTo(l.firstElementChild, { yPercent: 105, opacity: 0 }, { yPercent: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: l, start: "top 100%", end: "bottom bottom", scrub: .8 } }));
  }

  /* ---------- 01 capa: entrada, Nik que reage sozinho, paralaxe ---------- */
  const heroChars = charsOf.get($("#heroTitle")) || [];
  if (!RM) {
    gsap.set("[data-hero]", { y: 24, opacity: 0 });
    gsap.set(heroChars, FINE ? { opacity: 0, y: 10, filter: "blur(12px)" } : { opacity: 0, y: 10 });
    gsap.set("#nik", { yPercent: 14, opacity: 0 });
    gsap.set(".nav", { y: -20, opacity: 0 });
  }
  function heroIntro() {
    document.documentElement.classList.remove("is-loading");
    if (RM) return;
    gsap.timeline({ defaults: { ease: OUT } })
      .to(heroChars, { opacity: 1, y: 0, ...(FINE ? { filter: "blur(0px)" } : {}), duration: .6, stagger: .025, ease: "power2.out" }, .15)
      .to("[data-hero]", { y: 0, opacity: 1, duration: 1.2, stagger: .1 }, .5)
      .to("#nik", { yPercent: 0, opacity: 1, duration: 1.6 }, .25)
      .to(".nav", { y: 0, opacity: 1, duration: 1 }, .7)
      .add(() => lenis && lenis.start(), .9);
    gsap.to("#nkw", { yPercent: -10, scale: 1.06, ease: "none", scrollTrigger: { trigger: "#capa", start: "top top", end: "bottom top", scrub: true } });
    if (FINE) {
      const pw = $("#nik .pw"); gsap.set(pw, { transformPerspective: 1200 });
      const ry = gsap.quickTo(pw, "rotationY", { duration: 1.2, ease: "power3.out" }), rx = gsap.quickTo(pw, "rotationX", { duration: 1.2, ease: "power3.out" }), x = gsap.quickTo(pw, "x", { duration: 1.2, ease: "power3.out" });
      $("#capa").addEventListener("pointermove", e => { const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5; ry(nx * 16); rx(-ny * 10); x(-nx * 30); });
    }
    const ex = ["exp05", "exp04", "exp08", "exp12", "exp15", "exp18", "exp02", "exp09"], fr = ["ei, isso faz cócegas", "de novo?", "só mais uma cutucada", "acordei. já conta como cardio.", "tá, tá, eu olho.", "isso é assédio de guaxinim", "treino hoje? talvez.", "para. (não para.)"];
    ex.forEach(k => { const i = new Image(); i.src = `assets/img/${k}.webp`; });
    let ei = 0, on = true;
    const react = () => { const r = $("#react"), b = $("#bal"); r.src = `assets/img/${ex[ei % ex.length]}.webp`; b.textContent = fr[ei % fr.length]; ei++;
      gsap.timeline().fromTo(r, { scale: .3, opacity: 0, y: 20 }, { scale: 1, opacity: 1, y: 0, duration: .7, ease: "elastic.out(1,.55)", overwrite: true }, 0).fromTo(b, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: .4, ease: OUT, overwrite: true }, 0).to([r, b], { opacity: 0, duration: .35 }, 2.1); };
    (function loop() { if (on && !document.hidden) react(); gsap.delayedCall(3.4, loop); })();
    $("#nik").addEventListener("click", react);
    ScrollTrigger.create({ trigger: "#capa", start: "top 90%", end: "bottom 10%", onToggle: s => (on = s.isActive) });
  }

  /* ---------- 03 logo: a câmera mergulha no O ---------- */
  function setupLogo() {
    const cam = $("#lcam"), ring = $("#ring circle"), pill = $("#opill"), chips = $$("#chips .chw"), steps = $$("#lsteps li");
    let step = -1;
    scene("logo", t => {
      const enter = seg(t, 0, .12, E.out);
      const z = seg(t, .38, .55, E.io) * (1 - seg(t, .7, .82, E.io));
      cam.style.transform = `scale(${(lerp(.82, 1, enter) * lerp(1, 2.2, z)).toFixed(4)})`;
      cam.style.opacity = enter.toFixed(3);
      ring.style.strokeDashoffset = (1 - seg(t, .16, .3, E.io)).toFixed(3);
      pill.style.opacity = (seg(t, .26, .32) * (1 - seg(t, .38, .42))).toFixed(3);
      chips.forEach((c, i) => { const p = seg(t, .8 + i * .035, .88 + i * .035, E.out); c.style.opacity = p.toFixed(3); c.style.transform = `translateY(${((1 - p) * 40).toFixed(1)}px)`; });
      const s = t < .16 ? 0 : t < .38 ? 1 : t < .74 ? 2 : 3;
      if (s !== step) { step = s; steps.forEach((li, k) => li.classList.toggle("on", k === s)); }
    });
  }

  /* ---------- 04 travessia: o Nik gira e abre o capítulo rosa ---------- */
  function setupTravel() {
    if (RM) return;
    const obj = $("#travObj"), panel = $("#travPanel"), wipe = { p: 0 };
    gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: "#trav", start: "top top", end: "bottom bottom", scrub: .9 } })
      .fromTo("#travT", { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, ease: OUT }, 0)
      .fromTo("#travP", { opacity: 0, y: 30 }, { opacity: .8, y: 0, duration: 1, ease: OUT }, .4)
      .fromTo(obj, { x: () => innerWidth * .5, y: 120, rotationY: -70, rotationZ: 12, scale: .7 }, { x: 0, y: 0, rotationY: -10, rotationZ: 0, scale: 1, duration: 3, ease: OUT }, 0)
      .to(["#travT", "#travP"], { opacity: 0, y: -30, duration: 1 }, 3.4)
      .to(obj, { keyframes: { rotationY: [-10, 180, 350], scale: [1, 1.12, 1], easeEach: "sine.inOut" }, x: 0, duration: 3.6 }, 3.2)
      .to(obj, { x: () => innerWidth * .7, duration: 3, ease: "power2.in" }, 6.6)
      .to(wipe, { p: 1, duration: 3, ease: "power2.in", onUpdate: () => (panel.style.clipPath = `inset(0 0 0 ${(100 - wipe.p * 100).toFixed(2)}%)`) }, 6.6)
      .to({}, { duration: .8 });
  }

  /* ---------- 05 Nik em poses: flipbook pela rolagem ---------- */
  function setupPoses() {
    const NP = 12, pp = $("#pp"), tk = $("#ticks"), pi = [];
    for (let i = 1; i <= NP; i++) { const im = new Image(); im.alt = ""; im.decoding = "async"; im.src = `assets/img/pose${String(i).padStart(2, "0")}.webp`; if (i === 1) im.className = "on"; pp.appendChild(im); pi.push(im); tk.appendChild(document.createElement("i")); }
    const tks = $$("#ticks i"), tr = $$("#trail img"), pn = $("#pcnt"); let cur = 0; tks[0].className = "on";
    const set = k => { if (k === cur) return; pi[cur].classList.remove("on"); pi[k].classList.add("on"); cur = k; pn.innerHTML = `${String(k + 1).padStart(2, "0")}<small>/12</small>`;
      tks.forEach((t, j) => (t.className = j <= k ? "on" : ""));
      if (!RM) gsap.fromTo(pp, { scale: .9 }, { scale: 1, duration: .55, ease: "back.out(2.4)", overwrite: true });
      tr.forEach((im, j) => { const q = k - 3 + j; if (q >= 0 && q < k) { im.src = `assets/img/pose${String(q + 1).padStart(2, "0")}.webp`; im.style.opacity = .85; } else im.style.opacity = 0; }); };
    if (RM) return;
    ScrollTrigger.create({ trigger: "#nikp", start: "top top", end: "bottom bottom", onUpdate: s => set(Math.min(NP - 1, Math.floor(s.progress * NP * 1.0001))) });
    gsap.to("#bgw", { xPercent: -22, ease: "none", scrollTrigger: { trigger: "#nikp", start: "top bottom", end: "bottom top", scrub: true } });
  }

  /* ---------- 06 voz: falas sobem; na metade, vira "não é" e risca ---------- */
  function setupVoz() {
    const R = { e: "Irônica e curta. Ri da própria rotina e dramatiza o pequeno. Piada interna: quem entende, entende.", n: "Motivacional. Piada com quem está começando ou com o corpo dos outros. Gíria forçada. Explicação longa." };
    let v0 = null;
    const setV = v => { if (v === v0) return; const first = v0 === null; v0 = v;
      $$("#voz .tg button").forEach(b => b.setAttribute("aria-pressed", b.dataset.v === v));
      const r = $("#reg"); r.textContent = R[v]; if (!first && !RM) gsap.fromTo(r, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: .45, ease: OUT, overwrite: true });
      if (RM) return;
      if (v === "e") { gsap.to("#nao", { opacity: 0, duration: .25, overwrite: true }); gsap.to("#chat", { opacity: 1, duration: .4, delay: .15, overwrite: true }); gsap.set("#nao .no i", { scaleX: 0, delay: .3 }); }
      else { gsap.to("#chat", { opacity: 0, duration: .25, overwrite: true }); gsap.to("#nao", { opacity: 1, duration: .2, delay: .15, overwrite: true });
        gsap.fromTo("#nao li", { y: 26, opacity: 0 }, { y: 0, opacity: 1, stagger: .12, duration: .6, delay: .2, ease: OUT, overwrite: true });
        gsap.fromTo("#nao .no i", { scaleX: 0 }, { scaleX: 1, stagger: .16, delay: .7, duration: .55, ease: IO, overwrite: true }); } };
    setV("e");
    $$("#voz .tg button").forEach(b => b.addEventListener("click", () => setV(b.dataset.v)));
    if (RM) return;
    const fl = $$("#chat .fl");
    scene("voz", t => { fl.forEach((f, i) => { const p = seg(t, .08 + i * .1, .18 + i * .1, E.out); f.style.opacity = p.toFixed(3); f.style.transform = `translateY(${((1 - p) * 44).toFixed(1)}px)`; }); setV(t > .58 ? "n" : "e"); });
  }

  /* ---------- 07 cores: a rolagem abre uma cor de cada vez ---------- */
  function setupCores() {
    const sw = $$("#sw .c1"); let act = -1;
    sw.forEach(b => b.addEventListener("click", () => copy(b.dataset.hex)));
    if (FINE) sw.forEach((b, i) => b.addEventListener("pointerenter", () => { act = i; sw.forEach((x, j) => x.classList.toggle("on", j === i)); }));
    if (RM) return;
    gsap.to("#rabo", { x: -520, ease: "none", scrollTrigger: { trigger: "#cores", start: "top bottom", end: "bottom top", scrub: true } });
    const raboW = $("#raboW"), ct = $("#ct");
    scene("cores", t => {
      raboW.style.transform = `scaleX(${seg(t, .02, .14, E.out).toFixed(3)})`;
      sw.forEach((b, i) => { const p = seg(t, .08 + i * .04, .2 + i * .04, E.out); b.style.transform = `translateY(${((1 - p) * 110).toFixed(1)}%)`; b.style.opacity = p.toFixed(3); });
      ct.style.opacity = seg(t, .82, .9).toFixed(3);
      const k = Math.min(3, Math.floor(seg(t, .22, .9) * 4));
      if (k !== act) { act = k; sw.forEach((x, j) => x.classList.toggle("on", j === k)); }
    });
  }

  /* ---------- 08 tipografia: aperta sozinho até −3% ---------- */
  function setupTipo() {
    const rg = $("#rg"), lb = $("#lb"), ts = $("#tipo"); let manual = false;
    const setLs = v => { v = Math.round(v); ts.style.setProperty("--ls", v); rg.value = v; const sg = (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v) + "%";
      if (v === -3) { lb.className = "mono lb ok"; lb.textContent = `Espaçamento ${sg} · a regra`; } else { lb.className = "mono lb no"; lb.textContent = `Espaçamento ${sg} · ${v > -3 ? "solto demais" : "apertado demais"}`; } };
    rg.addEventListener("input", () => { manual = true; setLs(rg.value); });
    if (RM) { setLs(-3); return; }
    const esp = $$("#esp > div");
    ScrollTrigger.create({ trigger: "#tipo", start: "top top", end: "bottom bottom", onLeaveBack: () => { manual = false; },
      onUpdate: s => { const t = s.progress; if (!manual) setLs(6 - 9 * E.io(seg(t, .1, .6))); esp.forEach((d, i) => { const p = seg(t, .62 + i * .06, .74 + i * .06, E.out); d.style.opacity = p.toFixed(3); d.style.transform = `translateY(${((1 - p) * 30).toFixed(1)}px)`; }); } });
    esp.forEach(d => (d.style.opacity = 0));
  }

  /* ---------- 09 vista a ideia ---------- */
  function setupVista() {
    const vst = $("#vst"), art = $("#art"), ap = { rep: "estampa-rep", bulking: "estampa-bulking", 99: "estampa-99" }; let tok = 0, vsn = -1;
    const setTee = h => { vst.style.setProperty("--tee", h); $$("#vista .cr button").forEach(b => b.setAttribute("aria-pressed", b.dataset.t === h)); };
    const setArt = k => { $$("#vista .es button").forEach(b => b.setAttribute("aria-pressed", b.dataset.a === k)); const my = ++tok;
      gsap.to(art, { opacity: 0, duration: .15, overwrite: true, onComplete: () => { if (my !== tok) return; art.src = `assets/img/${ap[k]}.webp`; gsap.to(art, { opacity: 1, duration: .3 }); } }); };
    const lab = ["Só mais uma rep", "Bulking", "99% preguiça · camiseta creme", "Selos"];
    const apply = s => { if (s === vsn) return; vsn = s; $("#vstep").textContent = `Passo 0${s + 1}/04 · ${lab[s]}`; if (s === 0) { setTee("#111111"); setArt("rep"); } else if (s === 1) { setTee("#111111"); setArt("bulking"); } else { setTee("#E9E6DF"); setArt("99"); } };
    $$("#vista .cr button").forEach(b => b.addEventListener("click", () => setTee(b.dataset.t)));
    $$("#vista .es button").forEach(b => b.addEventListener("click", () => { setArt(b.dataset.a); if (b.dataset.a === "99") setTee("#E9E6DF"); }));
    const drs = $$("#tray .dr"), tg = [[.62, .6], [.34, .16], [.72, .28]]; let orig = [];
    const measure = () => { const tray = $("#tray"); orig = drs.map(el => ({ x: tray.offsetLeft + el.offsetLeft + el.offsetWidth / 2, y: tray.offsetTop + el.offsetTop + el.offsetHeight / 2 })); };
    measure(); ScrollTrigger.addEventListener("refreshInit", measure);
    drs.forEach(el => { let sx, sy, bx, by;
      el.addEventListener("pointerdown", e => { el.setPointerCapture(e.pointerId); el.dataset.mv = 1; sx = e.clientX; sy = e.clientY; bx = gsap.getProperty(el, "x"); by = gsap.getProperty(el, "y"); gsap.to(el, { scale: 1.12, duration: .2 }); });
      el.addEventListener("pointermove", e => { if (el.hasPointerCapture(e.pointerId)) gsap.set(el, { x: bx + e.clientX - sx, y: by + e.clientY - sy }); });
      const up = () => gsap.to(el, { scale: 1, duration: .7, ease: "elastic.out(1,.5)" }); el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); });
    apply(0);
    if (RM) return;
    scene("vista", t => { apply(t < .22 ? 0 : t < .42 ? 1 : t < .6 ? 2 : 3);
      const e = E.out(seg(t, .62, .9)), W = vst.clientWidth, H = vst.clientHeight; $("#tray").style.setProperty("--tb", (1 - e).toFixed(2));
      drs.forEach((el, i) => { if (el.dataset.mv || !orig[i]) return; gsap.set(el, { x: (tg[i][0] * W - orig[i].x) * e, y: (tg[i][1] * H - orig[i].y) * e }); }); });
  }

  /* ---------- 10 aplicações: galeria horizontal presa ---------- */
  function setupApps() {
    if (RM || MOBILE) return;
    const stage = $("#aStage"), trk = $("#trk"), cds = $$(".cd", trk), bar = $("#apbi"), cnt = $("#acnt");
    const dist = () => Math.max(0, trk.scrollWidth - innerWidth);
    const skew = cds.map(c => gsap.quickTo(c, "skewX", { duration: .5, ease: "power3.out" }));
    const move = gsap.to(trk, { x: () => -dist(), ease: "none", scrollTrigger: { trigger: stage, start: "top top", end: () => "+=" + dist() * 1.15, pin: true, scrub: .8, invalidateOnRefresh: true,
      onUpdate: s => { bar.style.transform = `scaleX(${s.progress})`; cnt.innerHTML = `${String(Math.round(s.progress * 5) + 1).padStart(2, "0")}<small>/06</small>`; const v = clamp(s.getVelocity() / -250, -5, 5); skew.forEach(f => f(v)); } } });
    ScrollTrigger.addEventListener("scrollEnd", () => skew.forEach(f => f(0)));
    cds.forEach(c => {
      gsap.fromTo(c, { clipPath: "inset(100% 0% 0% 0% round 24px)" }, { clipPath: "inset(0% 0% 0% 0% round 24px)", duration: 1.3, ease: IO, scrollTrigger: { trigger: c, containerAnimation: move, start: "left 92%", toggleActions: "play none none reverse" } });
      gsap.fromTo($("img", c), { xPercent: 4 }, { xPercent: -4, ease: "none", scrollTrigger: { trigger: c, containerAnimation: move, start: "left right", end: "right left", scrub: true } });
    });
  }

  /* ---------- 11 figurinhas: colunas infinitas ---------- */
  function setupFig() {
    const pool = []; for (let k = 1; k <= 21; k++) pool.push("exp" + String(k).padStart(2, "0")); for (let k = 1; k <= 18; k++) pool.push("pose" + String(k).padStart(2, "0")); for (let k = 1; k <= 6; k++) pool.push("n3d" + String(k).padStart(2, "0"));
    const loop = $("#figLoop"), N = 6, dirs = [-1, 1, -1, 1, -1, 1];
    const cols = dirs.map((d, ci) => { const col = document.createElement("div"); col.className = "col"; const inner = document.createElement("div"); inner.className = "inner";
      const mine = pool.filter((_, i) => i % N === ci); const html = mine.map(n => `<img src="assets/img/${n}.webp" alt="" loading="lazy" decoding="async">`).join("");
      inner.innerHTML = html + html + html; col.appendChild(inner); loop.appendChild(col);
      const c = { inner, dir: d, y: 0, h: 1, speed: 1, target: 1 }; col.addEventListener("pointerenter", () => (c.target = .08)); col.addEventListener("pointerleave", () => (c.target = 1)); return c; });
    const measure = () => cols.forEach(c => { const gap = parseFloat(getComputedStyle(c.inner).rowGap) || 0; c.h = (c.inner.scrollHeight + gap) / 3; if (c.dir > 0 && c.y === 0) c.y = -c.h * .5; });
    addEventListener("resize", measure);
    if (RM) return;
    let v = 0, last = performance.now();
    const tick = () => { const now = performance.now(), dt = Math.min(48, now - last); last = now; v += ((lenis ? lenis.velocity : 0) - v) * .1;
      cols.forEach(c => { c.speed += (c.target - c.speed) * .06; c.y += (c.dir * .05 * c.speed + c.dir * v * .02) * dt; if (c.y <= -c.h) c.y += c.h; if (c.y > 0) c.y -= c.h; c.inner.style.transform = `translate3d(0,${c.y.toFixed(1)}px,0)`; }); };
    ScrollTrigger.create({ trigger: "#fig", start: "top bottom", end: "bottom top", onToggle: s => { if (s.isActive) { measure(); last = performance.now(); gsap.ticker.add(tick); } else gsap.ticker.remove(tick); } });
  }

  /* ---------- 12 fecho ---------- */
  function setupFecho() {
    const fe = $("#fecho"), cta = $("#cta"); let fon = false, hov = false;
    cta.addEventListener("pointerenter", () => { hov = true; fe.classList.add("hv"); }); cta.addEventListener("pointerleave", () => { hov = false; fe.classList.remove("hv"); });
    ScrollTrigger.create({ trigger: fe, start: "top 70%", onToggle: s => (fon = s.isActive) });
    if (!RM) setInterval(() => { if (fon && !hov) fe.classList.toggle("hv"); }, 2400);
  }


  /* ---------- 12 fecho: nome em pontos que reage ao mouse ---------- */
  function setupGiantDots() {
    const cv = $("#gcv"); if (!cv) return;
    const X = cv.getContext("2d"), W = 1000, H = 142, STEP = 6.5, R = 115;
    const dpr = Math.min(devicePixelRatio || 1, 2); let dots = [], vis = false, run = false, mx = -999, my = -999, boxW = 0;
    const PK = [112, 112, 118], CR = [255, 46, 126];
    function build() {
      const o = document.createElement("canvas"); o.width = W; o.height = H; const c = o.getContext("2d");
      c.font = '176px "Archivo Black", Archivo, sans-serif'; c.textBaseline = "alphabetic";
      const w = c.measureText("ironik").width; c.save(); c.translate(-19, 138); c.scale(1040 / w, 1); c.fillStyle = "#000"; c.fillText("ironik", 0, 0); c.restore();
      const d = c.getImageData(0, 0, W, H).data; dots = [];
      for (let y = STEP / 2; y < H; y += STEP) for (let x = STEP / 2; x < W; x += STEP) if (d[((y | 0) * W + (x | 0)) * 4 + 3] > 128) dots.push({ x, y, f: 0 });
      size(); draw();
    }
    function size() { boxW = cv.clientWidth; cv.width = Math.round(boxW * dpr); cv.height = Math.round(boxW * H / W * dpr); }
    function draw() {
      const k = cv.width / W; X.clearRect(0, 0, cv.width, cv.height); let busy = false;
      for (const p of dots) {
        const dx = p.x - mx, dy = p.y - my, d = Math.sqrt(dx * dx + dy * dy), tg = d < R ? Math.pow(1 - d / R, 1.4) : 0;
        p.f += (tg - p.f) * .16; if (Math.abs(tg - p.f) > .004) busy = true;
        const f = p.f, r = 1.8 * (1 + 1.9 * f), a = .6 + .4 * f;
        X.fillStyle = `rgba(${PK[0] + (CR[0] - PK[0]) * f | 0},${PK[1] + (CR[1] - PK[1]) * f | 0},${PK[2] + (CR[2] - PK[2]) * f | 0},${a})`;
        X.beginPath(); X.arc(p.x * k, p.y * k, r * k, 0, 6.2832); X.fill();
      }
      return busy;
    }
    function loop() { if (!vis) { run = false; return; } const b = draw(); if (b || mx > -900) requestAnimationFrame(loop); else run = false; }
    function kick() { if (!run && vis) { run = true; requestAnimationFrame(loop); } }
    if (document.fonts && document.fonts.load) document.fonts.load('176px "Archivo Black"').then(build, build); else build();
    addEventListener("resize", () => { if (dots.length) { size(); draw(); } });
    ScrollTrigger.create({ trigger: cv, start: "top bottom", end: "bottom top", onToggle: s => { vis = s.isActive; if (vis) kick(); } });
    if (!FINE || RM) return;
    cv.parentElement.addEventListener("pointermove", e => { const r = cv.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width * W; my = (e.clientY - r.top) / r.height * H; kick(); });
    cv.parentElement.addEventListener("pointerleave", () => { mx = my = -999; kick(); });
  }

  /* ---------- nav, progresso, contador, microinterações ---------- */
  function setupNav() {
    const links = $$(".nav a.l"), reps = $("#reps"), bar = $("#prog");
    secs.forEach(s => ScrollTrigger.create({ trigger: s, start: "top 55%", end: "bottom 55%", onToggle: self => { if (!self.isActive) return; reps.textContent = `${s.dataset.n} / 12`; const id = s.id === "trav" ? "logo" : s.id; links.forEach(a => a.classList.toggle("on", a.dataset.s === id)); } }));
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: s => (bar.style.transform = `scaleX(${s.progress})`) });
    document.addEventListener("click", e => { const a = e.target.closest('a[href^="#"]'); if (!a) return; const t = $(a.getAttribute("href")); if (!t) return; e.preventDefault();
      if (lenis) lenis.scrollTo(t, { duration: 1.6, easing: x => 1 - Math.pow(1 - x, 4) }); else t.scrollIntoView({ behavior: RM ? "auto" : "smooth" }); });
  }
  function setupMicro() {
    if (!FINE || RM) return;
    $$("[data-magnetic]").forEach(b => { const x = gsap.quickTo(b, "x", { duration: .6, ease: "power3.out" }), y = gsap.quickTo(b, "y", { duration: .6, ease: "power3.out" });
      b.addEventListener("pointermove", e => { const r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * .28); y((e.clientY - r.top - r.height / 2) * .36); }); b.addEventListener("pointerleave", () => { x(0); y(0); }); });
    $$("[data-btn]").forEach(b => { const f = $(".fill", b); const at = e => { const r = b.getBoundingClientRect(); return { left: e.clientX - r.left, top: e.clientY - r.top, d: Math.hypot(r.width, r.height) * 2.2 }; };
      b.addEventListener("pointerenter", e => { const p = at(e); gsap.set(f, { left: p.left, top: p.top }); gsap.to(f, { width: p.d, height: p.d, duration: .6, ease: OUT, overwrite: true }); });
      b.addEventListener("pointerleave", e => { const p = at(e); gsap.set(f, { left: p.left, top: p.top }); gsap.to(f, { width: 0, height: 0, duration: .5, ease: OUT, overwrite: true }); }); });
  }

  /* ---------- loader: a tag com coroa se desenha, a contagem é real, a tela abre ---------- */
  function runLoader(done) {
    const el = $("#loader"), fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    if (RM) { fontsReady.then(() => { el.remove(); done(); }); return; }
    const paths = $$(".lp", el); paths.forEach(p => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    const cEl = $("#loaderCount"), bEl = $("#loaderBar"), shown = { v: 0 }; let target = 0;
    const tick = () => { shown.v += (target * 12 - shown.v) * .08; const v = Math.min(12, Math.round(shown.v)); cEl.textContent = "REP " + String(v).padStart(2, "0"); bEl.style.transform = `scaleX(${shown.v / 12})`; };
    gsap.ticker.add(tick);
    const zoom = gsap.fromTo("#loaderLogo", { scale: .86 }, { scale: 1.06, duration: 3.2, ease: "sine.inOut" });
    const draw = gsap.timeline().to(paths, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut", stagger: .1 }).to(paths, { fillOpacity: 1, strokeOpacity: 0, duration: .6, stagger: .05 }, "-=.45");
    const imgs = $$("img[data-critical]").map(i => (i.complete ? Promise.resolve() : new Promise(r => (i.onload = i.onerror = r))));
    const tasks = [fontsReady, ...imgs]; let n = 0; tasks.forEach(t => t.then(() => (target = (++n / tasks.length) * .9)));
    const safety = new Promise(r => setTimeout(r, 7000));
    Promise.race([Promise.all([Promise.all(tasks), new Promise(r => setTimeout(r, 1800)), draw.then()]), safety]).then(() => {
      target = 1;
      gsap.delayedCall(.3, () => { gsap.ticker.remove(tick); zoom.kill(); cEl.textContent = "REP 12"; bEl.style.transform = "scaleX(1)";
        const hole = { r: 0 }, max = Math.hypot(innerWidth, innerHeight);
        const set = () => { const g = `radial-gradient(circle at 50% 50%, transparent ${hole.r}px, #000 ${hole.r + 1}px)`; el.style.webkitMaskImage = g; el.style.maskImage = g; };
        gsap.timeline({ onComplete: () => el.remove() }).to(["#loaderMeta", "#loaderLogo"], { opacity: 0, duration: .35, ease: "power2.in" }).add(done, "-=.05").to(hole, { r: max, duration: 1.3, ease: "expo.in", onUpdate: set }, "<"); });
    });
  }

  /* ---------- boot: pins primeiro ---------- */
  setupApps();
  setupTravel();
  setupLogo();
  setupPoses();
  setupVoz();
  setupCores();
  setupTipo();
  setupVista();
  setupFig();
  if (!RM) { setupCovers(); setupReveals(); } else $$("[data-count]").forEach(el => (el.textContent = el.dataset.count));
  setupFecho(); setupGiantDots();
  setupNav();
  setupMicro();
  ScrollTrigger.refresh();
  runLoader(heroIntro);
  let lastW = innerWidth, rT;
  addEventListener("resize", () => { if (!FINE && innerWidth === lastW) return; lastW = innerWidth; clearTimeout(rT); rT = setTimeout(() => ScrollTrigger.refresh(), 200); });
  addEventListener("load", () => ScrollTrigger.refresh());
  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
