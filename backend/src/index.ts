import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import playersRouter from './routes/players.js';
import leaderboardRouter from './routes/leaderboard.js';
import statsRouter from './routes/stats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/players', playersRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/stats', statsRouter);

// Serve frontend in production
app.use(express.static(path.join(__dirname, '../public')));
app.get('/{*path}', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Soccer Stats API running on port ${PORT}`);
});
