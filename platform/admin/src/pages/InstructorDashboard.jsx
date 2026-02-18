import { useQuery } from '@tanstack/react-query';
import { get } from '../lib/api';
import SessionCard from '../components/SessionCard';

function formatDate(date) {
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function InstructorDashboard() {
  const { data: sessions = [], isLoading, isError } = useQuery({
    queryKey: ['instructor-sessions'],
    queryFn: () => get('/api/v1/instructor/sessions'),
  });

  return (
    <main className="max-w-[1440px] mx-auto px-6 md:px-10 pt-24 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="space-y-1">
          <h1 className="text-4xl font-semibold tracking-tight">Today's Sessions</h1>
          <p className="text-slate-500">{formatDate(new Date())}</p>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map(i => (
            <div key={i} className="border border-slate-100 p-8 rounded-2xl bg-slate-50/30 animate-pulse h-48" />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-rose-500 text-sm">Failed to load sessions. Is the API running?</p>
      )}

      {!isLoading && !isError && sessions.length === 0 && (
        <div className="text-center py-24">
          <p className="text-slate-400 text-lg">No sessions scheduled for today.</p>
        </div>
      )}

      {!isLoading && sessions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sessions.map(session => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </main>
  );
}
