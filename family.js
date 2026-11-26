// Family page: Santa guides each person from picking their tag to pulling a name from his sack.
(async function () {
  "use strict";
  const S = Santa, $ = S.$;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
  let me = null, busy = false;

  // ---------- artwork ----------
  const SANTA_SVG = `
<svg viewBox="0 0 200 200" aria-hidden="true">
  <path d="M34 200C38 172 64 158 100 158s62 14 66 42z" fill="#c8202f"/>
  <path d="M94 160h12v40H94z" fill="#fff"/>
  <g class="arm">
    <path d="M150 178c10-16 16-30 20-44" stroke="#c8202f" stroke-width="17" stroke-linecap="round" fill="none"/>
    <rect x="159" y="130" width="22" height="9" rx="4.5" fill="#fff" transform="rotate(-15 170 134)"/>
    <circle cx="173" cy="119" r="11" fill="#2f7356"/>
    <ellipse cx="163" cy="117" rx="4" ry="6.5" fill="#2f7356" transform="rotate(-30 163 117)"/>
  </g>
  <path d="M58 96C58 52 98 30 134 40c22 6 36 26 38 48l-12 2c-4-18-14-28-24-30 4 14 7 26 6 36z" fill="#c8202f"/>
  <path d="M136 60c4 14 7 26 6 36h-8c0-10-2-22-6-34z" fill="#a3172a" opacity=".5"/>
  <circle cx="166" cy="92" r="11" fill="#fff"/>
  <circle cx="100" cy="112" r="36" fill="#f6c9a6"/>
  <path d="M62 112c-6 32 10 62 38 72 28-10 44-40 38-72-8 18-22 26-38 26s-30-8-38-26z" fill="#fff"/>
  <g fill="#fff"><circle cx="64" cy="132" r="8"/><circle cx="70" cy="152" r="9"/><circle cx="84" cy="169" r="10"/><circle cx="100" cy="177" r="10"/><circle cx="116" cy="169" r="10"/><circle cx="130" cy="152" r="9"/><circle cx="136" cy="132" r="8"/></g>
  <g fill="#ece4da"><circle cx="86" cy="158" r="4"/><circle cx="112" cy="162" r="4"/><circle cx="100" cy="150" r="3"/></g>
  <rect x="54" y="84" width="92" height="20" rx="10" fill="#fff"/>
  <path d="M80 107q7-5 14 0M106 107q7-5 14 0" stroke="#fff" stroke-width="4.5" stroke-linecap="round" fill="none"/>
  <g class="eyes"><ellipse cx="87" cy="114" rx="3.6" ry="4.6" fill="#3a2418"/><ellipse cx="113" cy="114" rx="3.6" ry="4.6" fill="#3a2418"/><circle cx="88.3" cy="112.4" r="1.2" fill="#fff"/><circle cx="114.3" cy="112.4" r="1.2" fill="#fff"/></g>
  <circle cx="76" cy="125" r="8" fill="#f08f86" opacity=".6"/><circle cx="124" cy="125" r="8" fill="#f08f86" opacity=".6"/>
  <ellipse class="mouth" cx="100" cy="142" rx="6" ry="3.5" fill="#7a1d22"/>
  <path d="M100 132c-7-8-23-7-28 3 8 6 22 5 28-1 6 6 20 7 28 1-5-10-21-11-28-3z" fill="#fff" stroke="#e6ddd2"/>
  <circle cx="100" cy="126" r="7" fill="#ef9f86"/>
</svg>`;

  const SACK_SVG = `
<svg viewBox="0 0 200 200" aria-hidden="true">
  <g class="gift-b"><g transform="rotate(10 116 66)"><rect x="100" y="40" width="34" height="38" rx="3" fill="#e04a52"/><rect x="114" y="40" width="7" height="38" fill="#ffd27a"/><path d="M117 40c-8-10-16-6-12 0zM117 40c8-10 16-6 12 0z" fill="#ffd27a"/></g></g>
  <g class="gift-a"><g transform="rotate(-12 88 70)"><rect x="68" y="48" width="38" height="34" rx="3" fill="#2f7356"/><rect x="84" y="48" width="7" height="34" fill="#f3e4c4"/><rect x="68" y="61" width="38" height="7" fill="#f3e4c4"/></g></g>
  <circle cx="140" cy="62" r="9" fill="#e9c46a"/><path d="M140 53v-6" stroke="#8b5a2b" stroke-width="3"/>
  <path d="M62 74c18-12 58-12 76 0l-8 14c-18-6-42-6-60 0z" fill="#9c6a3a"/>
  <path d="M70 88c-40 26-48 86-18 102 28 12 68 12 96 0 30-16 22-76-18-102-18 8-42 8-60 0z" fill="#b5814b"/>
  <path d="M70 88c-40 26-48 86-18 102 12 5 26 8 40 9-26-14-36-62-6-108-6 0-11-1-16-3z" fill="#9c6a3a" opacity=".55"/>
  <path d="M128 110c10 14 14 34 10 52" stroke="#d9a873" stroke-width="5" stroke-linecap="round" fill="none" opacity=".6"/>
  <rect x="122" y="150" width="22" height="18" rx="2" fill="#a8743f" transform="rotate(-8 133 159)"/>
  <path d="M124 150l-2 18M144 147l2 18" stroke="#7a4f27" stroke-width="1.5" stroke-dasharray="2 2" transform="rotate(-8 133 159)"/>
  <path d="M100 128l5 11 12 1-9 8 3 12-11-6-11 6 3-12-9-8 12-1z" fill="#e9c46a"/>
  <path d="M66 86c22 10 46 10 68 0" stroke="#e9c46a" stroke-width="6" stroke-linecap="round" fill="none"/>
  <path d="M100 92c-12-2-20 8-12 12 6 2 10-6 12-12zM100 92c12-2 20 8 12 12-6 2-10-6-12-12z" fill="#e9c46a"/>
  <path d="M98 94l-6 18M102 94l6 18" stroke="#e9c46a" stroke-width="4" stroke-linecap="round"/>
</svg>`;

  const SLEIGH_SVG = `
<svg viewBox="0 0 170 50" fill="currentColor" stroke="currentColor" stroke-linecap="round" aria-hidden="true">
  <g class="bob">${[0, 46].map((x) => `
    <g transform="translate(${x} 0)">
      <ellipse cx="16" cy="26" rx="12" ry="6" stroke="none"/>
      <path d="M25 24l7-10h5l-1 4-5 2z" stroke="none"/>
      <path d="M8 30l-5 8M12 31v8M21 31l4 7M24 30l6 6M33 14l-2-7M31 10l-3-2M35 14l2-7M36 10l3-2M4 24l-4-2" stroke-width="2" fill="none"/>
    </g>`).join("")}
    <path d="M36 17L104 22" stroke-width="1" fill="none" opacity=".8"/>
    <path d="M104 18h36l4 12h-40z" stroke="none"/>
    <path d="M96 38h54c8 0 12-5 12-10" stroke-width="2.5" fill="none"/>
    <path d="M106 30v8M138 30v8" stroke-width="2" fill="none"/>
    <path d="M116 18c0-9 16-9 16 0z" stroke="none"/>
    <circle cx="124" cy="9" r="4" stroke="none"/>
    <path d="M120 7l6-6 4 5z" stroke="none"/>
    <circle cx="140" cy="13" r="7" stroke="none"/>
  </g>
</svg>`;

  // ---------- sound (synthesised, no files) ----------
  const Sound = {
    on: S.store.get("santa-sound", true),
    ctx: null,
    ready() {
      if (!this.on) return null;
      try { this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)(); if (this.ctx.state === "suspended") this.ctx.resume(); } catch (_) { return null; }
      return this.ctx;
    },
    bell(freq, at, dur = 0.9, vol = 0.18) {
      const c = this.ready(); if (!c) return;
      const t = c.currentTime + at;
      for (const [mult, v] of [[1, vol], [2.76, vol * 0.35], [5.4, vol * 0.12]]) {
        const o = c.createOscillator(), g = c.createGain();
        o.type = "sine"; o.frequency.value = freq * mult;
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
      }
    },
    ding() { this.bell(1760, 0, 0.6, 0.12); this.bell(2217, 0.07, 0.6, 0.08); },
    shake(seconds = 1.6) {
      const c = this.ready(); if (!c) return;
      const len = Math.floor(c.sampleRate * 0.05), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      for (let t = 0; t < seconds; t += 0.11) {
        const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
        src.buffer = buf; f.type = "bandpass"; f.frequency.value = 6500 + Math.random() * 2500; f.Q.value = 3;
        g.gain.value = 0.35; src.connect(f).connect(g).connect(c.destination); src.start(c.currentTime + t + Math.random() * 0.03);
      }
    },
    jingle() { // the opening of "Jingle Bells" (public domain, 1857)
      const E = 659.3, G = 784, C = 523.3, D = 587.3, q = 0.19;
      [[E, 0], [E, 1], [E, 2], [E, 4], [E, 5], [E, 6], [E, 8], [G, 9], [C, 10.5], [D, 11], [E, 12]]
        .forEach(([f, beat]) => this.bell(f, beat * q, beat === 12 ? 1.6 : 0.7, 0.16));
    },
    toggle() { this.on = !this.on; S.store.set("santa-sound", this.on); return this.on; }
  };

  // ---------- effects ----------
  function lights() {
    const box = $("#lights"), w = Math.max(320, innerWidth), span = w < 600 ? 90 : 120, n = Math.ceil(w / span);
    const colors = ["#ff4d5a", "#ffd166", "#4ade80", "#7cc7ff", "#fff3c4"];
    let wire = "M0 4", bulbs = "", k = 0;
    for (let i = 0; i < n; i++) {
      const x0 = i * span, x1 = x0 + span, cx = x0 + span / 2, sag = 26;
      wire += ` Q${cx} ${4 + sag * 2} ${x1} 4`;
      for (const t of [0.25, 0.5, 0.75]) {
        const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1;
        const y = (1 - t) ** 2 * 4 + 2 * (1 - t) * t * (4 + sag * 2) + t * t * 4;
        const c = colors[k++ % colors.length];
        bulbs += `<g class="bulb" style="animation-delay:${(-Math.random() * 2.4).toFixed(2)}s"><circle cx="${x}" cy="${y + 9}" r="10" fill="${c}" opacity=".22"/><rect x="${x - 2.5}" y="${y - 1}" width="5" height="5" rx="1" fill="#2b3a33"/><ellipse cx="${x}" cy="${y + 9}" rx="4.2" ry="6.2" fill="${c}"/></g>`;
      }
    }
    box.innerHTML = `<svg viewBox="0 0 ${w} 54" preserveAspectRatio="none"><path d="${wire}" stroke="#16301f" stroke-width="2" fill="none"/>${bulbs}</svg>`;
  }

  function sleighLoop() {
    if (reduced) return;
    const s = $("#sleigh");
    const fly = () => { s.classList.remove("fly"); void s.offsetWidth; s.classList.add("fly"); };
    setTimeout(fly, 2500);
    setInterval(fly, 24000);
  }

  function sparkle(fromEl) {
    if (reduced) return;
    const r = fromEl.getBoundingClientRect();
    const sp = S.el("span", { class: "sparkle", style: `left:${r.left + r.width * (0.3 + Math.random() * 0.4)}px;top:${r.top + r.height * 0.25}px;--dx:${(Math.random() - 0.5) * 140}px;--dy:${-40 - Math.random() * 90}px;font-size:${12 + Math.random() * 14}px` }, Math.random() < 0.5 ? "✦" : "✧");
    $("#fx").append(sp);
    setTimeout(() => sp.remove(), 1000);
  }

  function confetti(fromEl, count = 110) {
    if (reduced) return;
    const r = fromEl.getBoundingClientRect(), ox = r.left + r.width / 2, oy = r.top + r.height / 2;
    const colors = ["#e9c46a", "#ff4d5a", "#4ade80", "#fbf3e4", "#7cc7ff", "#ffd166"];
    const parts = [];
    for (let i = 0; i < count; i++) {
      const size = 6 + Math.random() * 7, round = Math.random() < 0.3;
      const el = S.el("i", { class: "confetti", style: `width:${size}px;height:${round ? size : size * 0.45}px;background:${colors[i % colors.length]};border-radius:${round ? "50%" : "2px"}` });
      $("#fx").append(el);
      const a = Math.random() * Math.PI * 2, v = 6 + Math.random() * 9;
      parts.push({ el, x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 7, rot: Math.random() * 360, vr: (Math.random() - 0.5) * 20 });
    }
    const start = performance.now();
    (function step(now) {
      const t = now - start;
      for (const p of parts) {
        p.vy += 0.32; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        p.el.style.transform = `translate(${p.x}px,${p.y}px) rotate(${p.rot}deg)`;
        p.el.style.opacity = t > 1800 ? Math.max(0, 1 - (t - 1800) / 700) : 1;
      }
      if (t < 2500) requestAnimationFrame(step); else parts.forEach((p) => p.el.remove());
    })(start);
  }

  // Santa speaks: the bubble types out the line while his mouth moves.
  let sayToken = 0;
  async function say(text) {
    const me = ++sayToken, bubble = $("#bubble"), santa = $("#santa");
    $("#said").textContent = text;
    bubble.replaceChildren(); bubble.style.animation = "none"; void bubble.offsetWidth; bubble.style.animation = "";
    const parts = text.split(/(Ho ho ho!)/).filter(Boolean);
    santa.classList.add("talking");
    for (const part of parts) {
      const span = S.el("span", { class: part === "Ho ho ho!" ? "hoho" : "" });
      bubble.append(span);
      if (reduced) { span.textContent = part; continue; }
      for (const ch of part) {
        if (me !== sayToken) return;
        span.textContent += ch;
        await new Promise((r) => setTimeout(r, ch === " " ? 18 : 26));
      }
    }
    if (me === sayToken) santa.classList.remove("talking");
  }

  // ---------- page ----------
  $("#santa").innerHTML = SANTA_SVG;
  $("#sack").innerHTML = SACK_SVG;
  $("#sleigh").innerHTML = SLEIGH_SVG;
  lights(); addEventListener("resize", () => { clearTimeout(lights.t); lights.t = setTimeout(lights, 200); });
  sleighLoop();
  S.snow();

  const soundBtn = $("#sound");
  const paintSound = () => { soundBtn.textContent = Sound.on ? "🔔" : "🔕"; soundBtn.setAttribute("aria-label", Sound.on ? "Sound on" : "Sound off"); };
  paintSound();
  soundBtn.addEventListener("click", () => { Sound.toggle(); paintSound(); Sound.ding(); });

  const SANTA_LINES = ["Ho ho ho!", "Ho ho ho! Have you been good this year?", "Ho ho ho! The elves say hello!", "Ho ho ho! Mince pie, anyone?"];
  $("#santa").addEventListener("click", () => {
    const s = $("#santa"); s.classList.remove("jolly"); void s.offsetWidth; s.classList.add("jolly");
    Sound.bell(523.3, 0, 0.5, 0.12); Sound.bell(392, 0.15, 0.6, 0.12);
    if (busy) return;
    say(SANTA_LINES[Math.floor(Math.random() * SANTA_LINES.length)]);
  });

  const show = (id) => ["open", "pick", "drawStep"].forEach((s) => $("#" + s).classList.toggle("hidden", s !== id));

  let fam = null;
  try {
    const res = await fetch("family.json?" + Date.now(), { cache: "no-store" });
    if (res.ok) fam = await res.json();
    else if (res.status !== 404) throw new Error(res.status);
  } catch (_) {
    say("Oh dear, my elves can't find the list. Try refreshing the page!");
    return;
  }
  if (fam && fam.title) { $("#title").textContent = fam.title; document.title = fam.title; }
  const names = fam ? fam.people.map((p) => p.name) : [];
  const sorted = names.slice().sort((a, b) => a.localeCompare(b));

  function tagEl(name, i, opts = {}) {
    const tilt = [-2.2, 1.6, -0.8, 2, -1.4][i % 5];
    const btn = S.el(opts.small ? "div" : "button", Object.assign({ class: "tag" + (opts.small ? " small" : ""), style: `--tilt:${tilt}deg;--i:${i}` }, opts.small ? {} : { type: "button" }),
      S.el("span", { class: "tag-body" }, S.el("span", { class: "hand" }, name), opts.done ? S.el("span", { class: "done" }, "✓ drawn") : ""));
    return S.el("div", { class: "tag-wrap", style: `--i:${i}` }, btn);
  }

  // The hat is still open: show who's in so far.
  if (!fam || !fam.drawn) {
    $("#soFar").replaceChildren(...sorted.map((n, i) => tagEl(n, i, { small: true })));
    show("open");
    say(names.length
      ? `Ho ho ho! I'm still packing my sack. ${names.length} ${names.length === 1 ? "name is" : "names are"} in so far. Come back once everyone's in!`
      : "Ho ho ho! I'm still packing my sack. Come back soon!");
    return;
  }

  const meKey = "santa-me:" + fam.id;

  // ---- The lock: once someone draws on this phone, the phone belongs to them for this draw.
  // Kept in both localStorage and a cookie; whichever survives restores the other.
  const lockKey = "santa-lock:" + fam.id;
  const cookieName = "santa_lock_" + fam.id;
  const cookiePath = new URL(".", location.href).pathname;
  function readCookie() {
    const m = document.cookie.match(new RegExp("(?:^|; )" + cookieName + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : "";
  }
  function setLock(name) {
    S.store.set(lockKey, name);
    document.cookie = `${cookieName}=${encodeURIComponent(name)}; max-age=${60 * 60 * 24 * 400}; path=${cookiePath}; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }
  function clearLock() {
    try { localStorage.removeItem(lockKey); } catch (_) {}
    document.cookie = `${cookieName}=; max-age=0; path=${cookiePath}`;
  }
  function getLock() {
    const name = S.store.get(lockKey, "") || readCookie();
    if (name && names.includes(name)) { setLock(name); return name; }
    return "";
  }
  let lock = getLock();

  function goPick() {
    if (lock) { goLocked(); return; }
    me = null; S.store.set(meKey, "");
    $("#tags").replaceChildren(...sorted.map((n, i) => {
      const wrap = tagEl(n, i);
      const btn = wrap.firstChild;
      btn.setAttribute("aria-label", n);
      btn.addEventListener("click", () => {
        Sound.ding();
        btn.classList.add("picked");
        setTimeout(() => { history.pushState({ s: "draw" }, ""); goDraw(n); }, reduced ? 0 : 380);
      });
      return wrap;
    }));
    show("pick");
    say("Ho ho ho! Merry Christmas! Find your name tag and give it a tap.");
  }

  function goDraw(name) {
    if (lock && name !== lock) { goLocked(); return; }
    me = name; busy = false;
    S.store.set(meKey, name);
    $("#notMe").textContent = `Not ${name}?`;
    $("#notMe").classList.toggle("hidden", !!lock);
    $("#lockNote").classList.toggle("hidden", !lock);
    $("#lockNote").textContent = `🔒 This phone is ${name}'s`;
    $("#sack").className = "sack"; $("#sack").disabled = false;
    $("#bigtag").classList.add("hidden"); $("#bigtag").classList.remove("pop");
    $("#from").textContent = name; $("#to").textContent = ""; $("#to").className = "val";
    $("#seal").classList.remove("on");
    $("#before").classList.remove("hidden");
    $("#after").classList.add("hidden");
    $("#drawBtn").disabled = false;
    $("#drawBtn").textContent = lock ? "Peek at my tag" : "🎁 Reach into the sack";
    show("drawStep");
    window.scrollTo({ top: 0 });
    say(lock
      ? `Welcome back, ${name}! Your tag is safe in my sack. Tap to peek at it again.`
      : `Hi ${name}! Reach into my sack and pull out a name. No peeking!`);
  }

  // A locked phone always opens on its owner's tag, already showing.
  function goLocked() {
    goDraw(lock);
    draw({ quiet: true });
  }

  function showFacts() {
    const facts = $("#facts"); facts.replaceChildren();
    if (fam.budget) facts.append(S.el("span", { class: "chip" }, "🎁 Budget " + fam.budget));
    if (fam.date) facts.append(S.el("span", { class: "chip" }, "📅 " + S.formatDate(fam.date)));
    $("#note").textContent = fam.note || "";
    $("#note").classList.toggle("hidden", !fam.note);
  }

  async function draw(opts = {}) {
    if (busy) return;
    const token = fam.drawn.draws[me];
    if (!token) { say("Hmm, your name isn't on my list this year. Ask the organiser!"); return; }
    busy = true;
    const recipient = S.unscramble(token);
    const again = !!lock;
    if (!lock) {                       // first draw on this phone: lock it to this person
      lock = me; setLock(me);
      $("#notMe").classList.add("hidden");
      $("#lockNote").textContent = `🔒 This phone is ${me}'s`;
      $("#lockNote").classList.remove("hidden");
      history.replaceState({ s: "draw" }, "");
    }
    $("#drawBtn").disabled = true; $("#sack").disabled = true;
    const sack = $("#sack"), tag = $("#bigtag"), to = $("#to");

    if (!again) {
      say("Rummage, rummage, rummage…");
      sack.classList.add("shake");
      Sound.shake(1.6);
      const sp = reduced ? 0 : setInterval(() => sparkle(sack), 90);
      await wait(1700);
      clearInterval(sp);
      sack.classList.remove("shake");
    }
    sack.classList.add("gone");
    await wait(opts.quiet ? 0 : 300);
    $("#before").classList.add("hidden");
    tag.classList.remove("hidden"); tag.classList.add("pop");

    if (!again && !reduced) {
      const others = names.filter((n) => n !== me);
      const seq = []; while (seq.length < 14) seq.push(...S.shuffle(others));
      await wait(500);
      let delay = 50;
      for (let i = 0; i < 14; i++) { to.className = "val spin"; to.textContent = seq[i]; await wait(delay); delay *= 1.16; }
    }
    to.className = "val final"; to.textContent = recipient;
    await wait(again ? 500 : 900);
    $("#seal").classList.add("on");
    showFacts();
    $("#after").classList.remove("hidden");
    if (!again) {
      confetti(tag);
      Sound.jingle();
      const s = $("#santa"); s.classList.remove("jolly"); void s.offsetWidth; s.classList.add("jolly");
      say(`Ho ho ho! ${me}, you're ${recipient}'s Secret Santa! Shh… that's our little secret.`);
    } else if (opts.quiet) {
      say(`Welcome back, ${me}! Here's your tag. Shh… it's still our secret.`);
    } else {
      Sound.ding();
      say("There it is! Remember, it's a secret.");
    }
    busy = false;
  }

  $("#drawBtn").addEventListener("click", () => draw());
  $("#sack").addEventListener("click", () => draw());
  $("#notMe").addEventListener("click", () => { if (!lock) goPick(); });
  $("#done").addEventListener("click", () => {
    goDraw(me);
    say(`Merry Christmas, ${me}! Pop back any time to peek at your tag.`);
  });

  // Browser back/forward: a locked phone stays on its owner's tag; otherwise back returns to the tags.
  addEventListener("popstate", () => {
    if (busy) return;
    if (lock) goLocked();
    else if (history.state && history.state.s === "draw" && me) goDraw(me);
    else goPick();
  });

  // The organiser's unlock link (for a phone shared between people): ?unlock=<code>
  const params = new URLSearchParams(location.search);
  let unlocked = false;
  if (params.has("unlock")) {
    if (params.get("unlock") === await S.unlockCode(fam.id)) {
      clearLock(); lock = ""; S.store.set(meKey, ""); unlocked = true;
    }
    history.replaceState(null, "", location.pathname);
  }

  history.replaceState({ s: "start" }, "");
  if (lock) goLocked();
  else {
    const remembered = S.store.get(meKey, "");
    if (!unlocked && remembered && names.includes(remembered)) { history.pushState({ s: "draw" }, ""); goDraw(remembered); }
    else goPick();
  }
  if (unlocked) say("Ho ho ho! This phone is unlocked. Whose turn is it? Tap your name tag.");
})();
