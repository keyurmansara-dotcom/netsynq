import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { logoutByRole, refreshByRole } from '../api/authClient.js';
import { clearStoredUser, getStoredUser } from '../api/authStorage.js';
import Navbar from '../components/Navbar';

const API_BASE = 'http://localhost:5000';

const Jobs = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [user, setUser] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [myJobs, setMyJobs] = useState([]);
    const [myApplications, setMyApplications] = useState([]);
    
    // Animation/Hired Modals State
    const [showCelebration, setShowCelebration] = useState(null);

    // Recruiter decision modal state
    const [decisionModal, setDecisionModal] = useState({
        isOpen: false,
        jobId: null,
        applicantId: null,
        applicantName: '',
        currentStatus: 'Pending',
        nextStatus: 'Pending',
    });
    const [decisionConfirmText, setDecisionConfirmText] = useState('');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    // Recruiter posting form state
    const [isPosting, setIsPosting] = useState(false);
    const [newJob, setNewJob] = useState({ title: '', company: '', location: '', description: '', type: 'Full-time', skillsRequired: '' });

    const fetchWithRetry = async (url, options = {}, roleOverride = null) => {
        const requestOptions = { credentials: 'include', ...options };
        let res = await fetch(url, requestOptions);
        const role = roleOverride || user?.role;

        if (res.status === 401 && role) {
            try {
                await refreshByRole(role);
                res = await fetch(url, requestOptions);
            } catch (error) {
                // Fall through and handle remaining 401 in caller.
            }
        }

        return res;
    };

    const searchQuery = useMemo(() => {
        const params = new URLSearchParams(location.search);
        return (params.get('q') || '').trim().toLowerCase();
    }, [location.search]);

    const filteredJobs = useMemo(() => {
        if (!searchQuery) return jobs;
        return jobs.filter((job) => {
            const haystack = [
                job.title,
                job.company,
                job.companyId?.name,
                job.location,
                job.description,
                ...(job.skillsRequired || []),
                job.type,
            ].join(' ').toLowerCase();
            return haystack.includes(searchQuery);
        });
    }, [jobs, searchQuery]);

    const filteredMyJobs = useMemo(() => {
        if (!searchQuery) return myJobs;
        return myJobs.filter((job) => {
            const haystack = [
                job.title,
                job.company,
                job.companyId?.name,
                job.location,
                job.description,
                ...(job.skillsRequired || []),
                job.type,
            ].join(' ').toLowerCase();
            return haystack.includes(searchQuery);
        });
    }, [myJobs, searchQuery]);

    useEffect(() => {
        const storedUser = getStoredUser();
        if (!storedUser) {
            navigate('/auth');
        } else {
            const parsedUser = storedUser;
            setUser(parsedUser);
            
            // Fetch jobs depending on role
            if (parsedUser.role === 'recruiter') {
                fetchMyJobs(parsedUser.role);
            } else {
                fetchAllJobs(parsedUser.role);
                fetchMyApplications(parsedUser.role);
            }
        }
    }, [navigate]);

    useEffect(() => {
        if (jobs.length > 0 && user && user.role !== 'recruiter') {
            const hiredJob = jobs.find(job => {
                const app = job.applicants?.find(a => a.user === user.id || a.user?._id === user.id || a.user === user._id || a.user?._id === user._id);
                return app && app.status === 'Hired';
            });
            
            // Show celebration if we haven't already celebrated this job in this session
            if (hiredJob && !sessionStorage.getItem(`celebrated_${hiredJob._id}`)) {
                setShowCelebration(hiredJob);
                sessionStorage.setItem(`celebrated_${hiredJob._id}`, 'true');
            }
        }
    }, [jobs, user]);

    const fetchAllJobs = async (roleOverride = null) => {
        try {
            const res = await fetchWithRetry(`${API_BASE}/api/jobs`, {}, roleOverride);
            if (res.status === 401) {
                clearStoredUser();
                navigate('/auth');
                return;
            }
            if (res.ok) {
                const payload = await res.json();
                setJobs(Array.isArray(payload) ? payload : []);
            }
        } catch (error) { console.error('Failed to fetch jobs', error); }
    };

    const fetchMyJobs = async (roleOverride = null) => {
        try {
            const res = await fetchWithRetry(`${API_BASE}/api/jobs/myjobs`, {}, roleOverride);
            if (res.status === 401) {
                clearStoredUser();
                navigate('/auth');
                return;
            }
            if (res.ok) {
                const payload = await res.json();
                setMyJobs(Array.isArray(payload) ? payload : []);
            }
        } catch (error) { console.error('Failed to fetch my jobs', error); }
    };

    const fetchMyApplications = async (roleOverride = null) => {
        try {
            const res = await fetchWithRetry(`${API_BASE}/api/jobs/applications`, {}, roleOverride);
            if (res.status === 401) {
                clearStoredUser();
                navigate('/auth');
                return;
            }
            if (res.ok) {
                const payload = await res.json();
                setMyApplications(Array.isArray(payload) ? payload : []);
            }
        } catch (error) { console.error('Failed to fetch applications', error); }
    };

    const handleApply = async (jobId) => {
        try {
            const res = await fetchWithRetry(`${API_BASE}/api/jobs/${jobId}/apply`, { method: 'POST' });
            if (res.ok) {
                await fetchAllJobs(user?.role); // refresh list
                return;
            }

            let errorMessage = 'Failed to apply for this job';
            try {
                const data = await res.json();
                if (data?.message) errorMessage = data.message;
            } catch {
                // keep fallback message when response is not JSON
            }
            alert(errorMessage);
        } catch (err) { console.error(err); }
    };

    const handlePostJob = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                title: newJob.title.trim(),
                company: newJob.company.trim(),
                location: newJob.location.trim(),
                description: newJob.description.trim(),
                type: newJob.type,
                skillsRequired: newJob.skillsRequired
                    .split(',')
                    .map((skill) => skill.trim())
                    .filter(Boolean)
            };
            const res = await fetchWithRetry(`${API_BASE}/api/jobs`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setIsPosting(false);
                setNewJob({ title: '', company: '', location: '', description: '', type: 'Full-time', skillsRequired: '' });
                fetchMyJobs(user?.role);
                return;
            }

            let errorMessage = 'Failed to create job';
            try {
                const data = await res.json();
                if (data?.message) errorMessage = data.message;
            } catch {
                // keep fallback message when response is not JSON
            }
            alert(errorMessage);
        } catch (err) { console.error(err); }
    };

    const handleUpdateStatus = async (jobId, applicantId, status) => {
        try {
            const res = await fetchWithRetry(`${API_BASE}/api/jobs/${jobId}/applicant/${applicantId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                await fetchMyJobs(user?.role);
                return true;
            }
            return false;
        } catch (err) { console.error(err); }
        return false;
    };

    const openDecisionModal = (jobId, app, nextStatus) => {
        setDecisionConfirmText('');
        setDecisionModal({
            isOpen: true,
            jobId,
            applicantId: app._id,
            applicantName: app.user.name,
            currentStatus: app.status,
            nextStatus,
        });
    };

    const closeDecisionModal = () => {
        if (isUpdatingStatus) return;
        setDecisionConfirmText('');
        setDecisionModal({
            isOpen: false,
            jobId: null,
            applicantId: null,
            applicantName: '',
            currentStatus: 'Pending',
            nextStatus: 'Pending',
        });
    };

    const handleConfirmDecision = async () => {
        const isChangingFinalDecision = decisionModal.currentStatus !== 'Pending';
        if (isChangingFinalDecision && decisionConfirmText.trim().toUpperCase() !== 'CONFIRM') return;

        setIsUpdatingStatus(true);
        const ok = await handleUpdateStatus(decisionModal.jobId, decisionModal.applicantId, decisionModal.nextStatus);
        setIsUpdatingStatus(false);
        if (ok) closeDecisionModal();
    };

    const handleLogout = async () => {
        try {
            if (user?.role) {
                await logoutByRole(user.role);
            }
        } catch (error) {
            // Clear local session even if server logout fails.
        }
        clearStoredUser();
        navigate('/auth');
    };

    if (!user) return null;

    // A small inline component to render confetti
    const ConfettiEffect = () => {
        const pieces = Array.from({ length: 40 });
        return (
            <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
                {pieces.map((_, i) => (
                    <div 
                        key={i} 
                        className="confetti-piece absolute"
                        style={{
                            left: `${Math.random() * 100}%`,
                            backgroundColor: ['#e3342f', '#f6993f', '#f6e05e', '#38c172', '#38c172', '#4dc0b5', '#3490dc', '#6574cd', '#3490dc', '#9561e2', '#f66d9b'][Math.floor(Math.random() * 11)],
                            animationDuration: `${Math.random() * 3 + 2}s`,
                            animationDelay: `${Math.random() * 2}s`,
                            width: `${Math.random() * 10 + 5}px`,
                            height: `${Math.random() * 20 + 10}px`
                        }}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F3F2EF] w-full flex-1 pb-10 relative">
            {/* Celebration Overlay */}
            {showCelebration && (
                <>
                    <ConfettiEffect />
                    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6">
                        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center animate-popOut relative origin-center transform-gpu">
                            <button onClick={() => setShowCelebration(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                            <div className="text-6xl mb-4 animate-bounce">🎁</div>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Congratulations!</h2>
                            <p className="text-gray-600 mb-6 font-medium">You have been <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded">HIRED</span> for</p>
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mb-6">
                                <h3 className="font-bold text-blue-800 text-lg">{showCelebration.title}</h3>
                                <p className="text-sm text-blue-600 font-semibold">{showCelebration.company}</p>
                            </div>
                            <button onClick={() => setShowCelebration(null)} className="w-full bg-blue-600 text-white font-bold py-3 rounded-full hover:bg-blue-700 shadow-md transform transition hover:-translate-y-0.5">
                                Celebrate! 🎉
                            </button>
                        </div>
                    </div>
                </>
            )}

            {decisionModal.isOpen && (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
                        <button
                            onClick={closeDecisionModal}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
                            disabled={isUpdatingStatus}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>

                        <h3 className="text-xl font-bold text-gray-900 mb-2">Confirm Decision</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Applicant: <span className="font-semibold text-gray-900">{decisionModal.applicantName}</span>
                        </p>

                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm mb-4">
                            <p>
                                Status will change from <span className="font-semibold">{decisionModal.currentStatus}</span> to{' '}
                                <span className={`font-semibold ${decisionModal.nextStatus === 'Hired' ? 'text-green-700' : 'text-red-700'}`}>
                                    {decisionModal.nextStatus}
                                </span>
                            </p>
                        </div>

                        {decisionModal.currentStatus !== 'Pending' && (
                            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                                <p className="text-sm text-amber-800 font-medium mb-2">
                                    You are changing an already final decision. Type <span className="font-bold">CONFIRM</span> to continue.
                                </p>
                                <input
                                    type="text"
                                    value={decisionConfirmText}
                                    onChange={(e) => setDecisionConfirmText(e.target.value)}
                                    placeholder="Type CONFIRM"
                                    className="w-full border border-amber-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    disabled={isUpdatingStatus}
                                />
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={closeDecisionModal}
                                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
                                disabled={isUpdatingStatus}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDecision}
                                className={`px-4 py-2 rounded-lg text-white ${decisionModal.nextStatus === 'Hired' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                disabled={
                                    isUpdatingStatus ||
                                    (decisionModal.currentStatus !== 'Pending' && decisionConfirmText.trim().toUpperCase() !== 'CONFIRM')
                                }
                            >
                                {isUpdatingStatus ? 'Updating...' : `Confirm ${decisionModal.nextStatus}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Navbar user={user} onLogout={handleLogout} />
            <main className="max-w-6xl mx-auto pt-6 px-4 sm:px-6 lg:px-8 mt-4">
                {user.role === 'recruiter' ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Sidebar: Recruiter Actions */}
                        <div className="col-span-1">
                            <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-20">
                                <h2 className="text-lg font-bold text-gray-800">Recruiter Options</h2>
                                <button onClick={() => setIsPosting(!isPosting)} className="mt-4 w-full bg-blue-600 text-white font-semibold py-2 rounded-full hover:bg-blue-700">
                                    {isPosting ? 'Cancel Posting' : 'Post a New Job'}
                                </button>
                                <hr className="my-4" />
                                <p className="text-sm text-gray-600 font-semibold mb-2">My Active Postings: {myJobs.length}</p>
                            </div>
                        </div>

                        {/* Main Feed: Recruiter Dashboard */}
                        <div className="col-span-1 md:col-span-3">
                            {isPosting && (
                                <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                                    <h2 className="text-xl font-bold mb-4">Create Job Posting</h2>
                                    <form onSubmit={handlePostJob} className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <input type="text" placeholder="Job Title" required value={newJob.title} onChange={e => setNewJob({...newJob, title: e.target.value})} className="border p-2 rounded" />
                                            <input type="text" placeholder="Company Name" required value={newJob.company} onChange={e => setNewJob({...newJob, company: e.target.value})} className="border p-2 rounded" />
                                            <input type="text" placeholder="Location" required value={newJob.location} onChange={e => setNewJob({...newJob, location: e.target.value})} className="border p-2 rounded" />
                                            <select value={newJob.type} onChange={e => setNewJob({...newJob, type: e.target.value})} className="border p-2 rounded">
                                                <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Remote</option>
                                            </select>
                                        </div>
                                        <input type="text" placeholder="Skills Required (comma separated)" required value={newJob.skillsRequired} onChange={e => setNewJob({...newJob, skillsRequired: e.target.value})} className="border p-2 rounded w-full" />
                                        <textarea placeholder="Job Description" required value={newJob.description} onChange={e => setNewJob({...newJob, description: e.target.value})} className="border p-2 rounded w-full h-32" />
                                        <button className="bg-blue-600 text-white font-semibold py-2 px-6 rounded-full hover:bg-blue-700">Submit Posting</button>
                                    </form>
                                </div>
                            )}

                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                {searchQuery ? `Manage Applications • Search: "${searchQuery}"` : 'Manage Applications'}
                            </h2>
                            {filteredMyJobs.length === 0 ? (
                                <p className="text-gray-500">{searchQuery ? 'No matching job postings found.' : 'You have no active job postings.'}</p>
                            ) : (
                                filteredMyJobs.map(job => (
                                    <div key={job._id} className="bg-white rounded-lg border border-gray-200 p-5 mb-4">
                                        <div className="flex justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold">{job.title}</h3>
                                                <p className="text-sm text-gray-600">{job.company} • {job.location}</p>
                                            </div>
                                            <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{job.type === 'Full-time' ? 'Full-time' : 'Part-time'}</span>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-2">{job.applicants.length} Applicant(s)</p>
                                        
                                        {/* Applicants List */}
                                        {job.applicants.length > 0 && (
                                            <div className="mt-4 border-t pt-4">
                                                {job.applicants.map(app => (
                                                    <div key={app._id} className="flex justify-between items-center border-b pb-3 mb-3 last:border-0 last:mb-0 last:pb-0">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900">{app.user.name}</h4>
                                                            <p className="text-xs text-gray-500">{app.user.email} • {app.user.profile?.headline || 'No headline provided'}</p>
                                                        </div>
                                                        <div className="flex items-center space-x-3">
                                                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                                                                app.status === 'Hired' ? 'bg-green-100 text-green-700' :
                                                                app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                            }`}>{app.status}</span>
                                                            {app.status === 'Pending' && (
                                                                <div className="flex space-x-2">
                                                                    <button 
                                                                        onClick={() => openDecisionModal(job._id, app, 'Hired')}
                                                                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition"
                                                                    >
                                                                        Hired
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => openDecisionModal(job._id, app, 'Rejected')}
                                                                        className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded transition"
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {app.status !== 'Pending' && (
                                                                <div className="flex space-x-2">
                                                                    {app.status !== 'Hired' && (
                                                                        <button
                                                                            onClick={() => openDecisionModal(job._id, app, 'Hired')}
                                                                            className="text-xs bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 px-3 py-1 rounded transition"
                                                                        >
                                                                            Change to Hired
                                                                        </button>
                                                                    )}
                                                                    {app.status !== 'Rejected' && (
                                                                        <button
                                                                            onClick={() => openDecisionModal(job._id, app, 'Rejected')}
                                                                            className="text-xs bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 px-3 py-1 rounded transition"
                                                                        >
                                                                            Change to Rejected
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Sidebar: Seeker preferences */}
                        <div className="col-span-1 hidden md:block">
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-20">
                                <div className="p-4 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-800">My jobs</h2>
                                </div>
                                <ul className="py-2">
                                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-600 font-medium">Saved jobs</li>
                                    <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-600 font-medium">Applied jobs</li>
                                </ul>
                            </div>
                        </div>

                        {/* Main Feed: Job Search */}
                        <div className="col-span-1 md:col-span-3">
                            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                                <h1 className="text-xl font-bold mb-6">
                                    {searchQuery ? `Search results for "${searchQuery}"` : 'Recommended for you'}
                                </h1>
                                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-base font-semibold text-slate-900">Application tracking</h2>
                                            <p className="text-sm text-slate-500">Your submitted jobs and current review status.</p>
                                        </div>
                                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">{myApplications.length} applications</span>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {myApplications.length > 0 ? myApplications.slice(0, 4).map((job) => {
                                            const myApplication = job.applicants?.find(a => a.user === user.id || a.user?._id === user.id || a.user === user._id || a.user?._id === user._id);
                                            return (
                                                <div key={job._id} className="rounded-xl border border-slate-200 bg-white p-4">
                                                    <p className="font-semibold text-slate-900">{job.title}</p>
                                                    <p className="text-sm text-slate-500">{job.companyId?.name || job.company} • {job.location}</p>
                                                    <p className="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-slate-100 text-slate-700">{myApplication?.status || 'Pending'}</p>
                                                </div>
                                            );
                                        }) : <p className="text-sm text-slate-500">No applications yet.</p>}
                                    </div>
                                </div>
                                {filteredJobs.length === 0 ? (
                                    <p className="text-gray-500 text-center py-10">{searchQuery ? 'No jobs match your search.' : 'No jobs available right now.'}</p>
                                ) : (
                                    <div className="space-y-6">
                                        {filteredJobs.map(job => {
                                            // Check if already applied
                                            const myApplication = job.applicants?.find(a => a.user === user.id || a.user?._id === user.id || a.user === user._id || a.user?._id === user._id);
                                            return (
                                                <div key={job._id} className="flex flex-col sm:flex-row sm:items-start justify-between border-b pb-6 last:border-0 last:pb-0">
                                                    <div className="flex space-x-4">
                                                        <div className="h-14 w-14 rounded bg-gray-100 flex items-center justify-center font-bold text-gray-400 text-xl shrink-0">
                                                            {(job.companyId?.name || job.company || '?').charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-semibold text-blue-600 hover:underline cursor-pointer">{job.title}</h3>
                                                            <p className="text-gray-800">{job.companyId?.name || job.company} • {job.location}</p>
                                                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                                                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">{job.type === 'Full-time' ? 'Full-time' : 'Part-time'}</span>
                                                                {job.skillsRequired && <span>Skills: {job.skillsRequired.slice(0,3).join(', ')}</span>}
                                                            </p>
                                                            <p className="text-sm text-gray-600 mt-2 line-clamp-2 pr-4">{job.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 sm:mt-0 shrink-0">
                                                        {myApplication ? (
                                                            <span className={`inline-block font-semibold px-5 py-1.5 rounded-full text-sm ${
                                                                myApplication.status === 'Hired' ? 'bg-green-100 text-green-700' :
                                                                myApplication.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-200 text-gray-600'
                                                            }`}>
                                                                {myApplication.status === 'Hired' ? 'Hired 🎉' : 
                                                                 myApplication.status === 'Rejected' ? 'Not Selected' : 
                                                                 'Applied ✓'}
                                                            </span>
                                                        ) : (
                                                            <button onClick={() => handleApply(job._id)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-1.5 rounded-full text-sm transition">
                                                                Easy Apply
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Jobs;