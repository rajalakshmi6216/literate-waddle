import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard: result }) => setLeaderboard(result))
      .catch(() => setError('Unable to load leaderboard. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {loading ? <p role="status">Loading leaderboard...</p> : null}
        {error ? <p role="alert">{error}</p> : null}
        {!loading && !error && leaderboard.length === 0 ? <p>No leaderboard scores yet.</p> : null}
        {!loading && !error && leaderboard.length > 0 ? (
          <ol className="list-group list-group-numbered">
            {leaderboard.map((entry) => (
              <li className="list-group-item d-flex justify-content-between" key={entry.rank}>
                <span>{entry.teamName}</span>
                <span>{entry.totalPoints} points</span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  );
}
