# Soccer Stats

Web-based stats viewer for [Soccer Mod](https://github.com/Quixomatic/soccer-mod) (Counter-Strike: Source). Reads player statistics from the shared MariaDB database and displays leaderboards, player profiles, and in-game MOTD panels.

## Features

- Player leaderboards and rankings
- Individual player stat pages
- In-game MOTD panel integration (`!mystats` command)
- Dockerized for easy deployment alongside game servers

## Quick Start

Add to your existing Docker Compose stack with a game server and MariaDB:

```yaml
soccer-stats:
  image: ghcr.io/quixomatic/soccer-stats:latest
  container_name: soccer-stats
  restart: unless-stopped
  ports:
    - "3000:3000"
  environment:
    DB_HOST: mariadb
    DB_PORT: 3306
    DB_USER: ${MYSQL_USER:-soccermod}
    DB_PASSWORD: ${MYSQL_PASSWORD:-soccermodpassword}
    DB_DATABASE: ${MYSQL_DATABASE:-soccermod}
  depends_on:
    - mariadb
```

See [compose.example.yaml](compose.example.yaml) for a full example.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MariaDB hostname | - |
| `DB_PORT` | MariaDB port | `3306` |
| `DB_USER` | Database user | - |
| `DB_PASSWORD` | Database password | - |
| `DB_DATABASE` | Database name | - |
| `PORT` | HTTP server port | `3000` |

## Development

Requires Node 22+ and pnpm.

```bash
# Backend
cd backend
pnpm install
pnpm run dev

# Frontend (separate terminal)
cd frontend
pnpm install
pnpm run dev
```

## Tech Stack

- **Backend**: Express 5, TypeScript, mysql2
- **Frontend**: React 19, Vite, TailwindCSS 4, shadcn/ui, React Router 7
- **Deployment**: Docker (multi-stage build), GitHub Actions → ghcr.io

## License

MIT
