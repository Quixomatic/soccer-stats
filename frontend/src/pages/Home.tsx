import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';

type MatchSort = 'points_per_match' | 'points' | 'goals' | 'assists' | 'saves' | 'matches' | 'mvp' | 'motm';
type PublicSort = 'points' | 'goals' | 'assists' | 'saves' | 'mvp' | 'motm';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const tab = searchParams.get('tab') || 'match';
  const [matchSort, setMatchSort] = useState<MatchSort>('points_per_match');
  const [publicSort, setPublicSort] = useState<PublicSort>('points');

  const { data: summary } = useQuery({
    queryKey: ['stats-summary'],
    queryFn: api.stats.summary,
  });

  const { data: matchLeaderboard, isLoading: matchLoading } = useQuery({
    queryKey: ['leaderboard-match', matchSort],
    queryFn: () => api.leaderboard.match(matchSort, 50),
  });

  const { data: publicLeaderboard, isLoading: publicLoading } = useQuery({
    queryKey: ['leaderboard-public', publicSort],
    queryFn: () => api.leaderboard.public(publicSort, 50),
  });

  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: () => api.players.search(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  const currentLeaderboard = tab === 'match' ? matchLeaderboard : publicLeaderboard;
  const isLoading = tab === 'match' ? matchLoading : publicLoading;
  const currentSort = tab === 'match' ? matchSort : publicSort;

  function SortableHead({ label, sortKey, className = '' }: { label: string; sortKey: string; className?: string }) {
    const isActive = currentSort === sortKey;
    return (
      <TableHead
        className={`text-right cursor-pointer select-none hover:text-foreground ${isActive ? 'text-foreground font-bold' : ''} ${className}`}
        onClick={() => {
          if (tab === 'match') setMatchSort(sortKey as MatchSort);
          else setPublicSort(sortKey as PublicSort);
        }}
      >
        {label}{isActive ? ' \u25BC' : ''}
      </TableHead>
    );
  }

  const matchColumns = tab === 'match';

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {summary ? (
            <>
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
            </>
          ) : (
            [...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          )}
        </div>

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
                      {matchColumns && <SortableHead label="Pts/Match" sortKey="points_per_match" />}
                      <SortableHead label="Points" sortKey="points" />
                      <SortableHead label="Goals" sortKey="goals" />
                      <SortableHead label="Assists" sortKey="assists" />
                      <SortableHead label="Saves" sortKey="saves" />
                      <SortableHead label="MVP" sortKey="mvp" />
                      <SortableHead label="MOTM" sortKey="motm" />
                      {matchColumns && <SortableHead label="Matches" sortKey="matches" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      [...Array(10)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-5 w-6" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                          {[...Array(matchColumns ? 9 : 7)].map((_, j) => (
                            <TableCell key={j} className="text-right"><Skeleton className="h-5 w-8 ml-auto" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : !currentLeaderboard?.players?.length ? (
                      <TableRow>
                        <TableCell colSpan={matchColumns ? 11 : 9} className="text-center text-muted-foreground py-8">
                          No players found
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentLeaderboard.players.map((player, i) => (
                        <TableRow key={player.steamid}>
                          <TableCell className="font-medium">{i + 1}</TableCell>
                          <TableCell>
                            <Link to={`/player/${player.steamid}`} className="hover:underline">
                              {player.name}
                            </Link>
                          </TableCell>
                          {matchColumns && <TableCell className="text-right font-semibold">{player.points_per_match}</TableCell>}
                          <TableCell className="text-right">{player.points}</TableCell>
                          <TableCell className="text-right">{player.goals}</TableCell>
                          <TableCell className="text-right">{player.assists}</TableCell>
                          <TableCell className="text-right">{player.saves}</TableCell>
                          <TableCell className="text-right">{player.mvp}</TableCell>
                          <TableCell className="text-right">{player.motm}</TableCell>
                          {matchColumns && <TableCell className="text-right">{player.matches}</TableCell>}
                        </TableRow>
                      ))
                    )}
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
