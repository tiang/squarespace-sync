import { useQuery } from '@tanstack/react-query';
import { get } from '../lib/api.js';
import { QUERY_KEYS } from '../lib/queryKeys.js';
import ChildCard from '../components/ChildCard.jsx';

export default function ParentDashboard() {
  const { data: family, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.family(),
    queryFn: () => get('/api/v1/parent/stub'),
  });

  return (
    <div>
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Parent Dashboard</h1>
        {family && (
          <p className="text-slate-500">Welcome back, {family.name.replace(' Family', '')}.</p>
        )}
      </div>

      {/* Children section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Enrolled Students</h2>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="border border-slate-100 p-6 rounded-2xl bg-slate-50 animate-pulse h-56" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-rose-500 text-sm">Failed to load family data. Is the API running?</p>
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
    </div>
  );
}
