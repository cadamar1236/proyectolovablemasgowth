import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import clsx from 'clsx';

const Sidebar = ({ isOpen, onClose, userRole }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <aside 
      className={clsx(
        'left-sidebar fixed md:static w-64 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-2xl z-40 transition-transform duration-300 flex flex-col',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
    >
      {/* User Profile Section */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 to-purple-400 flex items-center justify-center text-white font-bold">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user?.name?.charAt(0)?.toUpperCase() || 'U'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
            <button className="text-xs text-gray-400 hover:text-purple-400 flex items-center mt-0.5">
              <span>Profile</span>
              <i className="fas fa-chevron-down ml-1 text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <Link 
          to="/dashboard" 
          onClick={onClose}
          className={clsx(
            'flex items-center px-4 py-3 rounded-lg mb-2 transition-all',
            isActive('/dashboard') 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          )}
        >
          <i className="fas fa-home mr-3 text-lg w-5"></i>
          <span className="font-semibold">Home (HQ)</span>
        </Link>

        <Link 
          to="/dashboard?tab=notifications" 
          onClick={onClose}
          className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg mb-2"
        >
          <i className="fas fa-bell mr-3 text-lg w-5"></i>
          <span className="font-semibold">Notifications</span>
          <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">3</span>
        </Link>

        {userRole === 'founder' && (
          <>
            <Link 
              to="/dashboard?tab=planner" 
              onClick={onClose}
              className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg mb-2"
            >
              <i className="fas fa-tasks mr-3 text-lg w-5"></i>
              <span className="font-semibold">Planner</span>
            </Link>

            <Link 
              to="/dashboard?tab=traction" 
              onClick={onClose}
              className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg mb-2"
            >
              <i className="fas fa-chart-line mr-3 text-lg w-5"></i>
              <span className="font-semibold">Traction</span>
            </Link>
          </>
        )}

        <Link 
          to="/dashboard?tab=inbox" 
          onClick={onClose}
          className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg mb-2"
        >
          <i className="fas fa-inbox mr-3 text-lg w-5"></i>
          <span className="font-semibold">Inbox</span>
        </Link>

        <Link 
          to="/dashboard?tab=aicmo" 
          onClick={onClose}
          className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg mb-2"
        >
          <i className="fas fa-magic mr-3 text-lg w-5"></i>
          <span className="font-semibold">AI CMO</span>
        </Link>

        <Link 
          to="/leaderboard" 
          onClick={onClose}
          className={clsx(
            'flex items-center px-4 py-3 rounded-lg mb-2',
            isActive('/leaderboard') 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          )}
        >
          <i className="fas fa-trophy mr-3 text-lg w-5"></i>
          <span className="font-semibold">Leaderboard</span>
        </Link>

        <Link 
          to="/competitions" 
          onClick={onClose}
          className={clsx(
            'flex items-center px-4 py-3 rounded-lg mb-2',
            isActive('/competitions') 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          )}
        >
          <i className="fas fa-medal mr-3 text-lg w-5"></i>
          <span className="font-semibold">Competitions</span>
        </Link>

        <Link 
          to="/events" 
          onClick={onClose}
          className={clsx(
            'flex items-center px-4 py-3 rounded-lg mb-2',
            isActive('/events') 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          )}
        >
          <i className="fas fa-calendar-alt mr-3 text-lg w-5"></i>
          <span className="font-semibold">Events</span>
        </Link>

        {userRole === 'founder' && (
          <Link 
            to="/team" 
            onClick={onClose}
            className={clsx(
              'flex items-center px-4 py-3 rounded-lg mb-2',
              isActive('/team') 
                ? 'bg-purple-600 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            )}
          >
            <i className="fas fa-users mr-3 text-lg w-5"></i>
            <span className="font-semibold">Team</span>
          </Link>
        )}

        {userRole === 'admin' && (
          <Link 
            to="/admin" 
            onClick={onClose}
            className="flex items-center px-4 py-3 text-yellow-400 hover:text-yellow-300 rounded-lg mb-2 border border-yellow-400"
          >
            <i className="fas fa-shield-alt mr-3 text-lg w-5"></i>
            <span className="font-semibold">Admin</span>
          </Link>
        )}

        <Link 
          to="/marketplace" 
          onClick={onClose}
          className={clsx(
            'flex items-center px-4 py-3 rounded-lg mb-2',
            isActive('/marketplace') 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-300 hover:text-white hover:bg-gray-700'
          )}
        >
          <i className="fas fa-store mr-3 text-lg w-5"></i>
          <span className="font-semibold">Directory</span>
        </Link>

        <Link 
          to="/marketplace?tab=trending" 
          onClick={onClose}
          className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg mb-2"
        >
          <i className="fas fa-fire mr-3 text-lg w-5"></i>
          <span className="font-semibold">Trending Products</span>
        </Link>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-700">
        <button 
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-3 text-gray-300 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          <span className="font-semibold">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
