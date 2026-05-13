import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiBook, FiPlus, FiSearch, FiTrendingUp, FiUser } from 'react-icons/fi';

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
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
            </div>
          ))}
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

