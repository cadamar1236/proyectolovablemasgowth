import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const LandingPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [selectedRole, setSelectedRole] = useState('founder');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ connected: false, checking: true });

  // Check backend connection on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://proyectolovablemasgowth-production-813a.up.railway.app';
        console.log('🔍 Checking backend connection:', API_URL);
        const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
        console.log('✅ Backend connected:', response.data);
        setBackendStatus({ connected: true, checking: false, url: API_URL });
      } catch (error) {
        console.error('❌ Backend connection failed:', error.message);
        setBackendStatus({ connected: false, checking: false, error: error.message });
      }
    };
    checkBackend();
  }, []);

  const selectRole = (role) => {
    setSelectedRole(role);
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'register') {
        await register(formData.email, formData.password, formData.name, selectedRole);
      } else {
        await login(formData.email, formData.password);
      }
      localStorage.removeItem('guestMode'); // Remove guest mode
      navigate('/dashboard');
    } catch (error) {
      alert(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestMode = () => {
    localStorage.setItem('guestMode', 'true');
    localStorage.setItem('selectedRole', selectedRole);
    navigate('/dashboard');
  };

  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'https://proyectolovablemasgowth-production-813a.up.railway.app';
    window.location.href = `${backendUrl}/auth/google`;
  };

  return (
    <div className="cosmic-bg min-h-screen text-white" style={{
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Stars Background */}
      <div className="stars" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        backgroundImage: `
          radial-gradient(2px 2px at 20px 30px, white, rgba(0,0,0,0)),
          radial-gradient(2px 2px at 60px 70px, white, rgba(0,0,0,0)),
          radial-gradient(1px 1px at 50px 50px, white, rgba(0,0,0,0)),
          radial-gradient(1px 1px at 130px 80px, white, rgba(0,0,0,0)),
          radial-gradient(2px 2px at 90px 10px, white, rgba(0,0,0,0))
        `,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 200px',
        animation: 'stars 60s linear infinite'
      }}></div>

      <style>{`
        @keyframes stars {
          from { transform: translateY(0); }
          to { transform: translateY(-200px); }
        }
        
        .planet {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.5s ease;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transform-style: preserve-3d;
        }
        
        .planet:hover {
          transform: scale(1.1) translateY(-10px);
        }
        
        .planet-founder {
          background: linear-gradient(135deg, #78909C 0%, #90A4AE 50%, #B0BEC5 100%);
          box-shadow: 0 0 60px rgba(120, 144, 156, 0.4), inset 0 0 40px rgba(255,255,255,0.1);
        }
        
        .planet-investor {
          background: linear-gradient(135deg, #26C6DA 0%, #00ACC1 50%, #0097A7 100%);
          box-shadow: 0 0 60px rgba(0, 172, 193, 0.5), inset 0 0 40px rgba(255,255,255,0.1);
        }
        
        .planet-scout {
          background: linear-gradient(135deg, #AB47BC 0%, #8E24AA 50%, #7B1FA2 100%);
          box-shadow: 0 0 60px rgba(142, 36, 170, 0.5), inset 0 0 40px rgba(255,255,255,0.1);
        }
        
        .planet-partner {
          background: linear-gradient(135deg, #EF5350 0%, #E53935 50%, #D32F2F 100%);
          box-shadow: 0 0 60px rgba(239, 83, 80, 0.5), inset 0 0 40px rgba(255,255,255,0.1);
        }
        
        .planet-jobseeker {
          background: linear-gradient(135deg, #FFCA28 0%, #FFB300 50%, #FFA000 100%);
          box-shadow: 0 0 60px rgba(255, 179, 0, 0.5), inset 0 0 40px rgba(255,255,255,0.1);
        }
        
        .planet-other {
          background: linear-gradient(135deg, #42A5F5 0%, #1E88E5 50%, #1565C0 100%);
          box-shadow: 0 0 60px rgba(66, 165, 245, 0.5), inset 0 0 40px rgba(255,255,255,0.1);
        }
        
        .orbit-ring {
          position: absolute;
          border: 1px solid rgba(255, 184, 0, 0.3);
          border-radius: 50%;
          animation: rotate 20s linear infinite;
        }
        
        .planet-jobseeker .orbit-ring {
          width: 280px;
          height: 160px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotateX(75deg);
        }
        
        @keyframes rotate {
          from { transform: translate(-50%, -50%) rotateX(75deg) rotateZ(0deg); }
          to { transform: translate(-50%, -50%) rotateX(75deg) rotateZ(360deg); }
        }
        
        .planet-badge {
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(10px);
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
          border: 1px solid rgba(255,255,255,0.2);
        }
        
        .nav-link {
          transition: all 0.3s ease;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
        }
        
        .nav-link:hover {
          background: rgba(255,255,255,0.1);
        }
      `}</style>

      {/* Backend Status Indicator */}
      <div className="fixed top-2 right-2 z-50">
        {backendStatus.checking ? (
          <div className="bg-yellow-500 bg-opacity-90 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            Connecting to backend...
          </div>
        ) : backendStatus.connected ? (
          <div className="bg-green-500 bg-opacity-90 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            Backend connected
          </div>
        ) : (
          <div className="bg-red-500 bg-opacity-90 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            Backend offline
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black bg-opacity-50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-2xl font-bold">ASTAR*</span>
              <span className="text-gray-400 text-xs hidden sm:inline">Connecting the brightest minds in the world</span>
            </div>
            
            <div className="flex items-center space-x-6">
              <a href="#roles" className="nav-link text-white flex items-center space-x-2">
                <span>🏠</span>
                <span className="hidden sm:inline">Home</span>
              </a>
              <button onClick={() => navigate('/dashboard')} className="nav-link text-white flex items-center space-x-2">
                <span>🎯</span>
                <span className="hidden sm:inline">Hub</span>
              </button>
              <button onClick={() => navigate('/competitions')} className="nav-link text-white flex items-center space-x-2">
                <span>🏅</span>
                <span className="hidden sm:inline">Competitions</span>
              </button>
              <button onClick={() => navigate('/leaderboard')} className="nav-link text-white flex items-center space-x-2">
                <span>🏆</span>
                <span className="hidden sm:inline">Leaderboard</span>
              </button>
              <button onClick={() => { setAuthMode('login'); setShowAuthModal(true); }} className="bg-white text-black px-6 py-2 rounded-full font-semibold hover:bg-gray-200 transition">
                Sign In
              </button>
              <button onClick={() => { setAuthMode('register'); setShowAuthModal(true); }} className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition">
                Launch Now
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section with Planets */}
      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-32 pb-20">
        <div className="max-w-6xl w-full text-center" id="roles">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            Welcome to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">ASTAR*</span> ecosystem
          </h1>
          
          <p className="text-lg md:text-xl text-gray-300 mb-16 max-w-4xl mx-auto leading-relaxed">
            ASTAR* is an AI superconnector helping early-stage founders get traction. We operate weekly progress-based competitions and monthly live pitch events, enabling discovery, credibility, and momentum for founders worldwide.
          </p>

          <p className="text-2xl md:text-3xl font-semibold text-gray-200 mb-4">
            Choose your trajectory 🚀
          </p>
          
          <p className="text-lg md:text-xl text-gray-400 mb-16 max-w-4xl mx-auto leading-relaxed">
            <span className="text-gray-300 font-medium">Which role defines your mission in the ASTAR* ecosystem?</span>
          </p>

          {/* Planets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto mb-12">
            <div className="flex flex-col items-center" onClick={() => selectRole('founder')}>
              <div className="planet planet-founder">
                <span className="planet-badge">FOUNDER</span>
              </div>
              <h3 className="text-2xl font-bold mt-6 mb-3">FOUNDER</h3>
              <p className="text-gray-300 text-center px-4">Building the next big thing</p>
            </div>

            <div className="flex flex-col items-center" onClick={() => selectRole('investor')}>
              <div className="planet planet-investor">
                <span className="planet-badge">INVESTOR</span>
              </div>
              <h3 className="text-2xl font-bold mt-6 mb-3">INVESTOR</h3>
              <p className="text-gray-300 text-center px-4">Fueling stellar growth</p>
            </div>

            <div className="flex flex-col items-center" onClick={() => selectRole('scout')}>
              <div className="planet planet-scout">
                <span className="planet-badge">SCOUT</span>
              </div>
              <h3 className="text-2xl font-bold mt-6 mb-3">SCOUT</h3>
              <p className="text-gray-300 text-center px-4">Finding hidden gems</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="flex flex-col items-center" onClick={() => selectRole('partner')}>
              <div className="planet planet-partner">
                <span className="planet-badge">PARTNER</span>
              </div>
              <h3 className="text-2xl font-bold mt-6 mb-3">PARTNER</h3>
              <p className="text-gray-300 text-center px-4">Collaborate with ASTAR*</p>
            </div>

            <div className="flex flex-col items-center" onClick={() => selectRole('job_seeker')}>
              <div className="planet planet-jobseeker">
                <div className="orbit-ring"></div>
                <span className="planet-badge">JOB SEEKER</span>
              </div>
              <h3 className="text-2xl font-bold mt-6 mb-3">JOB SEEKER</h3>
              <p className="text-gray-300 text-center px-4">Join a promising startup</p>
            </div>

            <div className="flex flex-col items-center" onClick={() => selectRole('validator')}>
              <div className="planet planet-other">
                <span className="planet-badge">VALIDATOR</span>
              </div>
              <h3 className="text-2xl font-bold mt-6 mb-3">VALIDATOR</h3>
              <p className="text-gray-300 text-center px-4">Validate and vote on startups</p>
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-50 flex items-center justify-center px-4" onClick={() => setShowAuthModal(false)}>
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-white/10" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">{authMode === 'login' ? 'Sign In to ASTAR*' : 'Create Your Account'}</h2>
              <p className="text-gray-400 mb-6">Role: {selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1).replace('_', ' ')}</p>
              
              {/* Continue as Guest Button */}
              <button
                onClick={handleGuestMode}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center space-x-2 transition mb-4"
              >
                <span className="text-xl">👤</span>
                <span>Continue as Guest</span>
              </button>

              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-600"></div>
                <span className="px-4 text-gray-400 text-sm">or</span>
                <div className="flex-1 border-t border-gray-600"></div>
              </div>

              {/* Google OAuth Button */}
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-white hover:bg-gray-100 text-gray-800 py-3 rounded-xl font-semibold flex items-center justify-center space-x-3 transition mb-4"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-gray-600"></div>
                <span className="px-4 text-gray-400 text-sm">or use email</span>
                <div className="flex-1 border-t border-gray-600"></div>
              </div>
              
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
                {authMode === 'register' && (
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Loading...' : (authMode === 'login' ? 'Sign In' : 'Create Account')}
                </button>
              </form>
              
              <div className="mt-4">
                <p className="text-gray-400 text-sm">
                  {authMode === 'login' ? "Don't have an account?" : 'Already have an account?'}
                  <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="text-primary hover:underline ml-1">
                    {authMode === 'login' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
              
              <button onClick={() => setShowAuthModal(false)} className="mt-6 text-gray-400 hover:text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
