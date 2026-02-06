const API_BASE = '/api';

export interface Player {
  steamid: string;
  name: string;
  first_name?: string;
  play_time: number;
  last_connected: number;
  match_points?: number;
  public_points?: number;
}

export interface MatchStats {
  steamid: string;
  goals: number;
  assists: number;
  own_goals: number;
  hits: number;
  passes: number;
  interceptions: number;
  ball_losses: number;
  saves: number;
  rounds_won: number;
  rounds_lost: number;
  points: number;
  mvp: number;
  motm: number;
  matches: number;
}

export interface PublicStats {
  steamid: string;
  goals: number;
  assists: number;
  own_goals: number;
  hits: number;
  passes: number;
  interceptions: number;
  ball_losses: number;
  saves: number;
  rounds_won: number;
  rounds_lost: number;
  points: number;
  mvp: number;
  motm: number;
}

export interface Positions {
  gk: number;
  lb: number;
  rb: number;
  mf: number;
  lw: number;
  rw: number;
}

export interface NameHistory {
  name: string;
  first_used: number;
  last_used: number;
}

export interface PlayerDetail {
  player: Player & {
    current_name?: string;
    alias?: string;
    first_seen?: number;
    last_seen?: number;
    connection_count?: number;
  };
  matchStats: MatchStats | null;
  publicStats: PublicStats | null;
  positions: Positions | null;
  nameHistory: NameHistory[];
}

export interface LeaderboardPlayer extends MatchStats {
  name: string;
}

export interface StatsSummary {
  totalPlayers: number;
  activeLast7Days: number;
  matchStats: {
    goals: number;
    assists: number;
    saves: number;
    matches: number;
  };
  publicStats: {
    goals: number;
    assists: number;
    saves: number;
  };
}

async function fetchApi<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  players: {
    list: (page = 1, limit = 50) =>
      fetchApi<{ players: Player[]; pagination: { page: number; limit: number; total: number; pages: number } }>(
        `/players?page=${page}&limit=${limit}`
      ),
    get: (steamid: string) => fetchApi<PlayerDetail>(`/players/${steamid}`),
    search: (q: string) => fetchApi<{ players: Player[] }>(`/players/search?q=${encodeURIComponent(q)}`),
  },
  leaderboard: {
    match: (sort = 'points', limit = 50) =>
      fetchApi<{ players: LeaderboardPlayer[] }>(`/leaderboard/match?sort=${sort}&limit=${limit}`),
    public: (sort = 'points', limit = 50) =>
      fetchApi<{ players: LeaderboardPlayer[] }>(`/leaderboard/public?sort=${sort}&limit=${limit}`),
    goals: (limit = 20) => fetchApi<{ players: { steamid: string; name: string; match_goals: number; public_goals: number; total_goals: number }[] }>(`/leaderboard/goals?limit=${limit}`),
    assists: (limit = 20) => fetchApi<{ players: { steamid: string; name: string; match_assists: number; public_assists: number; total_assists: number }[] }>(`/leaderboard/assists?limit=${limit}`),
    saves: (limit = 20) => fetchApi<{ players: { steamid: string; name: string; match_saves: number; public_saves: number; total_saves: number }[] }>(`/leaderboard/saves?limit=${limit}`),
  },
  stats: {
    summary: () => fetchApi<StatsSummary>('/stats/summary'),
    positions: () => fetchApi<{ positions: Positions }>('/stats/positions'),
  },
};
