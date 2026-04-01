
const Navbar = ({ user, onLogout }) => {
  return (
    <nav className="bg-white sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-blue-600 tracking-tight">n</span>
            </div>
            {/* Search Bar */}
            <div className="hidden sm:ml-4 sm:flex sm:items-center">
              <div className="relative relative w-64">
                <input
                  type="text"
                  placeholder="Search"
                  className="bg-[#EDF3F8] text-sm rounded-md pl-10 pr-4 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                />
                <svg className="w-4 h-4 text-gray-500 absolute left-3 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex flex-col items-center text-gray-500 hover:text-gray-900 cursor-pointer border-b-2 border-gray-900">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path></svg>
               <span className="text-[10px] hidden sm:block mt-1">Home</span>
            </div>
            <div className="flex flex-col items-center text-gray-500 hover:text-gray-900 cursor-pointer">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
               <span className="text-[10px] hidden sm:block mt-1">Network</span>
            </div>
            <div className="flex flex-col items-center text-gray-500 hover:text-gray-900 cursor-pointer">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd"></path><path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z"></path></svg>
               <span className="text-[10px] hidden sm:block mt-1">Jobs</span>
            </div>
            
            <div className="pl-4 border-l border-gray-200 flex items-center space-x-4">
              <div className="flex flex-col items-center cursor-pointer relative group">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden group-hover:block absolute top-10 right-0 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-2">
                  <div className="block px-4 py-2 text-sm text-gray-700 font-bold border-b pb-3">{user?.name}</div>
                  <button onClick={onLogout} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign Out</button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;