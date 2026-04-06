import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Notifications = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (!storedToken || !storedUser) {
            navigate('/auth');
        } else {
            setUser(JSON.parse(storedUser));
        }
    }, [navigate]);

    useEffect(() => {
        if (!user) return;
        
        const token = localStorage.getItem('token');
        fetch('http://localhost:5000/api/notifications', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
            .then((res) => res.json())
            .then((data) => {
                setNotifications(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [user]);

    const getRelativeTime = (dateString) => {
        const timeValue = new Date(dateString).getTime();
        if (!timeValue) return '';
        const diff = Date.now() - timeValue;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const markAsRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleNotificationClick = (notif) => {
        setSelectedNotification(notif);
        setShowModal(true);
        if (!notif.read) {
            markAsRead(notif._id);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/notifications/read-all', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (res.ok) {
                setNotifications(notifications.map(n => ({ ...n, read: true })));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth');
    };

    if (!user) return <div className="text-center mt-20">Loading...</div>;

    const filteredNotifications = activeTab === 'All' 
        ? notifications 
        : activeTab === 'Jobs' 
            ? notifications.filter(n => n.type.includes('job'))
            : notifications.filter(n => !n.type.includes('job'));

    return (
        <div className="min-h-screen bg-[#F3F2EF] w-full flex-1 pb-10">
            <Navbar user={user} onLogout={handleLogout} />
            <main className="max-w-7xl mx-auto pt-6 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-12 gap-6 relative">
                    {/* LEFT COLUMN - Settings */}
                    <div className="hidden md:block md:col-span-1 lg:col-span-3">
                        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sticky top-20">
                            <h2 className="font-bold text-gray-900 text-sm mb-2">Manage your Notifications</h2>
                            <button 
                                onClick={() => navigate('/settings')}
                                className="text-blue-600 font-semibold cursor-pointer text-sm hover:underline hover:text-blue-700 transition bg-transparent border-0 p-0"
                            >
                                View settings
                            </button>
                        </div>
                    </div>

                    {/* CENTER COLUMN - Notifications List */}
                    <div className="col-span-1 md:col-span-3 lg:col-span-6 space-y-4">
                        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden min-h-[400px]">
                            {/* Header and Read All action */}
                            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50/50">
                                <h2 className="font-semibold text-gray-800">Notifications</h2>
                                {notifications.some(n => !n.read) && (
                                    <button 
                                        onClick={markAllAsRead} 
                                        className="text-sm text-blue-600 font-semibold hover:underline bg-white px-3 py-1 rounded-full border border-blue-600 transition hover:bg-blue-50"
                                    >
                                        Read all
                                    </button>
                                )}
                            </div>

                            {/* Tabs for Notification Sections */}
                            <div className="flex border-b border-gray-200">
                                <button 
                                    onClick={() => setActiveTab('All')}
                                    className={`flex-1 py-3 bg-white text-sm font-bold border-b-2 transition ${activeTab === 'All' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:bg-gray-50'}`}
                                >
                                    All
                                </button>
                                <button 
                                    onClick={() => setActiveTab('Jobs')}
                                    className={`flex-1 py-3 bg-white text-sm font-bold border-b-2 transition ${activeTab === 'Jobs' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:bg-gray-50'}`}
                                >
                                    Jobs
                                </button>
                                <button 
                                    onClick={() => setActiveTab('Other')}
                                    className={`flex-1 py-3 bg-white text-sm font-bold border-b-2 transition ${activeTab === 'Other' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:bg-gray-50'}`}
                                >
                                    Other
                                </button>
                            </div>

                            {loading ? (
                                <div className="p-6 text-center text-gray-500 font-semibold">Loading notifications...</div>
                            ) : filteredNotifications.length === 0 ? (
                                <div className="p-8 text-center bg-white h-full flex flex-col items-center justify-center mt-20">
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">No new notifications</h2>
                                    <p className="text-gray-500">You're all caught up! Check back later for new updates.</p>
                                </div>
                            ) : (
                                <div>
                                    {filteredNotifications.map((notif) => (
                                        <div 
                                            key={notif._id} 
                                            className={`p-4 border-b border-gray-200 flex items-start space-x-3 transition hover:bg-gray-50 cursor-pointer ${notif.read ? 'bg-white' : 'bg-blue-50/50'}`}
                                            onClick={() => handleNotificationClick(notif)}
                                        >
                                            <div className="w-12 h-12 bg-blue-100 text-blue-700 flex flex-shrink-0 items-center justify-center font-bold text-xl rounded-full uppercase">
                                                {notif.type === 'job_status_update' && notif.message === 'Hired' ? '🎉' : (notif.sender?.name?.charAt(0) || 'U')}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-800">
                                                    <span className="font-bold text-gray-900 hover:text-blue-600 hover:underline">{notif.sender?.name}</span> 
                                                    {notif.type === 'like' ? ' liked your post.' 
                                                        : notif.type === 'comment' ? ' commented on your post.'
                                                        : notif.type === 'job_application' ? ' applied for your job.'
                                                        : notif.type === 'job_alert' ? ' posted a new job.'
                                                        : notif.type === 'job_status_update' ? ` updated your application status to ${notif.message}.`
                                                        : ' interacted with you.'}
                                                </p>
                                                {notif.post?.content && (
                                                    <p className="text-sm text-gray-500 line-clamp-1 mt-1 italic break-words whitespace-pre-wrap">"{notif.post.content}"</p>
                                                )}
                                                {notif.job?.title && (
                                                    <p className="text-sm text-gray-500 line-clamp-1 mt-1 italic break-words whitespace-pre-wrap">{notif.job.title} at {notif.job.company}</p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-2">{getRelativeTime(notif.createdAt)}</p>
                                            </div>
                                            {!notif.read && (
                                                <div className="w-3 h-3 bg-blue-600 rounded-full mt-2.5"></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Widgets */}
                    <div className="hidden lg:block lg:col-span-3">
                        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 sticky top-20">
                            <h3 className="font-bold text-gray-900 text-sm mb-3">Trending Jobs</h3>
                            <p className="text-xs text-gray-500 mt-1">Stand out from the crowd with new job recommendations!</p>
                            <button onClick={() => navigate('/jobs')} className="mt-4 w-full border border-blue-600 text-blue-600 font-semibold rounded-full py-1.5 hover:bg-blue-50 transition text-sm">
                                View Jobs
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notification Details Modal */}
                {showModal && selectedNotification && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        {/* Special Celebration Card for Hired Status */}
                        {selectedNotification.type === 'job_status_update' && selectedNotification.message === 'Hired' ? (
                            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                                {/* Celebration Header */}
                                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 text-center relative overflow-hidden">
                                    {/* Confetti decoration */}
                                    <div className="absolute top-0 left-4 text-2xl animate-bounce">🎉</div>
                                    <div className="absolute top-2 right-6 text-2xl animate-bounce" style={{animationDelay: '0.2s'}}>🎊</div>
                                    <div className="absolute top-6 left-1/3 text-xl animate-bounce" style={{animationDelay: '0.4s'}}>🎈</div>
                                    
                                    <h1 className="text-4xl font-bold text-gray-900 mb-4 relative z-10">Congratulations!</h1>
                                    <p className="text-lg text-gray-700 mb-2 relative z-10">You have been <span className="text-3xl font-bold text-green-500">HIRED</span> for</p>
                                </div>

                                {/* Job Details */}
                                <div className="p-6 bg-gradient-to-b from-blue-50 to-white">
                                    <div className="bg-white rounded-lg p-4 mb-6 border-2 border-gray-200">
                                        <p className="text-center">
                                            <span className="block text-2xl font-bold text-gray-900 mb-1">{selectedNotification.job?.title}</span>
                                            <span className="block text-lg text-gray-600">{selectedNotification.job?.company}</span>
                                        </p>
                                    </div>

                                    <button 
                                        onClick={() => setShowModal(false)}
                                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 rounded-full transition transform hover:scale-105 text-lg"
                                    >
                                        🎉 Celebrate! 🎉
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Regular Notification Details Modal */
                            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                                {/* Modal Header */}
                                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                                    <h2 className="text-lg font-bold text-gray-900">Notification Details</h2>
                                    <button 
                                        onClick={() => setShowModal(false)}
                                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold transition"
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* Modal Content */}
                                <div className="p-6 space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-700 flex flex-shrink-0 items-center justify-center font-bold text-xl rounded-full uppercase">
                                            {selectedNotification.sender?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900">{selectedNotification.sender?.name}</p>
                                            <p className="text-sm text-gray-500">{getRelativeTime(selectedNotification.createdAt)}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-sm text-gray-800">
                                            {selectedNotification.type === 'like' ? 'Liked your post' 
                                                : selectedNotification.type === 'comment' ? 'Commented on your post'
                                                : selectedNotification.type === 'job_application' ? 'Applied for your job'
                                                : selectedNotification.type === 'job_alert' ? 'Posted a new job'
                                                : selectedNotification.type === 'job_status_update' ? `Updated your application status to ${selectedNotification.message}`
                                                : 'Interacted with you'}
                                        </p>
                                    </div>

                                    {selectedNotification.post?.content && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Post</h3>
                                            <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg break-words whitespace-pre-wrap">"{selectedNotification.post.content}"</p>
                                        </div>
                                    )}

                                    {selectedNotification.job?.title && (
                                        <div>
                                            <h3 className="text-xs font-semibold text-gray-700 uppercase mb-2">Job</h3>
                                            <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">
                                                <span className="font-semibold">{selectedNotification.job.title}</span> at <span className="font-semibold">{selectedNotification.job.company}</span>
                                            </p>
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-500">
                                        Status: <span className="font-semibold">{selectedNotification.read ? 'Read' : 'Unread'}</span>
                                    </p>
                                </div>

                                {/* Modal Footer */}
                                <div className="bg-gray-50 p-4 rounded-b-lg flex gap-3">
                                    <button 
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 rounded-full transition"
                                    >
                                        Close
                                    </button>
                                    <button 
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-full transition"
                                    >
                                        Done
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Notifications;