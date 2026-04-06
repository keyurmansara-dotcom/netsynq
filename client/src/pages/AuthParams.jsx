import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthParams = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'seeker' });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const res = await axios.post(`http://localhost:5000${endpoint}`, payload);
      
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        // Redirect based on role
        if (res.data.user.role === 'recruiter') {
            navigate('/dashboard'); // or change to '/recruiter-dashboard' later
        } else {
            navigate('/dashboard');
        }
      } else if (res.data.message === 'User created successfully') {
        setIsLogin(true); // Switch to login after successful signup
        alert('Signup successful! Please log in.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 bg-[radial-gradient(circle_at_20%_20%,#dbeafe_0%,#f8fafc_35%,#f1f5f9_100%)]">
      <div className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-white grid grid-cols-1 md:grid-cols-2">
      <div className="relative p-8 md:p-10 bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#3A506B] text-white">
        <div className="absolute -top-20 -right-16 h-52 w-52 rounded-full bg-cyan-400/20 blur-2xl" />
        <div className="absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-sky-300/20 blur-2xl" />

        <div className="relative z-10">
          <p className="text-xs tracking-[0.25em] uppercase text-cyan-200 mb-3">Netsynq</p>
          <h1 className="text-3xl md:text-4xl font-black leading-tight mb-4">Build your next career move with confidence.</h1>
          <p className="text-sm md:text-base text-slate-200 leading-relaxed mb-8">
            Connect recruiters and job seekers on one focused platform. Apply faster, hire smarter.
          </p>

          <div className="space-y-3 text-sm text-slate-100/90">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
              Smart applicant tracking
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
              Decision-safe hiring flow
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-300" />
              Cleaner, role-based onboarding
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 md:p-10 bg-[#F8FAFC]">
        <div className="mb-6">
          <div className="inline-flex p-1 rounded-xl bg-slate-200/70 w-full max-w-xs">
            <button
              type="button"
              onClick={() => {
                if (!isLogin) handleToggle();
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${isLogin ? 'bg-white text-slate-900 shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLogin) handleToggle();
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${!isLogin ? 'bg-white text-slate-900 shadow' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Sign Up
            </button>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mt-5">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {isLogin ? 'Sign in to continue to your dashboard.' : 'Set up your profile and get started.'}
          </p>
        </div>

        {error && <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 border border-red-200 rounded-xl">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                className="w-full px-4 py-3 mt-1.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              className="w-full px-4 py-3 mt-1.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              className="w-full px-4 py-3 mt-1.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              onChange={handleChange}
              required
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700">Role</label>
                <select
                  name="role"
                  onChange={handleChange}
                  value={formData.role}
                  className="w-full px-4 py-3 mt-1.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="seeker">Job Seeker</option>
                  <option value="recruiter">Recruiter / Hiring Manager</option>
                </select>
              </div>

              {formData.role === 'recruiter' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Company Name</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName || ''}
                    placeholder="Where do you hire for?"
                    className="w-full px-4 py-3 mt-1.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    onChange={handleChange}
                    required={formData.role === 'recruiter'}
                  />
                </div>
              )}

              {formData.role === 'seeker' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700">Professional Headline</label>
                  <input
                    type="text"
                    name="headline"
                    value={formData.headline || ''}
                    placeholder="e.g. Frontend Developer at XYZ"
                    className="w-full px-4 py-3 mt-1.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    onChange={handleChange}
                    required={formData.role === 'seeker'}
                  />
                </div>
              )}
            </>
          )}

          <button
            disabled={isSubmitting}
            className="w-full px-6 py-3 mt-2 text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div className="flex items-center justify-center mt-5">
          <button onClick={handleToggle} className="text-sm text-sky-700 hover:text-sky-900 hover:underline font-medium">
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Login'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};

export default AuthParams;