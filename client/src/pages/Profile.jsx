import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutByRole, refreshByRole } from '../api/authClient.js';
import { clearStoredUser, getStoredUser, setStoredUser } from '../api/authStorage.js';
import Navbar from '../components/Navbar';

const apiBase = 'http://localhost:5000';

const createExperienceItem = () => ({ title: '', company: '', location: '', startDate: '', endDate: '', currentlyWorking: false, description: '' });
const createEducationItem = () => ({ school: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', description: '' });
const createProjectItem = () => ({ name: '', description: '', url: '', technologies: '', startDate: '', endDate: '' });

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    headline: '',
    location: '',
    companyName: '',
    summary: '',
    website: '',
    industry: '',
    github: '',
    portfolio: '',
    linkedin: '',
    profileVisibility: 'public',
    searchable: true,
    showResume: true,
    allowConnectionRequests: true,
    openToWork: false,
    skillsText: ''
  });
  const [experience, setExperience] = useState([createExperienceItem()]);
  const [education, setEducation] = useState([createEducationItem()]);
  const [projects, setProjects] = useState([createProjectItem()]);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteResumeModal, setShowDeleteResumeModal] = useState(false);

  const fetchWithRetry = async (url, options = {}, roleOverride = null) => {
    const requestOptions = { credentials: 'include', ...options };
    let res = await fetch(url, requestOptions);
    const role = roleOverride || user?.role;

    if (res.status === 401 && role) {
      try {
        await refreshByRole(role);
        res = await fetch(url, requestOptions);
      } catch (refreshError) {
        // Keep 401 handling in callers.
      }
    }

    return res;
  };

  useEffect(() => {
    const storedUser = getStoredUser();

    if (!storedUser) {
      navigate('/auth');
      return;
    }

    const parsedStoredUser = storedUser;

    const loadProfile = async () => {
      try {
        const res = await fetchWithRetry(`${apiBase}/api/profile/me`, {}, parsedStoredUser.role);

        if (res.status === 401) {
          clearStoredUser();
          navigate('/auth');
          return;
        }

        if (!res.ok) {
          setError('Unable to load profile right now. Please try again.');
          return;
        }

        const data = await res.json();
        setUser(data);
        setStoredUser({
          ...parsedStoredUser,
          ...data,
          id: data._id,
        });
        setForm({
          name: data.name || '',
          email: data.email || '',
          headline: data.profile?.headline || '',
          location: data.profile?.location || '',
          companyName: data.profile?.companyName || '',
          summary: data.profile?.summary || '',
          website: data.profile?.website || '',
          industry: data.profile?.industry || '',
          github: data.links?.github || '',
          portfolio: data.links?.portfolio || '',
          linkedin: data.links?.linkedin || '',
          profileVisibility: data.privacy?.profileVisibility || 'public',
          searchable: data.privacy?.searchable ?? true,
          showResume: data.privacy?.showResume ?? true,
          allowConnectionRequests: data.privacy?.allowConnectionRequests ?? true,
          openToWork: data.openToWork ?? false,
          skillsText: Array.isArray(data.skills) ? data.skills.join(', ') : ''
        });
        setExperience(Array.isArray(data.experience) && data.experience.length ? data.experience.map((item) => ({ ...createExperienceItem(), ...item })) : [createExperienceItem()]);
        setEducation(Array.isArray(data.education) && data.education.length ? data.education.map((item) => ({ ...createEducationItem(), ...item })) : [createEducationItem()]);
        setProjects(Array.isArray(data.projects) && data.projects.length ? data.projects.map((item) => ({ ...createProjectItem(), ...item, technologies: Array.isArray(item.technologies) ? item.technologies.join(', ') : '' })) : [createProjectItem()]);
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

  const handleLogout = async () => {
    try {
      if (user?.role) {
        await logoutByRole(user.role);
      }
    } catch (logoutError) {
      // Clear local session state even if server logout fails.
    }
    clearStoredUser();
    navigate('/auth');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const updateExperience = (index, field, value) => {
    setExperience((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  };

  const updateEducation = (index, field, value) => {
    setEducation((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  };

  const updateProject = (index, field, value) => {
    setProjects((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  };

  const buildStructuredPayload = () => ({
    ...form,
    skills: form.skillsText.split(',').map((item) => item.trim()).filter(Boolean),
    experience: experience.map((item) => ({ ...item, title: item.title.trim(), company: item.company.trim(), location: item.location.trim(), startDate: item.startDate.trim(), endDate: item.endDate.trim(), description: item.description.trim(), currentlyWorking: Boolean(item.currentlyWorking) })).filter((item) => item.title || item.company || item.description),
    education: education.map((item) => ({ ...item, school: item.school.trim(), degree: item.degree.trim(), fieldOfStudy: item.fieldOfStudy.trim(), startDate: item.startDate.trim(), endDate: item.endDate.trim(), description: item.description.trim() })).filter((item) => item.school || item.degree || item.fieldOfStudy),
    projects: projects.map((item) => ({ ...item, name: item.name.trim(), description: item.description.trim(), url: item.url.trim(), technologies: item.technologies.split(',').map((entry) => entry.trim()).filter(Boolean), startDate: item.startDate.trim(), endDate: item.endDate.trim() })).filter((item) => item.name || item.description),
    links: {
      github: form.github.trim(),
      portfolio: form.portfolio.trim(),
      linkedin: form.linkedin.trim(),
      website: form.website.trim()
    },
    privacy: {
      profileVisibility: form.profileVisibility,
      searchable: form.searchable,
      showResume: form.showResume,
      allowConnectionRequests: form.allowConnectionRequests
    },
    openToWork: form.openToWork
  });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSavingProfile(true);

    try {
      const res = await fetchWithRetry(`${apiBase}/api/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildStructuredPayload())
      });

      if (res.status === 401) {
        clearStoredUser();
        navigate('/auth');
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      const updated = await res.json();
      setUser((prev) => ({ ...prev, ...updated, profile: updated.profile }));
      setStoredUser({
        ...(getStoredUser() || {}),
        ...updated,
      });
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
      const formData = new FormData();
      formData.append('resume', resumeFile);

      const uploadRes = await fetchWithRetry(`${apiBase}/api/upload/resume`, {
        method: 'POST',
        body: formData
      });

      if (uploadRes.status === 401) {
        clearStoredUser();
        navigate('/auth');
        return;
      }

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.message || 'Resume upload failed');
      }

      const data = await uploadRes.json();
      const updateRes = await fetchWithRetry(`${apiBase}/api/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeUrl: data.resumeUrl })
      });

      if (updateRes.status === 401) {
        clearStoredUser();
        navigate('/auth');
        return;
      }

      if (!updateRes.ok) {
        const updateData = await updateRes.json();
        throw new Error(updateData.message || 'Resume saved but profile update failed');
      }

      const updated = await updateRes.json();
      setUser((prev) => ({ ...prev, ...updated, profile: updated.profile }));
      setStoredUser({
        ...(getStoredUser() || {}),
        ...updated,
      });
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
      const deleteRes = await fetchWithRetry(`${apiBase}/api/upload/resume`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeUrl: user.profile.resumeUrl })
      });

      if (deleteRes.status === 401) {
        clearStoredUser();
        navigate('/auth');
        return;
      }

      if (!deleteRes.ok) {
        const deleteData = await deleteRes.json();
        throw new Error(deleteData.message || 'Failed to delete resume file');
      }

      const updateRes = await fetchWithRetry(`${apiBase}/api/profile/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resumeUrl: '' })
      });

      if (updateRes.status === 401) {
        clearStoredUser();
        navigate('/auth');
        return;
      }

      if (!updateRes.ok) {
        const updateData = await updateRes.json();
        throw new Error(updateData.message || 'Resume file deleted but profile update failed');
      }

      const updated = await updateRes.json();
      setUser((prev) => ({ ...prev, ...updated, profile: updated.profile }));
      setStoredUser({
        ...(getStoredUser() || {}),
        ...updated,
      });
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

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Profile summary</span>
                  <textarea
                    name="summary"
                    value={form.summary}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Write a short professional summary."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Website</span>
                  <input
                    name="website"
                    value={form.website}
                    onChange={handleChange}
                    placeholder="https://your-site.com"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Industry</span>
                  <input
                    name="industry"
                    value={form.industry}
                    onChange={handleChange}
                    placeholder="Software, Finance, Healthcare"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                  />
                </label>

                <label className="space-y-2 sm:col-span-2">
                  <span className="text-sm font-medium text-slate-700">Skills</span>
                  <input
                    name="skillsText"
                    value={form.skillsText}
                    onChange={handleChange}
                    placeholder="React, Node.js, MongoDB"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                  />
                </label>

                <div className="sm:col-span-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">GitHub</span>
                    <input
                      name="github"
                      value={form.github}
                      onChange={handleChange}
                      placeholder="https://github.com/you"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">Portfolio</span>
                    <input
                      name="portfolio"
                      value={form.portfolio}
                      onChange={handleChange}
                      placeholder="https://portfolio.com"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm font-medium text-slate-700">LinkedIn</span>
                    <input
                      name="linkedin"
                      value={form.linkedin}
                      onChange={handleChange}
                      placeholder="https://linkedin.com/in/you"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-500 focus:bg-white"
                    />
                  </label>
                </div>

                <div className="sm:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Profile privacy</p>
                      <p className="text-xs text-slate-500">Control who can discover and contact you.</p>
                    </div>
                    <select
                      name="profileVisibility"
                      value={form.profileVisibility}
                      onChange={handleChange}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    >
                      <option value="public">Public</option>
                      <option value="connections">Connections only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
                    <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-3 border border-slate-200">
                      <input type="checkbox" name="searchable" checked={form.searchable} onChange={handleChange} />
                      <span>Show in search</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-3 border border-slate-200">
                      <input type="checkbox" name="showResume" checked={form.showResume} onChange={handleChange} />
                      <span>Show resume</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-3 border border-slate-200">
                      <input type="checkbox" name="allowConnectionRequests" checked={form.allowConnectionRequests} onChange={handleChange} />
                      <span>Allow requests</span>
                    </label>
                    <label className="flex items-center gap-2 rounded-2xl bg-white px-3 py-3 border border-slate-200">
                      <input type="checkbox" name="openToWork" checked={form.openToWork} onChange={handleChange} />
                      <span>Open to work</span>
                    </label>
                  </div>
                </div>

                <div className="sm:col-span-2 rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Experience</p>
                      <p className="text-xs text-slate-500">Add professional history.</p>
                    </div>
                    <button type="button" onClick={() => setExperience((current) => [...current, createExperienceItem()])} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Add</button>
                  </div>
                  <div className="mt-4 space-y-4">
                    {experience.map((item, index) => (
                      <div key={`experience-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800">Role {index + 1}</p>
                          {experience.length > 1 && (
                            <button type="button" onClick={() => setExperience((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-xs font-semibold text-rose-600 hover:underline">Remove</button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <input value={item.title} onChange={(e) => updateExperience(index, 'title', e.target.value)} placeholder="Title" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                          <input value={item.company} onChange={(e) => updateExperience(index, 'company', e.target.value)} placeholder="Company" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                          <input value={item.location} onChange={(e) => updateExperience(index, 'location', e.target.value)} placeholder="Location" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                          <div className="grid grid-cols-2 gap-2">
                            <input value={item.startDate} onChange={(e) => updateExperience(index, 'startDate', e.target.value)} placeholder="Start" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                            <input value={item.endDate} onChange={(e) => updateExperience(index, 'endDate', e.target.value)} placeholder="End" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                          </div>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <input type="checkbox" checked={item.currentlyWorking} onChange={(e) => updateExperience(index, 'currentlyWorking', e.target.checked)} />
                          Currently working here
                        </label>
                        <textarea value={item.description} onChange={(e) => updateExperience(index, 'description', e.target.value)} placeholder="Describe your work" rows="3" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2 rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Education</p>
                      <p className="text-xs text-slate-500">Add degrees and certifications.</p>
                    </div>
                    <button type="button" onClick={() => setEducation((current) => [...current, createEducationItem()])} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Add</button>
                  </div>
                  <div className="mt-4 space-y-4">
                    {education.map((item, index) => (
                      <div key={`education-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800">Education {index + 1}</p>
                          {education.length > 1 && (
                            <button type="button" onClick={() => setEducation((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-xs font-semibold text-rose-600 hover:underline">Remove</button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <input value={item.school} onChange={(e) => updateEducation(index, 'school', e.target.value)} placeholder="School" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                          <input value={item.degree} onChange={(e) => updateEducation(index, 'degree', e.target.value)} placeholder="Degree" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                          <input value={item.fieldOfStudy} onChange={(e) => updateEducation(index, 'fieldOfStudy', e.target.value)} placeholder="Field of study" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                          <div className="grid grid-cols-2 gap-2">
                            <input value={item.startDate} onChange={(e) => updateEducation(index, 'startDate', e.target.value)} placeholder="Start" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                            <input value={item.endDate} onChange={(e) => updateEducation(index, 'endDate', e.target.value)} placeholder="End" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                          </div>
                        </div>
                        <textarea value={item.description} onChange={(e) => updateEducation(index, 'description', e.target.value)} placeholder="Notes" rows="3" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sm:col-span-2 rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Projects</p>
                      <p className="text-xs text-slate-500">Show work that supports your profile.</p>
                    </div>
                    <button type="button" onClick={() => setProjects((current) => [...current, createProjectItem()])} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Add</button>
                  </div>
                  <div className="mt-4 space-y-4">
                    {projects.map((item, index) => (
                      <div key={`project-${index}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800">Project {index + 1}</p>
                          {projects.length > 1 && (
                            <button type="button" onClick={() => setProjects((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-xs font-semibold text-rose-600 hover:underline">Remove</button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <input value={item.name} onChange={(e) => updateProject(index, 'name', e.target.value)} placeholder="Project name" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                          <input value={item.url} onChange={(e) => updateProject(index, 'url', e.target.value)} placeholder="Project URL" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                          <input value={item.technologies} onChange={(e) => updateProject(index, 'technologies', e.target.value)} placeholder="Technologies, comma separated" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm sm:col-span-2" />
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <input value={item.startDate} onChange={(e) => updateProject(index, 'startDate', e.target.value)} placeholder="Start" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                          <input value={item.endDate} onChange={(e) => updateProject(index, 'endDate', e.target.value)} placeholder="End" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                        </div>
                        <textarea value={item.description} onChange={(e) => updateProject(index, 'description', e.target.value)} placeholder="Project summary" rows="3" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" />
                      </div>
                    ))}
                  </div>
                </div>
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
                  PDF, DOC, DOCX up to 5 MB
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