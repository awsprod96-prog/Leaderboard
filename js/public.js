import {
  categories,
  defaultAvatar,
  buildTierMarkup,
  loadCategory,
  openPlayerModal,
  refreshCategories
} from "./shared.js";

const rankIconImg = `<img class="top-rank-icon" src="asset/1.png" alt="Top Rank" width="24" height="24">`;
const rankIconRegularImg = `<img class="top-rank-icon" src="asset/2-removebg-preview.png" alt="Rank Icon" width="24" height="24">`;

const leaderboardData = {};
const modeTabs = document.getElementById("modeTabs");
const leaderboardRows = document.getElementById("leaderboardRows");
const searchInput = document.getElementById("searchInput");

let activeCategory = "overall";
let visibleEntries = [];

function createTabs() {
  modeTabs.innerHTML = "";

  categories.forEach((category) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = `mode-tab${category.id === activeCategory ? " is-active" : ""}`;
    tab.innerHTML = `
      <span class="tab-icon">${category.icon}</span>
      <span class="tab-name">${category.name}</span>
    `;

    tab.addEventListener("click", async () => {
      await setActiveCategory(category.id);
    });

    modeTabs.appendChild(tab);
  });
}

function renderLeaderboard() {
  const query = searchInput.value.trim().toLowerCase();
  const entries = (leaderboardData[activeCategory] ?? []).filter((entry) =>
    entry.name.toLowerCase().includes(query)
  );
  visibleEntries = entries;

  if (!entries.length) {
    leaderboardRows.innerHTML = '<div class="empty-state">No players found for this category.</div>';
    return;
  }

  leaderboardRows.innerHTML = entries
    .map((entry, index) => `
      <article class="board-row board-row-clickable" data-entry-id="${entry.id}" tabindex="0" role="button" aria-label="View ${entry.name} details" style="animation-delay: ${index * 0.05}s">
        <div class="position-badge${index < 3 ? ` top-${index + 1}` : ""}">${index + 1}.</div>
        <div class="player-cell">
          <img class="avatar" src="${entry.avatar || defaultAvatar}" alt="${entry.name} avatar" onerror="this.src='${defaultAvatar}'">
          <div>
            <h2 class="player-name">${entry.name}</h2>
            <div class="player-rank">
              ${index < 3 ? rankIconImg : rankIconRegularImg}
              <span><strong>${entry.rank}</strong> (${entry.points} points)</span>
            </div>
          </div>
        </div>
        <div class="region-pill region-${entry.region.toLowerCase()}">${entry.region}</div>
        <div class="tiers-cell">${buildTierMarkup(entry.tiers)}</div>
      </article>
    `)
    .join("");
}

async function setActiveCategory(category) {
  activeCategory = category;
  createTabs();
  leaderboardRows.innerHTML = '<div class="empty-state">Loading leaderboard...</div>';

  try {
    leaderboardData[category] = await loadCategory(category);
    renderLeaderboard();
  } catch (_error) {
    leaderboardRows.innerHTML = '<div class="empty-state">Unable to load leaderboard data.</div>';
  }
}

leaderboardRows.addEventListener("click", (event) => {
  const row = event.target.closest(".board-row-clickable");
  if (!row) {
    return;
  }

  const player = visibleEntries.find((entry) => entry.id === Number(row.dataset.entryId));
  const position = visibleEntries.findIndex((entry) => entry.id === Number(row.dataset.entryId)) + 1;

  if (player) {
    openPlayerModal(player, { category: activeCategory, position });
  }
});

leaderboardRows.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const row = event.target.closest(".board-row-clickable");
  if (!row) {
    return;
  }

  event.preventDefault();
  row.click();
});

searchInput.addEventListener("input", renderLeaderboard);

async function initialize() {
  await refreshCategories();
  activeCategory = categories[0]?.id ?? "overall";
  await setActiveCategory(activeCategory);
}

initialize();
