const STATUSES = [
  {
    value: 'PRESENT',
    label: 'Present',
    dot: 'bg-emerald-500',
    checked: 'peer-checked:bg-emerald-50 peer-checked:border-emerald-500 peer-checked:text-emerald-700',
  },
  {
    value: 'ABSENT',
    label: 'Absent',
    dot: 'bg-rose-500',
    checked: 'peer-checked:bg-rose-50 peer-checked:border-rose-500 peer-checked:text-rose-700',
  },
  {
    value: 'LATE',
    label: 'Late',
    dot: 'bg-amber-500',
    checked: 'peer-checked:bg-amber-50 peer-checked:border-amber-500 peer-checked:text-amber-700',
  },
];

export default function StudentRow({ student, value, onChange }) {
  const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.firstName}${student.lastName}`;

  return (
    <tr className="transition-colors hover:bg-slate-50/50">
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0">
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="font-bold text-slate-900">
            {student.firstName} {student.lastName}
          </div>
        </div>
      </td>

      <td className="px-8 py-6">
        <div className="flex items-center gap-2">
          {STATUSES.map(({ value: statusVal, label, dot, checked }) => (
            <label key={statusVal} className="flex-1">
              <input
                type="radio"
                name={student.id}
                className="sr-only peer"
                checked={value.status === statusVal}
                onChange={() => onChange({ status: statusVal })}
              />
              <span className={`flex items-center justify-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer transition-all hover:bg-slate-50 ${checked}`}>
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                {label}
              </span>
            </label>
          ))}
        </div>
      </td>

      <td className="px-8 py-6">
        <input
          type="text"
          placeholder="Add private note..."
          value={value.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:bg-white focus:ring-1 focus:ring-black transition-all"
        />
      </td>
    </tr>
  );
}
