const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;

/* =========================================================
   BASIC MIDDLEWARE
========================================================= */

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept"]
}));

app.use(express.json({
  limit: "1mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "1mb"
}));

/* =========================================================
   STATIC FILES
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
  console.error(
    "POSTGRES POOL ERROR:",
    error
  );
});

/* =========================================================
   REQUEST LOGGER
========================================================= */

app.use((req, res, next) => {

  console.log(
    `[REQUEST] ${req.method} ${req.originalUrl}`
  );

  next();

});

/* =========================================================
   DATABASE INITIALIZATION
========================================================= */

async function initializeDatabase() {

  const client =
    await pool.connect();

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

    console.log(
      "PostgreSQL database initialized."
    );

  } finally {

    client.release();

  }

}

/* =========================================================
   TELEGRAM INIT DATA VERIFICATION
========================================================= */

function verifyTelegramInitData(initData) {

  if (
    !initData ||
    typeof initData !== "string"
  ) {

    throw new Error(
      "Telegram login data is missing."
    );

  }

  if (!BOT_TOKEN) {

    throw new Error(
      "TELEGRAM_BOT_TOKEN is not configured on Render."
    );

  }

  const params =
    new URLSearchParams(initData);

  const receivedHash =
    params.get("hash");

  if (!receivedHash) {

    throw new Error(
      "Telegram login hash is missing."
    );

  }

  params.delete("hash");

  const dataCheckString =
    [...params.entries()]
      .sort(([a], [b]) =>
        a.localeCompare(b)
      )
      .map(
        ([key, value]) =>
          `${key}=${value}`
      )
      .join("\n");

  const secretKey =
    crypto
      .createHmac(
        "sha256",
        "WebAppData"
      )
      .update(BOT_TOKEN)
      .digest();

  const calculatedHash =
    crypto
      .createHmac(
        "sha256",
        secretKey
      )
      .update(dataCheckString)
      .digest("hex");

  const receivedBuffer =
    Buffer.from(
      receivedHash,
      "hex"
    );

  const calculatedBuffer =
    Buffer.from(
      calculatedHash,
      "hex"
    );

  if (
    receivedBuffer.length !==
      calculatedBuffer.length ||
    !crypto.timingSafeEqual(
      receivedBuffer,
      calculatedBuffer
    )
  ) {

    throw new Error(
      "Telegram login verification failed."
    );

  }

  const authDate =
    Number(
      params.get("auth_date")
    );

  if (
    !Number.isFinite(authDate)
  ) {

    throw new Error(
      "Telegram authentication timestamp is missing."
    );

  }

  const age =
    Math.floor(
      Date.now() / 1000
    ) - authDate;

  if (
    age < -60 ||
    age > 86400
  ) {

    throw new Error(
      "Telegram login session has expired."
    );

  }

  const userRaw =
    params.get("user");

  if (!userRaw) {

    throw new Error(
      "Telegram user information is missing."
    );

  }

  let user;

  try {

    user =
      JSON.parse(userRaw);

  } catch {

    throw new Error(
      "Telegram user information is invalid."
    );

  }

  if (
    !user ||
    !user.id
  ) {

    throw new Error(
      "Telegram user ID is missing."
    );

  }

  return user;

}

/* =========================================================
   PLAYER ACCOUNT
========================================================= */

async function getOrCreatePlayer(user) {

  const telegramId =
    String(user.id);

  const username =
    user.username ||
    [user.first_name, user.last_name]
      .filter(Boolean)
      .join(" ") ||
    `player_${telegramId}`;

  console.log(
    `[PLAYER] Loading account ${telegramId}`
  );

  const result =
    await pool.query(
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
      [
        telegramId,
        username
      ]
    );

  if (
    !result.rows ||
    result.rows.length === 0
  ) {

    throw new Error(
      "Database did not return the player account."
    );

  }

  return result.rows[0];

}

/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

async function authenticatedUser(
  req,
  res,
  next
) {

  try {

    const initData =
      req.body &&
      req.body.initData;

    console.log(
      `[AUTH] initData received: ${
        typeof initData === "string"
          ? initData.length + " characters"
          : "NO"
      }`
    );

    const user =
      verifyTelegramInitData(
        initData
      );

    req.telegramUser =
      user;

    next();

  } catch (error) {

    console.error(
      "[AUTH ERROR]",
      error.message
    );

    return res
      .status(401)
      .type("application/json")
      .json({
        error:
          error.message ||
          "Login failed."
      });

  }

}

