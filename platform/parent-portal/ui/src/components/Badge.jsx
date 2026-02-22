const STYLES = {
  // Enrolment statuses
  ACTIVE:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  TRIAL:     'bg-sky-50    text-sky-700    border-sky-200',
  WAITLIST:  'bg-amber-50  text-amber-700  border-amber-200',
  DROPPED:   'bg-rose-50   text-rose-700   border-rose-200',
  COMPLETED: 'bg-slate-50  text-slate-600  border-slate-200',
  // Attendance statuses
  PRESENT:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  ABSENT:    'bg-rose-50   text-rose-700   border-rose-200',
  LATE:      'bg-amber-50  text-amber-700  border-amber-200',
  EXCUSED:   'bg-slate-50  text-slate-600  border-slate-200',
  // Session statuses
  SCHEDULED: 'bg-sky-50    text-sky-700    border-sky-200',
  CANCELLED: 'bg-rose-50   text-rose-700   border-rose-200',
};

export function Badge({ status, className = '' }) {
  const style = STYLES[status] ?? 'bg-slate-50 text-slate-500 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wider ${style} ${className}`}>
      {status}
    </span>
  );
}
