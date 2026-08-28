import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { resolveMediaUrl } from '../utils/mediaUrl';
import AvatarCropModal from '../components/AvatarCropModal';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiSave, FiCamera, FiTrash2 } from 'react-icons/fi';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const cropObjectUrlRef = useRef('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
      setAvatarPreview(resolveMediaUrl(user.avatar));
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (cropObjectUrlRef.current) {
        URL.revokeObjectURL(cropObjectUrlRef.current);
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const closeCropModal = () => {
    setCropModalOpen(false);
    setCropImageSrc('');
    if (cropObjectUrlRef.current) {
      URL.revokeObjectURL(cropObjectUrlRef.current);
      cropObjectUrlRef.current = '';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image must be 8MB or smaller');
      return;
    }

    if (cropObjectUrlRef.current) {
      URL.revokeObjectURL(cropObjectUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    cropObjectUrlRef.current = objectUrl;
    setCropImageSrc(objectUrl);
    setCropModalOpen(true);
  };

  const handleCropConfirm = async (croppedBlob) => {
    setAvatarUploading(true);

    try {
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      const payload = new FormData();
      payload.append('avatar', file);

      const response = await api.post(`/users/${user.id}/avatar`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      updateUser(response.data.user);
      setAvatarPreview(resolveMediaUrl(response.data.user.avatar));
      toast.success('Profile photo updated!');
      closeCropModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload photo');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    try {
      const response = await api.delete(`/users/${user.id}/avatar`);
      updateUser(response.data.user);
      setAvatarPreview('');
      toast.success('Profile photo removed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove photo');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put(`/users/${user.id}`, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim()
      });
      updateUser(response.data.user);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
      console.error('Update profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Profile</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your profile information</p>
      </div>

      <AvatarCropModal
        isOpen={cropModalOpen}
        imageSrc={cropImageSrc}
        onClose={closeCropModal}
        onConfirm={handleCropConfirm}
        uploading={avatarUploading}
      />

      <div className="card w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-2 border-primary-200 dark:border-primary-800"
                  />
                ) : (
                  <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <FiUser className="w-10 h-10 text-primary-600 dark:text-primary-400" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading || cropModalOpen}
                  className="absolute -bottom-1 -right-1 rounded-full bg-primary-600 p-2 text-white shadow hover:bg-primary-700 disabled:opacity-50"
                  aria-label="Change profile photo"
                >
                  <FiCamera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {formData.firstName || user?.firstName} {formData.lastName || user?.lastName}
                </h2>
                <p className="text-gray-600 dark:text-gray-400 capitalize">{user?.role}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Choose a photo, then crop before saving
                </p>
              </div>
            </div>

            {avatarPreview ? (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                disabled={avatarUploading}
                className="inline-flex items-center gap-2 text-sm text-red-600 hover:text-red-700 disabled:opacity-50 dark:text-red-400"
              >
                <FiTrash2 className="w-4 h-4" />
                Remove photo
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <FiUser className="w-4 h-4 mr-2" />
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <FiUser className="w-4 h-4 mr-2" />
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="input-field"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center">
              <FiMail className="w-4 h-4 mr-2" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              className="input-field opacity-80"
              disabled
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <input
              type="text"
              value={user?.role}
              className="input-field"
              disabled
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || avatarUploading}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <FiSave className="w-5 h-5" />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
