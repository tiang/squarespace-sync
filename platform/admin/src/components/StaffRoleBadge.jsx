const ROLE_LABELS = {
  ADMIN: 'Admin',
  LEAD_INSTRUCTOR: 'Lead Instructor',
  TEACHING_ASSISTANT: 'Teaching Assistant',
};

const ROLE_STYLES = {
  ADMIN: 'bg-violet-100 text-violet-700',
  LEAD_INSTRUCTOR: 'bg-blue-100 text-blue-700',
  TEACHING_ASSISTANT: 'bg-emerald-100 text-emerald-700',
};

export default function StaffRoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[role] ?? 'bg-slate-100 text-slate-600'}`}>
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}
