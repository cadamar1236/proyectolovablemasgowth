import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ user, onMenuClick, onChatClick }) => {
  const { logout } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 bg-gradient-to-b from-black to-gray-900 backdrop-blur-md border-b border-gray-700 shadow-xl">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-bold text-white tracking-tight">
              ASTAR<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">*</span>
            </span>
            <span className="text-gray-300 text-[0.65rem] md:text-xs mt-0.5 hidden sm:block">
              Connecting the brightest minds in the world
            </span>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center space-x-1 md:space-x-3 lg:space-x-6 overflow-x-auto scrollbar-hide">
            <Link to="/" className="nav-link text-gray-300 hover:text-white flex items-center space-x-1 md:space-x-2 transition-all whitespace-nowrap">
              <span className="text-base md:text-lg">🏠</span>
              <span className="text-xs md:text-sm font-medium">Home</span>
            </Link>
            
            <Link to="/dashboard" className="nav-link bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white flex items-center space-x-1 md:space-x-2 border border-purple-500/30 whitespace-nowrap">
              <span className="text-base md:text-lg">🎯</span>
              <span className="text-xs md:text-sm font-medium">Hub</span>
            </Link>
            
            <Link to="/competitions" className="nav-link text-gray-300 hover:text-white flex items-center space-x-1 md:space-x-2 transition-all whitespace-nowrap">
              <span className="text-base md:text-lg">🏅</span>
              <span className="hidden sm:inline text-xs md:text-sm font-medium">Comp</span>
            </Link>
            
            <Link to="/events" className="nav-link text-gray-300 hover:text-white flex items-center space-x-1 md:space-x-2 transition-all whitespace-nowrap">
              <span className="text-base md:text-lg">📅</span>
              <span className="hidden sm:inline text-xs md:text-sm font-medium">Events</span>
            </Link>
            
            <Link to="/leaderboard" className="nav-link text-gray-300 hover:text-white flex items-center space-x-1 md:space-x-2 transition-all whitespace-nowrap">
              <span className="text-base md:text-lg">🏆</span>
              <span className="hidden lg:inline text-xs md:text-sm font-medium">Board</span>
            </Link>
            
            {user?.role === 'founder' && (
              <Link to="/team" className="nav-link text-gray-300 hover:text-white flex items-center space-x-1 md:space-x-2 transition-all whitespace-nowrap">
                <span className="text-base md:text-lg">👥</span>
                <span className="hidden lg:inline text-xs md:text-sm font-medium">Team</span>
              </Link>
            )}
            
            <Link to="/dashboard?tab=directory" className="nav-link text-gray-300 hover:text-white flex items-center space-x-1 md:space-x-2 transition-all whitespace-nowrap">
              <span className="text-base md:text-lg">🔥</span>
              <span className="hidden lg:inline text-xs md:text-sm font-medium">Trend</span>
            </Link>
            
            <button 
              onClick={logout}
              className="bg-white hover:bg-gray-100 text-gray-900 px-3 md:px-5 py-1.5 md:py-2 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl text-xs md:text-sm whitespace-nowrap"
            >
              <span className="hidden sm:inline">Sign Out</span>
              <span className="sm:hidden">Exit</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
