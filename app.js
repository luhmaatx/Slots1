"use strict";
const $ = (id) => document.getElementById(id),
  fmt = (n) => Number(n || 0).toLocaleString(),
  tg = window.Telegram?.WebApp;
const store = {
  get: (k) => {
    try {
      return localStorage.getItem("killamani:" + k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem("killamani:" + k, v);
    } catch {}
  },
  remove: (k) => {
    try {
      localStorage.removeItem("killamani:" + k);
    } catch {}
  },
};
const games = [
  {
    id: "spoiled",
    name: "Spoiled Rotten",
    tag: "TOO EXPENSIVE TO LOSE",
    art: "spoiled",
    bets: [300, 600, 1500, 3000],
    endpoint: "/api/spin",
    bonus: "Spoiled Rotten · Mystery Gifts",
  },
  {
    id: "squirt",
    name: "Squirt City, Bitch!",
    tag: "SPLASH · TAP · WIN BIG",
    art: "squirt",
    bets: [100, 250, 500, 1000],
    endpoint: "/api/squirt/spin",
    bonus: "Squirt City · Splash Bonus",
  },
  {
    id: "brat",
    name: "Brat Tax",
    tag: "BEAUTY COSTS EXTRA",
    art: "brat",
    bets: [100, 250, 500, 1000],
    bonus: "Pay Up!",
  },
  {
    id: "first",
    name: "First Class Only",
    tag: "PASSPORTS · PLANES · BIGGER PLANS",
    art: "first",
    bets: [100, 250, 500, 1000],
    bonus: "Baggage Claim",
  },
  {
    id: "cash",
    name: "Killa Cashgrab",
    tag: "CATCH IT · STACK IT · KILL IT",
    art: "cash",
    bets: [100, 250, 500, 1000],
    bonus: "Money Storm",
  },
  {
    id: "red",
    name: "Red Flags & Riches",
    tag: "LOVE ’EM · BLOCK ’EM · BANK IT",
    art: "red",
    bets: [100, 250, 500, 1000],
    bonus: "Block or Bank?",
  },
  {
    id: "vip",
    name: "VIP Only",
    tag: "PRIVATE ROOMS · BIGGER REWARDS",
    art: "vip",
    bets: [100, 250, 500, 1000],
    bonus: "The Privé Penthouse",
  },
  {
    id: "double",
    name: "Double Trouble",
    tag: "RED × BLONDE",
    art: "double",
    bets: [100, 250, 500, 1000],
    bonus: "Pick Your Side",
  },
  {
    id: "vault",
    name: "Millionaire’s Vault",
    tag: "243 WAYS · LOCK IT · SPIN IT · STACK IT",
    art: "vault",
    bets: [100, 250, 500, 1000],
    bonus: "Lock & Collect",
  },
  {
    id: "duck",
    name: "Lucky Ducky",
    tag: "PICK 3 DUCKS · FIND THE GOLD",
    art: "duck",
    bets: [100, 250, 500],
    arcade: true,
  },
  {
    id: "obsession",
    name: "Wheel of Obsession",
    tag: "SPINS THROUGH GAMEPLAY",
    art: "obsession",
    bets: [0],
    arcade: true,
  },
  {
    id: "claw",
    name: "Spoiled Princess Claw",
    tag: "CONTROL THE CLAW · GRIP & WIN",
    art: "claw",
    bets: [100, 250, 500],
    arcade: true,
  },
];
const icons = {
  diamond: "💎",
  seven: "7️⃣",
  heart: "💗",
  rose: "🌹",
  spade: "♠️",
  star: "⭐",
  wild: "W",
  scatter: "🎁",
  splash: "💦",
  neon7: "7️⃣",
  bolt: "⚡",
  moon: "🌙",
  bubble: "🫧",
  afterhours: "🎟️",
  bag: "👜",
  lipstick: "💄",
  crown: "👑",
  heels: "👠",
  cash: "💵",
  plane: "✈️",
  passport: "🛂",
  champagne: "🥂",
  luggage: "🧳",
  key: "🗝️",
  stack: "💸",
  dollar: "💲",
  gift: "🎁",
  suite: "🏙️",
  red: "💋",
  blonde: "👱‍♀️",
  cherry: "🍒",
  flag: "🚩",
  ring: "💍",
  vault: "🔐",
  gold: "🥇",
  panther: "🐈‍⬛",
};
const collage = {
  first: [1, 0],
  cash: [2, 0],
  red: [0, 1],
  vip: [1, 1],
  double: [2, 1],
};
let player = null,
  selected = null,
  betIndex = 0,
  busy = false,
  automatic = false,
  turbo = false,
  bonus = null,
  duckPicks = [],
  x = 0.5,
  y = 0.5,
  rotation = 0,
  openedPage = "home";
let tapClockOffset = 0;
let soundOn = store.get("sound") === "on",
  audio = null,
  tapTimer = null,
  tapSending = false,
  tapCount = 0,
  autoTimer = null;
function artStyle(id) {
  if (collage[id]) {
    const [col, row] = collage[id];
    return `background-image:url('/assets/themes.webp');background-size:300% 200%;background-position:${col * 50}% ${row * 100}%`;
  }
  if (["duck", "claw", "obsession"].includes(id))
    return `background-image:url('/assets/arcade.webp');background-size:300% 100%;background-position:${["duck", "obsession", "claw"].indexOf(id) * 50}% center`;
  return `background-image:url('/assets/${id}.webp')`;
}
function card(g) {
  const b = document.createElement("button");
  b.className = "game-card";
  b.innerHTML = `<span class="card-art" style="${artStyle(g.art)}"></span><span class="copy"><strong>${g.name}</strong><small>${g.tag}</small><span class="card-play">PLAY NOW ↗</span></span>`;
  b.onclick = () => openGame(g.id);
  return b;
}
function buildCards() {
  for (const [id, list] of [
    ["slotCards", games.filter((g) => !g.arcade)],
    ["featured", games.slice(0, 3)],
    ["arcadeCards", games.filter((g) => g.arcade)],
    ["arcadeFeatured", games.filter((g) => g.arcade)],
  ])
    for (const g of list) $(id).append(card(g));
  for (let i = 1; i <= 5; i++) {
    const b = document.createElement("button");
    b.textContent = "🚪 " + i;
    b.onclick = () => daily("velvet", { door: i });
    $("doors").append(b);
  }
}
function toast(message) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("toast").hidden = true), 4500);
}
function sound() {
  if (!soundOn) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const o = audio.createOscillator(),
      gain = audio.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(650, audio.currentTime);
    o.frequency.exponentialRampToValueAtTime(1100, audio.currentTime + 0.15);
    gain.gain.setValueAtTime(0.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.25);
    o.connect(gain).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + 0.26);
  } catch {}
}
function syncSound() {
  $("sound").textContent = "♫ " + (soundOn ? "ON" : "OFF");
  $("sound").setAttribute("aria-pressed", String(soundOn));
  $("sound").setAttribute(
    "aria-label",
    "Turn sound " + (soundOn ? "off" : "on"),
  );
}
const readEndpoints = new Set([
  "/api/me",
  "/api/arcade/state",
  "/api/bonus/session",
  "/api/themed/bonus/state",
  "/api/history",
  "/api/gift/history",
  "/api/gift/lookup",
]);
let pendingAction = null;
try {
  pendingAction = JSON.parse(store.get("pending") || "null");
} catch {
  store.remove("pending");
}
function credentials() {
  const initData = tg?.initData || "";
  return initData
    ? { initData }
    : { guestToken: store.get("guestToken") || "" };
}
async function send(endpoint, body) {
  let response;
  const controller = new AbortController(),
    timeout = setTimeout(() => controller.abort(), 15000);
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, ...credentials() }),
      signal: controller.signal,
    });
  } catch {
    const e = Error(
      "Connection interrupted. Reload to recover the same action safely.",
    );
    e.uncertain = true;
    throw e;
  } finally {
    clearTimeout(timeout);
  }
  let d;
  try {
    d = await response.json();
  } catch {
    const e = Error(
      "The server returned an unreadable response. Reload to recover.",
    );
    e.uncertain = true;
    throw e;
  }
  if (!response.ok) {
    const e = Error(d.error || "Server request failed");
    e.uncertain = response.status >= 500;
    throw e;
  }
  return d;
}
async function api(endpoint, fields = {}, recover = false) {
  const mutation = !readEndpoints.has(endpoint) && endpoint !== "/api/guest";
  if (mutation) {
    if (pendingAction && !recover)
      throw Error(
        "An earlier action needs recovery. Reload before playing again.",
      );
    if (!recover) {
      fields = { ...fields, requestId: crypto.randomUUID() };
      pendingAction = { endpoint, fields, account: player?.id };
      store.set("pending", JSON.stringify(pendingAction));
    }
  }
  try {
    let d;
    try {
      d = await send(endpoint, fields);
    } catch (e) {
      if (!e.uncertain) throw e;
      d = await send(endpoint, fields);
    }
    if (mutation) {
      pendingAction = null;
      store.remove("pending");
    }
    return d;
  } catch (e) {
    if (mutation && !e.uncertain) {
      pendingAction = null;
      store.remove("pending");
    }
    throw e;
  }
}
function apply(data) {
  if (!player) return;
  const fields = [
    "balance",
    "killaMoney",
    "freeSpins",
    "squirtFreeSpins",
    "dailyAvailable",
    "wheelAvailable",
    "scratchAvailable",
    "velvetAvailable",
    "loyaltyAvailable",
    "vipLevel",
    "freeSpinBet",
    "squirtFreeSpinBet",
  ];
  for (const key of fields)
    if (data[key] !== undefined) player[key] = data[key];
  sync();
}
function sync() {
  if (!player) return;
  $("coins").textContent = fmt(player.balance);
  $("money").textContent = fmt(player.killaMoney);
  $("free").textContent = fmt(
    Number(player.freeSpins || 0) + Number(player.squirtFreeSpins || 0),
  );
  $("roomBalance").textContent = fmt(player.balance) + " KILLACOINS";
  $("rewardMoney").textContent = fmt(player.killaMoney);
  $("name").textContent = player.username || "Guest";
  $("avatar").textContent = (player.username || "G").charAt(0).toUpperCase();
  $("loyalty").disabled = player.guest || !player.loyaltyAvailable;
  $("loyalty").textContent = player.guest
    ? "OPEN IN TELEGRAM TO EARN"
    : player.loyaltyAvailable
      ? "CLAIM DAILY CHECK-IN"
      : "CLAIMED · BACK TOMORROW UTC";
  document.querySelectorAll("[data-daily]").forEach((b) => {
    const key = {
      claim: "dailyAvailable",
      wheel: "wheelAvailable",
      scratch: "scratchAvailable",
    }[b.dataset.daily];
    b.disabled = !player[key] || busy;
  });
  $("doors")
    .querySelectorAll("button")
    .forEach((b) => (b.disabled = !player.velvetAvailable || busy));
  $("giftForm")
    .querySelectorAll("input,select,button")
    .forEach((e) => (e.disabled = player.guest || busy));
}
async function refresh() {
  const d = await api("/api/me");
  player = { ...player, ...d };
  sync();
  return d;
}
async function login(guest = false) {
  $("enter").disabled = $("guest").disabled = true;
  $("loginStatus").textContent = "Opening the Palace…";
  try {
    if (guest && !tg?.initData && !store.get("guestToken")) {
      const d = await api("/api/guest");
      store.set("guestToken", d.guestToken);
    }
    if (!tg?.initData && !store.get("guestToken") && !guest)
      throw Error(
        "Open from your Telegram bot, or choose browser guest access.",
      );
    await refresh();
    if (pendingAction) {
      if (pendingAction.account && pendingAction.account !== player.id)
        throw Error(
          "An action is pending for another account. Reopen with that account to recover it.",
        );
      await api(pendingAction.endpoint, pendingAction.fields, true);
      await refresh();
      toast("Your previous action was recovered.");
    }
    $("welcome").hidden = true;
    $("club").hidden = false;
    nav("home");
  } catch (e) {
    $("loginStatus").textContent = e.message;
  } finally {
    $("enter").disabled = $("guest").disabled = false;
  }
}
async function nav(id) {
  if (busy) return;
  stopAuto();
  openedPage = id;
  document.querySelectorAll(".page").forEach((p) => (p.hidden = p.id !== id));
  document
    .querySelectorAll("[data-nav]")
    .forEach((b) => b.classList.toggle("active", b.dataset.nav === id));
  window.scrollTo({ top: 0 });
  try {
    if (id === "arcade") await arcadeState();
    if (id === "leaderboard") await leaders();
    if (id === "wallet") await history();
    await refresh();
  } catch (e) {
    toast(e.message);
  }
}
async function leaders() {
  const r = await fetch("/api/leaderboard");
  if (!r.ok) throw Error("Leaderboard unavailable");
  const d = await r.json();
  $("leaders").replaceChildren();
  if (!d.players.length) $("leaders").textContent = "No Telegram players yet.";
  d.players.forEach((p) => {
    const li = document.createElement("li");
    for (const [className, value] of [
      ["rank", p.rank],
      ["leader-name", p.username],
      ["result-delta", fmt(p.balance) + " ◉"],
    ]) {
      const el = document.createElement("span");
      el.className = className;
      el.textContent = value;
      li.append(el);
    }
    $("leaders").append(li);
  });
}
async function history() {
  const [d, g] = await Promise.all([
    api("/api/history"),
    api("/api/gift/history"),
  ]);
  $("history").replaceChildren();
  if (!d.history.length)
    $("history").textContent = "Your game history will appear here.";
  for (const r of d.history) {
    const row = document.createElement("div"),
      a = document.createElement("span"),
      b = document.createElement("span");
    a.textContent = r.action + " · " + new Date(r.at).toLocaleString();
    b.textContent = "Bet " + fmt(r.bet) + " · Won " + fmt(r.win);
    row.append(a, b);
    $("history").append(row);
  }
  $("giftHistory").replaceChildren();
  const list = g.history || g.gifts || [];
  if (!list.length) $("giftHistory").textContent = "No gifts yet.";
  for (const r of list) {
    const div = document.createElement("div");
    div.textContent = `${r.direction} · ${r.username} · ${fmt(r.amount)} KillaCoins`;
    $("giftHistory").append(div);
  }
}
async function arcadeState() {
  const d = await api("/api/arcade/state");
  $("ticketProgress").textContent =
    `${fmt(d.wheelTickets)} WHEEL TICKETS · ${d.qualifyingRounds % 10}/10 PAID SLOT ROUNDS TOWARD YOUR NEXT TICKET`;
  return d;
}
async function daily(kind, fields = {}) {
  if (busy) return;
  busy = true;
  sync();
  $("dailyStatus").textContent = "Revealing…";
  try {
    const d = await api(
      kind === "claim" ? "/api/daily/claim" : "/api/" + kind,
      fields,
    );
    apply(d);
    $("dailyStatus").textContent =
      `${kind === "velvet" ? "DOOR " + fields.door + " · " : ""}+${fmt(d.prize)} KillaCoins`;
    sound();
  } catch (e) {
    $("dailyStatus").textContent = e.message;
  } finally {
    busy = false;
    await refresh().catch(() => {});
    sync();
  }
}
function stopAuto() {
  automatic = false;
  clearTimeout(autoTimer);
  $("auto").setAttribute("aria-pressed", "false");
}
function setBusy(value) {
  busy = value;
  for (const id of ["back", "less", "more", "max", "play"])
    $(id).disabled = value;
}
function setBet(i) {
  if (busy) return;
  const free =
    selected.id === "spoiled"
      ? player.freeSpins
      : selected.id === "squirt"
        ? player.squirtFreeSpins
        : 0;
  if (free > 0)
    i = selected.bets.indexOf(
      selected.id === "spoiled" ? player.freeSpinBet : player.squirtFreeSpinBet,
    );
  betIndex = Math.max(0, Math.min(selected.bets.length - 1, i));
  $("betValue").textContent =
    selected.id === "obsession" ? "1 TICKET" : fmt(selected.bets[betIndex]);
}
// The 36 illustrated symbols share one transparent atlas to limit network requests.
const symbolOrder = [
  "diamond",
  "seven",
  "heart",
  "rose",
  "spade",
  "star",
  "wild",
  "scatter",
  "splash",
  "neon7",
  "bolt",
  "moon",
  "bubble",
  "afterhours",
  "bag",
  "lipstick",
  "crown",
  "heels",
  "cash",
  "plane",
  "passport",
  "champagne",
  "luggage",
  "key",
  "stack",
  "dollar",
  "gift",
  "suite",
  "red",
  "blonde",
  "cherry",
  "flag",
  "ring",
  "vault",
  "gold",
  "panther",
];
const gameSymbolSets = {
  spoiled: [
    "diamond",
    "seven",
    "heart",
    "rose",
    "spade",
    "star",
    "wild",
    "scatter",
  ],
  squirt: [
    "splash",
    "diamond",
    "neon7",
    "heart",
    "bolt",
    "moon",
    "bubble",
    "afterhours",
  ],
  brat: ["bag", "lipstick", "diamond", "crown", "heels", "cash", "wild"],
  first: [
    "plane",
    "passport",
    "champagne",
    "luggage",
    "diamond",
    "key",
    "wild",
  ],
  cash: ["cash", "stack", "diamond", "dollar", "crown", "bag", "wild"],
  red: ["heart", "rose", "diamond", "flag", "heels", "ring", "wild"],
  vip: ["crown", "champagne", "key", "diamond", "gift", "suite", "wild"],
  double: ["red", "blonde", "heart", "diamond", "cherry", "crown", "wild"],
  vault: ["vault", "gold", "diamond", "cash", "crown", "panther", "key"],
};
function sprite(symbol, label = symbol) {
  const i = symbolOrder.indexOf(symbol),
    el = document.createElement("span");
  el.className = "lux-symbol";
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", label);
  if (i >= 0) {
    el.style.backgroundPosition = `${(i % 6) * 20}% ${Math.floor(i / 6) * 20}%`;
    el.dataset.symbol = symbol;
  } else {
    el.classList.add("lux-symbol-fallback");
    el.textContent = icons[symbol] || symbol;
  }
  return el;
}
function spriteMarkup(symbol) {
  const i = symbolOrder.indexOf(symbol);
  return `<span aria-hidden="true" class="lux-symbol" style="background-position:${(i % 6) * 20}% ${Math.floor(i / 6) * 20}%"></span>`;
}
function celebrate(win) {
  if (!win || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const host = $("gameStage"),
    fx = document.createElement("div");
  fx.className = "win-particles";
  fx.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 16; i++) {
    const dot = document.createElement("i");
    dot.style.setProperty("--dx", `${(Math.random() - 0.5) * 440}px`);
    dot.style.setProperty("--dy", `${-70 - Math.random() * 200}px`);
    dot.style.setProperty("--delay", `${Math.random() * 0.18}s`);
    fx.append(dot);
  }
  host.append(fx);
  setTimeout(() => fx.remove(), 1200);
}

