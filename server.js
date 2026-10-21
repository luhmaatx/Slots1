const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

app.use(cors());
app.use(express.json({ limit: "20kb" }));

/* =========================================================
   BASIC RATE LIMITER
========================================================= */

const rateMap = new Map();

function rateLimit(key, maxRequests, windowMs) {
  const now = Date.now();

  const existing = rateMap.get(key);

  if (!existing || now - existing.start > windowMs) {
    rateMap.set(key, {
      start: now,
      count: 1
    });

    return true;
  }

  if (existing.count >= maxRequests) {
    return false;
  }

  existing.count++;

  return true;
}

/* =========================================================
   HEALTH
========================================================= */

app.get("/", (req, res) => {
  res.json({
    status: "online",
    game: "KIMIA PRIVÉ",
    version: "2.0"
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
    console.error(
      "Health check failed:",
      error.message
    );

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

  if (
    !BOT_TOKEN ||
    !initData ||
    typeof initData !== "string"
  ) {
    throw new Error(
      "Telegram authentication is not configured."
    );
  }

  const params =
    new URLSearchParams(initData);

  const receivedHash =
    params.get("hash");

  const authDate =
    Number(params.get("auth_date"));

  if (
    !receivedHash ||
    !Number.isFinite(authDate)
  ) {
    throw new Error(
      "Invalid Telegram login data."
    );
  }

  if (
    Math.abs(
      Date.now() / 1000 - authDate
    ) > 86400
  ) {
    throw new Error(
      "Telegram login expired. Reopen the game."
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

  const expectedHash =
    crypto
      .createHmac(
        "sha256",
        secretKey
      )
      .update(dataCheckString)
      .digest("hex");

  const expected =
    Buffer.from(
      expectedHash,
      "hex"
    );

  const received =
    Buffer.from(
      receivedHash,
      "hex"
    );

  if (
    received.length !==
      expected.length ||
    !crypto.timingSafeEqual(
      received,
      expected
    )
  ) {
    throw new Error(
      "Telegram verification failed."
    );
  }

  const userText =
    params.get("user");

  if (!userText) {
    throw new Error(
      "Telegram user is missing."
    );
  }

  let user;

  try {
    user =
      JSON.parse(userText);
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
        : null,

    firstName:
      typeof user.first_name === "string"
        ? user.first_name.slice(0, 64)
        : null
  };
}

/* =========================================================
   VIP CALCULATION
========================================================= */

function calculateVipLevel(lifetimeWagered) {

  const wagered =
    Number(lifetimeWagered || 0);

  if (wagered >= 1000000) return 10;
  if (wagered >= 500000) return 9;
  if (wagered >= 250000) return 8;
  if (wagered >= 100000) return 7;
  if (wagered >= 50000) return 6;
  if (wagered >= 25000) return 5;
  if (wagered >= 10000) return 4;
  if (wagered >= 5000) return 3;
  if (wagered >= 2500) return 2;
  if (wagered >= 1000) return 1;

  return 0;
}

function vipMultiplier(vipLevel) {

  const level =
    Number(vipLevel || 0);

  return 1 + level * 0.02;
}

/* =========================================================
   GET / CREATE PLAYER
========================================================= */

async function getPlayer(initData) {

  const user =
    verifyTelegram(initData);

  const result =
    await pool.query(
      `INSERT INTO players
        (
          telegram_id,
          username
        )
       VALUES
        (
          $1,
          $2
        )

       ON CONFLICT (telegram_id)
       DO UPDATE SET
         username = EXCLUDED.username

       RETURNING
         telegram_id,
         username,
         balance,
         vip_level,
         lifetime_wagered,
         lifetime_won,
         total_spins,
         biggest_win,
         daily_streak,
         last_daily_claim`,
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

      id:
        player.telegram_id,

      username:
        player.username,

      balance:
        Number(player.balance),

      vipLevel:
        Number(player.vip_level),

      lifetimeWagered:
        Number(
          player.lifetime_wagered
        ),

      lifetimeWon:
        Number(
          player.lifetime_won
        ),

      totalSpins:
        Number(
          player.total_spins
        ),

      biggestWin:
        Number(
          player.biggest_win
        ),

      dailyStreak:
        Number(
          player.daily_streak
        )

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
   TRANSACTION LEDGER
========================================================= */

async function recordTransaction(
  client,
  telegramId,
  type,
  amount,
  balanceAfter,
  metadata = {}
) {

  await client.query(
    `INSERT INTO transactions
      (
        telegram_id,
        type,
        amount,
        balance_after,
        metadata
      )
     VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5
      )`,
    [
      telegramId,
      type,
      amount,
      balanceAfter,
      JSON.stringify(metadata)
    ]
  );
}

/* =========================================================
   1. PLAYER GIFTING
========================================================= */

app.post("/api/gift", async (req, res) => {

  let client;

  try {

    const user =
      verifyTelegram(
        req.body?.initData
      );

    if (
      !rateLimit(
        `gift:${user.id}`,
        10,
        60000
      )
    ) {
      return res.status(429).json({
        error:
          "Too many gift attempts. Please wait."
      });
    }

    const allowedAmounts =
      [300, 600, 1500, 3000];

    const amount =
      Number(req.body?.amount);

    if (
      !allowedAmounts.includes(amount)
    ) {
      return res.status(400).json({
        error:
          "Invalid gift amount."
      });
    }

    let recipientUsername =
      String(
        req.body?.username || ""
      )
        .trim()
        .replace(/^@/, "")
        .slice(0, 64);

    if (!recipientUsername) {
      return res.status(400).json({
        error:
          "Recipient username is required."
      });
    }

    client =
      await pool.connect();

    await client.query(
      "BEGIN"
    );

    /* Lock sender */

    const senderResult =
      await client.query(
        `SELECT
          telegram_id,
          username,
          balance
         FROM players
         WHERE telegram_id = $1
         FOR UPDATE`,
        [user.id]
      );

    if (
      senderResult.rows.length === 0
    ) {
      throw new Error(
        "Sender account not found."
      );
    }

    const sender =
      senderResult.rows[0];

    /* Find recipient */

    const recipientResult =
      await client.query(
        `SELECT
          telegram_id,
          username,
          balance
         FROM players
         WHERE LOWER(username) = LOWER($1)
         LIMIT 1
         FOR UPDATE`,
        [recipientUsername]
      );

    if (
      recipientResult.rows.length === 0
    ) {
      throw new Error(
        "Player not found."
      );
    }

    const recipient =
      recipientResult.rows[0];

    if (
      String(sender.telegram_id) ===
      String(recipient.telegram_id)
    ) {
      throw new Error(
        "You cannot gift yourself."
      );
    }

    const senderBalance =
      Number(sender.balance);

    if (
      senderBalance < amount
    ) {
      throw new Error(
        "Not enough chips to send this gift."
      );
    }

    /* Transfer */

    const senderUpdated =
      await client.query(
        `UPDATE players
         SET balance =
           balance - $1
         WHERE telegram_id = $2
         RETURNING balance`,
        [
          amount,
          sender.telegram_id
        ]
      );

    const recipientUpdated =
      await client.query(
        `UPDATE players
         SET balance =
           balance + $1
         WHERE telegram_id = $2
         RETURNING balance`,
        [
          amount,
          recipient.telegram_id
        ]
      );

    const senderNewBalance =
      Number(
        senderUpdated.rows[0].balance
      );

    const recipientNewBalance =
      Number(
        recipientUpdated.rows[0].balance
      );

    await recordTransaction(
      client,
      sender.telegram_id,
      "GIFT_SENT",
      -amount,
      senderNewBalance,
      {
        recipientTelegramId:
          String(
            recipient.telegram_id
          ),

        recipientUsername:
          recipient.username
      }
    );

    await recordTransaction(
      client,
      recipient.telegram_id,
      "GIFT_RECEIVED",
      amount,
      recipientNewBalance,
      {
        senderTelegramId:
          String(
            sender.telegram_id
          ),

        senderUsername:
          sender.username
      }
    );

    await client.query(
      "COMMIT"
    );

    res.json({

      success: true,

      amount,

      recipient:
        recipient.username,

      balance:
        senderNewBalance

    });

  } catch (error) {

    if (client) {
      await client.query(
        "ROLLBACK"
      ).catch(() => {});
    }

    console.error(
      "Gift failed:",
      error.message
    );

    res.status(400).json({
      error: error.message
    });

  } finally {

    if (client) {
      client.release();
    }
  }
});

/* =========================================================
   FIND PLAYER FOR GIFTING
========================================================= */

app.get("/api/player/search", async (req, res) => {

  try {

    const initData =
      req.headers["x-telegram-init-data"];

    const user =
      verifyTelegram(initData);

    const username =
      String(
        req.query.username || ""
      )
        .trim()
        .replace(/^@/, "")
        .slice(0, 64);

    if (!username) {
      return res.status(400).json({
        error:
          "Username required."
      });
    }

    const result =
      await pool.query(
        `SELECT
          telegram_id,
          username,
          vip_level
         FROM players
         WHERE LOWER(username) = LOWER($1)
         LIMIT 1`,
        [username]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          "Player not found."
      });
    }

    const player =
      result.rows[0];

    if (
      String(player.telegram_id) ===
      String(user.id)
    ) {
      return res.status(400).json({
        error:
          "That is your own account."
      });
    }

    res.json({
      id:
        player.telegram_id,

      username:
        player.username,

      vipLevel:
        Number(player.vip_level)
    });

  } catch (error) {

    res.status(401).json({
      error:
        error.message
    });
  }
});

/* =========================================================
   2. VIP INFORMATION
========================================================= */

app.get("/api/vip", async (req, res) => {

  try {

    const player =
      await getPlayer(
        req.headers["x-telegram-init-data"]
      );

    const level =
      Number(player.vip_level);

    const wagered =
      Number(player.lifetime_wagered);

    const thresholds = [
      0,
      1000,
      2500,
      5000,
      10000,
      25000,
      50000,
      100000,
      250000,
      500000,
      1000000
    ];

    const nextThreshold =
      level < 10
        ? thresholds[level + 1]
        : null;

    res.json({

      vipLevel:
        level,

      lifetimeWagered:
        wagered,

      nextVipAt:
        nextThreshold,

      progress:
        nextThreshold
          ? Math.min(
              100,
              Math.floor(
                (
                  wagered /
                  nextThreshold
                ) * 100
              )
            )
          : 100,

      winMultiplier:
        vipMultiplier(level)

    });

  } catch (error) {

    res.status(401).json({
      error:
        error.message
    });
  }
});

/* =========================================================
   3. DAILY REWARD
========================================================= */

app.post("/api/daily", async (req, res) => {

  let client;

  try {

    const user =
      verifyTelegram(
        req.body?.initData
      );

    if (
      !rateLimit(
        `daily:${user.id}`,
        5,
        60000
      )
    ) {
      return res.status(429).json({
        error:
          "Too many attempts."
      });
    }

    client =
      await pool.connect();

    await client.query(
      "BEGIN"
    );

    const result =
      await client.query(
        `SELECT
          telegram_id,
          balance,
          daily_streak,
          last_daily_claim
         FROM players
         WHERE telegram_id = $1
         FOR UPDATE`,
        [user.id]
      );

    if (
      result.rows.length === 0
    ) {
      throw new Error(
        "Player not found."
      );
    }

    const player =
      result.rows[0];

    const now =
      new Date();

    const lastClaim =
      player.last_daily_claim
        ? new Date(
            player.last_daily_claim
          )
        : null;

    if (lastClaim) {

      const hours =
        (
          now.getTime() -
          lastClaim.getTime()
        ) / 3600000;

      if (hours < 24) {

        const remaining =
          Math.ceil(
            24 - hours
          );

        await client.query(
          "ROLLBACK"
        );

        return res.status(400).json({
          error:
            `Daily reward already claimed. Try again in about ${remaining} hour(s).`
        });
      }
    }

    let streak =
      Number(
        player.daily_streak || 0
      );

    if (lastClaim) {

      const difference =
        (
          now.getTime() -
          lastClaim.getTime()
        ) / 86400000;

      if (difference >= 48) {
        streak = 0;
      }
    }

    streak++;

    if (streak > 7) {
      streak = 1;
    }

    const rewards = {
      1: 300,
      2: 400,
      3: 500,
      4: 600,
      5: 750,
      6: 1000,
      7: 1500
    };

    const reward =
      rewards[streak];

    const updated =
      await client.query(
        `UPDATE players
         SET
           balance =
             balance + $1,

           daily_streak =
             $2,

           last_daily_claim =
             NOW()
         WHERE telegram_id = $3

         RETURNING balance`,
        [
          reward,
          streak,
          user.id
        ]
      );

    const newBalance =
      Number(
        updated.rows[0].balance
      );

    await recordTransaction(
      client,
      user.id,
      "DAILY_REWARD",
      reward,
      newBalance,
      {
        streak
      }
    );

    await client.query(
      "COMMIT"
    );

    res.json({

      success: true,

      reward,

      streak,

      balance:
        newBalance

    });

  } catch (error) {

    if (client) {
      await client.query(
        "ROLLBACK"
      ).catch(() => {});
    }

    console.error(
      "Daily reward failed:",
      error.message
    );

    res.status(400).json({
      error:
        error.message
    });

  } finally {

    if (client) {
      client.release();
    }
  }
});

/* =========================================================
   4. EXPANDED LEADERBOARDS
========================================================= */

app.get("/api/leaderboard", async (req, res) => {

  try {

    const type =
      String(
        req.query.type || "balance"
      );

    let orderBy;

    if (type === "wins") {

      orderBy =
        "lifetime_won DESC";

    } else if (
      type === "spins"
    ) {

      orderBy =
        "total_spins DESC";

    } else if (
      type === "vip"
    ) {

      orderBy =
        "vip_level DESC, lifetime_wagered DESC";

    } else if (
      type === "biggestWin"
    ) {

      orderBy =
        "biggest_win DESC";

    } else {

      orderBy =
        "balance DESC";
    }

    const result =
      await pool.query(`
        SELECT
          username,
          balance,
          vip_level,
          lifetime_won,
          lifetime_wagered,
          total_spins,
          biggest_win
        FROM players
        ORDER BY
          ${orderBy},
          created_at ASC
        LIMIT 20
      `);

    const players =
      result.rows.map(
        (player, index) => ({

          rank:
            index + 1,

          username:
            player.username ||
            "Anonymous Player",

          balance:
            Number(
              player.balance
            ),

          vipLevel:
            Number(
              player.vip_level
            ),

          lifetimeWon:
            Number(
              player.lifetime_won
            ),

          lifetimeWagered:
            Number(
              player.lifetime_wagered
            ),

          totalSpins:
            Number(
              player.total_spins
            ),

          biggestWin:
            Number(
              player.biggest_win
            )

        })
      );

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      type,
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
   5. JACKPOT
========================================================= */

app.get("/api/jackpot", async (req, res) => {

  try {

    const result =
      await pool.query(
        `SELECT
          jackpot
         FROM game_state
         WHERE id = 1`
      );

    res.json({

      jackpot:
        Number(
          result.rows[0]?.jackpot || 0
        )

    });

  } catch (error) {

    console.error(
      "Jackpot failed:",
      error.message
    );

    res.status(500).json({
      error:
        "Unable to load jackpot."
    });
  }
});

/* =========================================================
   6. TRANSACTION HISTORY
========================================================= */

app.get("/api/transactions", async (req, res) => {

  try {

    const initData =
      req.headers["x-telegram-init-data"];

    const user =
      verifyTelegram(initData);

    const result =
      await pool.query(
        `SELECT
          id,
          type,
          amount,
          balance_after,
          metadata,
          created_at
         FROM transactions
         WHERE telegram_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [user.id]
      );

    res.json({

      transactions:
        result.rows.map(
          transaction => ({

            id:
              transaction.id,

            type:
              transaction.type,

            amount:
              Number(
                transaction.amount
              ),

            balanceAfter:
              Number(
                transaction.balance_after
              ),

            metadata:
              transaction.metadata,

            createdAt:
              transaction.created_at

          })
        )

    });

  } catch (error) {

    res.status(401).json({
      error:
        error.message
    });
  }
});

/* =========================================================
   7. ADMIN AUTHENTICATION
========================================================= */

function verifyAdmin(initData) {

  const user =
    verifyTelegram(initData);

  if (
    !ADMIN_TELEGRAM_ID
  ) {
    throw new Error(
      "Admin account is not configured."
    );
  }

  if (
    String(user.id) !==
    String(ADMIN_TELEGRAM_ID)
  ) {
    throw new Error(
      "Administrator access denied."
    );
  }

  return user;
}

/* =========================================================
   ADMIN PLAYER LOOKUP
========================================================= */

app.get("/api/admin/player", async (req, res) => {

  try {

    verifyAdmin(
      req.headers["x-telegram-init-data"]
    );

    const username =
      String(
        req.query.username || ""
      )
        .trim()
        .replace(/^@/, "")
        .slice(0, 64);

    const result =
      await pool.query(
        `SELECT
          telegram_id,
          username,
          balance,
          vip_level,
          lifetime_wagered,
          lifetime_won,
          total_spins,
          biggest_win,
          daily_streak,
          created_at
         FROM players
         WHERE LOWER(username) = LOWER($1)
         LIMIT 1`,
        [username]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          "Player not found."
      });
    }

    const player =
      result.rows[0];

    res.json({

      id:
        player.telegram_id,

      username:
        player.username,

      balance:
        Number(player.balance),

      vipLevel:
        Number(player.vip_level),

      lifetimeWagered:
        Number(
          player.lifetime_wagered
        ),

      lifetimeWon:
        Number(
          player.lifetime_won
        ),

      totalSpins:
        Number(
          player.total_spins
        ),

      biggestWin:
        Number(
          player.biggest_win
        ),

      dailyStreak:
        Number(
          player.daily_streak
        ),

      createdAt:
        player.created_at

    });

  } catch (error) {

    res.status(403).json({
      error:
        error.message
    });
  }
});

/* =========================================================
   ADMIN ADD / REMOVE CHIPS
========================================================= */

app.post("/api/admin/adjust-balance", async (req, res) => {

  let client;

  try {

    const admin =
      verifyAdmin(
        req.body?.initData
      );

    const telegramId =
      String(
        req.body?.telegramId || ""
      );

    const amount =
      Number(
        req.body?.amount
      );

    if (
      !telegramId
    ) {
      return res.status(400).json({
        error:
          "Player ID is required."
      });
    }

    if (
      !Number.isSafeInteger(amount) ||
      amount === 0
    ) {
      return res.status(400).json({
        error:
          "Amount must be a non-zero whole number."
      });
    }

    client =
      await pool.connect();

    await client.query(
      "BEGIN"
    );

    const playerResult =
      await client.query(
        `SELECT
          telegram_id,
          balance
         FROM players
         WHERE telegram_id = $1
         FOR UPDATE`,
        [telegramId]
      );

    if (
      playerResult.rows.length === 0
    ) {
      throw new Error(
        "Player not found."
      );
    }

    const player =
      playerResult.rows[0];

    const currentBalance =
      Number(player.balance);

    const newBalance =
      currentBalance + amount;

    if (
      newBalance < 0
    ) {
      throw new Error(
        "Balance cannot become negative."
      );
    }

    const updated =
      await client.query(
        `UPDATE players
         SET balance = $1
         WHERE telegram_id = $2
         RETURNING balance`,
        [
          newBalance,
          telegramId
        ]
      );

    const finalBalance =
      Number(
        updated.rows[0].balance
      );

    await recordTransaction(
      client,
      telegramId,
      amount > 0
        ? "ADMIN_CREDIT"
        : "ADMIN_DEBIT",
      amount,
      finalBalance,
      {
        adminTelegramId:
          admin.id
      }
    );

    await client.query(
      "COMMIT"
    );

    res.json({

      success: true,

      telegramId,

      amount,

      balance:
        finalBalance

    });

  } catch (error) {

    if (client) {
      await client.query(
        "ROLLBACK"
      ).catch(() => {});
    }

    console.error(
      "Admin balance adjustment failed:",
      error.message
    );

    res.status(403).json({
      error:
        error.message
    });

  } finally {

    if (client) {
      client.release();
    }
  }
});

/* =========================================================
   ADMIN SET VIP
========================================================= */

app.post("/api/admin/set-vip", async (req, res) => {

  try {

    verifyAdmin(
      req.body?.initData
    );

    const telegramId =
      String(
        req.body?.telegramId || ""
      );

    const vipLevel =
      Number(
        req.body?.vipLevel
      );

    if (
      !telegramId ||
      !Number.isInteger(vipLevel) ||
      vipLevel < 0 ||
      vipLevel > 10
    ) {
      return res.status(400).json({
        error:
          "Invalid player or VIP level."
      });
    }

    const result =
      await pool.query(
        `UPDATE players
         SET vip_level = $1
         WHERE telegram_id = $2
         RETURNING
           telegram_id,
           username,
           vip_level`,
        [
          vipLevel,
          telegramId
        ]
      );

    if (
      result.rows.length === 0
    ) {
      return res.status(404).json({
        error:
          "Player not found."
      });
    }

    res.json({

      success: true,

      player:
        result.rows[0]

    });

  } catch (error) {

    res.status(403).json({
      error:
        error.message
    });
  }
});

/* =========================================================
   ADMIN VIEW TRANSACTIONS
========================================================= */

app.get("/api/admin/transactions", async (req, res) => {

  try {

    verifyAdmin(
      req.headers["x-telegram-init-data"]
    );

    const telegramId =
      String(
        req.query.telegramId || ""
      );

    const result =
      await pool.query(
        `SELECT
          id,
          telegram_id,
          type,
          amount,
          balance_after,
          metadata,
          created_at
         FROM transactions
         WHERE telegram_id = $1
         ORDER BY created_at DESC
         LIMIT 100`,
        [telegramId]
      );

    res.json({
      transactions:
        result.rows
    });

  } catch (error) {

    res.status(403).json({
      error:
        error.message
    });
  }
});

/* =========================================================
   FIVE-REEL SLOT
========================================================= */

app.post("/api/spin", async (req, res) => {

  let client;

  try {

    const user =
      verifyTelegram(
        req.body?.initData
      );

    if (
      !rateLimit(
        `spin:${user.id}`,
        30,
        60000
      )
    ) {
      return res.status(429).json({
        error:
          "Too many spins. Please slow down."
      });
    }

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

    client =
      await pool.connect();

    await client.query(
      "BEGIN"
    );

    /* -----------------------------------------------------
       LOCK PLAYER
    ----------------------------------------------------- */

    const playerResult =
      await client.query(
        `SELECT
          telegram_id,
          username,
          balance,
          vip_level,
          lifetime_wagered,
          lifetime_won,
          total_spins,
          biggest_win
         FROM players
         WHERE telegram_id = $1
         FOR UPDATE`,
        [user.id]
      );

    if (
      playerResult.rows.length === 0
    ) {
      throw new Error(
        "Player account not found."
      );
    }

    const player =
      playerResult.rows[0];

    const balance =
      Number(player.balance);

    if (
      balance < cost
    ) {

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
       PAYLINES
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
          index =>
            output[index]
        );

      const first =
        line[0];

      const allMatch =
        line.every(
          symbol =>
            symbol === first
        );

      /* FIVE OF A KIND */

      if (allMatch) {

        let payout;

        if (
          first === "7️⃣"
        ) {

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

      /* PARTIAL MATCHES */

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

      if (
        highest >= 4
      ) {

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
       VIP WIN BONUS
    ----------------------------------------------------- */

    const vip =
      Number(
        player.vip_level || 0
      );

    const multiplier =
      vipMultiplier(vip);

    if (
      win > 0
    ) {

      win =
        Math.floor(
          win * multiplier
        );
    }

    /* -----------------------------------------------------
       JACKPOT CONTRIBUTION
    ----------------------------------------------------- */

    const jackpotContribution =
      Math.max(
        1,
        Math.floor(
          cost * 0.02
        )
      );

    let jackpotWon = 0;

    /* -----------------------------------------------------
       JACKPOT TRIGGER
       Five 7s anywhere on the board
    ----------------------------------------------------- */

    const sevenCount =
      output.filter(
        symbol =>
          symbol === "7️⃣"
      ).length;

    if (
      sevenCount >= 5
    ) {

      const jackpotResult =
        await client.query(
          `SELECT
            jackpot
           FROM game_state
           WHERE id = 1
           FOR UPDATE`
        );

      jackpotWon =
        Number(
          jackpotResult
            .rows[0]
            .jackpot
        );

      win += jackpotWon;

      await client.query(
        `UPDATE game_state
         SET jackpot = 1000
         WHERE id = 1`
      );

    } else {

      await client.query(
        `UPDATE game_state
         SET jackpot =
           jackpot + $1
         WHERE id = 1`,
        [
          jackpotContribution
        ]
      );
    }

    /* -----------------------------------------------------
       UPDATE PLAYER
    ----------------------------------------------------- */

    const updated =
      await client.query(
        `UPDATE players
         SET
           balance =
             balance - $1 + $2,

           lifetime_wagered =
             lifetime_wagered + $1,

           lifetime_won =
             lifetime_won + $2,

           total_spins =
             total_spins + 1,

           biggest_win =
             GREATEST(
               biggest_win,
               $2
             ),

           vip_level =
             CASE

               WHEN lifetime_wagered + $1 >= 1000000 THEN 10
               WHEN lifetime_wagered + $1 >= 500000 THEN 9
               WHEN lifetime_wagered + $1 >= 250000 THEN 8
               WHEN lifetime_wagered + $1 >= 100000 THEN 7
               WHEN lifetime_wagered + $1 >= 50000 THEN 6
               WHEN lifetime_wagered + $1 >= 25000 THEN 5
               WHEN lifetime_wagered + $1 >= 10000 THEN 4
               WHEN lifetime_wagered + $1 >= 5000 THEN 3
               WHEN lifetime_wagered + $1 >= 2500 THEN 2
               WHEN lifetime_wagered + $1 >= 1000 THEN 1

               ELSE 0

             END

         WHERE telegram_id = $3

         RETURNING
           balance,
           vip_level,
           lifetime_wagered,
           lifetime_won,
           total_spins,
           biggest_win`,
        [
          cost,
          win,
          user.id
        ]
      );

    const updatedPlayer =
      updated.rows[0];

    const newBalance =
      Number(
        updatedPlayer.balance
      );

    /* -----------------------------------------------------
       RECORD SPIN TRANSACTION
    ----------------------------------------------------- */

    await recordTransaction(
      client,
      user.id,
      "SPIN",
      -cost,
      newBalance,
      {
        bet: cost,
        win,
        winningLines,
        jackpotContribution,
        jackpotWon
      }
    );

    if (
      win > 0
    ) {

      await recordTransaction(
        client,
        user.id,
        "SPIN_WIN",
        win,
        newBalance,
        {
          bet: cost,
          jackpotWon
        }
      );
    }

    if (
      jackpotWon > 0
    ) {

      await recordTransaction(
        client,
        user.id,
        "JACKPOT_WIN",
        jackpotWon,
        newBalance,
        {
          bet: cost
        }
      );
    }

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
        newBalance,

      vipLevel:
        Number(
          updatedPlayer.vip_level
        ),

      lifetimeWagered:
        Number(
          updatedPlayer
            .lifetime_wagered
        ),

      lifetimeWon:
        Number(
          updatedPlayer
            .lifetime_won
        ),

      totalSpins:
        Number(
          updatedPlayer
            .total_spins
        ),

      biggestWin:
        Number(
          updatedPlayer
            .biggest_win
        ),

      jackpotWon

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

  /* -------------------------------------------------------
     PLAYERS
  ------------------------------------------------------- */

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

  /* -------------------------------------------------------
     ADD NEW PLAYER COLUMNS
  ------------------------------------------------------- */

  await pool.query(`
    ALTER TABLE players
    ADD COLUMN IF NOT EXISTS
      lifetime_wagered BIGINT
      NOT NULL
      DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE players
    ADD COLUMN IF NOT EXISTS
      lifetime_won BIGINT
      NOT NULL
      DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE players
    ADD COLUMN IF NOT EXISTS
      total_spins BIGINT
      NOT NULL
      DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE players
    ADD COLUMN IF NOT EXISTS
      biggest_win BIGINT
      NOT NULL
      DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE players
    ADD COLUMN IF NOT EXISTS
      daily_streak INTEGER
      NOT NULL
      DEFAULT 0
  `);

  await pool.query(`
    ALTER TABLE players
    ADD COLUMN IF NOT EXISTS
      last_daily_claim TIMESTAMPTZ
  `);

  /* -------------------------------------------------------
     TRANSACTIONS
  ------------------------------------------------------- */

  await pool.query(`
    CREATE TABLE IF NOT EXISTS transactions (

      id BIGINT
        GENERATED ALWAYS AS IDENTITY
        PRIMARY KEY,

      telegram_id BIGINT
        NOT NULL,

      type TEXT
        NOT NULL,

      amount BIGINT
        NOT NULL,

      balance_after BIGINT
        NOT NULL,

      metadata JSONB
        NOT NULL
        DEFAULT '{}'::jsonb,

      created_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()
    )
  `);

  /* -------------------------------------------------------
     GAME STATE
  ------------------------------------------------------- */

  await pool.query(`
    CREATE TABLE IF NOT EXISTS game_state (

      id INTEGER
        PRIMARY KEY,

      jackpot BIGINT
        NOT NULL
        DEFAULT 1000,

      updated_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()
    )
  `);

  /* -------------------------------------------------------
     CREATE JACKPOT ROW
  ------------------------------------------------------- */

  await pool.query(`
    INSERT INTO game_state
      (
        id,
        jackpot
      )
    VALUES
      (
        1,
        1000
      )

    ON CONFLICT (id)
    DO NOTHING
  `);

  /* -------------------------------------------------------
     INDEXES
  ------------------------------------------------------- */

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
      players_username_idx
    ON players
      (LOWER(username))
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
      transactions_player_idx
    ON transactions
      (telegram_id, created_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
      players_balance_idx
    ON players
      (balance DESC)
  `);

  console.log(
    "KIMIA PRIVÉ database is ready."
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
