const canvas = document.querySelector("#court");
const ctx = canvas.getContext("2d");
const homeScoreEl = document.querySelector("#homeScore");
const awayScoreEl = document.querySelector("#awayScore");
const clockEl = document.querySelector("#clock");
const shotMeterEl = document.querySelector("#shotMeter");
const toastEl = document.querySelector("#toast");
const homeTeamLabelEl = document.querySelector("#homeTeamLabel");
const awayTeamLabelEl = document.querySelector("#awayTeamLabel");
const homeTeamLogoEl = document.querySelector("#homeTeamLogo");
const awayTeamLogoEl = document.querySelector("#awayTeamLogo");
const teamPickerEl = document.querySelector("#teamPicker");
const teamSelectEl = document.querySelector("#teamSelect");
const opponentTeamSelectEl = document.querySelector("#opponentTeamSelect");
const startGameEl = document.querySelector("#startGame");
const pauseGameEl = document.querySelector("#pauseGame");
const homeStatsLabelEl = document.querySelector("#homeStatsLabel");
const awayStatsLabelEl = document.querySelector("#awayStatsLabel");
const homeStatsEl = document.querySelector("#homeStats");
const awayStatsEl = document.querySelector("#awayStats");
const touchControlEls = document.querySelectorAll("[data-hold-key], [data-action], [data-shoot-control]");
const pauseControlEls = document.querySelectorAll("#pauseGame, [data-action='togglePause']");

const W = canvas.width;
const H = canvas.height;
const keys = new Set();
const hoop = { x: W - 76, y: H / 2, r: 28, side: "right" };
const awayHoop = { x: 76, y: H / 2, r: 28, side: "left" };
const REGULATION_QUARTERS = 4;
const QUARTER_SECONDS = 120;
const OVERTIME_SECONDS = 30;
const centerCourtLogo = new Image();
const centerCourtLogoState = { team: null, ready: false, retryTimer: null };

const state = {
  home: 0,
  away: 0,
  time: QUARTER_SECONDS,
  quarter: 1,
  period: "Q1",
  overtimeCount: 0,
  messageTimer: 0,
  shotHold: 0,
  charging: false,
  paused: false,
  started: false,
  gameOver: false,
  leagueGameContext: null,
  leagueResultReported: false,
  lastShooter: null,
  stealTimer: 0,
  stealCooldown: 0,
  blockCooldown: 0,
  cpuStealCooldown: 0,
  cpuBlockCooldown: 0,
  actionFlash: null,
  jumpBall: false,
  jumpTimer: 0,
  jumpPressed: false,
  team: null,
  opponent: null,
};

const nbaTeams = [
  { id: "1610612737", name: "Atlanta Hawks", short: "Hawks", color: "#e03a3e", altColor: "#111111", trim: "#c1d32f", players: ["Trae Young", "Dyson Daniels", "Zaccharie Risacher", "Jalen Johnson", "Onyeka Okongwu"] },
  { id: "1610612738", name: "Boston Celtics", short: "Celtics", color: "#007a33", altColor: "#f5efdb", trim: "#f5efdb", players: ["Jaylen Brown", "Derrick White", "Payton Pritchard", "Sam Hauser", "Neemias Queta"] },
  { id: "1610612751", name: "Brooklyn Nets", short: "Nets", color: "#202020", altColor: "#f5efdb", trim: "#f5efdb", players: ["Cam Thomas", "Michael Porter Jr.", "Nic Claxton", "Terance Mann", "Egor Demin"] },
  { id: "1610612766", name: "Charlotte Hornets", short: "Hornets", color: "#1d8cab", altColor: "#201747", trim: "#a1a1a4", players: ["LaMelo Ball", "Brandon Miller", "Miles Bridges", "Kon Knueppel", "Mark Williams"] },
  { id: "1610612741", name: "Chicago Bulls", short: "Bulls", color: "#ce1141", altColor: "#111111", trim: "#f5efdb", players: ["Coby White", "Josh Giddey", "Matas Buzelis", "Ayo Dosunmu", "Nikola Vucevic"] },
  { id: "1610612739", name: "Cleveland Cavaliers", short: "Cavs", color: "#6f263d", altColor: "#041e42", trim: "#ffb81c", players: ["Donovan Mitchell", "Darius Garland", "Evan Mobley", "Jarrett Allen", "De'Andre Hunter"] },
  { id: "1610612742", name: "Dallas Mavericks", short: "Mavs", color: "#00538c", altColor: "#b8c4ca", trim: "#b8c4ca", players: ["Anthony Davis", "Kyrie Irving", "Cooper Flagg", "Klay Thompson", "Dereck Lively II"] },
  { id: "1610612743", name: "Denver Nuggets", short: "Nuggets", color: "#0e2240", altColor: "#8b2131", trim: "#fec524", players: ["Nikola Jokic", "Jamal Murray", "Aaron Gordon", "Christian Braun", "Cam Johnson"] },
  { id: "1610612765", name: "Detroit Pistons", short: "Pistons", color: "#1d42ba", altColor: "#c8102e", trim: "#c8102e", players: ["Cade Cunningham", "Jaden Ivey", "Ausar Thompson", "Tobias Harris", "Jalen Duren"] },
  { id: "1610612744", name: "Golden State Warriors", short: "Warriors", color: "#1d428a", altColor: "#ffc72c", trim: "#ffc72c", players: ["Stephen Curry", "Jimmy Butler III", "Draymond Green", "Jonathan Kuminga", "Brandin Podziemski"] },
  { id: "1610612745", name: "Houston Rockets", short: "Rockets", color: "#ce1141", altColor: "#111111", trim: "#f5efdb", players: ["Kevin Durant", "Alperen Sengun", "Amen Thompson", "Jalen Green", "Jabari Smith Jr."] },
  { id: "1610612754", name: "Indiana Pacers", short: "Pacers", color: "#002d62", altColor: "#fdbb30", trim: "#fdbb30", players: ["Tyrese Haliburton", "Pascal Siakam", "Bennedict Mathurin", "Andrew Nembhard", "Myles Turner"] },
  { id: "1610612746", name: "LA Clippers", short: "Clippers", color: "#c8102e", altColor: "#1d428a", trim: "#1d428a", players: ["James Harden", "Kawhi Leonard", "Ivica Zubac", "Bogdan Bogdanovic", "Derrick Jones Jr."] },
  { id: "1610612747", name: "Los Angeles Lakers", short: "Lakers", color: "#552583", altColor: "#fdb927", trim: "#fdb927", players: ["Luka Doncic", "LeBron James", "Deandre Ayton", "Rui Hachimura", "Austin Reaves"] },
  { id: "1610612763", name: "Memphis Grizzlies", short: "Grizzlies", color: "#5d76a9", altColor: "#12173f", trim: "#f5b112", players: ["Ja Morant", "Jaren Jackson Jr.", "Desmond Bane", "Zach Edey", "Scotty Pippen Jr."] },
  { id: "1610612748", name: "Miami Heat", short: "Heat", color: "#98002e", altColor: "#111111", trim: "#f9a01b", players: ["Bam Adebayo", "Tyler Herro", "Andrew Wiggins", "Kel'el Ware", "Jaime Jaquez Jr."] },
  { id: "1610612749", name: "Milwaukee Bucks", short: "Bucks", color: "#00471b", altColor: "#eee1c6", trim: "#eee1c6", players: ["Giannis Antetokounmpo", "Damian Lillard", "Kyle Kuzma", "Bobby Portis", "Brook Lopez"] },
  { id: "1610612750", name: "Minnesota Timberwolves", short: "Wolves", color: "#0c2340", altColor: "#78be20", trim: "#78be20", players: ["Anthony Edwards", "Julius Randle", "Rudy Gobert", "Jaden McDaniels", "Naz Reid"] },
  { id: "1610612740", name: "New Orleans Pelicans", short: "Pelicans", color: "#0c2340", altColor: "#b4975a", trim: "#c8102e", players: ["Zion Williamson", "Dejounte Murray", "Trey Murphy III", "Herbert Jones", "Yves Missi"] },
  { id: "1610612752", name: "New York Knicks", short: "Knicks", color: "#006bb6", altColor: "#f58426", trim: "#f58426", players: ["Jalen Brunson", "Karl-Anthony Towns", "OG Anunoby", "Mikal Bridges", "Josh Hart"] },
  { id: "1610612760", name: "Oklahoma City Thunder", short: "Thunder", color: "#007ac1", altColor: "#ef3b24", trim: "#ef3b24", players: ["Shai Gilgeous-Alexander", "Jalen Williams", "Chet Holmgren", "Luguentz Dort", "Isaiah Hartenstein"] },
  { id: "1610612753", name: "Orlando Magic", short: "Magic", color: "#0077c0", altColor: "#111111", trim: "#c4ced4", players: ["Paolo Banchero", "Franz Wagner", "Jalen Suggs", "Wendell Carter Jr.", "Desmond Bane"] },
  { id: "1610612755", name: "Philadelphia 76ers", short: "76ers", color: "#006bb6", altColor: "#ed174c", trim: "#ed174c", players: ["Joel Embiid", "Tyrese Maxey", "Paul George", "Jared McCain", "Kelly Oubre Jr."] },
  { id: "1610612756", name: "Phoenix Suns", short: "Suns", color: "#1d1160", altColor: "#e56020", trim: "#e56020", players: ["Devin Booker", "Jalen Green", "Dillon Brooks", "Mark Williams", "Grayson Allen"] },
  { id: "1610612757", name: "Portland Trail Blazers", short: "Blazers", color: "#e03a3e", altColor: "#111111", trim: "#f5efdb", players: ["Deni Avdija", "Scoot Henderson", "Shaedon Sharpe", "Jerami Grant", "Donovan Clingan"] },
  { id: "1610612758", name: "Sacramento Kings", short: "Kings", color: "#5a2d81", altColor: "#c4ced4", trim: "#c4ced4", players: ["Domantas Sabonis", "Zach LaVine", "DeMar DeRozan", "Keegan Murray", "Malik Monk"] },
  { id: "1610612759", name: "San Antonio Spurs", short: "Spurs", color: "#2e2e2e", altColor: "#f5efdb", trim: "#c4ced4", players: ["Victor Wembanyama", "De'Aaron Fox", "Stephon Castle", "Devin Vassell", "Harrison Barnes"] },
  { id: "1610612761", name: "Toronto Raptors", short: "Raptors", color: "#ce1141", altColor: "#111111", trim: "#a1a1a4", players: ["Scottie Barnes", "Brandon Ingram", "RJ Barrett", "Immanuel Quickley", "Jakob Poeltl"] },
  { id: "1610612762", name: "Utah Jazz", short: "Jazz", color: "#002b5c", altColor: "#f9a01b", trim: "#f9a01b", players: ["Lauri Markkanen", "Keyonte George", "Walker Kessler", "Taylor Hendricks", "Collin Sexton"] },
  { id: "1610612764", name: "Washington Wizards", short: "Wizards", color: "#002b5c", altColor: "#e31837", trim: "#e31837", players: ["Alex Sarr", "Bilal Coulibaly", "CJ McCollum", "Khris Middleton", "Corey Kispert"] },
];

