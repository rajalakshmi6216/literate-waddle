import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams: result }) => setTeams(result))
      .catch(() => setError('Unable to load teams. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {loading ? <p role="status">Loading teams...</p> : null}
        {error ? <p role="alert">{error}</p> : null}
        {!loading && !error && teams.length === 0 ? <p>No teams yet.</p> : null}
        {!loading && !error && teams.length > 0 ? (
          <ul className="list-group">
            {teams.map((team, index) => (
              <li className="list-group-item" key={team._id ?? `${team.name}-${index}`}>
                <strong>{team.name}</strong>
                {team.mascot ? <span> - {team.mascot}</span> : null}
                <p className="mb-0">Members: {team.members.join(', ') || 'None'}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
