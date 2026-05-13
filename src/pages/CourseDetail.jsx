import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiBook, FiUser, FiFileText, FiCheckSquare, FiCalendar, FiAward, FiDownload } from 'react-icons/fi';

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [certificateStatus, setCertificateStatus] = useState(null);
  const [certificateLoading, setCertificateLoading] = useState(false);
  const [certificateDownloading, setCertificateDownloading] = useState(false);

  useEffect(() => {
    fetchCourse();
    fetchAssignments();
    fetchQuizzes();
  }, [id]);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchCertificateStatus();
    }
  }, [id, user?.role]);

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${id}`);
      setCourse(response.data.course);
    } catch (error) {
      console.error('Failed to fetch course:', error);
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments', { params: { courseId: id } });
      setAssignments(response.data.assignments);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await api.get('/quizzes', { params: { courseId: id } });
      setQuizzes(response.data.quizzes);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    }
  };

  const handleEnroll = async () => {
    try {
      await api.post(`/courses/${id}/enroll`);
      toast.success('Enrolled successfully!');
      fetchCourse();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to enroll');
    }
  };

  const fetchCertificateStatus = async () => {
    setCertificateLoading(true);
    try {
      const response = await api.get(`/courses/${id}/certificate/status`);
      setCertificateStatus(response.data);
    } catch (error) {
      setCertificateStatus(null);
    } finally {
      setCertificateLoading(false);
    }
  };

  const handleDownloadCertificate = async () => {
    setCertificateDownloading(true);
    try {
      const response = await api.get(`/courses/${id}/certificate/download`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${(course?.title || 'course').replace(/\s+/g, '-').toLowerCase()}-certificate.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Certificate downloaded');
      fetchCertificateStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Certificate is not available yet');
    } finally {
      setCertificateDownloading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!course) {
    return <div className="card">Course not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="card">
        {course.thumbnail && (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {course.title}
            </h1>
            <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
              <FiUser className="w-5 h-5 mr-2" />
              <span>
                {course.instructorFirstName} {course.instructorLastName}
              </span>
            </div>
          </div>
          {user?.role === 'student' && !course.isEnrolled && (
            <button onClick={handleEnroll} className="btn-primary">
              Enroll Now
            </button>
          )}
        </div>
        <div className="prose dark:prose-invert max-w-none">
          <p className="text-gray-700 dark:text-gray-300">{course.description}</p>
        </div>
      </div>

      {/* Course Materials */}
      {course.materials && course.materials.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <FiFileText className="w-6 h-6 mr-2" />
            Course Materials
          </h2>
          <div className="space-y-2">
            {course.materials.map((material) => (
              <a
                key={material.id}
                href={material.filePath}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <FiFileText className="w-5 h-5 mr-3 text-primary-600" />
                <span>{material.title}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Completion Certificate */}
      {user?.role === 'student' && course.isEnrolled && (
        <div className="card border border-primary-300/30 dark:border-primary-700/40 bg-gradient-to-r from-primary-50/70 to-indigo-50/40 dark:from-primary-900/20 dark:to-indigo-900/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold mb-1 flex items-center">
                <FiAward className="w-6 h-6 mr-2 text-primary-600" />
                Completion Certificate
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Finish all required quizzes and assignments to unlock your professional PDF certificate.
              </p>
            </div>
            {certificateStatus?.eligible && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                Eligible
              </span>
            )}
          </div>
          {certificateLoading ? (
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Checking eligibility...</p>
          ) : certificateStatus ? (
            <div className="space-y-4 mt-4">
              <p className="text-sm text-gray-700 dark:text-gray-200">
                Progress: <strong>{certificateStatus.progress}%</strong>
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-primary-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${certificateStatus.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Assignments: {certificateStatus.summary.completedAssignments}/{certificateStatus.summary.totalAssignments} | Quizzes: {certificateStatus.summary.completedQuizzes}/{certificateStatus.summary.totalQuizzes}
              </p>
              {certificateStatus.eligible ? (
                <button
                  onClick={handleDownloadCertificate}
                  disabled={certificateDownloading}
                  className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
                >
                  <FiDownload className="w-4 h-4" />
                  {certificateDownloading ? 'Downloading PDF...' : 'Download Certificate (PDF)'}
                </button>
              ) : (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Complete all quizzes and assignments to unlock your certificate.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Certificate status will appear after you start this course.
            </p>
          )}
        </div>
      )}

      {/* Assignments */}
      {assignments.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <FiCheckSquare className="w-6 h-6 mr-2" />
            Assignments
          </h2>
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {assignment.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {assignment.description}
                    </p>
                    {assignment.dueDate && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {user?.role === 'student' && assignment.submission && (
                    <span className="text-sm text-green-600 dark:text-green-400">
                      Submitted
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quizzes */}
      {quizzes.length > 0 && (
        <div className="card">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            <FiCalendar className="w-6 h-6 mr-2" />
            Quizzes
          </h2>
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Time Limit: {quiz.timeLimit} minutes
                    </p>
                    {quiz.lastAttempt && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                        Score: {quiz.lastAttempt.score}/{quiz.maxScore}
                      </p>
                    )}
                  </div>
                  {user?.role === 'student' && !quiz.lastAttempt && (
                    <button className="btn-primary text-sm">Take Quiz</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;

