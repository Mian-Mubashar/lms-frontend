import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { FiKey, FiEye, FiEyeOff } from 'react-icons/fi';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCodeHint, setGeneratedCodeHint] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const requestResetCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.data?.resetCode) {
        setGeneratedCodeHint(response.data.resetCode);
      }
      toast.success('Reset code generated. Check details below.');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate reset code');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email,
        code,
        newPassword
      });
      toast.success('Password reset successful');
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 px-4 py-8 sm:py-12 safe-area-pb">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-5 shadow-xl dark:bg-gray-800 sm:p-8">
          <div className="mb-6 text-center sm:mb-8">
            <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900 sm:mb-4 sm:h-16 sm:w-16">
              <FiKey className="h-7 w-7 text-primary-600 dark:text-primary-400 sm:h-8 sm:w-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl mb-2">Forgot Password</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {step === 1 ? 'Generate reset code' : 'Set your new password'}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={requestResetCode} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="Enter your account email"
                required
              />
              <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-50">
                {loading ? 'Generating...' : 'Generate Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={resetPassword} className="space-y-4">
              <input type="email" value={email} readOnly className="input-field opacity-80" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="input-field"
                placeholder="Enter reset code"
                required
              />
              {generatedCodeHint ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Dev reset code: <strong>{generatedCodeHint}</strong>
                </p>
              ) : null}
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="New password (min 6 chars)"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showNewPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Confirm new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-50">
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

