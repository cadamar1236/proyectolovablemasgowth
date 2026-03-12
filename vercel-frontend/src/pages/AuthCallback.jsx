import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      console.log('✅ Received Google OAuth token');
      
      // Guardar token
      localStorage.setItem('token', token);
      localStorage.removeItem('guestMode');
      
      // Obtener datos del usuario
      api.get('/users/profile')
        .then(response => {
          console.log('✅ User profile loaded:', response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
          navigate('/dashboard');
        })
        .catch(error => {
          console.error('❌ Error loading profile:', error);
          navigate('/?auth=failed');
        });
    } else {
      console.error('❌ No token received from Google OAuth');
      navigate('/?auth=failed');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0f1729 100%)'
    }}>
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold mb-2">Signing you in...</h2>
        <p className="text-gray-400">Processing your Google authentication</p>
      </div>
    </div>
  );
};

export default AuthCallback;
