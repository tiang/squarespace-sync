import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then(setHealth)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem' }}>
      <h1>Rocket Academy Platform</h1>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {health && (
        <ul>
          <li>Status: {health.status} {health.status === 'ok' ? '✓' : '✗'}</li>
          <li>DB: {health.db} {health.db === 'connected' ? '✓' : '✗'}</li>
          <li>Timestamp: {health.timestamp}</li>
        </ul>
      )}
      {!health && !error && <p>Loading...</p>}
    </div>
  );
}
