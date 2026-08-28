import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiUsers, FiSearch, FiCheck, FiX } from 'react-icons/fi';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('users');
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchApplications();
  }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      const params = {};
      if (roleFilter !== 'all') {
        params.role = roleFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      const response = await api.get('/users', { params });
      setUsers(response.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await api.get('/teacher-applications', {
        params: { status: 'pending' }
      });
      setApplications(response.data.applications);
    } catch (error) {
      console.error('Failed to fetch teacher applications:', error);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchTerm || roleFilter !== 'all') {
        fetchUsers();
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [searchTerm]);

  const handleApprove = async (id) => {
    setReviewingId(id);
    try {
      await api.put(`/teacher-applications/${id}/approve`);
      toast.success('Teacher application approved');
      await Promise.all([fetchApplications(), fetchUsers()]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve application');
    } finally {
      setReviewingId(null);
    }
  };

  const handleReject = async (id) => {
    const adminNote = window.prompt('Rejection note for student (optional):') || '';
    setReviewingId(id);
    try {
      await api.put(`/teacher-applications/${id}/reject`, { adminNote });
      toast.success('Teacher application rejected');
      await fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject application');
    } finally {
      setReviewingId(null);
    }
  };

  const pendingCount = applications.length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Users</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage users and teacher applications</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'users'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 dark:text-gray-400'
          }`}
        >
          All Users
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            activeTab === 'applications'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 dark:text-gray-400'
          }`}
        >
          Teacher Applications
          {pendingCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'applications' ? (
        applications.length === 0 ? (
          <div className="card text-center py-12">
            <FiUsers className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No pending teacher applications</p>
          </div>
        ) : (
          <div className="card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold">Applicant</th>
                    <th className="text-left py-3 px-4 font-semibold">Email</th>
                    <th className="text-left py-3 px-4 font-semibold">Message</th>
                    <th className="text-left py-3 px-4 font-semibold">Applied</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="py-3 px-4">
                        {app.user?.firstName} {app.user?.lastName}
                      </td>
                      <td className="py-3 px-4">{app.user?.email}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs">
                        {app.message || '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(app.id)}
                            disabled={reviewingId === app.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            <FiCheck className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(app.id)}
                            disabled={reviewingId === app.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            <FiX className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field md:w-48"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>

          {users.length === 0 ? (
            <div className="card text-center py-12">
              <FiUsers className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No users found</p>
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold">Name</th>
                      <th className="text-left py-3 px-4 font-semibold">Email</th>
                      <th className="text-left py-3 px-4 font-semibold">Role</th>
                      <th className="text-left py-3 px-4 font-semibold">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="py-3 px-4">
                          {u.firstName} {u.lastName}
                        </td>
                        <td className="py-3 px-4">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                            u.role === 'admin'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : u.role === 'teacher'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Users;
