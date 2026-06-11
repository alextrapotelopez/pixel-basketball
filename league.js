(() => {
  const api = window.PixelCourt;
  if (!api) return;

  const els = {
    landingPage: document.querySelector("#landingPage"),
    landingOneGame: document.querySelector("#landingOneGame"),
    landingContinueLeague: document.querySelector("#landingContinueLeague"),
    landingNewLeague: document.querySelector("#landingNewLeague"),
    landingDeleteLeague: document.querySelector("#landingDeleteLeague"),
    landingSaveSummary: document.querySelector("#landingSaveSummary"),
    homeMode: document.querySelector("#homeMode"),
    oneGameMode: document.querySelector("#oneGameMode"),
    leagueMode: document.querySelector("#leagueMode"),
    leaguePanel: document.querySelector("#leaguePanel"),
    leagueSetup: document.querySelector("#leagueSetup"),
    leagueHub: document.querySelector("#leagueHub"),
    leagueTitle: document.querySelector("#leagueTitle"),
    leagueSummary: document.querySelector("#leagueSummary"),
    leagueView: document.querySelector("#leagueView"),
    leagueTeamSelect: document.querySelector("#leagueTeamSelect"),
    startLeague: document.querySelector("#startLeague"),
    leagueHome: document.querySelector("#leagueHome"),
    newLeague: document.querySelector("#newLeague"),
    deleteLeague: document.querySelector("#deleteLeague"),
    teamPicker: document.querySelector("#teamPicker"),
    playSurfaces: document.querySelectorAll(".play-surface"),
  };

  const SAVE_KEY = "activeLeague";
  const DB_NAME = "pixel-court-league";
  const DB_VERSION = 1;
  const EAST = "East";
  const WEST = "West";
  const SCHEDULE_PAGE_SIZE = 80;
  const RECAP_DURATION_MS = 60000;
  let league = null;
  let activeView = "schedule";
  let schedulePage = 0;
  let boxscoreDay = null;
  let watchedGameId = null;
  let recapTimer = null;

  const teamMeta = {
    "Atlanta Hawks": ["East", "Southeast", ["Nickeil Alexander-Walker", "Luke Kennard", "Kristaps Porzingis", "Vit Krejci", "Mouhamed Gueye"]],
    "Boston Celtics": ["East", "Atlantic", ["Jayson Tatum", "Al Horford", "Jordan Walsh", "Baylor Scheierman", "Xavier Tillman"]],
    "Brooklyn Nets": ["East", "Atlantic", ["D'Angelo Russell", "Day'Ron Sharpe", "Noah Clowney", "Ziaire Williams", "Jalen Wilson"]],
    "Charlotte Hornets": ["East", "Southeast", ["Tre Mann", "Seth Curry", "Josh Green", "Grant Williams", "Tidjane Salaun"]],
    "Chicago Bulls": ["East", "Central", ["Patrick Williams", "Kevin Huerter", "Tre Jones", "Julian Phillips", "Jalen Smith"]],
    "Cleveland Cavaliers": ["East", "Central", ["Max Strus", "Isaac Okoro", "Ty Jerome", "Sam Merrill", "Dean Wade"]],
    "Detroit Pistons": ["East", "Central", ["Malik Beasley", "Isaiah Stewart", "Ron Holland II", "Marcus Sasser", "Paul Reed"]],
    "Indiana Pacers": ["East", "Central", ["Obi Toppin", "T.J. McConnell", "Aaron Nesmith", "Ben Sheppard", "Jarace Walker"]],
    "Miami Heat": ["East", "Southeast", ["Terry Rozier", "Duncan Robinson", "Nikola Jovic", "Davion Mitchell", "Haywood Highsmith"]],
    "Milwaukee Bucks": ["East", "Central", ["Gary Trent Jr.", "Taurean Prince", "Kevin Porter Jr.", "Pat Connaughton", "AJ Green"]],
    "New York Knicks": ["East", "Atlantic", ["Mitchell Robinson", "Miles McBride", "Cameron Payne", "Precious Achiuwa", "Landry Shamet"]],
    "Orlando Magic": ["East", "Southeast", ["Cole Anthony", "Anthony Black", "Jonathan Isaac", "Gary Harris", "Goga Bitadze"]],
    "Philadelphia 76ers": ["East", "Atlantic", ["Quentin Grimes", "Guerschon Yabusele", "Andre Drummond", "Eric Gordon", "Kyle Lowry"]],
    "Toronto Raptors": ["East", "Atlantic", ["Gradey Dick", "Ochai Agbaji", "Jonathan Mogbo", "Jamison Battle", "Chris Boucher"]],
    "Washington Wizards": ["East", "Southeast", ["Bub Carrington", "Corey Kispert", "Kyshawn George", "Malcolm Brogdon", "Richaun Holmes"]],
    "Dallas Mavericks": ["West", "Southwest", ["P.J. Washington", "Daniel Gafford", "Max Christie", "Naji Marshall", "Jaden Hardy"]],
    "Denver Nuggets": ["West", "Northwest", ["Michael Porter Jr.", "Russell Westbrook", "Peyton Watson", "Julian Strawther", "Zeke Nnaji"]],
    "Golden State Warriors": ["West", "Pacific", ["Buddy Hield", "Moses Moody", "Trayce Jackson-Davis", "Kevon Looney", "Gary Payton II"]],
    "Houston Rockets": ["West", "Southwest", ["Fred VanVleet", "Dorian Finney-Smith", "Tari Eason", "Steven Adams", "Reed Sheppard"]],
    "LA Clippers": ["West", "Pacific", ["Norman Powell", "Kris Dunn", "Nicolas Batum", "Amir Coffey", "Ben Simmons"]],
    "Los Angeles Lakers": ["West", "Pacific", ["Gabe Vincent", "Jarred Vanderbilt", "Maxi Kleber", "Jaxson Hayes", "Dalton Knecht"]],
    "Memphis Grizzlies": ["West", "Southwest", ["Brandon Clarke", "Santi Aldama", "Luke Kennard", "GG Jackson II", "Vince Williams Jr."]],
    "Minnesota Timberwolves": ["West", "Northwest", ["Mike Conley", "Nickeil Alexander-Walker", "Donte DiVincenzo", "Rob Dillingham", "Terrence Shannon Jr."]],
    "New Orleans Pelicans": ["West", "Southwest", ["Jordan Hawkins", "Jose Alvarado", "Bruce Brown", "Karlo Matkovic", "Jordan Poole"]],
    "Oklahoma City Thunder": ["West", "Northwest", ["Alex Caruso", "Cason Wallace", "Aaron Wiggins", "Isaiah Joe", "Jaylin Williams"]],
    "Phoenix Suns": ["West", "Pacific", ["Ryan Dunn", "Royce O'Neale", "Nick Richards", "Tyus Jones", "Bol Bol"]],
    "Portland Trail Blazers": ["West", "Northwest", ["Toumani Camara", "Anfernee Simons", "Matisse Thybulle", "Robert Williams III", "Dalano Banton"]],
    "Sacramento Kings": ["West", "Pacific", ["Keon Ellis", "Devin Carter", "Jonas Valanciunas", "Jake LaRavia", "Doug McDermott"]],
    "San Antonio Spurs": ["West", "Southwest", ["Keldon Johnson", "Jeremy Sochan", "Chris Paul", "Julian Champagnie", "Tre Jones"]],
    "Utah Jazz": ["West", "Northwest", ["Isaiah Collier", "Brice Sensabaugh", "Cody Williams", "Svi Mykhailiuk", "Kyle Filipowski"]],
  };

  function hashText(text) {
    let hash = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function rand(seed, min = 0, max = 1) {
    const x = Math.sin(seed * 9999.91) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  }

  function dbRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => request.result.createObjectStore("saves");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function loadSave() {
    const db = await openDb();
    return dbRequest(db.transaction("saves", "readonly").objectStore("saves").get(SAVE_KEY));
  }

  async function saveLeague() {
    const db = await openDb();
    await dbRequest(db.transaction("saves", "readwrite").objectStore("saves").put(league, SAVE_KEY));
  }

  async function deleteSave() {
    const db = await openDb();
    await dbRequest(db.transaction("saves", "readwrite").objectStore("saves").delete(SAVE_KEY));
  }

  function teamById(id) {
    return league.teams.find((team) => team.id === id);
  }

  function gameById(id) {
    return league.games.find((game) => game.id === id);
  }

  function gameTeam(id) {
    return api.nbaTeams.find((team) => team.id === id);
  }

  function buildTeams() {
    return api.nbaTeams.map((team) => {
      const meta = teamMeta[team.name] || [team.name.includes("Lakers") || team.name.includes("Warriors") ? WEST : EAST, "League", []];
      const roster = [...team.players, ...meta[2]].slice(0, 10);
      return {
        id: team.id,
        name: team.name,
        short: team.short,
        conference: meta[0],
        division: meta[1],
        rating: 78 + (hashText(team.name) % 18),
        players: roster.map((name, index) => ({
          id: `${team.id}-${index}`,
          name,
          number: index + 1,
          role: index < 5 ? "starter" : "bench",
          rating: 68 + ((hashText(name) + index * 7) % 27),
        })),
      };
    });
  }

  function generateSchedule(teams) {
    const games = [];
    const ordered = teams.slice().sort((a, b) => a.conference.localeCompare(b.conference) || a.division.localeCompare(b.division) || a.name.localeCompare(b.name));
    const fixed = ordered[0];
    let rotating = ordered.slice(1);

    for (let day = 1; day <= 82; day += 1) {
      const round = (day - 1) % 29;
      const slate = [fixed, ...rotating];
      for (let slot = 0; slot < 15; slot += 1) {
        const a = slate[slot];
        const b = slate[29 - slot];
        const flip = (day + slot + hashText(`${a.id}-${b.id}`)) % 2 === 0;
        games.push({
          id: `G${games.length + 1}`,
          type: "regular",
          day,
          homeId: flip ? a.id : b.id,
          awayId: flip ? b.id : a.id,
          status: "scheduled",
          homeScore: null,
          awayScore: null,
          boxscore: null,
        });
      }
      rotating = [rotating[rotating.length - 1], ...rotating.slice(0, rotating.length - 1)];
      if (round === 28 && day < 82) {
        rotating = rotating.slice(7).concat(rotating.slice(0, 7));
      }
    }

    return games;
  }

  function createLeague(userTeamId) {
    const teams = buildTeams();
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      userTeamId,
      phase: "regular",
      currentViewDay: 1,
      teams,
      games: generateSchedule(teams),
      playIn: [],
      playoffSeries: [],
      championId: null,
      nextPostseasonGame: 1,
    };
  }

  function blankStats() {
    return { minutes: 0, points: 0, assists: 0, rebounds: 0, steals: 0, blocks: 0, fieldGoalsMade: 0, fieldGoalsAttempted: 0, threePointersMade: 0, threePointersAttempted: 0 };
  }

  function lineText(made, attempted) {
    const pct = attempted ? Math.round((made / attempted) * 100) : 0;
    return `${pct}% ${made}/${attempted}`;
  }

  function allocatePoints(team, total, seed) {
    const weights = team.players.map((player, index) => Math.max(2, player.rating - 55 + (index < 5 ? 9 : 0) + rand(seed + index, -4, 4)));
    const sum = weights.reduce((a, b) => a + b, 0);
    const points = weights.map((weight) => Math.max(0, Math.round((weight / sum) * total)));
    let diff = total - points.reduce((a, b) => a + b, 0);
    let cursor = 0;
    while (diff !== 0) {
      const step = diff > 0 ? 1 : -1;
      if (points[cursor] + step >= 0) {
        points[cursor] += step;
        diff -= step;
      }
      cursor = (cursor + 1) % points.length;
    }
    return points;
  }

  function buildBoxscore(team, score, seed, liveLines = []) {
    const minutes = [34, 32, 30, 28, 26, 24, 20, 18, 16, 12];
    const points = allocatePoints(team, score, seed);
    return team.players.map((player, index) => {
      const live = liveLines.find((line) => line.name === player.name);
      if (live) return Object.assign({ player: player.name, number: player.number, minutes: minutes[index] }, live.stats);
      const threesMade = Math.min(Math.floor(points[index] / 3), Math.floor(rand(seed + index * 11, 0, index < 5 ? 4 : 3)));
      const twosMade = Math.floor(Math.max(0, points[index] - threesMade * 3) / 2);
      const fieldGoalsMade = threesMade + twosMade;
      return {
        player: player.name,
        number: player.number,
        minutes: minutes[index],
        points: points[index],
        assists: Math.floor(rand(seed + index * 13, 0, index < 2 ? 8 : 4)),
        rebounds: Math.floor(rand(seed + index * 17, 1, index < 6 ? 10 : 5)),
        steals: Math.floor(rand(seed + index * 19, 0, 3)),
        blocks: Math.floor(rand(seed + index * 23, 0, index === 4 ? 4 : 2)),
        fieldGoalsMade,
        fieldGoalsAttempted: fieldGoalsMade + Math.floor(rand(seed + index * 29, 2, 9)),
        threePointersMade: threesMade,
        threePointersAttempted: threesMade + Math.floor(rand(seed + index * 31, 0, 5)),
      };
    });
  }

  function simulateGame(game, live) {
    const home = teamById(game.homeId);
    const away = teamById(game.awayId);
    const seed = hashText(`${game.id}-${home.id}-${away.id}`);
    let homeScore = live ? live.homeScore : Math.round(98 + home.rating * 0.34 + rand(seed, -11, 18));
    let awayScore = live ? live.awayScore : Math.round(96 + away.rating * 0.34 + rand(seed + 7, -11, 18));
    if (homeScore === awayScore) homeScore += rand(seed + 3) > 0.5 ? 2 : -2;
    game.homeScore = homeScore;
    game.awayScore = awayScore;
    game.status = "final";
    game.boxscore = {
      home: buildBoxscore(home, homeScore, seed + 101, live && live.homeLines),
      away: buildBoxscore(away, awayScore, seed + 202, live && live.awayLines),
    };
  }

  function conferenceStandings(conference) {
    const rows = league.teams.filter((team) => team.conference === conference).map((team) => ({ team, wins: 0, losses: 0, pct: 0 }));
    const byId = Object.fromEntries(rows.map((row) => [row.team.id, row]));
    league.games.filter((game) => game.type === "regular" && game.status === "final").forEach((game) => {
      const homeWon = game.homeScore > game.awayScore;
      if (byId[game.homeId]) homeWon ? byId[game.homeId].wins += 1 : byId[game.homeId].losses += 1;
      if (byId[game.awayId]) homeWon ? byId[game.awayId].losses += 1 : byId[game.awayId].wins += 1;
    });
    rows.forEach((row) => row.pct = row.wins + row.losses ? row.wins / (row.wins + row.losses) : 0);
    return rows.sort((a, b) => b.pct - a.pct || b.wins - a.wins || b.team.rating - a.team.rating);
  }

  function userGamesPending() {
    return league.games.filter((game) => game.status === "scheduled" && (game.homeId === league.userTeamId || game.awayId === league.userTeamId));
  }

  function simNextDay(includeUser = false) {
    const next = league.games.find((game) => game.status === "scheduled" && (includeUser || (game.homeId !== league.userTeamId && game.awayId !== league.userTeamId)));
    if (!next) return false;
    const day = next.day;
    league.games.filter((game) => game.status === "scheduled" && game.day === day && (includeUser || (game.homeId !== league.userTeamId && game.awayId !== league.userTeamId))).forEach((game) => simulateGame(game));
    league.currentViewDay = day;
    maybeAdvanceSeason();
    return day;
  }

  function maybeAdvanceSeason() {
    if (league.phase === "regular" && league.games.filter((game) => game.type === "regular").every((game) => game.status === "final")) {
      league.phase = "playin";
      buildPlayIn();
    }
  }

  function buildPlayIn() {
    league.playIn = [EAST, WEST].flatMap((conference) => {
      const seeds = conferenceStandings(conference);
      return [
        { id: `${conference}-PI1`, conference, label: "7 vs 8", highSeedId: seeds[6].team.id, lowSeedId: seeds[7].team.id, status: "scheduled", winnerId: null, loserId: null },
        { id: `${conference}-PI2`, conference, label: "9 vs 10", highSeedId: seeds[8].team.id, lowSeedId: seeds[9].team.id, status: "scheduled", winnerId: null, loserId: null },
        { id: `${conference}-PI3`, conference, label: "Seed 8 Game", highSeedId: null, lowSeedId: null, status: "waiting", winnerId: null, loserId: null },
      ];
    });
  }

  function simulateMiniGame(idA, idB, label) {
    const game = { id: `P${league.nextPostseasonGame++}`, type: "postseason", homeId: idA, awayId: idB, status: "scheduled" };
    simulateGame(game);
    game.label = label;
    league.games.push(game);
    return game.homeScore > game.awayScore ? idA : idB;
  }

  function advancePlayIn(includeUser = false) {
    for (const game of league.playIn) {
      if (game.status === "scheduled") {
        if (!includeUser && (game.highSeedId === league.userTeamId || game.lowSeedId === league.userTeamId)) return false;
        const winnerId = simulateMiniGame(game.highSeedId, game.lowSeedId, `${game.conference} ${game.label}`);
        game.winnerId = winnerId;
        game.loserId = winnerId === game.highSeedId ? game.lowSeedId : game.highSeedId;
        game.status = "final";
        const pi3 = league.playIn.find((item) => item.conference === game.conference && item.label === "Seed 8 Game");
        const pi1 = league.playIn.find((item) => item.conference === game.conference && item.label === "7 vs 8");
        const pi2 = league.playIn.find((item) => item.conference === game.conference && item.label === "9 vs 10");
        if (pi1.status === "final" && pi2.status === "final" && pi3.status === "waiting") {
          pi3.highSeedId = pi1.loserId;
          pi3.lowSeedId = pi2.winnerId;
          pi3.status = "scheduled";
        }
        return true;
      }
    }
    if (league.playIn.every((game) => game.status === "final")) {
      league.phase = "playoffs";
      buildPlayoffs();
    }
    return false;
  }

  function buildPlayoffs() {
    league.playoffSeries = [EAST, WEST].flatMap((conference) => {
      const seeds = conferenceStandings(conference);
      const pi1 = league.playIn.find((game) => game.conference === conference && game.label === "7 vs 8");
      const pi3 = league.playIn.find((game) => game.conference === conference && game.label === "Seed 8 Game");
      const seeded = [seeds[0].team.id, seeds[1].team.id, seeds[2].team.id, seeds[3].team.id, seeds[4].team.id, seeds[5].team.id, pi1.winnerId, pi3.winnerId];
      return [
        makeSeries(conference, "Round 1", 1, seeded[0], seeded[7]),
        makeSeries(conference, "Round 1", 2, seeded[3], seeded[4]),
        makeSeries(conference, "Round 1", 3, seeded[2], seeded[5]),
        makeSeries(conference, "Round 1", 4, seeded[1], seeded[6]),
      ];
    });
  }

  function makeSeries(conference, round, slot, teamAId, teamBId) {
    return { id: `${conference}-${round}-${slot}`.replace(/ /g, ""), conference, round, slot, teamAId, teamBId, winsA: 0, winsB: 0, games: [], status: "active", winnerId: null };
  }

  function activeSeries() {
    return league.playoffSeries.find((series) => series.status === "active");
  }

  function advancePlayoffs(includeUser = false) {
    const series = activeSeries();
    if (!series) return false;
    if (!includeUser && (series.teamAId === league.userTeamId || series.teamBId === league.userTeamId)) return false;
    const winnerId = simulateMiniGame(series.teamAId, series.teamBId, `${series.conference} ${series.round}`);
    series.games.push(winnerId);
    winnerId === series.teamAId ? series.winsA += 1 : series.winsB += 1;
    if (series.winsA === 4 || series.winsB === 4) {
      series.status = "final";
      series.winnerId = series.winsA === 4 ? series.teamAId : series.teamBId;
      maybeBuildNextPlayoffRound();
    }
    return true;
  }

  function maybeBuildNextPlayoffRound() {
    const active = league.playoffSeries.some((series) => series.status === "active");
    if (active) return;
    const r1 = league.playoffSeries.filter((series) => series.round === "Round 1");
    const semis = league.playoffSeries.filter((series) => series.round === "Semifinals");
    const finals = league.playoffSeries.filter((series) => series.round === "Conference Finals");
    if (r1.length === 8 && semis.length === 0) {
      [EAST, WEST].forEach((conference) => {
        const done = r1.filter((series) => series.conference === conference).sort((a, b) => a.slot - b.slot);
        league.playoffSeries.push(makeSeries(conference, "Semifinals", 1, done[0].winnerId, done[1].winnerId));
        league.playoffSeries.push(makeSeries(conference, "Semifinals", 2, done[2].winnerId, done[3].winnerId));
      });
      return;
    }
    if (semis.length === 4 && finals.length === 0) {
      [EAST, WEST].forEach((conference) => {
        const done = semis.filter((series) => series.conference === conference).sort((a, b) => a.slot - b.slot);
        league.playoffSeries.push(makeSeries(conference, "Conference Finals", 1, done[0].winnerId, done[1].winnerId));
      });
      return;
    }
    const confFinals = league.playoffSeries.filter((series) => series.round === "Conference Finals");
    const nbaFinals = league.playoffSeries.find((series) => series.round === "NBA Finals");
    if (confFinals.length === 2 && !nbaFinals) {
      league.playoffSeries.push(makeSeries("NBA", "NBA Finals", 1, confFinals[0].winnerId, confFinals[1].winnerId));
      return;
    }
    if (nbaFinals && nbaFinals.status === "final") {
      league.phase = "complete";
      league.championId = nbaFinals.winnerId;
    }
  }

  function renderSummary() {
    if (!league) return;
    const user = teamById(league.userTeamId);
    const standings = conferenceStandings(user.conference);
    const row = standings.find((item) => item.team.id === user.id);
    const remaining = league.games.filter((game) => game.status === "scheduled").length;
    els.leagueTitle.textContent = `${user.short} League`;
    els.leagueSummary.innerHTML = [
      card("Team", user.name),
      card("Phase", league.phase === "complete" ? "Champion crowned" : league.phase),
      card("Record", `${row ? row.wins : 0}-${row ? row.losses : 0}`),
      card("Games Left", String(remaining)),
    ].join("");
  }

  function renderLanding() {
    const hasLeague = Boolean(league);
    els.landingContinueLeague.disabled = !hasLeague;
    els.landingDeleteLeague.disabled = !hasLeague;
    if (!hasLeague) {
      els.landingSaveSummary.textContent = "No league save found.";
      return;
    }
    const user = teamById(league.userTeamId);
    const standings = conferenceStandings(user.conference);
    const row = standings.find((item) => item.team.id === user.id);
    els.landingSaveSummary.textContent = `${user.name} - ${league.phase} - ${row ? `${row.wins}-${row.losses}` : "0-0"}`;
  }

  function card(label, value) {
    return `<div class="league-card"><span class="label">${label}</span><strong>${value}</strong></div>`;
  }

  function render() {
    stopRecapVideo();
    renderLanding();
    const hasLeague = Boolean(league);
    els.leagueSetup.classList.toggle("hidden", hasLeague);
    els.leagueHub.classList.toggle("hidden", !hasLeague);
    if (!hasLeague) return;
    renderSummary();
    document.querySelectorAll(".league-tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.leagueView === activeView));
    if (activeView === "schedule") renderSchedule();
    if (activeView === "standings") renderStandings();
    if (activeView === "playin") renderPlayIn();
    if (activeView === "playoffs") renderPlayoffs();
    if (activeView === "boxscores") renderBoxscores();
  }

  function gameLabel(game) {
    const away = teamById(game.awayId);
    const home = teamById(game.homeId);
    return `${away.short} @ ${home.short}`;
  }

  function renderSchedule() {
    const allGames = league.games.filter((game) => game.type === "regular");
    const pageCount = Math.max(1, Math.ceil(allGames.length / SCHEDULE_PAGE_SIZE));
    schedulePage = Math.max(0, Math.min(schedulePage, pageCount - 1));
    const start = schedulePage * SCHEDULE_PAGE_SIZE;
    const games = allGames.slice(start, start + SCHEDULE_PAGE_SIZE);
    const myNext = hasPlayableUserGame();
    const canResume = league.games.some((game) => game.status === "scheduled" && game.homeId !== league.userTeamId && game.awayId !== league.userTeamId);
    els.leagueView.innerHTML = `
      <div class="league-actions">
        <button data-league-action="play-next" ${myNext ? "" : "disabled"}>Play Next My Game</button>
        <button data-league-action="resume-schedule" ${canResume ? "" : "disabled"}>Resume</button>
        <button data-league-action="sim-day">Sim Next Day</button>
        <button data-league-action="sim-season">Auto-Sim Season</button>
        <button data-league-action="schedule-prev" ${schedulePage === 0 ? "disabled" : ""}>Previous</button>
        <button data-league-action="schedule-next" ${schedulePage >= pageCount - 1 ? "disabled" : ""}>Next</button>
      </div>
      <div class="league-empty">Schedule page ${schedulePage + 1} of ${pageCount} - games ${start + 1}-${Math.min(start + SCHEDULE_PAGE_SIZE, allGames.length)} of ${allGames.length}</div>
      <div class="league-table">
        ${games.map((game) => scheduleRow(game)).join("")}
      </div>`;
  }

  function scheduleRow(game) {
    const result = game.status === "final" ? `${game.awayScore}-${game.homeScore}` : "Scheduled";
    return `<div class="league-row schedule-row"><span>Day ${game.day || "-"}</span><span>${gameLabel(game)}</span><span class="score-value">${result}</span><span>${game.type}</span><span>${game.status}</span></div>`;
  }

  function renderStandings() {
    els.leagueView.innerHTML = `<div class="league-grid">${[EAST, WEST].map((conference) => `
      <div class="league-card"><span class="label">${conference}</span><div class="league-table">${conferenceStandings(conference).map((row, index) => `
        <div class="league-row"><span>${index + 1}</span><span>${row.team.short}</span><span>${row.wins}</span><span>${row.losses}</span><span>${row.pct.toFixed(3)}</span><span>${index < 6 ? "Playoffs" : index < 10 ? "Play-In" : "-"}</span><span>${row.team.division}</span></div>`).join("")}</div></div>`).join("")}</div>`;
  }

  function renderPlayIn() {
    if (!league.playIn.length) {
      els.leagueView.innerHTML = `<div class="league-empty">Play-in starts after the regular season.</div>`;
      return;
    }
    els.leagueView.innerHTML = `<div class="league-actions"><button data-league-action="play-next" ${hasPlayableUserGame() ? "" : "disabled"}>Play Next My Game</button><button data-league-action="advance-playin">Sim Next Play-In Game</button><button data-league-action="sim-playin">Auto-Sim Play-In</button></div><div class="league-grid">${[EAST, WEST].map((conference) => `
      <div class="league-card"><span class="label">${conference} Play-In</span>${league.playIn.filter((game) => game.conference === conference).map((game) => `<div class="league-row schedule-row"><span>${game.label}</span><span>${game.highSeedId ? teamById(game.highSeedId).short : "TBD"} vs ${game.lowSeedId ? teamById(game.lowSeedId).short : "TBD"}</span><span>${game.winnerId ? teamById(game.winnerId).short : "-"}</span><span>${game.status}</span><span></span></div>`).join("")}</div>`).join("")}</div>`;
  }

  function renderPlayoffs() {
    if (!league.playoffSeries.length) {
      els.leagueView.innerHTML = `<div class="league-empty">Playoffs start after the play-in.</div>`;
      return;
    }
    els.leagueView.innerHTML = `<div class="league-actions"><button data-league-action="play-next" ${hasPlayableUserGame() ? "" : "disabled"}>Play Next My Game</button><button data-league-action="advance-playoffs">Sim Next Playoff Game</button><button data-league-action="sim-playoffs">Auto-Sim Playoffs</button></div><div class="bracket-grid">${league.playoffSeries.map((series) => `<div class="league-card"><span class="label">${series.conference} ${series.round}</span><strong>${teamById(series.teamAId).short} ${series.winsA}-${series.winsB} ${teamById(series.teamBId).short}</strong><span>${series.winnerId ? `Winner: ${teamById(series.winnerId).short}` : series.status}</span></div>`).join("")}</div>${league.championId ? `<div class="league-card"><span class="label">Champion</span><strong>${teamById(league.championId).name}</strong></div>` : ""}`;
  }

  function renderBoxscores() {
    if (watchedGameId) {
      renderWatchGame(gameById(watchedGameId));
      return;
    }
    const allFinals = league.games.filter((game) => game.status === "final" && game.boxscore);
    const finals = boxscoreDay ? allFinals.filter((game) => game.day === boxscoreDay) : allFinals.slice(-16).reverse();
    const label = boxscoreDay ? `Day ${boxscoreDay} boxscores` : "Recent boxscores";
    els.leagueView.innerHTML = finals.length ? `<div class="league-actions"><button data-league-action="boxscores-recent" ${boxscoreDay ? "" : "disabled"}>Recent Boxscores</button></div><div class="league-empty">${label}</div><div class="boxscore-grid">${finals.map((game) => `<div class="league-card"><span class="label">${game.type}</span><strong>${gameLabel(game)} ${game.awayScore}-${game.homeScore}</strong><button data-league-action="watch-game" data-game-id="${game.id}" type="button">Watch</button>${boxTable("Away", game.boxscore.away)}${boxTable("Home", game.boxscore.home)}</div>`).join("")}</div>` : `<div class="league-empty">No completed games yet.</div>`;
  }

  function boxTable(label, rows) {
    return `<span class="label">${label}</span><div class="league-table"><div class="league-row box-row"><span>#</span><span>Name</span><span>MIN</span><span>FG</span><span>3P</span><span>PTS</span><span>AST</span><span>REB</span><span>STL</span><span>BLK</span></div>${rows.map((line) => `<div class="league-row box-row"><span>${line.number}</span><span>${line.player}</span><span>${line.minutes}</span><span>${lineText(line.fieldGoalsMade, line.fieldGoalsAttempted)}</span><span>${lineText(line.threePointersMade, line.threePointersAttempted)}</span><span>${line.points}</span><span>${line.assists}</span><span>${line.rebounds}</span><span>${line.steals}</span><span>${line.blocks}</span></div>`).join("")}</div>`;
  }

  function bestLine(rows, stat) {
    return rows.slice().sort((a, b) => b[stat] - a[stat])[0];
  }

  function teamRows(game, teamId) {
    return game.homeId === teamId ? game.boxscore.home : game.boxscore.away;
  }

  function teamScore(game, teamId) {
    return game.homeId === teamId ? game.homeScore : game.awayScore;
  }

  function highlightFeed(game) {
    const home = teamById(game.homeId);
    const away = teamById(game.awayId);
    const winner = game.homeScore > game.awayScore ? home : away;
    const loser = winner.id === home.id ? away : home;
    const winnerRows = teamRows(game, winner.id);
    const loserRows = teamRows(game, loser.id);
    const winnerScorer = bestLine(winnerRows, "points");
    const loserScorer = bestLine(loserRows, "points");
    const passer = bestLine([...winnerRows, ...loserRows], "assists");
    const rebounder = bestLine([...winnerRows, ...loserRows], "rebounds");
    const shooter = bestLine([...winnerRows, ...loserRows], "threePointersMade");
    return [
      `1Q 10:48 - ${winnerScorer.player} gets ${winner.short} started with an early bucket.`,
      `1Q 03:16 - ${loserScorer.player} answers for ${loser.short} and keeps it close.`,
      `2Q 07:04 - ${shooter.player} hits from deep. ${shooter.threePointersMade} made threes in the boxscore.`,
      `2Q 01:22 - ${passer.player} finds the open man and controls the tempo with ${passer.assists} assists.`,
      `3Q 05:39 - ${rebounder.player} grabs another board. ${rebounder.rebounds} rebounds tonight.`,
      `4Q 02:08 - ${winnerScorer.player} attacks again, pushing ${winner.short} toward the finish.`,
      `Final - ${winner.short} beat ${loser.short}, ${teamScore(game, winner.id)}-${teamScore(game, loser.id)}.`,
    ];
  }

  function renderWatchGame(game) {
    if (!game || !game.boxscore) {
      watchedGameId = null;
      els.leagueView.innerHTML = `<div class="league-empty">That game is not ready to watch yet.</div>`;
      return;
    }
    const home = teamById(game.homeId);
    const away = teamById(game.awayId);
    const allRows = [...game.boxscore.away, ...game.boxscore.home];
    const topScorer = bestLine(allRows, "points");
    const topRebounder = bestLine(allRows, "rebounds");
    const topPasser = bestLine(allRows, "assists");
    els.leagueView.innerHTML = `
      <div class="league-actions">
        <button data-league-action="watch-back" type="button">Back to Boxscores</button>
        <button data-league-action="boxscores-recent" type="button">Recent Boxscores</button>
      </div>
      <div class="watch-panel league-card">
        <span class="label">Watch Highlights</span>
        <strong>${away.short} ${game.awayScore} @ ${home.short} ${game.homeScore}</strong>
        <div class="recap-video" aria-label="Animated video recap">
          <div class="recap-scoreboard">
            <span>${away.short}</span>
            <strong>${game.awayScore}-${game.homeScore}</strong>
            <span>${home.short}</span>
          </div>
          <canvas class="recap-canvas" id="recapCanvas" width="960" height="540" aria-label="Pixel basketball recap video"></canvas>
          <div class="recap-progress"><i id="recapProgress"></i></div>
          <div class="recap-caption" id="recapCaption">Loading 1-minute recap...</div>
        </div>
        <div class="watch-stats">
          <div><span class="label">Top Scorer</span><strong>${topScorer.player} ${topScorer.points}</strong></div>
          <div><span class="label">Boards</span><strong>${topRebounder.player} ${topRebounder.rebounds}</strong></div>
          <div><span class="label">Passing</span><strong>${topPasser.player} ${topPasser.assists}</strong></div>
        </div>
        <div class="highlight-feed">
          ${highlightFeed(game).map((line) => `<div class="highlight-row">${line}</div>`).join("")}
        </div>
      </div>`;
    startRecapVideo(game);
  }

  function startRecapVideo(game) {
    stopRecapVideo();
    const canvas = document.querySelector("#recapCanvas");
    const progress = document.querySelector("#recapProgress");
    const caption = document.querySelector("#recapCaption");
    if (!canvas || !caption) return;
    const context = canvas.getContext("2d");
    const plays = recapPlays(game);
    const seed = hashText(`${game.id}-recap`);
    const startedAt = performance.now();
    const draw = (now) => {
      if (!plays.length) return;
      const elapsed = (now - startedAt) % RECAP_DURATION_MS;
      const playLength = RECAP_DURATION_MS / plays.length;
      const playIndex = Math.min(plays.length - 1, Math.max(0, Math.floor(elapsed / playLength)));
      const playT = (elapsed % playLength) / playLength;
      const play = plays[playIndex];
      drawRecapFrame(context, game, play, playT, seed + playIndex * 71);
      caption.textContent = `${formatRecapTime(elapsed)} - ${play.caption}`;
      if (progress) progress.style.width = `${(elapsed / RECAP_DURATION_MS) * 100}%`;
      recapTimer = window.requestAnimationFrame(draw);
    };
    recapTimer = window.requestAnimationFrame(draw);
  }

  function stopRecapVideo() {
    if (!recapTimer) return;
    window.cancelAnimationFrame(recapTimer);
    recapTimer = null;
  }

  function formatRecapTime(elapsed) {
    const remaining = Math.max(0, Math.ceil((RECAP_DURATION_MS - elapsed) / 1000));
    return `0:${String(remaining).padStart(2, "0")}`;
  }

  function recapPlays(game) {
    const home = teamById(game.homeId);
    const away = teamById(game.awayId);
    const winner = game.homeScore > game.awayScore ? home : away;
    const loser = winner.id === home.id ? away : home;
    const allRows = [...game.boxscore.away.map((line) => ({ ...line, teamId: away.id })), ...game.boxscore.home.map((line) => ({ ...line, teamId: home.id }))];
    const scorer = bestLine(allRows, "points");
    const passer = bestLine(allRows, "assists");
    const rebounder = bestLine(allRows, "rebounds");
    const shooter = bestLine(allRows, "threePointersMade");
    const steal = bestLine(allRows, "steals");
    const blocker = bestLine(allRows, "blocks");
    const winnerScorer = bestLine(teamRows(game, winner.id).map((line) => ({ ...line, teamId: winner.id })), "points");
    const loserScorer = bestLine(teamRows(game, loser.id).map((line) => ({ ...line, teamId: loser.id })), "points");
    return [
      { type: "tip", teamId: winner.id, featuredIndex: 4, player: winnerScorer.player, caption: `${winner.short} win the opening tip and push the pace.` },
      { type: "drive", teamId: winner.id, featuredIndex: 0, player: winnerScorer.player, caption: `${winnerScorer.player} drives hard for ${winner.short}.` },
      { type: "answer", teamId: loser.id, featuredIndex: 2, player: loserScorer.player, caption: `${loserScorer.player} answers back for ${loser.short}.` },
      { type: "three", teamId: shooter.teamId, featuredIndex: 1, player: shooter.player, caption: `${shooter.player} splashes a three. ${shooter.threePointersMade} makes from deep.` },
      { type: "pass", teamId: passer.teamId, featuredIndex: 3, player: passer.player, caption: `${passer.player} creates an open look with ${passer.assists} assists.` },
      { type: "block", teamId: blocker.teamId, featuredIndex: 4, player: blocker.player, caption: `${blocker.player} meets it at the rim for a block.` },
      { type: "break", teamId: winner.id, featuredIndex: 0, player: scorer.player, caption: `${scorer.player} gets loose in transition.` },
      { type: "rebound", teamId: rebounder.teamId, featuredIndex: 4, player: rebounder.player, caption: `${rebounder.player} controls the glass with ${rebounder.rebounds} rebounds.` },
      { type: "steal", teamId: steal.teamId, featuredIndex: 2, player: steal.player, caption: `${steal.player} jumps the lane and starts a run.` },
      { type: "drive", teamId: loser.id, featuredIndex: 0, player: loserScorer.player, caption: `${loser.short} keep fighting through ${loserScorer.player}.` },
      { type: "three", teamId: winner.id, featuredIndex: 1, player: winnerScorer.player, caption: `${winnerScorer.player} gives ${winner.short} the late spark.` },
      { type: "final", teamId: winner.id, featuredIndex: 0, player: winnerScorer.player, caption: `${winner.short} close it out, ${teamScore(game, winner.id)}-${teamScore(game, loser.id)}.` },
    ];
  }

  function drawRecapFrame(context, game, play, t, seed) {
    const home = teamById(game.homeId);
    const away = teamById(game.awayId);
    if (!play || !home || !away) return;
    const homeColors = gameTeam(home.id) || home;
    const awayColors = gameTeam(away.id) || away;
    const offenseIsHome = play.teamId === home.id;
    const offense = offenseIsHome ? home : away;
    const defense = offenseIsHome ? away : home;
    const offenseColors = offenseIsHome ? homeColors : awayColors;
    const defenseColors = offenseIsHome ? awayColors : homeColors;
    const attackRight = !offenseIsHome;
    const eased = easeInOut(t);
    const scene = recapScene(play, eased, seed);
    context.clearRect(0, 0, 960, 540);
    drawRecapCourt(context);
    drawRecapScoreBug(context, away, home, game);
    const players = [...scene.offense, ...scene.defense].map((point, index) => {
      const offensePlayer = index < scene.offense.length;
      const playerIndex = offensePlayer ? index : index - scene.offense.length;
      const mirrored = mirrorPoint(point, attackRight);
      return {
        x: mirrored.x,
        y: mirrored.y,
        number: playerIndex + 1,
        label: offensePlayer ? offense.short.slice(0, 3).toUpperCase() : defense.short.slice(0, 3).toUpperCase(),
        color: offensePlayer ? offenseColors.color : defenseColors.color,
        trim: offensePlayer ? offenseColors.trim : defenseColors.trim,
        skin: index % 3 === 0 ? "#8b5a3c" : index % 3 === 1 ? "#c18a5d" : "#65402e",
        hair: index % 2 === 0 ? "#17110d" : "#2d1c12",
        role: offensePlayer ? "O" : "D",
        featured: offensePlayer && playerIndex === (play.featuredIndex || 0),
      };
    }).sort((a, b) => a.y - b.y);
    const ballPoint = mirrorPoint(scene.ball, attackRight);
    let ballDrawn = false;
    players.forEach((player) => {
      if (!ballDrawn && ballPoint.y < player.y) {
        drawRecapBall(context, ballPoint);
        ballDrawn = true;
      }
      drawRecapPlayer(context, player);
    });
    if (!ballDrawn) drawRecapBall(context, ballPoint);
    drawRecapActionFlash(context, play, ballPoint);
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
  }

  function mirrorPoint(point, attackRight) {
    return attackRight ? point : { x: 960 - point.x, y: point.y, z: point.z || 0 };
  }

  function recapScene(play, t, seed) {
    const config = recapPlayConfig(play.type);
    const base = [
      { x: 292, y: 270 },
      { x: 438, y: 122 },
      { x: 430, y: 420 },
      { x: 602, y: 188 },
      { x: 615, y: 350 },
    ];
    const offense = base.map((point, index) => scriptedOffensePoint(point, index, config, t, seed));
    const defense = offense.map((point, index) => scriptedDefensePoint(point, index, config, t, seed));
    return { offense, defense, ball: scriptedBallPoint(offense, defense, config, t) };
  }

  function recapPlayConfig(type) {
    const configs = {
      tip: { handler: 4, receiver: 0, shooter: 0, action: "tip", finish: "runout" },
      drive: { handler: 0, receiver: 0, shooter: 0, action: "drive", finish: "layup" },
      answer: { handler: 2, receiver: 2, shooter: 2, action: "drive", finish: "floater" },
      three: { handler: 0, receiver: 1, shooter: 1, action: "kick", finish: "three" },
      pass: { handler: 0, receiver: 3, shooter: 3, action: "swing", finish: "jumper" },
      block: { handler: 0, receiver: 4, shooter: 4, action: "roll", finish: "block" },
      break: { handler: 0, receiver: 2, shooter: 2, action: "break", finish: "layup" },
      rebound: { handler: 1, receiver: 4, shooter: 4, action: "miss", finish: "rebound" },
      steal: { handler: 1, receiver: 2, shooter: 2, action: "steal", finish: "runout" },
      final: { handler: 0, receiver: 1, shooter: 0, action: "isolate", finish: "jumper" },
    };
    return configs[type] || configs.drive;
  }

  function scriptedOffensePoint(start, index, config, t, seed) {
    const movement = Math.sin(t * Math.PI);
    const jitter = {
      x: rand(seed + index * 29 + Math.floor(t * 8), -2, 2),
      y: rand(seed + index * 37 + Math.floor(t * 8), -2, 2),
    };
    let target = start;
    if (config.action === "break") {
      target = [
        { x: 742, y: 270 },
        { x: 660, y: 130 },
        { x: 830, y: 328 },
        { x: 590, y: 405 },
        { x: 728, y: 198 },
      ][index];
      return withJitter(lerpPoint(start, target, t), jitter);
    }
    if (config.action === "steal") {
      target = [
        { x: 710, y: 210 },
        { x: 640, y: 120 },
        { x: 810, y: 318 },
        { x: 548, y: 392 },
        { x: 690, y: 250 },
      ][index];
      return withJitter(lerpPoint(start, target, t), jitter);
    }
    if (index === config.handler) {
      target = config.finish === "three" ? { x: 520, y: start.y } : { x: 710, y: recapClamp(start.y + (index % 2 ? 38 : -28), 130, 410) };
    } else if (index === config.receiver) {
      target = config.finish === "three" ? { x: 708, y: 126 } : config.finish === "block" || config.finish === "rebound" ? { x: 795, y: 270 } : { x: 742, y: recapClamp(start.y + 22, 128, 412) };
    } else {
      target = { x: start.x + 64 + index * 12, y: recapClamp(start.y + Math.sin(index + t * Math.PI) * 32, 112, 428) };
    }
    if (config.action === "swing" && index === 3) target = { x: 708, y: 206 };
    if (config.action === "roll" && index === 4) target = { x: 790, y: 282 };
    if (config.action === "miss" && index === 4) target = { x: 818, y: 292 };
    return withJitter(lerpPoint(start, target, easeInOut(recapClamp(t + (index === config.receiver ? 0.08 : 0), 0, 1))), { x: jitter.x, y: jitter.y + movement * (index % 2 ? 5 : -5) });
  }

  function scriptedDefensePoint(offensePoint, index, config, t, seed) {
    const help = config.finish === "block" || config.finish === "rebound" ? 34 : 54;
    const lag = index === config.shooter ? 16 : index === config.receiver ? 24 : 36;
    const closeout = Math.sin(recapClamp((t - 0.42) / 0.4, 0, 1) * Math.PI) * (index === config.receiver ? 38 : 14);
    return {
      x: recapClamp(offensePoint.x + help - closeout + rand(seed + 400 + index, -3, 3), 88, 850),
      y: recapClamp(offensePoint.y + (index % 2 ? 18 : -18) + lag * (1 - t) + rand(seed + 500 + index, -3, 3), 92, 448),
      z: 0,
    };
  }

  function scriptedBallPoint(offense, defense, config, t) {
    const handler = offense[config.handler];
    const receiver = offense[config.receiver];
    const shooter = offense[config.shooter];
    const rim = { x: 884, y: 270, z: 18 };
    const dribble = { x: handler.x + 18, y: handler.y + 12, z: 8 + Math.abs(Math.sin(t * Math.PI * 10)) * 12 };
    if (config.action === "tip") return { x: 480 + t * 280, y: 270 + Math.sin(t * Math.PI * 2) * 18, z: 100 * Math.sin(t * Math.PI) };
    if (config.action === "steal") {
      if (t < 0.42) return lerpPoint(offense[1], defense[2], t / 0.42);
      return lerpPoint(defense[2], { x: 820, y: 318, z: 22 }, (t - 0.42) / 0.58);
    }
    if (["kick", "swing", "roll"].includes(config.action)) {
      if (t < 0.38) return dribble;
      if (t < 0.62) return arcPoint(handler, receiver, (t - 0.38) / 0.24, 34);
      return shotPoint(receiver, rim, (t - 0.62) / 0.38, config.finish);
    }
    if (config.finish === "rebound") {
      if (t < 0.55) return shotPoint(handler, rim, t / 0.55, "miss");
      return arcPoint(rim, shooter, (t - 0.55) / 0.45, 44);
    }
    if (config.finish === "block") {
      if (t < 0.62) return shotPoint(receiver, rim, t / 0.62, "block");
      return arcPoint({ x: 832, y: 258, z: 56 }, { x: 715, y: 322, z: 18 }, (t - 0.62) / 0.38, 26);
    }
    if (t < 0.62) return dribble;
    return shotPoint(shooter, rim, (t - 0.62) / 0.38, config.finish);
  }

  function lerpPoint(a, b, t) {
    const clamped = recapClamp(t, 0, 1);
    return {
      x: a.x + (b.x - a.x) * clamped,
      y: a.y + (b.y - a.y) * clamped,
      z: (a.z || 12) + ((b.z || 12) - (a.z || 12)) * clamped,
    };
  }

  function arcPoint(a, b, t, lift) {
    const point = lerpPoint(a, b, t);
    point.z = (a.z || 14) + ((b.z || 14) - (a.z || 14)) * t + Math.sin(t * Math.PI) * lift;
    return point;
  }

  function shotPoint(from, rim, t, finish) {
    const missOffset = finish === "miss" ? -34 : finish === "block" ? -58 : 0;
    const target = { x: rim.x + missOffset, y: rim.y + (finish === "floater" ? 16 : 0), z: 22 };
    return arcPoint({ x: from.x + 18, y: from.y + 4, z: 24 }, target, t, finish === "layup" || finish === "floater" ? 56 : 92);
  }

  function withJitter(point, jitter) {
    return { x: point.x + jitter.x, y: point.y + jitter.y, z: point.z || 0 };
  }

  function recapClamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function drawRecapCourt(context) {
    context.fillStyle = "#b9783d";
    context.fillRect(0, 0, 960, 540);
    for (let y = 0; y < 540; y += 18) {
      context.fillStyle = y % 36 === 0 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.035)";
      context.fillRect(0, y, 960, 18);
    }
    context.strokeStyle = "#f5dfad";
    context.lineWidth = 5;
    context.strokeRect(38, 48, 884, 444);
    context.beginPath();
    context.moveTo(480, 48);
    context.lineTo(480, 492);
    context.stroke();
    context.beginPath();
    context.arc(480, 270, 62, 0, Math.PI * 2);
    context.stroke();
    drawRecapPaint(context, 38, 230, false);
    drawRecapPaint(context, 730, 922, true);
    drawRecapHoop(context, 76, 270, false);
    drawRecapHoop(context, 884, 270, true);
  }

  function drawRecapPaint(context, laneX, arcX, right) {
    context.strokeRect(laneX, 176, 192, 188);
    context.beginPath();
    context.arc(right ? laneX : laneX + 192, 270, 94, right ? Math.PI / 2 : Math.PI * 1.5, right ? Math.PI * 1.5 : Math.PI / 2);
    context.stroke();
    context.beginPath();
    context.arc(right ? laneX - 10 : laneX + 202, 270, 238, right ? Math.PI * 0.66 : Math.PI * 1.66, right ? Math.PI * 1.34 : Math.PI * 0.34);
    context.stroke();
  }

  function drawRecapHoop(context, x, y, right) {
    const boardX = right ? 888 : 38;
    context.fillStyle = "#a9e4f2";
    context.fillRect(boardX, y - 58, 34, 116);
    context.fillStyle = "#d9fbff";
    context.fillRect(boardX + 3, y - 53, 25, 106);
    context.strokeStyle = "#ff7a2d";
    context.lineWidth = 5;
    context.beginPath();
    context.ellipse(x, y, 32, 13, 0, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = "rgba(245, 239, 219, 0.86)";
    context.lineWidth = 2;
    for (let i = -24; i <= 24; i += 8) {
      context.beginPath();
      context.moveTo(x + i, y + 10);
      context.lineTo(x + i * 0.54, y + 48);
      context.stroke();
    }
  }

  function drawRecapPlayer(context, player) {
    const x = Math.round(player.x);
    const y = Math.round(player.y);
    context.fillStyle = "rgba(0,0,0,0.22)";
    context.fillRect(x - 18, y + 29, 42, 8);
    if (player.featured) {
      context.strokeStyle = "#53da8a";
      context.lineWidth = 3;
      context.strokeRect(x - 25, y - 54, 50, 95);
    }
    context.fillStyle = player.skin;
    context.fillRect(x - 7, y - 43, 15, 15);
    context.fillStyle = player.hair;
    context.fillRect(x - 8, y - 46, 17, 6);
    context.fillStyle = player.color || "#44c0ff";
    context.fillRect(x - 14, y - 26, 28, 34);
    context.fillStyle = player.trim || "#f5efdb";
    context.fillRect(x - 14, y - 26, 28, 5);
    context.fillRect(x - 2, y - 20, 4, 22);
    context.fillStyle = "#f9f0d8";
    context.font = "700 11px system-ui";
    context.textAlign = "center";
    context.fillText(player.number, x, y - 5);
    context.fillStyle = "#2a2522";
    context.fillRect(x - 14, y + 8, 10, 28);
    context.fillRect(x + 5, y + 8, 10, 28);
    context.fillStyle = player.trim || "#f5efdb";
    context.fillRect(x - 18, y + 35, 18, 6);
    context.fillRect(x + 4, y + 35, 18, 6);
    context.fillStyle = player.skin;
    context.fillRect(x - 25, y - 21, 10, 24);
    context.fillRect(x + 15, y - 21, 10, 24);
    context.textAlign = "left";
  }

  function drawRecapBall(context, ball) {
    const size = Math.max(10, 18 - (ball.z || 0) * 0.05);
    context.fillStyle = "rgba(0,0,0,0.22)";
    context.fillRect(Math.round(ball.x - size / 2), Math.round(ball.y + 18), Math.round(size + 4), 5);
    context.fillStyle = "#e87523";
    context.fillRect(Math.round(ball.x - size / 2), Math.round(ball.y - (ball.z || 0) - size / 2), Math.round(size), Math.round(size));
    context.fillStyle = "#5a2c16";
    context.fillRect(Math.round(ball.x - 1), Math.round(ball.y - (ball.z || 0) - size / 2), 2, Math.round(size));
    context.fillRect(Math.round(ball.x - size / 2), Math.round(ball.y - (ball.z || 0) - 1), Math.round(size), 2);
  }

  function drawRecapScoreBug(context, away, home, game) {
    context.fillStyle = "rgba(17, 15, 12, 0.74)";
    context.fillRect(318, 14, 324, 38);
    context.fillStyle = "#f9f0d8";
    context.font = "900 17px system-ui";
    context.textAlign = "center";
    context.fillText(`${away.short} ${game.awayScore}   ${home.short} ${game.homeScore}`, 480, 39);
    context.textAlign = "left";
  }

  function drawRecapActionFlash(context, play, point) {
    context.fillStyle = "#ffce4b";
    context.fillRect(point.x - 44, point.y - (point.z || 0) - 48, 88, 20);
    context.fillStyle = "#17130f";
    context.font = "900 12px system-ui";
    context.textAlign = "center";
    context.fillText(play.type.toUpperCase(), point.x, point.y - (point.z || 0) - 34);
    context.textAlign = "left";
  }

  async function playNextUserGame() {
    const game = userGamesPending()[0];
    const userTeam = gameTeam(league.userTeamId);
    if (game) {
      const userIsHome = game.homeId === league.userTeamId;
      const opponentTeam = gameTeam(userIsHome ? game.awayId : game.homeId);
      showLeagueGameSurface();
      window.scrollTo({ top: 0, behavior: "smooth" });
      api.startPlayableGame(userTeam, opponentTeam, { kind: "regular", id: game.id, actualHomeId: game.homeId, actualAwayId: game.awayId, userIsHome });
      return;
    }
    const playInGame = league.playIn.find((item) => item.status === "scheduled" && (item.highSeedId === league.userTeamId || item.lowSeedId === league.userTeamId));
    if (playInGame) {
      const userIsHome = playInGame.highSeedId === league.userTeamId;
      const opponentTeam = gameTeam(userIsHome ? playInGame.lowSeedId : playInGame.highSeedId);
      showLeagueGameSurface();
      window.scrollTo({ top: 0, behavior: "smooth" });
      api.startPlayableGame(userTeam, opponentTeam, { kind: "playin", playInId: playInGame.id, actualHomeId: playInGame.highSeedId, actualAwayId: playInGame.lowSeedId, userIsHome });
      return;
    }
    const series = activeSeries();
    if (series && (series.teamAId === league.userTeamId || series.teamBId === league.userTeamId)) {
      const userIsHome = series.teamAId === league.userTeamId;
      const opponentTeam = gameTeam(userIsHome ? series.teamBId : series.teamAId);
      showLeagueGameSurface();
      window.scrollTo({ top: 0, behavior: "smooth" });
      api.startPlayableGame(userTeam, opponentTeam, { kind: "series", seriesId: series.id, actualHomeId: series.teamAId, actualAwayId: series.teamBId, userIsHome });
    }
  }

  function completeLiveGame(context, result) {
    const live = context.userIsHome
      ? { homeScore: result.userScore, awayScore: result.opponentScore, homeLines: result.homePlayers, awayLines: result.awayPlayers }
      : { homeScore: result.opponentScore, awayScore: result.userScore, homeLines: result.awayPlayers, awayLines: result.homePlayers };
    const game = context.kind === "regular"
      ? league.games.find((item) => item.id === context.id)
      : { id: `P${league.nextPostseasonGame++}`, type: "postseason", homeId: context.actualHomeId, awayId: context.actualAwayId, status: "scheduled" };
    if (!game || game.status === "final") return null;
    simulateGame(game, live);
    if (context.kind !== "regular") league.games.push(game);
    const winnerId = game.homeScore > game.awayScore ? game.homeId : game.awayId;
    if (context.kind === "playin") {
      const playInGame = league.playIn.find((item) => item.id === context.playInId);
      playInGame.winnerId = winnerId;
      playInGame.loserId = winnerId === playInGame.highSeedId ? playInGame.lowSeedId : playInGame.highSeedId;
      playInGame.status = "final";
      const pi3 = league.playIn.find((item) => item.conference === playInGame.conference && item.label === "Seed 8 Game");
      const pi1 = league.playIn.find((item) => item.conference === playInGame.conference && item.label === "7 vs 8");
      const pi2 = league.playIn.find((item) => item.conference === playInGame.conference && item.label === "9 vs 10");
      if (pi1.status === "final" && pi2.status === "final" && pi3.status === "waiting") {
        pi3.highSeedId = pi1.loserId;
        pi3.lowSeedId = pi2.winnerId;
        pi3.status = "scheduled";
      }
      if (league.playIn.every((item) => item.status === "final")) {
        league.phase = "playoffs";
        buildPlayoffs();
      }
    }
    if (context.kind === "series") {
      const series = league.playoffSeries.find((item) => item.id === context.seriesId);
      series.games.push(winnerId);
      winnerId === series.teamAId ? series.winsA += 1 : series.winsB += 1;
      if (series.winsA === 4 || series.winsB === 4) {
        series.status = "final";
        series.winnerId = series.winsA === 4 ? series.teamAId : series.teamBId;
        maybeBuildNextPlayoffRound();
      }
    }
    return game;
  }

  function hasPlayableUserGame() {
    if (userGamesPending()[0]) return true;
    if (league.playIn.find((item) => item.status === "scheduled" && (item.highSeedId === league.userTeamId || item.lowSeedId === league.userTeamId))) return true;
    const series = activeSeries();
    return Boolean(series && (series.teamAId === league.userTeamId || series.teamBId === league.userTeamId));
  }

  window.PixelCourtLeagueComplete = async (result) => {
    if (!league || !result.context) return;
    completeLiveGame(result.context, result);
    maybeAdvanceSeason();
    await saveLeague();
    render();
  };

  async function handleLeagueAction(action, target) {
    if (action === "play-next") await playNextUserGame();
    if (action === "sim-day") simNextDay(false);
    if (action === "sim-season") while (league.phase === "regular" && simNextDay(true)) {}
    if (action === "resume-schedule") {
      const day = simNextDay(false);
      if (day) {
        boxscoreDay = day;
        const dayFinal = league.games.find((game) => game.day === day && game.status === "final" && game.boxscore && game.homeId !== league.userTeamId && game.awayId !== league.userTeamId);
        watchedGameId = dayFinal ? dayFinal.id : null;
        activeView = "boxscores";
      }
    }
    if (action === "boxscores-recent") {
      boxscoreDay = null;
      watchedGameId = null;
    }
    if (action === "watch-back") watchedGameId = null;
    if (action === "watch-game") watchedGameId = target.dataset.gameId;
    if (action === "schedule-prev") schedulePage = Math.max(0, schedulePage - 1);
    if (action === "schedule-next") schedulePage += 1;
    if (action === "advance-playin") advancePlayIn(false);
    if (action === "sim-playin") while (league.phase === "playin" && advancePlayIn(true)) {}
    if (action === "advance-playoffs") advancePlayoffs(false);
    if (action === "sim-playoffs") while (league.phase === "playoffs" && advancePlayoffs(true)) {}
    maybeAdvanceSeason();
    await saveLeague();
    render();
  }

  function setMode(mode) {
    const leagueMode = mode === "league";
    els.landingPage.classList.add("hidden");
    els.playSurfaces.forEach((surface) => surface.classList.toggle("hidden", leagueMode));
    els.leaguePanel.classList.toggle("hidden", !leagueMode);
    els.oneGameMode.classList.toggle("is-active", !leagueMode);
    els.leagueMode.classList.toggle("is-active", leagueMode);
    if (!leagueMode && !api.state.started) els.teamPicker.classList.remove("hidden");
  }

  function showLeagueGameSurface() {
    els.landingPage.classList.add("hidden");
    els.leaguePanel.classList.add("hidden");
    els.playSurfaces.forEach((surface) => surface.classList.remove("hidden"));
    els.oneGameMode.classList.remove("is-active");
    els.leagueMode.classList.add("is-active");
    els.teamPicker.classList.add("hidden");
  }

  function showLanding() {
    els.landingPage.classList.remove("hidden");
    els.playSurfaces.forEach((surface) => surface.classList.add("hidden"));
    els.leaguePanel.classList.add("hidden");
    els.homeMode.classList.remove("is-active");
    renderLanding();
  }

  async function init() {
    api.nbaTeams.forEach((team, index) => {
      const option = document.createElement("option");
      option.value = team.id;
      option.textContent = team.name;
      if (index === 13) option.selected = true;
      els.leagueTeamSelect.append(option);
    });
    league = await loadSave();
    showLanding();
    els.landingOneGame.addEventListener("click", () => setMode("one"));
    els.landingContinueLeague.addEventListener("click", () => {
      if (!league) return;
      setMode("league");
      render();
    });
    els.landingNewLeague.addEventListener("click", () => {
      setMode("league");
      league = null;
      render();
    });
    els.landingDeleteLeague.addEventListener("click", async () => {
      league = null;
      await deleteSave();
      showLanding();
    });
    els.homeMode.addEventListener("click", showLanding);
    els.leagueHome.addEventListener("click", showLanding);
    els.oneGameMode.addEventListener("click", () => setMode("one"));
    els.leagueMode.addEventListener("click", () => setMode("league"));
    els.startLeague.addEventListener("click", async () => {
      league = createLeague(els.leagueTeamSelect.value);
      await saveLeague();
      render();
    });
    els.newLeague.addEventListener("click", async () => {
      league = null;
      await deleteSave();
      render();
    });
    els.deleteLeague.addEventListener("click", async () => {
      league = null;
      await deleteSave();
      render();
    });
    document.querySelectorAll(".league-tab").forEach((tab) => tab.addEventListener("click", () => {
      activeView = tab.dataset.leagueView;
      watchedGameId = null;
      render();
    }));
    els.leagueView.addEventListener("click", (event) => {
      const target = event.target.closest("[data-league-action]");
      const action = target ? target.dataset.leagueAction : null;
      if (action) handleLeagueAction(action, target);
    });
    render();
  }

  init().catch((error) => {
    els.leagueView.innerHTML = `<div class="league-empty">League storage failed: ${error.message}</div>`;
  });
})();
