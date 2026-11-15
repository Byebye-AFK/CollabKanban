# loadtest

## Overview

Standalone scripts that drive the Spring Boot backend's public REST and STOMP
API from outside the app. They are not imported by the React frontend and are
not run by Vitest.

- `kanban.js` is a [k6](https://k6.io) load test. It measures how many
  concurrent users the backend handles. Each virtual user (VU) gets its own
  private board, so nothing contends.
- `race.mjs` is a Node 22+ race-condition test. Many users act on the same
  card, column, team or workspace at the same instant, and the script reports
  PASS / WARN / FAIL / SKIP for each scenario.

## Interface

### `kanban.js` (k6)

- `options` [kanban.js:options]: a ramp of 10% → 25% → 50% → 100% of
  `PEAK_USERS`, then down to 0. Thresholds: `http_req_failed` `rate<0.01`
  and `http_req_duration{kind:board}` `p(95)<500`.
- `default function` [kanban.js:default]: the steady-state loop for one VU:
  `GET /board/{id}`, `POST /card/create`, re-read the board, `PUT /card/move/{id}`,
  then `GET /workspace/mine`, with a `THINK_TIME_SECONDS` sleep between iterations.
- `onboard()` [kanban.js:onboard]: one-time setup per VU: `/user/add`,
  `/user/login`, `/workspace/create`, `/board/create`, two `/column/create`
  calls ("To do", "Done"), then `GET /board/{id}` to read back the column ids.
- `login_duration` Trend metric [kanban.js:loginTime].
- Env vars: `BASE_URL` (default `http://localhost:8080`), `PEAK` (default 200)
  and `ASSIGNEE_ID` (default 1) [kanban.js:BASE_URL, PEAK_USERS, ASSIGNEE_ID].

### `race.mjs` (Node)

- `main()` [race.mjs:main]: checks that the backend is up (`GET /error`),
  creates `USERS + 1` users (the extra one is the outsider), sets up a shared
  board and a probe board, works out user ids, runs every scenario, then calls
  `printReport()`.
- Scenarios, each recorded through `record()` [race.mjs:record]:
  - `signupSameEmail` [race.mjs:signupSameEmail]: 10 concurrent `/user/add` calls with one email.
  - `cardCreateSamePosition` [race.mjs:cardCreateSamePosition]: concurrent card creates in one column; looks for duplicate `position`s.
  - `controlSequentialMoves` [race.mjs:controlSequentialMoves]: the same moves run one at a time, as a control.
  - `moveSameCard` [race.mjs:moveSameCard]: concurrent `PUT /card/move/{id}` on one card, repeated `ROUNDS` times. Counts 409s, 5xx and STOMP broadcasts.
  - `deleteVsMove` [race.mjs:deleteVsMove]: one user's `DELETE /card/{id}` racing six moves of the same card.
  - `deleteSameCard` [race.mjs:deleteSameCard]: 8 concurrent deletes of one card.
  - `duplicateTeamMember` [race.mjs:duplicateTeamMember]: concurrent `/team/addMember` and `/member/addmembership` calls for the same user.
  - `accessControl` [race.mjs:accessControl]: an outsider reads, moves and deletes on a board they are not a member of.
- Helpers: `call` [race.mjs:call] (fetch wrapper with a 30 s timeout; returns
  `{status, text, json}` and maps network failure to `status: 0`),
  `fireTogether`, `mapLimit`, `discoverUserIds` and `listenToBoard` (a raw
  STOMP `CONNECT`/`SUBSCRIBE` on `/topic/board/{boardId}` over `/ws`).
- Env vars: `BASE_URL`, `USERS` (default 12), `ROUNDS` (default 5),
  `FIRST_USER_ID` and `DEBUG` [race.mjs:BASE_URL, USER_COUNT, ROUNDS, FIRST_USER_ID].

## Invariants

- Test data is namespaced so it can be found and deleted later. `kanban.js`
  uses `loadtest_<RUN_ID>_<VU>@example.com` emails [kanban.js:onboard];
  `race.mjs` prefixes emails and workspace names with `race_` [race.mjs:createUsers, createBoard].
- Both scripts treat the create responses as unreliable for ids. They re-read
  `GET /board/{id}` to find column and card ids [kanban.js:onboard, kanban.js:default, race.mjs:createBoard].
- `kanban.js` needs a real, existing user id in `ASSIGNEE_ID`; card create
  fails with a 500 without one [kanban.js:ASSIGNEE_ID].
- `race.mjs` has no access to backend code, only its public API (see the file
  header). `discoverUserIds` must run before any scenario creates users,
  because failed signups burn sequence values and would break the "newest ids
  are ours" assumption [race.mjs:main].
- `race.mjs` limits login concurrency to `SETUP_CONCURRENCY = 4` because
  bcrypt is CPU-heavy on the server [race.mjs:SETUP_CONCURRENCY].

## Side Effects

- Creates real users, workspaces, boards, columns, cards, teams and
  memberships in whatever backend `BASE_URL` points to (the local Postgres
  database by default). Nothing is cleaned up automatically.
- `race.mjs` uses `POST /card/create` with candidate `assignedTo` ids as an
  existence probe, so it leaves `probe` cards on the probe board
  [race.mjs:discoverUserIds].
- `race.mjs` opens a WebSocket to `<BASE_URL as ws>/ws` [race.mjs:listenToBoard],
  writes the report to stdout, and calls `process.exit(1)` if it aborts [race.mjs:main].

## Verification

These scripts are run by hand against a running backend on `:8080`, not by `npm test`:

- Run: `k6 run loadtest/kanban.js` (for example `PEAK=50 ASSIGNEE_ID=<id> k6 run loadtest/kanban.js`)
- Run: `node loadtest/race.mjs` (for example `USERS=12 ROUNDS=5 node loadtest/race.mjs`)