const homeSpots = [
  { x: 165, y: H / 2 },
  { x: 286, y: 116 },
  { x: 292, y: 424 },
  { x: 500, y: 190 },
  { x: 520, y: 350 },
];

const awaySpots = [
  { x: 665, y: H / 2 + 16 },
  { x: 770, y: 116 },
  { x: 770, y: 424 },
  { x: 850, y: 190 },
  { x: 850, y: 350 },
];

const homePersonalities = [
  { name: "Ace", role: "Shot Creator", hair: "#151515", skin: "#7a4a2b" },
  { name: "Dash", role: "Playmaker", hair: "#f0d16b", skin: "#9c6644" },
  { name: "Jax", role: "Lockdown", hair: "#2d1c12", skin: "#5c3424" },
  { name: "Rio", role: "Sharpshooter", hair: "#3b2a22", skin: "#b47a4f" },
  { name: "Mack", role: "Big", hair: "#111111", skin: "#6d3f28" },
];

const awayPersonalities = [
  { name: "Blaze", role: "Scorer", hair: "#1a1110", skin: "#8b5a3c" },
  { name: "Vex", role: "Thief", hair: "#d7d7d7", skin: "#65402e" },
  { name: "Knox", role: "Rim Guard", hair: "#24170e", skin: "#4d2d20" },
  { name: "Trey", role: "Shooter", hair: "#100f0f", skin: "#a66d45" },
  { name: "Zero", role: "Floor General", hair: "#3a281c", skin: "#c18a5d" },
];

function emptyStats() {
  return {
    points: 0,
    assists: 0,
    rebounds: 0,
    steals: 0,
    blocks: 0,
    fieldGoalsMade: 0,
    fieldGoalsAttempted: 0,
    threePointersMade: 0,
    threePointersAttempted: 0,
  };
}

const homeTeam = homeSpots.map((spot, index) => ({
  id: `home-${index}`,
  team: "home",
  number: index + 1,
  name: homePersonalities[index].name,
  role: homePersonalities[index].role,
  hair: homePersonalities[index].hair,
  skin: homePersonalities[index].skin,
  stats: emptyStats(),
  x: spot.x,
  y: spot.y,
  vx: 0,
  vy: 0,
  roamTarget: null,
  roamTimer: 0,
  roamPhase: Math.random() * Math.PI * 2,
  homeSpot: spot,
  color: "#44c0ff",
  trim: index === 0 ? "#f5efdb" : "#bdefff",
  facing: 1,
  radius: 18,
}));

const awayTeam = awaySpots.map((spot, index) => ({
  id: `away-${index}`,
  team: "away",
  number: index + 1,
  name: awayPersonalities[index].name,
  role: awayPersonalities[index].role,
  hair: awayPersonalities[index].hair,
  skin: awayPersonalities[index].skin,
  stats: emptyStats(),
  x: spot.x,
  y: spot.y,
  vx: 0,
  vy: 0,
  roamTarget: null,
  roamTimer: 0,
  homeSpot: spot,
  color: "#e7473c",
  trim: index === 0 ? "#ffce4b" : "#ffd6a1",
  facing: -1,
  radius: 18,
}));

const allPlayers = [...homeTeam, ...awayTeam];

