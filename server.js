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

/* =========================================================
   HEALTH
========================================================= */

app.get("/", (req, res) => {
  res.json({
    status: "online",
    game: "KIMIA PRIVÉ"
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    console.error("Health check failed:", error.message);

    res.status(503).json({
      status: "error",
      database: "unavailable"
    });
  }
});

/* =========================================================
   TELEGRAM VERIFICATION
========================================================= */

function verifyTelegram(initData) {
  if (!BOT_TOKEN || !initData || typeof initData !== "string") {
    throw new Error(
      "Telegram authentication is not configured."
    );
  }

  const params = new URLSearchParams(initData);

  const receivedHash = params.get("hash");
  const authDate = Number(params.get("auth_date"));

  if (!receivedHash || !Number.isFinite(authDate)) {
    throw new Error("Invalid Telegram login data.");
  }

  if (Math.abs(Date.now() / 1000 - authDate) > 86400) {
    throw new Error(
      "Telegram login expired. Reopen the game."
    );
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

  const expected = Buffer.from(
    expectedHash,
    "hex"
  );

  const received = Buffer.from(
    receivedHash,
    "hex"
  );

  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(
      received,
      expected
    )
  ) {
    throw new Error(
      "Telegram verification failed."
    );
  }

  const userText = params.get("user");

  if (!userText) {
    throw new Error(
      "Telegram user is missing."
    );
  }

  let user;

  try {
    user = JSON.parse(userText);
  } catch {
    throw new Error(
      "Invalid Telegram player data."
    );
  }

  if (!user.id) {
    throw new Error(
      "Invalid Telegram player."
    );
  }

  return {
    id: String(user.id),

    username:
      typeof user.username === "string"
        ? user.username.slice(0, 64)
        : null
  };
}

/* =========================================================
   PLAYER
========================================================= */

async function getPlayer(initData) {
  const user = verifyTelegram(initData);

  const result = await pool.query(
    `INSERT INTO players
      (telegram_id, username)
     VALUES
      ($1, $2)

     ON CONFLICT (telegram_id)
     DO UPDATE SET
       username = EXCLUDED.username

     RETURNING
       telegram_id,
       username,
       balance,
       vip_level`,
    [
      user.id,
      user.username
    ]
  );

  return result.rows[0];
}

/* =========================================================
   PLAYER LOGIN
========================================================= */

app.post("/api/me", async (req, res) => {
  try {
    const player =
      await getPlayer(
        req.body?.initData
      );

    res.json({
      id: player.telegram_id,

      username:
        player.username,

      balance:
        Number(player.balance),

      vipLevel:
        player.vip_level
    });

  } catch (error) {
    console.error(
      "Player login failed:",
      error.message
    );

    res.status(401).json({
      error: error.message
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
        username,
        balance
      FROM players
      ORDER BY
        balance DESC,
        created_at ASC
      LIMIT 10
    `);

    const players =
      result.rows.map(
        (player, index) => ({
          rank: index + 1,

          username:
            player.username ||
            "Anonymous Player",

          balance:
            Number(player.balance)
        })
      );

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      players
    });

  } catch (error) {
    console.error(
      "Leaderboard failed:",
      error.message
    );

    res.status(500).json({
      error:
        "Unable to load leaderboard."
    });
  }
});

/* =========================================================
   FIVE-REEL SLOT
=========================================================

   Layout:

   5 columns
   3 rows

   Total:
   15 symbols

   Indexes:

   0   1   2   3   4
   5   6   7   8   9
   10  11  12  13  14

========================================================= */

app.post("/api/spin", async (req, res) => {
  let client;

  try {
    const user =
      verifyTelegram(
        req.body?.initData
      );

    /* -----------------------------------------------------
       VALID BETS
    ----------------------------------------------------- */

    const allowedBets =
      [300, 600, 1500, 3000];

    const requestedBet =
      Number(req.body?.bet);

    const cost =
      allowedBets.includes(
        requestedBet
      )
        ? requestedBet
        : 300;

    /* -----------------------------------------------------
       DATABASE TRANSACTION
    ----------------------------------------------------- */

    client =
      await pool.connect();

    await client.query("BEGIN");

    /* -----------------------------------------------------
       FIND / CREATE PLAYER
    ----------------------------------------------------- */

    const playerResult =
      await client.query(
        `INSERT INTO players
          (telegram_id, username)
         VALUES
          ($1, $2)

         ON CONFLICT (telegram_id)
         DO UPDATE SET
           username = EXCLUDED.username

         RETURNING
           telegram_id,
           username,
           balance,
           vip_level`,
        [
          user.id,
          user.username
        ]
      );

    const player =
      playerResult.rows[0];

    const balance =
      Number(player.balance);

    /* -----------------------------------------------------
       CHECK BALANCE
    ----------------------------------------------------- */

    if (balance < cost) {
      await client.query(
        "ROLLBACK"
      );

      return res.status(400).json({
        error:
          "Not enough chips.",

        balance
      });
    }

    /* -----------------------------------------------------
       SYMBOLS
    ----------------------------------------------------- */

    const symbols = [
      "💎",
      "7️⃣",
      "💗",
      "🌹",
      "♠️",
      "✨"
    ];

    /* -----------------------------------------------------
       GENERATE 15 SYMBOLS
    ----------------------------------------------------- */

    const output =
      Array.from(
        { length: 15 },
        () =>
          symbols[
            crypto.randomInt(
              symbols.length
            )
          ]
      );

    /* -----------------------------------------------------
       FIVE-REEL / THREE-ROW PAYLINES

       5 horizontal lines are represented
       by the 3 visible rows plus 2
       additional patterns.

       Row 1:
       0  1  2  3  4

       Row 2:
       5  6  7  8  9

       Row 3:
       10 11 12 13 14

       Extra diagonal patterns:
       0 6 12 8 4
       10 6 2 8 14
    ----------------------------------------------------- */

    const paylines = [
      [0, 1, 2, 3, 4],

      [5, 6, 7, 8, 9],

      [10, 11, 12, 13, 14],

      [0, 6, 12, 8, 4],

      [10, 6, 2, 8, 14]
    ];

    let win = 0;

    const winningLines = [];

    /* -----------------------------------------------------
       CHECK PAYLINES
    ----------------------------------------------------- */

    for (
      let i = 0;
      i < paylines.length;
      i++
    ) {
      const line =
        paylines[i].map(
          index => output[index]
        );

      const first =
        line[0];

      const allMatch =
        line.every(
          symbol =>
            symbol === first
        );

      /* ---------------------------------------------------
         FIVE OF A KIND
      --------------------------------------------------- */

      if (allMatch) {

        let payout;

        if (first === "7️⃣") {
          payout =
            cost * 50;
        } else if (
          first === "💎"
        ) {
          payout =
            cost * 25;
        } else if (
          first === "💗"
        ) {
          payout =
            cost * 15;
        } else if (
          first === "🌹"
        ) {
          payout =
            cost * 12;
        } else {
          payout =
            cost * 10;
        }

        win += payout;

        winningLines.push(i);

        continue;
      }

      /* ---------------------------------------------------
         FOUR OF A KIND
      --------------------------------------------------- */

      const counts = {};

      for (
        const symbol of line
      ) {
        counts[symbol] =
          (counts[symbol] || 0) + 1;
      }

      const highest =
        Math.max(
          ...Object.values(counts)
        );

      if (highest >= 4) {

        win += cost * 5;

        winningLines.push(i);

      } else if (
        highest === 3
      ) {

        win += cost * 2;

        winningLines.push(i);

      } else if (
        highest === 2
      ) {

        win += Math.floor(
          cost * 0.5
        );

        winningLines.push(i);

      }
    }

    /* -----------------------------------------------------
       UPDATE BALANCE

       Existing PostgreSQL account remains intact.
       Only the spin cost and winnings are applied.
    ----------------------------------------------------- */

    const updated =
      await client.query(
        `UPDATE players
         SET balance =
           balance - $1 + $2

         WHERE telegram_id = $3

         RETURNING
           balance,
           vip_level`,
        [
          cost,
          win,
          user.id
        ]
      );

    await client.query(
      "COMMIT"
    );

    /* -----------------------------------------------------
       RESPONSE
    ----------------------------------------------------- */

    res.json({

      symbols:
        output,

      win,

      winningLines,

      bet:
        cost,

      balance:
        Number(
          updated.rows[0].balance
        ),

      vipLevel:
        updated.rows[0].vip_level

    });

  } catch (error) {

    if (client) {

      await client.query(
        "ROLLBACK"
      ).catch(() => {});

    }

    console.error(
      "Spin failed:",
      error.message
    );

    res.status(500).json({
      error:
        "Unable to complete spin. Please try again."
    });

  } finally {

    if (client) {
      client.release();
    }

  }
});

/* =========================================================
   DATABASE INITIALIZATION
========================================================= */

async function initializeDatabase() {

  await pool.query(`
    CREATE TABLE IF NOT EXISTS players (

      id BIGINT
        GENERATED ALWAYS AS IDENTITY
        PRIMARY KEY,

      telegram_id BIGINT
        UNIQUE
        NOT NULL,

      username TEXT,

      balance BIGINT
        NOT NULL
        DEFAULT 1000,

      vip_level INTEGER
        NOT NULL
        DEFAULT 0,

      created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()
    )
  `);

  console.log(
    "Players table is ready."
  );
}

/* =========================================================
   START SERVER
========================================================= */

initializeDatabase()
  .then(() => {

    app.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          "KIMIA PRIVÉ API running on port " +
          PORT
        );

      }
    );

  })
  .catch(error => {

    console.error(
      "Database initialization failed:",
      error.message
    );

    process.exit(1);

  });
