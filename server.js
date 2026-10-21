
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const BET_OPTIONS = [300, 600, 1500, 3000];
const DEFAULT_BET = 300;

const SYMBOLS = ["💎", "7️⃣", "💗", "🌹", "♠️", "✨"];

// Five reels, three rows, five paylines.
const PAYLINES = [
  [0, 1, 2, 3, 4],       // Top row
  [5, 6, 7, 8, 9],       // Middle row
  [10, 11, 12, 13, 14],  // Bottom row
  [0, 6, 12, 8, 4],      // V shape
  [10, 6, 2, 8, 14]      // Inverted V
];

// Five matching symbols pay the original top prizes.
// Three and four matching symbols pay smaller prizes.
// All payouts scale with the selected bet.
const FIVE_MATCH_PAYOUTS = {
  "7️⃣": 15000,
  "💎": 7500,
  "💗": 4500,
  "🌹": 3000,
  "♠️": 3000,
  "✨": 3000
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

app.use(cors());
app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => {
  res.json({
    status: "online",
    game: "KIMIA PRIVÉ",
    reels: 5,
    rows: 3,
    bets: BET_OPTIONS
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({
      status: "error",
      database: "unavailable"
    });
  }
});

function verifyTelegram(initData) {
  if (!BOT_TOKEN || !initData || typeof initData !== "string") {
    throw new Error("Telegram authentication is not configured.");
  }

  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  const authDate = Number(params.get("auth_date"));

  if (!receivedHash || !Number.isFinite(authDate)) {
    throw new Error("Invalid Telegram login data.");
  }

  if (Math.abs(Date.now() / 1000 - authDate) > 86400) {
    throw new Error("Telegram login expired. Reopen the game.");
  }

  // Keep all other authentication fields, including signature.
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(BOT_TOKEN)
    .digest();

  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const expected = Buffer.from(expectedHash, "hex");
  const received = Buffer.from(receivedHash, "hex");

  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(received, expected)
  ) {
    throw new Error("Telegram verification failed.");
  }

  const userText = params.get("user");
  if (!userText) throw new Error("Telegram user is missing.");

  const user = JSON.parse(userText);
  if (!user.id) throw new Error("Invalid Telegram player.");

  return {
    id: String(user.id),
    username: typeof user.username === "string"
      ? user.username.slice(0, 64)
      : null
  };
}

async function getPlayer(initData) {
  const user = verifyTelegram(initData);

  const result = await pool.query(
    `INSERT INTO players (telegram_id, username)
     VALUES ($1, $2)
     ON CONFLICT (telegram_id)
     DO UPDATE SET username = EXCLUDED.username
     RETURNING telegram_id, username, balance, vip_level`,
    [user.id, user.username]
  );

  return result.rows[0];
}

app.post("/api/me", async (req, res) => {
  try {
    const player = await getPlayer(req.body?.initData);

    res.set("Cache-Control", "no-store");
    res.json({
      id: player.telegram_id,
      username: player.username,
      balance: Number(player.balance),
      vipLevel: player.vip_level
    });
  } catch (error) {
    console.error("Player login failed:", error.message);
    res.status(401).json({ error: error.message });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT username, balance
      FROM players
      ORDER BY balance DESC, created_at ASC
      LIMIT 10
    `);

    const players = result.rows.map((player, index) => ({
      rank: index + 1,
      username: player.username || "Anonymous Player",
      balance: Number(player.balance)
    }));

    res.set("Cache-Control", "no-store");
    res.json({ players });
  } catch (error) {
    console.error("Leaderboard failed:", error.message);
    res.status(500).json({
      error: "Unable to load leaderboard."
    });
  }
});

function calculatePayout(line, bet) {
  const counts = {};

  for (const symbol of line) {
    counts[symbol] = (counts[symbol] || 0) + 1;
  }

  const bestCount = Math.max(...Object.values(counts));
  const winningSymbol = Object.keys(counts)
    .find(symbol => counts[symbol] === bestCount);

  const scale = bet / DEFAULT_BET;

  if (bestCount >= 5) {
    return Math.round(
      FIVE_MATCH_PAYOUTS[winningSymbol] * scale
    );
  }

  if (bestCount === 4) {
    return Math.round(
      FIVE_MATCH_PAYOUTS[winningSymbol] / 3 * scale
    );
  }

  if (bestCount === 3) {
    return Math.round(
      FIVE_MATCH_PAYOUTS[winningSymbol] / 10 * scale
    );
  }

  if (bestCount === 2) {
    return Math.round(150 * scale);
  }

  return 0;
}

app.post("/api/spin", async (req, res) => {
  let client;
  let transactionOpen = false;

  try {
    const user = verifyTelegram(req.body?.initData);

    const bet = req.body?.bet === undefined
      ? DEFAULT_BET
      : req.body.bet;

    if (
      !Number.isSafeInteger(bet) ||
      !BET_OPTIONS.includes(bet)
    ) {
      return res.status(400).json({
        error: "Invalid bet. Choose 300, 600, 1500, or 3000 chips."
      });
    }

    client = await pool.connect();
    await client.query("BEGIN");
    transactionOpen = true;

    const playerResult = await client.query(
      `INSERT INTO players (telegram_id, username)
       VALUES ($1, $2)
       ON CONFLICT (telegram_id)
       DO UPDATE SET username = EXCLUDED.username
       RETURNING telegram_id, username, balance, vip_level`,
      [user.id, user.username]
    );

    const player = playerResult.rows[0];
    const balance = Number(player.balance);

    if (balance < bet) {
      await client.query("ROLLBACK");
      transactionOpen = false;

      return res.status(400).json({
        error: "Not enough chips for this bet.",
        balance,
        bet
      });
    }

    // Generate a 5-reel x 3-row grid (15 symbols).
    // Index layout: top row 0-4, middle row 5-9,
    // bottom row 10-14.
    const output = Array.from(
      { length: 15 },
      () => SYMBOLS[crypto.randomInt(SYMBOLS.length)]
    );

    let win = 0;
    const winningLines = [];

    for (let i = 0; i < PAYLINES.length; i++) {
      const line = PAYLINES[i].map(index => output[index]);
      const payout = calculatePayout(line, bet);

      if (payout > 0) {
        win += payout;
        winningLines.push(i);
      }
    }

    const updated = await client.query(
      `UPDATE players
       SET balance = balance - $1 + $2
       WHERE telegram_id = $3
       RETURNING balance`,
      [bet, win, user.id]
    );

    await client.query("COMMIT");
    transactionOpen = false;

    res.set("Cache-Control", "no-store");
    res.json({
      symbols: output,
      bet,
      win,
      winningLines,
      balance: Number(updated.rows[0].balance),
      reels: 5,
      rows: 3
    });
  } catch (error) {
    if (client && transactionOpen) {
      await client.query("ROLLBACK").catch(() => {});
    }

    console.error("Spin failed:", error.message);
    res.status(500).json({
      error: "Unable to complete spin. Please try again."
    });
  } finally {
    if (client) client.release();
  }
});

async function initializeDatabase() {
  // Keep the existing table and its player balances.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      telegram_id BIGINT UNIQUE NOT NULL,
      username TEXT,
      balance BIGINT NOT NULL DEFAULT 1000,
      vip_level INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  console.log("Players table is ready.");
}

initializeDatabase()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log("KIMIA PRIVÉ API running on port " + PORT);
    });
  })
  .catch(error => {
    console.error(
      "Database initialization failed:",
      error.message
    );
    process.exit(1);
  });
