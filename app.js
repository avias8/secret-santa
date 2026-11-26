// Shared logic for every page: storage, the draw, and link encoding.
(function () {
  "use strict";

  const KEY = "secret-santa:v1";

  // ---------- storage (organiser's browser only) ----------
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign(blank(), JSON.parse(raw));
    } catch (_) { /* private mode or blocked storage */ }
    return blank();
  }
  function save(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {}
  }
  function blank() {
    return {
      event: { title: "Secret Santa", budget: "", date: "", note: "" },
      people: [],          // [{ name, partner }]  partner = name they must not draw (and vice versa)
      noPairs: true,       // avoid A->B and B->A
      draw: null,          // { at, pairs: [{ giver, receiver }] }
      handedOut: {}        // giver -> true, for "pass the phone" mode
    };
  }
  function reset() { try { localStorage.removeItem(KEY); } catch (_) {} }

  // ---------- names ----------
  const norm = (s) => s.trim().replace(/\s+/g, " ");
  const same = (a, b) => norm(a).toLocaleLowerCase() === norm(b).toLocaleLowerCase();

  // ---------- the draw ----------
  // Cryptographically random integer in [0, n).
  function randInt(n) {
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / n) * n;
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % n;
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Returns [{ giver, receiver }] or throws with a readable reason.
  // Each receiver is taken from a pool exactly once (the `taken` set), so no name
  // can be drawn twice and every name is drawn once.
  function makeDraw(people, noPairs) {
    const names = people.map((p) => p.name);
    if (names.length < 3) throw new Error("Add at least 3 people to draw.");
    const partner = new Map();
    for (const p of people) if (p.partner) {
      partner.set(p.name, p.partner);
      partner.set(p.partner, p.name);
    }
    const allowed = (g, r) => g !== r && partner.get(g) !== r;

    const givers = shuffle(names);
    const taken = new Set();
    const result = new Map();
    let steps = 0;

    function place(i) {
      if (i === givers.length) return true;
      if (++steps > 200000) return false;
      const g = givers[i];
      for (const r of shuffle(names)) {
        if (taken.has(r) || !allowed(g, r)) continue;
        if (noPairs && result.get(r) === g) continue;
        taken.add(r); result.set(g, r);
        if (place(i + 1)) return true;
        taken.delete(r); result.delete(g);
      }
      return false;
    }

    let ok = place(0);
    if (!ok && noPairs) {
      throw new Error("No draw fits these rules. Try turning off “no swapping pairs” or removing a partner rule.");
    }
    if (!ok) throw new Error("No draw fits these partner rules. Remove one and try again.");

    const pairs = names.map((g) => ({ giver: g, receiver: result.get(g) }));
    verify(pairs, names);
    return pairs;
  }

  // Independent check, run after every draw and before every list of links.
  function verify(pairs, names) {
    const givers = new Set(pairs.map((p) => p.giver));
    const receivers = new Set(pairs.map((p) => p.receiver));
    const problems = [];
    if (pairs.length !== names.length) problems.push("wrong number of pairs");
    if (givers.size !== names.length) problems.push("a giver appears twice");
    if (receivers.size !== names.length) problems.push("a name was drawn twice");
    for (const n of names) {
      if (!givers.has(n)) problems.push(n + " has no recipient");
      if (!receivers.has(n)) problems.push(n + " was never drawn");
    }
    for (const p of pairs) if (p.giver === p.receiver) problems.push(p.giver + " drew themself");
    if (problems.length) throw new Error("Draw failed its check: " + problems.join("; "));
    return true;
  }

  // ---------- links ----------
  // The assignment travels inside the link's #hash, so nothing is stored on a server.
  // It is scrambled (not strong encryption) so a glance at the URL doesn't spoil it.
  function keystream(seed, len) {
    let x = seed >>> 0 || 1;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0;
      out[i] = x & 0xff;
    }
    return out;
  }
  const b64u = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

  function encode(obj) {
    const data = new TextEncoder().encode(JSON.stringify(obj));
    const salt = new Uint32Array(1); crypto.getRandomValues(salt);
    const ks = keystream(salt[0], data.length);
    const out = new Uint8Array(4 + data.length);
    new DataView(out.buffer).setUint32(0, salt[0]);
    for (let i = 0; i < data.length; i++) out[4 + i] = data[i] ^ ks[i];
    return b64u(out);
  }
  function decode(token) {
    const bytes = unb64u(token);
    const seed = new DataView(bytes.buffer).getUint32(0);
    const body = bytes.slice(4);
    const ks = keystream(seed, body.length);
    for (let i = 0; i < body.length; i++) body[i] ^= ks[i];
    return JSON.parse(new TextDecoder().decode(body));
  }

  function revealUrl(state, pair) {
    const e = state.event;
    const token = encode({ g: pair.giver, r: pair.receiver, t: e.title, b: e.budget, d: e.date, n: e.note });
    return new URL("reveal.html#" + token, location.href).href;
  }

  // ---------- tiny DOM helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  function el(tag, attrs = {}, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) n.setAttribute(k, v === true ? "" : v);
    }
    for (const k of kids.flat()) n.append(k instanceof Node ? k : document.createTextNode(String(k)));
    return n;
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch (_) {
      const t = el("textarea", { style: "position:fixed;opacity:0" }); t.value = text;
      document.body.append(t); t.select();
      const ok = document.execCommand("copy"); t.remove(); return ok;
    }
  }
  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "long", year: "numeric" });
  }
  function snow(count = 28) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = el("div", { class: "snow", "aria-hidden": "true" });
    for (let i = 0; i < count; i++) {
      const s = 3 + Math.random() * 5;
      box.append(el("i", { style: `left:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-duration:${8 + Math.random() * 10}s;animation-delay:-${Math.random() * 18}s` }));
    }
    document.body.prepend(box);
  }

  window.Santa = { load, save, reset, norm, same, makeDraw, verify, encode, decode, revealUrl, $, el, copy, formatDate, snow };
})();
