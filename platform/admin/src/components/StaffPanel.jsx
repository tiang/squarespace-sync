import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createStaff, updateStaff } from '../lib/staff';

const ROLES = ['ADMIN', 'LEAD_INSTRUCTOR', 'TEACHING_ASSISTANT'];
const ROLE_LABELS = {
  ADMIN: 'Admin',
  LEAD_INSTRUCTOR: 'Lead Instructor',
  TEACHING_ASSISTANT: 'Teaching Assistant',
};

const EMPTY_FORM = { firstName: '', lastName: '', email: '', phone: '', role: '' };

export default function StaffPanel({ staff, onClose }) {
  const isEdit = Boolean(staff);
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);

  // Reset form whenever the panel opens with new data
  useEffect(() => {
    setForm(staff
      ? { firstName: staff.firstName, lastName: staff.lastName, email: staff.email, phone: staff.phone ?? '', role: staff.role }
      : EMPTY_FORM
    );
    setErrors({});
    setApiError(null);
  }, [staff]);

  const mutation = useMutation({
    mutationFn: (data) => isEdit ? updateStaff(staff.id, data) : createStaff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      onClose();
    },
    onError: (err) => setApiError(err.message),
  });

  function validate() {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = 'Required';
    if (!form.lastName.trim()) errs.lastName = 'Required';
    if (!form.email.trim()) errs.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.role) errs.role = 'Required';
    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setApiError(null);
    const data = { ...form };
    if (!data.phone) delete data.phone;
    mutation.mutate(data);
  }

  function setField(name, value) {
    setForm(f => ({ ...f, [name]: value }));
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold tracking-tight">
            {isEdit ? `Edit: ${staff.firstName} ${staff.lastName}` : 'Add Staff'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&#x2715;</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {apiError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm px-4 py-3 rounded-lg">
              {apiError}
            </div>
          )}

          {[
            { name: 'firstName', label: 'First Name', type: 'text' },
            { name: 'lastName', label: 'Last Name', type: 'text' },
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'phone', label: 'Phone (optional)', type: 'tel' },
          ].map(({ name, label, type }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
              <input
                type={type}
                value={form[name]}
                onChange={e => setField(name, e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500 ${errors[name] ? 'border-rose-400' : 'border-slate-300'}`}
              />
              {errors[name] && <p className="mt-1 text-xs text-rose-500">{errors[name]}</p>}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
            <select
              value={form.role}
              onChange={e => setField('role', e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-violet-500 ${errors.role ? 'border-rose-400' : 'border-slate-300'}`}
            >
              <option value="">Select role...</option>
              {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            {errors.role && <p className="mt-1 text-xs text-rose-500">{errors.role}</p>}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} type="button" className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="px-5 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : 'Save Staff'}
          </button>
        </div>
      </div>
    </>
  );
}
