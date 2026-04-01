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
                            </div>
                            
                            <div className="border-t border-gray-200 py-3 px-4 text-left">
                                <div className="flex justify-between items-center text-sm font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer p-1">
                                    <span>Connections</span>
                                    <span className="text-blue-600">0</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-semibold text-gray-500 hover:bg-gray-50 cursor-pointer p-1">
                                    <span>Grow your network</span>
                                </div>
                            </div>
                            <div className="border-t border-gray-200 py-3 px-4 text-left text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer rounded-b-lg">
                                <span>My Items</span>
                            </div>
                        </div>
                    </div>

                    {/* CENTER COLUMN - Feed & Jobs */}
                    <div className="col-span-1 md:col-span-2 lg:col-span-6 space-y-4">
                        
                        {/* Create Post Box */}
                        <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                            <div className="flex space-x-3 items-center">
                                <div className="w-12 h-12 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-lg text-blue-600 font-bold border border-blue-200">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <button className="flex-1 rounded-full border border-gray-400 bg-white px-4 py-3 text-left text-gray-500 font-semibold hover:bg-gray-100 transition-colors">
                                    Start a post
                                </button>
                            </div>
                            <div className="flex justify-around mt-3 pt-2">
                                <button className="flex items-center space-x-2 text-gray-500 font-semibold hover:bg-gray-100 px-3 py-2 rounded-md">
                                    <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"></path></svg>
                                    <span className="hidden sm:block">Media</span>
                                </button>
                                <button className="flex items-center space-x-2 text-gray-500 font-semibold hover:bg-gray-100 px-3 py-2 rounded-md">
                                    <svg className="w-6 h-6 text-orange-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>
                                    <span className="hidden sm:block">Event</span>
                                </button>
                                <button className="flex items-center space-x-2 text-gray-500 font-semibold hover:bg-gray-100 px-3 py-2 rounded-md">
                                    <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd"></path><path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z"></path></svg>
                                    <span className="hidden sm:block">Write article</span>
                                </button>
                            </div>
                        </div>

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
                        {posts.length === 0 && jobs.map((promotedJob, index) => (
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
                                <button className="mt-3 text-blue-600 font-bold px-4 py-1.5 rounded-full border border-blue-600 hover:bg-blue-50 transition w-full">
                                    Apply Now
                                </button>
                            </div>
                        ))}

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
                                                        {new Date(post.createdAt).toLocaleDateString()} • <svg className="w-3 h-3 ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd"></path></svg>
                                                    </p>
                                                </div>
                                                <button className="ml-auto text-blue-600 font-bold hover:bg-blue-50 px-3 h-8 rounded-md flex items-center space-x-1">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                                    <span>Follow</span>
                                                </button>
                                            </div>
                                            <div className="mt-3 text-sm text-gray-800 break-words whitespace-pre-wrap">
                                                <p>{post.content}</p>
                                            </div>
                                        </div>
                                        {/* Post Actions */}
                                        <div className="p-2 flex justify-around">
                                             <button className="flex items-center space-x-2 text-gray-500 font-semibold hover:bg-gray-100 w-full justify-center py-3 rounded-md transition-colors">
                                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.514"></path></svg>
                                                 <span className="hidden sm:block">Like</span>
                                             </button>
                                             <button className="flex items-center space-x-2 text-gray-500 font-semibold hover:bg-gray-100 w-full justify-center py-3 rounded-md transition-colors">
                                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                                                 <span className="hidden sm:block">Comment</span>
                                             </button>
                                             <button className="flex items-center space-x-2 text-gray-500 font-semibold hover:bg-gray-100 w-full justify-center py-3 rounded-md transition-colors">
                                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                                 <span className="hidden sm:block">Share</span>
                                             </button>
                                        </div>
                                    </div>

                                    {/* Interleaved Promoted Job */}
                                    {promotedJob && (
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
                                            <button className="mt-3 text-blue-600 font-bold px-4 py-1.5 rounded-full border border-blue-600 hover:bg-blue-50 transition w-full">
                                                Apply Now
                                            </button>
                                        </div>
                                    )}
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
                                <li className="cursor-pointer group flex flex-col items-start px-2">
                                    <div className="font-semibold text-gray-800 group-hover:text-blue-600 group-hover:underline">The Future of Remote Work</div>
                                    <div className="text-xs text-gray-500 mt-1">Top news • 10,240 readers</div>
                                </li>
                                <li className="cursor-pointer group flex flex-col items-start px-2">
                                    <div className="font-semibold text-gray-800 group-hover:text-blue-600 group-hover:underline">How AI is shaping Web Dev</div>
                                    <div className="text-xs text-gray-500 mt-1">1d ago • 5,420 readers</div>
                                </li>
                                <li className="cursor-pointer group flex flex-col items-start px-2">
                                    <div className="font-semibold text-gray-800 group-hover:text-blue-600 group-hover:underline">Hiring Trends for React Devs</div>
                                    <div className="text-xs text-gray-500 mt-1">12h ago • 7,800 readers</div>
                                </li>
                            </ul>
                            <div className="mt-4 border-t border-gray-200 pt-3">
                                <button className="text-sm text-gray-500 font-semibold hover:bg-gray-100 flex items-center rounded px-2 py-1 w-max transition">
                                    Show more 
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