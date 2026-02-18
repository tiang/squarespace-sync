import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, put } from '../lib/api';
import StudentRow from '../components/StudentRow';

function formatDateTime(isoString) {
  const d = new Date(isoString);
  return (
    d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' • ' +
    d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
  );
}

export default function RollCallPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: session, isLoading, isError } = useQuery({
    queryKey: ['session', id],
    queryFn: () => get(`/api/v1/sessions/${id}`),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Local state: { [studentId]: { status: string | null, notes: string } }
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    if (!session) return;
    const initial = {};
    for (const student of session.students) {
      initial[student.id] = {
        status: student.attendance?.status ?? null,
        notes: student.attendance?.notes ?? '',
      };
    }
    setAttendance(initial);
  }, [session]);

  const mutation = useMutation({
    mutationFn: (records) => put(`/api/v1/sessions/${id}/attendance`, { records }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session', id] });
      navigate('/instructor/dashboard');
    },
  });

  function handleMarkAll() {
    setAttendance(prev => {
      const next = {};
      for (const sid of Object.keys(prev)) {
        next[sid] = { ...prev[sid], status: 'PRESENT' };
      }
      return next;
    });
  }

  function handleChange(studentId, patch) {
    setAttendance(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], ...patch },
    }));
  }

  function handleSave() {
    const records = Object.entries(attendance)
      .filter(([, v]) => v.status !== null)
      .map(([studentId, v]) => ({
        studentId,
        status: v.status,
        notes: v.notes || null,
      }));
    mutation.mutate(records);
  }

  // Live summary counts
  const counts = Object.values(attendance).reduce((acc, v) => {
    if (v.status) acc[v.status] = (acc[v.status] ?? 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <main className="max-w-[1440px] mx-auto px-10 pt-24">
        <p className="text-slate-400">Loading session...</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="max-w-[1440px] mx-auto px-10 pt-24">
        <p className="text-rose-500 text-sm">Failed to load session. Please try again.</p>
      </main>
    );
  }

  return (
    <main className="max-w-[1440px] mx-auto px-6 md:px-10 pt-24 pb-32">
      {/* Header */}
      <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <button
            onClick={() => navigate('/instructor/dashboard')}
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-black transition-colors mb-4 gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-4xl font-semibold tracking-tight">Class Attendance</h1>
          <p className="text-slate-500">
            {session.cohort.name} • {session.cohort.room} • {formatDateTime(session.scheduledAt)}
          </p>
        </div>
        <button
          onClick={handleMarkAll}
          className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-bold transition-all"
        >
          Mark All Present
        </button>
      </div>

      {/* Attendance table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-200">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-8 py-4 w-1/3">Student Name</th>
                <th className="px-8 py-4">Attendance Status</th>
                <th className="px-8 py-4">Internal Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {session.students.map(student => (
                <StudentRow
                  key={student.id}
                  student={student}
                  value={attendance[student.id] ?? { status: null, notes: '' }}
                  onChange={(patch) => handleChange(student.id, patch)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Total: {session.students.length} • Present: {counts.PRESENT ?? 0} • Absent: {counts.ABSENT ?? 0} • Late: {counts.LATE ?? 0}
        </p>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/instructor/dashboard')}
            className="px-8 py-4 border border-slate-200 rounded-full font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel Changes
          </button>
          <button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="px-10 py-4 bg-black text-white rounded-full font-bold hover:bg-slate-800 transition-all shadow-lg shadow-black/10 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save Attendance Records'}
          </button>
        </div>
      </div>

      {mutation.isError && (
        <p className="mt-4 text-rose-500 text-sm text-right">
          Save failed. Please try again.
        </p>
      )}
    </main>
  );
}
