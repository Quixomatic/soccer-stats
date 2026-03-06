import { Router, type Router as RouterType, type Request, type Response, type NextFunction } from 'express';
import pool from '../db.js';
import { ResultSetHeader } from 'mysql2';

const router: RouterType = Router();

// Auth middleware — check Bearer token against SYNC_API_KEY env var
function requireSyncAuth(req: Request, res: Response, next: NextFunction): void {
  const syncKey = process.env.SYNC_API_KEY;
  if (!syncKey) {
    res.status(503).json({ error: 'Sync not configured on server' });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization' });
    return;
  }

  const token = authHeader.slice(7);
  if (token !== syncKey) {
    res.status(401).json({ error: 'Invalid authorization' });
    return;
  }

  next();
}

router.use(requireSyncAuth);

// Ensure player exists in stats tables (helper)
async function ensurePlayer(steamid: string, name?: string): Promise<void> {
  // Check if player exists in players table
  const [rows] = await pool.query<any[]>(
    'SELECT steamid FROM soccer_mod_players WHERE steamid = ?',
    [steamid]
  );

  if (rows.length === 0) {
    const now = Math.floor(Date.now() / 1000);
    await pool.query(
      'INSERT INTO soccer_mod_players (steamid, name, created, last_connected, player_ip, server_ip) VALUES (?, ?, ?, ?, ?, ?)',
      [steamid, name || 'Unknown', now, now, '', '']
    );
    await pool.query('INSERT IGNORE INTO soccer_mod_match_stats (steamid) VALUES (?)', [steamid]);
    await pool.query('INSERT IGNORE INTO soccer_mod_public_stats (steamid) VALUES (?)', [steamid]);
    await pool.query('INSERT IGNORE INTO soccer_mod_positions (steamid) VALUES (?)', [steamid]);
  }
}

