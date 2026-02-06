import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

function formatPlaytime(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  return `${hours}h`;
}

function MotdSkeleton() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <Skeleton className="h-10 w-64 mx-auto bg-zinc-800" />
          <Skeleton className="h-5 w-40 mx-auto mt-2 bg-zinc-800" />
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-zinc-800 rounded-lg p-4 text-center">
              <Skeleton className="h-9 w-16 mx-auto bg-zinc-700" />
              <Skeleton className="h-4 w-12 mx-auto mt-2 bg-zinc-700" />
            </div>
          ))}
        </div>

        {/* Match vs Public breakdown */}
        <div className="grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-zinc-800 rounded-lg p-4">
              <Skeleton className="h-6 w-28 mb-3 bg-zinc-700" />
              <div className="space-y-2">
                {[...Array(6)].map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-5 w-16 bg-zinc-700" />
                    <Skeleton className="h-5 w-10 bg-zinc-700" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Positions */}
        <div className="mt-4 bg-zinc-800 rounded-lg p-4">
          <Skeleton className="h-6 w-24 mb-3 bg-zinc-700" />
          <div className="flex justify-between">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-8 w-8 mx-auto bg-zinc-700" />
                <Skeleton className="h-4 w-6 mx-auto mt-1 bg-zinc-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Motd() {
  const { steamid } = useParams<{ steamid: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['player', steamid],
    queryFn: () => api.players.get(steamid!),
    enabled: !!steamid,
  });

  if (isLoading) {
    return <MotdSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-red-400">Player not found</div>
      </div>
    );
  }

  const { player, matchStats, publicStats, positions } = data;
  const displayName = player.alias || player.current_name || player.name;

  // Calculate favorite position
  let favoritePosition = 'N/A';
  if (positions) {
    const posMap: Record<string, number> = {
      GK: positions.gk,
      LB: positions.lb,
      RB: positions.rb,
      MF: positions.mf,
      LW: positions.lw,
      RW: positions.rw,
    };
    const maxPos = Object.entries(posMap).reduce((a, b) => (b[1] > a[1] ? b : a));
    if (maxPos[1] > 0) favoritePosition = maxPos[0];
  }

  // Combined totals
  const totalGoals = (matchStats?.goals || 0) + (publicStats?.goals || 0);
  const totalAssists = (matchStats?.assists || 0) + (publicStats?.assists || 0);
  const totalSaves = (matchStats?.saves || 0) + (publicStats?.saves || 0);
  const totalPoints = (matchStats?.points || 0) + (publicStats?.points || 0);

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-green-400 truncate">{displayName}</h1>
          <div className="text-lg text-zinc-500 mt-1">
            {formatPlaytime(player.play_time)} played • {favoritePosition}
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatBox label="Goals" value={totalGoals} color="text-yellow-400" />
          <StatBox label="Assists" value={totalAssists} color="text-blue-400" />
          <StatBox label="Saves" value={totalSaves} color="text-green-400" />
          <StatBox label="Points" value={totalPoints} color="text-purple-400" />
        </div>

        {/* Match vs Public breakdown */}
        <div className="grid grid-cols-2 gap-4 text-base">
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="text-zinc-400 font-semibold text-lg mb-3">Match Stats</div>
            {matchStats ? (
              <div className="space-y-2">
                <Row label="Points" value={matchStats.points} />
                <Row label="Goals" value={matchStats.goals} />
                <Row label="Assists" value={matchStats.assists} />
                <Row label="Saves" value={matchStats.saves} />
                <Row label="Matches" value={matchStats.matches} />
                <Row label="MVP" value={matchStats.mvp} />
                <Row label="W/L" value={`${matchStats.rounds_won}/${matchStats.rounds_lost}`} />
              </div>
            ) : (
              <div className="text-zinc-600 text-center py-4">No data</div>
            )}
          </div>

          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="text-zinc-400 font-semibold text-lg mb-3">Public Stats</div>
            {publicStats ? (
              <div className="space-y-2">
                <Row label="Points" value={publicStats.points} />
                <Row label="Goals" value={publicStats.goals} />
                <Row label="Assists" value={publicStats.assists} />
                <Row label="Saves" value={publicStats.saves} />
                <Row label="Hits" value={publicStats.hits} />
                <Row label="Passes" value={publicStats.passes} />
              </div>
            ) : (
              <div className="text-zinc-600 text-center py-4">No data</div>
            )}
          </div>
        </div>

        {/* Position breakdown */}
        {positions && (
          <div className="mt-4 bg-zinc-800 rounded-lg p-4">
            <div className="text-zinc-400 font-semibold text-lg mb-3">Positions</div>
            <div className="flex justify-between text-base">
              <PosBox label="GK" value={positions.gk} />
              <PosBox label="LB" value={positions.lb} />
              <PosBox label="RB" value={positions.rb} />
              <PosBox label="MF" value={positions.mf} />
              <PosBox label="LW" value={positions.lw} />
              <PosBox label="RW" value={positions.rw} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-zinc-600">
          <Link to={`/player/${steamid}`} className="hover:text-zinc-400">
            View Full Stats
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-zinc-800 rounded-lg p-4 text-center">
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-zinc-500 uppercase mt-1">{label}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between text-lg">
      <span className="text-zinc-500">{label}</span>
      <span className="text-zinc-200 font-medium">{value}</span>
    </div>
  );
}

function PosBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-zinc-200 text-2xl font-semibold">{value}</div>
      <div className="text-zinc-500 text-sm">{label}</div>
    </div>
  );
}
