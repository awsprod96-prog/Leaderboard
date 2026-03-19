import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const categories = [];
export const categoryIconOptions = [
  { value: "\uD83C\uDFC6", label: "Trophy" },
  { value: "\u2B21", label: "Hex" },
  { value: "\u2665", label: "Heart" },
  { value: "\u2697", label: "Potion" },
  { value: "\u25C9", label: "Orb" },
  { value: "\u2694", label: "Swords" },
  { value: "\uD83E\uDE93", label: "Axe" },
  { value: "\uD83D\uDEE1", label: "Shield" },
  { value: "\u2728", label: "Sparkles" },
  { value: "\u2605", label: "Star" }
];

export const defaultAvatar = "https://mc-heads.net/avatar/Steve/128";
const SUPABASE_URL = "https://yafosraqihgmxrcljlzw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZm9zcmFxaWhnbXhyY2xqbHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MDgxNzAsImV4cCI6MjA4OTQ4NDE3MH0.aYX3PnUZnVEGeptkUknRlrj9aNJ4vJ1oGmUa1tB1WTw";
const regionLabels = {
  NA: "North America",
  EU: "Europe",
  AS: "Asia",
  SA: "South America"
};
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const skillIcons = {
  Overall: "\uD83C\uDFC6",
  Vanilla: "\u2B21",
  UHC: "\u2665",
  Pot: "\u2697",
  SMP: "\u25C9",
  Sword: "\u2694",
  Axe: "\uD83E\uDE93"
};

export function buildTierMarkup(tiers) {
  return tiers
    .map(([skill, tier]) => {
      const icon = skillIcons[skill] ?? "\u2726";
      return `
        <span class="tier-chip">
          <span class="tier-skill">${icon}</span>
          <span class="tier-value">${tier}</span>
        </span>
      `;
    })
    .join("");
}

export function parseTiers(rawValue) {
  return rawValue
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [skill, tier] = item.split(":").map((part) => part.trim());
      return [skill || "Overall", tier || "LT1"];
    });
}

function slugifyCategoryName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function mapPlayer(row) {
  return {
    id: row.id,
    category: row.category,
    name: row.name,
    region: row.region,
    rank: row.rank_title,
    points: row.points,
    avatar: row.avatar,
    tiers: Array.isArray(row.tiers_json) ? row.tiers_json : []
  };
}

export async function loadCategory(category) {
  const { data, error } = await supabase
    .from("players")
    .select("*")
    .eq("category", category)
    .order("points", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Unable to load leaderboard data.");
  }

  return (data ?? []).map(mapPlayer);
}

export async function createPlayer(payload) {
  const { data, error } = await supabase
    .from("players")
    .insert({
      category: payload.category,
      name: payload.name,
      region: payload.region,
      rank_title: payload.rank,
      points: Math.round(payload.points),
      avatar: payload.avatar,
      tiers_json: payload.tiers
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message || "Unable to save player.");
  }

  return mapPlayer(data);
}

export async function refreshCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, icon, created_at")
    .order("created_at", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load categories.");
  }

  const items = data ?? [];
  categories.splice(0, categories.length, ...items);
  return categories;
}

export async function createCategory(payload) {
  const name = payload.name.trim();
  const categoryId = slugifyCategoryName(name);

  if (!name || !categoryId) {
    throw new Error("Category name is required.");
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      id: categoryId,
      name,
      icon: payload.icon || "\u2726"
    })
    .select("id, name, icon, created_at")
    .single();

  if (error) {
    throw new Error(error.message || "Unable to save category.");
  }

  return data;
}

export async function deleteCategory(categoryId) {
  if (categoryId === "overall") {
    throw new Error("The overall category cannot be removed.");
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    throw new Error(error.message || "Unable to delete category.");
  }

  return { success: true, id: categoryId };
}

export function getCategoryName(categoryId) {
  return categories.find((category) => category.id === categoryId)?.name ?? categoryId;
}

export function getRegionLabel(regionCode) {
  return regionLabels[regionCode] ?? regionCode;
}

export function ensurePlayerModal() {
  let overlay = document.getElementById("playerModal");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "playerModal";
    overlay.className = "player-modal";
    overlay.innerHTML = `
      <div class="player-modal-backdrop" data-close-modal="true"></div>
      <section class="player-modal-card" role="dialog" aria-modal="true" aria-labelledby="playerModalName">
        <button class="player-modal-close" type="button" aria-label="Close" data-close-modal="true">x</button>
        <div class="player-modal-content"></div>
      </section>
    `;

    overlay.addEventListener("click", (event) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.dataset.closeModal === "true") {
        overlay.classList.remove("is-open");
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        overlay.classList.remove("is-open");
      }
    });

    document.body.appendChild(overlay);
  }

  return overlay;
}

export function openPlayerModal(player, options) {
  const overlay = ensurePlayerModal();
  const content = overlay.querySelector(".player-modal-content");
  const positionBadgeClass = options.position <= 3 ? ` top-${options.position}` : "";
  const nameMcUrl = `https://namemc.com/search?q=${encodeURIComponent(player.name)}`;

  content.innerHTML = `
    <div class="player-modal-header">
      <img class="player-modal-avatar" src="${player.avatar || defaultAvatar}" alt="${player.name} avatar" onerror="this.src='${defaultAvatar}'">
      <h2 id="playerModalName" class="player-modal-name">${player.name}</h2>
      <div class="player-modal-rank">
        ${options.position <= 3 ? '<img class="top-rank-icon" src="asset/1.png" alt="Top Rank" width="24" height="24">' : '<img class="top-rank-icon" src="asset/2-removebg-preview.png" alt="Rank Icon" width="24" height="24">'}
        <span>${player.rank}</span>
      </div>
      <p class="player-modal-region">${getRegionLabel(player.region)}</p>
      <a class="player-modal-link" href="${nameMcUrl}" target="_blank" rel="noreferrer">NameMC</a>
    </div>

    <div class="player-modal-section">
      <p class="player-modal-label">Position</p>
      <div class="player-modal-position-card">
        <div class="position-badge${positionBadgeClass}">${options.position}.</div>
        <div class="player-modal-position-copy">
          <strong>${getCategoryName(options.category).toUpperCase()}</strong>
          <span>(${player.points} points)</span>
        </div>
      </div>
    </div>

    <div class="player-modal-section">
      <p class="player-modal-label">Tiers</p>
      <div class="player-modal-tiers">
        ${buildTierMarkup(player.tiers)}
      </div>
    </div>
  `;

  overlay.classList.add("is-open");
}
