const fs = require("fs");
const path = require("path");
const express = require("express");
const Database = require("better-sqlite3");

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "leaderboard.db");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

const defaultCategories = [
  { id: "overall", name: "Overall", icon: "\uD83C\uDFC6" },
  { id: "vanilla", name: "Vanilla", icon: "\u2B21" },
  { id: "uhc", name: "UHC", icon: "\u2665" },
  { id: "pot", name: "Pot", icon: "\u2697" },
  { id: "smp", name: "SMP", icon: "\u25C9" }
];

const seedPlayers = [
  {
    category: "overall",
    name: "Marlowww",
    region: "NA",
    rank: "Combat Grandmaster",
    points: 450,
    avatar: "https://mc-heads.net/avatar/Marlowww/128",
    tiers: [["Sword", "HT1"], ["Axe", "HT1"], ["Pot", "HT1"], ["SMP", "LT1"]]
  },
  {
    category: "overall",
    name: "ItzRealMe",
    region: "NA",
    rank: "Combat Master",
    points: 330,
    avatar: "https://mc-heads.net/avatar/ItzRealMe/128",
    tiers: [["Sword", "HT3"], ["Vanilla", "HT1"], ["SMP", "HT1"], ["Pot", "LT2"]]
  },
  {
    category: "overall",
    name: "coldified",
    region: "EU",
    rank: "Combat Master",
    points: 296,
    avatar: "https://mc-heads.net/avatar/coldified/128",
    tiers: [["UHC", "LT1"], ["Sword", "LT1"], ["Axe", "LT1"], ["Pot", "HT2"]]
  },
  {
    category: "overall",
    name: "Swight",
    region: "NA",
    rank: "Combat Master",
    points: 290,
    avatar: "https://mc-heads.net/avatar/Swight/128",
    tiers: [["UHC", "HT1"], ["Axe", "HT1"], ["SMP", "LT2"], ["Vanilla", "HT3"]]
  },
  {
    category: "overall",
    name: "janekv",
    region: "EU",
    rank: "Combat Ace",
    points: 230,
    avatar: "https://mc-heads.net/avatar/janekv/128",
    tiers: [["SMP", "LT1"], ["Sword", "LT2"], ["Axe", "LT2"], ["UHC", "HT3"]]
  },
  {
    category: "vanilla",
    name: "ShardOnTop",
    region: "EU",
    rank: "Vanilla Elite",
    points: 390,
    avatar: "https://mc-heads.net/avatar/Alex/128",
    tiers: [["Vanilla", "HT1"], ["Sword", "HT2"], ["Pot", "LT1"]]
  },
  {
    category: "uhc",
    name: "HeartBurst",
    region: "NA",
    rank: "UHC Titan",
    points: 365,
    avatar: "https://mc-heads.net/avatar/Herobrine/128",
    tiers: [["UHC", "HT1"], ["Sword", "LT1"], ["Axe", "LT1"]]
  },
  {
    category: "pot",
    name: "SplashSet",
    region: "AS",
    rank: "Potion Expert",
    points: 280,
    avatar: "https://mc-heads.net/avatar/Notch/128",
    tiers: [["Pot", "HT1"], ["SMP", "LT2"]]
  },
  {
    category: "smp",
    name: "EnderVale",
    region: "SA",
    rank: "SMP Strategist",
    points: 310,
    avatar: "https://mc-heads.net/avatar/Zombie/128",
    tiers: [["SMP", "HT1"], ["Vanilla", "LT2"], ["UHC", "LT2"]]
  }
];

const dummyNameParts = {
  prefixes: [
    "Shadow", "Iron", "Nova", "Echo", "Silent", "Frost", "Rapid", "Ghost", "Blaze", "Storm",
    "Night", "Solar", "Crimson", "Pixel", "Turbo", "Aqua", "Vortex", "Omega", "Lunar", "Rogue"
  ],
  suffixes: [
    "Strike", "Runner", "Knight", "Wolf", "Spark", "Flare", "Dash", "Hunter", "Blade", "Core",
    "Pulse", "Shift", "Burst", "Scope", "Cipher", "Rider", "Hawk", "Point", "Drop", "Forge"
  ]
};