function renderReels(symbols, winning = []) {
  const board = $("reels");
  if (!board) return;
  board.replaceChildren();
  const indexes = new Set(winning.flatMap((w) => w.indexes || []));
  for (let row = 0; row < 3; row++)
    for (let col = 0; col < 5; col++) {
      const i = col * 3 + row,
        el = document.createElement("div");
      el.className = "reel-cell" + (indexes.has(i) ? " win" : "");
      el.append(sprite(symbols[i]));
      if (["wild", "scatter", "afterhours"].includes(symbols[i])) {
        const tag = document.createElement("small");
        tag.className = "symbol-tag";
        tag.textContent = symbols[i] === "wild" ? "WILD" : "FREE SPINS";
        el.append(tag);
      }
      el.setAttribute("aria-label", symbols[i] || "symbol");
      board.append(el);
    }
}
function duckArt(i) {
  return `<svg class="duck-art" viewBox="0 0 120 112" aria-hidden="true"><defs><linearGradient id="duck-${i}" x2="0.8" y2="1"><stop stop-color="#fff6b0"/><stop offset=".55" stop-color="#ffd166"/><stop offset="1" stop-color="#d98627"/></linearGradient></defs><ellipse cx="60" cy="96" rx="42" ry="7" fill="#76f8ed" opacity=".35"/><path d="M20 62Q7 52 14 38Q24 53 38 51C47 39 60 40 77 49L99 60C112 96 39 109 22 80Z" fill="url(#duck-${i})" stroke="#ffdba0" stroke-width="2"/><circle cx="76" cy="35" r="25" fill="url(#duck-${i})" stroke="#ffe3a5" stroke-width="2"/><path d="M95 34L115 41L94 48Z" fill="#f78050"/><ellipse cx="82" cy="29" rx="4" ry="5" fill="#38182a"/><circle cx="83" cy="27" r="1.3" fill="white"/><path d="M38 65Q53 50 69 64Q59 87 39 75" fill="#ffe8a0" stroke="#f3b246" stroke-width="2"/><ellipse cx="84" cy="44" rx="6" ry="3" fill="#f78e8a" opacity=".7"/><path d="M62 13L60 2L71 7L78 0L84 9L95 5L91 18Z" fill="#f7d78b" stroke="#a65f38" stroke-width="2"/><path d="M26 60Q25 67 31 73" stroke="#fff8ce" stroke-width="4" stroke-linecap="round" fill="none"/></svg>`;
}
function clawArt() {
  return `<svg viewBox="0 0 100 130" aria-hidden="true"><defs><linearGradient id="claw-metal"><stop stop-color="#7c664d"/><stop offset=".3" stop-color="#fff2ca"/><stop offset=".55" stop-color="#c7a87d"/><stop offset=".8" stop-color="#fff6db"/><stop offset="1" stop-color="#786049"/></linearGradient></defs><path d="M50 0V54" stroke="#e6c997" stroke-width="5"/><path d="M37 54H63L70 75H30Z" fill="url(#claw-metal)" stroke="#fff2c6"/><path d="M34 72L16 98L28 120L40 111M66 72L84 98L72 120L60 111M50 78V109L44 120" fill="none" stroke="url(#claw-metal)" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="50" cy="67" r="5" fill="#ee75ae" stroke="#fff1cf"/></svg>`;
}
function updateCabinet() {
  let marquee = document.getElementById("cabinetMarquee");
  if (!marquee) {
    marquee = document.createElement("div");
    marquee.id = "cabinetMarquee";
    marquee.className = "cabinet-marquee";
    $("gameStage").before(marquee);
  }
  marquee.replaceChildren();
  const crest = document.createElement("span");
  crest.className = "cabinet-crest";
  const featured = {spoiled:"diamond",squirt:"bolt",brat:"bag",first:"plane",cash:"cash",red:"rose",vip:"crown",double:"heart",vault:"key",duck:"crown",obsession:"heart",claw:"gift"};
  crest.append(sprite(featured[selected.id]));
  const copy = document.createElement("div");
  const label = document.createElement("small");
  label.textContent = "KILLAMANI · PRIVATE FORTUNE CLUB";
  const title = document.createElement("strong");
  title.textContent = selected.name;
  copy.append(label, title);
  const mode = document.createElement("span");
  mode.className = "cabinet-mode";
  mode.textContent = selected.arcade ? "ARCADE" : "SLOTS";
  marquee.append(crest, copy, mode);
}
function wheelMarkup() {
  return (
    '<div class="wheel-wrap"><span class="wheel-pointer">▼</span><div id="wheel" class="wheel">' +
    [100, 250, 500, 750, 1000, 2000, 5000]
      .map(
        (v, i) =>
          `<span class="wheel-label" style="transform:rotate(${(i * 360) / 7 + 360 / 14}deg) translateY(var(--wheel-radius, -104px)) rotate(-${(i * 360) / 7 + 360 / 14}deg)">${fmt(v)}</span>`,
      )
      .join("") +
    '<span class="wheel-center">' +
    spriteMarkup("heart") +
    "</span></div></div>"
  );
}
function clawPosition() {
  const hook = $("hook");
  if (hook) {
    hook.style.left = 10 + x * 80 + "%";
    hook.style.top = 12 + y * 100 + "px";
  }
}
function arcadeStage() {
  duckPicks = [];
  if (selected.id === "duck") {
    $("gameStage").innerHTML =
      '<div class="pool">' +
      Array.from(
        { length: 12 },
        (_, i) =>
          `<button data-duck="${i}" aria-label="Choose duck ${i + 1}">${duckArt(i)}<span class="duck-number">${String(i + 1).padStart(2, "0")}</span></button>`,
      ).join("") +
      "</div>";
    $("gameStage")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => {
            if (busy || b.disabled || duckPicks.length >= 3) return;
            duckPicks.push(Number(b.dataset.duck));
            b.classList.add("selected");
            b.disabled = true;
            $("gameStatus").textContent =
              duckPicks.length + " OF 3 DUCKS SELECTED";
          }),
      );
  }
  if (selected.id === "obsession") {
    $("gameStage").innerHTML = wheelMarkup();
    rotation = 0;
  }
  if (selected.id === "claw") {
    $("gameStage").innerHTML =
      '<div class="claw-field"><span class="claw-hook" id="hook">' + clawArt() + '</span><div class="claw-prizes"><span class="claw-prize-slot" data-prize="heart"></span><span class="claw-prize-slot" data-prize="bag"></span><span class="claw-prize-slot" data-prize="diamond"></span><span class="claw-prize-slot" data-prize="crown"></span><span class="claw-prize-slot" data-prize="gift"></span></div></div><div class="joystick"><button data-dx="-1" aria-label="Move claw left">◀</button><button data-dy="-1" aria-label="Move claw up">▲</button><button data-dy="1" aria-label="Move claw down">▼</button><button data-dx="1" aria-label="Move claw right">▶</button></div>';
    $("gameStage")
      .querySelectorAll("[data-prize]")
      .forEach((el) => el.append(sprite(el.dataset.prize)));
    clawPosition();
    $("gameStage")
      .querySelectorAll(".joystick button")
      .forEach((b) => {
        let hold;
        const stop = () => clearInterval(hold),
          move = () => {
            if (busy) return;
            x = Math.max(0, Math.min(1, x + Number(b.dataset.dx || 0) * 0.04));
            y = Math.max(0, Math.min(1, y + Number(b.dataset.dy || 0) * 0.04));
            clawPosition();
          };
        b.onpointerdown = (e) => {
          e.preventDefault();
          b.setPointerCapture(e.pointerId);
          move();
          hold = setInterval(move, 80);
        };
        b.onpointerup = b.onpointercancel = b.onlostpointercapture = stop;
        b.onkeydown = (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            move();
          }
        };
      });
  }
}
async function openGame(id) {
  if (busy) return;
  stopAuto();
  stopTap();
  selected = games.find((g) => g.id === id);
  bonus = null;
  betIndex = 0;
  x = y = 0.5;
  $("gameRoom").dataset.game = selected.id;
  updateCabinet();
  $("gameStage").dataset.layout = selected.arcade
    ? ""
    : selected.id === "vault"
      ? "243 WAYS"
      : "5 REELS · 5 PAYLINES";
  $("bonusPanel").dataset.game = selected.id;
  $("gameName").textContent = selected.name;
  $("gameTag").textContent = selected.tag;
  $("roomArt").style.cssText = artStyle(selected.art);
  $("bonusPanel").hidden = true;
  $("gameStatus").textContent = "CHOOSE YOUR BET AND PLAY";
  $("gameRoom").hidden = false;
  document.body.style.overflow = "hidden";
  $("gameRoom").scrollTop = 0;
  setBet(0);
  $("auto").hidden = $("turbo").hidden = !!selected.arcade;
  $("betControls").hidden = selected.id === "obsession";
  $("play").textContent =
    selected.id === "duck"
      ? "REVEAL"
      : selected.id === "claw"
        ? "DROP"
        : "SPIN";
  if (selected.arcade) {
    arcadeStage();
    if (id === "obsession")
      try {
        const d = await arcadeState();
        $("gameStatus").textContent = d.wheelTickets + " TICKETS AVAILABLE";
      } catch (e) {
        $("gameStatus").textContent = e.message;
      }
  } else {
    $("gameStage").innerHTML =
      '<div id="reels" class="reels" aria-label="Slot reels"></div>';
    const preview = gameSymbolSets[id] || symbolOrder;
    renderReels(
      Array.from({ length: 15 }, (_, i) => preview[i % preview.length]),
    );
    await loadBonus();
  }
  sync();
}
async function play() {
  if (busy || !selected) return;
  const g = selected,
    bet = g.bets[betIndex];
  if (g.id === "duck" && duckPicks.length !== 3)
    return toast("Choose exactly 3 ducks first.");
  if (bonus && !bonus.done && !bonus.completed) {
    stopAuto();
    return toast("Finish your unlocked bonus first.");
  }
  setBusy(true);
  $("gameStatus").textContent = "GOOD LUCK…";
  let animation;
  try {
    if (!g.arcade) {
      $("reels").classList.add("spinning");
      animation = setInterval(
        () =>
          renderReels(
            Array.from({ length: 15 }, () => {
              const pool = gameSymbolSets[g.id] || symbolOrder;
              return pool[Math.floor(Math.random() * pool.length)];
            }),
          ),
        70,
      );
    }
    const body = {
      bet,
      ...(g.arcade || !g.endpoint ? { game: g.id } : {}),
      ...(g.id === "claw"
        ? { x, y }
        : g.id === "duck"
          ? { picks: duckPicks }
          : {}),
    };
    const d = await api(
      g.arcade ? "/api/arcade/play" : g.endpoint || "/api/themed/spin",
      body,
    );
    clearInterval(animation);
    if (!g.arcade) {
      await new Promise((r) => setTimeout(r, turbo ? 70 : 400));
      $("reels").classList.remove("spinning");
      renderReels(d.symbols, d.winningLines);
      if (g.id === "squirt")
        apply({ balance: d.balance, squirtFreeSpins: d.freeSpins });
      else apply(d);
    } else apply(d);
    $("gameStatus").textContent =
      (d.freeSpinUsed ? "FREE SPIN · " : "") +
      (d.win ? "WIN +" + fmt(d.win) + " KILLACOINS" : "NO WIN THIS ROUND") +
      (d.awardedFreeSpins ? " · +" + d.awardedFreeSpins + " FREE SPINS" : "");
    if (d.win) {
      sound();
      celebrate(d.win);
    }
    if (g.id === "duck") {
      const map = {
        blank: "🌊",
        small: "🪙",
        medium: "💰",
        large: "💎",
        gold: "👑",
      };
      duckPicks.forEach((n, i) => {
        const button = $("gameStage").querySelector(`[data-duck="${n}"]`);
        const symbol = {small:"gold",medium:"cash",large:"diamond",gold:"crown"}[d.ducks[i]];
        button.replaceChildren();
        button.classList.add("duck-revealed");
        if (symbol) button.append(sprite(symbol));
        else button.textContent = map[d.ducks[i]];
        button.setAttribute("aria-label", "Duck " + (n + 1) + ": " + d.ducks[i]);
      });
      if (d.bonus) $("gameStatus").textContent += " · THREE GOLD JACKPOT!";
      await new Promise((r) => setTimeout(r, 1600));
      arcadeStage();
    }
    if (g.id === "obsession") {
      const amounts = [100, 250, 500, 750, 1000, 2000, 5000],
        target = (360 - ((amounts.indexOf(d.win) * 360) / 7 + 360 / 14)) % 360;
      rotation += 1800 + ((target - (rotation % 360) + 360) % 360);
      $("wheel").style.transform = `rotate(${rotation}deg)`;
      await new Promise((r) => setTimeout(r, 2700));
      await arcadeState();
    }
    if (g.id === "claw") {
      $("hook").style.top = "180px";
      $("gameStatus").textContent =
        (d.caught
          ? "CAUGHT " + d.item.toUpperCase() + " · +" + fmt(d.win)
          : "THE CLAW MISSED") + (d.royal ? " · ROYAL BONUS +5× BET" : "");
      await new Promise((r) => setTimeout(r, 1000));
      clawPosition();
    }
    if (!g.arcade) await loadBonus();
    await refresh();
  } catch (e) {
    clearInterval(animation);
    $("reels")?.classList.remove("spinning");
    stopAuto();
    $("gameStatus").textContent = e.message;
    await refresh().catch(() => {});
  } finally {
    setBusy(false);
    setBet(betIndex);
    if (automatic) autoTimer = setTimeout(play, turbo ? 150 : 650);
  }
}
async function loadBonus() {
  if (!selected || selected.arcade) return;
  try {
    const g = selected;
    const d = await api(
      g.endpoint ? "/api/bonus/session" : "/api/themed/bonus/state",
      g.endpoint
        ? { kind: g.id === "spoiled" ? "vault" : "slide" }
        : { game: g.id },
    );
    bonus = d.session;
    if (bonus && !bonus.done && !bonus.completed) {
      stopAuto();
      renderBonus();
    } else $("bonusPanel").hidden = true;
  } catch (e) {
    if (!e.message.includes("Land at least")) {
      $("gameStatus").textContent = e.message;
      stopAuto();
    }
  }
}
function renderBonus() {
  const g = selected;
  $("bonusPanel").hidden = false;
  $("bonusName").textContent = g.bonus;
  $("bonusChoices").replaceChildren();
  $("bonusStatus").textContent = "";
  if (g.id === "squirt") {
    renderTap();
    return;
  }
  const legacy = g.id === "spoiled",
    selections = legacy ? bonus.opened : bonus.selections;
  const count = legacy ? 12 : bonus.labels.length,
    allowed = bonus.picks || 1;
  $("bonusText").textContent =
    `${selections.length} / ${allowed} PICKS · TOTAL ${fmt(bonus.total)} KILLACOINS`;
  for (let i = 0; i < count; i++) {
    const chosen = selections.find((s) => s.choice === i),
      b = document.createElement("button");
    const label = chosen
      ? "+" + fmt(chosen.award)
      : legacy
        ? "GIFT " + (i + 1)
        : bonus.labels[i];
    const symbol = chosen
      ? "stack"
      : {
          spoiled: "scatter",
          brat: "bag",
          first: "luggage",
          cash: "cash",
          red: "flag",
          vip: "suite",
          double: i === 0 ? "red" : "blonde",
          vault: "vault",
        }[g.id] || "gift";
    b.className = "bonus-prize";
    b.append(sprite(symbol));
    const text = document.createElement("span");
    text.className = "prize-label";
    text.textContent = label;
    b.append(text);
    b.setAttribute("aria-label", label);
    b.disabled = !!chosen || bonus.done || bonus.completed;
    b.classList.toggle("revealed", !!chosen);
    b.onclick = () => pickBonus(i);
    $("bonusChoices").append(b);
  }
}
async function pickBonus(choice) {
  if (busy) return;
  setBusy(true);
  $("bonusChoices")
    .querySelectorAll("button")
    .forEach((b) => (b.disabled = true));
  try {
    const legacy = selected.id === "spoiled";
    const d = await api(
      legacy ? "/api/bonus/pick" : "/api/themed/bonus/pick",
      legacy ? { kind: "vault", choice } : { id: bonus.id, choice },
    );
    apply(d);
    bonus = legacy ? d.session : { ...bonus, ...d };
    renderBonus();
    $("bonusStatus").textContent =
      "+" +
      fmt(d.award) +
      " KILLACOINS" +
      (bonus.done || bonus.completed ? " · BONUS COMPLETE" : "");
    sound();
  } catch (e) {
    $("bonusStatus").textContent = e.message;
    await loadBonus();
  } finally {
    setBusy(false);
  }
}
function stopTap() {
  clearInterval(tapTimer);
  tapTimer = null;
}
function renderTap() {
  if (bonus.started && Number.isFinite(bonus.remainingMs))
    tapClockOffset =
      Date.now() + bonus.remainingMs - Date.parse(bonus.expiresAt);
  $("bonusText").textContent =
    "Tap for virtual KillaCoins. Server caps accepted taps at 16 per second.";
  $("bonusChoices").innerHTML =
    '<div style="grid-column:1/-1"><div class="tap-clock" id="tapClock"></div><button id="tapButton" class="tap-button">' +
    (bonus.started ? "TAP" : "START") +
    "</button></div>";
  tapCount = Number(bonus.taps || 0);
  $("tapButton").onclick = async () => {
    if (!bonus.started) {
      if (busy) return;
      setBusy(true);
      try {
        const d = await api("/api/bonus/start", { kind: "slide" });
        bonus = d.session;
        renderTap();
      } catch (e) {
        $("bonusStatus").textContent = e.message;
      } finally {
        setBusy(false);
      }
    } else if (!bonus.done) {
      tapCount++;
      $("bonusStatus").textContent =
        fmt(tapCount) + " TAPS · " + fmt(bonus.total) + " COINS CREDITED";
    }
  };
  stopTap();
  if (bonus.started && !bonus.done) {
    tapTimer = setInterval(tapTick, 400);
    tapTick();
  } else $("tapClock").textContent = (bonus.duration || 0) + " SECONDS";
}
async function tapTick() {
  if (!bonus || !selected || selected.id !== "squirt" || tapSending) return;
  const left = Math.max(
    0,
    Date.parse(bonus.expiresAt) - Date.now() + tapClockOffset,
  );
  $("tapClock").textContent = Math.ceil(left / 1000) + " SECONDS";
  if (!left) $("tapButton").disabled = true;
  tapSending = true;
  try {
    const d = await api(left > 0 ? "/api/bonus/tap" : "/api/bonus/finish", {
      kind: "slide",
      taps: tapCount,
    });
    bonus = d.session;
    apply(d);
    $("bonusStatus").textContent =
      fmt(bonus.taps) +
      " ACCEPTED TAPS · " +
      fmt(bonus.total) +
      " KILLACOINS" +
      (bonus.done ? " · COMPLETE" : "");
    if (bonus.done) {
      stopTap();
      $("tapButton").disabled = true;
    }
  } catch (e) {
    stopTap();
    $("tapButton").disabled = true;
    $("bonusStatus").textContent = e.message;
  } finally {
    tapSending = false;
  }
}
function showInfo(html) {
  $("infoBody").innerHTML = html;
  $("info").showModal();
}
function rules() {
  const g = selected;
  let text = "";
  if (g.id === "spoiled")
    text =
      "Five fixed paylines, left to right from the first reel. 3/4/5 matches pay 2×/5×/12× total bet per line; sevens double that. 1/2/3+ wilds multiply a line by 2×/3×/5×. All-wild lines pay zero. Three or more diamonds anywhere unlock 3/4/5 gift picks (capped at five). Each gift awards 40–500 coins. Three or more gift scatters award 5 additional free spins per extra scatter above two, capped at 20.";
  else if (g.id === "squirt")
    text =
      "Five fixed paylines. Splash is wild. Two-symbol matches can award a small return; the exact table is below. One wild doubles 3+ matches, two or more wilds triple them. Three or more diamonds unlock a timed tap bonus, 10–30 seconds. Each accepted tap awards one total bet. Accepted taps are capped at 16 per second; this cap does not establish that a human made the taps. Three or more AFTER HOURS scatters award 5–20 free spins.";
  else if (g.id === "duck")
    text =
      "Pick exactly 3 of 12 ducks. Each reveal is independent: blank 32%, small 30%, medium 21%, large 12%, gold 5%. Awards are 0, 0.25×, 0.75×, 2× and 1× bet, rounded down per reveal. Three gold ducks add 10× bet. The visible duck selection is sent to the server.";
  else if (g.id === "obsession")
    text =
      "Earn one ticket every 10 coin-staked slot rounds (free spins do not count). Spend one ticket for a virtual coin prize: 100 (35%), 250 (27%), 500 (18%), 750 (10%), 1,000 (6%), 2,000 (3%), 5,000 (1%). The wheel stops on the awarded segment. Tickets cannot be purchased.";
  else if (g.id === "claw")
    text =
      "Move the claw horizontally to choose a shelf and vertically to align with it; drop near the prize level. Shelves from left to right: heart 0.5× bet / 42% base grip, bag 1.5× / 35%, diamond 2.5× / 27%, crown 4× / 19%, mystery 1× / 30%. Vertical alignment modifies grip probability. A caught crown has a 15% chance to add 5× bet. Prizes are virtual coins only.";
  else
    text =
      (g.id === "vault"
        ? "243-ways game: for each symbol, matching symbols on consecutive reels from the left pay by the product of match counts on those reels. Three/four/five reels pay 1×/3×/8× total bet × ways ÷ 5, rounded down."
        : "Five fixed paylines, left to right. 3/4/5 matches pay 1×/3×/8× total bet per line; diamonds double it. Crowns marked W substitute as wild. All-wild lines pay zero.") +
      " Three/four/five or more feature symbols anywhere unlock 3/4/5 picks, limited by the number of choices. Each pick independently awards 0×, 1×, 2×, 3× or 5× total bet. These are pick-and-reveal bonuses; their artwork does not promise physical items.";
  let table = "";
  if (g.id === "squirt")
    table =
      "<table><tr><th>Symbol</th><th>2</th><th>3</th><th>4</th><th>5 matches</th></tr>" +
      Object.entries({
        bubble: [15, 65, 180, 900],
        moon: [20, 75, 250, 1200],
        bolt: [20, 85, 300, 1600],
        heart: [25, 95, 350, 2000],
        diamond: [30, 140, 600, 4500],
        neon7: [40, 180, 900, 8000],
      })
        .map(
          ([s, v]) =>
            "<tr><td>" +
            icons[s] +
            "</td>" +
            v.map((n) => "<td>" + n + "%</td>").join("") +
            "</tr>",
        )
        .join("") +
      "</table><p>Percentages of total bet, per winning line. All-splash lines use the neon 7 table.</p>";
  showInfo(
    "<h2>" +
      g.name +
      "</h2><p>" +
      text +
      "</p>" +
      table +
      "<p>All prizes are virtual KillaCoins. No cash value. No purchase or redemption.</p>",
  );
}
$("enter").onclick = () => login();
$("guest").onclick = () => login(true);
$("sound").onclick = () => {
  soundOn = !soundOn;
  store.set("sound", soundOn ? "on" : "off");
  syncSound();
  sound();
};
document
  .querySelectorAll("[data-nav]")
  .forEach((b) => (b.onclick = () => nav(b.dataset.nav)));
