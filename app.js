"use strict";
const $ = (id) => document.getElementById(id),
  fmt = (n) => Number(n || 0).toLocaleString(),
  tg = window.Telegram?.WebApp;
const apiOrigin = window.location.origin === "https://slots1.onrender.com"
  ? "https://kimia-prive-api.onrender.com"
  : "";
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
  moon: "Pool float",
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
let tapDeadline = 0;
let tapMoveAt = 0;
let soundOn = store.get("sound") === "on",
  audio = null,
  tapTimer = null,
  tapSending = false,
  tapCount = 0,
  autoTimer = null;
function artStyle(id) {
  if (id === "first") return "background-image:url('/assets/first-class/cabin.webp');background-position:center 26%";
  if (id === "squirt") return "background-image:url('/assets/squirt-city/rooftop.webp');background-position:center 36%";
  if (id === "vault") return "background-image:url('/assets/millionaires-vault/chamber.webp');background-position:center top";
  if (id === "double") return "background-image:url('/assets/double-trouble/lounge.webp');background-position:center 29%";
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
function tone(frequency, duration = .07, delay = 0, volume = .018, type = "sine") {
  if (!soundOn || document.hidden) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume().catch(() => {});
    const start = audio.currentTime + delay, oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.001, start);
    gain.gain.linearRampToValueAtTime(volume, start + .008);
    gain.gain.exponentialRampToValueAtTime(.001, start + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start); oscillator.stop(start + duration + .02);
    oscillator.onended = () => {oscillator.disconnect();gain.disconnect();};
  } catch {}
}
function sound() { [660,880,1100,1320].forEach((f,i) => tone(f,.16,i*.075,.025)); }
function reelClick(column = 0) { tone(180 + column * 45,.055,0,.022,"triangle"); }
function syncSound() {
  $("sound").textContent = "♫ " + (soundOn ? "ON" : "OFF");
  $("sound").setAttribute("aria-pressed", String(soundOn));
  $("sound").setAttribute(
    "aria-label",
    "Turn sound " + (soundOn ? "off" : "on"),
  );
}
const readEndpoints = new Set([
  "/api/vault/state", "/api/vault/download", "/api/owner/catalog",
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
    response = await fetch(apiOrigin + endpoint, {
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
  $("roomBalance").textContent = fmt(player.balance);
  $("roomPlayer").textContent = player.username || "GUEST PLAYER";
  $("roomVip").textContent = player.guest ? "BROWSER GUEST · KILLAMANI CLUB" : "VIP LEVEL " + (player.vipLevel || 0) + " · KILLAMANI CLUB";
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
    if (id === "rewards") await loadVault();
    await refresh();
  } catch (e) {
    toast(e.message);
  }
}
async function leaders() {
  const r = await fetch(apiOrigin + "/api/leaderboard");
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
let arcadeStateRequest = 0;
async function arcadeState() {
  const request = ++arcadeStateRequest;
  const ticketDisplay = $("obsessionTickets");
  const d = await api("/api/arcade/state");
  if (request !== arcadeStateRequest) return d;
  $("ticketProgress").textContent =
    `${fmt(d.wheelTickets)} WHEEL TICKETS · ${d.qualifyingRounds % 10}/10 PAID SLOT ROUNDS TOWARD YOUR NEXT TICKET`;
  if (ticketDisplay?.isConnected) ticketDisplay.textContent = fmt(d.wheelTickets);
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
  for (const id of ["back", "bonusBack", "less", "more", "max", "play"])
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
    "moon",
    "bolt",
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
const firstClassSymbolNames = {
  plane: "Private jet",
  passport: "Passport",
  champagne: "Champagne flute",
  luggage: "Carry-on",
  diamond: "Diamond",
  key: "Hotel key",
  wild: "Winged wild",
};
const squirtSymbolNames = {
  splash: "Water blaster wild",
  diamond: "Ice-blue diamond",
  neon7: "Neon seven",
  heart: "Heart float",
  moon: "Lifeguard float",
  bolt: "Lightning bolt",
  bubble: "Bubbles",
  afterhours: "Piña colada free spins",
};
const vaultSymbolNames = {
  vault: "Vault door", gold: "Gold bars", diamond: "Icy diamond", cash: "Cash bundle",
  crown: "Sapphire crown", panther: "Black panther", key: "Steel key",
};
const doubleSymbolNames = {
  red: "Ruby lips", blonde: "Blonde ribbon", heart: "Ruby heart",
  diamond: "Diamond", cherry: "Cherries", crown: "Crown", wild: "Gold W wild",
};
const reelArt = {
  first: { className: "first-class-symbol", names: firstClassSymbolNames },
  squirt: { className: "squirt-symbol", names: squirtSymbolNames },
  double: { className: "double-symbol", names: doubleSymbolNames },
  vault: { className: "vault-symbol", names: vaultSymbolNames },
};

function sprite(symbol, label = symbol) {
  if (symbol === "moon") {
    const el = document.createElement("span");
    el.className = "lux-symbol pool-float";
    el.setAttribute("role", "img"); el.setAttribute("aria-label", "Pool float");
    el.dataset.symbol = symbol; return el;
  }
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
  if (symbol === "moon") return '<span aria-hidden="true" class="lux-symbol pool-float"></span>';
  const i = symbolOrder.indexOf(symbol);
  return `<span aria-hidden="true" class="lux-symbol" style="background-position:${(i % 6) * 20}% ${Math.floor(i / 6) * 20}%"></span>`;
}
let reelTickTimer = null;
let lastReelSymbols = [];
const transientTimers = new Set();
function reducedEffects() {
  return document.hidden || store.get("effects") === "off" || matchMedia("(prefers-reduced-motion: reduce)").matches;
}
function motionPause(ms) { return new Promise(resolve => setTimeout(resolve, reducedEffects() ? 0 : ms)); }
function applyEffects() {
  const value = store.get("effects");
  document.documentElement.dataset.effects = ["off","subtle"].includes(value) ? value : "full";
}
function animateElement(element, frames, options) {
  if (!element || reducedEffects()) return Promise.resolve();
  return element.animate(frames, options).finished.catch(() => {});
}
function stopReelSound() { clearInterval(reelTickTimer);reelTickTimer = null; }
function cleanupVisuals() {
  stopReelSound();
  for (const timer of transientTimers) clearTimeout(timer);
  transientTimers.clear();
  document.querySelectorAll(".win-showcase,.win-particles,.caught-prize,.theme-burst").forEach(el => el.remove());
  $("gameRoom").classList.remove("round-playing","round-win");
  $("gameStatus").classList.remove("bonus-finished", "obsession-won");
  const wheel = $("obsessionFrame");
  if (wheel) {
    wheel.classList.remove("spinning", "celebrating");
    wheel.querySelector(".sector.winner")?.classList.remove("winner");
    wheel.querySelector(".wheel-confetti").replaceChildren();
  }
}
function winningIndexes(lines = []) { return new Set(lines.flatMap(line => line.indexes || [])); }
function reelCell(symbol, index, wins) {
  const cell = document.createElement("div");
  cell.className = "reel-cell" + (wins.has(index) ? " win" : "");
  cell.dataset.index = index;
  const game = selected?.id;
  const theme = reelArt[game];
  const themedLabel = theme?.names[symbol];
  const label = themedLabel || (symbol === "moon" ? "Pool float" : symbol || "symbol");
  cell.setAttribute("aria-label", label);
  const art = sprite(symbol, label);
  if (themedLabel) {
    const position = gameSymbolSets[game].indexOf(symbol);
    art.classList.add(theme.className);
    art.classList.remove("pool-float", "lux-symbol-fallback");
    art.textContent = "";
    art.setAttribute("aria-label", label);
    art.style.backgroundPosition = (position % 4) * 100 / 3 + "% " + Math.floor(position / 4) * 100 + "%";
  }
  cell.append(art);
  const isWild = symbol === "wild" || (game === "squirt" && symbol === "splash");
  const isBonusSymbol = (game === "vault" && symbol === "vault") || (game === "double" && symbol === "heart");
  if (isWild || isBonusSymbol || ["scatter", "afterhours"].includes(symbol)) {
    const tag = document.createElement("small");
    tag.className = "symbol-tag";
    tag.textContent = isWild ? "WILD" : isBonusSymbol ? "BONUS" : "FREE SPINS";
    cell.append(tag);
  }
  return cell;
}
function fillReel(column, symbols, wins = new Set(), rolling = false) {
  const track = document.createElement("div");track.className = "reel-track";
  symbols.forEach((symbol,row) => track.append(reelCell(symbol,column*3+row,wins)));
  const reel = document.createElement("div");reel.className = "reel-column" + (rolling ? " is-rolling" : "");reel.dataset.column = column;
  reel.style.setProperty("--reel-speed", (turbo ? .16 : .22 + Math.random()*.23) + "s");reel.style.setProperty("--reel-delay", (-column*.075) + "s");reel.append(track);return reel;
}
function renderReels(symbols, winning = []) {
  const board = $("reels");if (!board) return;
  lastReelSymbols = [...symbols];
  const wins = winningIndexes(winning);board.replaceChildren();
  for (let col=0;col<5;col++) board.append(fillReel(col,symbols.slice(col*3,col*3+3),wins));
  board.setAttribute("aria-busy","false");
}
function beginReelMotion() {
  const board = $("reels"), pool = gameSymbolSets[selected.id] || symbolOrder;
  if (!board) return;
  board.replaceChildren();board.setAttribute("aria-busy","true");
  for (let col=0;col<5;col++) board.append(fillReel(col,Array.from({length:12},()=>pool[Math.floor(Math.random()*pool.length)]),new Set(),true));
  $("gameRoom").classList.add("round-playing");
  if (!reducedEffects()) {reelClick();reelTickTimer = setInterval(()=>tone(90,.035,0,.007,"triangle"),125);}
}
async function settleReels(symbols, winning, started) {
  const minimum = turbo ? 300 : 600 + Math.random()*350;
  await motionPause(Math.max(0,minimum-(performance.now()-started)));
  const board=$("reels"),wins=winningIndexes(winning);
  for(let col=0;col<5;col++){
    if(col)await motionPause(turbo?45:80+Math.random()*100);
    const reel=fillReel(col,symbols.slice(col*3,col*3+3),wins);reel.classList.add("is-stopping");board.children[col].replaceWith(reel);reelClick(col);
  }
  lastReelSymbols = [...symbols];
  board.setAttribute("aria-busy","false");stopReelSound();$("gameRoom").classList.remove("round-playing");
  await motionPause(turbo?70:180);
}
async function celebrate(win, bet = selected?.bets[betIndex] || 1) {
  if (!win) return;
  themedSound("win"); themedBurst();
  if (reducedEffects()) return;
  const host = $("gameStage"), showcase = document.createElement("div"), fx = document.createElement("div");
  showcase.className = "win-showcase";showcase.setAttribute("aria-hidden","true");
  const title=document.createElement("small"),amount=document.createElement("strong"),unit=document.createElement("span");
  title.textContent=win>=bet*25?"MEGA WIN":win>=bet*10?"BIG WIN":"WIN";unit.textContent="KILLACOINS";
  showcase.append(title,amount,unit);host.append(showcase);
  fx.className="win-particles";fx.setAttribute("aria-hidden","true");
  const subtle=store.get("effects")==="subtle";
  for(let i=0;i<(subtle?10:26);i++) {const coin=document.createElement("i");coin.textContent=i%3?"✦":"◉";coin.style.setProperty("--dx",`${(Math.random()-.5)*300}px`);coin.style.setProperty("--dy",`${-70-Math.random()*160}px`);coin.style.setProperty("--delay",`${Math.random()*.15}s`);fx.append(coin);}
  host.append(fx);$("gameRoom").classList.add("round-win");
  const start=performance.now(),duration=turbo?380:700;
  await new Promise(resolve=>{function frame(now){const progress=Math.min(1,(now-start)/duration);amount.textContent=fmt(Math.round(win*(1-Math.pow(1-progress,3))));if(progress<1&&!reducedEffects())requestAnimationFrame(frame);else{amount.textContent=fmt(win);resolve();}}requestAnimationFrame(frame);});
  await motionPause(turbo?120:330);showcase.remove();fx.remove();$("gameRoom").classList.remove("round-win");
}
async function revealDuck(button, symbol, label) {
  themedSound("water"); themedBurst();
  await animateElement(button,[{transform:"rotateY(0)"},{transform:"rotateY(90deg)"}],{duration:110,easing:"ease-in"});
  button.replaceChildren();button.classList.add("duck-revealed");
  if(symbol)button.append(sprite(symbol));else{const wave=document.createElement("span");wave.className="water-ripple";wave.textContent="≈";button.append(wave);}
  button.setAttribute("aria-label",label);
  await animateElement(button,[{transform:"rotateY(-90deg) scale(.92)"},{transform:"rotateY(0) scale(1)"}],{duration:190,easing:"ease-out"});
}
async function animateClaw(result) {
  themedSound("motor");
  const hook = $("hook");
  const item = $("shelf").children[result.shelf];
  const caught = $("caught");
  hook.style.top = "61%";
  await motionPause(430);
  reelClick(2);
  if (result.caught) {
    item.style.visibility = "hidden";
    caught.src = item.src;
    caught.hidden = false;
  }
  hook.style.top = "6%";
  await motionPause(650);
  caught.hidden = true;
  item.style.visibility = "";
  clawPosition();
}
function duckArt(i) {
  return '<img class="duck-art" src="/assets/neon-duck-v4.png" width="1024" height="1024" alt="" draggable="false" decoding="async">';
}
const machineThemes = {
  spoiled: {names:["Pink Diamond Suite", "Midnight Diamonds"], scene:"spoiled", tint:"#ff8dcb", spin:"0deg"},
  squirt: {names:["Neon Lagoon", "After Hours Skyline"], scene:null, tint:"#65e9ff", spin:"0deg"},
  brat: {names:["Couture Boutique", "Violet Runway"], scene:"brat", tint:"#e7a2ff", spin:"-20deg"},
  first: {names:["Sky Lounge", "Midnight Jet"], scene:"first", tint:"#b7ecff", spin:"240deg"},
  cash: {names:["Emerald Penthouse", "Midnight Money"], scene:"cash", tint:"#8affc1", spin:"145deg"},
  red: {names:["Ruby Rose Lounge", "Midnight Romance"], scene:"red", tint:"#ff6caa", spin:"25deg"},
  vip: {names:["Amethyst Suite", "Private After Hours"], scene:"vip", tint:"#c3a1ff", spin:"-45deg"},
  double: {names:["Rose & Ice", "Neon Duet"], scene:"double", tint:"#ffb3e0", spin:"0deg"},
  vault: {names:["Platinum Vault", "Black Diamond"], scene:"vault", tint:"#c2efff", spin:"220deg"}
};
function savedMachineLook(id) { return store.get("machine-look:" + id) === "night" ? "night" : "signature"; }
function applyMachineLook() {
  if (!selected) return;
  const room = $("gameRoom"), theme = machineThemes[selected.id];
  room.classList.toggle("has-machine-theme", !!theme);
  room.dataset.look = theme ? savedMachineLook(selected.id) : "signature";
  room.style.setProperty("--machine-scene", theme?.scene ? `url('/assets/theme-${theme.scene}-v5.png')` : "url('/assets/neon-nightclub-v4.png')");
  room.style.setProperty("--theme-highlight", theme?.tint || "#65e9ff");
  room.style.setProperty("--spin-hue", theme?.spin || "0deg");
  room.dataset.lookName = theme ? theme.names[room.dataset.look === "night" ? 1 : 0] : "Neon Arcade";
}
function renderMachineLooks() {
  const host = $("machineLooks");
  if (!host) return;
  host.replaceChildren();
  for (const game of games.filter(g => !g.arcade)) {
    const row = document.createElement("label"), label = document.createElement("span"), select = document.createElement("select");
    row.className = "machine-look-row";
    label.textContent = game.name;
    select.setAttribute("aria-label", game.name + " appearance");
    for (const [i, name] of machineThemes[game.id].names.entries()) {
      const option = document.createElement("option"); option.value = i ? "night" : "signature"; option.textContent = name; select.append(option);
    }
    select.value = savedMachineLook(game.id);
    select.onchange = () => {store.set("machine-look:" + game.id, select.value); if (selected?.id === game.id) applyMachineLook();};
    row.append(label, select); host.append(row);
  }
}
function setBonusVisible(visible) {
  const panel = $("bonusPanel"), room = $("gameRoom");
  const entering = visible && panel.hidden;
  panel.hidden = !visible;
  room.classList.toggle("bonus-active", visible);
  if (visible) {
    stopAuto();
    const game = selected.id;
    if (game === "first" || game === "squirt" || game === "vault" || game === "double") {
      if (entering) {
        requestAnimationFrame(() => {
          if (!panel.hidden && room.dataset.game === game) {
            room.scrollTop = 0;
            $("bonusName").focus({ preventScroll: true });
          }
        });
      }
    } else {
      requestAnimationFrame(() => { if (!panel.hidden) panel.scrollIntoView({block:"center",behavior:"instant"}); });
    }
  } else {
    $("bonusContinue").hidden = true;
    stopTap();
  }
}
function finishBonusView() {
  const complete = bonus && (bonus.done || bonus.completed);
  setBonusVisible(false);
  if (complete) {
    const message = "BONUS COMPLETE · +" + fmt(bonus.total) + " KILLACOINS";
    $("gameStatus").textContent = message;
    $("gameStatus").classList.add("bonus-finished");
    const timer=setTimeout(()=>{$("gameStatus").classList.remove("bonus-finished");transientTimers.delete(timer);},2400);transientTimers.add(timer);
    if (selected.id !== "first") toast(message);
  }
}
function updateCabinet() {
  const slot = !selected.arcade;
  $("gameRoom").classList.toggle("is-arcade", !slot);
  $("lineLabel").textContent = slot ? (selected.id === "vault" ? "WAYS" : "LINES") : "MODE";
  $("lineValue").textContent = slot ? (selected.id === "vault" ? "243" : "5") : selected.id === "duck" ? "PICK 3" : "GRIP";
  $("roomSlogan").textContent = selected.id === "squirt" ? "Let the Fortune Flow." : selected.arcade ? "A little play. A lot of possibility." : "Your private world of fortune.";
  applyMachineLook();
  document.querySelectorAll("[data-room-nav]").forEach(el => el.classList.toggle("active", el.dataset.roomNav === (slot ? "slots" : "arcade")));
  refreshRoomLeaders();
}
function setGameName(game) {
  const heading = $("gameName");
  heading.textContent = game.name;
  heading.removeAttribute("aria-label");
  if (game.id === "squirt") {
    const [name, suffix] = game.name.split(", ");
    const accent = document.createElement("span");
    accent.textContent = suffix;
    heading.replaceChildren(name + ", ", accent);
    return;
  }
  if (game.id === "obsession") {
    const prefix = document.createElement("span");
    prefix.textContent = "Wheel of";
    heading.replaceChildren(prefix, " Obsession");
    return;
  }
  if (game.id !== "first") return;

  heading.setAttribute("aria-label", game.name);
  const marquee = document.createElement("span");
  marquee.className = "first-class-marquee";
  marquee.setAttribute("aria-hidden", "true");
  for (const [index, word] of game.name.toUpperCase().split(" ").entries()) {
    if (index > 0) marquee.append(" ");
    const group = document.createElement("span");
    for (const letter of word) {
      const flap = document.createElement("span");
      flap.textContent = letter;
      group.append(flap);
    }
    marquee.append(group);
  }
  heading.replaceChildren(marquee);
}
async function refreshRoomLeaders() {
  const list = $("roomLeadersList");
  list.textContent = "Loading players…";
  try {
    const response = await fetch(apiOrigin + "/api/leaderboard");
    if (!response.ok) throw Error("unavailable");
    const data = await response.json();
    list.replaceChildren();
    if (!data.players.length) { list.textContent = "Your name could be here. Play through Telegram to join the leaderboard."; return; }
    for (const player of data.players.slice(0, 5)) {
      const item = document.createElement("div");
      item.className = "room-leader";
      const avatar = document.createElement("span");
      avatar.className = "leader-medallion";
      avatar.textContent = String(player.username || "K").charAt(0).toUpperCase();
      const copy = document.createElement("span"), name = document.createElement("strong"), balance = document.createElement("small");
      name.textContent = player.rank + ". " + (player.username || "Player");
      balance.textContent = fmt(player.balance) + " ◉";
      copy.append(name, balance);
      item.append(avatar, copy); list.append(item);
    }
  } catch { list.textContent = "Player rankings will be back soon."; }
}
function leaveRoom(page) {
  if (busy || tapSending) return;
  if (page === "profile") { $("account").click(); return; }
  stopAuto(); stopTap(); cleanupVisuals();
  $("gameRoom").hidden = true;
  document.body.style.overflow = "";
  nav(page);
}
const obsessionPrizes = [100, 250, 500, 750, 1000, 2000, 5000];
const obsessionSlice = 360 / obsessionPrizes.length;

function wheelMarkup() {
  const sectors = obsessionPrizes.map((amount, index) =>
    `<div class="sector" style="--angle:${index * obsessionSlice}deg"><span>${fmt(amount)}</span></div>`
  ).join("");
  const lamps = Array.from({ length: 40 }, (_, index) =>
    `<i class="bulb" style="--bearing:${index * 9}deg;--chase:${-index * .07}s"></i>`
  ).join("");

  return `<div class="obsession-frame" id="obsessionFrame">
    <div class="pointer" aria-hidden="true"></div>
    <div class="obsession-rotor"><div id="wheel" class="obsession-face" role="img" aria-label="Seven prizes from 100 to 5,000 KillaCoins">${sectors}</div></div>
    <div class="bulbs" aria-hidden="true">${lamps}</div>
    <div class="hub" aria-hidden="true"><span>♥</span></div>
    <div class="wheel-confetti" aria-hidden="true"></div>
  </div>
  <p class="obsession-tickets"><strong id="obsessionTickets">–</strong> Wheel Tickets</p>`;
}

async function animateObsession(amount) {
  const wheel = $("wheel");
  const frame = $("obsessionFrame");
  const index = obsessionPrizes.indexOf(amount);
  if (index < 0) return;
  const target = (360 - index * obsessionSlice) % 360;
  const next = rotation + 1440 + (target - rotation % 360 + 360) % 360;
  if (!reducedEffects()) {
    frame.classList.add("spinning");
    const ticks = [130, 270, 445, 640, 875, 1130, 1420, 1770, 2070, 2340]
      .map((delay, index) => setTimeout(() => reelClick(index), delay));
    try {
      await animateElement(wheel,
        [{ transform: `rotate(${rotation}deg)` }, { transform: `rotate(${next}deg)` }],
        { duration: 2600, easing: "cubic-bezier(.14,.75,.11,1)" });
    } finally {
      ticks.forEach(clearTimeout);
      frame.classList.remove("spinning");
    }
  }
  rotation = next;
  wheel.style.transform = `rotate(${rotation}deg)`;
  wheel.children[index].classList.add("winner");
}

function celebrateObsession() {
  themedSound("win");
  if (reducedEffects()) return;
  const frame = $("obsessionFrame");
  const confetti = frame.querySelector(".wheel-confetti");
  const count = store.get("effects") === "subtle" ? 10 : 26;
  frame.classList.add("celebrating");

  for (let index = 0; index < count; index++) {
    const spark = document.createElement("i");
    const direction = index / count * Math.PI * 2;
    const radius = frame.clientWidth * (.36 + Math.random() * .14);
    spark.textContent = index % 3 ? "✦" : "◆";
    spark.style.setProperty("--x", Math.cos(direction) * radius + "px");
    spark.style.setProperty("--y", Math.sin(direction) * radius + "px");
    spark.style.setProperty("--size", 9 + Math.random() * 13 + "px");
    spark.style.setProperty("--turn", index * 29 + "deg");
    spark.style.setProperty("--flight", 850 + Math.random() * 550 + "ms");
    spark.style.setProperty("--color", ["#ffe5a3", "#ff93c6", "#fff8e8"][index % 3]);
    confetti.append(spark);
  }
  const timer = setTimeout(() => {
    frame.classList.remove("celebrating");
    confetti.replaceChildren();
    transientTimers.delete(timer);
  }, 1450);
  transientTimers.add(timer);
}

const clawPrizes = [["heart", .5], ["bag", 1.5], ["diamond", 2.5], ["crown", 4], ["mystery", 1]];
function clawPosition() {
  const index = Math.min(4, Math.floor(x * 5));
  $("hook").style.left = (10 + index * 20) + "%";
  $("hook").style.top = (6 + y * 33) + "%";
  Array.from($("shelf").children).forEach((item, i) => item.classList.toggle("aim", index === i));
  const [name, multiplier] = clawPrizes[index];
  $("clawTarget").textContent = name.toUpperCase() + " · " + multiplier + "× · Depth " + Math.round(y * 10) + "/10";
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
    const prizes = clawPrizes.map(([name]) =>
      `<img class="prize" src="/assets/claw/${name}.webp" alt="${name}">`
    ).join("");
    $("gameStage").innerHTML = `<div id="glass"><div id="hook"><i></i><b></b><img id="caught" alt="" hidden></div><div id="shelf">${prizes}</div></div>
      <div id="clawTarget"></div><div class="pad" aria-label="Joystick">
      <button data-dy="-1" aria-label="Aim up">▲</button><button data-dx="-1" aria-label="Aim left">◀</button>
      <button data-dx="1" aria-label="Aim right">▶</button><button data-dy="1" aria-label="Aim down">▼</button></div>`;
    clawPosition();
    for (const button of $("gameStage").querySelectorAll(".pad button")) {
      button.onclick = () => {
        if (busy) return;
        x = Math.max(.1, Math.min(.9, x + Number(button.dataset.dx || 0) / 5));
        y = Math.max(0, Math.min(1, y + Number(button.dataset.dy || 0) / 10));
        clawPosition();
      };
    }
  }
}
async function openGame(id) {
  if (busy) return;
  stopAuto();
  stopTap();
  cleanupVisuals();
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
  setGameName(selected);
  $("gameTag").textContent = selected.tag;
  $("roomArt").style.cssText = artStyle(selected.art);
  setBonusVisible(false);
  $("gameStatus").textContent = id === "vault"
    ? "LAND 3+ VAULT DOORS FOR CRACK THE COLLECTION"
    : id === "double" ? "LAND 3+ HEARTS FOR RED × BLONDE" : "CHOOSE YOUR BET AND PLAY";
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
  $("play").dataset.caption = selected.id === "squirt" ? "TO SQUIRT" : selected.id === "duck" ? "YOUR PICKS" : selected.id === "claw" ? "THE CLAW" : selected.id === "obsession" ? "1 TICKET" : "YOUR FORTUNE";
  if (selected.arcade) {
    arcadeStage();
    if (id === "obsession") {
      const wheel = $("obsessionFrame");
      $("gameStatus").textContent = "";
      await arcadeState().then(d => {
        if (wheel.isConnected && selected?.id === id && !$("gameRoom").hidden && !busy && !rotation && !d.wheelTickets)
          $("gameStatus").textContent = "Earn a ticket by completing 10 paid slot rounds.";
      }).catch(e => {
        if (wheel.isConnected && selected?.id === id && !$("gameRoom").hidden && !busy && !rotation)
          $("gameStatus").textContent = e.message;
      });
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
  const g=selected,bet=g.bets[betIndex];
  if(g.id==="duck"&&duckPicks.length!==3)return toast("Choose exactly 3 ducks first.");
  if(bonus&&!bonus.done&&!bonus.completed){stopAuto();return toast("Finish your unlocked bonus first.");}
  setBusy(true);cleanupVisuals();$("gameStatus").textContent="GOOD LUCK…";
  const started=performance.now();
  try {
    if(!g.arcade)beginReelMotion();
    themedSound("spin"); themedBurst();
    const body={bet,...(g.arcade||!g.endpoint?{game:g.id}:{}),...(g.id==="claw"?{x,y}:g.id==="duck"?{picks:duckPicks}:{})};
    const d=await api(g.arcade?"/api/arcade/play":g.endpoint||"/api/themed/spin",body);
    if(!g.arcade)await settleReels(d.symbols,d.winningLines,started);
    if(g.id==="duck"){
      for(const [i,n] of duckPicks.entries()){
        const symbol={small:"gold",medium:"cash",large:"diamond",gold:"crown"}[d.ducks[i]];
        await revealDuck($("gameStage").querySelector(`[data-duck="${n}"]`),symbol,"Duck "+(n+1)+": "+d.ducks[i]);reelClick(i);
      }
    }
    if(g.id==="obsession") await animateObsession(d.win);
    if(g.id==="claw")await animateClaw(d);
    if(g.id==="squirt")apply({balance:d.balance,squirtFreeSpins:d.freeSpins});else apply(d);
    $("gameStatus").textContent=(d.freeSpinUsed?"FREE SPIN · ":"")+(d.win?"WIN +"+fmt(d.win)+" KILLACOINS":"NO WIN THIS ROUND")+(d.awardedFreeSpins?" · +"+d.awardedFreeSpins+" FREE SPINS":"");
    if(g.id==="claw")$("gameStatus").textContent=(d.caught?"CAUGHT "+d.item.toUpperCase()+" · +"+fmt(d.win):"THE CLAW MISSED")+(d.royal?" · ROYAL BONUS +5× BET":"");
    if(g.id==="duck"&&d.bonus)$("gameStatus").textContent+=" · THREE GOLD JACKPOT!";
    if (g.id === "obsession") {
      $("gameStatus").textContent = `+${fmt(d.win)} KillaCoins`;
      $("gameStatus").classList.add("obsession-won");
      celebrateObsession();
      const tickets = $("obsessionTickets");
      tickets.textContent = "–";
      await arcadeState().catch(() => {});
    } else if (d.win) await celebrate(d.win, bet);
    if(g.id==="duck"){await motionPause(800);arcadeStage();}
    if(!g.arcade)await loadBonus();
    if (g.id === "obsession") await refresh().catch(() => {});
    else await refresh();
  } catch(e){
    stopReelSound();$("gameRoom").classList.remove("round-playing","round-win");
    if(!g.arcade&&$("reels")) renderReels(lastReelSymbols);
    stopAuto();$("gameStatus").textContent=e.message;await refresh().catch(()=>{});
    if (g.id === "obsession") await arcadeState().catch(() => {});
  } finally{stopReelSound();setBusy(false);setBet(betIndex);if(automatic)autoTimer=setTimeout(play,turbo?150:650);}
}
async function loadBonus() {
  if (!selected || selected.arcade) return;
  const g = selected;
  try {
    const d = await api(
      g.endpoint ? "/api/bonus/session" : "/api/themed/bonus/state",
      g.endpoint
        ? { kind: g.id === "spoiled" ? "vault" : "slide" }
        : { game: g.id },
    );
    if (selected !== g || $("gameRoom").hidden) return;
    bonus = d.session;
    if (bonus && !bonus.done && !bonus.completed) {
      stopAuto();
      renderBonus();
    } else setBonusVisible(false);
  } catch (e) {
    if (selected !== g || $("gameRoom").hidden) return;
    if (!e.message.includes("Land at least")) {
      $("gameStatus").textContent = e.message;
      stopAuto();
    }
  }
}
function renderFirstClassCase(button, index, destination, award) {
  const art = document.createElement("span");
  art.className = "first-class-case-art";
  art.setAttribute("aria-hidden", "true");
  art.style.backgroundPosition = (index % 3) * 50 + "% " + Math.floor(index / 3) * 100 + "%";

  const tag = document.createElement("span");
  tag.className = "first-class-case-tag";
  tag.textContent = destination;
  button.classList.add("first-class-case");
  button.append(art, tag);

  if (award !== undefined) {
    const ticket = document.createElement("strong");
    ticket.className = "first-class-award";
    ticket.textContent = "+" + fmt(award);
    button.append(ticket);
    button.setAttribute("aria-label", destination + ", " + fmt(award) + " KillaCoins");
  } else {
    button.setAttribute("aria-label", "Choose " + destination);
  }
}

function renderVaultDrawer(button, index, award, reveal) {
  const label = "Drawer " + (index + 1);
  const dial = document.createElement("span");
  dial.className = "vault-dial";
  dial.setAttribute("aria-hidden", "true");
  const plate = document.createElement("span");
  plate.className = "vault-drawer-number";
  plate.textContent = String(index + 1).padStart(2, "0");
  button.classList.add("vault-drawer");
  button.classList.toggle("vault-reveal", reveal);
  button.append(plate);
  if (award === undefined) {
    button.append(dial);
    button.setAttribute("aria-label", "Open " + label);
    return;
  }
  const amount = document.createElement("strong");
  amount.textContent = "+" + fmt(award);
  button.append(amount);
  button.setAttribute("aria-label", label + ", " + fmt(award) + " KillaCoins");
}

function renderDoubleRoute(button, index, name, award, reveal) {
  const art = document.createElement("span");
  art.className = "double-route-art";
  art.setAttribute("aria-hidden", "true");
  art.style.backgroundPosition = index * 100 / 3 + "% 0%";
  const nameplate = document.createElement("span");
  nameplate.className = "double-route-name";
  nameplate.textContent = name;
  button.classList.add("double-route");
  button.dataset.route = index ? "blonde" : "red";
  button.classList.toggle("double-route-reveal", reveal);
  button.append(art, nameplate);
  if (award === undefined) {
    button.setAttribute("aria-label", "Reveal " + name);
    return;
  }
  const amount = document.createElement("strong");
  amount.className = "double-route-award";
  amount.textContent = "+" + fmt(award);
  button.append(amount);
  button.setAttribute("aria-label", name + ", " + fmt(award) + " KillaCoins");
}

function renderBonus(showCompleted = false, revealedChoice) {
  if (!bonus || ((bonus.done || bonus.completed) && !showCompleted)) {
    finishBonusView();
    return;
  }
  const g = selected;
  setBonusVisible(true);
  const scene = bonusScenes[g.id];
  $("bonusPanel").dataset.adventure=g.id;
  $("bonusName").textContent = scene?.name || g.bonus;
  $("bonusChoices").replaceChildren();
  $("bonusStatus").textContent = "";
  $("bonusContinue").hidden = !showCompleted;
  if (g.id === "squirt") {
    renderTap();
    return;
  }
  const legacy = g.id === "spoiled",
    selections = legacy ? bonus.opened : bonus.selections;
  const count = legacy ? 12 : bonus.labels.length,
    allowed = bonus.picks || 1;
  if (g.id === "vault" || g.id === "double") {
    const noun = g.id === "vault" ? "PICK" : "ROUTE";
    const remaining = Math.max(0, allowed - selections.length);
    const tally = document.createElement("span");
    tally.className = "vault-bonus-tally";
    tally.textContent = remaining + " " + noun + (remaining === 1 ? " LEFT" : "S LEFT") + " · " + fmt(bonus.total) + " KILLACOINS";
    $("bonusText").replaceChildren(showCompleted ? "Bonus complete." : scene.instruction, tally);
  } else {
    const instruction = showCompleted
      ? "Baggage claim complete."
      : scene?.instruction || "Choose your prizes.";
    $("bonusText").textContent =
      instruction + " " + selections.length + " / " + allowed + " PICKS · TOTAL " + fmt(bonus.total) + " KILLACOINS";
  }
  for (let i = 0; i < count; i++) {
    const chosen = selections.find((s) => s.choice === i),
      b = document.createElement("button");
    b.type = "button";
    b.className = "bonus-prize adventure-prize";
    b.disabled = !!chosen || bonus.done || bonus.completed;
    b.classList.toggle("revealed", !!chosen);
    b.onclick = () => pickBonus(i);
    if (g.id === "double") {
      renderDoubleRoute(b, i, scene.labels[i], chosen?.award, revealedChoice === i);
      $("bonusChoices").append(b);
      continue;
    }
    if (g.id === "vault") {
      renderVaultDrawer(b, i, chosen?.award, revealedChoice === i);
      $("bonusChoices").append(b);
      continue;
    }
    if (g.id === "first") {
      renderFirstClassCase(b, i, scene.labels[i] || bonus.labels[i], chosen?.award);
      $("bonusChoices").append(b);
      continue;
    }
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
          cash: "cash",
          red: "flag",
        }[g.id] || "gift";
    b.style.setProperty("--lane", i);
    b.append(sprite(symbol));
    const text = document.createElement("span");
    text.className = "prize-label";
    text.textContent = chosen ? label : (scene?.labels?.[i % scene.labels.length] || label);
    b.append(text);
    b.setAttribute("aria-label", label);
    $("bonusChoices").append(b);
  }
}
async function pickBonus(choice) {
  if (busy) return;
  const opening = $("bonusChoices").children[choice];
  const firstClass = selected.id === "first";
  const vault = selected.id === "vault";
  const keepResult = firstClass || vault || selected.id === "double";
  const restoreFocus = keepResult && opening?.matches(":focus-visible");
  opening?.classList.add("prize-opening");
  if (firstClass) {
    tone(290, .055, 0, .018, "triangle");
    tone(480, .07, .045, .012, "triangle");
  }
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
    await motionPause(260);
    bonus = legacy ? d.session : { ...bonus, ...d };
    renderBonus(keepResult && bonus.completed, choice);
    $("bonusStatus").textContent =
      "+" +
      fmt(d.award) +
      " KILLACOINS" +
      (bonus.done || bonus.completed ? " · BONUS COMPLETE" : "");
    if (restoreFocus) {
      const next = bonus.completed ? $("bonusContinue") : $("bonusChoices").querySelector("button:not(:disabled)");
      next?.focus({ preventScroll: true });
    }
    if (vault) {
      tone(88, .10, 0, .03, "triangle");
      tone(1047, .21, .08, .018);
    } else {
      sound();
    }
  } catch (e) {
    await loadBonus();
    $(keepResult && $("bonusPanel").hidden ? "gameStatus" : "bonusStatus").textContent = e.message;
  } finally {
    setBusy(false);
  }
}
function stopTap() {
  clearInterval(tapTimer);
  tapTimer = null;
}
function renderTap() {
  if (!bonus) return finishBonusView();
  stopTap();
  const complete = bonus.done || bonus.completed;
  const remaining = bonus.started
    ? (bonus.remainingMs ?? Math.max(0, Date.parse(bonus.expiresAt) - Date.now()))
    : bonus.duration * 1000;
  tapDeadline = performance.now() + remaining;
  tapMoveAt = performance.now() + 1500;
  tapCount = Number(bonus.taps || 0);
  $("bonusName").textContent = complete ? "Splash complete" : "Pool Party Target Splash";
  $("bonusText").textContent = complete
    ? "KillaCoins added to your balance."
    : "Tap the moving ring. Each accepted hit earns " + fmt(bonus.bet) + " KillaCoins.";
  $("bonusStatus").textContent = "";
  $("bonusChoices").innerHTML = `
    <div class="squirt-round">
      <dl class="squirt-round-stats" aria-label="Splash bonus results">
        <div><dd id="tapClock">${complete ? 0 : Math.ceil(remaining / 1000)}</dd><dt>Seconds</dt></div>
        <div><dd id="tapHits">${fmt(bonus.taps)}</dd><dt>Accepted hits</dt></div>
        <div><dd id="tapAward">${fmt(bonus.total)}</dd><dt>KillaCoins</dt></div>
      </dl>
      <div class="tap-arena">
        ${complete ? "" : '<button id="tapButton" class="tap-button squirt-target" type="button"><span>' +
          (bonus.started ? "SPLASH!" : "START") + '</span></button>'}
      </div>
    </div>`;
  $("bonusContinue").hidden = !complete;
  if (complete) {
    sound();
    $("bonusContinue").focus({ preventScroll: true });
    return;
  }
  const button = $("tapButton");
  const hit = () => {
    const now = performance.now();
    if (!bonus.started || bonus.done || button.disabled || now >= tapDeadline) return;
    tapCount++;
    tapMoveAt = Math.max(tapMoveAt, now + 320);
    if (now - lastSplash < 120) return;
    lastSplash = now;
    themedSound("water");
    if (reducedEffects()) return;
    const ripple = document.createElement("span");
    ripple.className = "squirt-hit-ripple";
    ripple.style.left = button.style.left || "50%";
    ripple.style.top = button.style.top || "53%";
    button.parentElement.append(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  };
  button.onpointerdown = (event) => {
    if (event.isPrimary && event.button === 0) hit();
  };
  button.onclick = async (event) => {
    if (bonus.started) {
      if (event.detail === 0) hit();
      return;
    }
    if (busy) return;
    setBusy(true);
    button.disabled = true;
    try {
      const d = await api("/api/bonus/start", { kind: "slide" });
      bonus = d.session;
      renderTap();
      $("tapButton")?.focus({ preventScroll: true });
    } catch (e) {
      button.disabled = false;
      $("bonusStatus").textContent = e.message;
    } finally {
      setBusy(false);
    }
  };
  if (bonus.started) {
    tapTimer = setInterval(tapTick, 400);
    tapTick();
  }
}
async function tapTick() {
  const button = $("tapButton");
  if (!bonus?.started || bonus.done || selected?.id !== "squirt" || !button) return;
  const now = performance.now();
  const left = Math.max(0, tapDeadline - now);
  $("tapClock").textContent = Math.ceil(left / 1000);
  if (!left) {
    button.disabled = true;
  } else if (now >= tapMoveAt && !reducedEffects()) {
    button.style.left = 32 + Math.random() * 36 + "%";
    button.style.top = 39 + Math.random() * 30 + "%";
    tapMoveAt = now + 1500;
  }
  if (tapSending || (left && tapCount === bonus.taps)) return;
  tapSending = true;
  try {
    const d = await api(left > 0 ? "/api/bonus/tap" : "/api/bonus/finish", {
      kind: "slide",
      taps: tapCount,
    });
    apply(d);
    if (!button.isConnected || $("bonusPanel").hidden) return;
    bonus = d.session;
    $("tapHits").textContent = fmt(bonus.taps);
    $("tapAward").textContent = fmt(bonus.total);
    if (bonus.done) {
      renderTap();
    }
  } catch (e) {
    stopTap();
    button.disabled = true;
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
      "Five fixed paylines. The water blaster is wild. One wild doubles wins with three or more matches. Two or more wilds triple those wins. Land three or more diamonds to unlock a 10–30 second splash bonus. Each accepted hit earns the triggering bet, up to 16 hits per second. Three or more piña coladas award 5–20 free spins.";
  else if (g.id === "duck")
    text =
      "Pick exactly 3 of 12 ducks. Each reveal is independent: blank 32%, small 30%, medium 21%, large 12%, gold 5%. Awards are 0, 0.25×, 0.75×, 2× and 1× bet, rounded down per reveal. Three gold ducks add 10× bet. The visible duck selection is sent to the server.";
  else if (g.id === "obsession")
    text =
      "Earn one ticket every 10 coin-staked slot rounds (free spins do not count). Spend one ticket for a virtual coin prize: 100 (35%), 250 (27%), 500 (18%), 750 (10%), 1,000 (6%), 2,000 (3%), 5,000 (1%). The wheel stops on the awarded segment. Tickets cannot be purchased.";
  else if (g.id === "claw")
    text =
      "Move the claw horizontally to choose a shelf and vertically to align with it; drop near the prize level. Shelves from left to right: heart 0.5× bet / 42% base grip, bag 1.5× / 35%, diamond 2.5× / 27%, crown 4× / 19%, mystery 1× / 30%. Vertical alignment modifies grip probability. A caught crown has a 15% chance to add 5× bet. Prizes are virtual coins only.";
  else if (g.id === "first")
    text =
      "Five paylines, read from left to right. Matching three, four or five symbols pays 1×, 3× or 8× the total bet per line, and diamonds pay double. The winged W substitutes for other symbols. An all-wild line pays zero. Land three or more carry-ons anywhere to open Destination: First Class with three to five suitcase picks.";
  else if (g.id === "double")
    text =
      "Match three, four or five symbols from the left on any of five paylines to win 1×, 3× or 8× the total bet per line. Diamonds pay double. The gold W substitutes for other symbols. An all-wild line pays zero. Land three or more hearts anywhere to enter Red × Blonde. Reveal both routes. Each route can award 0×, 1×, 2×, 3× or 5× the triggering bet in KillaCoins.";
  else if (g.id === "vault")
    text =
      "243 ways to win. Match a symbol on consecutive reels from the left. Three, four or five matching reels pay 1×, 3× or 8× the total bet per way, divided by five and rounded down. Three or more vault doors anywhere unlock Crack the Collection. Open one drawer per vault door, up to five. Each drawer can award 0×, 1×, 2×, 3× or 5× the triggering bet.";
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
            squirtSymbolNames[s] +
            "</td>" +
            v.map((n) => "<td>" + n + "%</td>").join("") +
            "</tr>",
        )
        .join("") +
          "</table><p>Percentages of total bet, per winning line. All-wild lines use the neon seven payouts.</p>";
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
$("bonusBack").onclick = () => leaveRoom("slots");
$("bonusContinue").onclick = () => {
  finishBonusView();
  $("gameRoom").scrollTop = 0;
  $("play").focus({ preventScroll: true });
};
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
  cleanupVisuals();
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
    '<h2>Your Membership</h2><p id="memberInfo"></p><button class="outline" id="seeLeaders">VIEW LEADERBOARD</button><h3>Effects & sound</h3><div class="machine-look-settings"><label class="machine-look-row"><span>Animations</span><select id="effectsMode"><option value="full">Full effects</option><option value="subtle">Subtle effects</option><option value="off">Off</option></select></label><label class="machine-look-row"><span>Game sound</span><select id="profileSound"><option value="off">Off</option><option value="on">On</option></select></label></div><h3>Machine looks</h3><p class="appearance-note">Choose a look for each slot. Changes save on this device.</p><div id="machineLooks" class="machine-look-settings"></div>',
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
    renderMachineLooks();
    $("effectsMode").value = store.get("effects") || "full";
    $("effectsMode").onchange = e => {store.set("effects",e.target.value);applyEffects();};
    $("profileSound").value = soundOn ? "on" : "off";
    $("profileSound").onchange = e => {soundOn=e.target.value==="on";store.set("sound",e.target.value);syncSound();if(soundOn)sound();};
    $("seeLeaders").onclick = () => {
      $("info").close();
      leaveRoom("leaderboard");
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
  if (document.hidden) {stopAuto();stopReelSound();}
});
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    stopAuto();
  }
});
document.querySelectorAll("[data-room-symbol]").forEach(el => el.append(sprite(el.dataset.roomSymbol)));
document.querySelectorAll("[data-room-nav]").forEach(el => el.onclick = () => leaveRoom(el.dataset.roomNav));
$("roomProfile").onclick = () => leaveRoom("profile");
$("roomWallet").onclick = () => leaveRoom("wallet");
$("roomLeadersLink").onclick = () => leaveRoom("leaderboard");
applyEffects();
buildCards();
syncSound();
try {
  tg?.ready();
  tg?.expand();
} catch {}

const atlasPreload = new Image();
atlasPreload.src = "/assets/neon-symbols-v4.png";



// Cosmetic effects only. Symbols, payouts and bonus sessions remain server-owned.
let lastSplash = 0;
function noiseSweep(duration=.22, cutoff=1600) {
  if (!soundOn || document.hidden) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume().catch(()=>{});
    const buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*duration),audio.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++) data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,2);
    const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();
    source.buffer=buffer;filter.type="lowpass";filter.frequency.value=cutoff;gain.gain.value=.055;
    source.connect(filter).connect(gain).connect(audio.destination);source.start();
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  } catch {}
}
function themedSound(event) {
  const aquatic=["squirt","duck"].includes(selected?.id);
  if(event==="water" || aquatic) noiseSweep(.25,2100);
  if(event==="win") {
    [1568,2093,2637,3136].forEach((f,i)=>tone(f,.12,i*.07,.018));
    for(let i=0;i<7;i++) tone(1700+Math.random()*1400,.045,.32+i*.055,.009,"triangle");
  } else if(event==="motor" || selected?.id==="claw") {
    tone(90,.25,0,.012,"sawtooth");tone(140,.15,.25,.01,"triangle");
  } else if(event==="spin") {
    const base={spoiled:440,brat:523,first:660,cash:330,red:392,vip:587,double:494,vault:262,obsession:740}[selected?.id] || 440;
    [1,1.25,1.5].forEach((n,i)=>tone(base*n,.09,i*.045,.013,"triangle"));
  }
}
function themedBurst(host=$("gameStage")) {
  if (!host || reducedEffects()) return;
  if(host.querySelectorAll(".theme-burst").length>=3)return;
  const layer=document.createElement("div");layer.className="theme-burst";layer.setAttribute("aria-hidden","true");
  const aquatic=["squirt","duck"].includes(selected?.id);
  const colors={spoiled:"#ff9edb",brat:"#d3a0ff",first:"#b6efff",cash:"#6dffb1",red:"#ff6a82",vip:"#bd97ff",double:"#ffc0dd",vault:"#ffe1a0",claw:"#ffaee6",obsession:"#ffcf78"};
  layer.style.color=aquatic?"#76edff":colors[selected?.id]||"#ffd781";
  for(let i=0;i<(store.get("effects")==="subtle"?5:16);i++){
    const particle=document.createElement("i");particle.className=aquatic?"fx-droplet":"fx-glint";
    particle.style.setProperty("--fx-x",`${(Math.random()-.5)*380}px`);
    particle.style.setProperty("--fx-y",`${-50-Math.random()*210}px`);
    layer.append(particle);
  }
  host.append(layer);
  const timer=setTimeout(()=>{layer.remove();transientTimers.delete(timer);},850);transientTimers.add(timer);
}

