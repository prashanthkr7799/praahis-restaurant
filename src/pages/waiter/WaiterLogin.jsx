import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@shared/utils/api/supabaseClient';
import toast from 'react-hot-toast';
import { User, Lock, LogIn } from 'lucide-react';

/**
 * Waiter Login Page
 * Simplified login for waiter staff
 */
const WaiterLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);

    try {
      // Sign in with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Check if user profile exists
      let { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw profileError;
      }

      // If profile doesn't exist, create it automatically
      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: authData.user.user_metadata?.full_name || email.split('@')[0],
            role: 'waiter',
            is_active: true,
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          console.error('Error details:', JSON.stringify(createError, null, 2));
          await supabase.auth.signOut();
          toast.error(`Could not create user profile: ${createError.message}`);
          return;
        }

        profile = newProfile;
        toast.success('Welcome! Your profile has been created.');
      }

      if (profile.role !== 'waiter') {
        await supabase.auth.signOut();
        toast.error('This login is for waiters only');
        return;
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        toast.error('Your account is inactive. Contact admin.');
        return;
      }

      toast.success(`Welcome back, ${profile.full_name}!`);
      navigate('/waiter/simple');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Waiter Login</h1>
          <p className="text-gray-600">Sign in to access your dashboard</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="waiter@restaurant.com"
                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-3 py-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link 
              to="/forgot-password" 
              className="text-sm text-blue-400 hover:text-blue-300 underline decoration-dotted transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Need help? Contact your manager</p>
        </div>

        {/* Quick Test Login (Development Only) */}
        {import.meta.env.MODE === 'development' && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 font-semibold mb-2">
              🔧 Development Mode - Test Credentials:
            </p>
            <p className="text-xs text-yellow-700">
              Email: waiter@restaurant.com<br />
              Password: (Set in Supabase Auth)
            </p>
          </div>
        )}

        {/* Other Logins */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400 mb-3">Different role?</p>
          <div className="flex gap-2 justify-center">
            <a
              href="/manager/login"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Admin/Manager
            </a>
            <span className="text-gray-400">•</span>
            <a
              href="/chef/login"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Chef
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaiterLogin;
