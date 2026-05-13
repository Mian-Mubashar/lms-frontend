import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  FiBook,
  FiFileText,
  FiCheckSquare,
  FiTrendingUp,
  FiUsers,
  FiCalendar,
  FiCpu,
  FiPlus,
  FiBarChart2,
  FiEdit3,
  FiActivity
} from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/dashboard');
      setAnalytics(response.data.analytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsights = async () => {
    if (!analytics) {
      return;
    }
    setInsightsLoading(true);
    try {
      const response = await api.post('/ai/dashboard-insights', {
        role: user?.role,
        analytics
      });
      const normalizedInsights = Array.isArray(response.data.insights)
        ? response.data.insights
            .map((item) => {
              if (typeof item === 'string') {
                return item.trim();
              }
              if (item && typeof item === 'object') {
                return String(item.insight || item.text || item.recommendation || '').trim();
              }
              return '';
            })
            .filter(Boolean)
        : [];
      setAiInsights(normalizedInsights);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load AI insights');
    } finally {
      setInsightsLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const COLORS = ['#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what's happening with your {user?.role === 'student' ? 'learning' : 'courses'} today.
        </p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <FiCpu className="w-5 h-5 text-primary-600" />
            AI Insights
          </h3>
          <button onClick={fetchAIInsights} disabled={insightsLoading} className="btn-primary text-sm disabled:opacity-50">
            {insightsLoading ? 'Analyzing...' : 'Generate Insights'}
          </button>
        </div>
        {aiInsights.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">Click "Generate Insights" to get AI recommendations from current dashboard data.</p>
        ) : (
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {aiInsights.map((insight, idx) => (
              <li key={idx} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                {idx + 1}. {insight}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user?.role === 'admin' && (
          <>
            <StatCard
              title="Total Users"
              value={analytics?.totalUsers || 0}
              icon={FiUsers}
              color="blue"
            />
            <StatCard
              title="Total Courses"
              value={analytics?.totalCourses || 0}
              icon={FiBook}
              color="purple"
            />
            <StatCard
              title="Enrollments"
              value={analytics?.totalEnrollments || 0}
              icon={FiTrendingUp}
              color="green"
            />
            <StatCard
              title="Active Students"
              value={analytics?.activeStudents || 0}
              icon={FiUsers}
              color="orange"
            />
          </>
        )}

        {user?.role === 'teacher' && (
          <>
            <StatCard
              title="Total Courses"
              value={analytics?.totalCourses || 0}
              icon={FiBook}
              color="blue"
            />
            <StatCard
              title="Total Students"
              value={analytics?.totalStudents || 0}
              icon={FiUsers}
              color="purple"
            />
            <StatCard
              title="Assignments"
              value={analytics?.totalAssignments || 0}
              icon={FiFileText}
              color="green"
            />
            <StatCard
              title="Quiz Count"
              value={analytics?.totalQuizzes || 0}
              icon={FiCheckSquare}
              color="orange"
            />
            <StatCard
              title="Pending Submissions"
              value={analytics?.pendingSubmissions || 0}
              icon={FiCalendar}
              color="purple"
            />
          </>
        )}

        {user?.role === 'student' && (
          <>
            <StatCard
              title="Enrolled Courses"
              value={analytics?.enrolledCourses || 0}
              icon={FiBook}
              color="blue"
            />
            <StatCard
              title="Completed"
              value={analytics?.completedCourses || 0}
              icon={FiCheckSquare}
              color="green"
            />
            <StatCard
              title="Assignments"
              value={analytics?.submittedAssignments || 0}
              icon={FiFileText}
              color="purple"
            />
            <StatCard
              title="Average Score"
              value={analytics?.averageScore ? `${Math.round(analytics.averageScore)}%` : 'N/A'}
              icon={FiTrendingUp}
              color="orange"
            />
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {user?.role === 'admin' && analytics?.usersByRole && (
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Users by Role</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.usersByRole}
                  dataKey="count"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {analytics.usersByRole.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {user?.role === 'student' && analytics?.progressByCourse && (
          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Course Progress</h3>
            <div className="space-y-4">
              {analytics.progressByCourse.map((course) => (
                <div key={course.id}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{course.title}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {course.progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {user?.role === 'teacher' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FiActivity className="w-5 h-5 text-primary-600" />
              Recent Activity
            </h3>
            {Array.isArray(analytics?.recentActivity) && analytics.recentActivity.length > 0 ? (
              <div className="space-y-3">
                {analytics.recentActivity.map((activity, idx) => (
                  <div key={`${activity.activityType}-${idx}`} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm text-gray-800 dark:text-gray-200">{activity.activityText}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(activity.activityAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No recent activity yet.</p>
            )}
          </div>

          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Teacher Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link to="/assignments" className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900 hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors flex items-center gap-2">
                <FiPlus className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium">Create Assignment</span>
              </Link>
              <Link to="/quizzes" className="p-3 rounded-lg bg-green-50 dark:bg-green-900 hover:bg-green-100 dark:hover:bg-green-800 transition-colors flex items-center gap-2">
                <FiPlus className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Create Quiz</span>
              </Link>
              <Link to="/analytics" className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900 hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors flex items-center gap-2">
                <FiBarChart2 className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">View Results</span>
              </Link>
              <Link to="/grade-students" className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900 hover:bg-orange-100 dark:hover:bg-orange-800 transition-colors flex items-center gap-2">
                <FiEdit3 className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">Grade Students</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/courses"
            className="p-4 bg-primary-50 dark:bg-primary-900 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-800 transition-colors text-center"
          >
            <FiBook className="w-6 h-6 mx-auto mb-2 text-primary-600" />
            <span className="text-sm font-medium">Browse Courses</span>
          </Link>
          <Link
            to="/assignments"
            className="p-4 bg-purple-50 dark:bg-purple-900 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800 transition-colors text-center"
          >
            <FiFileText className="w-6 h-6 mx-auto mb-2 text-purple-600" />
            <span className="text-sm font-medium">Assignments</span>
          </Link>
          <Link
            to="/quizzes"
            className="p-4 bg-green-50 dark:bg-green-900 rounded-lg hover:bg-green-100 dark:hover:bg-green-800 transition-colors text-center"
          >
            <FiCheckSquare className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <span className="text-sm font-medium">Quizzes</span>
          </Link>
          <Link
            to="/ai-chatbot"
            className="p-4 bg-orange-50 dark:bg-orange-900 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-800 transition-colors text-center"
          >
            <FiCalendar className="w-6 h-6 mx-auto mb-2 text-orange-600" />
            <span className="text-sm font-medium">AI Assistant</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
    green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
    orange: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

