import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import ChatSidebar from './ChatSidebar';

const MainLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false);

  // Close sidebars on route change
  useEffect(() => {
    setLeftSidebarOpen(false);
    setChatSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top Navbar */}
      <Navbar 
        user={user}
        onMenuClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
        onChatClick={() => setChatSidebarOpen(!chatSidebarOpen)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden pt-24">
        {/* Left Sidebar - Navigation */}
        <Sidebar 
          isOpen={leftSidebarOpen}
          onClose={() => setLeftSidebarOpen(false)}
          userRole={user?.role}
        />

        {/* Mobile Overlay */}
        {leftSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
            onClick={() => setLeftSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Right Sidebar - Chat */}
        <ChatSidebar 
          isOpen={chatSidebarOpen}
          onClose={() => setChatSidebarOpen(false)}
        />

        {/* Chat Overlay for mobile */}
        {chatSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setChatSidebarOpen(false)}
          />
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
        className="md:hidden fixed bottom-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-full shadow-2xl hover:shadow-purple-500/50 transition-all"
      >
        <i className="fas fa-bars text-white text-xl"></i>
      </button>

      {/* Chat Floating Button */}
      <button
        onClick={() => setChatSidebarOpen(!chatSidebarOpen)}
        className="md:hidden fixed bottom-20 right-4 z-45 bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all"
      >
        <i className="fas fa-comments text-white text-xl"></i>
      </button>
    </div>
  );
};

export default MainLayout;