const bonusScenes = {
 spoiled:{name:"Shopping Spree",instruction:"Open the boutique gifts.",labels:["DIAMOND BOX","VELVET BAG","GOLD PARCEL","PRIVATE PICK"]},
 brat:{name:"Collect What You’re Owed",instruction:"Open sealed invoices to collect your tax.",labels:["BRAT TAX","LUXURY LEVY","LATE FEE","ATTITUDE TAX","SERVICE FEE","SPOILED SURCHARGE","VIP INVOICE","GLAM TAX","FINAL NOTICE"]},
 first:{name:"Destination: First Class",instruction:"Choose a suitcase.",labels:["Paris","Dubai","Monaco","Maldives","Milan","St. Barts"]},
 cash:{name:"Cash Catch",instruction:"Catch the drifting bundles. Take your time; unused picks never expire."},
 red:{name:"Rose Garden Riches",instruction:"Open each rose envelope to reveal its award.",labels:["RED ROSES","BLACK ROSES","GOLD ROSES"]},
 vip:{name:"Behind the Velvet Rope",instruction:"Choose a suite door.",labels:["Gold Suite","Ruby Suite","Sky Lounge","Rooftop","Penthouse"]},
 double:{name:"Red × Blonde",instruction:"Reveal both sides of your fortune.",labels:["Red Route","Blonde Route"]},
 vault:{name:"Crack the Collection",instruction:"Choose a safe-deposit drawer."},
 squirt:{name:"Pool Party Target Splash"}
};
let vaultSnapshot=null, vaultLoading=false;
function ui(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(cls)el.className=cls;return el;}
function actionButton(label,handler){const b=ui("button",label,"outline");b.type="button";b.onclick=handler;return b;}
async function loadVault(){
  if(vaultLoading)return;vaultLoading=true;
  $("vaultStatus").textContent="Loading your collection…";
  try{
    vaultSnapshot=await api("/api/vault/state");apply(vaultSnapshot);
    $("vaultCatalog").replaceChildren();$("vaultOwned").replaceChildren();
    const owned=new Set(vaultSnapshot.owned.map(x=>x.item_id));
    for(const item of vaultSnapshot.items){
      const card=ui("article");card.dataset.reward=item.id;
      card.append(ui("small",item.kind.toUpperCase()),ui("h3",item.title),ui("p",item.description),ui("strong",fmt(item.price)+" KillaCoins"));
      const b=actionButton(owned.has(item.id)?"OWNED":item.stock<1?"SOLD OUT":"VIEW & REDEEM",()=>confirmReward(item));
      b.disabled=owned.has(item.id)||item.stock<1;card.append(b);$("vaultCatalog").append(card);
    }
    for(const item of vaultSnapshot.owned){
      const card=ui("article");card.append(ui("h3",item.title),ui("p",fmt(item.price)+" coins · "+new Date(item.created_at).toLocaleDateString()));
      card.append(actionButton(item.kind==="decor"?"EQUIP ROOM":"OPEN REWARD",()=>openReward(item)));$("vaultOwned").append(card);
    }
    if(!vaultSnapshot.owned.length)$("vaultOwned").append(ui("p","Your collection starts with your first reward."));
    $("ownerDashboard").hidden=!vaultSnapshot.isOwner;
    $("vaultStatus").textContent=fmt(vaultSnapshot.balance)+" KillaCoins · Account "+vaultSnapshot.accountId;
  }catch(e){$("vaultStatus").textContent=e.message;}finally{vaultLoading=false;}
}
function confirmReward(item){
  showInfo('<div id="rewardConfirm"></div>');const host=$("rewardConfirm");
  host.append(ui("h2",item.title),ui("p",item.description),ui("strong",fmt(item.price)+" KillaCoins"),ui("p","One redemption per account. Your reward will be saved in My Rewards."));
  const status=ui("p");status.setAttribute("role","status");
  const b=actionButton("CONFIRM REDEMPTION",async()=>{
    b.disabled=true;
    try{const d=await api("/api/vault/redeem",{itemId:item.id,expectedPrice:item.price});apply(d);$("info").close();toast("Unlocked: "+d.title);themedSound("win");await loadVault();}
    catch(e){status.textContent=e.message;b.disabled=false;}
  });host.append(b,status);
}
async function openReward(item){
  try{
    if(item.kind==="decor"){const d=await api("/api/penthouse/equip",{itemId:item.item_id});apply(d);await loadVault();openPenthouse();return;}
    const d=await api("/api/vault/download",{itemId:item.item_id});
    showInfo('<div id="ownedReward"></div>');const host=$("ownedReward");host.append(ui("h2",d.title),ui("p",d.description));
    if(d.kind==="wallpaper"){
      const img=ui("img");img.src=d.payload;img.alt=d.title;img.className="wallpaper-preview";host.append(img);
      const link=ui("a","DOWNLOAD WALLPAPER","outline");link.href=d.payload;link.download=item.item_id+(d.payload.startsWith('data:image/svg')?'.svg':d.payload.startsWith('data:image/jpeg')?'.jpg':d.payload.startsWith('data:image/webp')?'.webp':'.png');host.append(link);
    }else host.append(ui("p","Your single-use discount code:"),ui("pre",d.payload),ui("p","Use this code at the eligible store checkout. See the reward's terms."));
  }catch(e){toast(e.message);}
}
function openPenthouse(){
  if(!vaultSnapshot)return toast("Open Rewards to load your room first.");
  showInfo('<div id="penthouseView"></div>');const host=$("penthouseView");host.append(ui("h2","My Penthouse"),ui("p","Your private corner of Killa Palace. Unlock room styles in the Vault."));
  const room=ui("div",undefined,"penthouse-scene");room.dataset.decor=vaultSnapshot.decor;
  room.innerHTML='<div class="penthouse-window"><i></i><i></i><i></i><i></i><i></i></div><div class="penthouse-monogram">K</div><div class="penthouse-sofa"></div><div class="penthouse-table"></div><div class="penthouse-rug"></div><span class="penthouse-caption">LUHMAATX · PRIVATE RESIDENCE</span>';
  host.append(room,ui("p",vaultSnapshot.decor.toUpperCase()+" COLLECTION"));
  const styles=[{item_id:"classic",title:"Classic Suite"},...vaultSnapshot.owned.filter(x=>x.kind==="decor")];
  for(const style of styles)host.append(actionButton(style.title,async()=>{try{await api("/api/penthouse/equip",{itemId:style.item_id});await loadVault();openPenthouse();}catch(e){toast(e.message);}}));
}
async function ownerDashboard(){
  try{
    const d=await api("/api/owner/catalog");showInfo('<div id="ownerView"></div>');const host=$("ownerView");
    host.append(ui("h2","Owner Studio"),ui("p","Manage wallpaper rewards and discount inventory. Changes save to the server."));
    host.append(actionButton("ADD REWARD",()=>editOwnerReward({id:"",title:"",kind:"wallpaper",price:5000,description:"",active:false})));
    for(const item of d.items){const row=ui("article",undefined,"owner-row");row.append(ui("h3",item.title),ui("p",`${item.active?'Active':'Hidden'} · ${item.claims} claimed · ${item.stock} codes available`));if(item.kind!=="decor")row.append(actionButton("EDIT",()=>editOwnerReward(item)));host.append(row);}
  }catch(e){toast(e.message);}
}
function editOwnerReward(item){
  showInfo('<form id="ownerForm"></form>');const f=$("ownerForm"),fields={};f.append(ui("h2",item.id?"Edit reward":"New reward"));
  for(const [key,label] of Object.entries({id:"Unique ID (lowercase letters, numbers, hyphens)",title:"Title",kind:"Type: wallpaper or discount",price:"KillaCoin price",description:"Description, eligibility and expiry terms",codes:"New discount codes (one per line)"})){
    const l=ui("label",label);const input=ui(key==="description"||key==="codes"?"textarea":"input");input.name=key;input.value=item[key]??"";if(key==="price"){input.type="number";input.min="1";input.step="1";}if(item.id&&(key==="id"||key==="kind"))input.readOnly=true;l.append(input);f.append(l);fields[key]=input;
  }
  const active=ui("input");active.type="checkbox";active.checked=item.active;const al=ui("label","Available to players ");al.append(active);f.append(al);
  const upload=ui("input");upload.type="file";upload.accept="image/png,image/jpeg,image/webp";const ul=ui("label","Wallpaper upload (PNG/JPEG/WebP, max 2 MB; leave blank to keep existing)");ul.append(upload);f.append(ul);
  const status=ui("p");status.setAttribute("role","status");const save=ui("button","SAVE REWARD","primary");save.type="submit";f.append(save,status);
  f.onsubmit=async e=>{e.preventDefault();save.disabled=true;try{
    let payload="";const file=upload.files[0];if(file){if(file.size>2*1024*1024)throw Error("Choose an image under 2 MB.");payload=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});}
    const b=Object.fromEntries(Object.entries(fields).map(([k,v])=>[k,v.value]));b.price=Number(b.price);b.active=active.checked;b.payload=payload;
    await api("/api/owner/save",b);await loadVault();await ownerDashboard();
  }catch(err){status.textContent=err.message;save.disabled=false;}};
}
$("openPenthouse").onclick=openPenthouse;
$("ownerDashboard").onclick=ownerDashboard;
