const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/* =========================================================
   GAME SETTINGS
========================================================= */

const BET_OPTIONS = [300, 600, 1500, 3000];
const DEFAULT_BET = 300;

const SYMBOLS = [
  "💎",
  "7️⃣",
  "💗",
  "🌹",
  "♠️",
  "✨"
];

/*
  Five reels x three rows = 15 positions.

  0  1  2  3  4
  5  6  7  8  9
  10 11 12 13 14
*/

const PAYLINES = [
  [0, 1, 2, 3, 4],       // Top
  [5, 6, 7, 8, 9],       // Middle
  [10, 11, 12, 13, 14],  // Bottom
  [0, 6, 12, 8, 4],      // V
  [10, 6, 2, 8, 14]      // Inverted V
];

const FIVE_MATCH_PAYOUTS = {
  "7️⃣": 15000,
  "💎": 7500,
  "💗": 4500,
  "🌹": 3000,
  "♠️": 3000,
  "✨": 3000
};

/* =========================================================
   REWARD SETTINGS
========================================================= */

const DEFAULT_REWARDS = [
  {
    slug: "discount_10",
    name: "10% OFF",
    description: "10% off an eligible PRIVÉ subscription.",
    cost: 5000,
    reward_type: "discount",
    reward_value: "10%"
  },
  {
    slug: "access_24h",
    name: "24-HOUR ACCESS",
    description: "Unlock a 24-hour PRIVÉ access reward.",
    cost: 10000,
    reward_type: "access",
    reward_value: "24 hours"
  },
  {
    slug: "discount_25",
    name: "25% OFF",
    description: "25% off an eligible subscription or content purchase.",
    cost: 25000,
    reward_type: "discount",
    reward_value: "25%"
  },
  {
    slug: "access_7d",
    name: "7-DAY PRIVÉ",
    description: "Unlock seven days of promotional PRIVÉ access.",
    cost: 50000,
    reward_type: "access",
    reward_value: "7 days"
  },
  {
    slug: "mystery_prive",
    name: "MYSTERY PRIVÉ",
    description: "A surprise reward from the current PRIVÉ collection.",
    cost: 75000,
    reward_type: "mystery",
    reward_value: "mystery"
  }
];

/* =========================================================
   DATABASE
========================================================= */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL
    ? { rejectUnauthorized: false }
    : false
});

/* =========================================================
   EXPRESS
========================================================= */

app.use(cors());
app.use(express.json({ limit: "20kb" }));

/* =========================================================
   BASIC ROUTES
========================================================= */

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
   TELEGRAM AUTHENTICATION
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

  const params = new URLSearchParams(initData);

  const receivedHash = params.get("hash");
  const authDate = Number(params.get("auth_date"));

  if (!receivedHash || !Number.isFinite(authDate)) {
    throw new Error(
      "Invalid Telegram login data."
    );
  }

  /*
    Don't accept stale Telegram sessions indefinitely.
  */

  if (
    Math.abs(Date.now() / 1000 - authDate) > 86400
  ) {
    throw new Error(
      "Telegram login expired. Reopen the game."
    );
  }

  /*
    Remove hash before generating the data-check string.
  */

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([key, value]) => `${key}=${value}`
    )
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
    `
    INSERT INTO players (
      telegram_id,
      username
    )
    VALUES ($1, $2)

    ON CONFLICT (telegram_id)
    DO UPDATE SET
      username = EXCLUDED.username

    RETURNING
      telegram_id,
      username,
      balance,
      vip_level
    `,
    [
      user.id,
      user.username
    ]
  );

  return result.rows[0];
}

/* =========================================================
   /API/ME
========================================================= */

