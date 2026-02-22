import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { get } from '../lib/api.js';
import { QUERY_KEYS } from '../lib/queryKeys.js';
import ChildCard from '../components/ChildCard.jsx';

function formatUpcomingDate(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isToday = d.toDateString() === today.toDateString();
  const isTomorrow = d.toDateString() === tomorrow.toDateString();

  const time = d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today • ${time}`;
  if (isTomorrow) return `Tomorrow • ${time}`;
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) + ` • ${time}`;
}

export default function ParentDashboard() {
  const { data: family, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.family(),
    queryFn: () => get('/api/v1/parent/stub'),
  });

  // Collect upcoming sessions from all students' enrolments
  const upcomingSessions = useMemo(() => {
    if (!family) return [];
    return family.students
      .flatMap(student =>
        student.enrolments
          .filter(e => e.cohort.nextSession)
          .map(e => ({
            studentName: student.firstName,
            cohortName: e.cohort.name,
            scheduledAt: e.cohort.nextSession.scheduledAt,
          }))
      )
      .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
  }, [family]);

  return (
    <div>
      {/* Page header */}
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight mb-2">Parent Dashboard</h1>
          {family && (
            <p className="text-slate-500">
              Welcome back, {family.name.replace(' Family', '')}. Here is an overview of your children's progress.
            </p>
          )}
          {!family && !isLoading && !isError && (
            <p className="text-slate-500">Welcome back.</p>
          )}
        </div>
        <div className="flex gap-3">
          <button type="button" title="Course enrolment coming soon" disabled className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full text-sm font-bold opacity-50 cursor-not-allowed">
            <Icon icon="lucide:plus" className="w-4 h-4" />
            Enroll in New Class
          </button>
        </div>
      </header>

      {isError && (
        <p className="text-rose-500 text-sm mb-8">Failed to load family data. Is the API running?</p>
      )}

      {/* 12-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* ── Main column (8/12) ── */}
        <div className="lg:col-span-8 space-y-12">

          {/* Enrolled Students */}
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-semibold">Enrolled Students</h2>
            </div>

            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2].map(i => (
                  <div key={i} className="border border-slate-100 p-6 rounded-2xl bg-slate-50 animate-pulse h-56" />
                ))}
              </div>
            )}

            {family && family.students.length === 0 && (
              <p className="text-slate-400 text-sm">No students found. Add a student to get started.</p>
            )}

            {family && family.students.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {family.students.map((student, i) => (
                  <ChildCard key={student.id} student={student} index={i} />
                ))}
              </div>
            )}
          </section>

          {/* Recent Assessments */}
          <section>
            <h2 className="text-2xl font-semibold mb-8">Recent Assessments</h2>
            <div className="overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left bg-white border-collapse">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400">
                  <tr className="border-b border-slate-100">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Assessment</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Score</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-50">
                  {isLoading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center">
                        <div className="animate-pulse h-4 bg-slate-100 rounded w-48 mx-auto" />
                      </td>
                    </tr>
                  )}
                  {!isLoading && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-slate-400">
                        <Icon icon="lucide:clipboard-list" className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Assessment results will appear here once grading is set up.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ── Aside column (4/12) ── */}
        <aside className="lg:col-span-4 space-y-8">

          {/* Upcoming Classes */}
          <div className="p-8 bg-slate-50 border border-slate-100 rounded-2xl">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Icon icon="lucide:calendar" className="text-slate-400 w-5 h-5" />
              Upcoming Classes
            </h2>

            {isLoading && (
              <div className="space-y-6">
                {[1, 2].map(i => (
                  <div key={i} className="animate-pulse h-12 bg-slate-100 rounded-xl" />
                ))}
              </div>
            )}

            {!isLoading && !isError && upcomingSessions.length === 0 && (
              <p className="text-sm text-slate-400 italic">No upcoming sessions scheduled.</p>
            )}

            {upcomingSessions.length > 0 && (
              <div className="space-y-6">
                {upcomingSessions.slice(0, 4).map((session, i) => (
                  <div key={i} className="relative pl-6 border-l-2 border-slate-200">
                    <div
                      className={`absolute -left-[5px] top-0 w-2 h-2 rounded-full ${
                        i === 0 ? 'bg-black' : 'bg-slate-200'
                      }`}
                    />
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-slate-400 uppercase">
                        {formatUpcomingDate(session.scheduledAt)}
                      </span>
                      <h4 className="text-sm font-bold">{session.cohortName}</h4>
                      <p className="text-xs text-slate-500">Student: {session.studentName}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              to="/parent/calendar"
              className="block w-full mt-8 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-center hover:bg-slate-50 transition-colors"
            >
              View Full Calendar
            </Link>
          </div>

          {/* Parent Resources */}
          <div className="p-8 bg-black text-white rounded-2xl relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-xl font-semibold mb-3">Parent Resources</h2>
              <p className="text-slate-400 text-sm mb-6">
                Join our parent community to discuss curriculum and future paths.
              </p>
              <button type="button" title="Community coming soon" disabled className="inline-flex items-center gap-2 text-sm font-bold border-b border-white pb-1 opacity-60 cursor-not-allowed">
                Explore Community
              </button>
            </div>
            <Icon
              icon="lucide:users"
              className="absolute -bottom-4 -right-4 text-white/10 w-24 h-24"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
