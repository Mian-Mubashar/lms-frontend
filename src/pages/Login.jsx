import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiBook, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const getRedirectPathByRole = (role) => {
    if (role === 'admin' || role === 'teacher') {
      return '/dashboard';
    }
    return '/courses';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = await login(email, password);
      navigate(getRedirectPathByRole(data?.user?.role), { replace: true });
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 px-4 py-8 safe-area-pb">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800 sm:p-8">
          <div className="mb-6 text-center sm:mb-8">
            <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 sm:mb-4 sm:h-16 sm:w-16">
              <FiBook className="h-7 w-7 text-primary-600 dark:text-primary-400 sm:h-8 sm:w-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl mb-2">
              AI-Powered LMS
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="input-field pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                </button>
              </div>
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="mb-2 break-words text-xs text-gray-500 dark:text-gray-400">
              Demo admin: <code className="break-all">admin@lms.com</code> /{' '}
              <code className="break-all">Password123!</code>
            </p>
            <p className="mb-2 break-words text-[11px] leading-snug text-gray-500 dark:text-gray-400">
              If login shows <span className="font-medium">Invalid credentials</span>, open a terminal in{' '}
              <code className="break-all">backend</code> and run{' '}
              <code className="break-all">npm run db:seed:demo-admin</code>. Wrong password? Run{' '}
              <code className="break-all">npm run db:seed:demo-admin -- --reset</code>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

