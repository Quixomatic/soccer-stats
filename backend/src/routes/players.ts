import { Router, type Router as RouterType } from 'express';
import pool from '../db.js';
import { RowDataPacket } from 'mysql2';

const router: RouterType = Router();

// Get all players with basic info (paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    const [players] = await pool.query<RowDataPacket[]>(`
      SELECT
        p.steamid,
        COALESCE(w.alias, w.current_name, p.name) as name,
        w.first_name,
        p.play_time,
        p.last_connected,
        ms.points as match_points,
        ps.points as public_points
      FROM soccer_mod_players p
      LEFT JOIN whois_players w ON p.steamid = w.steamid
      LEFT JOIN soccer_mod_match_stats ms ON p.steamid = ms.steamid
      LEFT JOIN soccer_mod_public_stats ps ON p.steamid = ps.steamid
      ORDER BY p.last_connected DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [countResult] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM soccer_mod_players'
    );

    res.json({
      players,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Search players by name
router.get('/search', async (req, res) => {
  try {
    const q = req.query.q as string;
    if (!q || q.length < 2) {
      return res.json({ players: [] });
    }

    const [players] = await pool.query<RowDataPacket[]>(`
      SELECT DISTINCT
        p.steamid,
        COALESCE(w.alias, w.current_name, p.name) as name,
        w.first_name,
        ms.points as match_points
      FROM soccer_mod_players p
      LEFT JOIN whois_players w ON p.steamid = w.steamid
      LEFT JOIN whois_names wn ON p.steamid = wn.steamid
      LEFT JOIN soccer_mod_match_stats ms ON p.steamid = ms.steamid
      WHERE p.name LIKE ?
        OR w.current_name LIKE ?
        OR w.alias LIKE ?
        OR wn.name LIKE ?
      LIMIT 20
    `, [`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`]);

    res.json({ players });
  } catch (error) {
    console.error('Error searching players:', error);
    res.status(500).json({ error: 'Failed to search players' });
  }
});

// Get single player with all stats
router.get('/:steamid', async (req, res) => {
  try {
    const { steamid } = req.params;

    // Basic player info
    const [playerRows] = await pool.query<RowDataPacket[]>(`
      SELECT
        p.*,
        w.first_name,
        w.current_name,
        w.alias,
        w.first_seen,
        w.last_seen,
        w.connection_count
      FROM soccer_mod_players p
      LEFT JOIN whois_players w ON p.steamid = w.steamid
      WHERE p.steamid = ?
    `, [steamid]);

    if (playerRows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Match stats
    const [matchStats] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM soccer_mod_match_stats WHERE steamid = ?',
      [steamid]
    );

    // Public stats
    const [publicStats] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM soccer_mod_public_stats WHERE steamid = ?',
      [steamid]
    );

    // Position stats
    const [positions] = await pool.query<RowDataPacket[]>(
      'SELECT * FROM soccer_mod_positions WHERE steamid = ?',
      [steamid]
    );

    // Name history
    const [nameHistory] = await pool.query<RowDataPacket[]>(
      'SELECT name, first_used, last_used FROM whois_names WHERE steamid = ? ORDER BY last_used DESC',
      [steamid]
    );

    res.json({
      player: playerRows[0],
      matchStats: matchStats[0] || null,
      publicStats: publicStats[0] || null,
      positions: positions[0] || null,
      nameHistory
    });
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

export default router;
