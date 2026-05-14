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

const Sidebar = ({ isOpen = false, onNavigate }) => {
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

  const panelClass =
    'fixed left-0 top-16 z-40 h-[calc(100dvh-4rem)] w-[min(18rem,88vw)] max-w-sm bg-white dark:bg-gray-800 shadow-xl overflow-y-auto border-r border-gray-200 dark:border-gray-700 transition-transform duration-200 ease-out lg:translate-x-0 ' +
    (isOpen ? 'translate-x-0' : '-translate-x-full');

  return (
    <aside className={panelClass}>
      <nav className="p-3 sm:p-4">
        <ul className="space-y-1 sm:space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => onNavigate?.()}
                  className={`flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg text-sm sm:text-base transition-colors ${
                    isActive
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{item.label}</span>
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