const dummyRanks = [
  "Combat Grandmaster",
  "Combat Master",
  "Combat Ace",
  "Ranked Elite",
  "Queue Specialist",
  "Season Contender"
];

const dummyRegions = ["NA", "EU", "AS", "SA"];
const dummyTierSets = [
  [["Sword", "HT1"], ["Axe", "HT2"], ["Pot", "LT1"], ["SMP", "LT2"]],
  [["Vanilla", "HT1"], ["Sword", "LT1"], ["UHC", "HT2"], ["Pot", "LT2"]],
  [["SMP", "HT1"], ["Vanilla", "LT2"], ["Axe", "HT3"], ["UHC", "LT1"]],
  [["Pot", "HT1"], ["Sword", "HT2"], ["Axe", "LT2"], ["SMP", "LT1"]],
  [["UHC", "HT1"], ["Vanilla", "HT2"], ["Sword", "LT2"], ["Pot", "LT1"]]
];

function generateDummyPlayers(existingNames, countNeeded) {
  const generated = [];
  const categories = getCategories();
  let seed = 0;

  while (generated.length < countNeeded) {
    const prefix = dummyNameParts.prefixes[seed % dummyNameParts.prefixes.length];
    const suffix = dummyNameParts.suffixes[Math.floor(seed / dummyNameParts.prefixes.length) % dummyNameParts.suffixes.length];
    const candidateName = `${prefix}${suffix}${100 + seed}`;

    if (!existingNames.has(candidateName)) {
      const category = categories[seed % categories.length].id;
      const region = dummyRegions[seed % dummyRegions.length];
      const rank = dummyRanks[seed % dummyRanks.length];
      const tierSet = dummyTierSets[seed % dummyTierSets.length];
      const categoryOffset = seed % categories.length;
      const tierOffset = Math.floor(seed / categories.length);

      generated.push({
        category,
        name: candidateName,
        region,
        rank,
        points: Math.max(40, 420 - categoryOffset * 18 - tierOffset * 7),
        avatar: `https://mc-heads.net/avatar/${candidateName}/128`,
        tiers: tierSet
      });
      existingNames.add(candidateName);
    }

    seed += 1;
  }

  return generated;
}

function insertPlayers(players) {
  if (!players.length) {
    return;
  }

  const insert = db.prepare(`
    INSERT INTO players (category, name, region, rank_title, points, avatar, tiers_json)
    VALUES (@category, @name, @region, @rank, @points, @avatar, @tiersJson)
  `);

  const transaction = db.transaction((items) => {
    for (const player of items) {
      insert.run({
        ...player,
        tiersJson: JSON.stringify(player.tiers)
      });
    }
  });

  transaction(players);
}

function ensureMinimumPlayers(targetCount) {
  const existingNames = new Set(
    db.prepare("SELECT name FROM players").all().map((row) => row.name)
  );
  const currentCount = existingNames.size;

  if (currentCount >= targetCount) {
    return;
  }

  insertPlayers(generateDummyPlayers(existingNames, targetCount - currentCount));
}

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      region TEXT NOT NULL,
      rank_title TEXT NOT NULL,
      points INTEGER NOT NULL CHECK(points >= 0),
      avatar TEXT,
      tiers_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const categoryCount = db.prepare("SELECT COUNT(*) AS count FROM categories").get().count;

  if (categoryCount === 0) {
    const insertCategory = db.prepare(`
      INSERT INTO categories (id, name, icon)
      VALUES (@id, @name, @icon)
    `);
    const transaction = db.transaction((items) => {
      items.forEach((category) => insertCategory.run(category));
    });
    transaction(defaultCategories);
  }

  const count = db.prepare("SELECT COUNT(*) AS count FROM players").get().count;

  if (count === 0) {
    insertPlayers(seedPlayers);
  }

  ensureMinimumPlayers(100);
}

function getCategories() {
  return db.prepare(`
    SELECT id, name, icon
    FROM categories
    ORDER BY created_at ASC, name ASC
  `).all();
}

