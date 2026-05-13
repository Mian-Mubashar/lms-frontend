import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { FiArrowLeft, FiImage, FiSave, FiTrash2, FiCpu } from 'react-icons/fi';

const DRAFT_STORAGE_KEY = 'lms_create_course_draft';

const CreateCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    status: 'draft'
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData((prev) => ({
          ...prev,
          ...parsed
        }));
      } catch (error) {
        console.error('Failed to parse saved draft', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const descriptionLength = useMemo(() => formData.description.trim().length, [formData.description]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.title.trim().length < 4) {
      toast.error('Title should be at least 4 characters');
      return;
    }

    if (formData.status === 'published' && descriptionLength < 30) {
      toast.error('For published courses, add at least 30 characters in description');
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      payload.append('description', formData.description);
      payload.append('category', formData.category);
      payload.append('status', formData.status);

      if (thumbnail) {
        payload.append('thumbnail', thumbnail);
      }

      await api.post('/courses', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Course created successfully');
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      navigate('/courses', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0] || null;
    setThumbnail(file);

    if (file) {
      const url = URL.createObjectURL(file);
      setThumbnailPreview(url);
    } else {
      setThumbnailPreview('');
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setFormData({
      title: '',
      description: '',
      category: '',
      status: 'draft'
    });
    setThumbnail(null);
    setThumbnailPreview('');
    toast.success('Draft discarded');
  };

  const handleGenerateDescription = async () => {
    if (!formData.title.trim()) {
      toast.error('Please add course title first');
      return;
    }

    setAiLoading(true);
    try {
      const response = await api.post('/ai/generate-course-description', {
        title: formData.title,
        category: formData.category,
        audience: 'students',
        level: formData.status === 'published' ? 'intermediate' : 'beginner'
      });

      setFormData((prev) => ({ ...prev, description: response.data.description || prev.description }));
      toast.success(`Description generated (${response.data.source || 'ai'})`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate description');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create Course</h1>
          <p className="text-gray-600 dark:text-gray-400">Design a professional course with better details.</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/courses')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="e.g. Introduction to Web Development"
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Keep title concise and descriptive for better discoverability.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={aiLoading}
              className="text-xs px-3 py-1 rounded-md border border-primary-300 text-primary-700 dark:text-primary-300 dark:border-primary-700 inline-flex items-center gap-1 disabled:opacity-50"
            >
              <FiCpu className="w-3.5 h-3.5" />
              {aiLoading ? 'Generating...' : 'AI Generate'}
            </button>
          </div>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            className="input-field"
            placeholder="Write short course overview..."
          />
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Recommended for published courses: 30+ characters</span>
            <span>{descriptionLength} characters</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input-field"
              placeholder="e.g. Programming"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="input-field"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thumbnail (optional)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="input-field cursor-pointer flex items-center gap-2">
              <FiImage className="w-4 h-4" />
              <span>{thumbnail ? thumbnail.name : 'Choose image'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
              />
            </label>
            <div className="h-28 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden">
              {thumbnailPreview ? (
                <img src={thumbnailPreview} alt="Thumbnail preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400">No preview</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50 inline-flex items-center gap-2">
            <FiSave className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Course'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/courses')}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="px-4 py-2 rounded-lg border border-red-300 text-red-600 dark:border-red-700 dark:text-red-400 inline-flex items-center gap-2"
          >
            <FiTrash2 className="w-4 h-4" />
            Discard Draft
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCourse;
