import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { get } from '../lib/api.js';
import { QUERY_KEYS } from '../lib/queryKeys.js';
import { Badge } from '@ra/ui';

const TABS = ['Progress', 'Attendance', 'Projects'];

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function AttendanceTab({ studentId }) {
  const { data: records = [], isLoading } = useQuery({
    queryKey: QUERY_KEYS.attendance(studentId),
    queryFn: () => get(`/api/v1/parent/stub/students/${studentId}/attendance`),
  });

  if (isLoading) return <div className="animate-pulse h-32 bg-slate-50 rounded-2xl" />;

  if (records.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <Icon icon="lucide:calendar-x" className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">No attendance records yet.</p>
      </div>
    );
  }

  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const rate = Math.round((presentCount / records.length) * 100);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <span className="text-3xl font-bold">{rate}%</span>
        <span className="text-slate-500 text-sm">attendance rate ({presentCount}/{records.length} sessions)</span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-400">
            <tr className="border-b border-slate-100">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Session</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {records.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-slate-500">{formatDate(r.session.scheduledAt)}</td>
                <td className="px-6 py-4 font-medium">{r.session.cohortName}</td>
                <td className="px-6 py-4"><Badge status={r.status} /></td>
                <td className="px-6 py-4 text-slate-400 italic">{r.notes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ChildDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('Attendance');

  const { data: family, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.family(),
    queryFn: () => get('/api/v1/parent/stub'),
  });

  const student = family?.students.find(s => s.id === id);
  const enrolment = student?.enrolments[0];

  return (
    <div>
      {/* Back link */}
      <Link to="/parent" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors">
        <Icon icon="lucide:arrow-left" className="w-4 h-4" />
        Back to Dashboard
      </Link>

      {isLoading && <div className="animate-pulse h-20 bg-slate-50 rounded-2xl mb-8" />}

      {isError && (
        <p className="text-rose-500 text-sm mb-8">Failed to load student data. Is the API running?</p>
      )}

      {student && (
        <>
          {/* Student header */}
          <div className="flex items-start gap-6 mb-10">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl shrink-0">
              {student.firstName?.[0] ?? ''}{student.lastName?.[0] ?? ''}
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">
                {student.firstName} {student.lastName}
              </h1>
              {enrolment && (
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-slate-500 text-sm">{enrolment.cohort.name} · {enrolment.cohort.campus.name}</p>
                  <Badge status={enrolment.status} />
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 bg-slate-50 rounded-xl p-1 w-fit">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'Attendance' && <AttendanceTab studentId={student.id} />}

          {activeTab === 'Progress' && (
            <div className="text-center py-16 text-slate-400">
              <Icon icon="lucide:bar-chart-2" className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Skill progress tracking coming soon.</p>
            </div>
          )}

          {activeTab === 'Projects' && (
            <div className="text-center py-16 text-slate-400">
              <Icon icon="lucide:folder-open" className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Project submissions coming soon.</p>
            </div>
          )}
        </>
      )}

      {!isLoading && !student && (
        <p className="text-rose-500 text-sm">Student not found.</p>
      )}
    </div>
  );
}
