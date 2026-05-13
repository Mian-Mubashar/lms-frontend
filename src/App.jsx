// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { Toaster } from 'react-hot-toast';
// import { AuthProvider, useAuth } from './contexts/AuthContext';
// import { ThemeProvider, useTheme } from './contexts/ThemeContext';
// import Layout from './components/Layout';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Dashboard from './pages/Dashboard';
// import Courses from './pages/Courses';
// import CourseDetail from './pages/CourseDetail';
// import Assignments from './pages/Assignments';
// import Quizzes from './pages/Quizzes';
// import Attendance from './pages/Attendance';
// import Feedback from './pages/Feedback';
// import Analytics from './pages/Analytics';
// import AIChatbot from './pages/AIChatbot';
// import Profile from './pages/Profile';
// import Users from './pages/Users';

// // Protected Route Component
// const ProtectedRoute = ({ children }) => {
//   const { user, loading } = useAuth();
  
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
//       </div>
//     );
//   }
  
//   return user ? children : <Navigate to="/login" />;
// };

// // Role-based Route Component
// const RoleRoute = ({ children, allowedRoles }) => {
//   const { user } = useAuth();
  
//   if (!user) {
//     return <Navigate to="/login" />;
//   }
  
//   if (!allowedRoles.includes(user.role)) {
//     return <Navigate to="/dashboard" />;
//   }
  
//   return children;
// };

// function AppContent() {
//   const { theme } = useTheme();

//   return (
//     <div className={theme}>
//       <Router>
//         <Routes>
//           <Route path="/login" element={<Login />} />
//           <Route path="/register" element={<Register />} />
          
//           <Route path="/" element={
//             <ProtectedRoute>
//               <Layout />
//             </ProtectedRoute>
//           }>
//             <Route index element={<Navigate to="/dashboard" />} />
//             <Route path="dashboard" element={<Dashboard />} />
//             <Route path="courses" element={<Courses />} />
//             <Route path="courses/:id" element={<CourseDetail />} />
//             <Route path="assignments" element={<Assignments />} />
//             <Route path="quizzes" element={<Quizzes />} />
//             <Route path="attendance" element={<Attendance />} />
//             <Route path="feedback" element={<Feedback />} />
//             <Route path="analytics" element={<Analytics />} />
//             <Route path="ai-chatbot" element={<AIChatbot />} />
//             <Route path="profile" element={<Profile />} />
            
//             <Route path="users" element={
//               <RoleRoute allowedRoles={['admin']}>
//                 <Users />
//               </RoleRoute>
//             } />
//           </Route>
//         </Routes>
//       </Router>
//       <Toaster position="top-right" />
//     </div>
//   );
// }

// function App() {
//   return (
//     <ThemeProvider>
//       <AuthProvider>
//         <AppContent />
//       </AuthProvider>
//     </ThemeProvider>
//   );
// }

// export default App;

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Layout from './components/Layout';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import CreateCourse from './pages/CreateCourse';
import CourseDetail from './pages/CourseDetail';
import Assignments from './pages/Assignments';
import Quizzes from './pages/Quizzes';
import Attendance from './pages/Attendance';
import Feedback from './pages/Feedback';
import Analytics from './pages/Analytics';
import AIChatbot from './pages/AIChatbot';
import AIProStudio from './pages/AIProStudio';
import AIExamLab from './pages/AIExamLab';
import AIStudyCoach from './pages/AIStudyCoach';
import Profile from './pages/Profile';
import Users from './pages/Users';
import GradeStudents from './pages/GradeStudents';

const getDefaultRouteForRole = (role) => {
  if (role === 'admin' || role === 'teacher') {
    return '/dashboard';
  }
  return '/courses';
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
};

const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return user ? <Navigate to={getDefaultRouteForRole(user.role)} replace /> : children;
};

const RoleRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={getDefaultRouteForRole(user.role)} replace />;
  }

  return children;
};

function AppContent() {
  const { theme } = useTheme();
  const { user } = useAuth();

  return (
    <div className={theme}>
      <Router>
        <Routes>

          {/* Public routes */}
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/dashboard/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />

          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to={getDefaultRouteForRole(user?.role)} replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/new" element={<RoleRoute allowedRoles={['admin', 'teacher']}><CreateCourse /></RoleRoute>} />
            <Route path="courses/:id" element={<CourseDetail />} />
            <Route path="assignments" element={<Assignments />} />
            <Route path="quizzes" element={<Quizzes />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="grade-students" element={<RoleRoute allowedRoles={['teacher', 'admin']}><GradeStudents /></RoleRoute>} />
            <Route path="ai-chatbot" element={<AIChatbot />} />
            <Route path="ai-pro" element={<RoleRoute allowedRoles={['teacher', 'admin']}><AIProStudio /></RoleRoute>} />
            <Route path="ai-exam-lab" element={<RoleRoute allowedRoles={['teacher', 'admin']}><AIExamLab /></RoleRoute>} />
            <Route path="ai-study-coach" element={<RoleRoute allowedRoles={['student']}><AIStudyCoach /></RoleRoute>} />
            <Route path="profile" element={<Profile />} />
            <Route path="users" element={<RoleRoute allowedRoles={['admin']}><Users /></RoleRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>

      <Toaster position="top-right" />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
