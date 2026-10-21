const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_TELEGRAM_ID = process.env.ADMIN_TELEGRAM_ID || "";

const STARTING_BALANCE = 12480;
const DAILY_BONUS = 1000;
const JACKPOT_START = 1248730;

const BETS = [300, 600, 1500, 3000];

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL ? { rejectUnauthorized: false } : false
});

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   DEMO STORAGE
   Used if DATABASE_URL is temporarily unavailable.
   PostgreSQL is still the production storage.
========================================================= */

const demoUsers = new Map();
let demoJackpot = JACKPOT_START;

/* =========================================================
   SLOT SYMBOLS
========================================================= */

const SYMBOLS = [
  {
    id: "kp",
    weight: 15,
    payouts: { 3: 8, 4: 25, 5: 100 }
  },
  {
    id: "crown",
    weight: 14,
    payouts: { 3: 10, 4: 30, 5: 120 }
  },
  {
    id: "bell",
    weight: 16,
    payouts: { 3: 12, 4: 35, 5: 150 }
  },
  {
    id: "cherry",
    weight: 18,
    payouts: { 3: 15, 4: 45, 5: 180 }
  },
  {
    id: "diamond",
    weight: 10,
    payouts: { 3: 20, 4: 60, 5: 250 }
  },
  {
    id: "heart",
    weight: 12,
    payouts: { 3: 25, 4: 75, 5: 300 }
  },
  {
    id: "seven",
    weight: 15,
    payouts: { 3: 30, 4: 100, 5: 500 }
  }
];

/* =========================================================
   FIVE PAYLINES
========================================================= */

const PAYLINES = [
  [0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2]
];

/* =========================================================
   RANDOM SYMBOL
========================================================= */

function weightedSymbol() {
  const total = SYMBOLS.reduce((sum, symbol) => {
    return sum + symbol.weight;
  }, 0);

  let random = crypto.randomInt(0, total);

  for (const symbol of SYMBOLS) {
    if (random < symbol.weight) {
      return symbol.id;
    }

    random -= symbol.weight;
  }

  return SYMBOLS[0].id;
}

/* =========================================================
   CREATE 5 x 3 REELS
========================================================= */

function makeReels() {
  return Array.from(
    { length: 5 },
    () =>
      Array.from(
        { length: 3 },
        () => weightedSymbol()
      )
  );
}

/* =========================================================
   FIND SYMBOL
========================================================= */

function symbolById(id) {
  return (
    SYMBOLS.find(symbol => symbol.id === id) ||
    SYMBOLS[0]
  );
}

/* =========================================================
   CALCULATE WIN
========================================================= */

function evaluate(reels, bet) {
  let totalWin = 0;

  const winningLines = [];
  const wins = [];

  for (let lineIndex = 0; lineIndex < PAYLINES.length; lineIndex++) {
    const line = PAYLINES[lineIndex];

    const sequence = line.map((row, column) => {
      return reels[column][row];
    });

    const firstSymbol = sequence[0];

    let count = 1;

    for (let i = 1; i < sequence.length; i++) {
      if (sequence[i] === firstSymbol) {
        count++;
      } else {
        break;
      }
    }

    if (count >= 3) {
      const symbol = symbolById(firstSymbol);

      const multiplier =
        symbol.payouts[count] || 0;

      const amount = Math.floor(
        bet * multiplier / 100
      );

      if (amount > 0) {
        totalWin += amount;

        winningLines.push(lineIndex);

        wins.push({
          line: lineIndex + 1,
          symbol: firstSymbol,
          count,
          amount
        });
      }
    }
  }

  /* -----------------------------------------
     DIAMOND SCATTER BONUS
  ----------------------------------------- */

  const diamondCount = reels
    .flat()
    .filter(symbol => symbol === "diamond")
    .length;

  if (diamondCount >= 3) {
    let multiplier = 1;

    if (diamondCount === 4) {
      multiplier = 3;
    }

    if (diamondCount >= 5) {
      multiplier = 10;
    }

    const scatterWin = bet * multiplier;

    totalWin += scatterWin;

    wins.push({
      line: 0,
      symbol: "diamond",
      count: diamondCount,
      amount: scatterWin,
      scatter: true
    });
  }

  return {
    totalWin,
    winningLines,
    wins
  };
}

