import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listStaff, deactivateStaff } from '../lib/staff';
import StaffPanel from '../components/StaffPanel';
import StaffRoleBadge from '../components/StaffRoleBadge';

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
];

function avatarColor(id) {
  const hash = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initials(firstName, lastName) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
}

export default function StaffDirectory() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelStaff, setPanelStaff] = useState(null); // null = create mode, object = edit mode
  const [deactivatingId, setDeactivatingId] = useState(null);
  const [deactivateError, setDeactivateError] = useState(null);

  const { data: staff = [], isLoading, isError } = useQuery({
    queryKey: ['staff', { roleFilter, search, showInactive }],
    queryFn: () => listStaff({
      role: roleFilter || undefined,
      search: search || undefined,
      includeInactive: showInactive,
    }),
  });

  const deactivateMutation = useMutation({
    mutationFn: deactivateStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      setDeactivatingId(null);
      setDeactivateError(null);
    },
    onError: (err) => setDeactivateError(err.message),
  });

  function openCreate() {
    setPanelStaff(null);
    setPanelOpen(true);
  }

  function openEdit(member) {
    setPanelStaff(member);
    setPanelOpen(true);
  }

  function closePanel() {
    setPanelOpen(false);
    setPanelStaff(null);
  }

  return (
    <main className="max-w-[1440px] mx-auto px-6 md:px-10 pt-24 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-4xl font-semibold tracking-tight">Staff Directory</h1>
          <p className="text-slate-500 text-sm">{staff.length} staff member{staff.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="px-5 py-2.5 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors"
        >
          + Add Staff
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <input
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 w-64"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="LEAD_INSTRUCTOR">Lead Instructor</option>
          <option value="TEACHING_ASSISTANT">Teaching Assistant</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={e => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Show inactive
        </label>
      </div>

      {deactivateError && (
        <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{deactivateError}</span>
          <button onClick={() => setDeactivateError(null)} className="ml-4 text-rose-500 hover:text-rose-700">✕</button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <p className="text-rose-500 text-sm">Failed to load staff. Is the API running?</p>
      )}

      {/* Table */}
      {!isLoading && !isError && (
        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-left">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {staff.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    No staff found.
                  </td>
                </tr>
              )}
              {staff.map((member) => (
                <tr
                  key={member.id}
                  onClick={() => member.isActive && openEdit(member)}
                  className={`hover:bg-slate-50/60 transition-colors ${member.isActive ? 'cursor-pointer' : 'opacity-50 cursor-default'}`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full text-white text-xs font-semibold flex items-center justify-center shrink-0 ${avatarColor(member.id)}`}>
                        {initials(member.firstName, member.lastName)}
                      </span>
                      <span className="font-medium text-slate-800">{member.firstName} {member.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{member.email}</td>
                  <td className="px-6 py-4"><StaffRoleBadge role={member.role} /></td>
                  <td className="px-6 py-4 text-slate-500">{member.phone ?? '—'}</td>
                  <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                    {member.isActive ? (
                      deactivatingId === member.id ? (
                        <span className="text-xs text-slate-600">
                          Deactivate?{' '}
                          <button
                            onClick={() => deactivateMutation.mutate(member.id)}
                            disabled={deactivateMutation.isPending}
                            className="text-rose-600 font-medium hover:underline"
                          >
                            Confirm
                          </button>
                          {' · '}
                          <button onClick={() => setDeactivatingId(null)} className="hover:underline">
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setDeactivatingId(member.id)}
                          className="text-slate-400 hover:text-rose-500 text-xs transition-colors"
                        >
                          Deactivate
                        </button>
                      )
                    ) : (
                      <span className="text-xs text-slate-400">Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-over panel */}
      {panelOpen && <StaffPanel staff={panelStaff} onClose={closePanel} />}
    </main>
  );
}
