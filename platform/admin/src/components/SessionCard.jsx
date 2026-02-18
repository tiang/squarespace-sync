import { Link } from 'react-router-dom';
import { formatTime } from '../lib/format';

const STATUS_STYLES = {
  SCHEDULED: 'bg-sky-50 text-sky-700 border-sky-200',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function SessionCard({ session }) {
  const { id, scheduledAt, durationMinutes, status, cohort, enrolledCount } = session;

  return (
    <Link
      to={`/instructor/session/${id}/attend`}
      className="border border-slate-100 p-8 rounded-2xl bg-white shadow-sm flex flex-col transition-all duration-200 hover:border-black hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 inline-block">
            {cohort.program.name}
          </span>
          <h3 className="text-2xl font-bold">{cohort.name}</h3>
          <p className="text-slate-400 text-sm mt-1">
            {cohort.campus.name} • {cohort.room} • {formatTime(scheduledAt)} ({durationMinutes} min)
          </p>
        </div>
        <div className="text-right shrink-0 ml-4">
          <div className="text-lg font-bold">{enrolledCount}</div>
          <div className="text-[10px] text-slate-400 font-bold uppercase">Students</div>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-auto pt-6 border-t border-slate-100">
        <span className="flex-1 py-3 bg-black text-white text-center rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors">
          Take Attendance
        </span>
        <span className={`px-3 py-1.5 border rounded-full text-xs font-bold ${STATUS_STYLES[status] ?? 'bg-slate-50 text-slate-500 border-slate-200'}`}>
          {status}
        </span>
      </div>
    </Link>
  );
}
