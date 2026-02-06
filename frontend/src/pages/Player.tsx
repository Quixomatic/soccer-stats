import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString();
}

function formatPlaytime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export default function Player() {
  const { steamid } = useParams<{ steamid: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['player', steamid],
    queryFn: () => api.players.get(steamid!),
    enabled: !!steamid,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-destructive">Player not found</div>
      </div>
    );
  }

  const { player, matchStats, publicStats, positions, nameHistory } = data;
  const displayName = player.alias || player.current_name || player.name;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="text-muted-foreground hover:text-foreground">
            &larr; Back to Leaderboard
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{displayName}</h1>
          {player.first_name && player.first_name !== displayName && (
            <p className="text-muted-foreground">First seen as: {player.first_name}</p>
          )}
          <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
            <span>Playtime: {formatPlaytime(player.play_time)}</span>
            <span>Last seen: {formatDate(player.last_connected)}</span>
            {player.connection_count && <span>Connections: {player.connection_count}</span>}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Match Stats
                {matchStats && <Badge>{matchStats.points} pts</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {matchStats ? (
                <>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{matchStats.goals}</div>
                      <div className="text-sm text-muted-foreground">Goals</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{matchStats.assists}</div>
                      <div className="text-sm text-muted-foreground">Assists</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{matchStats.saves}</div>
                      <div className="text-sm text-muted-foreground">Saves</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{matchStats.matches}</div>
                      <div className="text-sm text-muted-foreground">Matches</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{matchStats.mvp}</div>
                      <div className="text-sm text-muted-foreground">MVP</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{matchStats.motm}</div>
                      <div className="text-sm text-muted-foreground">MOTM</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hits:</span>
                        <span>{matchStats.hits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Passes:</span>
                        <span>{matchStats.passes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Interceptions:</span>
                        <span>{matchStats.interceptions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ball Losses:</span>
                        <span>{matchStats.ball_losses}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Own Goals:</span>
                        <span>{matchStats.own_goals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">W/L:</span>
                        <span>{matchStats.rounds_won}/{matchStats.rounds_lost}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">No match stats yet</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Public Stats
                {publicStats && <Badge variant="secondary">{publicStats.points} pts</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {publicStats ? (
                <>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{publicStats.goals}</div>
                      <div className="text-sm text-muted-foreground">Goals</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{publicStats.assists}</div>
                      <div className="text-sm text-muted-foreground">Assists</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{publicStats.saves}</div>
                      <div className="text-sm text-muted-foreground">Saves</div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hits:</span>
                        <span>{publicStats.hits}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Passes:</span>
                        <span>{publicStats.passes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Interceptions:</span>
                        <span>{publicStats.interceptions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ball Losses:</span>
                        <span>{publicStats.ball_losses}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted-foreground py-8">No public stats yet</div>
              )}
            </CardContent>
          </Card>
        </div>

        {positions && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Position History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-6 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold">{positions.gk}</div>
                  <div className="text-sm text-muted-foreground">GK</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{positions.lb}</div>
                  <div className="text-sm text-muted-foreground">LB</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{positions.rb}</div>
                  <div className="text-sm text-muted-foreground">RB</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{positions.mf}</div>
                  <div className="text-sm text-muted-foreground">MF</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{positions.lw}</div>
                  <div className="text-sm text-muted-foreground">LW</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{positions.rw}</div>
                  <div className="text-sm text-muted-foreground">RW</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {nameHistory && nameHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Name History</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>First Used</TableHead>
                    <TableHead>Last Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nameHistory.map((entry, i) => (
                    <TableRow key={i}>
                      <TableCell>{entry.name}</TableCell>
                      <TableCell>{formatDate(entry.first_used)}</TableCell>
                      <TableCell>{formatDate(entry.last_used)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
