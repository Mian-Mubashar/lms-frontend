import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const Analytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const COLORS = ['#0ea5e9', '#3b82f6', '#8b5cf6', '#ec4899', '#10b981'];

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (!analytics) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">Analytics data is not available right now.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">View detailed analytics and insights</p>
      </div>

      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analytics?.usersByRole && (
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

          {analytics?.coursesByStatus && (
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">Courses by Status</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.coursesByStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {user?.role === 'teacher' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Total Courses" value={analytics.totalCourses || 0} />
            <MetricCard title="Total Students" value={analytics.totalStudents || 0} />
            <MetricCard title="Assignments" value={analytics.totalAssignments || 0} />
            <MetricCard title="Quiz Count" value={analytics.totalQuizzes || 0} />
          </div>

          <div className="card">
            <h3 className="text-xl font-semibold mb-4">Course Performance</h3>
            {Array.isArray(analytics.coursePerformance) && analytics.coursePerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4">Course</th>
                      <th className="text-left py-3 px-4">Enrolled Students</th>
                      <th className="text-left py-3 px-4">Average Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.coursePerformance.map((course) => (
                      <tr
                        key={course.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="py-3 px-4">{course.title}</td>
                        <td className="py-3 px-4">{course.enrolledStudents}</td>
                        <td className="py-3 px-4">
                          {course.avgRating ? Number(course.avgRating).toFixed(1) : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">No course performance data yet.</p>
            )}
          </div>
        </>
      )}

      {user?.role === 'student' && analytics?.progressByCourse && (
        <div className="card">
          <h3 className="text-xl font-semibold mb-4">Course Progress</h3>
          <div className="space-y-4">
            {analytics.progressByCourse.map((course) => (
              <div key={course.id}>
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{course.title}</span>
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
  );
};

const MetricCard = ({ title, value }) => (
  <div className="card">
    <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
    <p className="text-3xl font-bold mt-1">{value}</p>
  </div>
);

export default Analytics;

