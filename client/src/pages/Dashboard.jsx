import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '../components/Navbar';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showAllNews, setShowAllNews] = useState(false);

    const newsItems = [
        { title: 'The Future of Remote Work', meta: 'Top news • 10,240 readers' },
        { title: 'How AI is shaping Web Dev', meta: '1d ago • 5,420 readers' },
        { title: 'Hiring Trends for React Devs', meta: '12h ago • 7,800 readers' },
        { title: 'Top Backend Interview Questions in 2026', meta: '5h ago • 6,210 readers' },
        { title: 'Why TypeScript is Dominating Frontend Teams', meta: '9h ago • 4,980 readers' },
        { title: 'Hiring Surge in Product Security Roles', meta: '2d ago • 3,760 readers' }
    ];

    // Infinite scroll setup
    const observer = useRef();
    const lastPostElementRef = useCallback((node) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && hasMore) {
                setPage((prevPage) => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    // NEW STATES FOR POSTING
    const [showPostModal, setShowPostModal] = useState(false);
    const [postContent, setPostContent] = useState("");
    const [postMediaUrl, setPostMediaUrl] = useState("");
    const [showMediaInput, setShowMediaInput] = useState(false);
    const [mediaFile, setMediaFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // NEW STATES FOR COMMENTS
    const [activeCommentPostId, setActiveCommentPostId] = useState(null);
    const [commentText, setCommentText] = useState("");

    // NEW STATES FOR POST OPTIONS (EDIT/DELETE)
    const [openPostOptionsId, setOpenPostOptionsId] = useState(null);
    const [editingPostId, setEditingPostId] = useState(null);
    const [editPostContent, setEditPostContent] = useState("");

    // TIME FORMATTER
    const getRelativeTime = (dateString) => {
        const timeValue = new Date(dateString).getTime();
        if (!timeValue) return '';
        const diff = Date.now() - timeValue;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        const weeks = Math.floor(days / 7);
        const months = Math.floor(days / 30);
        const years = Math.floor(days / 365);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        if (weeks < 4) return `${weeks}w ago`;
        if (months < 12) return `${months}mo ago`;
        return `${years}y ago`;
    };

    const handleCreatePost = async () => {
        if (!postContent.trim() && !mediaFile && !postMediaUrl) return;
        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            let finalMediaUrl = postMediaUrl;
            
            if (mediaFile) {
                const formData = new FormData();
                formData.append('media', mediaFile);
                const uploadRes = await fetch('http://localhost:5000/api/upload', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    finalMediaUrl = `http://localhost:5000${data.mediaUrl}`;
                } else {
                    const errorText = await uploadRes.text();
                    console.error("Upload failed:", errorText);
                    alert("Media upload failed. Please try again.");
                    setUploading(false);
                    return;
                }
            }

            const res = await fetch('http://localhost:5000/api/posts', {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                // Ensure content string is at least empty, never undefined
                body: JSON.stringify({ content: postContent || " ", mediaUrl: finalMediaUrl })
            });
            if (res.ok) {
                const newPost = await res.json();
                // To display it instantly with author populated
                newPost.author = { _id: user.id || user._id, name: user.name, profile: { headline: user.profile?.headline || user.role } };
                setPosts([newPost, ...posts]);
                setPostContent("");
                setPostMediaUrl("");
                setMediaFile(null);
                setShowMediaInput(false);
                setShowPostModal(false);
            } else {
                const errData = await res.json();
                console.error("Failed to create post:", errData);
                alert("Failed to create post. Please try again.");
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred while posting.");
        } finally {
            setUploading(false);
        }
    };

    // HANDLE DELETE POST
    const handleDeletePost = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/posts/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPosts(posts.filter(p => p._id !== postId));
                setOpenPostOptionsId(null);
            } else {
                alert("Failed to delete post");
            }
        } catch (err) {
            console.error(err);
        }
    };

    // HANDLE SAVE EDITED POST
    const handleSaveEdit = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/posts/${postId}`, {
                method: 'PUT',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ content: editPostContent })
            });
            if (res.ok) {
                const updatedPost = await res.json();
                setPosts(posts.map(p => p._id === postId ? updatedPost : p));
                setEditingPostId(null);
                setEditPostContent("");
            } else {
                alert("Failed to update post");
            }
        } catch (err) {
            console.error(err);
        }
    };

    // HANDLE LIKE POST
    const handleLike = async (postId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/posts/${postId}/like`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const newLikes = await res.json();
                setPosts(posts.map(p => p._id === postId ? { ...p, likes: newLikes } : p));
            }
        } catch (err) {
            console.error('Error toggling like:', err);
        }
    };

    // HANDLE COMMENT
    const handleAddComment = async (postId) => {
        if (!commentText.trim()) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/posts/${postId}/comment`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify({ text: commentText })
            });
            if (res.ok) {
                const newComments = await res.json();
                setPosts(posts.map(p => p._id === postId ? { ...p, comments: newComments } : p));
                setCommentText(""); // Clear input
            }
        } catch (err) {
            console.error('Error adding comment:', err);
        }
    };

    // HANDLE DELETE COMMENT
    const handleDeleteComment = async (postId, commentId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/posts/${postId}/comment/${commentId}`, {
                method: 'DELETE',
                headers: { 
                    'Authorization': `Bearer ${token}` 
                }
            });
            if (res.ok) {
                const newComments = await res.json();
                setPosts(posts.map(p => p._id === postId ? { ...p, comments: newComments } : p));
            }
        } catch (err) {
            console.error('Error deleting comment:', err);
        }
    };

    // HANDLE APPLYING FOR JOBS IN FEED
    const handleApply = async (jobId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/jobs/${jobId}/apply`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const userId = user.id || user._id;
                setJobs(jobs.map(j => j._id === jobId ? { ...j, applicants: [...(j.applicants || []), { user: userId }] } : j));
            } else {
                alert((await res.json()).message);
            }
        } catch (err) { console.error(err); }
    };

    // Fetch Posts
    useEffect(() => {
        if (!user) return;
        
        setLoading(true);
        const token = localStorage.getItem('token');
        fetch(`http://localhost:5000/api/posts?page=${page}&limit=2`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setPosts((prevPosts) => {
                    // Optional: remove duplicates if strictMode double-calls
                    const newPosts = data.filter(d => !prevPosts.find(p => p._id === d._id));
                    return [...prevPosts, ...newPosts];
                });
                setHasMore(data.length > 0);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [page, user]);

    // Fetch Jobs
    useEffect(() => {
        if (!user) return;
        
        const token = localStorage.getItem('token');
        fetch('http://localhost:5000/api/jobs', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setJobs(data);
            })
            .catch((err) => {
                console.error(err);
            });
    }, [user]);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (!storedToken || !storedUser) {
            navigate('/auth');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth');
    };

    if (!user) return <div className="text-center mt-20">Loading...</div>;

    const profileChecklist = [
        { label: 'Add headline', done: Boolean(user.profile?.headline) },
        { label: 'Add location', done: Boolean(user.profile?.location) },
        { label: 'Upload resume', done: Boolean(user.profile?.resumeUrl) },
        { label: 'Verify email', done: Boolean(user.email) },
    ];
    const completedProfileItems = profileChecklist.filter((item) => item.done).length;
    const profileStrength = Math.round((completedProfileItems / profileChecklist.length) * 100);

    return (
        <div className="min-h-screen bg-[#F3F2EF] w-full flex-1 pb-10">
            <Navbar user={user} onLogout={handleLogout} />
            
            <main className="max-w-7xl mx-auto pt-6 px-4 sm:px-6 lg:px-8">
                {/* 3-Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 relative">
                    
                    {/* LEFT COLUMN - Profile Summary */}
                    <div className="hidden md:block md:col-span-1 lg:col-span-3">
                        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden text-center sticky top-20">
                            {/* Banner Image */}
                            <div className="h-16 bg-gradient-to-r from-blue-300 to-blue-600"></div>
                            {/* Profile Image (placeholder avatar) */}
                            <div className="-mt-10 mx-auto w-20 h-20 bg-white border-2 border-white rounded-full flex flex-col items-center justify-center text-4xl text-blue-600 font-bold shadow-sm">
                                {user.name.charAt(0).toUpperCase()}
                            </div>
                            
                            <div className="px-4 py-5">
                                <h1 className="text-lg font-bold text-gray-900 leading-tight hover:underline cursor-pointer">{user.name}</h1>
                                <p className="text-sm text-gray-500 mt-1 capitalize">{user.role}</p>
                                <div className="mt-3 space-y-1 text-left">
                                    <p className="text-sm text-gray-700 font-medium line-clamp-2">{user.profile?.headline || 'Add your headline in profile'}</p>
                                    <p className="text-xs text-gray-500">{user.profile?.location || 'Location not added'}</p>
                                    <p className="text-xs text-gray-500 break-all">{user.email}</p>
                                    <p className="text-xs font-semibold text-emerald-700">
                                        {user.profile?.resumeUrl ? 'Resume uploaded' : 'Resume not uploaded'}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-200 py-3 px-4 text-left">
                                <div className="flex justify-between items-center text-sm font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer p-1">
                                    <span>Connections</span>
                                    <span className="text-blue-600">{user.connections?.length || 0}</span>
                                </div>
                                <div onClick={() => navigate('/network')} className="flex justify-between items-center text-sm font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer p-1">
                                    <span>Grow your network</span>
                                </div>
                            </div>
                            <div className="border-t border-gray-200 py-3 px-4 rounded-b-lg">
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="w-full text-left text-sm font-semibold text-blue-600 hover:text-blue-700"
                                >
                                    View and edit profile
                                </button>
                            </div>

                            <div className="border-t border-gray-200 px-4 py-4 text-left">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-700">Profile strength</p>
                                    <span className="text-xs font-bold text-blue-600">{profileStrength}%</span>
                                </div>
                                <div className="mt-2 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                                    <div
                                        className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                                        style={{ width: `${profileStrength}%` }}
                                    ></div>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    {profileChecklist.find((item) => !item.done)?.label
                                        ? `Next: ${profileChecklist.find((item) => !item.done).label}`
                                        : 'Great profile! You are all set.'}
                                </p>
                            </div>

                            <div className="border-t border-gray-200 px-4 py-4 text-left">
                                <p className="text-sm font-semibold text-gray-700 mb-2">Quick actions</p>
                                <div className="space-y-2">
                                    <button onClick={() => navigate('/jobs')} className="w-full text-left text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md px-2 py-1.5 transition">
                                        Browse jobs
                                    </button>
                                    <button onClick={() => navigate('/network')} className="w-full text-left text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md px-2 py-1.5 transition">
                                        Find connections
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CENTER COLUMN - Feed & Jobs */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-6 space-y-4">
                        
                        {/* Create Post Box */}
                        {!showPostModal ? (
                            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                                <div className="flex space-x-3 items-center">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-lg text-blue-600 font-bold border border-blue-200">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <button 
                                        onClick={() => setShowPostModal(true)}
                                        className="flex-1 rounded-full border border-gray-400 bg-white px-4 py-3 text-left text-gray-500 font-semibold hover:bg-gray-100 transition-colors"
                                    >
                                        Start a post
                                    </button>
                                </div>
                                <div className="flex justify-around mt-3 pt-2">
                                    <button onClick={() => setShowPostModal(true)} className="flex items-center space-x-2 text-gray-500 font-semibold hover:bg-gray-100 px-3 py-2 rounded-md">
                                        <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path></svg>
                                        <span className="hidden sm:block">Media</span>
                                    </button>
                                    <button onClick={() => setShowPostModal(true)} className="flex items-center space-x-2 text-gray-500 font-semibold hover:bg-gray-100 px-3 py-2 rounded-md">
                                        <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>
                                        <span className="hidden sm:block">Event</span>
                                    </button>
                                    <button onClick={() => setShowPostModal(true)} className="flex items-center space-x-2 text-gray-500 font-semibold hover:bg-gray-100 px-3 py-2 rounded-md">
                                        <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd"></path><path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z"></path></svg>
                                        <span className="hidden sm:block">Write article</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                                <div className="flex space-x-3 items-center mb-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-blue-600 font-bold border border-blue-200">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-gray-900 leading-tight">{user.name}</h2>
                                        <p className="text-xs text-gray-500">Post to Anyone</p>
                                    </div>
                                </div>
                                
                                <textarea 
                                    className="w-full bg-transparent resize-none border-none outline-none text-lg text-gray-800 placeholder-gray-500 min-h-[100px]"
                                    placeholder="What do you want to talk about?"
                                    value={postContent}
                                    onChange={(e) => setPostContent(e.target.value)}
                                    autoFocus
                                ></textarea>

                                {showMediaInput && (
                                    <div className="mt-2 pb-2 space-y-2">
                                        <input 
                                            type="text" 
                                            placeholder="Paste image/video URL here..." 
                                            value={postMediaUrl} 
                                            onChange={(e) => {
                                                setPostMediaUrl(e.target.value);
                                                setMediaFile(null); // Clear file if URL is provided
                                            }}
                                            className="w-full p-2 border border-gray-300 rounded text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                                        />
                                        <div className="flex items-center justify-center w-full">
                                            <label className="flex flex-col flex-1 items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <svg aria-hidden="true" className="w-8 h-8 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                                                    <p className="mb-0 text-sm text-gray-500 font-semibold">{mediaFile ? mediaFile.name : "Click to upload a photo or video"}</p>
                                                </div>
                                                <input 
                                                    type="file" 
                                                    accept="image/*,video/*" 
                                                    className="hidden" 
                                                    onChange={(e) => {
                                                        setMediaFile(e.target.files[0]);
                                                        setPostMediaUrl(""); // Clear URL if file is selected
                                                    }}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                                    <div className="flex space-x-2">
                                        <button onClick={() => setShowMediaInput(!showMediaInput)} className={`p-2 rounded-full cursor-pointer transition ${showMediaInput ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'}`}>
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path></svg>
                                        </button>
                                        <button className="text-gray-500 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full cursor-pointer">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                                        </button>
                                    </div>
                                    <div className="space-x-3 flex items-center">
                                        <button onClick={() => { setShowPostModal(false); setPostContent(''); setPostMediaUrl(''); setMediaFile(null); setShowMediaInput(false); }} className="px-4 py-1.5 rounded-full hover:bg-gray-100 font-semibold text-gray-600 transition">
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={handleCreatePost} 
                                            disabled={(!postContent.trim() && !mediaFile && !postMediaUrl) || uploading}
                                            className={`px-4 py-1.5 rounded-full font-semibold text-white transition ${(!postContent.trim() && !mediaFile && !postMediaUrl) || uploading ? "bg-gray-300" : "bg-blue-600 hover:bg-blue-700"}`}
                                        >
                                            {uploading ? "Posting..." : "Post"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Feed Placeholder Divider */}
                        <div className="flex items-center">
                            <hr className="flex-1 border-gray-300" />
                            <div className="px-2 text-xs text-gray-500 font-semibold flex items-center shadow-sm">
                                Sort by: <span className="text-gray-900 ml-1">Top</span> 
                                <svg className="w-4 h-4 text-gray-600 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>

                        {/* Empty State Fallback (If no posts) */}
                        {!loading && posts.length === 0 && (
                            <div className="bg-white rounded-lg shadow border border-gray-200 p-6 text-center">
                                <h2 className="text-lg font-bold text-gray-900">Your feed is surprisingly quiet!</h2>
                                <p className="text-sm text-gray-500 mt-2">Start a post, or check out these suggested jobs below while you wait.</p>
                            </div>
                        )}

                        {/* Standalone Jobs Map if empty feed */}
                        {posts.length === 0 && jobs.map((promotedJob, index) => {
                           const hasAppliedJob = promotedJob.applicants?.some(a => a.user === (user.id || user._id) || a.user?._id === (user.id || user._id));
                           return (
                           <div key={`empty-job-${index}`} className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs text-gray-500 font-bold">Suggested Job</span>
                                    <button className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg></button>
                                </div>
                                <div className="flex space-x-3 mb-3">
                                        <div className="w-12 h-12 bg-gray-100 flex items-center justify-center font-bold text-xl rounded-md uppercase text-gray-600">
                                        {promotedJob.company.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-base font-bold text-gray-900 leading-tight hover:underline cursor-pointer hover:text-blue-600">{promotedJob.title}</h2>
                                        <p className="text-sm text-gray-800">{promotedJob.company}</p>
                                        <p className="text-xs text-gray-500">{promotedJob.location} • {promotedJob.type}</p>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                                    <p>{promotedJob.description}</p>
                                </div>
                                {hasAppliedJob ? (
                                    <span className="mt-3 inline-block text-center bg-gray-200 text-gray-600 font-bold px-4 py-1.5 rounded-full w-full">
                                        Applied ✓
                                    </span>
                                ) : (
                                    <button onClick={() => handleApply(promotedJob._id)} className="mt-3 text-blue-600 font-bold px-4 py-1.5 rounded-full border border-blue-600 hover:bg-blue-50 transition w-full">
                                        Apply Now
                                    </button>
                                )}
                            </div>
                           );
                        })}

                        {/* Feed List (Only runs if posts exist) */}
                        {posts.map((post, index) => {
                            const isLastPost = posts.length === index + 1;
                            const promotedJob = index > 0 && index % 2 === 0 && jobs[index / 2] ? jobs[index / 2] : null;

                            return (
                                <div key={post._id || index}>
                                    <div 
                                        ref={isLastPost ? lastPostElementRef : null} 
                                        className="bg-white rounded-lg shadow border border-gray-200 mb-4"
                                    >
                                        <div className="p-4 border-b border-gray-100">
                                            <div className="flex space-x-3">
                                                <div className="w-12 h-12 bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl rounded-md uppercase">
                                                    {post.author?.name ? post.author.name.charAt(0) : 'U'}
                                                </div>
                                                <div>
                                                    <h2 className="text-sm font-bold text-gray-900">{post.author?.name || 'Unknown User'}</h2>
                                                    <p className="text-xs text-gray-500">{post.author?.profile?.headline || 'Member'}</p>
                                                    <p className="text-xs text-gray-500 flex items-center">
                                                        {getRelativeTime(post.createdAt)} • <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd"></path></svg>
                                                    </p>
                                                </div>
                                                <div className="ml-auto relative">
                                                    <button 
                                                        onClick={() => setOpenPostOptionsId(openPostOptionsId === post._id ? null : post._id)}
                                                        className="text-gray-500 hover:text-gray-900 hover:bg-gray-100 p-2 rounded-full mb-auto transition" 
                                                        title="More options"
                                                    >
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                                                    </button>
                                                    {openPostOptionsId === post._id && (
                                                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                                                            {(post.author?._id === (user.id || user._id) || post.author === (user.id || user._id)) ? (
                                                                <>
                                                                    <button 
                                                                        onClick={() => { setEditingPostId(post._id); setEditPostContent(post.content); setOpenPostOptionsId(null); }}
                                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                    >
                                                                        Edit Post
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeletePost(post._id)}
                                                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 font-semibold"
                                                                    >
                                                                        Delete Post
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => { setOpenPostOptionsId(null); alert("Post saved!"); }}
                                                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                                >
                                                                    Save Post
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mt-3 text-sm text-gray-800 break-words whitespace-pre-wrap">
                                                {editingPostId === post._id ? (
                                                    <div className="bg-gray-50 p-3 rounded-md border border-gray-200">
                                                        <textarea 
                                                            className="w-full bg-white border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                                            rows="4"
                                                            value={editPostContent}
                                                            onChange={(e) => setEditPostContent(e.target.value)}
                                                        />
                                                        <div className="flex justify-end space-x-2 mt-2">
                                                            <button 
                                                                onClick={() => { setEditingPostId(null); setEditPostContent(""); }}
                                                                className="px-3 py-1.5 rounded-full hover:bg-gray-200 text-gray-600 text-sm font-semibold transition"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button 
                                                                onClick={() => handleSaveEdit(post._id)}
                                                                className="px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
                                                            >
                                                                Save
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p>{post.content}</p>
                                                )}
                                            </div>
                                            {post.mediaUrl && (
                                                <div className="mt-3 -mx-4 bg-gray-100">
                                                    {post.mediaUrl.match(/\.(mp4|webm|mkv)$/i) || post.mediaUrl.includes('video') ? (
                                                        <video controls className="w-full object-contain max-h-[500px]">
                                                            <source src={post.mediaUrl} />
                                                            Your browser does not support the video tag.
                                                        </video>
                                                    ) : (
                                                        <img src={post.mediaUrl} alt="Post Content" className="w-full object-cover max-h-[500px]" onError={(e) => e.target.style.display='none'} />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Post Like and Comment Count Stats */}
                                        {(post.likes?.length > 0 || post.comments?.length > 0) && (
                                            <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
                                                {post.likes?.length > 0 ? (
                                                    <div className="flex items-center space-x-1">
                                                        <div className="bg-blue-600 rounded-full p-0.5"><svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"></path></svg></div>
                                                        <span className="hover:text-blue-600 hover:underline cursor-pointer">
                                                            {post.likes.length === 1 
                                                                ? `${post.likes[0]?.name || 'Someone'}` 
                                                                : post.likes.length === 2 
                                                                    ? `${post.likes[0]?.name || 'Someone'} and 1 other` 
                                                                    : `${post.likes[0]?.name || 'Someone'} and ${post.likes.length - 1} others`}
                                                        </span>
                                                    </div>
                                                ) : <div/>}
                                                {post.comments?.length > 0 && <span className="cursor-pointer hover:text-blue-600 hover:underline ml-auto" onClick={() => setActiveCommentPostId(activeCommentPostId === post._id ? null : post._id)}>{post.comments.length} comments</span>}
                                            </div>
                                        )}

                                        {/* Post Actions */}
                                        <div className="p-2 flex justify-around">
                                             <button onClick={() => handleLike(post._id)} className={`flex items-center space-x-2 font-semibold w-full justify-center py-3 rounded-md transition-colors ${post.likes?.some(id => id === (user.id || user._id) || id._id === (user.id || user._id)) ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}>
                                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514"></path></svg>
                                                 <span className="hidden sm:block">Like</span>
                                             </button>
                                             <button onClick={() => setActiveCommentPostId(activeCommentPostId === post._id ? null : post._id)} className="flex items-center space-x-2 text-gray-500 font-semibold hover:bg-gray-100 w-full justify-center py-3 rounded-md transition-colors">
                                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                                 <span className="hidden sm:block">Comment</span>
                                             </button>
                                             <button className="flex items-center space-x-2 text-gray-500 font-semibold hover:bg-gray-100 w-full justify-center py-3 rounded-md transition-colors">
                                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                                 <span className="hidden sm:block">Share</span>
                                             </button>
                                        </div>

                                        {/* Comments Area visible if Active */}
                                        {activeCommentPostId === post._id && (
                                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                                {/* Add Comment Input */}
                                                <div className="flex space-x-3 mb-4">
                                                    <div className="w-10 h-10 bg-blue-100 text-blue-700 flex flex-shrink-0 items-center justify-center font-bold text-lg rounded-full uppercase">
                                                        {user.name?.charAt(0) || 'U'}
                                                    </div>
                                                    <div className="flex-1 flex flex-col space-y-2">
                                                        <textarea 
                                                            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none bg-white"
                                                            placeholder="Add a comment..."
                                                            rows="2"
                                                            value={commentText}
                                                            onChange={(e) => setCommentText(e.target.value)}
                                                        ></textarea>
                                                        <div className="flex justify-end">
                                                            <button 
                                                                onClick={() => handleAddComment(post._id)}
                                                                disabled={!commentText.trim()}
                                                                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${!commentText.trim() ? "bg-gray-300 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                                                            >
                                                                Post
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Display Existing Comments */}
                                                {post.comments && post.comments.length > 0 && (
                                                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                                                        {post.comments.map((comment, i) => (
                                                            <div key={i} className="flex space-x-2">
                                                                <div className="w-8 h-8 bg-blue-100 text-blue-700 flex flex-shrink-0 items-center justify-center font-bold text-sm rounded-full uppercase mt-1">
                                                                    {comment.user?.name?.charAt(0) || 'U'}
                                                                </div>
                                                                <div className="flex-1 bg-white p-3 rounded-lg rounded-tl-none border border-gray-200">
                                                                    <div className="flex justify-between items-start">
                                                                        <div>
                                                                            <h4 className="text-sm font-bold text-gray-900 hover:underline cursor-pointer">{comment.user?.name || 'User'}</h4>
                                                                            <p className="text-xs text-gray-500 line-clamp-1">{comment.user?.profile?.headline || 'Member'}</p>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
                                                                            <span className="text-[10px] text-gray-400">{getRelativeTime(comment.createdAt || comment.date || new Date())}</span>
                                                                            {(comment.user?._id === (user.id || user._id) || post.author?._id === (user.id || user._id)) && (
                                                                                <button onClick={() => handleDeleteComment(post._id, comment._id)} className="text-gray-400 hover:text-red-500 transition" title="Delete comment">
                                                                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path></svg>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{comment.text}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Interleaved Promoted Job */}
                                    {promotedJob && (() => {
                                        const hasAppliedJob = promotedJob.applicants?.some(a => a.user === (user.id || user._id) || a.user?._id === (user.id || user._id));
                                        return (
                                        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-gray-500 font-bold">Suggested Job</span>
                                                <button className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg></button>
                                            </div>
                                            <div className="flex space-x-3 mb-3">
                                                 <div className="w-12 h-12 bg-gray-100 flex items-center justify-center font-bold text-xl rounded-md uppercase text-gray-600">
                                                    {promotedJob.company.charAt(0)}
                                                </div>
                                                <div>
                                                    <h2 className="text-base font-bold text-gray-900 leading-tight hover:underline cursor-pointer hover:text-blue-600">{promotedJob.title}</h2>
                                                    <p className="text-sm text-gray-800">{promotedJob.company}</p>
                                                    <p className="text-xs text-gray-500">{promotedJob.location} • {promotedJob.type}</p>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                                                <p>{promotedJob.description}</p>
                                            </div>
                                            {hasAppliedJob ? (
                                                <span className="mt-3 inline-block text-center bg-gray-200 text-gray-600 font-bold px-4 py-1.5 rounded-full w-full">
                                                    Applied ✓
                                                </span>
                                            ) : (
                                                <button onClick={() => handleApply(promotedJob._id)} className="mt-3 text-blue-600 font-bold px-4 py-1.5 rounded-full border border-blue-600 hover:bg-blue-50 transition w-full">
                                                    Apply Now
                                                </button>
                                            )}
                                        </div>
                                        );
                                    })()}
                                </div>
                            );
                        })}

                        {/* Loading Indicator */}
                        {loading && (
                            <div className="text-center py-4 bg-white rounded-lg shadow border border-gray-200">
                                <p className="text-gray-500 font-semibold">Loading more posts...</p>
                            </div>
                        )}
                        
                    </div>

                    {/* RIGHT COLUMN - Widgets / News */}
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sticky top-20">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="font-bold text-gray-900 text-sm">Netsynq News</h3>
                            </div>
                            <ul className="space-y-4 text-sm mt-3">
                                {(showAllNews ? newsItems : newsItems.slice(0, 3)).map((item) => (
                                    <li key={item.title} className="cursor-pointer group flex flex-col items-start px-2">
                                        <div className="font-semibold text-gray-800 group-hover:text-blue-600 group-hover:underline">{item.title}</div>
                                        <div className="text-xs text-gray-500 mt-1">{item.meta}</div>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-4 border-t border-gray-200 pt-3">
                                <button
                                    onClick={() => setShowAllNews((prev) => !prev)}
                                    className="text-sm text-gray-500 font-semibold hover:bg-gray-100 flex items-center rounded px-2 py-1 w-max transition"
                                >
                                    {showAllNews ? 'Show less' : 'Show more'}
                                </button>
                            </div>
                        </div>

                        {/* Footer links */}
                        <div className="text-center mt-5 text-xs text-gray-500 px-4">
                            <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-2 font-medium">
                                <li><a href="#" className="hover:text-blue-600 hover:underline">About</a></li>
                                <li><a href="#" className="hover:text-blue-600 hover:underline">Accessibility</a></li>
                                <li><a href="#" className="hover:text-blue-600 hover:underline">Help Center</a></li>
                                <li><a href="#" className="hover:text-blue-600 hover:underline">Privacy & Terms</a></li>
                                <li><a href="#" className="hover:text-blue-600 hover:underline">Ad Choices</a></li>
                            </ul>
                            <p>Netsynq Corporation © 2026</p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default Dashboard;