import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities: result }) => setActivities(result))
      .catch(() => setError('Unable to load activities. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {loading ? <p role="status">Loading activities...</p> : null}
        {error ? <p role="alert">{error}</p> : null}
        {!loading && !error && activities.length === 0 ? <p>No activities yet.</p> : null}
        {!loading && !error && activities.length > 0 ? (
          <ul className="list-group">
            {activities.map((activity, index) => (
              <li className="list-group-item" key={activity._id ?? `${activity.type}-${index}`}>
                <strong>{activity.type}</strong>: {activity.minutes} minutes, {activity.points} points
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
