import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiCalendar, FiCheckCircle, FiXCircle, FiClock, FiPlus, FiCpu } from 'react-icons/fi';
import { format } from 'date-fns';

const Attendance = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [marking, setMarking] = useState(false);
  const [aiNoteLoading, setAiNoteLoading] = useState(false);
  const [markForm, setMarkForm] = useState({
    courseId: '',
    studentId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    notes: ''
  });

  useEffect(() => {
    fetchAttendance();
    if (user?.role === 'teacher' || user?.role === 'admin') {
      fetchCourses();
    }
  }, [selectedDate, selectedCourse]);

  useEffect(() => {
    if (markForm.courseId) {
      fetchStudents(markForm.courseId);
    } else {
      setStudents([]);
    }
  }, [markForm.courseId]);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data.courses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const fetchStudents = async (courseId) => {
    setStudentsLoading(true);
    try {
      const response = await api.get(`/courses/${courseId}/students`);
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
      toast.error(error.response?.data?.message || 'Failed to load students');
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const params = {};
      if (user?.role === 'student') {
        params.studentId = user.id;
      }
      if (selectedCourse) {
        params.courseId = selectedCourse;
      }
      if (selectedDate) {
        params.date = selectedDate;
      }

      const response = await api.get('/attendance', { params });
      setAttendance(response.data.attendance);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    if (!markForm.studentId) {
      toast.error('Please select a student');
      return;
    }
    setMarking(true);
    try {
      await api.post('/attendance', markForm);
      toast.success('Attendance marked successfully');
      setShowMarkModal(false);
      setMarkForm({
        courseId: '',
        studentId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        notes: ''
      });
      fetchAttendance();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setMarking(false);
    }
  };

  const handleSuggestNote = async () => {
    const student = students.find((s) => String(s.id) === String(markForm.studentId));
    if (!markForm.status) {
      toast.error('Select status first');
      return;
    }
    setAiNoteLoading(true);
    try {
      const response = await api.post('/ai/suggest-attendance-note', {
        status: markForm.status,
        studentName: student ? `${student.firstName} ${student.lastName}` : 'Student',
        // Avoid feeding previous AI note back into prompt repeatedly.
        context: ''
      });
      setMarkForm((prev) => ({ ...prev, notes: response.data.note || prev.notes }));
      toast.success(`AI note generated (${response.data.source || 'ai'})`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate note');
    } finally {
      setAiNoteLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'absent':
        return <FiXCircle className="w-5 h-5 text-red-500" />;
      case 'late':
        return <FiClock className="w-5 h-5 text-yellow-500" />;
      default:
        return <FiCalendar className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Attendance</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {user?.role === 'student' ? 'View your attendance records' : 'Manage student attendance'}
        </p>
      </div>
      {(user?.role === 'teacher' || user?.role === 'admin') && (
        <button
          onClick={() => {
            setMarkForm({
              courseId: '',
              studentId: '',
              date: new Date().toISOString().split('T')[0],
              status: 'present',
              notes: ''
            });
            setStudents([]);
            setShowMarkModal(true);
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Mark Attendance
        </button>
      )}

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
            />
          </div>
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <div>
              <label className="block text-sm font-medium mb-2">Course</label>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="input-field"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Attendance Records */}
      {attendance.length === 0 ? (
        <div className="card text-center py-12">
          <FiCalendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No attendance records found</p>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Course</th>
                  {user?.role !== 'student' && (
                    <th className="text-left py-3 px-4 font-semibold">Student</th>
                  )}
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Notes</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="py-3 px-4">
                      {format(new Date(record.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3 px-4">{record.courseTitle}</td>
                    {user?.role !== 'student' && (
                      <td className="py-3 px-4">
                        {record.firstName} {record.lastName}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(record.status)}
                        <span className="capitalize">{record.status}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showMarkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleMarkAttendance} className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Mark Attendance</h2>
            <select
              required
              value={markForm.courseId}
              onChange={(e) => setMarkForm((prev) => ({ ...prev, courseId: e.target.value, studentId: '' }))}
              className="input-field"
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            <select
              required
              value={markForm.studentId}
              onChange={(e) => setMarkForm((prev) => ({ ...prev, studentId: e.target.value }))}
              className="input-field"
              disabled={!markForm.courseId}
            >
              <option value="">
                {!markForm.courseId
                  ? 'Select Student'
                  : studentsLoading
                    ? 'Loading students...'
                    : students.length === 0
                      ? 'No students available'
                      : 'Select Student'}
              </option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} ({student.email})
                </option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={markForm.date}
                onChange={(e) => setMarkForm((prev) => ({ ...prev, date: e.target.value }))}
                className="input-field"
                required
              />
              <select
                value={markForm.status}
                onChange={(e) => setMarkForm((prev) => ({ ...prev, status: e.target.value }))}
                className="input-field"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </div>
            <textarea
              value={markForm.notes}
              onChange={(e) => setMarkForm((prev) => ({ ...prev, notes: e.target.value }))}
              rows={3}
              placeholder="Notes (optional)"
              className="input-field"
            />
            <button
              type="button"
              onClick={handleSuggestNote}
              disabled={aiNoteLoading}
              className="text-xs px-3 py-1 rounded-md border border-primary-300 text-primary-700 dark:text-primary-300 dark:border-primary-700 inline-flex items-center gap-1 disabled:opacity-50"
            >
              <FiCpu className="w-3.5 h-3.5" />
              {aiNoteLoading ? 'Generating...' : 'AI Suggest Note'}
            </button>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowMarkModal(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={marking} className="btn-primary disabled:opacity-50">
                {marking ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Attendance;

