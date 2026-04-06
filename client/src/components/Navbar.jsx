import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setSearchTerm(params.get('q') || '');
  }, [location.search]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('http://localhost:5000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const unread = data.filter(n => !n.read).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchNotifications();
    // Optional: poll every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14">
        <div className="flex justify-between h-full">
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600 tracking-tight">n</span>
            </div>
            {/* Search Bar */}
            <div className="hidden sm:ml-4 sm:flex sm:items-center">
              <form 
                className="relative w-64"
                onSubmit={(e) => {
                  e.preventDefault();
                  const query = searchTerm.trim();
                  navigate(query ? `/jobs?q=${encodeURIComponent(query)}` : '/jobs');
                }}
              >
                <input
                  type="text"
                  placeholder="Search jobs"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#EDF3F8] text-sm rounded-md pl-10 pr-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
                <svg className="w-4 h-4 text-gray-500 absolute left-3 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </form>
            </div>
          </div>

          <div className="flex items-center sm:space-x-2 space-x-1 h-full">
            
            <NavLink 
               to="/dashboard"
               className={({ isActive }) => `flex flex-col items-center justify-center cursor-pointer min-w-[64px] h-full sm:px-2 px-1 ${isActive ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23 9v2h-2v7a3 3 0 01-3 3h-4v-6h-4v6H6a3 3 0 01-3-3v-7H1V9l11-7 11 7z"></path></svg>
               <span className="text-xs hidden sm:block mt-1 font-normal">Home</span>
            </NavLink>
            
            <NavLink 
               to="/network"
               className={({ isActive }) => `flex flex-col items-center justify-center cursor-pointer min-w-[64px] h-full sm:px-2 px-1 ${isActive ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 16v6H3v-6a3 3 0 013-3h3a3 3 0 013 3zm5.5-3A3.5 3.5 0 1014 9.5a3.5 3.5 0 003.5 3.5zm1 2h-2a2.5 2.5 0 00-2.5 2.5V22h7v-4.5a2.5 2.5 0 00-2.5-2.5zM7.5 2A4.5 4.5 0 1012 6.5 4.49 4.49 0 007.5 2z"></path></svg>
               <span className="text-xs hidden sm:block mt-1 font-normal">My Network</span>
            </NavLink>

            <NavLink 
               to="/jobs"
               className={({ isActive }) => `flex flex-col items-center justify-center cursor-pointer min-w-[64px] h-full sm:px-2 px-1 ${isActive ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17 6V5a3 3 0 00-3-3h-4a3 3 0 00-3 3v1H2v4a3 3 0 003 3h14a3 3 0 003-3V6zM9 5a1 1 0 011-1h4a1 1 0 011 1v1H9zm10 9a4 4 0 003-1.38V17a3 3 0 01-3 3H5a3 3 0 01-3-3v-4.38A4 4 0 005 15h2v2h10v-2z"></path></svg>
               <span className="text-xs hidden sm:block mt-1 font-normal">Jobs</span>
            </NavLink>

            <NavLink 
               to="/messaging"
               className={({ isActive }) => `flex flex-col items-center justify-center cursor-pointer min-w-[64px] h-full sm:px-2 px-1 ${isActive ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16 4H8C5.79 4 4 5.79 4 8v6c0 2.21 1.79 4 4 4h1.5l2.67 2.67c.45.45 1.21.45 1.66 0L16.5 18H16c2.21 0 4-1.79 4-4V8c0-2.21-1.79-4-4-4zm-8.5 7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm4 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"></path></svg>
               <span className="text-xs hidden sm:block mt-1 font-normal">Messaging</span>
            </NavLink>

            <NavLink 
               to="/notifications"
               className={({ isActive }) => `flex flex-col items-center justify-center cursor-pointer min-w-[64px] h-full sm:px-2 px-1 relative ${isActive ? 'text-gray-900 border-b-2 border-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
            >
               <div className="relative">
                 <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22 19h-8.28a2 2 0 11-3.44 0H2v-1.5l2-2V9a8 8 0 0116 0v6.5l2 2z"></path></svg>
                 {unreadCount > 0 && (
                   <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                     {unreadCount > 99 ? '99+' : unreadCount}
                   </span>
                 )}
               </div>
               <span className="text-xs hidden sm:block mt-1 font-normal">Notifications</span>
            </NavLink>

            <div className="border-l border-gray-200 h-9 hidden sm:block ml-2 mr-3"></div>

            <div className="flex flex-col items-center justify-center cursor-pointer relative group min-w-[64px] h-full sm:px-2 px-1 text-gray-500 hover:text-gray-900">
              <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random&rounded=true&size=24`} alt="avatar" className="w-6 h-6 rounded-full" />
              <span className="text-xs flex items-center mt-1 font-normal">
                 Me <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
              </span>
              
              {/* Dropdown Menu */}
              <div className="hidden group-hover:block absolute top-[52px] right-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-2 z-50">
                <NavLink to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">View Profile</NavLink>
                <button onClick={onLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign Out</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;