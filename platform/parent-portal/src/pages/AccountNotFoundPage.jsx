import { useState } from 'react';
import { signOut } from 'firebase/auth';
import { Icon } from '@iconify/react';
import { auth } from '../lib/firebase.js';
import { post } from '../lib/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function AccountNotFoundPage() {
  const { user } = useAuth();
  const [form, setForm]           = useState({ phone: '', childName: '', partnerName: '', locationEnrolled: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await post('/api/v1/parent/pending-registration', {
        email: user.email,
        ...form,
      });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center">
          <Icon icon="lucide:check-circle" className="w-12 h-12 mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold mb-2">Request received</h1>
          <p className="text-slate-500 text-sm">We'll be in touch within 1 business day.</p>
          <button
            onClick={() => signOut(auth)}
            className="mt-8 text-sm text-slate-400 hover:text-slate-600 underline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="mb-8 text-center">
          <Icon icon="lucide:user-x" className="w-10 h-10 mx-auto mb-4 text-slate-300" />
          <h1 className="text-2xl font-bold mb-2">Account not found</h1>
          <p className="text-slate-500 text-sm">
            We couldn't find a Rocket Academy account for <strong>{user?.email}</strong>.
            Fill in your details below and we'll get you set up.
          </p>
        </div>

        {error && (
          <p className="mb-4 text-sm text-rose-500 bg-rose-50 rounded-xl px-4 py-3">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="phone"
            type="tel"
            placeholder="Phone number"
            value={form.phone}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <input
            name="childName"
            type="text"
            placeholder="Child's name"
            value={form.childName}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <input
            name="partnerName"
            type="text"
            placeholder="Partner's name (if applicable)"
            value={form.partnerName}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <input
            name="locationEnrolled"
            type="text"
            placeholder="Campus / location enrolled"
            value={form.locationEnrolled}
            onChange={handleChange}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-xl py-3.5 text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Submit'}
          </button>
        </form>

        <button
          onClick={() => signOut(auth)}
          className="mt-6 w-full text-sm text-slate-400 hover:text-slate-600 underline"
        >
          Sign out and try a different account
        </button>
      </div>
    </div>
  );
}
