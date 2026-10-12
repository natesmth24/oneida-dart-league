
const fallback = window.leagueData || {
  standings: [],
  weeklyLeaders: {},
  upcoming: []
};

const escapeHTML = value =>
  String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]);

function renderLeague(data) {
  const standingsBody = document.getElementById("standings-body");
  const leaders = document.getElementById("weekly-leaders");
  const matchups = document.getElementById("matchups");

  if (standingsBody) {
    standingsBody.innerHTML = "";

    (data.standings || []).forEach((team, index) => {
      const wins = team.gameWins ?? team.wins ?? 0;
      const losses = team.gameLosses ?? team.losses ?? 0;
      const gamesWon = team.matchWins ?? team.gamesWon ?? 0;

      standingsBody.insertAdjacentHTML("beforeend", `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${escapeHTML(team.team)}</strong></td>
          <td>${wins}</td>
          <td>${losses}</td>
          <td>${gamesWon}</td>
        </tr>
      `);
    });
  }

  if (leaders) {
    leaders.innerHTML = "";

    Object.entries(data.weeklyLeaders || {}).forEach(([category, rows]) => {
      const body = rows.length
        ? rows.map(row => `
            <div class="leader-row">
              <b>${row.place}</b>
              <span>${escapeHTML(row.name)}</span>
              <strong>${row.score}</strong>
            </div>
          `).join("")
        : `<div class="leader-row">
             <span>—</span>
             <span>No results yet</span>
             <strong>—</strong>
           </div>`;

      leaders.insertAdjacentHTML("beforeend", `
        <article class="leader-card">
          <h3>${escapeHTML(category)}</h3>
          ${body}
        </article>
      `);
    });
  }

  if (matchups) {
    matchups.innerHTML = "";

    const upcoming = data.schedule
      ? data.schedule
          .filter(match => !match.complete)
          .sort((a, b) => a.week - b.week)
          .slice(0, 3)
      : (data.upcoming || []);

    upcoming.forEach(match => {
      matchups.insertAdjacentHTML("beforeend", `
        <article class="match-card">
          <span>Home</span>
          <strong>${escapeHTML(match.home)}</strong>
          <div class="vs">VS</div>
          <strong>${escapeHTML(match.away)}</strong>
          <span>Away</span>
        </article>
      `);
    });
  }
}


let playerStatsData = [];
let playerSortColumn = "ppd";
let playerSortAscending = false;

const playerColumns = [
  { key: "name", label: "Player", type: "text" },
  { key: "team", label: "Team", type: "text" },
  { key: "matches", label: "Matches", type: "number" },
  { key: "win501Pct", label: "501 Win %", type: "number" },
  { key: "cricketWinPct", label: "Cricket Win %", type: "number" },
  { key: "ppd", label: "PPD", type: "number" },
  { key: "mpr", label: "MPR", type: "number" },
  { key: "hatTricks", label: "Hat Tricks", type: "number" },
  { key: "highTons", label: "High Tons", type: "number" },
  { key: "whiteHorses", label: "White Horses", type: "number" }
];

function renderPlayerStats(data) {
  const body = document.getElementById("players-body");
  if (!body) return;

  playerStatsData = data.players || [];

  const table = body.closest("table");
  const headers = table.querySelectorAll("thead th");

  headers.forEach((header, index) => {
    const column = playerColumns[index];
    if (!column) return;

    header.style.cursor = "pointer";
    header.style.userSelect = "none";
    header.title = "Click to sort by " + column.label;
    header.setAttribute("tabindex", "0");
    header.setAttribute("role", "button");

    const selectColumn = () => {
      if (playerSortColumn === column.key) {
        playerSortAscending = !playerSortAscending;
      } else {
        playerSortColumn = column.key;
        playerSortAscending = column.type === "text";
      }
      displaySortedPlayers();
    };

    header.onclick = selectColumn;
    header.onkeydown = event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectColumn();
      }
    };
  });

  displaySortedPlayers();
}

function displaySortedPlayers() {
  const body = document.getElementById("players-body");
  if (!body) return;

  body.innerHTML = "";

  const selectedColumn = playerColumns.find(
    column => column.key === playerSortColumn
  );

  const players = [...playerStatsData].sort((a, b) => {
    const getValue = player => {
      if (playerSortColumn === "team") {
        return player.rosterTeam || player.team || "Sub";
      }
      return player[playerSortColumn] ?? (
        selectedColumn.type === "number" ? 0 : ""
      );
    };

    const valueA = getValue(a);
    const valueB = getValue(b);

    let comparison;

    if (selectedColumn.type === "number") {
      comparison = Number(valueA) - Number(valueB);
    } else {
      comparison = String(valueA).localeCompare(String(valueB));
    }

    if (comparison === 0) {
      comparison = String(a.name || "").localeCompare(
        String(b.name || "")
      );
    }

    return playerSortAscending ? comparison : -comparison;
  });

  players.forEach(player => {
    const row = document.createElement("tr");

    const values = [
      player.name || "",
      player.rosterTeam || player.team || "Sub",
      player.matches ?? 0,
      `${Number(player.win501Pct || 0).toFixed(2)}%`,
      `${Number(player.cricketWinPct || 0).toFixed(2)}%`,
      Number(player.ppd || 0).toFixed(2),
      Number(player.mpr || 0).toFixed(2),
      player.hatTricks ?? 0,
      player.highTons ?? 0,
      player.whiteHorses ?? 0
    ];

    values.forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    body.appendChild(row);
  });

  const headers = body.closest("table").querySelectorAll("thead th");

  headers.forEach((header, index) => {
    const column = playerColumns[index];
    if (!column) return;

    header.textContent = column.label;

    if (column.key === playerSortColumn) {
      header.textContent += playerSortAscending ? " ▲" : " ▼";
      header.setAttribute(
        "aria-sort",
        playerSortAscending ? "ascending" : "descending"
      );
    } else {
      header.removeAttribute("aria-sort");
    }
  });
}

renderLeague(fallback);
renderPlayerStats(fallback);


fetch("./league-data.json", { cache: "no-store" })
  .then(response => {
    if (!response.ok) throw new Error("Live data not available");
    return response.json();
  })
.then(data => {
    renderLeague(data);
    renderPlayerStats(data);

})
  .catch(() => {
    console.info("Using website placeholder data.");
  });
