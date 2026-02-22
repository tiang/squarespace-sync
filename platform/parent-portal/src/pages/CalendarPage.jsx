import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { Badge } from '@ra/ui';
import { get } from '../lib/api.js';
import { QUERY_KEYS } from '../lib/queryKeys.js';

// ── Date helpers ──────────────────────────────────────────────────────────────

function startOfWeek(date) {
  // Returns the Monday of the week containing `date`
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon, …
  const daysFromMonday = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - daysFromMonday);
  return d;
}

function weekLabel(session, thisMonday, nextMonday) {
  const d = new Date(session.scheduledAt);
  const sessionMonday = startOfWeek(d);
  if (sessionMonday.getTime() === thisMonday.getTime()) return 'This week';
  if (sessionMonday.getTime() === nextMonday.getTime()) return 'Next week';
  return 'Week of ' + sessionMonday.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
}

function groupByWeek(sessions) {
  const thisMonday = startOfWeek(new Date());
  const nextMonday = new Date(thisMonday);
  nextMonday.setDate(thisMonday.getDate() + 7);

  const groups = new Map(); // preserves insertion order

  for (const session of sessions) {
    const label = weekLabel(session, thisMonday, nextMonday);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(session);
  }

  return groups;
}

function formatSessionTime(isoString, durationMinutes) {
  const d = new Date(isoString);
  const day = d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  const dur = hours > 0
    ? `${hours} hr${mins > 0 ? ` ${mins} min` : ''}`
    : `${mins} min`;
  return `${day} · ${time} · ${dur}`;
}

// ── Session row ───────────────────────────────────────────────────────────────

function SessionRow({ session }) {
  const isCancelled = session.status === 'CANCELLED';
  const studentNames = session.students.map(s => s.firstName).join(', ');

  return (
    <div
      className={`flex items-center gap-6 px-6 py-4 border-b border-slate-50 last:border-0 transition-colors hover:bg-slate-50/50 ${
        isCancelled ? 'opacity-50' : ''
      }`}
    >
      {/* Date/time */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider mb-1 text-slate-400">
          {formatSessionTime(session.scheduledAt, session.durationMinutes)}
        </p>
        <p className={`font-semibold text-sm truncate ${isCancelled ? 'line-through text-slate-400' : 'text-slate-900'}`}>
          {session.cohortName}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {session.campusName}{studentNames ? ` · ${studentNames}` : ''}
        </p>
      </div>

      {/* Badge */}
      <Badge status={session.status} />
    </div>
  );
}

// ── Week group ────────────────────────────────────────────────────────────────

function WeekGroup({ label, sessions }) {
  return (
    <section>
      <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{label}</h2>
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        {sessions.map(session => (
          <SessionRow key={session.id} session={session} />
        ))}
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { data: sessions = [], isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.sessions(),
    queryFn: () => get('/api/v1/parent/stub/sessions'),
  });

  const groups = useMemo(() => groupByWeek(sessions), [sessions]);

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Calendar</h1>
        <p className="text-slate-500">All upcoming sessions across your enrolled children.</p>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-8">
          {[1, 2].map(i => (
            <div key={i}>
              <div className="animate-pulse h-3 w-20 bg-slate-200 rounded mb-3" />
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-50">
                {[1, 2, 3].map(j => (
                  <div key={j} className="px-6 py-4 flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="animate-pulse h-2 w-32 bg-slate-100 rounded" />
                      <div className="animate-pulse h-3 w-48 bg-slate-200 rounded" />
                      <div className="animate-pulse h-2 w-24 bg-slate-100 rounded" />
                    </div>
                    <div className="animate-pulse h-5 w-16 bg-slate-100 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="text-rose-500 text-sm">Failed to load sessions. Is the API running?</p>
      )}

      {/* Empty state */}
      {!isLoading && !isError && groups.size === 0 && (
        <div className="text-center py-24 text-slate-400">
          <Icon icon="lucide:calendar-x" className="w-12 h-12 mx-auto mb-4 opacity-40" />
          <p className="font-medium mb-1">No upcoming sessions</p>
          <p className="text-sm">Sessions will appear here once they're scheduled.</p>
        </div>
      )}

      {/* Session groups */}
      {!isLoading && groups.size > 0 && (
        <div className="space-y-8">
          {[...groups.entries()].map(([label, groupSessions]) => (
            <WeekGroup key={label} label={label} sessions={groupSessions} />
          ))}
        </div>
      )}
    </div>
  );
}
