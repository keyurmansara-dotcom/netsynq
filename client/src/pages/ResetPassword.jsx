import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authHttp } from '../api/authClient.js';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('Reset token is missing or invalid. Please request a new link.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authHttp.post('/api/auth/reset-password', { token, password });
      setMessage(res.data?.message || 'Password reset successful.');
      setTimeout(() => navigate('/auth'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 bg-[radial-gradient(circle_at_20%_20%,#dbeafe_0%,#f8fafc_35%,#f1f5f9_100%)]">
      <div className="w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white">
        <div className="bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#3A506B] px-8 py-10 text-white">
          <p className="text-xs tracking-[0.25em] uppercase text-cyan-200 mb-3">NetSynq</p>
          <h1 className="text-3xl font-black leading-tight">Create a new password</h1>
          <p className="mt-3 text-sm text-slate-200 max-w-xl">
            Use the secure link from your email to set a new password for your account.
          </p>
        </div>

        <div className="p-8 md:p-10 bg-[#F8FAFC]">
          {message && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
          {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 mt-1.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 mt-1.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Re-enter new password"
              />
            </div>

            <button
              disabled={loading}
              className="w-full px-6 py-3 text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating password...' : 'Reset password'}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link to="/auth" className="text-sky-700 hover:text-sky-900 hover:underline font-medium">
              Back to login
            </Link>
            <Link to="/forgot-password" className="text-slate-600 hover:text-slate-900 hover:underline">
              Send another reset link
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
