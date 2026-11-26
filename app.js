// Shared logic: the draw, its check, scrambling, and small DOM helpers.
(function () {
  "use strict";

  const norm = (s) => s.trim().replace(/\s+/g, " ");
  const same = (a, b) => norm(a).toLocaleLowerCase() === norm(b).toLocaleLowerCase();

  // ---------- the draw ----------
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

  // people: [{ name, partner }]. Returns [{ giver, receiver }] or throws a readable reason.
  // Every receiver is taken from the pool once (the `taken` set), so no name can be
  // drawn twice, every name is drawn once, and nobody draws themself.
  function makeDraw(people, noPairs) {
    const names = people.map((p) => p.name);
    if (names.length < 3) throw new Error("Add at least 3 people to draw.");
    const partner = new Map();
    for (const p of people) if (p.partner) { partner.set(p.name, p.partner); partner.set(p.partner, p.name); }
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
    if (!place(0)) {
      throw new Error(noPairs
        ? "No draw fits these rules. Turn off “no swapping pairs” or remove a “can't draw” rule."
        : "No draw fits these “can't draw” rules. Remove one and try again.");
    }
    const pairs = names.map((g) => ({ giver: g, receiver: result.get(g) }));
    verify(pairs, names);
    return pairs;
  }

  // Independent check of any draw.
  function verify(pairs, names) {
    const givers = new Set(pairs.map((p) => p.giver));
    const receivers = new Set(pairs.map((p) => p.receiver));
    const problems = [];
    if (pairs.length !== names.length) problems.push("wrong number of pairs");
    if (givers.size !== names.length) problems.push("a giver appears twice");
    if (receivers.size !== names.length) problems.push("a name was drawn twice");
    for (const n of names) {
      if (!givers.has(n)) problems.push(n + " has nobody to buy for");
      if (!receivers.has(n)) problems.push(n + " was never drawn");
    }
    for (const p of pairs) if (p.giver === p.receiver) problems.push(p.giver + " drew themself");
    if (problems.length) throw new Error("The draw failed its check: " + problems.join("; ") + ".");
    return true;
  }

  // ---------- scrambling ----------
  // Recipients are stored scrambled so opening family.json doesn't spoil anything at a glance.
  // It is not strong encryption.
  function keystream(seed, len) {
    let x = seed >>> 0 || 1;
    const out = new Uint8Array(len);
    for (let i = 0; i < len; i++) { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; out[i] = x & 0xff; }
    return out;
  }
  const b64u = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
  // Padded to a fixed size so a short token doesn't give away a short name.
  const PAD = 64;
  function scramble(text) {
    const raw = new TextEncoder().encode(text);
    const data = new Uint8Array(Math.ceil((raw.length + 1) / PAD) * PAD);
    data.set(raw);
    const salt = new Uint32Array(1); crypto.getRandomValues(salt);
    const ks = keystream(salt[0], data.length);
    const out = new Uint8Array(4 + data.length);
    new DataView(out.buffer).setUint32(0, salt[0]);
    for (let i = 0; i < data.length; i++) out[4 + i] = data[i] ^ ks[i];
    return b64u(out);
  }
  function unscramble(token) {
    const bytes = unb64u(token);
    const body = bytes.slice(4);
    const ks = keystream(new DataView(bytes.buffer).getUint32(0), body.length);
    for (let i = 0; i < body.length; i++) body[i] ^= ks[i];
    const end = body.indexOf(0);
    return new TextDecoder().decode(end === -1 ? body : body.subarray(0, end));
  }

  // ---------- helpers ----------
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
  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (_) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  };
  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T12:00:00");
    return isNaN(d) ? iso : d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  }
  function snow(count = 34) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = el("div", { class: "snow", "aria-hidden": "true" });
    for (let i = 0; i < count; i++) {
      const s = 2 + Math.random() * 4;
      box.append(el("i", { style: `left:${Math.random() * 100}%;width:${s}px;height:${s}px;opacity:${0.35 + Math.random() * 0.5};animation-duration:${10 + Math.random() * 12}s;animation-delay:-${Math.random() * 22}s` }));
    }
    document.body.prepend(box);
  }

  window.Santa = { norm, same, shuffle, makeDraw, verify, scramble, unscramble, $, el, store, formatDate, snow };
})();
