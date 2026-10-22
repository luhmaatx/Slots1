const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
if (!BOT_TOKEN) {
  console.error("ERROR: TELEGRAM_BOT_TOKEN is not configured.");
}

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not configured.");
}

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());

app.use(
  express.json({
    limit: "1mb"
  })
);

/* =========================================================
   STATIC FRONTEND
========================================================= */

app.use(express.static(__dirname));

/* =========================================================
   POSTGRESQL
========================================================= */

const pool = new Pool({
  connectionString: DATABASE_URL,

  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,

  max: 10,

  idleTimeoutMillis: 30000,

  connectionTimeoutMillis: 10000
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error:", error);
});

/* =========================================================
   DATABASE INITIALIZATION
========================================================= */

async function initializeDatabase() {
  const client = await pool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS players (
        telegram_id BIGINT PRIMARY KEY,
        username TEXT,
        balance BIGINT NOT NULL DEFAULT 1000,
        vip_level INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    console.log("PostgreSQL database initialized.");
  } finally {
    client.release();
  }
}

/* =========================================================
   TELEGRAM WEB APP VERIFICATION
========================================================= */

function verifyTelegramInitData(initData) {
  if (!initData || typeof initData !== "string") {
    throw new Error("Telegram login data is missing.");
  }

  if (!BOT_TOKEN) {
    throw new Error("Telegram bot is not configured on the server.");
  }

  const params = new URLSearchParams(initData);

  const receivedHash = params.get("hash");

  if (!receivedHash) {
    throw new Error("Telegram login hash is missing.");
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

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const receivedBuffer = Buffer.from(receivedHash, "hex");
  const calculatedBuffer = Buffer.from(calculatedHash, "hex");

  if (
    receivedBuffer.length !== calculatedBuffer.length ||
    !crypto.timingSafeEqual(receivedBuffer, calculatedBuffer)
  ) {
    throw new Error("Telegram login verification failed.");
  }

  const authDate = Number(params.get("auth_date"));

  if (!Number.isFinite(authDate)) {
    throw new Error("Telegram authentication timestamp is missing.");
  }

  const age = Math.floor(Date.now() / 1000) - authDate;

  if (age < -60 || age > 86400) {
    throw new Error("Telegram login session has expired.");
  }

  const userRaw = params.get("user");

  if (!userRaw) {
    throw new Error("Telegram user information is missing.");
  }

  let user;

  try {
    user = JSON.parse(userRaw);
  } catch {
    throw new Error("Telegram user information is invalid.");
  }

  if (!user || !user.id) {
    throw new Error("Telegram user ID is missing.");
  }

  return user;
}

/* =========================================================
   PLAYER ACCOUNT
========================================================= */

async function getOrCreatePlayer(user) {
  const telegramId = String(user.id);

  const username =
    user.username ||
    [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ") ||
    `player_${telegramId}`;

  const result = await pool.query(
    `
      INSERT INTO players (
        telegram_id,
        username
      )
      VALUES ($1, $2)
      ON CONFLICT (telegram_id)
      DO UPDATE SET
        username = EXCLUDED.username,
        updated_at = NOW()
      RETURNING
        telegram_id,
        username,
        balance,
        vip_level
    `,
    [telegramId, username]
  );

  return result.rows[0];
}

/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

async function authenticatedUser(req, res, next) {
  try {
    const initData = req.body?.initData;

    const user = verifyTelegramInitData(initData);

    req.telegramUser = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    res.status(401).json({
      error: error.message || "Login failed."
    });
  }
}

/* =========================================================
   HEALTH
========================================================= */

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected",
      game: "KIMIA PRIVÉ",
      version: "2.1"
    });
  } catch (error) {
    console.error("Health check failed:", error);

    res.status(500).json({
      status: "error",
      database: "disconnected"
    });
  }
});

/* =========================================================
   LOGIN / PLAYER PROFILE
========================================================= */

app.post("/api/me", authenticatedUser, async (req, res) => {
  try {
    const player = await getOrCreatePlayer(req.telegramUser);

    res.json({
      id: String(player.telegram_id),

      username:
        player.username,

      balance:
        Number(player.balance),

      vipLevel:
        Number(player.vip_level)
    });
  } catch (error) {
    console.error("/api/me error:", error);

    res.status(500).json({
      error: "Unable to load your PRIVÉ account."
    });
  }
});

/* =========================================================
   LEADERBOARD
========================================================= */

