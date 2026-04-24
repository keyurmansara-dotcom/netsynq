import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { logoutByRole } from '../api/authClient.js';
import { clearStoredUser, getStoredUser } from '../api/authStorage.js';
import Navbar from '../components/Navbar';

const API_BASE = 'http://localhost:5000';

const SearchResults = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [user, setUser] = useState(null);
  const [results, setResults] = useState({ users: [], jobs: [], posts: [], companies: [] });
  const [loading, setLoading] = useState(false);

  const query = useMemo(() => String(params.get('q') || '').trim(), [params]);

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      navigate('/auth');
      return;
    }
    setUser(storedUser);
  }, [navigate]);

  useEffect(() => {
    if (!user || !query) return;

    const controller = new AbortController();
    setLoading(true);

    fetch(`${API_BASE}/api/search?q=${encodeURIComponent(query)}`, {
      credentials: 'include',
      signal: controller.signal
    })
      .then(async (res) => {
        if (!res.ok) return { users: [], jobs: [], posts: [], companies: [] };
        return res.json();
      })
      .then((data) => {
        setResults({
          users: Array.isArray(data.users) ? data.users : [],
          jobs: Array.isArray(data.jobs) ? data.jobs : [],
          posts: Array.isArray(data.posts) ? data.posts : [],
          companies: Array.isArray(data.companies) ? data.companies : []
        });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error(error);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [user, query]);

  const handleLogout = async () => {
    try {
      if (user?.role) {
        await logoutByRole(user.role);
      }
    } catch {
      // fall through
    }
    clearStoredUser();
    navigate('/auth');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F3F2EF] w-full flex-1 pb-10">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">Search</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Results for {query || 'your query'}</h1>
          <p className="mt-2 text-sm text-slate-500">Search across people, jobs, companies, and posts from one place.</p>
        </section>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">Searching...</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">People</h2>
              <div className="mt-4 space-y-3">
                {results.users.length ? results.users.map((person) => (
                  <div key={person._id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4">
                    <div>
                      <p className="font-semibold text-slate-900">{person.name}</p>
                      <p className="text-sm text-slate-500">{person.profile?.headline || 'Professional profile'}</p>
                    </div>
                    <button onClick={() => navigate('/network')} className="rounded-full border border-sky-600 px-4 py-2 text-sm font-semibold text-sky-700 hover:bg-sky-50">Open</button>
                  </div>
                )) : <p className="text-sm text-slate-500">No people found.</p>}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">Jobs</h2>
              <div className="mt-4 space-y-3">
                {results.jobs.length ? results.jobs.map((job) => (
                  <div key={job._id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">{job.title}</p>
                    <p className="text-sm text-slate-500">{job.companyId?.name || job.company} • {job.location}</p>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">{job.description}</p>
                  </div>
                )) : <p className="text-sm text-slate-500">No jobs found.</p>}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">Companies</h2>
              <div className="mt-4 space-y-3">
                {results.companies.length ? results.companies.map((company) => (
                  <div key={company._id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">{company.name}</p>
                    <p className="text-sm text-slate-500">{company.industry || 'Company profile'}</p>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">{company.description}</p>
                  </div>
                )) : <p className="text-sm text-slate-500">No companies found.</p>}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900">Posts</h2>
              <div className="mt-4 space-y-3">
                {results.posts.length ? results.posts.map((post) => (
                  <div key={post._id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-900">{post.author?.name}</p>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">{post.content}</p>
                  </div>
                )) : <p className="text-sm text-slate-500">No posts found.</p>}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchResults;