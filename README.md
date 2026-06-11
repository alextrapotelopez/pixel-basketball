# Pixel Court

Pixel Court is a browser-based pixel basketball game with selectable NBA teams, real player names and jersey numbers, 5v5 play, live box score stats, team logos, and a serverless NBA-style league mode.

## Features

- Landing page with mode selection for `One Game` and `League Mode`
- One-game mode with selectable NBA teams
- Four 2-minute quarters and 30-second overtime periods
- Pause/resume support from the button or `P`
- Jump ball, shooting, passing, sprinting, steals, blocks, and dunks
- Real NBA team colors, center-court home logo, and visible team badges
- Live stats with `FG`, `3P`, `PTS`, `AST`, `REB`, `STL`, and `BLK`
- Touch controls for mobile/tablet play

## League Mode

League Mode saves one local season in the browser with IndexedDB, so it does not need a backend server or database.

- Choose your league team before the season starts
- 30 NBA teams split into East and West conferences
- 82-day regular-season schedule where every team plays one game per league day
- User plays only their team games
- Other games are simulated with scores and full player boxscores
- Schedule pagination with `Previous` and `Next`
- `Resume` from the schedule to simulate other games and jump into their highlights
- Standings by conference
- Play-in tournament for seeds 7-10
- Best-of-7 playoff series through the NBA Finals
- Local save management: continue, start new, or delete the active league

## Watch Recaps

Completed league games can be opened from Boxscores with `Watch`.

Each recap is a roughly 1-minute generated pixel-court simulation based on the saved game result and boxscore. The recap includes a scoreboard, countdown/progress bar, possession-style movement, dribbling, passes, shot arcs, defensive help, blocks, rebounds, steals, fast breaks, and highlight captions.

## Play

Open `index.html` in a browser, or serve the folder locally and open the local URL.

## Controls

- `WASD` or arrow keys: Move
- `Space`: Jump ball / hold and release to shoot
- `C`: Dunk near the hoop
- `E`: Pass
- `Q`: Steal on defense
- `F`: Block on defense
- `Shift`: Sprint
- `P`: Pause / resume
- `R`: Restart
