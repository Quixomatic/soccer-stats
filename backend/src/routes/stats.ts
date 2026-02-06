import { Router } from 'express';
import pool from '../db.js';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Overall server statistics
router.get('/summary', async (req, res) => {
  try {
    const [playerCount] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as total FROM soccer_mod_players'
    );

    const [matchTotals] = await pool.query<RowDataPacket[]>(`
      SELECT
        SUM(goals) as total_goals,
        SUM(assists) as total_assists,
        SUM(saves) as total_saves,
        SUM(matches) as total_matches
      FROM soccer_mod_match_stats
    `);

    const [publicTotals] = await pool.query<RowDataPacket[]>(`
      SELECT
        SUM(goals) as total_goals,
        SUM(assists) as total_assists,
        SUM(saves) as total_saves
      FROM soccer_mod_public_stats
    `);

    const [recentPlayers] = await pool.query<RowDataPacket[]>(`
      SELECT COUNT(*) as count
      FROM soccer_mod_players
      WHERE last_connected > UNIX_TIMESTAMP(NOW() - INTERVAL 7 DAY)
    `);

    res.json({
      totalPlayers: playerCount[0].total,
      activeLast7Days: recentPlayers[0].count,
      matchStats: {
        goals: matchTotals[0]?.total_goals || 0,
        assists: matchTotals[0]?.total_assists || 0,
        saves: matchTotals[0]?.total_saves || 0,
        matches: matchTotals[0]?.total_matches || 0
      },
      publicStats: {
        goals: publicTotals[0]?.total_goals || 0,
        assists: publicTotals[0]?.total_assists || 0,
        saves: publicTotals[0]?.total_saves || 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats summary:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Position distribution
router.get('/positions', async (req, res) => {
  try {
    const [positions] = await pool.query<RowDataPacket[]>(`
      SELECT
        SUM(gk) as goalkeeper,
        SUM(lb) as left_back,
        SUM(rb) as right_back,
        SUM(mf) as midfielder,
        SUM(lw) as left_wing,
        SUM(rw) as right_wing
      FROM soccer_mod_positions
    `);

    res.json({ positions: positions[0] });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({ error: 'Failed to fetch positions' });
  }
});

export default router;
