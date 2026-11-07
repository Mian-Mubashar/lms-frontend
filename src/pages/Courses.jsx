import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { resolveMediaUrl } from '../utils/mediaUrl';
import toast from 'react-hot-toast';
import { FiArchive, FiBook, FiPlus, FiSearch, FiTrash2, FiTrendingUp, FiUser, FiX } from 'react-icons/fi';

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [busyId, setBusyId] = useState(null);
  const [courseToDelete, setCourseToDelete] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, [filter]);

  const fetchCourses = async () => {
    try {
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      if (user?.role === 'teacher') {
        params.instructorId = user.id;
      }

      const response = await api.get('/courses', { params });
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const canManageCourse = (course) =>
    user?.role === 'admin' ||
    (user?.role === 'teacher' && String(course.instructorId) === String(user.id));

  const updateCourseStatus = async (courseId, status) => {
    setBusyId(courseId);
    try {
      await api.put(`/courses/${courseId}`, { status });
      toast.success(status === 'published' ? 'Course published' : 'Course archived');
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update course');
    } finally {
      setBusyId(null);
    }
  };

  const confirmDeleteCourse = async () => {
    if (!courseToDelete) return;
    const course = courseToDelete;
    setBusyId(course.id);
    try {
      await api.delete(`/courses/${course.id}`);
      toast.success('Course deleted');
      setCourseToDelete(null);
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete course');
    } finally {
      setBusyId(null);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      await api.post(`/courses/${courseId}/enroll`);
      toast.success('Enrolled successfully!');
      fetchCourses();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to enroll');
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [courses, searchTerm]);

  const sortedCourses = useMemo(() => {
    const cloned = [...filteredCourses];
    return cloned.sort((a, b) => {
      if (sortBy === 'title_asc') return a.title.localeCompare(b.title);
      if (sortBy === 'title_desc') return b.title.localeCompare(a.title);
      if (sortBy === 'popular') return (b.enrollmentCount || 0) - (a.enrollmentCount || 0);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });
  }, [filteredCourses, sortBy]);

  const stats = useMemo(() => ({
    total: courses.length,
    published: courses.filter((course) => course.status === 'published').length,
    draft: courses.filter((course) => course.status === 'draft').length,
    enrolled: courses.filter((course) => course.isEnrolled).length
  }), [courses]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Courses</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {user?.role === 'student' ? 'Discover quality learning paths built for you.' : 'Manage, publish, and improve your courses.'}
          </p>
        </div>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Link to="/courses/new" className="btn-primary flex items-center space-x-2">
            <FiPlus className="w-5 h-5" />
            <span>Create Course</span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        <StatsCard title="Total" value={stats.total} />
        <StatsCard title="Published" value={stats.published} />
        <StatsCard title="Draft" value={stats.draft} />
        <StatsCard title="Enrolled" value={stats.enrolled} />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input-field md:w-48"
          >
            <option value="all">All Courses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        )}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="input-field md:w-52"
        >
          <option value="latest">Latest</option>
          <option value="title_asc">Title A-Z</option>
          <option value="title_desc">Title Z-A</option>
          <option value="popular">Most Enrolled</option>
        </select>
      </div>

      {sortedCourses.length === 0 ? (
        <div className="card text-center py-12">
          <FiBook className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">No courses found</p>
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <Link to="/courses/new" className="btn-primary inline-flex items-center gap-2">
              <FiPlus className="w-4 h-4" />
              Create your first course
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCourses.map((course) => (
            <div key={course.id} className="card hover:shadow-xl transition-shadow">
              {course.thumbnail && (
                <img
                  src={resolveMediaUrl(course.thumbnail)}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                  loading="lazy"
                />
              )}
              <div className="flex items-start justify-between mb-2 gap-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-2">
                  {course.title}
                </h3>
                {course.status && (
                  <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${
                    course.status === 'published'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : course.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {course.status}
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {course.description}
              </p>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
                <FiUser className="w-4 h-4 mr-1" />
                <span>
                  {course.instructorFirstName} {course.instructorLastName}
                </span>
              </div>
              <div className="flex items-center text-xs text-primary-600 dark:text-primary-400 mb-4">
                <FiTrendingUp className="w-3.5 h-3.5 mr-1" />
                <span>{course.enrollmentCount || 0} enrollments</span>
              </div>
              <div className="flex items-center justify-between">
                <Link
                  to={`/courses/${course.id}`}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Details
                </Link>
                {user?.role === 'student' && !course.isEnrolled && (
                  <button
                    onClick={() => handleEnroll(course.id)}
                    className="btn-primary text-sm"
                  >
                    Enroll
                  </button>
                )}
                {course.isEnrolled && (
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Enrolled
                  </span>
                )}
              </div>
              {canManageCourse(course) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {course.status !== 'published' && (
                    <button
                      type="button"
                      onClick={() => updateCourseStatus(course.id, 'published')}
                      disabled={busyId === course.id}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Publish
                    </button>
                  )}
                  {course.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={() => updateCourseStatus(course.id, 'archived')}
                      disabled={busyId === course.id}
                      className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      <FiArchive className="w-3.5 h-3.5" />
                      Archive
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setCourseToDelete(course)}
                    disabled={busyId === course.id}
                    className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {courseToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => busyId !== courseToDelete.id && setCourseToDelete(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-course-title"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300">
                <FiTrash2 className="h-5 w-5" />
              </div>
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                disabled={busyId === courseToDelete.id}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <h2 id="delete-course-title" className="text-xl font-semibold text-gray-900 dark:text-white">
              Delete this course?
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium text-gray-900 dark:text-white">{courseToDelete.title}</span> will be removed, along with its enrollments, assignments, and quizzes.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCourseToDelete(null)}
                disabled={busyId === courseToDelete.id}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCourse}
                disabled={busyId === courseToDelete.id}
                className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busyId === courseToDelete.id ? 'Deleting...' : 'Delete course'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatsCard = ({ title, value }) => (
  <div className="card py-4">
    <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
  </div>
);

export default Courses;

