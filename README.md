[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/raz-indri/turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/raz-indri/turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

# Gobble Dash — The Great Turkey Escape

A complete, original turkey escape game for the [make.fun "Make the best turkey escape game" bounty](https://make.fun/bounty/turkey-run-game-01). You are **Tom the turkey**, and Thanksgiving dinner is coming for you: outrun **Farmer Bram** across the farmyard, through the barn and into the kitchen, and reach the Freedom Woods before you end up on the table.

## How to play

Open `game/index.html` in a desktop browser — static files only, no server, no network. Click **START** (or press Space/Enter) to run.

- **← / → (or A / D)** — switch lanes
- **↑ / Space / W** — jump (over fences, hay bales and the carving knife)
- **↓ / S** — slide (under beams and the oven's reach)
- **Mouse** — click the on-screen buttons; **P** pauses, **R** restarts, **M** toggles sound

Dodge the oven, the carving knife, fences and hay; grab corn for points and hearts to stay in the race. The farmer closes in every time you stumble — three stumbles and you're caught. Survive all three stages (farmyard → barn → kitchen) and you escape to the Freedom Woods.

## What's inside

- A 3-lane runner with three hand-built stages, day-to-dusk lighting, drifting clouds and a progress bar to freedom
- A full HUD: score, distance, lives, stage, corn count and the farmer's closing gap
- Title screen, pause, caught/escaped end screens with restart
- All art drawn in code (canvas vector art: Tom, Farmer Bram, the oven, the knife, the farm) — no copied assets
- Synthesised WebAudio sound: footsteps, gobbles, clucks, thuds and a little escape jingle — no audio files

## Layout

- `game/` — the playable game as static files (`index.html` + `*.js`, `*.css`)
- `screenshots/` — four real renders of the game (title, play, danger in the kitchen, escaped)
- `main.ts` — the make.fun entry program: copies `game/` and `screenshots/` to `/output` and writes `dossier.json`
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