app.get("/api/leaderboard", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        telegram_id,
        username,
        balance
      FROM players
      ORDER BY balance DESC
      LIMIT 100
    `);

    const players = result.rows.map((player, index) => ({
      rank: index + 1,

      username:
        player.username ||
        "PRIVÉ Player",

      balance:
        Number(player.balance)
    }));

    res.json({
      players
    });
  } catch (error) {
    console.error("/api/leaderboard error:", error);

    res.status(500).json({
      error: "Unable to load leaderboard."
    });
  }
});

/* =========================================================
   SLOT SYMBOLS
========================================================= */

const SYMBOLS = [
  "💎",
  "7️⃣",
  "💗",
  "🌹",
  "♠️",
  "✨"
];

/*
  Weighted symbol selection.

  Higher-weight symbols appear more often.
  The frontend converts these server values
  into the 3D luxury CSS artwork.
*/

const SYMBOL_WEIGHTS = [
  { symbol: "💎", weight: 20 },
  { symbol: "7️⃣", weight: 8 },
  { symbol: "💗", weight: 22 },
  { symbol: "🌹", weight: 18 },
  { symbol: "♠️", weight: 22 },
  { symbol: "✨", weight: 10 }
];

function randomSymbol() {
  const totalWeight =
    SYMBOL_WEIGHTS.reduce(
      (sum, item) => sum + item.weight,
      0
    );

  let random =
    Math.random() * totalWeight;

  for (const item of SYMBOL_WEIGHTS) {
    random -= item.weight;

    if (random <= 0) {
      return item.symbol;
    }
  }

  return SYMBOL_WEIGHTS[
    SYMBOL_WEIGHTS.length - 1
  ].symbol;
}

function generateSpin() {
  return Array.from(
    { length: 15 },
    () => randomSymbol()
  );
}

/* =========================================================
   PAYLINES
========================================================= */

/*
  Reel positions:

    0  3  6  9  12
    1  4  7  10 13
    2  5  8  11 14

  Five paylines:

    1. top
    2. middle
    3. bottom
    4. diagonal down
    5. diagonal up
*/

const PAYLINES = [
  [0, 3, 6, 9, 12],
  [1, 4, 7, 10, 13],
  [2, 5, 8, 11, 14],
  [0, 4, 8, 10, 12],
  [2, 4, 6, 10, 14]
];

function evaluatePayline(symbols, line) {
  const first =
    symbols[line[0]];

  let matches = 1;

  for (let i = 1; i < line.length; i++) {
    if (symbols[line[i]] === first) {
      matches++;
    } else {
      break;
    }
  }

  return {
    symbol: first,
    matches
  };
}

/* =========================================================
   PAYOUT
========================================================= */

function calculateWin(symbols, bet) {
  let totalWin = 0;

  const winningLines = [];

  PAYLINES.forEach((line, lineIndex) => {
    const result =
      evaluatePayline(symbols, line);

    if (result.matches >= 3) {
      let multiplier = 0;

      if (result.matches === 3) {
        multiplier = 2;
      }

      if (result.matches === 4) {
        multiplier = 5;
      }

      if (result.matches === 5) {
        multiplier = 12;
      }

      /*
        7s receive a premium payout.
      */

      if (
        result.symbol === "7️⃣" &&
        result.matches >= 3
      ) {
        multiplier *= 2;
      }

      const lineWin =
        bet * multiplier;

      totalWin += lineWin;

      winningLines.push({
        line: lineIndex + 1,
        matches: result.matches,
        symbol: result.symbol,
        win: lineWin
      });
    }
  });

  return {
    win: totalWin,
    winningLines
  };
}

/* =========================================================
   SPIN
========================================================= */

app.post(
  "/api/spin",
  authenticatedUser,
  async (req, res) => {
    const bet =
      Number(req.body?.bet);

    const allowedBets = [
      300,
      600,
      1500,
      3000
    ];

    if (!Number.isSafeInteger(bet)) {
      return res.status(400).json({
        error: "Invalid bet."
      });
    }

    if (!allowedBets.includes(bet)) {
      return res.status(400).json({
        error:
          "Invalid bet. Allowed bets are 300, 600, 1500 and 3000."
      });
    }

    const telegramId =
      String(req.telegramUser.id);

    const client =
      await pool.connect();

    try {
      await client.query("BEGIN");

      /*
        Lock the player's row so two rapid
        requests cannot spend the same coins.
      */

      const playerResult =
        await client.query(
          `
            SELECT
              telegram_id,
              username,
              balance,
              vip_level
            FROM players
            WHERE telegram_id = $1
            FOR UPDATE
          `,
          [telegramId]
        );

      if (playerResult.rowCount === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          error:
            "PRIVÉ account not found."
        });
      }

      const player =
        playerResult.rows[0];

      const currentBalance =
        Number(player.balance);

      if (currentBalance < bet) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          error:
            "Not enough PRIVÉ coins."
        });
      }

      /*
        Generate the complete server-authoritative
        5 × 3 result.
      */

      const symbols =
        generateSpin();

      const payout =
        calculateWin(
          symbols,
          bet
        );

      const newBalance =
        currentBalance -
        bet +
        payout.win;

      await client.query(
        `
          UPDATE players
          SET
            balance = $1,
            updated_at = NOW()
          WHERE telegram_id = $2
        `,
        [
          newBalance,
          telegramId
        ]
      );

      await client.query("COMMIT");

      res.json({
        symbols,

        win:
          payout.win,

        winningLines:
          payout.winningLines,

        bet,

        balance:
          newBalance,

        vipLevel:
          Number(player.vip_level),

        username:
          player.username
      });
    } catch (error) {
      try {
        await client.query("ROLLBACK");
      } catch {}

      console.error("/api/spin error:", error);

      res.status(500).json({
        error:
          "Spin failed. Your coins were not changed."
      });
    } finally {
      client.release();
    }
  }
);

/* =========================================================
   UNKNOWN API ROUTES
========================================================= */

app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found."
  });
});

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {
  try {
    await initializeDatabase();

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `KIMIA PRIVÉ server running on port ${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Unable to start KIMIA PRIVÉ server:",
      error
    );

    process.exit(1);
  }
}

startServer();
