import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { Badge } from '@ra/ui';

function formatDateTime(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
    + ' at '
    + d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' });
}

function getInitials(firstName, lastName) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
];

export default function ChildCard({ student, index }) {
  const enrolment = student.enrolments[0];
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-6 transition-all duration-200 hover:border-slate-200 hover:-translate-y-0.5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${avatarColor}`}>
            {getInitials(student.firstName, student.lastName)}
          </div>
          <div>
            <h3 className="text-lg font-semibold">{student.firstName} {student.lastName}</h3>
            {enrolment && (
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                {enrolment.cohort.campus.name}
              </p>
            )}
          </div>
        </div>
        {enrolment && <Badge status={enrolment.status} />}
      </div>

      {/* Enrolment info or empty state */}
      {enrolment ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Current Course</span>
            <span className="font-medium text-right">{enrolment.cohort.name}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Program</span>
            <span className="font-medium">{enrolment.cohort.program.name}</span>
          </div>
          {enrolment.cohort.nextSession && (
            <div className="flex items-center gap-2 text-sm text-slate-500 pt-1">
              <Icon icon="lucide:calendar" className="w-4 h-4 shrink-0" />
              <span>Next: {formatDateTime(enrolment.cohort.nextSession.scheduledAt)}</span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-slate-400 italic">No active enrolments</p>
      )}

      {/* CTA */}
      <Link
        to={`/parent/children/${student.id}`}
        className="block w-full text-center py-3 border border-slate-200 rounded-xl text-sm font-bold hover:bg-white transition-colors"
      >
        View Detailed Progress
      </Link>
    </div>
  );
}
