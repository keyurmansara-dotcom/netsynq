import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Network = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [networkData, setNetworkData] = useState({ requests: [], suggestions: [], connections: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/auth');
        } else {
            setUser(JSON.parse(storedUser));
            fetchNetworkData();
        }
    }, [navigate]);

    const fetchNetworkData = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('http://localhost:5000/api/network', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setNetworkData(data);
            }
        } catch (error) {
            console.error('Error fetching network data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/network/accept/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchNetworkData();
        } catch (error) {
            console.error('Error accepting request:', error);
        }
    };

    const handleDeclineRequest = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/network/decline/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchNetworkData();
        } catch (error) {
            console.error('Error declining request:', error);
        }
    };

    const handleSendRequest = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:5000/api/network/request/${id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchNetworkData();
        } catch (error) {
            console.error('Error sending request:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#F3F2EF] w-full flex-1 pb-10">
            <Navbar user={user} onLogout={handleLogout} />
            <main className="max-w-6xl mx-auto pt-6 px-4 sm:px-6 lg:px-8 mt-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Left Sidebar */}
                    <div className="hidden md:block col-span-1">
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-20">
                            <div className="p-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-800">Manage my network</h2>
                            </div>
                            <ul className="py-2">
                                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center text-gray-600 font-medium">
                                    <span>Connections</span>
                                    <span>{networkData.connections.length}</span>
                                </li>
                                <li className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center text-gray-600 font-medium">
                                    <span>Following & followers</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="col-span-1 md:col-span-3">
                        {/* Pending Invitations */}
                        {networkData.requests.length > 0 && (
                            <div className="bg-white rounded-lg border border-gray-200 mb-4 p-4">
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Invitations</h2>
                                <div className="space-y-4">
                                    {networkData.requests.map(request => (
                                        <div key={request._id} className="flex justify-between items-center border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-semibold object-cover">
                                                    {request.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{request.name}</h3>
                                                    <p className="text-sm text-gray-500">{request.profile?.headline || 'Member'}</p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button onClick={() => handleDeclineRequest(request._id)} className="px-4 py-1.5 rounded-full font-semibold text-gray-600 hover:bg-gray-100">
                                                    Ignore
                                                </button>
                                                <button onClick={() => handleAcceptRequest(request._id)} className="px-4 py-1.5 rounded-full font-semibold text-blue-600 border border-blue-600 hover:bg-blue-50 hover:border-blue-700">
                                                    Accept
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Suggested Users */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">People you may know</h2>
                            {loading ? (
                                <p className="text-center text-gray-500 py-4">Loading suggestions...</p>
                            ) : networkData.suggestions.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {networkData.suggestions.map(suggestion => (
                                        <div key={suggestion._id} className="border border-gray-200 rounded-lg flex flex-col pt-4">
                                            <div className="flex flex-col items-center px-4 flex-1">
                                                <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-2xl font-bold mb-2">
                                                    {suggestion.name.charAt(0)}
                                                </div>
                                                <h3 className="font-semibold text-gray-900 text-center">{suggestion.name}</h3>
                                                <p className="text-xs text-gray-500 text-center line-clamp-2 mt-1 mb-4 h-8">{suggestion.profile?.headline || 'Professional in industry'}</p>
                                            </div>
                                            <div className="p-3 border-t border-gray-100 flex justify-center mt-auto">
                                                <button onClick={() => handleSendRequest(suggestion._id)} className="w-full py-1.5 rounded-full font-semibold text-blue-600 border border-blue-600 hover:bg-blue-50">
                                                    Connect
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-4">No new people recommendations to show right now.</p>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Network;