document
  .querySelectorAll("[data-daily]")
  .forEach((b) => (b.onclick = () => daily(b.dataset.daily)));
$("back").onclick = () => {
  if (busy || tapSending) return;
  stopAuto();
  stopTap();
  $("gameRoom").hidden = true;
  document.body.style.overflow = "";
  nav(selected.arcade ? "arcade" : "slots");
};
$("play").onclick = play;
$("less").onclick = () => setBet(betIndex - 1);
$("more").onclick = () => setBet(betIndex + 1);
$("max").onclick = () => setBet(selected.bets.length - 1);
$("auto").onclick = () => {
  automatic = !automatic;
  $("auto").setAttribute("aria-pressed", String(automatic));
  if (automatic) play();
};
$("turbo").onclick = () => {
  turbo = !turbo;
  $("turbo").setAttribute("aria-pressed", String(turbo));
};
$("paytable").onclick = rules;
$("closeInfo").onclick = () => $("info").close();
$("account").onclick = () =>
  showInfo(
    '<h2>Your Membership</h2><p id="memberInfo"></p><button class="outline" id="seeLeaders">VIEW LEADERBOARD</button>',
  ) ||
  (() => {
    $("memberInfo").textContent =
      (player.username || "Guest") +
      " · " +
      (player.guest
        ? "Browser guest · token valid for 30 days"
        : "Verified Telegram account") +
      " · VIP Level " +
      player.vipLevel;
    $("seeLeaders").onclick = () => {
      $("info").close();
      nav("leaderboard");
    };
  })();
$("loyalty").onclick = async () => {
  if (busy) return;
  busy = true;
  $("loyalty").disabled = true;
  try {
    const d = await api("/api/loyalty/claim");
    apply(d);
    $("rewardStatus").textContent = "+1 KillaMoney · check-in complete";
  } catch (e) {
    $("rewardStatus").textContent = e.message;
  } finally {
    busy = false;
    sync();
  }
};
$("giftForm").onsubmit = async (e) => {
  e.preventDefault();
  if (busy) return;
  busy = true;
  sync();
  try {
    const username = $("recipient").value.trim();
    const verified = await api("/api/gift/lookup", { username });
    const d = await api("/api/gift", {
      username,
      amount: Number($("giftAmount").value),
    });
    apply(d);
    $("giftStatus").textContent =
      "Sent " + fmt(d.amount) + " KillaCoins to @" + d.recipient;
    await history();
  } catch (err) {
    $("giftStatus").textContent = err.message;
  } finally {
    busy = false;
    sync();
  }
};
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopAuto();
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    stopAuto();
  }
});
buildCards();
syncSound();
try {
  tg?.ready();
  tg?.expand();
} catch {}

const atlasPreload = new Image();
atlasPreload.src = "/assets/symbols-v2.png?v=cabinet3";

