import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { FiKey, FiEye, FiEyeOff, FiCopy, FiClipboard, FiX, FiShield } from 'react-icons/fi';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const pasteCodeFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const digits = text.replace(/\D/g, '').slice(0, 6);
      if (!digits) {
        toast.error('No code found in clipboard');
        return;
      }
      setCode(digits);
      toast.success('Code pasted');
    } catch {
      toast.error('Could not read clipboard. Paste manually with Ctrl+V.');
    }
  };

  const sendResetCode = async () => {
    setLoading(true);
    setFormError('');
    try {
      const response = await api.post('/auth/forgot-password', { email }, { timeout: 15000 });
      if (!response.data?.emailSent) {
        const message = response.data?.message || 'Could not send reset code.';
        setFormError(message);
        toast.error(message);
        return;
      }
      toast.success(response.data?.message || 'Reset code sent! Check your inbox within 1 minute.');
      setCode('');
      setShowOtpModal(true);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.response?.status === 503
          ? 'We could not send the reset email right now. Please try again later.'
          : 'Something went wrong. Please try again.');
      setFormError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const requestResetCode = async (e) => {
    e.preventDefault();
    await sendResetCode();
  };

  const handleOtpSubmit = (e) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error('Please enter the 6-digit code from your email');
      return;
    }
    setShowOtpModal(false);
    setShowPasswordModal(true);
    setNewPassword('');
    setConfirmPassword('');
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
      setShowPasswordModal(false);
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
      setShowPasswordModal(false);
      setShowOtpModal(true);
    } finally {
      setLoading(false);
    }
  };

  const closeOtpModal = () => {
    setShowOtpModal(false);
    setCode('');
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setShowOtpModal(true);
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
            <p className="text-gray-600 dark:text-gray-400">We will email you a reset code</p>
          </div>

          <form onSubmit={requestResetCode} className="space-y-4">
            {formError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                {formError}
              </div>
            ) : null}
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="Enter your account email"
              required
            />
            <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-50">
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800 sm:p-8">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900">
                  <FiShield className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Enter reset code</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  We sent a 6-digit code to <strong>{email}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={closeOtpModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Code usually arrives within 1 minute. Check inbox, spam, and promotions.
              </p>
              <div className="relative">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="input-field pr-12 text-center text-lg tracking-[0.4em] font-semibold"
                  placeholder="000000"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={pasteCodeFromClipboard}
                  className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400"
                  aria-label="Paste code from clipboard"
                  title="Paste code from email"
                >
                  <FiClipboard className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <FiCopy className="w-3 h-3" />
                Copy the code from your email, then paste it here.
              </p>
              <button type="submit" className="w-full btn-primary">
                Verify Code
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={sendResetCode}
                className="w-full btn-secondary disabled:opacity-50"
              >
                Resend code
              </button>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={resetPassword}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800 sm:p-8 space-y-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <FiKey className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Set new password</h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Create a new password for your account
                </p>
              </div>
              <button
                type="button"
                onClick={closePasswordModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="New password (min 6 chars)"
                minLength={6}
                autoFocus
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
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
