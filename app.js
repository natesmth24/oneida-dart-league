
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

function renderPlayerStats(data) {
  const body = document.getElementById("players-body");
  if (!body) return;

  body.innerHTML = "";

  const players = [...(data.players || [])]
    .sort((a, b) => (b.ppd || 0) - (a.ppd || 0));

  players.forEach(player => {
    const row = document.createElement("tr");

    const values = [
      player.name || "",
      player.rosterTeam || player.team || "Sub",
      player.matches ?? 0,
      `${Number(player.win501Pct || 0).toFixed(2)}%`,
      `${Number(player.cricketWinPct || 0).toFixed(2)}%`,
      Number(player.ppd || 0).toFixed(2),
      Number(player.mpr || 0).toFixed(2)
    ];

    values.forEach(value => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.appendChild(cell);
    });

    body.appendChild(row);
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
