import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Messaging = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) navigate('/auth');
        else setUser(JSON.parse(storedUser));
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/auth');
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#F3F2EF] w-full flex-1 pb-10">
            <Navbar user={user} onLogout={handleLogout} />
            <main className="max-w-7xl mx-auto pt-6 px-4 sm:px-6 lg:px-8 text-center mt-10">
                <h1 className="text-2xl font-bold">Messaging</h1>
                <p className="text-gray-500 mt-2">Connect and chat with recruiters and colleagues.</p>
            </main>
        </div>
    );
};

export default Messaging;