/* =========================================================
   ROOT
========================================================= */

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      __dirname,
      "index.html"
    )
  );

});

/* =========================================================
   HEALTH
========================================================= */

app.get(
  "/api/health",
  async (req, res) => {

    try {

      await pool.query(
        "SELECT 1"
      );

      return res
        .status(200)
        .json({
          status: "ok",
          database: "connected",
          game: "KIMIA PRIVÉ",
          version: "2.3"
        });

    } catch (error) {

      console.error(
        "[HEALTH ERROR]",
        error
      );

      return res
        .status(500)
        .json({
          status: "error",
          database: "disconnected",
          error: error.message
        });

    }

  }
);

/* =========================================================
   LOGIN
========================================================= */

app.post(
  "/api/me",
  authenticatedUser,
  async (req, res) => {

    console.log(
      "[API/ME] Request authenticated."
    );

    try {

      const player =
        await getOrCreatePlayer(
          req.telegramUser
        );

      const response = {
        id:
          String(
            player.telegram_id
          ),

        username:
          player.username ||
          "PRIVÉ MEMBER",

        balance:
          Number(
            player.balance
          ),

        vipLevel:
          Number(
            player.vip_level
          )
      };

      console.log(
        "[API/ME] Sending account response:",
        response
      );

      return res
        .status(200)
        .type("application/json")
        .json(response);

    } catch (error) {

      console.error(
        "[API/ME ERROR]",
        error
      );

      return res
        .status(500)
        .type("application/json")
        .json({
          error:
            "Unable to load your PRIVÉ account.",
          details:
            error.message
        });

    }

  }
);

/* =========================================================
   LEADERBOARD
========================================================= */

app.get(
  "/api/leaderboard",
  async (req, res) => {

    try {

      const result =
        await pool.query(`
          SELECT
            telegram_id,
            username,
            balance
          FROM players
          ORDER BY balance DESC
          LIMIT 100
        `);

      const players =
        result.rows.map(
          (player, index) => ({
            rank:
              index + 1,

            username:
              player.username ||
              "PRIVÉ Player",

            balance:
              Number(
                player.balance
              )
          })
        );

      return res
        .status(200)
        .json({
          players
        });

    } catch (error) {

      console.error(
        "[LEADERBOARD ERROR]",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Unable to load leaderboard."
        });

    }

  }
);

/* =========================================================
   SLOT SYMBOLS
========================================================= */

const SYMBOL_WEIGHTS = [
  {
    symbol: "💎",
    weight: 20
  },
  {
    symbol: "7️⃣",
    weight: 8
  },
  {
    symbol: "💗",
    weight: 22
  },
  {
    symbol: "🌹",
    weight: 18
  },
  {
    symbol: "♠️",
    weight: 22
  },
  {
    symbol: "✨",
    weight: 10
  }
];

function randomSymbol() {

  const totalWeight =
    SYMBOL_WEIGHTS.reduce(
      (sum, item) =>
        sum + item.weight,
      0
    );

  let random =
    Math.random() *
    totalWeight;

  for (
    const item of SYMBOL_WEIGHTS
  ) {

    random -=
      item.weight;

    if (
      random <= 0
    ) {

      return item.symbol;

    }

  }

  return SYMBOL_WEIGHTS[
    SYMBOL_WEIGHTS.length - 1
  ].symbol;

}

function generateSpin() {

  return Array.from(
    {
      length: 15
    },
    () => randomSymbol()
  );

}

/* =========================================================
   PAYLINES
========================================================= */

const PAYLINES = [
  [0, 3, 6, 9, 12],
  [1, 4, 7, 10, 13],
  [2, 5, 8, 11, 14],
  [0, 4, 8, 10, 12],
  [2, 4, 6, 10, 14]
];

