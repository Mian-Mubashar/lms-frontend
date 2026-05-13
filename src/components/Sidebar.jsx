import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  FiHome,
  FiBook,
  FiFileText,
  FiCheckSquare,
  FiCalendar,
  FiMessageSquare,
  FiBarChart,
  FiMessageCircle,
  FiUsers,
  FiCpu
} from 'react-icons/fi';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const studentMenu = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/courses', label: 'Courses', icon: FiBook },
    { path: '/assignments', label: 'Assignments', icon: FiFileText },
    { path: '/quizzes', label: 'Quizzes', icon: FiCheckSquare },
    { path: '/attendance', label: 'Attendance', icon: FiCalendar },
    { path: '/feedback', label: 'Feedback', icon: FiMessageSquare },
    { path: '/analytics', label: 'Analytics', icon: FiBarChart },
    { path: '/ai-chatbot', label: 'AI Assistant', icon: FiMessageCircle },
    { path: '/ai-study-coach', label: 'AI Study Coach', icon: FiCpu },
  ];

  const teacherMenu = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/courses', label: 'Courses', icon: FiBook },
    { path: '/assignments', label: 'Assignments', icon: FiFileText },
    { path: '/quizzes', label: 'Quizzes', icon: FiCheckSquare },
    { path: '/attendance', label: 'Attendance', icon: FiCalendar },
    { path: '/analytics', label: 'Analytics', icon: FiBarChart },
    { path: '/ai-chatbot', label: 'AI Assistant', icon: FiMessageCircle },
    { path: '/ai-pro', label: 'AI Pro Studio', icon: FiCpu },
    { path: '/ai-exam-lab', label: 'AI Exam Lab', icon: FiCpu },
  ];

  const adminMenu = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/users', label: 'Users', icon: FiUsers },
    { path: '/courses', label: 'Courses', icon: FiBook },
    { path: '/assignments', label: 'Assignments', icon: FiFileText },
    { path: '/quizzes', label: 'Quizzes', icon: FiCheckSquare },
    { path: '/attendance', label: 'Attendance', icon: FiCalendar },
    { path: '/analytics', label: 'Analytics', icon: FiBarChart },
    { path: '/ai-chatbot', label: 'AI Assistant', icon: FiMessageCircle },
    { path: '/ai-pro', label: 'AI Pro Studio', icon: FiCpu },
    { path: '/ai-exam-lab', label: 'AI Exam Lab', icon: FiCpu },
  ];

  const menuItems = user?.role === 'admin' 
    ? adminMenu 
    : user?.role === 'teacher' 
    ? teacherMenu 
    : studentMenu;

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-800 shadow-lg overflow-y-auto">
      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

