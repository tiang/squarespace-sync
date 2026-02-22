import { useState } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { Icon } from '@iconify/react';

const EMAIL_LINK_STORAGE_KEY = 'emailForSignIn';

// Handle email magic link completion on page load
if (isSignInWithEmailLink(auth, window.location.href)) {
  let email = localStorage.getItem(EMAIL_LINK_STORAGE_KEY);
  if (!email) email = prompt('Please confirm your email address:');
  if (email) {
    signInWithEmailLink(auth, email, window.location.href)
      .then(() => localStorage.removeItem(EMAIL_LINK_STORAGE_KEY))
      .catch(console.error);
  }
}

export default function LoginPage() {
  const [tab, setTab]         = useState('google');
  const [email, setEmail]     = useState('');
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState('');
  const [confirm, setConfirm] = useState(null);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGoogle() {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailLink(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: window.location.href,
        handleCodeInApp: true,
      });
      localStorage.setItem(EMAIL_LINK_STORAGE_KEY, email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneSend(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }
      const result = await signInWithPhoneNumber(auth, phone, window.recaptchaVerifier);
      setConfirm(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePhoneVerify(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirm.confirm(otp);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="text-3xl font-bold font-heading">🚀 Rocket Academy</span>
          <p className="mt-2 text-slate-500 text-sm">Sign in to your parent portal</p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1 mb-6 gap-1">
          {[
            { key: 'google', label: 'Google' },
            { key: 'email',  label: 'Email'  },
            { key: 'phone',  label: 'Phone'  },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setError(''); setSent(false); setConfirm(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? 'bg-white shadow text-black' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <p className="mb-4 text-sm text-rose-500 bg-rose-50 rounded-xl px-4 py-3">{error}</p>
        )}

        {tab === 'google' && (
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 border border-slate-200 rounded-xl py-3.5 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Icon icon="logos:google-icon" className="w-5 h-5" />
            Continue with Google
          </button>
        )}

        {tab === 'email' && !sent && (
          <form onSubmit={handleEmailLink} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded-xl py-3.5 text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send sign-in link'}
            </button>
          </form>
        )}
        {tab === 'email' && sent && (
          <div className="text-center py-6">
            <Icon icon="lucide:mail-check" className="w-12 h-12 mx-auto mb-3 text-slate-400" />
            <p className="font-medium text-slate-700">Check your inbox</p>
            <p className="text-sm text-slate-400 mt-1">We sent a sign-in link to <strong>{email}</strong></p>
          </div>
        )}

        {tab === 'phone' && !confirm && (
          <form onSubmit={handlePhoneSend} className="space-y-3">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+61 400 000 000"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded-xl py-3.5 text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send code'}
            </button>
          </form>
        )}
        {tab === 'phone' && confirm && (
          <form onSubmit={handlePhoneVerify} className="space-y-3">
            <p className="text-sm text-slate-500 text-center">Enter the 6-digit code sent to {phone}</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={e => setOtp(e.target.value)}
              placeholder="000000"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-black"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white rounded-xl py-3.5 text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify code'}
            </button>
          </form>
        )}

        <div id="recaptcha-container" />
      </div>
    </div>
  );
}
