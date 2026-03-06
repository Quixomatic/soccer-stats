# Changelog

All notable changes to this project will be documented in this file.

## [1.0.2] - 2026-03-06

### Added
- MVP and MOTM columns on leaderboard tables
- Pts/Match computed column on match leaderboard tab
- Clickable column headers for sorting (active sort shows down arrow)
- Minimum match threshold for match leaderboard (default 3, configurable via `?min_matches=`)

### Changed
- Match leaderboard defaults to sorting by Pts/Match
- Public leaderboard defaults to sorting by Points
- `mvp` and `motm` now valid sort options for both leaderboard endpoints

## [1.0.1] - 2026-03-06

### Added
- Sync API endpoints (`/api/sync/*`) for external stat ingestion with Bearer token auth
  - `POST /api/sync/player` — Upsert player records
  - `POST /api/sync/stat` — Increment individual stat columns
  - `POST /api/sync/match-count` — Increment matches played
  - `POST /api/sync/award` — Increment MVP/MOTM awards
  - `POST /api/sync/full` — Full bulk sync (replace all data for given players)
- `SYNC_API_KEY` environment variable for sync endpoint authentication
- `SYNC_API_KEY` to `compose.example.yaml`

## [1.0.0] - 2026-02-28

### Added
- Initial release
- Express 5 backend serving API and static frontend
- React 19 frontend with TailwindCSS 4 and shadcn/ui
- Leaderboard, player stats, and MOTD pages
- Skeleton loaders for loading states
- Links between Player and MOTD pages
- Docker multi-stage build and GitHub Actions CI/CD
