import { Router, type Router as RouterType } from 'express';
import pool from '../db.js';
import { RowDataPacket } from 'mysql2';

const router: RouterType = Router();

// Match stats leaderboard
router.get('/match', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const sortBy = (req.query.sort as string) || 'points';

    const validSorts = ['points', 'goals', 'assists', 'saves', 'matches'];
    const sort = validSorts.includes(sortBy) ? sortBy : 'points';

    const [players] = await pool.query<RowDataPacket[]>(`
      SELECT
        ms.*,
        COALESCE(w.alias, w.current_name, p.name) as name
      FROM soccer_mod_match_stats ms
      JOIN soccer_mod_players p ON ms.steamid = p.steamid
      LEFT JOIN whois_players w ON ms.steamid = w.steamid
      WHERE ms.${sort} > 0
      ORDER BY ms.${sort} DESC
      LIMIT ?
    `, [limit]);

    res.json({ players });
  } catch (error) {
    console.error('Error fetching match leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Public stats leaderboard
router.get('/public', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const sortBy = (req.query.sort as string) || 'points';

    const validSorts = ['points', 'goals', 'assists', 'saves'];
    const sort = validSorts.includes(sortBy) ? sortBy : 'points';

    const [players] = await pool.query<RowDataPacket[]>(`
      SELECT
        ps.*,
        COALESCE(w.alias, w.current_name, p.name) as name
      FROM soccer_mod_public_stats ps
      JOIN soccer_mod_players p ON ps.steamid = p.steamid
      LEFT JOIN whois_players w ON ps.steamid = w.steamid
      WHERE ps.${sort} > 0
      ORDER BY ps.${sort} DESC
      LIMIT ?
    `, [limit]);

    res.json({ players });
  } catch (error) {
    console.error('Error fetching public leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Top scorers (combined)
router.get('/goals', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const [players] = await pool.query<RowDataPacket[]>(`
      SELECT
        p.steamid,
        COALESCE(w.alias, w.current_name, p.name) as name,
        COALESCE(ms.goals, 0) as match_goals,
        COALESCE(ps.goals, 0) as public_goals,
        COALESCE(ms.goals, 0) + COALESCE(ps.goals, 0) as total_goals
      FROM soccer_mod_players p
      LEFT JOIN whois_players w ON p.steamid = w.steamid
      LEFT JOIN soccer_mod_match_stats ms ON p.steamid = ms.steamid
      LEFT JOIN soccer_mod_public_stats ps ON p.steamid = ps.steamid
      HAVING total_goals > 0
      ORDER BY total_goals DESC
      LIMIT ?
    `, [limit]);

    res.json({ players });
  } catch (error) {
    console.error('Error fetching top scorers:', error);
    res.status(500).json({ error: 'Failed to fetch top scorers' });
  }
});

// Top assists
router.get('/assists', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const [players] = await pool.query<RowDataPacket[]>(`
      SELECT
        p.steamid,
        COALESCE(w.alias, w.current_name, p.name) as name,
        COALESCE(ms.assists, 0) as match_assists,
        COALESCE(ps.assists, 0) as public_assists,
        COALESCE(ms.assists, 0) + COALESCE(ps.assists, 0) as total_assists
      FROM soccer_mod_players p
      LEFT JOIN whois_players w ON p.steamid = w.steamid
      LEFT JOIN soccer_mod_match_stats ms ON p.steamid = ms.steamid
      LEFT JOIN soccer_mod_public_stats ps ON p.steamid = ps.steamid
      HAVING total_assists > 0
      ORDER BY total_assists DESC
      LIMIT ?
    `, [limit]);

    res.json({ players });
  } catch (error) {
    console.error('Error fetching top assists:', error);
    res.status(500).json({ error: 'Failed to fetch top assists' });
  }
});

// Top goalkeepers (saves)
router.get('/saves', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    const [players] = await pool.query<RowDataPacket[]>(`
      SELECT
        p.steamid,
        COALESCE(w.alias, w.current_name, p.name) as name,
        COALESCE(ms.saves, 0) as match_saves,
        COALESCE(ps.saves, 0) as public_saves,
        COALESCE(ms.saves, 0) + COALESCE(ps.saves, 0) as total_saves
      FROM soccer_mod_players p
      LEFT JOIN whois_players w ON p.steamid = w.steamid
      LEFT JOIN soccer_mod_match_stats ms ON p.steamid = ms.steamid
      LEFT JOIN soccer_mod_public_stats ps ON p.steamid = ps.steamid
      HAVING total_saves > 0
      ORDER BY total_saves DESC
      LIMIT ?
    `, [limit]);

    res.json({ players });
  } catch (error) {
    console.error('Error fetching top saves:', error);
    res.status(500).json({ error: 'Failed to fetch top saves' });
  }
});

export default router;
