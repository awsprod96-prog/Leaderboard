import {
  categories,
  categoryIconOptions,
  defaultAvatar,
  buildTierMarkup,
  parseTiers,
  loadCategory,
  createPlayer,
  deletePlayer,
  getCategoryName,
  openPlayerModal,
  refreshCategories,
  refreshIconOptions,
  createCategory,
  deleteCategory
} from "./shared.js";

const rankIconImg = `<img class="top-rank-icon" src="asset/1.png" alt="Top Rank" width="24" height="24">`;
const rankIconRegularImg = `<img class="top-rank-icon" src="asset/2-removebg-preview.png" alt="Rank Icon" width="24" height="24">`;

const leaderboardData = {};
const modeTabs = document.getElementById("modeTabs");
const leaderboardRows = document.getElementById("leaderboardRows");
const searchInput = document.getElementById("searchInput");
const categoryForm = document.getElementById("categoryForm");
const categoryIcon = document.getElementById("categoryIcon");
const deleteCategoryBtn = document.getElementById("deleteCategoryBtn");
const playerForm = document.getElementById("playerForm");
const playerCategory = document.getElementById("playerCategory");

let activeCategory = "overall";
let adminTable;
let visibleEntries = [];

async function removePlayerFromActiveCategory(player) {
  const shouldDelete = window.confirm(
    `Delete "${player.name}" from ${getCategoryName(activeCategory)}?`
  );

  if (!shouldDelete) {
    return;
  }

  try {
    await deletePlayer(player.id);
    leaderboardData[activeCategory] = (leaderboardData[activeCategory] ?? [])
      .filter((entry) => entry.id !== player.id);
    renderLeaderboard();
    await syncAdminTable();
    document.getElementById("playerModal")?.classList.remove("is-open");
  } catch (error) {
    window.alert(error.message);
  }
}

function createTabs() {
  modeTabs.innerHTML = "";
  playerCategory.innerHTML = "";

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

    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    option.selected = category.id === activeCategory;
    playerCategory.appendChild(option);
  });

  deleteCategoryBtn.disabled = activeCategory === "overall";
}

function populateCategoryIconOptions() {
  categoryIcon.innerHTML = "";

  categoryIconOptions.forEach((option) => {
    const item = document.createElement("option");
    item.value = option.value;
    item.textContent = `${option.value} ${option.label}`;
    categoryIcon.appendChild(item);
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

function initAdminTable() {
  adminTable = new Tabulator("#adminTable", {
    layout: "fitColumns",
    reactiveData: false,
    placeholder: "No players in this category",
    index: "id",
    initialSort: [{ column: "points", dir: "desc" }],
    columns: [
      {
        title: "#",
        formatter: "rownum",
        width: 70,
        hozAlign: "center",
        headerHozAlign: "center"
      },
      {
        title: "Player",
        field: "name",
        minWidth: 220,
        formatter: (cell) => {
          const row = cell.getRow().getData();
          const avatar = row.avatar || defaultAvatar;
          return `
            <div class="admin-player">
              <img src="${avatar}" alt="${row.name} avatar" onerror="this.src='${defaultAvatar}'">
              <strong>${row.name}</strong>
            </div>
          `;
        }
      },
      {
        title: "Region",
        field: "region",
        width: 90,
        hozAlign: "center",
        headerHozAlign: "center"
      },
      {
        title: "Points",
        field: "points",
        width: 90,
        sorter: "number",
        hozAlign: "center",
        headerHozAlign: "center"
      },
      {
        title: "Rank",
        field: "rank",
        minWidth: 160
      }
    ]
  });
}

async function syncAdminTable() {
  if (!adminTable) {
    return;
  }

  await adminTable.replaceData(leaderboardData[activeCategory] ?? []);
  adminTable.setSort([{ column: "points", dir: "desc" }]);
}

async function setActiveCategory(category) {
  activeCategory = category;
  createTabs();
  playerCategory.value = activeCategory;
  leaderboardRows.innerHTML = '<div class="empty-state">Loading leaderboard...</div>';

  try {
    leaderboardData[category] = await loadCategory(category);
    renderLeaderboard();
    await syncAdminTable();
  } catch (_error) {
    leaderboardRows.innerHTML = '<div class="empty-state">Unable to load leaderboard data.</div>';
  }
}

categoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(categoryForm);

  try {
    const created = await createCategory({
      name: formData.get("categoryName").toString().trim(),
      icon: formData.get("categoryIcon").toString().trim()
    });

    categoryForm.reset();
    await refreshCategories();
    leaderboardData[created.id] = [];
    await setActiveCategory(created.id);
  } catch (error) {
    window.alert(error.message);
  }
});

deleteCategoryBtn.addEventListener("click", async () => {
  if (!activeCategory || activeCategory === "overall") {
    window.alert("The overall category cannot be removed.");
    return;
  }

  const currentCategory = categories.find((category) => category.id === activeCategory);
  const shouldDelete = window.confirm(
    `Delete "${currentCategory?.name ?? activeCategory}" and all players in it?`
  );

  if (!shouldDelete) {
    return;
  }

  try {
    await deleteCategory(activeCategory);
    delete leaderboardData[activeCategory];
    await refreshCategories();
    activeCategory = categories[0]?.id ?? "overall";
    await setActiveCategory(activeCategory);
  } catch (error) {
    window.alert(error.message);
  }
});

playerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(playerForm);

  try {
    await createPlayer({
      category: formData.get("playerCategory").toString(),
      name: formData.get("playerName").toString().trim(),
      region: formData.get("playerRegion").toString().trim().toUpperCase(),
      rank: formData.get("playerRank").toString().trim(),
      points: Number(formData.get("playerPoints")),
      avatar: formData.get("playerAvatar").toString().trim() || defaultAvatar,
      tiers: parseTiers(formData.get("playerTiers").toString())
    });

    playerForm.reset();
    await setActiveCategory(formData.get("playerCategory").toString());
  } catch (error) {
    window.alert(error.message);
  }
});

function openAdminPlayerDetails(player) {
  const categoryEntries = leaderboardData[activeCategory] ?? [];
  const position = categoryEntries.findIndex((entry) => entry.id === player.id) + 1;

  openPlayerModal(player, {
    category: activeCategory,
    position,
    actions: [
      {
        label: "Delete player",
        variant: "danger",
        onClick: async () => {
          await removePlayerFromActiveCategory(player);
        }
      }
    ]
  });
}

leaderboardRows.addEventListener("click", (event) => {
  const row = event.target.closest(".board-row-clickable");
  if (!row) {
    return;
  }

  const player = visibleEntries.find((entry) => entry.id === Number(row.dataset.entryId));

  if (player) {
    openAdminPlayerDetails(player);
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

function attachAdminTableEvents() {
  if (!adminTable) {
    return;
  }

  adminTable.on("rowClick", (_event, row) => {
    const player = row.getData();
    openAdminPlayerDetails(player);
  });
}

async function initialize() {
  await refreshCategories();
  await refreshIconOptions();
  activeCategory = categories[0]?.id ?? "overall";
  populateCategoryIconOptions();
  createTabs();
  initAdminTable();
  attachAdminTableEvents();
  await setActiveCategory(activeCategory);
}

initialize();
