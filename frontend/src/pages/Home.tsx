import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';

function formatPlaytime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  return `${hours}h`;
}

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const tab = searchParams.get('tab') || 'match';

  const { data: summary } = useQuery({
    queryKey: ['stats-summary'],
    queryFn: api.stats.summary,
  });

  const { data: matchLeaderboard } = useQuery({
    queryKey: ['leaderboard-match'],
    queryFn: () => api.leaderboard.match('points', 50),
    enabled: tab === 'match',
  });

  const { data: publicLeaderboard } = useQuery({
    queryKey: ['leaderboard-public'],
    queryFn: () => api.leaderboard.public('points', 50),
    enabled: tab === 'public',
  });

  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => api.players.search(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  const currentLeaderboard = tab === 'match' ? matchLeaderboard : publicLeaderboard;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Soccer Stats</h1>
            <div className="relative w-64">
              <Input
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchResults && searchQuery.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                  {searchResults.players.length === 0 ? (
                    <div className="p-2 text-muted-foreground">No players found</div>
                  ) : (
                    searchResults.players.map((player) => (
                      <Link
                        key={player.steamid}
                        to={`/player/${player.steamid}`}
                        className="block p-2 hover:bg-accent"
                        onClick={() => setSearchQuery('')}
                      >
                        {player.name}
                        {player.match_points && (
                          <Badge variant="secondary" className="ml-2">
                            {player.match_points} pts
                          </Badge>
                        )}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Players</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalPlayers}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active (7d)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.activeLast7Days}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(summary.matchStats.goals + summary.publicStats.goals).toLocaleString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Matches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.matchStats.matches.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={tab} onValueChange={(v) => setSearchParams({ tab: v })}>
          <TabsList className="mb-4">
            <TabsTrigger value="match">Match Stats</TabsTrigger>
            <TabsTrigger value="public">Public Stats</TabsTrigger>
          </TabsList>

          <TabsContent value={tab}>
            <Card>
              <CardHeader>
                <CardTitle>Leaderboard</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-right">Points</TableHead>
                      <TableHead className="text-right">Goals</TableHead>
                      <TableHead className="text-right">Assists</TableHead>
                      <TableHead className="text-right">Saves</TableHead>
                      {tab === 'match' && <TableHead className="text-right">Matches</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentLeaderboard?.players.map((player, i) => (
                      <TableRow key={player.steamid}>
                        <TableCell className="font-medium">{i + 1}</TableCell>
                        <TableCell>
                          <Link to={`/player/${player.steamid}`} className="hover:underline">
                            {player.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">{player.points}</TableCell>
                        <TableCell className="text-right">{player.goals}</TableCell>
                        <TableCell className="text-right">{player.assists}</TableCell>
                        <TableCell className="text-right">{player.saves}</TableCell>
                        {tab === 'match' && <TableCell className="text-right">{player.matches}</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