// POST /api/sync/player — Upsert player record
router.post('/player', async (req: Request, res: Response) => {
  try {
    const { steamid, name, ip, server_ip, last_connected } = req.body;

    if (!steamid) {
      res.status(400).json({ error: 'steamid is required' });
      return;
    }

    const [rows] = await pool.query<any[]>(
      'SELECT steamid FROM soccer_mod_players WHERE steamid = ?',
      [steamid]
    );

    if (rows.length > 0) {
      await pool.query(
        'UPDATE soccer_mod_players SET name = ?, last_connected = ?, player_ip = ?, server_ip = ? WHERE steamid = ?',
        [name || 'Unknown', last_connected || Math.floor(Date.now() / 1000), ip || '', server_ip || '', steamid]
      );
    } else {
      const now = last_connected || Math.floor(Date.now() / 1000);
      await pool.query(
        'INSERT INTO soccer_mod_players (steamid, name, created, last_connected, player_ip, server_ip) VALUES (?, ?, ?, ?, ?, ?)',
        [steamid, name || 'Unknown', now, now, ip || '', server_ip || '']
      );
      await pool.query('INSERT IGNORE INTO soccer_mod_match_stats (steamid) VALUES (?)', [steamid]);
      await pool.query('INSERT IGNORE INTO soccer_mod_public_stats (steamid) VALUES (?)', [steamid]);
      await pool.query('INSERT IGNORE INTO soccer_mod_positions (steamid) VALUES (?)', [steamid]);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error syncing player:', error);
    res.status(500).json({ error: 'Failed to sync player' });
  }
});

// POST /api/sync/stat — Increment a stat column
router.post('/stat', async (req: Request, res: Response) => {
  try {
    const { steamid, name, stat, increment, points, context } = req.body;

    if (!steamid || !stat || !context) {
      res.status(400).json({ error: 'steamid, stat, and context are required' });
      return;
    }

    // Validate context
    if (context !== 'match' && context !== 'public') {
      res.status(400).json({ error: 'context must be "match" or "public"' });
      return;
    }

    // Validate stat column name (whitelist to prevent SQL injection)
    const validStats = ['goals', 'assists', 'own_goals', 'hits', 'passes', 'interceptions', 'ball_losses', 'saves', 'rounds_won', 'rounds_lost'];
    if (!validStats.includes(stat)) {
      res.status(400).json({ error: `Invalid stat: ${stat}` });
      return;
    }

    const table = context === 'match' ? 'soccer_mod_match_stats' : 'soccer_mod_public_stats';
    const inc = increment || 1;
    const pts = points || 0;

    await ensurePlayer(steamid, name);

    await pool.query(
      `UPDATE ${table} SET ${stat} = ${stat} + ?, points = points + ? WHERE steamid = ?`,
      [inc, pts, steamid]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('Error syncing stat:', error);
    res.status(500).json({ error: 'Failed to sync stat' });
  }
});

// POST /api/sync/match-count — Increment matches played
router.post('/match-count', async (req: Request, res: Response) => {
  try {
    const { steamid, name } = req.body;

    if (!steamid) {
      res.status(400).json({ error: 'steamid is required' });
      return;
    }

    await ensurePlayer(steamid, name);

    await pool.query(
      'UPDATE soccer_mod_match_stats SET matches = matches + 1 WHERE steamid = ?',
      [steamid]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('Error syncing match count:', error);
    res.status(500).json({ error: 'Failed to sync match count' });
  }
});

// POST /api/sync/round-stats — Bulk increment all stats for a player from a round
router.post('/round-stats', async (req: Request, res: Response) => {
  try {
    const { steamid, name, context, goals, assists, own_goals, hits, passes, interceptions, ball_losses, saves, rounds_won, rounds_lost, points } = req.body;

    if (!steamid || !context) {
      res.status(400).json({ error: 'steamid and context are required' });
      return;
    }

    if (context !== 'match' && context !== 'public') {
      res.status(400).json({ error: 'context must be "match" or "public"' });
      return;
    }

    const table = context === 'match' ? 'soccer_mod_match_stats' : 'soccer_mod_public_stats';

    await ensurePlayer(steamid, name);

    await pool.query(
      `UPDATE ${table} SET
        goals = goals + ?, assists = assists + ?, own_goals = own_goals + ?,
        hits = hits + ?, passes = passes + ?, interceptions = interceptions + ?,
        ball_losses = ball_losses + ?, saves = saves + ?,
        rounds_won = rounds_won + ?, rounds_lost = rounds_lost + ?,
        points = points + ?
      WHERE steamid = ?`,
      [
        goals || 0, assists || 0, own_goals || 0,
        hits || 0, passes || 0, interceptions || 0,
        ball_losses || 0, saves || 0,
        rounds_won || 0, rounds_lost || 0,
        points || 0, steamid
      ]
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('Error syncing round stats:', error);
    res.status(500).json({ error: 'Failed to sync round stats' });
  }
});

// POST /api/sync/award — Increment MVP or MOTM
router.post('/award', async (req: Request, res: Response) => {
  try {
    const { steamid, name, award, points, context } = req.body;

    if (!steamid || !award) {
      res.status(400).json({ error: 'steamid and award are required' });
      return;
    }

    // Validate award
    if (award !== 'mvp' && award !== 'motm') {
      res.status(400).json({ error: 'award must be "mvp" or "motm"' });
      return;
    }

    // Validate context
    if (context && context !== 'match' && context !== 'public') {
      res.status(400).json({ error: 'context must be "match" or "public"' });
      return;
    }

    const table = (context === 'public') ? 'soccer_mod_public_stats' : 'soccer_mod_match_stats';
    const pts = points || 0;

    await ensurePlayer(steamid, name);

    if (pts > 0) {
      await pool.query(
        `UPDATE ${table} SET ${award} = ${award} + 1, points = points + ? WHERE steamid = ?`,
        [pts, steamid]
      );
    } else {
      await pool.query(
        `UPDATE ${table} SET ${award} = ${award} + 1 WHERE steamid = ?`,
        [steamid]
      );
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Error syncing award:', error);
    res.status(500).json({ error: 'Failed to sync award' });
  }
});

// POST /api/sync/full — Full sync: replace all remote data with local data
router.post('/full', async (req: Request, res: Response) => {
  try {
    const { players } = req.body;

    if (!Array.isArray(players)) {
      res.status(400).json({ error: 'players array is required' });
      return;
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      let synced = 0;
      for (const p of players) {
        const steamid = p.steamid;
        if (!steamid) continue;

        const now = Math.floor(Date.now() / 1000);

        // Upsert player
        await conn.query(
          `INSERT INTO soccer_mod_players (steamid, name, last_connected, created, play_time, player_ip, server_ip, money)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             last_connected = VALUES(last_connected),
             play_time = VALUES(play_time),
             player_ip = VALUES(player_ip),
             server_ip = VALUES(server_ip),
             money = VALUES(money)`,
          [
            steamid,
            p.name || 'Unknown',
            p.last_connected || now,
            p.created || now,
            p.play_time || 0,
            p.ip || '',
            p.server_ip || '',
            p.money || 0
          ]
        );

        // Upsert match stats (replace values, not increment)
        const ms = p.match_stats || {};
        await conn.query(
          `INSERT INTO soccer_mod_match_stats (steamid, goals, assists, own_goals, hits, passes, interceptions, ball_losses, saves, rounds_won, rounds_lost, points, mvp, motm, matches)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             goals = VALUES(goals), assists = VALUES(assists), own_goals = VALUES(own_goals),
             hits = VALUES(hits), passes = VALUES(passes), interceptions = VALUES(interceptions),
             ball_losses = VALUES(ball_losses), saves = VALUES(saves),
             rounds_won = VALUES(rounds_won), rounds_lost = VALUES(rounds_lost),
             points = VALUES(points), mvp = VALUES(mvp), motm = VALUES(motm), matches = VALUES(matches)`,
          [
            steamid,
            ms.goals || 0, ms.assists || 0, ms.own_goals || 0,
            ms.hits || 0, ms.passes || 0, ms.interceptions || 0,
            ms.ball_losses || 0, ms.saves || 0,
            ms.rounds_won || 0, ms.rounds_lost || 0,
            ms.points || 0, ms.mvp || 0, ms.motm || 0, ms.matches || 0
          ]
        );

        // Upsert public stats (replace values, not increment)
        const ps = p.public_stats || {};
        await conn.query(
          `INSERT INTO soccer_mod_public_stats (steamid, goals, assists, own_goals, hits, passes, interceptions, ball_losses, saves, rounds_won, rounds_lost, points, mvp, motm)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             goals = VALUES(goals), assists = VALUES(assists), own_goals = VALUES(own_goals),
             hits = VALUES(hits), passes = VALUES(passes), interceptions = VALUES(interceptions),
             ball_losses = VALUES(ball_losses), saves = VALUES(saves),
             rounds_won = VALUES(rounds_won), rounds_lost = VALUES(rounds_lost),
             points = VALUES(points), mvp = VALUES(mvp), motm = VALUES(motm)`,
          [
            steamid,
            ps.goals || 0, ps.assists || 0, ps.own_goals || 0,
            ps.hits || 0, ps.passes || 0, ps.interceptions || 0,
            ps.ball_losses || 0, ps.saves || 0,
            ps.rounds_won || 0, ps.rounds_lost || 0,
            ps.points || 0, ps.mvp || 0, ps.motm || 0
          ]
        );

        // Ensure positions row exists
        await conn.query('INSERT IGNORE INTO soccer_mod_positions (steamid) VALUES (?)', [steamid]);

        synced++;
      }

      await conn.commit();
      res.json({ ok: true, synced });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error during full sync:', error);
    res.status(500).json({ error: 'Failed to perform full sync' });
  }
});

export default router;
