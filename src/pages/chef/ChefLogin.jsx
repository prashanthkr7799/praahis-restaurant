import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChefHat, Lock } from 'lucide-react';
import { saveChefAuth } from '@/shared/utils/helpers/localStorage';
import toast from 'react-hot-toast';

const ChefLogin = () => {
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Simple hardcoded credentials for demo/testing
  // In production, use proper authentication with Supabase Auth
  const CHEF_CREDENTIALS = {
    username: 'chef',
    password: 'chef123'
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      if (
        credentials.username === CHEF_CREDENTIALS.username &&
        credentials.password === CHEF_CREDENTIALS.password
      ) {
        // Save auth data with proper structure
        saveChefAuth({
          username: credentials.username,
          isAuthenticated: true,
          loginTime: new Date().toISOString()
        });
        toast.success('✅ Login successful! Redirecting...');
        
        // Navigate after a short delay to show the toast
        setTimeout(() => {
          navigate('/chef');
        }, 800);
      } else {
        toast.error('Invalid username or password');
        setIsLoading(false);
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <ChefHat className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Chef Dashboard</h1>
          <p className="text-gray-600">Sign in to manage orders</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Enter password"
              required
            />
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link 
              to="/forgot-password" 
              className="text-sm text-orange-400 hover:text-orange-300 underline decoration-dotted transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Test Credentials Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-semibold text-blue-900 mb-2">Test Credentials:</p>
          <p className="text-sm text-blue-700">Username: <code className="bg-blue-100 px-2 py-1 rounded">chef</code></p>
          <p className="text-sm text-blue-700">Password: <code className="bg-blue-100 px-2 py-1 rounded">chef123</code></p>
        </div>
      </div>
    </div>
  );
};

export default ChefLogin;