app.post("/api/me", async (req, res) => {
  try {
    const player =
      await getPlayer(
        req.body?.initData
      );

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.json({
      id: player.telegram_id,
      username: player.username,
      balance: Number(player.balance),
      vipLevel: player.vip_level
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

app.get(
  "/api/leaderboard",
  async (req, res) => {

    try {

      const result =
        await pool.query(`
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
  }
);

/* =========================================================
   PAYOUT CALCULATION
========================================================= */

function calculatePayout(
  line,
  bet
) {

  const counts = {};

  for (const symbol of line) {
    counts[symbol] =
      (counts[symbol] || 0) + 1;
  }

  const bestCount =
    Math.max(
      ...Object.values(counts)
    );

  const winningSymbol =
    Object.keys(counts).find(
      symbol =>
        counts[symbol] === bestCount
    );

  const scale =
    bet / DEFAULT_BET;

  if (bestCount >= 5) {

    return Math.round(
      FIVE_MATCH_PAYOUTS[
        winningSymbol
      ] * scale
    );
  }

  if (bestCount === 4) {

    return Math.round(
      FIVE_MATCH_PAYOUTS[
        winningSymbol
      ] / 3 * scale
    );
  }

  if (bestCount === 3) {

    return Math.round(
      FIVE_MATCH_PAYOUTS[
        winningSymbol
      ] / 10 * scale
    );
  }

  if (bestCount === 2) {

    return Math.round(
      150 * scale
    );
  }

  return 0;
}

/* =========================================================
   SPIN
========================================================= */

app.post(
  "/api/spin",
  async (req, res) => {

    let client;
    let transactionOpen = false;

    try {

      const user =
        verifyTelegram(
          req.body?.initData
        );

      const bet =
        req.body?.bet === undefined
          ? DEFAULT_BET
          : req.body.bet;

      if (
        !Number.isSafeInteger(bet) ||
        !BET_OPTIONS.includes(bet)
      ) {

        return res.status(400).json({
          error:
            "Invalid bet. Choose 300, 600, 1500, or 3000 chips."
        });
      }

      client =
        await pool.connect();

      await client.query(
        "BEGIN"
      );

      transactionOpen = true;

      /*
        Lock the player's row.

        This prevents two simultaneous spins
        from spending the same balance.
      */

      const playerResult =
        await client.query(
          `
          INSERT INTO players (
            telegram_id,
            username
          )
          VALUES ($1, $2)

          ON CONFLICT (telegram_id)
          DO UPDATE SET
            username =
              EXCLUDED.username

          RETURNING
            telegram_id,
            username,
            balance,
            vip_level
          `,
          [
            user.id,
            user.username
          ]
        );

      const player =
        playerResult.rows[0];

      /*
        Lock existing player row.
      */

      const lockedResult =
        await client.query(
          `
          SELECT
            balance,
            vip_level
          FROM players
          WHERE telegram_id = $1
          FOR UPDATE
          `,
          [user.id]
        );

      const balance =
        Number(
          lockedResult.rows[0].balance
        );

      if (balance < bet) {

        await client.query(
          "ROLLBACK"
        );

        transactionOpen = false;

        return res.status(400).json({
          error:
            "Not enough chips for this bet.",

          balance,

          bet
        });
      }

      /*
        Generate 5 x 3 = 15 symbols.
      */

      const output =
        Array.from(
          { length: 15 },
          () =>
            SYMBOLS[
              crypto.randomInt(
                SYMBOLS.length
              )
            ]
        );

      let win = 0;

      const winningLines = [];

      for (
        let i = 0;
        i < PAYLINES.length;
        i++
      ) {

        const line =
          PAYLINES[i].map(
            index =>
              output[index]
          );

        const payout =
          calculatePayout(
            line,
            bet
          );

        if (payout > 0) {

          win += payout;

          winningLines.push(i);
        }
      }

      /*
        Update balance.
      */

      const updated =
        await client.query(
          `
          UPDATE players
          SET balance =
            balance - $1 + $2
          WHERE telegram_id = $3

          RETURNING balance
          `,
          [
            bet,
            win,
            user.id
          ]
        );

      /*
        Record the spin in the transaction ledger.
      */

      await client.query(
        `
        INSERT INTO coin_transactions (
          telegram_id,
          transaction_type,
          amount,
          balance_before,
          balance_after,
          description,
          metadata
        )
        VALUES (
          $1,
          'spin',
          $2,
          $3,
          $4,
          $5,
          $6
        )
        `,
        [
          user.id,

          win - bet,

          balance,

          Number(
            updated.rows[0].balance
          ),

          win > 0
            ? `Spin: -${bet} bet, +${win} win`
            : `Spin: -${bet} bet`,

          JSON.stringify({
            bet,
            win,
            symbols: output,
            winningLines
          })
        ]
      );

      await client.query(
        "COMMIT"
      );

      transactionOpen = false;

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({

        symbols: output,

        bet,

        win,

        winningLines,

        balance:
          Number(
            updated.rows[0].balance
          ),

        reels: 5,

        rows: 3
      });

    } catch (error) {

      if (
        client &&
        transactionOpen
      ) {

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
  }
);

/* =========================================================
   REWARDS — GET AVAILABLE REWARDS
========================================================= */

app.get(
  "/api/rewards",
  async (req, res) => {

    try {

      const result =
        await pool.query(
          `
          SELECT
            id,
            slug,
            name,
            description,
            cost,
            reward_type,
            reward_value,
            active
          FROM rewards
          WHERE active = TRUE
          ORDER BY cost ASC
          `
        );

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({
        rewards:
          result.rows.map(
            reward => ({
              id: reward.id,
              slug: reward.slug,
              name: reward.name,
              description:
                reward.description,
              cost:
                Number(reward.cost),
              rewardType:
                reward.reward_type,
              rewardValue:
                reward.reward_value
            })
          )
      });

    } catch (error) {

      console.error(
        "Rewards failed:",
        error.message
      );

      res.status(500).json({
        error:
          "Unable to load rewards."
      });
    }
  }
);

/* =========================================================
   REWARD REDEMPTION
========================================================= */

app.post(
  "/api/rewards/redeem",
  async (req, res) => {

    let client;
    let transactionOpen = false;

    try {

      const user =
        verifyTelegram(
          req.body?.initData
        );

      const requestedReward =
        String(
          req.body?.reward || ""
        ).trim();

      const requestedCost =
        Number(
          req.body?.cost
        );

      if (
        !requestedReward
      ) {

        return res.status(400).json({
          error:
            "Reward is required."
        });
      }

      if (
        !Number.isSafeInteger(
          requestedCost
        ) ||
        requestedCost <= 0
      ) {

        return res.status(400).json({
          error:
            "Invalid reward cost."
        });
      }

      client =
        await pool.connect();

      await client.query(
        "BEGIN"
      );

      transactionOpen = true;

      /*
        Find the reward on the SERVER.

        We never trust the cost sent by the browser.
      */

      const rewardResult =
        await client.query(
          `
          SELECT
            id,
            slug,
            name,
            description,
            cost,
            reward_type,
            reward_value
          FROM rewards
          WHERE active = TRUE
            AND (
              slug = $1
              OR LOWER(name) =
                 LOWER($1)
            )
          LIMIT 1
          `,
          [requestedReward]
        );

      if (
        rewardResult.rows.length === 0
      ) {

        await client.query(
          "ROLLBACK"
        );

        transactionOpen = false;

        return res.status(404).json({
          error:
            "Reward not found."
        });
      }

      const reward =
        rewardResult.rows[0];

      const cost =
        Number(reward.cost);

      /*
        Lock player balance.
      */

      const playerResult =
        await client.query(
          `
          SELECT
            balance,
            vip_level
          FROM players
          WHERE telegram_id = $1
          FOR UPDATE
          `,
          [user.id]
        );

      if (
        playerResult.rows.length === 0
      ) {

        throw new Error(
          "Player account not found."
        );
      }

      const balance =
        Number(
          playerResult.rows[0].balance
        );

      if (balance < cost) {

        await client.query(
          "ROLLBACK"
        );

        transactionOpen = false;

        return res.status(400).json({
          error:
            "Not enough PRIVÉ coins.",
          balance,
          required: cost
        });
      }

      /*
        Generate a unique redemption code.
      */

      const code =
        "PRIVE-" +
        crypto
          .randomBytes(6)
          .toString("hex")
          .toUpperCase();

      const updated =
        await client.query(
          `
          UPDATE players
          SET balance =
            balance - $1
          WHERE telegram_id = $2

          RETURNING balance
          `,
          [
            cost,
            user.id
          ]
        );

      /*
        Create redemption.
      */

      const redemptionResult =
        await client.query(
          `
          INSERT INTO reward_redemptions (
            telegram_id,
            reward_id,
            code,
            cost,
            status
          )
          VALUES (
            $1,
            $2,
            $3,
            $4,
            'active'
          )
          RETURNING
            id,
            code,
            created_at
          `,
          [
            user.id,
            reward.id,
            code,
            cost
          ]
        );

      /*
        Record coin movement.
      */

      await client.query(
        `
        INSERT INTO coin_transactions (
          telegram_id,
          transaction_type,
          amount,
          balance_before,
          balance_after,
          description,
          metadata
        )
        VALUES (
          $1,
          'reward_redeem',
          $2,
          $3,
          $4,
          $5,
          $6
        )
        `,
        [
          user.id,

          -cost,

          balance,

          Number(
            updated.rows[0].balance
          ),

          `Redeemed ${reward.name}`,

          JSON.stringify({
            rewardId: reward.id,
            rewardSlug:
              reward.slug,
            rewardType:
              reward.reward_type,
            code
          })
        ]
      );

      await client.query(
        "COMMIT"
      );

      transactionOpen = false;

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({

        success: true,

        reward: {
          name: reward.name,
          description:
            reward.description,
          rewardType:
            reward.reward_type,
          rewardValue:
            reward.reward_value
        },

        code,

        cost,

        balance:
          Number(
            updated.rows[0].balance
          ),

        redemptionId:
          redemptionResult.rows[0].id
      });

    } catch (error) {

      if (
        client &&
        transactionOpen
      ) {

        await client.query(
          "ROLLBACK"
        ).catch(() => {});
      }

      console.error(
        "Reward redemption failed:",
        error.message
      );

      res.status(500).json({
        error:
          "Unable to redeem reward. Please try again."
      });

    } finally {

      if (client) {
        client.release();
      }
    }
  }
);

/* =========================================================
   GIFT COINS
========================================================= */

app.post(
  "/api/gift",
  async (req, res) => {

    let client;
    let transactionOpen = false;

    try {

      const sender =
        verifyTelegram(
          req.body?.initData
        );

      let recipient =
        String(
          req.body?.recipient || ""
        )
        .trim()
        .replace(/^@/, "");

      const amount =
        Number(
          req.body?.amount
        );

      /*
        Basic validation.
      */

      if (
        !recipient ||
        recipient.length > 64
      ) {

        return res.status(400).json({
          error:
            "Enter a valid Telegram username."
        });
      }

      if (
        !Number.isSafeInteger(amount) ||
        amount <= 0
      ) {

        return res.status(400).json({
          error:
            "Enter a valid coin amount."
        });
      }

      /*
        Safety limit for one gift.
        This can later be made configurable.
      */

      const MAX_GIFT =
        1000000;

      if (
        amount > MAX_GIFT
      ) {

        return res.status(400).json({
          error:
            "That gift amount is too large."
        });
      }

      /*
        Don't allow obvious invalid usernames.
      */

      if (
        !/^[A-Za-z0-9_]{3,64}$/.test(
          recipient
        )
      ) {

        return res.status(400).json({
          error:
            "Invalid Telegram username."
        });
      }

      client =
        await pool.connect();

      await client.query(
        "BEGIN"
      );

      transactionOpen = true;

      /*
        Find recipient.

        Telegram usernames are stored without @.
      */

      const recipientResult =
        await client.query(
          `
          SELECT
            telegram_id,
            username,
            balance
          FROM players
          WHERE LOWER(username) =
                LOWER($1)
          LIMIT 1
          `,
          [recipient]
        );

      if (
        recipientResult.rows.length === 0
      ) {

        await client.query(
          "ROLLBACK"
        );

        transactionOpen = false;

        return res.status(404).json({
          error:
            "That player has not joined KIMIA PRIVÉ yet."
        });
      }

      const recipientPlayer =
        recipientResult.rows[0];

      if (
        String(
          recipientPlayer.telegram_id
        ) === String(sender.id)
      ) {

        await client.query(
          "ROLLBACK"
        );

        transactionOpen = false;

        return res.status(400).json({
          error:
            "You cannot gift coins to yourself."
        });
      }

      /*
        Lock both accounts.

        Sorting IDs makes concurrent transfers
        much less likely to deadlock.
      */

      const ids = [
        String(sender.id),
        String(
          recipientPlayer.telegram_id
        )
      ].sort();

      await client.query(
        `
        SELECT telegram_id
        FROM players
        WHERE telegram_id = ANY($1::bigint[])
        ORDER BY telegram_id
        FOR UPDATE
        `,
        [ids]
      );

      /*
        Get sender's current balance after locking.
      */

      const senderResult =
        await client.query(
          `
          SELECT
            balance,
            username
          FROM players
          WHERE telegram_id = $1
          FOR UPDATE
          `,
          [sender.id]
        );

      if (
        senderResult.rows.length === 0
      ) {

        throw new Error(
          "Sender account not found."
        );
      }

      const senderBalance =
        Number(
          senderResult.rows[0].balance
        );

      if (
        senderBalance < amount
      ) {

        await client.query(
          "ROLLBACK"
        );

        transactionOpen = false;

        return res.status(400).json({
          error:
            "Not enough PRIVÉ coins.",
          balance:
            senderBalance,
          amount
        });
      }

      /*
        Subtract from sender.
      */

      const senderUpdated =
        await client.query(
          `
          UPDATE players
          SET balance =
            balance - $1
          WHERE telegram_id = $2

          RETURNING balance
          `,
          [
            amount,
            sender.id
          ]
        );

      /*
        Add to recipient.
      */

      const recipientUpdated =
        await client.query(
          `
          UPDATE players
          SET balance =
            balance + $1
          WHERE telegram_id = $2

          RETURNING balance
          `,
          [
            amount,
            recipientPlayer.telegram_id
          ]
        );

      const newSenderBalance =
        Number(
          senderUpdated.rows[0].balance
        );

      const newRecipientBalance =
        Number(
          recipientUpdated.rows[0].balance
        );

      /*
        Record sender transaction.
      */

      await client.query(
        `
        INSERT INTO coin_transactions (
          telegram_id,
          transaction_type,
          amount,
          balance_before,
          balance_after,
          description,
          metadata
        )
        VALUES (
          $1,
          'gift_sent',
          $2,
          $3,
          $4,
          $5,
          $6
        )
        `,
        [
          sender.id,

          -amount,

          senderBalance,

          newSenderBalance,

          `Gift sent to @${recipient}`,

          JSON.stringify({
            recipientTelegramId:
              String(
                recipientPlayer.telegram_id
              ),
            recipientUsername:
              recipient,
            amount
          })
        ]
      );

      /*
        Record recipient transaction.
      */

      await client.query(
        `
        INSERT INTO coin_transactions (
          telegram_id,
          transaction_type,
          amount,
          balance_before,
          balance_after,
          description,
          metadata
        )
        VALUES (
          $1,
          'gift_received',
          $2,
          $3,
          $4,
          $5,
          $6
        )
        `,
        [
          recipientPlayer.telegram_id,

          amount,

          Number(
            recipientPlayer.balance
          ),

          newRecipientBalance,

          `Gift received from @${sender.username || "player"}`,

          JSON.stringify({
            senderTelegramId:
              String(sender.id),
            senderUsername:
              sender.username,
            amount
          })
        ]
      );

      await client.query(
        "COMMIT"
      );

      transactionOpen = false;

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({

        success: true,

        amount,

        recipient: {
          username:
            recipientPlayer.username
        },

        balance:
          newSenderBalance
      });

    } catch (error) {

      if (
        client &&
        transactionOpen
      ) {

        await client.query(
          "ROLLBACK"
        ).catch(() => {});
      }

      console.error(
        "Gift failed:",
        error.message
      );

      res.status(500).json({
        error:
          "Unable to send gift. Please try again."
      });

    } finally {

      if (client) {
        client.release();
      }
    }
  }
);

/* =========================================================
   TRANSACTION HISTORY
========================================================= */

app.post(
  "/api/transactions",
  async (req, res) => {

    try {

      const user =
        verifyTelegram(
          req.body?.initData
        );

      const result =
        await pool.query(
          `
          SELECT
            id,
            transaction_type,
            amount,
            balance_before,
            balance_after,
            description,
            created_at
          FROM coin_transactions
          WHERE telegram_id = $1
          ORDER BY created_at DESC
          LIMIT 50
          `,
          [user.id]
        );

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({
        transactions:
          result.rows.map(
            transaction => ({
              id: transaction.id,

              type:
                transaction.transaction_type,

              amount:
                Number(
                  transaction.amount
                ),

              balanceBefore:
                Number(
                  transaction.balance_before
                ),

              balanceAfter:
                Number(
                  transaction.balance_after
                ),

              description:
                transaction.description,

              createdAt:
                transaction.created_at
            })
          )
      });

    } catch (error) {

      console.error(
        "Transaction history failed:",
        error.message
      );

      res.status(401).json({
        error:
          "Unable to load transaction history."
      });
    }
  }
);

/* =========================================================
   MY REDEMPTIONS
========================================================= */

app.post(
  "/api/rewards/my-redemptions",
  async (req, res) => {

    try {

      const user =
        verifyTelegram(
          req.body?.initData
        );

      const result =
        await pool.query(
          `
          SELECT
            rr.id,
            rr.code,
            rr.cost,
            rr.status,
            rr.created_at,
            r.name,
            r.description,
            r.reward_type,
            r.reward_value
          FROM reward_redemptions rr
          JOIN rewards r
            ON r.id = rr.reward_id
          WHERE rr.telegram_id = $1
          ORDER BY rr.created_at DESC
          LIMIT 50
          `,
          [user.id]
        );

      res.set(
        "Cache-Control",
        "no-store"
      );

      res.json({
        redemptions:
          result.rows.map(
            redemption => ({
              id: redemption.id,

              code:
                redemption.code,

              cost:
                Number(
                  redemption.cost
                ),

              status:
                redemption.status,

              name:
                redemption.name,

              description:
                redemption.description,

              rewardType:
                redemption.reward_type,

              rewardValue:
                redemption.reward_value,

              createdAt:
                redemption.created_at
            })
          )
      });

    } catch (error) {

      console.error(
        "Redemption history failed:",
        error.message
      );

      res.status(401).json({
        error:
          "Unable to load redemption history."
      });
    }
  }
);

/* =========================================================
   ADMIN-STYLE REWARD SEEDING
========================================================= */

async function seedRewards() {

  for (
    const reward of DEFAULT_REWARDS
  ) {

    await pool.query(
      `
      INSERT INTO rewards (
        slug,
        name,
        description,
        cost,
        reward_type,
        reward_value,
        active
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        TRUE
      )

      ON CONFLICT (slug)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        cost = EXCLUDED.cost,
        reward_type = EXCLUDED.reward_type,
        reward_value = EXCLUDED.reward_value
      `,
      [
        reward.slug,
        reward.name,
        reward.description,
        reward.cost,
        reward.reward_type,
        reward.reward_value
      ]
    );
  }

  console.log(
    "PRIVÉ rewards are ready."
  );
}

/* =========================================================
   DATABASE INITIALIZATION
========================================================= */

async function initializeDatabase() {

  /*
    IMPORTANT:

    This does NOT delete or recreate players.

    Existing player balances remain intact.
  */

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

  /*
    Rewards catalog.
  */

  await pool.query(`
    CREATE TABLE IF NOT EXISTS rewards (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

      slug TEXT UNIQUE NOT NULL,

      name TEXT NOT NULL,

      description TEXT NOT NULL,

      cost BIGINT NOT NULL,

      reward_type TEXT NOT NULL,

      reward_value TEXT,

      active BOOLEAN NOT NULL DEFAULT TRUE,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  /*
    Every coin movement gets a ledger entry.

    Positive amount = coins received.

    Negative amount = coins spent.
  */

  await pool.query(`
    CREATE TABLE IF NOT EXISTS coin_transactions (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

      telegram_id BIGINT NOT NULL,

      transaction_type TEXT NOT NULL,

      amount BIGINT NOT NULL,

      balance_before BIGINT NOT NULL,

      balance_after BIGINT NOT NULL,

      description TEXT,

      metadata JSONB,

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  /*
    Reward redemptions.

    Each redemption receives a unique code.
  */

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reward_redemptions (
      id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

      telegram_id BIGINT NOT NULL,

      reward_id BIGINT NOT NULL
        REFERENCES rewards(id),

      code TEXT UNIQUE NOT NULL,

      cost BIGINT NOT NULL,

      status TEXT NOT NULL DEFAULT 'active',

      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

      redeemed_at TIMESTAMPTZ
    )
  `);

  /*
    Helpful indexes.
  */

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
    idx_coin_transactions_player
    ON coin_transactions(telegram_id, created_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
    idx_reward_redemptions_player
    ON reward_redemptions(telegram_id, created_at DESC)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
    idx_players_username
    ON players(username)
  `);

  await seedRewards();

  console.log(
    "Players table is ready."
  );

  console.log(
    "Coin transaction ledger is ready."
  );

  console.log(
    "Reward redemption system is ready."
  );

  console.log(
    "Gift coin system is ready."
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