function categoryExists(categoryId) {
  return Boolean(
    db.prepare("SELECT 1 FROM categories WHERE id = ?").get(categoryId)
  );
}

function isProtectedCategory(categoryId) {
  return categoryId === "overall";
}

function slugifyCategoryName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function parseTiers(tiers) {
  if (!Array.isArray(tiers)) {
    return [];
  }

  return tiers
    .filter((item) => Array.isArray(item) && item.length >= 2)
    .map(([skill, tier]) => [String(skill).trim(), String(tier).trim()])
    .filter(([skill, tier]) => skill && tier);
}

function mapRow(row) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    region: row.region,
    rank: row.rank_title,
    points: row.points,
    avatar: row.avatar,
    tiers: parseTiers(JSON.parse(row.tiers_json))
  };
}

initializeDatabase();

app.use(express.json());
app.use(express.static(__dirname));

app.get("/api/categories", (_req, res) => {
  res.json(getCategories());
});

app.get("/api/leaderboard", (req, res) => {
  const category = req.query.category ? String(req.query.category) : null;

  const rows = category
    ? db.prepare(`
        SELECT * FROM players
        WHERE category = ?
        ORDER BY points DESC, created_at ASC
      `).all(category)
    : db.prepare(`
        SELECT * FROM players
        ORDER BY category ASC, points DESC, created_at ASC
      `).all();

  const payload = rows.map(mapRow);
  res.json(payload);
});

app.post("/api/players", (req, res) => {
  const body = req.body ?? {};
  const category = String(body.category || "").trim().toLowerCase();
  const name = String(body.name || "").trim();
  const region = String(body.region || "").trim().toUpperCase();
  const rank = String(body.rank || "").trim();
  const points = Number(body.points);
  const avatar = String(body.avatar || "").trim();
  const tiers = parseTiers(body.tiers);

  if (!categoryExists(category)) {
    return res.status(400).json({ error: "Invalid category." });
  }

  if (!name || !region || !rank || !Number.isFinite(points) || points < 0) {
    return res.status(400).json({ error: "Missing or invalid player fields." });
  }

  const insert = db.prepare(`
    INSERT INTO players (category, name, region, rank_title, points, avatar, tiers_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(
    category,
    name,
    region,
    rank,
    Math.round(points),
    avatar,
    JSON.stringify(tiers)
  );

  const created = db.prepare("SELECT * FROM players WHERE id = ?").get(result.lastInsertRowid);
  return res.status(201).json(mapRow(created));
});

app.post("/api/categories", (req, res) => {
  const body = req.body ?? {};
  const name = String(body.name || "").trim();
  const icon = String(body.icon || "").trim() || "\u2726";
  const suggestedId = slugifyCategoryName(name);

  if (!name || !suggestedId) {
    return res.status(400).json({ error: "Category name is required." });
  }

  if (categoryExists(suggestedId)) {
    return res.status(400).json({ error: "A category with that name already exists." });
  }

  db.prepare(`
    INSERT INTO categories (id, name, icon)
    VALUES (?, ?, ?)
  `).run(suggestedId, name, icon);

  const created = db.prepare(`
    SELECT id, name, icon
    FROM categories
    WHERE id = ?
  `).get(suggestedId);

  return res.status(201).json(created);
});

app.delete("/api/categories/:id", (req, res) => {
  const categoryId = String(req.params.id || "").trim().toLowerCase();

  if (!categoryExists(categoryId)) {
    return res.status(404).json({ error: "Category not found." });
  }

  if (isProtectedCategory(categoryId)) {
    return res.status(400).json({ error: "The overall category cannot be removed." });
  }

  const removeCategory = db.prepare("DELETE FROM categories WHERE id = ?");
  const removePlayers = db.prepare("DELETE FROM players WHERE category = ?");

  const transaction = db.transaction((id) => {
    removePlayers.run(id);
    removeCategory.run(id);
  });

  transaction(categoryId);

  return res.json({ success: true, id: categoryId });
});

app.listen(PORT, () => {
  console.log(`Leaderboard server running at http://192.168.1.4:${PORT}`);
});