const ball = {
  x: homeTeam[0].x + 22,
  y: homeTeam[0].y + 14,
  vx: 0,
  vy: 0,
  z: 0,
  vz: 0,
  owner: homeTeam[0],
  shot: false,
  pass: false,
  target: null,
  lastPasser: null,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function moveToward(body, targetX, targetY, speed, dt) {
  const dx = targetX - body.x;
  const dy = targetY - body.y;
  const mag = Math.hypot(dx, dy);
  if (mag < 2) {
    body.vx = 0;
    body.vy = 0;
    return;
  }
  body.vx = (dx / mag) * Math.min(speed, mag / dt);
  body.vy = (dy / mag) * Math.min(speed, mag / dt);
  body.x = clamp(body.x + body.vx * dt, 55, W - 120);
  body.y = clamp(body.y + body.vy * dt, 84, H - 84);
  if (Math.abs(body.vx) > 1) body.facing = Math.sign(body.vx);
}

function moveCurved(body, targetX, targetY, speed, dt, phase) {
  const dx = targetX - body.x;
  const dy = targetY - body.y;
  const mag = Math.hypot(dx, dy);
  if (mag < 2) {
    body.vx = Math.cos(phase) * speed * 0.28;
    body.vy = Math.sin(phase) * speed * 0.28;
  } else {
    const nx = dx / mag;
    const ny = dy / mag;
    const swirl = Math.sin(performance.now() / 180 + phase) * 0.9;
    body.vx = (nx + -ny * swirl) * speed;
    body.vy = (ny + nx * swirl) * speed;
    const moveMag = Math.hypot(body.vx, body.vy) || 1;
    body.vx = (body.vx / moveMag) * Math.min(speed, Math.max(20, mag / dt));
    body.vy = (body.vy / moveMag) * Math.min(speed, Math.max(20, mag / dt));
  }
  body.x = clamp(body.x + body.vx * dt, 55, W - 120);
  body.y = clamp(body.y + body.vy * dt, 84, H - 84);
  if (Math.abs(body.vx) > 1) body.facing = Math.sign(body.vx);
}

function announce(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  state.messageTimer = 1.9;
}

function setupTeamPicker() {
  nbaTeams.forEach((team, index) => {
    const yourOption = document.createElement("option");
    yourOption.value = String(index);
    yourOption.textContent = team.name;
    teamSelectEl.append(yourOption);

    const opponentOption = document.createElement("option");
    opponentOption.value = String(index);
    opponentOption.textContent = team.name;
    opponentTeamSelectEl.append(opponentOption);
  });
  teamSelectEl.value = "13";
  opponentTeamSelectEl.value = "1";
  startGameEl.addEventListener("click", startGame);
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function teamLogoUrl(identity) {
  return `https://cdn.nba.com/logos/nba/${identity.id}/primary/L/logo.svg`;
}

function updateBadge(element, identity) {
  const image = element.querySelector("img");
  element.classList.remove("logo-fallback");
  element.dataset.fallback = initials(identity.short);
  if (image && identity.id) {
    image.src = teamLogoUrl(identity);
    image.onload = () => {
      element.classList.remove("logo-fallback");
      element.textContent = "";
      element.append(image);
    };
    image.onerror = () => {
      element.classList.add("logo-fallback");
      element.textContent = element.dataset.fallback;
    };
  } else {
    element.classList.add("logo-fallback");
    element.textContent = element.dataset.fallback;
  }
  element.style.setProperty("--badge-color", identity.color);
  element.style.setProperty("--badge-trim", identity.trim);
}

function updateCenterCourtLogo(team) {
  if (centerCourtLogoState.retryTimer) {
    clearTimeout(centerCourtLogoState.retryTimer);
    centerCourtLogoState.retryTimer = null;
  }
  centerCourtLogoState.team = team;
  centerCourtLogoState.ready = false;
  centerCourtLogo.onload = () => {
    if (centerCourtLogoState.team === team) centerCourtLogoState.ready = true;
  };
  centerCourtLogo.onerror = () => {
    if (centerCourtLogoState.team !== team) return;
    centerCourtLogoState.retryTimer = setTimeout(() => updateCenterCourtLogo(team), 1200);
  };
  centerCourtLogo.src = teamLogoUrl(team);
}

function shortPlayerName(name) {
  const parts = name.split(" ");
  return parts.length > 1 ? parts[parts.length - 1] : name;
}

function fieldGoalLine(stats) {
  const pct = stats.fieldGoalsAttempted ? Math.round((stats.fieldGoalsMade / stats.fieldGoalsAttempted) * 100) : 0;
  return `${pct}% ${stats.fieldGoalsMade}/${stats.fieldGoalsAttempted}`;
}

function threePointLine(stats) {
  const pct = stats.threePointersAttempted ? Math.round((stats.threePointersMade / stats.threePointersAttempted) * 100) : 0;
  return `${pct}% ${stats.threePointersMade}/${stats.threePointersAttempted}`;
}

function statRow(player, header) {
  if (header) {
    return '<div class="stats-row stats-header"><span>#</span><span>Name</span><span>FG</span><span>3P</span><span>PTS</span><span>AST</span><span>REB</span><span>STL</span><span>BLK</span></div>';
  }
  return `<div class="stats-row"><span class="stat-num">${player.number}</span><span class="stat-name">${shortPlayerName(player.name)}</span><span class="stat-value">${fieldGoalLine(player.stats)}</span><span class="stat-value">${threePointLine(player.stats)}</span><span class="stat-value">${player.stats.points}</span><span class="stat-value">${player.stats.assists}</span><span class="stat-value">${player.stats.rebounds}</span><span class="stat-value">${player.stats.steals}</span><span class="stat-value">${player.stats.blocks}</span></div>`;
}

function updateStatsPanel() {
  homeStatsLabelEl.textContent = `${state.team ? state.team.short : "Home"} Stats`;
  awayStatsLabelEl.textContent = `${state.opponent ? state.opponent.short : "Away"} Stats`;
  homeStatsEl.innerHTML = statRow(null, true) + homeTeam.map((player) => statRow(player)).join("");
  awayStatsEl.innerHTML = statRow(null, true) + awayTeam.map((player) => statRow(player)).join("");
}

function jerseyNumberFor(name, fallback) {
  return Object.prototype.hasOwnProperty.call(jerseyNumbers, name) ? jerseyNumbers[name] : fallback;
}

const jerseyNumbers = {
  "Trae Young": 11,
  "Dyson Daniels": 5,
  "Zaccharie Risacher": 10,
  "Jalen Johnson": 1,
  "Onyeka Okongwu": 17,
  "Jaylen Brown": 7,
  "Derrick White": 9,
  "Payton Pritchard": 11,
  "Sam Hauser": 30,
  "Neemias Queta": 88,
  "Cam Thomas": 24,
  "Michael Porter Jr.": 1,
  "Nic Claxton": 33,
  "Terance Mann": 14,
  "Egor Demin": 3,
  "LaMelo Ball": 1,
  "Brandon Miller": 24,
  "Miles Bridges": 0,
  "Kon Knueppel": 7,
  "Mark Williams": 5,
  "Coby White": 0,
  "Josh Giddey": 3,
  "Matas Buzelis": 14,
  "Ayo Dosunmu": 12,
  "Nikola Vucevic": 9,
  "Donovan Mitchell": 45,
  "Darius Garland": 10,
  "Evan Mobley": 4,
  "Jarrett Allen": 31,
  "De'Andre Hunter": 12,
  "Anthony Davis": 3,
  "Kyrie Irving": 11,
  "Cooper Flagg": 32,
  "Klay Thompson": 31,
  "Dereck Lively II": 2,
  "Nikola Jokic": 15,
  "Jamal Murray": 27,
  "Aaron Gordon": 32,
  "Christian Braun": 0,
  "Cam Johnson": 23,
  "Cade Cunningham": 2,
  "Jaden Ivey": 23,
  "Ausar Thompson": 9,
  "Tobias Harris": 12,
  "Jalen Duren": 0,
  "Stephen Curry": 30,
  "Jimmy Butler III": 10,
  "Draymond Green": 23,
  "Jonathan Kuminga": "00",
  "Brandin Podziemski": 2,
  "Kevin Durant": 7,
  "Alperen Sengun": 28,
  "Amen Thompson": 1,
  "Jalen Green": 4,
  "Jabari Smith Jr.": 10,
  "Tyrese Haliburton": 0,
  "Pascal Siakam": 43,
  "Bennedict Mathurin": "00",
  "Andrew Nembhard": 2,
  "Myles Turner": 33,
  "James Harden": 1,
  "Kawhi Leonard": 2,
  "Ivica Zubac": 40,
  "Bogdan Bogdanovic": 10,
  "Derrick Jones Jr.": 55,
  "Luka Doncic": 77,
  "LeBron James": 23,
  "Deandre Ayton": 5,
  "Rui Hachimura": 28,
  "Austin Reaves": 15,
  "Ja Morant": 12,
  "Jaren Jackson Jr.": 13,
  "Desmond Bane": 22,
  "Zach Edey": 14,
  "Scotty Pippen Jr.": 1,
  "Bam Adebayo": 13,
  "Tyler Herro": 14,
  "Andrew Wiggins": 22,
  "Kel'el Ware": 7,
  "Jaime Jaquez Jr.": 11,
  "Giannis Antetokounmpo": 34,
  "Damian Lillard": 0,
  "Kyle Kuzma": 18,
  "Bobby Portis": 9,
  "Brook Lopez": 11,
  "Anthony Edwards": 5,
  "Julius Randle": 30,
  "Rudy Gobert": 27,
  "Jaden McDaniels": 3,
  "Naz Reid": 11,
  "Zion Williamson": 1,
  "Dejounte Murray": 5,
  "Trey Murphy III": 25,
  "Herbert Jones": 2,
  "Yves Missi": 21,
  "Jalen Brunson": 11,
  "Karl-Anthony Towns": 32,
  "OG Anunoby": 8,
  "Mikal Bridges": 25,
  "Josh Hart": 3,
  "Shai Gilgeous-Alexander": 2,
  "Jalen Williams": 8,
  "Chet Holmgren": 7,
  "Luguentz Dort": 5,
  "Isaiah Hartenstein": 55,
  "Paolo Banchero": 5,
  "Franz Wagner": 22,
  "Jalen Suggs": 4,
  "Wendell Carter Jr.": 34,
  "Joel Embiid": 21,
  "Tyrese Maxey": 0,
  "Paul George": 8,
  "Jared McCain": 20,
  "Kelly Oubre Jr.": 9,
  "Devin Booker": 1,
  "Dillon Brooks": 9,
  "Grayson Allen": 8,
  "Deni Avdija": 8,
  "Scoot Henderson": "00",
  "Shaedon Sharpe": 17,
  "Jerami Grant": 9,
  "Donovan Clingan": 23,
  "Domantas Sabonis": 11,
  "Zach LaVine": 8,
  "DeMar DeRozan": 10,
  "Keegan Murray": 13,
  "Malik Monk": 0,
  "Victor Wembanyama": 1,
  "De'Aaron Fox": 4,
  "Stephon Castle": 5,
  "Devin Vassell": 24,
  "Harrison Barnes": 40,
  "Scottie Barnes": 4,
  "Brandon Ingram": 14,
  "RJ Barrett": 9,
  "Immanuel Quickley": 5,
  "Jakob Poeltl": 19,
  "Lauri Markkanen": 23,
  "Keyonte George": 3,
  "Walker Kessler": 24,
  "Taylor Hendricks": 0,
  "Collin Sexton": 2,
  "Alex Sarr": 20,
  "Bilal Coulibaly": 0,
  "CJ McCollum": 3,
  "Khris Middleton": 22,
  "Corey Kispert": 24,
};

const defaultLook = { skin: "#8b5a3c", hair: "#17110c", hairStyle: "short", beard: false, headband: false, sleeve: false, scale: 1, build: 0 };
const playerLooks = {
  "Trae Young": { skin: "#8c5a3b", hair: "#17110c", hairStyle: "puffs", beard: true, scale: 0.94, build: -1 },
  "Jaylen Brown": { skin: "#5f3926", hair: "#0d0b09", hairStyle: "high", beard: true, scale: 1.02, build: 1 },
  "Derrick White": { skin: "#9b6644", hair: "#21150e", hairStyle: "balding", beard: true, headband: true, scale: 0.96, build: -1 },
  "LaMelo Ball": { skin: "#a86f48", hair: "#3c2518", hairStyle: "curls", beard: false, scale: 0.99, build: -1 },
  "Donovan Mitchell": { skin: "#70442d", hair: "#11100d", hairStyle: "short", beard: true, headband: true, scale: 0.96, build: 0 },
  "Anthony Davis": { skin: "#5a3424", hair: "#0d0a08", hairStyle: "short", beard: true, headband: true, scale: 1.12, build: 2 },
  "Kyrie Irving": { skin: "#6b402a", hair: "#11100d", hairStyle: "short", beard: true, scale: 0.96, build: 0 },
  "Klay Thompson": { skin: "#9f6846", hair: "#17110d", hairStyle: "short", beard: true, headband: true, scale: 1, build: 0 },
  "Nikola Jokic": { skin: "#c89262", hair: "#5a3924", hairStyle: "short", beard: false, scale: 1.13, build: 2 },
  "Jamal Murray": { skin: "#8e5e42", hair: "#16100c", hairStyle: "short", beard: true, scale: 0.98, build: 0 },
  "Cade Cunningham": { skin: "#74482f", hair: "#15100d", hairStyle: "short", beard: true, scale: 1.04, build: 0 },
  "Stephen Curry": { skin: "#b77950", hair: "#3a2519", hairStyle: "short", beard: true, sleeve: true, scale: 0.94, build: -1 },
  "Jimmy Butler III": { skin: "#5e3826", hair: "#100d0b", hairStyle: "twists", beard: true, headband: true, scale: 1.02, build: 1 },
  "Draymond Green": { skin: "#5b3624", hair: "#0d0b09", hairStyle: "short", beard: true, scale: 1.02, build: 2 },
  "Kevin Durant": { skin: "#664029", hair: "#17110d", hairStyle: "thin", beard: true, sleeve: true, scale: 1.13, build: 0 },
  "Alperen Sengun": { skin: "#c48658", hair: "#4a2f20", hairStyle: "short", beard: true, scale: 1.05, build: 1 },
  "Tyrese Haliburton": { skin: "#805137", hair: "#11100c", hairStyle: "short", beard: true, headband: true, scale: 1, build: -1 },
  "James Harden": { skin: "#5f3826", hair: "#100d0b", hairStyle: "short", beard: true, scale: 1, build: 1 },
  "Kawhi Leonard": { skin: "#5e3a27", hair: "#11100d", hairStyle: "braids", beard: true, scale: 1.02, build: 1 },
  "Luka Doncic": { skin: "#d29a68", hair: "#7a4a2d", hairStyle: "sweep", beard: true, scale: 1.03, build: 1 },
  "LeBron James": { skin: "#6a4029", hair: "#0f0d0a", hairStyle: "short", beard: true, headband: true, sleeve: true, scale: 1.08, build: 2 },
  "Deandre Ayton": { skin: "#5f3926", hair: "#11100c", hairStyle: "short", beard: true, scale: 1.12, build: 2 },
  "Austin Reaves": { skin: "#d3a06f", hair: "#8a5a35", hairStyle: "sweep", beard: false, scale: 0.97, build: -1 },
  "Ja Morant": { skin: "#75472f", hair: "#23160f", hairStyle: "locs", beard: false, headband: true, scale: 0.96, build: -1 },
  "Jaren Jackson Jr.": { skin: "#6d422c", hair: "#11100c", hairStyle: "short", beard: true, scale: 1.08, build: 1 },
  "Bam Adebayo": { skin: "#65402b", hair: "#11100c", hairStyle: "short", beard: true, scale: 1.06, build: 2 },
  "Tyler Herro": { skin: "#d19b6a", hair: "#7a4a2d", hairStyle: "sweep", beard: false, sleeve: true, scale: 0.96, build: -1 },
  "Giannis Antetokounmpo": { skin: "#553422", hair: "#11100c", hairStyle: "short", beard: true, scale: 1.16, build: 2 },
  "Damian Lillard": { skin: "#70452f", hair: "#11100c", hairStyle: "short", beard: true, scale: 0.94, build: 0 },
  "Anthony Edwards": { skin: "#5e3928", hair: "#100d0b", hairStyle: "short", beard: true, scale: 0.99, build: 1 },
  "Rudy Gobert": { skin: "#bb8458", hair: "#3d2719", hairStyle: "short", beard: true, scale: 1.18, build: 2 },
  "Zion Williamson": { skin: "#60402f", hair: "#11100c", hairStyle: "short", beard: true, scale: 1.04, build: 3 },
  "Jalen Brunson": { skin: "#7c5038", hair: "#14100d", hairStyle: "short", beard: true, scale: 0.92, build: 0 },
  "Karl-Anthony Towns": { skin: "#8d5b3c", hair: "#17110d", hairStyle: "short", beard: true, scale: 1.12, build: 2 },
  "Shai Gilgeous-Alexander": { skin: "#70452e", hair: "#11100c", hairStyle: "short", beard: true, sleeve: true, scale: 1, build: -1 },
  "Chet Holmgren": { skin: "#d9aa75", hair: "#8b623d", hairStyle: "short", beard: false, scale: 1.2, build: -2 },
  "Paolo Banchero": { skin: "#a66e48", hair: "#291a12", hairStyle: "curls", beard: false, scale: 1.06, build: 1 },
  "Joel Embiid": { skin: "#5b3826", hair: "#11100c", hairStyle: "short", beard: true, headband: true, scale: 1.15, build: 2 },
  "Tyrese Maxey": { skin: "#70452d", hair: "#11100c", hairStyle: "short", beard: true, scale: 0.93, build: -1 },
  "Devin Booker": { skin: "#b57a51", hair: "#2f1f15", hairStyle: "short", beard: true, sleeve: true, scale: 0.98, build: 0 },
  "Domantas Sabonis": { skin: "#d4a171", hair: "#6b4329", hairStyle: "short", beard: true, scale: 1.08, build: 2 },
  "Victor Wembanyama": { skin: "#8f5f42", hair: "#1b120d", hairStyle: "short", beard: false, scale: 1.24, build: -1 },
  "De'Aaron Fox": { skin: "#70452d", hair: "#11100c", hairStyle: "short", beard: true, scale: 0.96, build: -1 },
  "Scottie Barnes": { skin: "#5f3a27", hair: "#11100c", hairStyle: "short", beard: false, scale: 1.03, build: 1 },
  "Lauri Markkanen": { skin: "#ddb17f", hair: "#ba7a42", hairStyle: "short", beard: true, scale: 1.12, build: 1 },
  "Alex Sarr": { skin: "#65402b", hair: "#11100c", hairStyle: "short", beard: false, scale: 1.13, build: 0 },
};

function lookFor(name) {
  return Object.assign({}, defaultLook, playerLooks[name] || {});
}

function colorDistance(first, second) {
  const a = first.replace("#", "").match(/.{2}/g).map((part) => parseInt(part, 16));
  const b = second.replace("#", "").match(/.{2}/g).map((part) => parseInt(part, 16));
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function awayUniformColor(team, opponent) {
  return colorDistance(team.color, opponent.color) < 95 ? opponent.altColor || opponent.trim : opponent.color;
}

function applyTeamIdentity(team, opponent) {
  state.team = team;
  state.opponent = opponent;
  homeTeamLabelEl.textContent = `${team.short} (You)`;
  awayTeamLabelEl.textContent = opponent.short;
  updateBadge(homeTeamLogoEl, team);
  updateBadge(awayTeamLogoEl, opponent);
  updateCenterCourtLogo(team);
  const opponentJersey = awayUniformColor(team, opponent);
  const opponentTrim = opponentJersey === opponent.color ? opponent.trim : opponent.color;
  homeTeam.forEach((player, index) => {
    player.name = team.players[index] || player.name;
    player.number = jerseyNumberFor(player.name, index + 1);
    Object.assign(player, lookFor(player.name));
    player.color = team.color;
    player.trim = index === 0 ? team.trim : "#f5efdb";
  });
  awayTeam.forEach((player, index) => {
    player.name = opponent.players[index] || player.name;
    player.number = jerseyNumberFor(player.name, index + 1);
    Object.assign(player, lookFor(player.name));
    player.color = opponentJersey;
    player.trim = index === 0 ? opponentTrim : "#ffd6a1";
  });
  updateStatsPanel();
}

function startGame() {
  const team = nbaTeams[Number(teamSelectEl.value)] || nbaTeams[0];
  let opponent = nbaTeams[Number(opponentTeamSelectEl.value)] || nbaTeams[1];
  if (opponent === team) {
    opponent = nbaTeams[(nbaTeams.indexOf(team) + 1) % nbaTeams.length];
    opponentTeamSelectEl.value = String(nbaTeams.indexOf(opponent));
  }
  applyTeamIdentity(team, opponent);
  state.started = true;
  state.leagueGameContext = null;
  state.leagueResultReported = false;
  teamPickerEl.classList.add("hidden");
  restart();
  announce(`${team.short} vs ${opponent.short}. Jump ball.`);
}

function startShotCharge() {
  if (!state.started || state.paused) return;
  if (state.jumpBall) {
    attemptJumpBall();
    return;
  }
  if (!state.charging && ball.owner && ball.owner.team === "home" && !state.gameOver) {
    state.charging = true;
    state.shotHold = 0;
  }
}

function releaseShotCharge() {
  if (!state.started || !state.charging) return;
  state.charging = false;
  shoot();
  state.shotHold = 0;
}

function nearestPlayer(team, point) {
  return team.reduce((best, player) => (distance(player, point) < distance(best, point) ? player : best), team[0]);
}

function closestDefender(player) {
  return awayTeam.reduce((best, defender) => (distance(defender, player) < distance(best, player) ? defender : best), awayTeam[0]);
}

function closestHomeDefender(player) {
  return homeTeam.reduce((best, defender) => (distance(defender, player) < distance(best, player) ? defender : best), homeTeam[0]);
}

function isThreePointAttempt(shooter) {
  return shooter.team === "home" ? shooter.x < W - 360 : shooter.x > 360;
}

function userControlledPlayer() {
  if (ball.owner && ball.owner.team === "home") return ball.owner;
  if (ball.owner && ball.owner.team === "away") return closestHomeDefender(ball.owner);
  return null;
}

function randomAwayRoamTarget(index) {
  const lanes = [
    { x: [150, 245], y: [208, 332] },
    { x: [235, 345], y: [78, 176] },
    { x: [235, 345], y: [364, 462] },
    { x: [310, 420], y: [162, 252] },
    { x: [310, 420], y: [288, 378] },
  ];
  const lane = lanes[index] || lanes[Math.floor(Math.random() * lanes.length)];
  return {
    x: lane.x[0] + Math.random() * (lane.x[1] - lane.x[0]),
    y: lane.y[0] + Math.random() * (lane.y[1] - lane.y[0]),
  };
}

function curvedRoamPoint(player, index) {
  const t = performance.now() / (230 + index * 31) + player.roamPhase;
  return {
    x: clamp(player.roamTarget.x + Math.cos(t * 0.7) * 24, 112, W / 2 - 82),
    y: clamp(player.roamTarget.y + Math.sin(t) * 46, 78, H - 78),
  };
}

function keepAwayPlayerOnPossessionSide(player) {
  if (ball.owner && ball.owner.team === "away") {
    player.x = Math.min(player.x, W / 2 - 44);
  } else if (ball.owner && ball.owner.team === "home") {
    player.x = Math.max(player.x, W / 2 + 34);
  }
}

function resetStats() {
  allPlayers.forEach((player) => {
    player.stats = emptyStats();
  });
}

function mvpScore(player) {
  return player.stats.points + player.stats.assists * 2 + player.stats.rebounds * 1.5 + player.stats.steals * 3 + player.stats.blocks * 3;
}

function gameMvp() {
  return allPlayers.reduce((best, player) => (mvpScore(player) > mvpScore(best) ? player : best), allPlayers[0]);
}

function clearBallState() {
  ball.shot = false;
  ball.pass = false;
  ball.target = null;
  ball.lastPasser = null;
  ball.z = 0;
  ball.vz = 0;
  state.lastShooter = null;
  state.stealTimer = 0;
  state.stealCooldown = 0;
  state.blockCooldown = 0;
  state.cpuStealCooldown = 0;
  state.cpuBlockCooldown = 0;
  state.actionFlash = null;
  state.shotHold = 0;
  state.charging = false;
}

function givePossession(team, message) {
  state.jumpBall = false;
  state.jumpPressed = false;
  clearBallState();
  ball.owner = team === "away" ? awayTeam[0] : homeTeam[0];
  announce(message || (team === "away" ? "Other team's ball. Play defense." : "Your ball."));
}

function formatClock() {
  const seconds = Math.ceil(state.time);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  return `${state.period === "OT" ? `OT${state.overtimeCount}` : state.period} ${time}`;
}

function updateClockDisplay() {
  clockEl.textContent = formatClock();
}

function updatePauseButton() {
  pauseControlEls.forEach((button) => {
    button.textContent = state.paused ? "Resume" : "Pause";
    button.setAttribute("aria-pressed", String(state.paused));
    button.classList.toggle("is-active", state.paused);
  });
}

function togglePause() {
  if (!state.started || state.gameOver) return;
  state.paused = !state.paused;
  state.charging = false;
  state.shotHold = 0;
  keys.clear();
  updatePauseButton();
  announce(state.paused ? "Paused." : "Back on court.");
}

function inboundAfterScore(scoredBy) {
  resetPlay(scoredBy);
  givePossession(scoredBy === "home" ? "away" : "home", scoredBy === "home" ? "Score. Other team's ball." : "They scored. Your ball.");
}

function startNextQuarter() {
  state.quarter += 1;
  state.period = `Q${state.quarter}`;
  state.time = QUARTER_SECONDS;
  resetPlay("quarter");
  givePossession(state.quarter % 2 === 0 ? "away" : "home", `Quarter ${state.quarter}. ${state.quarter % 2 === 0 ? "Other team's ball." : "Your ball."}`);
  updateClockDisplay();
}

function startOvertime() {
  state.time = OVERTIME_SECONDS;
  state.period = "OT";
  state.overtimeCount += 1;
  setupJumpBall();
  announce(`Overtime ${state.overtimeCount}. 30 seconds.`);
  updateClockDisplay();
}

function endGame() {
  state.gameOver = true;
  announce(state.home === state.away ? "Final: tied game." : state.home > state.away ? "Final: home wins." : "Final: away wins.");
  if (state.leagueGameContext && !state.leagueResultReported && window.PixelCourtLeagueComplete) {
    state.leagueResultReported = true;
    window.PixelCourtLeagueComplete({
      context: state.leagueGameContext,
      userScore: state.home,
      opponentScore: state.away,
      homePlayers: homeTeam.map((player) => ({ name: player.name, number: player.number, stats: Object.assign({}, player.stats) })),
      awayPlayers: awayTeam.map((player) => ({ name: player.name, number: player.number, stats: Object.assign({}, player.stats) })),
    });
  }
}

function attemptJumpBall() {
  if (!state.jumpBall || state.jumpPressed) return;

  state.jumpPressed = true;
  const sweetSpot = ball.z >= 24 && ball.z <= 46;
  const closeEnough = ball.z >= 16 && ball.z <= 58;
  const homeWins = sweetSpot || (closeEnough && Math.random() < 0.55);
  flashAction(homeTeam[4], "JUMP", homeWins ? "#53da8a" : "#ffce4b");
  givePossession(homeWins ? "home" : "away", homeWins ? "You won the tip." : "Late jump. Play defense.");
}

function updateJumpBall(dt) {
  state.jumpTimer += dt;
  ball.owner = null;
  ball.x = W / 2;
  ball.y = H / 2 - 20;
  ball.z = Math.max(0, 92 - state.jumpTimer * 76);
  homeTeam[4].y = H / 2 + 18 - Math.max(0, 42 - Math.abs(ball.z - 34)) * 0.25;
  awayTeam[4].y = H / 2 + 18 - Math.max(0, 40 - Math.abs(ball.z - 30)) * 0.2;

  if (ball.z <= 10) {
    givePossession("away", "Other team wins the tip. Play defense.");
  }
}

function resetPlay(scoredBy) {
  homeTeam.forEach((player, index) => {
    player.x = homeSpots[index].x + (scoredBy === "home" ? -10 : 0);
    player.y = homeSpots[index].y;
    player.vx = 0;
    player.vy = 0;
    player.facing = 1;
  });

  awayTeam.forEach((player, index) => {
    player.x = awaySpots[index].x;
    player.y = awaySpots[index].y;
    player.vx = 0;
    player.vy = 0;
    player.facing = -1;
  });
}

function setupJumpBall() {
  resetPlay("jump");
  homeTeam[4].x = W / 2 - 34;
  homeTeam[4].y = H / 2 + 18;
  awayTeam[4].x = W / 2 + 34;
  awayTeam[4].y = H / 2 + 18;
  homeTeam[4].facing = 1;
  awayTeam[4].facing = -1;
  clearBallState();
  ball.owner = null;
  ball.x = W / 2;
  ball.y = H / 2 - 24;
  ball.z = 64;
  state.jumpBall = true;
  state.jumpTimer = 0;
  state.jumpPressed = false;
}

function restart() {
  if (!state.started) return;
  state.home = 0;
  state.away = 0;
  state.time = QUARTER_SECONDS;
  state.quarter = 1;
  state.period = "Q1";
  state.overtimeCount = 0;
  state.paused = false;
  state.gameOver = false;
  state.leagueResultReported = false;
  resetStats();
  homeScoreEl.textContent = state.home;
  awayScoreEl.textContent = state.away;
  updateClockDisplay();
  updatePauseButton();
  updateStatsPanel();
  setupJumpBall();
  announce("Jump ball. Press Space as it drops.");
}

function passBall() {
  if (!state.started || !ball.owner || ball.owner.team !== "home" || state.gameOver) return;

  const passer = ball.owner;
  const teammates = homeTeam.filter((player) => player !== ball.owner);
  const target = teammates.reduce((best, player) => {
    const playerSpace = distance(player, closestDefender(player));
    const bestSpace = distance(best, closestDefender(best));
    return playerSpace > bestSpace ? player : best;
  }, teammates[0]);

  ball.target = target;
  ball.owner = null;
  ball.pass = true;
  ball.shot = false;
  ball.lastPasser = passer;
  ball.z = 18;
  ball.vz = 1.8;
  ball.vx = (target.x - ball.x) / 20;
  ball.vy = (target.y - ball.y) / 20;
  state.charging = false;
  state.shotHold = 0;
  announce(`Pass to home ${target.number}.`);
}

function flashAction(player, label, color) {
  state.actionFlash = { player, label, color, timer: 0.42 };
}

function stealBall() {
  if (!state.started || state.gameOver || state.stealCooldown > 0 || !ball.owner || ball.owner.team !== "away") return;

  const defender = userControlledPlayer();
  const gap = defender ? distance(defender, ball.owner) : Infinity;
  state.stealCooldown = 0.75;
  if (!defender || gap > 46) {
    announce("Too far to steal.");
    return;
  }

  flashAction(defender, "STEAL", "#53da8a");
  const odds = gap < 25 ? 0.5 : 0.28;
  if (Math.random() < odds) {
    defender.stats.steals += 1;
    ball.owner = defender;
    state.charging = false;
    state.shotHold = 0;
    announce(`Steal. Controlling home ${defender.number}.`);
  } else {
    announce("Reach missed.");
  }
}

function blockShot() {
  if (!state.started || state.gameOver || state.blockCooldown > 0) return;

  const defender = userControlledPlayer();
  state.blockCooldown = 0.9;
  if (!defender) return;
  flashAction(defender, "BLOCK", "#ffce4b");

  if (!ball.shot || !state.lastShooter || state.lastShooter.team !== "away") {
    announce("Hands up.");
    return;
  }

  const gap = distance(defender, state.lastShooter);
  const ballNear = distance(defender, ball) < 94;
  if (gap < 58 && ballNear && ball.z > 12 && Math.random() < 0.58) {
    defender.stats.blocks += 1;
    ball.shot = false;
    ball.pass = false;
    ball.target = null;
    ball.vx = 3.8;
    ball.vy = defender.y < ball.y ? 2.4 : -2.4;
    ball.vz = 2.8;
    ball.z = Math.max(ball.z, 24);
    announce("Blocked!");
  } else {
    announce("Block attempt.");
  }
}

const touchActions = {
  dunkBall,
  passBall,
  stealBall,
  blockShot,
  togglePause,
};

function releaseTouchButton(button) {
  button.classList.remove("is-held");
  if (button.dataset.holdKey) keys.delete(button.dataset.holdKey);
  if (button.hasAttribute("data-shoot-control")) releaseShotCharge();
}

function setupTouchControls() {
  touchControlEls.forEach((button) => {
    button.addEventListener("contextmenu", (event) => event.preventDefault());
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      button.setPointerCapture(event.pointerId);
      button.classList.add("is-held");

      if (button.dataset.holdKey) keys.add(button.dataset.holdKey);
      if (button.dataset.action && touchActions[button.dataset.action] && (!state.paused || button.dataset.action === "togglePause")) touchActions[button.dataset.action]();
      if (button.hasAttribute("data-shoot-control")) startShotCharge();
    });
    button.addEventListener("pointerup", () => releaseTouchButton(button));
    button.addEventListener("pointercancel", () => releaseTouchButton(button));
    button.addEventListener("lostpointercapture", () => releaseTouchButton(button));
  });
}

function cpuStealBall(defender) {
  if (!ball.owner || ball.owner.team !== "home" || state.cpuStealCooldown > 0 || state.gameOver) return;

  const gap = distance(defender, ball.owner);
  if (gap > 34) return;

  state.cpuStealCooldown = 0.68;
  if (Math.random() < 0.32) {
    flashAction(defender, "STEAL", "#ff6f37");
    defender.stats.steals += 1;
    ball.owner = defender;
    state.charging = false;
    state.shotHold = 0;
    announce("Away steals it. Play defense.");
  }
}

function cpuBlockShot(shooter) {
  if (state.cpuBlockCooldown > 0) return false;

  const blocker = closestDefender(shooter);
  const gap = distance(blocker, shooter);
  if (gap > 70) return false;

  state.cpuBlockCooldown = 0.86;
  const odds = gap < 38 ? 0.68 : 0.44;
  if (Math.random() >= odds) return false;

  flashAction(blocker, "BLOCK", "#ff6f37");
  blocker.stats.blocks += 1;
  ball.owner = null;
  ball.pass = false;
  ball.shot = false;
  ball.target = null;
  ball.vx = -4.4;
  ball.vy = blocker.y < shooter.y ? 2.8 : -2.8;
  ball.z = 28;
  ball.vz = 3.2;
  state.charging = false;
  state.shotHold = 0;
  announce("Blocked by away.");
  return true;
}

function dunkBall() {
  const dunker = ball.owner;
  if (!state.started || state.gameOver || !dunker || dunker.team !== "home") return;

  const dunkDistance = Math.hypot(dunker.x - hoop.x, dunker.y - hoop.y);
  if (dunkDistance > 150) {
    announce("Get closer to dunk.");
    return;
  }

  state.lastShooter = dunker;
  dunker.stats.fieldGoalsAttempted += 1;
  const blocker = closestDefender(dunker);
  const contest = Math.max(0, 1 - distance(dunker, blocker) / 72);
  if (distance(dunker, blocker) < 54 && Math.random() < 0.38) {
    flashAction(blocker, "BLOCK", "#ff6f37");
    blocker.stats.blocks += 1;
    ball.owner = null;
    ball.pass = false;
    ball.shot = false;
    ball.target = null;
    ball.vx = -5.2;
    ball.vy = dunker.y < hoop.y ? 3.2 : -3.2;
    ball.z = 30;
    ball.vz = 3.4;
    state.charging = false;
    state.shotHold = 0;
    announce("Dunk blocked.");
    return;
  }

  const made = Math.random() < clamp(0.88 - contest * 0.22, 0.55, 0.93);
  ball.owner = null;
  ball.pass = false;
  ball.shot = true;
  ball.target = { x: hoop.x, y: hoop.y, made, team: "home" };
  ball.vx = (hoop.x - ball.x) / 18;
  ball.vy = (hoop.y - ball.y) / 18;
  ball.z = 44;
  ball.vz = 2.6;
  flashAction(dunker, "DUNK", "#53da8a");
  announce(made ? "Rim rocker!" : "Dunk missed.");
}

function shoot() {
  const shooter = ball.owner;
  if (!state.started || !shooter || shooter.team !== "home" || state.gameOver) return;

  const charge = clamp(state.shotHold, 0, 1);
  const shotDistance = Math.hypot(shooter.x - hoop.x, shooter.y - hoop.y);
  const contest = Math.max(0, 1 - distance(shooter, closestDefender(shooter)) / 86);
  const ideal = shotDistance > 260 ? 0.78 : 0.62;
  const timing = 1 - Math.abs(charge - ideal) / 0.62;
  const odds = clamp(0.28 + timing * 0.5 - contest * 0.22 - Math.max(0, shotDistance - 360) / 1050, 0.14, 0.82);
  const made = Math.random() < odds;
  const targetOffset = made ? 0 : (Math.random() < 0.5 ? -42 : 42);

  state.lastShooter = shooter;
  const points = isThreePointAttempt(shooter) ? 3 : 2;
  shooter.stats.fieldGoalsAttempted += 1;
  if (points === 3) shooter.stats.threePointersAttempted += 1;
  if (cpuBlockShot(shooter)) return;

  ball.owner = null;
  ball.pass = false;
  ball.shot = true;
  ball.target = { x: hoop.x + targetOffset, y: hoop.y + (made ? 0 : Math.random() * 46 - 23), made, team: "home", points };
  ball.vx = (ball.target.x - ball.x) / 52;
  ball.vy = (ball.target.y - ball.y) / 52;
  ball.z = 22;
  ball.vz = 8 + charge * 5;

  announce(made ? "Splash!" : contest > 0.55 ? "Heavily contested." : "Shot is up.");
}

function shootAway(shooter) {
  const shotDistance = Math.hypot(shooter.x - awayHoop.x, shooter.y - awayHoop.y);
  const contest = Math.max(0, 1 - distance(shooter, closestHomeDefender(shooter)) / 78);
  const odds = clamp(0.68 - contest * 0.12 - Math.max(0, shotDistance - 380) / 1450, 0.36, 0.9);
  const made = Math.random() < odds;
  const targetOffset = made ? 0 : (Math.random() < 0.5 ? -42 : 42);

  state.lastShooter = shooter;
  const points = isThreePointAttempt(shooter) ? 3 : 2;
  shooter.stats.fieldGoalsAttempted += 1;
  if (points === 3) shooter.stats.threePointersAttempted += 1;
  ball.owner = null;
  ball.pass = false;
  ball.shot = true;
  ball.target = { x: awayHoop.x + targetOffset, y: awayHoop.y + (made ? 0 : Math.random() * 46 - 23), made, team: "away", points };
  ball.vx = (ball.target.x - ball.x) / 52;
  ball.vy = (ball.target.y - ball.y) / 52;
  ball.z = 22;
  ball.vz = 9;

  announce(contest > 0.55 ? "Good contest." : "Away shot is up.");
}

function updateControlledPlayer(dt) {
  const player = userControlledPlayer();
  if (!player) return;

  let ax = 0;
  let ay = 0;
  if (keys.has("w") || keys.has("arrowup")) ay -= 1;
  if (keys.has("s") || keys.has("arrowdown")) ay += 1;
  if (keys.has("a") || keys.has("arrowleft")) ax -= 1;
  if (keys.has("d") || keys.has("arrowright")) ax += 1;

  const mag = Math.hypot(ax, ay) || 1;
  const speed = keys.has("shift") ? 265 : 195;
  player.vx = (ax / mag) * speed;
  player.vy = (ay / mag) * speed;
  player.x = clamp(player.x + player.vx * dt, 55, W - 120);
  player.y = clamp(player.y + player.vy * dt, 84, H - 84);
  if (Math.abs(player.vx) > 1) player.facing = Math.sign(player.vx);

  if (ball.owner && ball.owner.team === "away" && player === closestHomeDefender(ball.owner)) {
    state.stealTimer = Math.max(0, state.stealTimer - dt);
    if (distance(player, ball.owner) < 28 && state.stealTimer === 0) {
      state.stealTimer = 0.65;
      if (Math.random() < 0.22) {
        player.stats.steals += 1;
        ball.owner = player;
        state.charging = false;
        state.shotHold = 0;
        announce(`Steal. Controlling home ${player.number}.`);
      }
    }
  }
}

function updateHomeTeammates(dt) {
  const handler = ball.owner && ball.owner.team === "home" ? ball.owner : null;
  const defendedHandler = ball.owner && ball.owner.team === "away" ? ball.owner : null;
  const controlledDefender = defendedHandler ? userControlledPlayer() : null;
  homeTeam.forEach((player, index) => {
    if (player === handler || player === controlledDefender) return;

    if (defendedHandler) {
      const mark = awayTeam[index] || defendedHandler;
      const targetX = clamp(mark.x - 68, 55, W / 2);
      const targetY = clamp(mark.y + Math.sin(performance.now() / 260 + index) * 32, 86, H - 86);
      moveToward(player, targetX, targetY, 150, dt);
      return;
    }

    const orbit = performance.now() / 700 + index * 2.1;
    const laneSpread = index % 2 === 0 ? 26 : -26;
    const targetX = clamp(player.homeSpot.x + Math.cos(orbit) * 54 + (handler ? Math.max(0, handler.x - 260) * 0.16 : 0), 86, W - 220);
    const targetY = clamp(player.homeSpot.y + laneSpread + Math.sin(orbit) * 58, 82, H - 82);
    moveToward(player, targetX, targetY, 118, dt);
  });
}

function updateAwayTeam(dt) {
  if (ball.owner && ball.owner.team === "away") {
    const handler = ball.owner;
    awayTeam.forEach((player, index) => {
      if (player === handler) {
        player.roamTarget = null;
        const laneY = awayHoop.y + Math.sin(performance.now() / 420) * 62;
        moveToward(player, awayHoop.x + 104, laneY, 152, dt);
        keepAwayPlayerOnPossessionSide(player);
        if (player.x < 275 && Math.abs(player.y - awayHoop.y) < 118 && Math.random() < dt * 1.75) {
          shootAway(player);
        }
        return;
      }

      player.roamTimer -= dt;
      if (!player.roamTarget || player.roamTimer <= 0 || distance(player, player.roamTarget) < 24) {
        player.roamTarget = randomAwayRoamTarget(index);
        player.roamPhase = Math.random() * Math.PI * 2;
        player.roamTimer = 1.1 + Math.random() * 1.5;
      }
      const curvedPoint = curvedRoamPoint(player, index);
      moveCurved(player, curvedPoint.x, curvedPoint.y, 110, dt, player.roamPhase + index);
      keepAwayPlayerOnPossessionSide(player);
    });
    return;
  }

  const handler = ball.owner && ball.owner.team === "home" ? ball.owner : null;
  const primaryDefender = handler ? closestDefender(handler) : null;

  awayTeam.forEach((defender, index) => {
    const mark = defender === primaryDefender ? handler : homeTeam[index] || homeTeam[0];
    const scatter = [
      { x: 24, y: -37 },
      { x: 92, y: -143 },
      { x: 61, y: 118 },
      { x: 141, y: -18 },
      { x: 107, y: 76 },
    ];
    const shape = scatter[index] || scatter[0];
    defender.roamTimer -= dt;
    if (!defender.roamTarget || defender.roamTimer <= 0 || distance(defender, defender.roamTarget) < 34) {
      defender.roamTarget = {
        x: clamp(mark.x + shape.x + (Math.random() * 78 - 39), W / 2 + 34, W - 112),
        y: clamp(mark.y + shape.y + (Math.random() * 38 - 19), 86, H - 86),
      };
      defender.roamTimer = 0.35 + Math.random() * 0.65;
    }
    const targetX = clamp(defender.roamTarget.x + Math.sin(performance.now() / 420 + index) * 18, W / 2 + 34, W - 112);
    const targetY = defender.roamTarget.y;
    moveToward(defender, targetX, targetY, ball.shot ? 170 : 194, dt);
    keepAwayPlayerOnPossessionSide(defender);

    if (ball.owner && ball.owner.team === "home" && distance(ball.owner, defender) < 30) {
      const shoveX = (ball.owner.x - defender.x) * 0.08;
      const shoveY = (ball.owner.y - defender.y) * 0.08;
      ball.owner.x = clamp(ball.owner.x + shoveX, 55, W - 120);
      ball.owner.y = clamp(ball.owner.y + shoveY, 84, H - 84);
      cpuStealBall(defender);
    }
  });
}

function updateBall(dt) {
  if (ball.owner) {
    const bounce = Math.abs(Math.sin(performance.now() / 92)) * 13;
    ball.x = ball.owner.x + ball.owner.facing * 24;
    ball.y = ball.owner.y + 17;
    ball.z = bounce;
    return;
  }

  ball.x += ball.vx;
  ball.y += ball.vy;
  ball.vz -= ball.shot ? 0.28 : 0.12;
  ball.z += ball.vz;

  if (ball.pass && ball.target && Math.hypot(ball.x - ball.target.x, ball.y - ball.target.y) < 20) {
    const interceptor = awayTeam.find((defender) => distance(defender, ball) < 34 && Math.random() < 0.18);
    if (interceptor) {
      ball.owner = interceptor;
      ball.pass = false;
      ball.lastPasser = null;
      state.charging = false;
      state.shotHold = 0;
      announce("Pass picked off. Play defense.");
      return;
    }
    ball.owner = ball.target;
    ball.pass = false;
    announce(`Now controlling home ${ball.owner.number}.`);
    return;
  }

  if (ball.shot && ball.target && Math.hypot(ball.x - ball.target.x, ball.y - ball.target.y) < 18 && ball.target.made) {
    if (ball.target.team === "away") {
      const points = ball.target.points || 2;
      if (state.lastShooter) {
        state.lastShooter.stats.points += points;
        state.lastShooter.stats.fieldGoalsMade += 1;
        if (points === 3) state.lastShooter.stats.threePointersMade += 1;
      }
      if (ball.lastPasser && ball.lastPasser.team === "away" && ball.lastPasser !== state.lastShooter) ball.lastPasser.stats.assists += 1;
      state.away += points;
      awayScoreEl.textContent = state.away;
      announce(points === 3 ? "Away hits a three." : "Away scores.");
      inboundAfterScore("away");
      return;
    }

    const points = ball.target.points || 2;
    if (state.lastShooter) {
      state.lastShooter.stats.points += points;
      state.lastShooter.stats.fieldGoalsMade += 1;
      if (points === 3) state.lastShooter.stats.threePointersMade += 1;
    }
    if (ball.lastPasser && ball.lastPasser.team === "home" && ball.lastPasser !== state.lastShooter) ball.lastPasser.stats.assists += 1;
    state.home += points;
    homeScoreEl.textContent = state.home;
    announce(points === 3 ? "Three points!" : "Bucket.");
    inboundAfterScore("home");
    return;
  }

  if (ball.shot && ball.target && !ball.target.made && Math.hypot(ball.x - ball.target.x, ball.y - ball.target.y) < 18) {
    ball.target = null;
  }

  if (ball.z <= 0 && !ball.owner) {
    ball.z = 0;
    ball.shot = false;
    ball.pass = false;
    ball.vx *= 0.35;
    ball.vy *= 0.35;

    const rebounder = nearestPlayer(allPlayers, ball);
    rebounder.stats.rebounds += 1;
    if (rebounder.team === "away") {
      ball.owner = rebounder;
      state.charging = false;
      state.shotHold = 0;
      announce("Defensive rebound. Play defense.");
    } else {
      ball.owner = rebounder;
      announce(`Rebound. Controlling home ${rebounder.number}.`);
    }
  }
}

function update(dt) {
  updateStatsPanel();

  if (!state.started) {
    updateClockDisplay();
    shotMeterEl.style.width = "0%";
    return;
  }

  if (state.paused) {
    updateClockDisplay();
    shotMeterEl.style.width = "0%";
    return;
  }

  if (state.jumpBall) {
    updateJumpBall(dt);
    updateClockDisplay();
    if (state.messageTimer > 0) {
      state.messageTimer -= dt;
      if (state.messageTimer <= 0) toastEl.classList.remove("show");
    }
    return;
  }

  if (!state.gameOver) {
    state.time = Math.max(0, state.time - dt);
    if (state.time === 0) {
      if (state.period !== "OT" && state.quarter < REGULATION_QUARTERS) {
        startNextQuarter();
      } else if (state.home === state.away) {
        startOvertime();
      } else {
        endGame();
      }
    }
  }

  if (state.messageTimer > 0) {
    state.messageTimer -= dt;
    if (state.messageTimer <= 0) toastEl.classList.remove("show");
  }
  state.stealCooldown = Math.max(0, state.stealCooldown - dt);
  state.blockCooldown = Math.max(0, state.blockCooldown - dt);
  state.cpuStealCooldown = Math.max(0, state.cpuStealCooldown - dt);
  state.cpuBlockCooldown = Math.max(0, state.cpuBlockCooldown - dt);
  if (state.actionFlash) {
    state.actionFlash.timer -= dt;
    if (state.actionFlash.timer <= 0) state.actionFlash = null;
  }

  if (state.charging && ball.owner && ball.owner.team === "home") {
    state.shotHold = clamp(state.shotHold + dt * 0.9, 0, 1);
  }

  updateControlledPlayer(dt);
  updateHomeTeammates(dt);
  updateAwayTeam(dt);
  updateBall(dt);

  updateClockDisplay();
  shotMeterEl.style.width = `${Math.round(state.shotHold * 100)}%`;
}

function drawCenterCourtLogo() {
  const team = centerCourtLogoState.team || state.team;
  if (!team) return;

  if (!centerCourtLogoState.ready || !centerCourtLogo.complete || centerCourtLogo.naturalWidth === 0) return;

  ctx.save();
  ctx.globalAlpha = 0.68;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 78, 0, Math.PI * 2);
  ctx.clip();

  const size = 148;
  ctx.drawImage(centerCourtLogo, W / 2 - size / 2, H / 2 - size / 2, size, size);

  ctx.restore();
}