function evaluatePayline(
  symbols,
  line
) {

  const first =
    symbols[line[0]];

  let matches = 1;

  for (
    let i = 1;
    i < line.length;
    i++
  ) {

    if (
      symbols[line[i]] === first
    ) {

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

function calculateWin(
  symbols,
  bet
) {

  let totalWin = 0;

  const winningLines = [];

  PAYLINES.forEach(
    (line, lineIndex) => {

      const result =
        evaluatePayline(
          symbols,
          line
        );

      if (
        result.matches >= 3
      ) {

        let multiplier = 0;

        if (
          result.matches === 3
        ) {

          multiplier = 2;

        } else if (
          result.matches === 4
        ) {

          multiplier = 5;

        } else if (
          result.matches === 5
        ) {

          multiplier = 12;

        }

        if (
          result.symbol === "7️⃣"
        ) {

          multiplier *= 2;

        }

        const lineWin =
          bet * multiplier;

        totalWin +=
          lineWin;

        winningLines.push({
          line:
            lineIndex + 1,

          matches:
            result.matches,

          symbol:
            result.symbol,

          win:
            lineWin
        });

      }

    }
  );

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
      Number(
        req.body &&
        req.body.bet
      );

    const allowedBets = [
      300,
      600,
      1500,
      3000
    ];

    if (
      !Number.isSafeInteger(
        bet
      )
    ) {

      return res
        .status(400)
        .json({
          error:
            "Invalid bet."
        });

    }

    if (
      !allowedBets.includes(
        bet
      )
    ) {

      return res
        .status(400)
        .json({
          error:
            "Invalid bet. Allowed bets are 300, 600, 1500 and 3000."
        });

    }

    const telegramId =
      String(
        req.telegramUser.id
      );

    const client =
      await pool.connect();

    try {

      await client.query(
        "BEGIN"
      );

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

      if (
        playerResult.rowCount === 0
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res
          .status(404)
          .json({
            error:
              "PRIVÉ account not found."
          });

      }

      const player =
        playerResult.rows[0];

      const currentBalance =
        Number(
          player.balance
        );

      if (
        currentBalance < bet
      ) {

        await client.query(
          "ROLLBACK"
        );

        return res
          .status(400)
          .json({
            error:
              "Not enough PRIVÉ coins."
          });

      }

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

      await client.query(
        "COMMIT"
      );

      return res
        .status(200)
        .json({

          symbols,

          win:
            payout.win,

          winningLines:
            payout.winningLines,

          bet,

          balance:
            newBalance,

          vipLevel:
            Number(
              player.vip_level
            ),

          username:
            player.username

        });

    } catch (error) {

      try {

        await client.query(
          "ROLLBACK"
        );

      } catch {}

      console.error(
        "[SPIN ERROR]",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Spin failed. Your coins were not changed."
        });

    } finally {

      client.release();

    }

  }
);

/* =========================================================
   API 404
========================================================= */

app.use(
  "/api",
  (req, res) => {

    console.log(
      `[API 404] ${req.method} ${req.originalUrl}`
    );

    return res
      .status(404)
      .json({
        error:
          "API endpoint not found.",
        path:
          req.originalUrl
      });

  }
);

/* =========================================================
   GENERAL ERROR HANDLER
========================================================= */

app.use(
  (error, req, res, next) => {

    console.error(
      "[UNHANDLED ERROR]",
      error
    );

    if(res.headersSent){
      return next(error);
    }

    return res
      .status(500)
      .json({
        error:
          "Internal server error.",
        details:
          error.message
      });

  }
);

/* =========================================================
   START SERVER
========================================================= */

async function startServer() {

  try {

    if(!BOT_TOKEN){

      console.error(
        "WARNING: TELEGRAM_BOT_TOKEN is missing."
      );

    } else {

      console.log(
        "TELEGRAM_BOT_TOKEN is configured."
      );

    }

    if(!DATABASE_URL){

      console.error(
        "WARNING: DATABASE_URL is missing."
      );

    } else {

      console.log(
        "DATABASE_URL is configured."
      );

    }

    await initializeDatabase();

    app.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          `KIMIA PRIVÉ server running on port ${PORT}`
        );

        console.log(
          `Health endpoint: /api/health`
        );

      }
    );

  } catch (error) {

    console.error(
      "UNABLE TO START KIMIA PRIVÉ:",
      error
    );

    process.exit(1);

  }

}

startServer();
