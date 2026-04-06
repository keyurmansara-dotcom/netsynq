import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const apiBase = 'http://localhost:5000';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    headline: '',
    location: '',
    companyName: ''
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteResumeModal, setShowDeleteResumeModal] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken || !storedUser) {
      navigate('/auth');
      return;
    }

    const loadProfile = async () => {
      try {
        const res = await fetch(`${apiBase}/api/profile/me`, {
          headers: { Authorization: `Bearer ${storedToken}` }
        });

        if (!res.ok) {
          navigate('/auth');
          return;
        }

        const data = await res.json();
        setUser(data);
        localStorage.setItem('user', JSON.stringify({
          ...JSON.parse(storedUser),
          ...data,
          id: data._id,
        }));
        setForm({
          name: data.name || '',
          email: data.email || '',
          headline: data.profile?.headline || '',
          location: data.profile?.location || '',
          companyName: data.profile?.companyName || ''
        });
      } catch (err) {
        setError('Unable to load profile right now.');
        console.error(err);
      }
    };

    loadProfile();
  }, [navigate]);

  useEffect(() => {
    if (!message && !error) return;

    const timeoutId = setTimeout(() => {
      setMessage('');
      setError('');
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [message, error]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSavingProfile(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBase}/api/profile/update`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      const updated = await res.json();
      setUser((prev) => ({ ...prev, ...updated, profile: updated.profile }));
      localStorage.setItem('user', JSON.stringify({
        ...(JSON.parse(localStorage.getItem('user') || '{}')),
        ...updated,
      }));
      setMessage('Profile saved.');
    } catch (err) {
      setError(err.message || 'Failed to save profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) return;

    setError('');
    setMessage('');
    setUploadingResume(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('resume', resumeFile);

      const uploadRes = await fetch(`${apiBase}/api/upload/resume`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.message || 'Resume upload failed');
      }

      const data = await uploadRes.json();
      const updateRes = await fetch(`${apiBase}/api/profile/update`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeUrl: data.resumeUrl })
      });

      if (!updateRes.ok) {
        const updateData = await updateRes.json();
        throw new Error(updateData.message || 'Resume saved but profile update failed');
      }

      const updated = await updateRes.json();
      setUser((prev) => ({ ...prev, ...updated, profile: updated.profile }));
      localStorage.setItem('user', JSON.stringify({
        ...(JSON.parse(localStorage.getItem('user') || '{}')),
        ...updated,
      }));
      setResumeFile(null);
      setMessage('Resume uploaded successfully.');
    } catch (err) {
      setError(err.message || 'Could not upload resume.');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!user?.profile?.resumeUrl) return;

    setError('');
    setMessage('');
    setDeletingResume(true);
    setShowDeleteResumeModal(false);

    try {
      const token = localStorage.getItem('token');

      const deleteRes = await fetch(`${apiBase}/api/upload/resume`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeUrl: user.profile.resumeUrl })
      });

      if (!deleteRes.ok) {
        const deleteData = await deleteRes.json();
        throw new Error(deleteData.message || 'Failed to delete resume file');
      }

      const updateRes = await fetch(`${apiBase}/api/profile/update`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeUrl: '' })
      });

      if (!updateRes.ok) {
        const updateData = await updateRes.json();
        throw new Error(updateData.message || 'Resume file deleted but profile update failed');
      }

      const updated = await updateRes.json();
      setUser((prev) => ({ ...prev, ...updated, profile: updated.profile }));
      localStorage.setItem('user', JSON.stringify({
        ...(JSON.parse(localStorage.getItem('user') || '{}')),
        ...updated,
      }));
      setResumeFile(null);
      setMessage('Resume deleted.');
    } catch (err) {
      setError(err.message || 'Could not delete resume.');
    } finally {
      setDeletingResume(false);
    }
  };

  const resumeName = useMemo(() => {
    if (!user?.profile?.resumeUrl) return 'No resume uploaded yet';
    const parts = user.profile.resumeUrl.split('/');
    return parts[parts.length - 1] || 'Uploaded resume';
  }, [user]);

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading profile...</div>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#f8fafc,_#eef2ff_40%,_#e2e8f0_100%)] w-full">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <aside className="xl:col-span-4 space-y-6">
            <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 text-white shadow-2xl shadow-slate-300/40">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(59,130,246,0.25),transparent_45%,rgba(14,165,233,0.18))]"></div>
              <div className="relative p-6 sm:p-7">
                <div className="flex items-start gap-4">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=0f172a&color=ffffff&rounded=true&size=96`}
                    alt="Profile avatar"
                    className="h-20 w-20 rounded-full border border-white/20 shadow-lg"
                  />
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.3em] text-sky-200/80">Profile</p>
                    <h1 className="mt-2 text-2xl font-semibold tracking-tight">{user.name}</h1>
                    <p className="mt-1 text-sm text-slate-300 break-all">{user.email}</p>
                    <div className="mt-4 inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
                      {user.role === 'recruiter' ? 'Recruiter' : 'Job Seeker'}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-slate-400">Headline</p>
                    <p className="mt-1 font-medium text-white">{user.profile?.headline || 'Add a headline'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-slate-400">Location</p>
                    <p className="mt-1 font-medium text-white">{user.profile?.location || 'Add a location'}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">Tip</p>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                A focused headline and an uploaded resume make it easier for recruiters to review your profile quickly without turning the page into a sales pitch.
              </p>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Resume</p>
              <p className="mt-2 text-sm text-slate-500 break-all">{resumeName}</p>
              {user.profile?.resumeUrl ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <a
                    href={`${apiBase}${user.profile.resumeUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                  >
                    View current resume
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowDeleteResumeModal(true)}
                    disabled={deletingResume}
                    className="inline-flex items-center rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingResume ? 'Deleting...' : 'Delete resume'}
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">Upload a PDF, DOC, or DOCX file to share with recruiters.</p>
              )}
            </section>
          </aside>

          <section className="xl:col-span-8 space-y-6">
            <form onSubmit={handleSaveProfile} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">Edit profile</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Keep your profile current</h2>
                </div>
                <div className="hidden sm:block rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600">
                  Public details only
                </div>
              </div>

              {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
              {message && <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Full name</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Email address</span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Headline</span>
                  <input
                    name="headline"
                    value={form.headline}
                    onChange={handleChange}
                    placeholder="Frontend engineer building accessible product experiences"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Location</span>
                  <input
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="Bengaluru, India"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Company name</span>
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    placeholder="For recruiters"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                  />
                </label>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">Changes are saved to your public profile.</p>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingProfile ? 'Saving...' : 'Save profile'}
                </button>
              </div>
            </form>

            <form onSubmit={handleResumeUpload} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">Resume upload</p>
                  <h2 className="mt-2 text-xl font-semibold text-slate-900">Add a resume recruiters can open</h2>
                </div>
                <div className="rounded-full bg-sky-50 px-4 py-2 text-xs font-medium text-sky-700">
                  PDF, DOC, DOCX up to 10 MB
                </div>
              </div>

              <div className="mt-6 rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50 p-6">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-slate-700"
                />
                <p className="mt-3 text-sm text-slate-500">
                  Upload a concise, current version. If you already have one attached, this will replace it.
                </p>
              </div>

              {resumeFile && (
                <div className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                  Selected file: <span className="font-medium">{resumeFile.name}</span>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-4">
                <p className="text-sm text-slate-500">This file is linked to your profile and visible to the rest of the app.</p>
                <button
                  type="submit"
                  disabled={!resumeFile || uploadingResume}
                  className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {uploadingResume ? 'Uploading...' : 'Upload resume'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>

      {showDeleteResumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Delete resume?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This removes your current resume from your profile. You can upload a new one anytime.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteResumeModal(false)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteResume}
                disabled={deletingResume}
                className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingResume ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;