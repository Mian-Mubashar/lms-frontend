import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiStar, FiMessageSquare } from 'react-icons/fi';

const Feedback = () => {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchFeedback();
    if (user?.role === 'student') {
      fetchCourses();
    }
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data.courses.filter(c => c.isEnrolled));
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const fetchFeedback = async () => {
    try {
      const params = {};
      if (user?.role === 'teacher' || user?.role === 'admin') {
        // Teachers/Admins see all feedback
      } else {
        // Students see their own feedback
      }
      const response = await api.get('/feedback', { params });
      setFeedback(response.data.feedback);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCourse || !rating) {
      toast.error('Please select a course and provide a rating');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/feedback', {
        courseId: selectedCourse,
        rating,
        comment
      });
      toast.success('Feedback submitted successfully!');
      setSelectedCourse('');
      setRating(0);
      setComment('');
      fetchFeedback();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Feedback</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {user?.role === 'student' ? 'Share your feedback about courses' : 'View course feedback'}
        </p>
      </div>

      {user?.role === 'student' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Submit Feedback</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`${
                      star <= rating
                        ? 'text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    } hover:text-yellow-400 transition-colors`}
                  >
                    <FiStar className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Comment</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="input-field"
                placeholder="Share your thoughts about this course..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </form>
        </div>
      )}

      {/* Feedback List */}
      {feedback.length === 0 ? (
        <div className="card text-center py-12">
          <FiMessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No feedback found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedback.map((item) => (
            <div key={item.id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {item.courseTitle}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {item.firstName} {item.lastName}
                  </p>
                </div>
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`w-4 h-4 ${
                        i < item.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {item.comment && (
                <p className="text-gray-700 dark:text-gray-300 mt-2">{item.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feedback;

