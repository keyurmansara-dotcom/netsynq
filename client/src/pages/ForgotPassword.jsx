import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authHttp } from '../api/authClient.js';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const res = await authHttp.post('/api/auth/forgot-password', { email });
      setMessage(res.data?.message || 'If an account exists, a reset link has been sent.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 bg-[radial-gradient(circle_at_20%_20%,#dbeafe_0%,#f8fafc_35%,#f1f5f9_100%)]">
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
        <div className="bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#3A506B] px-8 py-10 text-white">
          <p className="text-xs tracking-[0.25em] uppercase text-cyan-200 mb-3">NetSynq</p>
          <h1 className="text-3xl font-black leading-tight">Reset your password</h1>
          <p className="mt-3 text-sm text-slate-200 max-w-xl">
            Enter the email address linked to your account and we’ll send a secure reset link.
          </p>
        </div>

        <div className="p-8 md:p-10 bg-[#F8FAFC]">
          {message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 mt-1.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="name@example.com"
              />
            </div>

            <button
              disabled={loading}
              className="w-full px-6 py-3 text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending link...' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <button onClick={() => navigate('/auth')} className="text-sky-700 hover:text-sky-900 hover:underline font-medium">
              Back to login
            </button>
            <Link to="/auth" className="text-slate-600 hover:text-slate-900 hover:underline">
              Remembered your password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
