"use strict";
const container = document.getElementById("full-schedule-list");

const weekDates = [
  "10/7", "10/14", "10/21", "10/28",
  "11/4", "11/11", "11/18",
  "12/2", "12/9", "12/16", "12/30",
  "1/6", "1/13", "1/20", "1/27"
];
function make(tag, className, value) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (value !== undefined) element.textContent = value;
  return element;
}
function teamRow(team, score, winner) {
  const row = make("div", "schedule-team" + (winner ? " winner" : ""));
  row.appendChild(make("strong", "", team || "TBD"));
  if (score !== null) row.appendChild(make("span", "schedule-score", String(score)));
  return row;
}
function renderSchedule(data) {
  container.replaceChildren();
  const matches = Array.isArray(data.schedule) ? data.schedule : [];
  for (let week = 1; week <= 15; week++) {
    const games = matches.filter(m => Number(m.week) === week);
    const section = make("section", "section panel-section schedule-week");
    const heading = make("div", "section-heading");
    const title = make("h2", "", `Week ${week} - ${weekDates[week - 1]}`);
    heading.appendChild(title);
    const complete = games.length > 0 && games.every(m => m.complete === true);
    heading.appendChild(make("span", "schedule-week-status", complete ? "Completed" : ""));
    section.appendChild(heading);
    const grid = make("div", "match-grid");
    for (const match of games) {
      const card = make("article", "match-card");
      const completed = match.complete === true;
      const homeScore = completed ? Number(match.homeWins) : null;
      const awayScore = completed ? Number(match.awayWins) : null;
      card.appendChild(make("span", "", "HOME"));
      card.appendChild(teamRow(match.home, homeScore, completed && homeScore > awayScore));
      card.appendChild(make("div", "vs", "VS"));
      card.appendChild(teamRow(match.away, awayScore, completed && awayScore > homeScore));
      card.appendChild(make("span", "", "AWAY"));
      grid.appendChild(card);
    }
    if (!games.length) grid.appendChild(make("p", "schedule-empty", "No matches scheduled."));
    section.appendChild(grid);
    container.appendChild(section);
  }
}
fetch("./league-data.json", { cache: "no-store" })
  .then(response => { if (!response.ok) throw new Error("Schedule data unavailable"); return response.json(); })
  .then(renderSchedule)
  .catch(error => { container.replaceChildren(make("p", "schedule-empty", "Schedule unavailable. Please try refreshing the page.")); console.error(error); });
