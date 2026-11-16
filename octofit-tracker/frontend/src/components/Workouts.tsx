import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  _id?: string;
  title: string;
  focus?: string;
  minutes?: number;
  difficulty?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userEmail = encodeURIComponent('mona@example.com');
    getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${userEmail}`)
      .then(({ suggestions: result }) => setSuggestions(result))
      .catch(() => setError('Unable to load workout suggestions. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {loading ? <p role="status">Loading workout suggestions...</p> : null}
        {error ? <p role="alert">{error}</p> : null}
        {!loading && !error && suggestions.length === 0 ? <p>No workout suggestions yet.</p> : null}
        {!loading && !error && suggestions.length > 0 ? (
          <ul className="list-group">
            {suggestions.map((workout, index) => (
              <li className="list-group-item" key={workout._id ?? `${workout.title}-${index}`}>
                <strong>{workout.title}</strong>
                {workout.focus ? <span> - {workout.focus}</span> : null}
                {workout.minutes !== undefined ? <span> ({workout.minutes} minutes)</span> : null}
                {workout.reason ? <p className="mb-0">{workout.reason}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