/* =========================================================
   TELEGRAM INIT DATA VALIDATION
========================================================= */

function telegramUserFromInitData(initData) {
  if (!initData || !BOT_TOKEN) {
    return null;
  }

  const params = new URLSearchParams(initData);

  const hash = params.get("hash");

  if (!hash) {
    return null;
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

  if (
    expectedHash.length !== hash.length ||
    !crypto.timingSafeEqual(
      Buffer.from(expectedHash),
      Buffer.from(hash)
    )
  ) {
    return null;
  }

  const authDate =
    Number(params.get("auth_date")) || 0;

  const age =
    Math.floor(Date.now() / 1000) - authDate;

  if (!authDate || age > 86400) {
    return null;
  }

  let user = null;

  try {
    user = JSON.parse(
      params.get("user") || "null"
    );
  } catch (error) {
    user = null;
  }

  return user;
}

/* =========================================================
   DATABASE
========================================================= */

async function ensureSchema() {
  if (!DATABASE_URL) {
    console.warn(
      "DATABASE_URL not configured. Running demo storage."
    );

    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS kimia_users (
      telegram_id BIGINT PRIMARY KEY,

      username TEXT,
      first_name TEXT,
      last_name TEXT,

      balance BIGINT NOT NULL DEFAULT ${STARTING_BALANCE},

      vip_level INTEGER NOT NULL DEFAULT 3,

      vip_progress INTEGER NOT NULL DEFAULT 42,

      total_won BIGINT NOT NULL DEFAULT 0,

      total_spins BIGINT NOT NULL DEFAULT 0,

      last_bonus_at TIMESTAMPTZ,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS kimia_spins (
      id BIGSERIAL PRIMARY KEY,

      telegram_id BIGINT NOT NULL
        REFERENCES kimia_users(telegram_id)
        ON DELETE CASCADE,

      bet BIGINT NOT NULL,

      win BIGINT NOT NULL,

      reels JSONB NOT NULL,

      winning_lines JSONB NOT NULL,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS kimia_settings (
      key TEXT PRIMARY KEY,

      value BIGINT NOT NULL
    );

    INSERT INTO kimia_settings(key, value)
    VALUES ('jackpot', ${JACKPOT_START})

    ON CONFLICT (key)
    DO NOTHING;
  `);
}

/* =========================================================
   CREATE / GET USER
========================================================= */

async function getOrCreateUser(tgUser) {
  if (!DATABASE_URL) {
    const key = String(tgUser.id);

    if (!demoUsers.has(key)) {
      demoUsers.set(key, {
        telegram_id: tgUser.id,
        username: tgUser.username || "",
        first_name:
          tgUser.first_name || "Guest",
        last_name:
          tgUser.last_name || "",
        balance: STARTING_BALANCE,
        vip_level: 3,
        vip_progress: 42,
        total_won: 0,
        total_spins: 0,
        last_bonus_at: null
      });
    }

    return demoUsers.get(key);
  }

  const result = await pool.query(
    `
    INSERT INTO kimia_users(
      telegram_id,
      username,
      first_name,
      last_name
    )

    VALUES($1,$2,$3,$4)

    ON CONFLICT (telegram_id)

    DO UPDATE SET
      username = EXCLUDED.username,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      updated_at = NOW()

    RETURNING *
    `,
    [
      tgUser.id,
      tgUser.username || "",
      tgUser.first_name || "Guest",
      tgUser.last_name || ""
    ]
  );

  return result.rows[0];
}

/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

async function auth(req, res, next) {
  try {
    const initData =
      req.header("X-Telegram-Init-Data") ||
      req.body?.initData ||
      "";

    let tgUser =
      telegramUserFromInitData(initData);

    /*
      Browser testing mode.

      Set ALLOW_DEMO=false in production if you
      don't want browser/demo authentication.
    */

    if (
      !tgUser &&
      process.env.ALLOW_DEMO !== "false"
    ) {
      tgUser = {
        id: 999999999,
        username: "demo",
        first_name: "Kimia",
        last_name: ""
      };
    }

    if (!tgUser?.id) {
      return res.status(401).json({
        ok: false,
        error: "LOGIN FAILED · REOPEN GAME"
      });
    }

    req.tgUser = tgUser;

    req.player =
      await getOrCreateUser(tgUser);

    next();

  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      error: "AUTH ERROR"
    });
  }
}

/* =========================================================
   PUBLIC USER
========================================================= */

function publicUser(row) {
  return {
    id: String(row.telegram_id),

    username: row.username || "",

    name:
      row.first_name ||
      row.username ||
      "Guest",

    balance: Number(row.balance),

    vipLevel:
      Number(row.vip_level),

    vipProgress:
      Number(row.vip_progress),

    totalWon:
      Number(row.total_won),

    totalSpins:
      Number(row.total_spins),

    lastBonusAt:
      row.last_bonus_at
  };
}

/* =========================================================
   GAME STATE
========================================================= */

async function stateFor(player) {
  if (!DATABASE_URL) {
    return {
      user: publicUser(player),

      jackpot: demoJackpot,

      leaderboard: [
        {
          rank: 1,
          name: "GoddessSK",
          balance: 2984500
        },
        {
          rank: 2,
          name: "PrettyRich",
          balance: 1865320
        },
        {
          rank: 3,
          name: "LuhBae",
          balance: 1432910
        },
        {
          rank: 4,
          name: "BossBabe",
          balance: 1021600
        },
        {
          rank: 5,
          name: "Mami",
          balance: 876230
        }
      ]
    };
  }

  const [
    userQuery,
    jackpotQuery,
    leaderboardQuery
  ] = await Promise.all([

    pool.query(
      `
      SELECT *
      FROM kimia_users
      WHERE telegram_id=$1
      `,
      [player.telegram_id]
    ),

    pool.query(
      `
      SELECT value
      FROM kimia_settings
      WHERE key='jackpot'
      `
    ),

    pool.query(`
      SELECT
        first_name,
        username,
        balance

      FROM kimia_users

      ORDER BY balance DESC

      LIMIT 5
    `)
  ]);

  return {
    user:
      publicUser(userQuery.rows[0]),

    jackpot:
      Number(
        jackpotQuery.rows[0]?.value ||
        JACKPOT_START
      ),

    leaderboard:
      leaderboardQuery.rows.map(
        (row, index) => ({
          rank: index + 1,

          name:
            row.first_name ||
            row.username ||
            "Player",

          balance:
            Number(row.balance)
        })
      )
  };
}

/* =========================================================
   HEALTH
========================================================= */

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      ok: true,
      game: "KIMIA PRIVÉ"
    });
  }
);

/* =========================================================
   GET GAME STATE
========================================================= */

app.get(
  "/api/state",
  auth,
  async (req, res) => {
    try {
      const state =
        await stateFor(req.player);

      res.json({
        ok: true,
        ...state
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        ok: false,
        error: "STATE ERROR"
      });
    }
  }
);

/* =========================================================
   DAILY BONUS
========================================================= */

app.post(
  "/api/bonus",
  auth,
  async (req, res) => {
    try {

      /* DEMO MODE */

      if (!DATABASE_URL) {
        const player = req.player;

        const now = Date.now();

        const last =
          player.last_bonus_at
            ? new Date(
                player.last_bonus_at
              ).getTime()
            : 0;

        if (
          last &&
          now - last <
            24 * 60 * 60 * 1000
        ) {
          return res.json({
            ok: true,
            claimed: false,
            ...await stateFor(player)
          });
        }

        player.balance +=
          DAILY_BONUS;

        player.last_bonus_at =
          new Date();

        return res.json({
          ok: true,
          claimed: true,
          amount: DAILY_BONUS,
          ...await stateFor(player)
        });
      }

      /* POSTGRES MODE */

      const client =
        await pool.connect();

      try {
        await client.query(
          "BEGIN"
        );

        const query =
          await client.query(
            `
            SELECT *
            FROM kimia_users

            WHERE telegram_id=$1

            FOR UPDATE
            `,
            [req.player.telegram_id]
          );

        const user =
          query.rows[0];

        const now =
          Date.now();

        const last =
          user.last_bonus_at
            ? new Date(
                user.last_bonus_at
              ).getTime()
            : 0;

        if (
          last &&
          now - last <
            24 * 60 * 60 * 1000
        ) {
          const remaining =
            86400000 -
            (now - last);

          await client.query(
            "ROLLBACK"
          );

          return res.json({
            ok: true,
            claimed: false,
            remainingMs: remaining,
            ...await stateFor(user)
          });
        }

        await client.query(
          `
          UPDATE kimia_users

          SET
            balance = balance + $1,
            last_bonus_at = NOW(),
            updated_at = NOW()

          WHERE telegram_id=$2
          `,
          [
            DAILY_BONUS,
            req.player.telegram_id
          ]
        );

        await client.query(
          "COMMIT"
        );

        const fresh =
          (
            await pool.query(
              `
              SELECT *
              FROM kimia_users
              WHERE telegram_id=$1
              `,
              [req.player.telegram_id]
            )
          ).rows[0];

        res.json({
          ok: true,
          claimed: true,
          amount: DAILY_BONUS,
          ...await stateFor(fresh)
        });

      } catch (error) {

        await client.query(
          "ROLLBACK"
        );

        throw error;

      } finally {

        client.release();
      }

    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        error: "BONUS ERROR"
      });
    }
  }
);

/* =========================================================
   SPIN
========================================================= */

app.post(
  "/api/spin",
  auth,
  async (req, res) => {

    const bet =
      Number(req.body?.bet);

    if (!BETS.includes(bet)) {
      return res.status(400).json({
        ok: false,
        error: "INVALID BET"
      });
    }

    try {

      const reels =
        makeReels();

      const result =
        evaluate(reels, bet);

      /* =========================================
         DEMO MODE
      ========================================= */

      if (!DATABASE_URL) {

        const player =
          req.player;

        if (
          Number(player.balance) < bet
        ) {
          return res.status(400).json({
            ok: false,
            error: "NOT ENOUGH CHIPS"
          });
        }

        player.balance =
          Number(player.balance) -
          bet +
          result.totalWin;

        player.totalSpins += 1;

        player.total_won =
          Number(player.total_won || 0) +
          result.totalWin;

        demoJackpot +=
          Math.floor(bet * 0.03);

        /* FIVE DIAMONDS = JACKPOT */

        const fiveDiamonds =
          reels
            .flat()
            .filter(
              symbol =>
                symbol === "diamond"
            ).length >= 5;

        if (fiveDiamonds) {

          result.totalWin +=
            demoJackpot;

          player.balance +=
            demoJackpot;

          demoJackpot =
            JACKPOT_START;
        }

        return res.json({
          ok: true,
          reels,
          ...result,
          balance:
            player.balance,
          jackpot:
            demoJackpot
        });
      }

      /* =========================================
         POSTGRES MODE
      ========================================= */

      const client =
        await pool.connect();

      try {

        await client.query(
          "BEGIN"
        );

        const userQuery =
          await client.query(
            `
            SELECT *
            FROM kimia_users

            WHERE telegram_id=$1

            FOR UPDATE
            `,
            [req.player.telegram_id]
          );

        const user =
          userQuery.rows[0];

        if (
          Number(user.balance) <
          bet
        ) {
          await client.query(
            "ROLLBACK"
          );

          return res.status(400).json({
            ok: false,
            error: "NOT ENOUGH CHIPS",
            balance:
              Number(user.balance)
          });
        }

        const jackpotQuery =
          await client.query(
            `
            SELECT value
            FROM kimia_settings

            WHERE key='jackpot'

            FOR UPDATE
            `
          );

        let jackpot =
          Number(
            jackpotQuery.rows[0]?.value ||
            JACKPOT_START
          );

        jackpot +=
          Math.floor(
            bet * 0.03
          );

        /* FIVE DIAMONDS */

        const fiveDiamonds =
          reels
            .flat()
            .filter(
              symbol =>
                symbol === "diamond"
            ).length >= 5;

        if (fiveDiamonds) {

          result.totalWin +=
            jackpot;

          jackpot =
            JACKPOT_START;
        }

        const newBalance =
          Number(user.balance) -
          bet +
          result.totalWin;

        let vipProgress =
          Number(user.vip_progress) +
          Math.max(
            1,
            Math.floor(bet / 300)
          );

        let vipLevel =
          Number(user.vip_level);

        if (vipProgress >= 100) {
          vipLevel++;
          vipProgress = 0;
        }

        await client.query(
          `
          UPDATE kimia_users

          SET
            balance=$1,
            total_won=
              total_won+$2,
            total_spins=
              total_spins+1,
            vip_progress=$3,
            vip_level=$4,
            updated_at=NOW()

          WHERE telegram_id=$5
          `,
          [
            newBalance,
            result.totalWin,
            vipProgress,
            vipLevel,
            req.player.telegram_id
          ]
        );

        await client.query(
          `
          INSERT INTO kimia_spins(
            telegram_id,
            bet,
            win,
            reels,
            winning_lines
          )

          VALUES(
            $1,
            $2,
            $3,
            $4,
            $5
          )
          `,
          [
            req.player.telegram_id,
            bet,
            result.totalWin,
            JSON.stringify(reels),
            JSON.stringify(
              result.winningLines
            )
          ]
        );

        await client.query(
          `
          UPDATE kimia_settings

          SET value=$1

          WHERE key='jackpot'
          `,
          [jackpot]
        );

        await client.query(
          "COMMIT"
        );

        res.json({
          ok: true,

          reels,

          ...result,

          jackpot,

          balance:
            newBalance,

          vipLevel,

          vipProgress
        });

      } catch (error) {

        await client.query(
          "ROLLBACK"
        );

        throw error;

      } finally {

        client.release();
      }

    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        error: "SPIN ERROR"
      });
    }
  }
);

/* =========================================================
   SPIN HISTORY
========================================================= */

app.get(
  "/api/history",
  auth,
  async (req, res) => {

    if (!DATABASE_URL) {
      return res.json({
        ok: true,
        spins: []
      });
    }

    try {

      const query =
        await pool.query(
          `
          SELECT
            id,
            bet,
            win,
            reels,
            winning_lines,
            created_at

          FROM kimia_spins

          WHERE telegram_id=$1

          ORDER BY id DESC

          LIMIT 20
          `,
          [req.player.telegram_id]
        );

      res.json({
        ok: true,
        spins:
          query.rows
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        ok: false,
        error: "HISTORY ERROR"
      });
    }
  }
);

/* =========================================================
   SERVE INDEX.HTML
========================================================= */

app.get("*", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "index.html"
    )
  );
});

/* =========================================================
   START
========================================================= */

ensureSchema()
  .then(() => {

    app.listen(
      PORT,
      () => {
        console.log(
          `KIMIA PRIVÉ running on port ${PORT}`
        );
      }
    );

  })
  .catch(error => {

    console.error(
      "Database initialization failed:",
      error
    );

    process.exit(1);
  });
