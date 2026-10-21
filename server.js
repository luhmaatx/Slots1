
const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

app.use(cors());
app.use(express.json({ limit: "20kb" }));

app.get("/", (req, res) => {
  res.json({ status: "online", game: "KIMIA PRIVÉ" });
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

app.post("/api/spin", async (req, res) => {
  let client;

  try {
    const user = verifyTelegram(req.body?.initData);
    client = await pool.connect();

    await client.query("BEGIN");

    const playerResult = await client.query(
      `INSERT INTO players (telegram_id, username)
       VALUES ($1, $2)
       ON CONFLICT (telegram_id)
       DO UPDATE SET username = EXCLUDED.username
       RETURNING telegram_id, username, balance, vip_level`,
      [user.id, user.username]
    );

    const player = playerResult.rows[0];
    const cost = 300;
    const balance = Number(player.balance);

    if (balance < cost) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        error: "Not enough chips.",
        balance
      });
    }

    const symbols = ["💎", "7️⃣", "💗", "🌹", "♠️", "✨"];

    // Nine symbols: three rows and three columns.
    const output = Array.from(
      { length: 9 },
      () => symbols[crypto.randomInt(symbols.length)]
    );

    // Each line uses three symbols in one horizontal row.
    const paylines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8]
    ];

    let win = 0;
    const winningLines = [];

    for (let i = 0; i < paylines.length; i++) {
      const line = paylines[i].map(index => output[index]);

      if (line.every(symbol => symbol === line[0])) {
        const payout = line[0] === "7️⃣" ? 15000
          : line[0] === "💎" ? 7500
          : line[0] === "💗" ? 4500
          : 3000;

        win += payout;
        winningLines.push(i);
      } else {
        const counts = {};

        for (const symbol of line) {
          counts[symbol] = (counts[symbol] || 0) + 1;
        }

        if (Object.values(counts).some(count => count === 2)) {
          win += 150;
          winningLines.push(i);
        }
      }
    }

    const updated = await client.query(
      `UPDATE players
       SET balance = balance - $1 + $2
       WHERE telegram_id = $3
       RETURNING balance`,
      [cost, win, user.id]
    );

    await client.query("COMMIT");

    res.json({
      symbols: output,
      win,
      winningLines,
      balance: Number(updated.rows[0].balance)
    });
  } catch (error) {
    if (client) {
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
    console.error("Database initialization failed:", error.message);
    process.exit(1);
  });
