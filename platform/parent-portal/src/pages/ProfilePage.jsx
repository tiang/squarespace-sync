import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@iconify/react';
import { get, patch } from '../lib/api.js';
import { QUERY_KEYS } from '../lib/queryKeys.js';

function Field({ label, name, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-colors"
      />
    </div>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const { data: family, isLoading } = useQuery({
    queryKey: QUERY_KEYS.family(),
    queryFn: () => get('/api/v1/parent/stub'),
  });

  const [form, setForm] = useState({
    name: '', primaryPhone: '',
    addressStreet: '', addressCity: '', addressState: '', addressPostcode: '',
  });
  const [saved, setSaved] = useState(false);

  // Populate form when family data loads
  useEffect(() => {
    if (family) {
      setForm({
        name:           family.name           ?? '',
        primaryPhone:   family.primaryPhone   ?? '',
        addressStreet:  family.addressStreet  ?? '',
        addressCity:    family.addressCity    ?? '',
        addressState:   family.addressState   ?? '',
        addressPostcode: family.addressPostcode ?? '',
      });
    }
  }, [family]);

  const mutation = useMutation({
    mutationFn: (data) => patch('/api/v1/parent/stub', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.family() });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    mutation.mutate(form);
  }

  if (isLoading) return <div className="animate-pulse h-64 bg-slate-50 rounded-2xl" />;

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Profile</h1>
        <p className="text-slate-500">Manage your family contact details.</p>
      </div>

      <div className="max-w-2xl space-y-10">
        {/* Family details form */}
        <section>
          <h2 className="text-xl font-semibold mb-6">Family Details</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Family name"   name="name"           value={form.name}           onChange={handleChange} />
            <Field label="Phone"         name="primaryPhone"   value={form.primaryPhone}   onChange={handleChange} type="tel" />
            <Field label="Email"         name="primaryEmail"   value={family?.primaryEmail ?? ''} onChange={() => {}} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Street"     name="addressStreet"   value={form.addressStreet}   onChange={handleChange} />
              <Field label="City"       name="addressCity"     value={form.addressCity}     onChange={handleChange} />
              <Field label="State"      name="addressState"    value={form.addressState}    onChange={handleChange} />
              <Field label="Postcode"   name="addressPostcode" value={form.addressPostcode} onChange={handleChange} />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={mutation.isPending}
                className="px-6 py-3 bg-black text-white rounded-full text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {mutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium">
                  <Icon icon="lucide:check-circle" className="w-4 h-4" />
                  Saved
                </span>
              )}
              {mutation.isError && (
                <span className="text-rose-500 text-sm">Failed to save. Try again.</span>
              )}
            </div>
          </form>
        </section>

        {/* Students (read-only) */}
        <section>
          <h2 className="text-xl font-semibold mb-6">Students</h2>
          <div className="space-y-3">
            {family?.students.map(s => (
              <div key={s.id} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                  {s.firstName[0]}{s.lastName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{s.firstName} {s.lastName}</p>
                  <p className="text-xs text-slate-400">
                    {s.gender} · Born {new Date(s.birthDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