function drawCourt() {
  ctx.fillStyle = "#b9783d";
  ctx.fillRect(0, 0, W, H);

  for (let y = 0; y < H; y += 18) {
    ctx.fillStyle = y % 36 === 0 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.035)";
    ctx.fillRect(0, y, W, 18);
  }

  drawCenterCourtLogo();

  ctx.strokeStyle = "#f5dfad";
  ctx.lineWidth = 5;
  ctx.strokeRect(38, 48, W - 76, H - 96);
  ctx.beginPath();
  ctx.moveTo(W / 2, 48);
  ctx.lineTo(W / 2, H - 48);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 62, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeRect(W - 230, H / 2 - 94, 192, 188);
  ctx.beginPath();
  ctx.arc(W - 230, H / 2, 94, Math.PI / 2, Math.PI * 1.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(W - 240, H / 2, 238, Math.PI * 0.66, Math.PI * 1.34);
  ctx.stroke();

  ctx.strokeRect(38, H / 2 - 94, 192, 188);
  ctx.beginPath();
  ctx.arc(230, H / 2, 94, Math.PI * 1.5, Math.PI / 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(240, H / 2, 238, Math.PI * 1.66, Math.PI * 0.34);
  ctx.stroke();

  drawHoop(awayHoop);
  drawHoop(hoop);
}

function drawHoop(goal) {
  const rightSide = goal.side === "right";
  const boardX = rightSide ? W - 72 : 38;
  const boardY = goal.y - 58;
  const boardW = 34;
  const boardH = 116;
  const rimX = goal.x;
  const rimY = goal.y;
  const dir = rightSide ? 1 : -1;
  const supportX = rightSide ? W - 33 : 24;
  const padX = rightSide ? W - 43 : 25;

  ctx.fillStyle = "rgba(0,0,0,0.24)";
  ctx.fillRect(rightSide ? boardX - 28 : boardX - 8, boardY + boardH + 12, 70, 12);
  ctx.fillRect(rightSide ? boardX - 16 : boardX + boardW - 2, boardY + 22, 18, 116);

  ctx.fillStyle = "#302b26";
  ctx.fillRect(supportX, boardY + 10, 9, boardH + 46);
  ctx.fillStyle = "#4d3e31";
  ctx.fillRect(padX, boardY + 28, 18, 72);
  ctx.fillStyle = "#26211d";
  ctx.fillRect(padX + 4, boardY + 31, 10, 66);

  ctx.fillStyle = "#a9e4f2";
  ctx.fillRect(boardX, boardY, boardW, boardH);
  ctx.fillStyle = "#d9fbff";
  ctx.fillRect(boardX + 3, boardY + 5, boardW - 9, boardH - 10);
  ctx.fillStyle = "rgba(35, 100, 122, 0.42)";
  ctx.fillRect(boardX + 8, boardY + 10, 6, boardH - 20);
  ctx.fillRect(boardX + 20, boardY + 10, 5, boardH - 20);
  ctx.strokeStyle = "#f5efdb";
  ctx.lineWidth = 4;
  ctx.strokeRect(boardX + 4, boardY + 24, boardW - 12, 68);

  ctx.fillStyle = "#2d2722";
  ctx.fillRect(rightSide ? boardX - 20 : boardX + boardW - 4, rimY - 8, 24, 16);
  ctx.fillStyle = "#f5efdb";
  ctx.fillRect(rightSide ? boardX - 21 : boardX + boardW + 1, rimY - 5, 20, 4);

  ctx.strokeStyle = "#8d2d17";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(rimX + dir * 6, rimY + 4, 34, 14, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#ff7a2d";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(rimX, rimY, 32, 13, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#ffb35f";
  ctx.fillRect(rightSide ? rimX - 30 : rimX + 12, rimY - 4, 18, 5);

  ctx.strokeStyle = "rgba(245, 239, 219, 0.86)";
  ctx.lineWidth = 2;
  for (let i = -24; i <= 24; i += 8) {
    ctx.beginPath();
    ctx.moveTo(rimX + i, rimY + 10);
    ctx.lineTo(rimX + i * 0.54, rimY + 48);
    ctx.stroke();
  }
  for (let i = -20; i <= 20; i += 10) {
    ctx.beginPath();
    ctx.moveTo(rimX + i, rimY + 14);
    ctx.lineTo(rimX + i + dir * 10, rimY + 44);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(245, 239, 219, 0.8)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(rimX, rimY + 47, 16, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function pixelPerson(body) {
  const x = Math.round(body.x);
  const y = Math.round(body.y);
  const controlled = userControlledPlayer() === body;
  const legFrame = Math.sin(performance.now() / 90 + x) > 0 ? 1 : -1;
  const scale = body.scale || 1;
  const build = body.build || 0;
  const torsoW = Math.round(27 + build * 3);
  const torsoH = Math.round(34 * scale);
  const headY = y - Math.round(43 * scale);
  const torsoY = y - Math.round(26 * scale);
  const armDrop = Math.round(24 * scale);
  const legH = Math.round(28 * scale);
  const halfTorso = Math.round(torsoW / 2);

  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(x - 18 - build, y + 29, 42 + build * 2, 8);

  if (controlled) {
    ctx.strokeStyle = "#53da8a";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 25 - build, y - Math.round(54 * scale), 50 + build * 2, Math.round(95 * scale));
  }

  ctx.fillStyle = body.skin;
  ctx.fillRect(x - 7, headY, 15, 15);
  ctx.fillStyle = body.hair;
  if (body.hairStyle === "balding" || body.hairStyle === "thin") {
    ctx.fillRect(x - 6, headY - 2, 12, 3);
  } else if (body.hairStyle === "locs" || body.hairStyle === "braids") {
    ctx.fillRect(x - 9, headY - 5, 18, 6);
    ctx.fillRect(x - 10, headY, 4, 14);
    ctx.fillRect(x + 6, headY, 4, 14);
  } else if (body.hairStyle === "curls" || body.hairStyle === "puffs") {
    ctx.fillRect(x - 10, headY - 6, 20, 7);
    ctx.fillRect(x - 12, headY - 2, 5, 5);
    ctx.fillRect(x + 7, headY - 2, 5, 5);
  } else if (body.hairStyle === "twists") {
    ctx.fillRect(x - 9, headY - 7, 18, 6);
    ctx.fillRect(x - 7, headY - 10, 4, 5);
    ctx.fillRect(x + 3, headY - 10, 4, 5);
  } else if (body.hairStyle === "sweep") {
    ctx.fillRect(x - 9, headY - 5, 18, 6);
    ctx.fillRect(x + 4, headY - 8, 8, 4);
  } else {
    ctx.fillRect(x - 8, headY - 3, 17, 6);
  }
  if (body.headband) {
    ctx.fillStyle = body.trim;
    ctx.fillRect(x - 8, headY + 2, 17, 3);
  }
  if (body.beard) {
    ctx.fillStyle = "#1b120d";
    ctx.fillRect(x - 6, headY + 10, 13, 5);
  }
  ctx.fillStyle = body.color;
  ctx.fillRect(x - halfTorso, torsoY, torsoW, torsoH);
  ctx.fillStyle = body.trim;
  ctx.fillRect(x - halfTorso, torsoY, torsoW, 5);
  ctx.fillRect(x - 2, torsoY + 6, 4, Math.max(14, torsoH - 14));
  ctx.fillStyle = "#f9f0d8";
  ctx.font = "700 11px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(body.number, x, torsoY + 21);
  ctx.fillStyle = body.trim;
  ctx.font = "900 8px system-ui";
  ctx.fillText(body.role[0], x, torsoY + 32);
  ctx.textAlign = "left";
  ctx.fillStyle = "#2a2522";
  ctx.fillRect(x - 14 - build, y + 8, 10 + Math.max(0, build), legH + legFrame * 2);
  ctx.fillRect(x + 5, y + 8, 10 + Math.max(0, build), legH - legFrame * 2);
  ctx.fillStyle = body.trim;
  ctx.fillRect(x - 18 - build, y + 7 + legH + legFrame * 2, 18 + build, 6);
  ctx.fillRect(x + 4, y + 7 + legH - legFrame * 2, 18 + build, 6);
  ctx.fillStyle = body.skin;
  ctx.fillRect(x - halfTorso - 11, torsoY + 5, 10, armDrop);
  ctx.fillRect(x + halfTorso + 1, torsoY + 5, 10, armDrop);
  if (body.sleeve) {
    ctx.fillStyle = body.trim;
    ctx.fillRect(x + halfTorso + 1, torsoY + 11, 10, 12);
  }

  if (controlled) {
    ctx.fillStyle = "#f9f0d8";
    ctx.font = "900 10px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(shortPlayerName(body.name), x, y - 55);
    ctx.textAlign = "left";
  }
}

function drawBall() {
  const size = Math.max(10, 18 - ball.z * 0.05);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(Math.round(ball.x - size / 2), Math.round(ball.y + 18), Math.round(size + 4), 5);
  ctx.fillStyle = "#e87523";
  ctx.fillRect(Math.round(ball.x - size / 2), Math.round(ball.y - ball.z - size / 2), Math.round(size), Math.round(size));
  ctx.fillStyle = "#5a2c16";
  ctx.fillRect(Math.round(ball.x - 1), Math.round(ball.y - ball.z - size / 2), 2, Math.round(size));
  ctx.fillRect(Math.round(ball.x - size / 2), Math.round(ball.y - ball.z - 1), Math.round(size), 2);
}

function drawShotFeedback() {
  if (!state.charging || !ball.owner || ball.owner.team !== "home") return;
  const x = ball.owner.x - 34;
  const y = ball.owner.y - 62;
  ctx.fillStyle = "#221b15";
  ctx.fillRect(x, y, 68, 10);
  ctx.fillStyle = "#53da8a";
  ctx.fillRect(x + 2, y + 2, Math.round(64 * state.shotHold), 6);
  ctx.strokeStyle = "#f5efdb";
  ctx.strokeRect(x + 43, y, 10, 10);
}

function drawActionFlash() {
  if (!state.actionFlash) return;

  const { player, label, color, timer } = state.actionFlash;
  const alpha = clamp(timer / 0.42, 0, 1);
  const x = Math.round(player.x);
  const y = Math.round(player.y - 68);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x - 32, y - 12, 64, 18);
  ctx.fillStyle = "#17130f";
  ctx.font = "900 12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + 2);
  ctx.textAlign = "left";
  ctx.globalAlpha = 1;
}

function drawJumpBallPrompt() {
  if (!state.jumpBall) return;

  ctx.fillStyle = "rgba(17, 15, 12, 0.58)";
  ctx.fillRect(W / 2 - 170, 68, 340, 58);
  ctx.fillStyle = "#f9f0d8";
  ctx.font = "900 22px system-ui";
  ctx.textAlign = "center";
  ctx.fillText("JUMP BALL", W / 2, 94);
  ctx.font = "700 14px system-ui";
  ctx.fillText("Press Space as the ball drops", W / 2, 116);
  ctx.textAlign = "left";
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawCourt();

  const sprites = [...allPlayers].sort((a, b) => a.y - b.y);
  if (ball.y < sprites[0].y) drawBall();
  sprites.forEach((sprite, index) => {
    pixelPerson(sprite);
    if (ball.y >= sprite.y && (index === sprites.length - 1 || ball.y < sprites[index + 1].y)) drawBall();
  });
  if (ball.y >= sprites[sprites.length - 1].y) drawBall();

  drawShotFeedback();
  drawActionFlash();
  drawJumpBallPrompt();

  if (state.paused) {
    ctx.fillStyle = "rgba(17, 15, 12, 0.62)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#f9f0d8";
    ctx.font = "900 42px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", W / 2, H / 2 - 12);
    ctx.font = "700 18px system-ui";
    ctx.fillText("Press P or tap Resume", W / 2, H / 2 + 28);
    ctx.textAlign = "left";
  }

  if (state.gameOver) {
    const mvp = gameMvp();
    const mvpLine = `${mvp.name} - ${fieldGoalLine(mvp.stats)} FG  ${mvp.stats.points} PTS  ${mvp.stats.assists} AST  ${mvp.stats.rebounds} REB`;
    ctx.fillStyle = "rgba(17, 15, 12, 0.72)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#f9f0d8";
    ctx.font = "700 44px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(state.period === "OT" ? "FINAL / OT" : "FINAL", W / 2, H / 2 - 52);
    ctx.font = "900 24px system-ui";
    ctx.fillText("MVP", W / 2, H / 2 - 8);
    ctx.font = "700 21px system-ui";
    ctx.fillText(mvpLine, W / 2, H / 2 + 26);
    ctx.font = "700 18px system-ui";
    ctx.fillText("Press R to run it back", W / 2, H / 2 + 66);
    ctx.textAlign = "left";
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (!state.started) return;
  if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(key) || event.code === "Space") {
    event.preventDefault();
  }
  if (key === "r") restart();
  if (key === "p") {
    togglePause();
    return;
  }
  if (state.paused) return;
  if (key === "e") passBall();
  if (key === "q") stealBall();
  if (key === "f") blockShot();
  if (key === "c") dunkBall();
  if (event.code === "Space" && state.jumpBall) {
    startShotCharge();
    keys.add(key);
    return;
  }
  if (event.code === "Space") startShotCharge();
  keys.add(key);
});

window.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  if (!state.started) {
    keys.delete(key);
    return;
  }
  if (state.paused) {
    keys.delete(key);
    return;
  }
  if (event.code === "Space" && state.charging) {
    releaseShotCharge();
  }
  keys.delete(key);
});

setupTeamPicker();
setupTouchControls();
pauseGameEl.addEventListener("click", togglePause);
updatePauseButton();
applyTeamIdentity(nbaTeams[13], nbaTeams[1]);
resetPlay("away");
window.PixelCourt = {
  nbaTeams,
  state,
  homeTeam,
  awayTeam,
  applyTeamIdentity,
  restart,
  announce,
  setLeagueGameContext(context) {
    state.leagueGameContext = context;
    state.leagueResultReported = false;
  },
  clearLeagueGameContext() {
    state.leagueGameContext = null;
    state.leagueResultReported = false;
  },
  startPlayableGame(team, opponent, context) {
    applyTeamIdentity(team, opponent);
    state.started = true;
    teamPickerEl.classList.add("hidden");
    this.setLeagueGameContext(context || null);
    restart();
    announce(`${team.short} vs ${opponent.short}. Jump ball.`);
  },
};
requestAnimationFrame(loop);
