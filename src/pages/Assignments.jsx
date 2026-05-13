import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiFileText, FiCalendar, FiCheckCircle, FiPlus, FiCpu, FiRefreshCw, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { format } from 'date-fns';

const Assignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [courses, setCourses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMode, setAiMode] = useState('balanced');
  const [assignmentType, setAssignmentType] = useState('practical');
  const [learningOutcome, setLearningOutcome] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [createForm, setCreateForm] = useState({
    courseId: '',
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100
  });

  useEffect(() => {
    fetchAssignments();
    if (user?.role === 'teacher' || user?.role === 'admin') {
      fetchCourses();
    }
  }, []);

  const fetchCourses = async () => {
    try {
      const params = user?.role === 'teacher' ? { instructorId: user.id } : {};
      const response = await api.get('/courses', { params });
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await api.get('/assignments');
      setAssignments(response.data.assignments);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (assignmentId) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('submissionText', submissionText);
      
      await api.post(`/assignments/${assignmentId}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Assignment submitted successfully!');
      setSelectedAssignment(null);
      setSubmissionText('');
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      if (editingAssignmentId) {
        await api.put(`/assignments/${editingAssignmentId}`, createForm);
        toast.success('Assignment updated successfully');
      } else {
        await api.post('/assignments', createForm);
        toast.success('Assignment created successfully');
      }
      setShowCreateModal(false);
      setEditingAssignmentId(null);
      setCreateForm({ courseId: '', title: '', description: '', dueDate: '', maxScore: 100 });
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save assignment');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditAssignment = (assignment) => {
    const dueDateValue = assignment.dueDate
      ? new Date(assignment.dueDate).toISOString().slice(0, 16)
      : '';

    setEditingAssignmentId(assignment.id);
    setCreateForm({
      courseId: assignment.courseId || '',
      title: assignment.title || '',
      description: assignment.description || '',
      dueDate: dueDateValue,
      maxScore: assignment.maxScore || 100
    });
    setShowCreateModal(true);
  };

  const handleDeleteAssignment = async (assignmentId) => {
    const confirmed = window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.');
    if (!confirmed) {
      return;
    }
    try {
      await api.delete(`/assignments/${assignmentId}`);
      toast.success('Assignment deleted successfully');
      fetchAssignments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete assignment');
    }
  };

  const handleGenerateWithAI = async () => {
    const selectedCourseTitle = courses.find((c) => String(c.id) === String(createForm.courseId))?.title || '';
    const topic = createForm.title || createForm.description;
    if (!topic.trim()) {
      toast.error('Add title or description topic first');
      return;
    }

    setAiLoading(true);
    try {
      const response = await api.post('/ai/generate-assignment-template', {
        topic,
        courseTitle: selectedCourseTitle,
        level: 'intermediate',
        assignmentType,
        learningOutcome,
        existingDescription: createForm.description,
        generationMode: aiMode
      });
      setCreateForm((prev) => ({
        ...prev,
        title: response.data.title || prev.title,
        description: [
          response.data.description,
          response.data.instructions,
          Array.isArray(response.data.rubric) && response.data.rubric.length
            ? `Rubric:\n- ${response.data.rubric.join('\n- ')}`
            : ''
        ].filter(Boolean).join('\n\n')
      }));
      toast.success(`AI template generated (${response.data.source || 'ai'} - ${response.data.mode || aiMode})`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate with AI');
    } finally {
      setAiLoading(false);
    }
  };

  const filteredAssignments = assignments.filter((assignment) => {
    if (!searchTerm.trim()) {
      return true;
    }
    const q = searchTerm.toLowerCase();
    return (
      (assignment.title || '').toLowerCase().includes(q) ||
      (assignment.description || '').toLowerCase().includes(q) ||
      (assignment.courseTitle || '').toLowerCase().includes(q)
    );
  });

  const upcomingCount = assignments.filter((assignment) => {
    if (!assignment.dueDate) {
      return false;
    }
    return new Date(assignment.dueDate) >= new Date();
  }).length;

  const submittedCount = assignments.filter((assignment) => Boolean(assignment.submission)).length;

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Assignments</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {user?.role === 'student' ? 'View and submit your assignments' : 'Manage assignments'}
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Assignments</p>
          <p className="text-2xl font-bold mt-1">{assignments.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Due</p>
          <p className="text-2xl font-bold mt-1">{upcomingCount}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user?.role === 'student' ? 'Submitted' : 'Student Submissions'}
          </p>
          <p className="text-2xl font-bold mt-1">{submittedCount}</p>
        </div>
      </div>
      <div className="card">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by title, course, or keyword..."
          className="input-field"
        />
      </div>
      {(user?.role === 'teacher' || user?.role === 'admin') && (
        <button
          onClick={() => {
            setShowCreateModal(true);
            setEditingAssignmentId(null);
            setCreateForm({ courseId: '', title: '', description: '', dueDate: '', maxScore: 100 });
            setAiMode('balanced');
            setAssignmentType('practical');
            setLearningOutcome('');
          }}
          className="btn-primary inline-flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          Create Assignment
        </button>
      )}

      {filteredAssignments.length === 0 ? (
        <div className="card text-center py-12">
          <FiFileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No assignments match your search</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <div key={assignment.id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {assignment.title}
                    </h3>
                    {user?.role === 'student' && assignment.submission && (
                      <FiCheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    {assignment.description}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <FiFileText className="w-4 h-4 mr-1" />
                      {assignment.courseTitle}
                    </span>
                    {assignment.dueDate && (
                      <span className="flex items-center">
                        <FiCalendar className="w-4 h-4 mr-1" />
                        Due: {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                      </span>
                    )}
                    <span>Max Score: {assignment.maxScore}</span>
                  </div>
                  {user?.role === 'student' && assignment.submission && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm font-medium mb-1">Your Submission:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {assignment.submission.submissionText}
                      </p>
                      {assignment.submission.score !== null && (
                        <p className="text-sm font-medium mt-2">
                          Score: {assignment.submission.score}/{assignment.maxScore}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {(user?.role === 'teacher' || user?.role === 'admin') && (
                  <div className="ml-4 flex items-center gap-2">
                    <button
                      onClick={() => handleEditAssignment(assignment)}
                      className="btn-secondary inline-flex items-center gap-1 text-sm"
                    >
                      <FiEdit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteAssignment(assignment.id)}
                      className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 inline-flex items-center gap-1"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                )}
                {user?.role === 'student' && !assignment.submission && (
                  <button
                    onClick={() => setSelectedAssignment(assignment)}
                    className="btn-primary ml-4"
                  >
                    Submit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateAssignment} className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 space-y-4">
            <h2 className="text-2xl font-semibold">{editingAssignmentId ? 'Edit Assignment' : 'Create Assignment'}</h2>
            <div className="p-4 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50/40 dark:bg-primary-900/20 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FiCpu className="w-4 h-4" />
                AI Assignment Builder
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <select value={assignmentType} onChange={(e) => setAssignmentType(e.target.value)} className="input-field">
                  <option value="practical">Practical</option>
                  <option value="project">Project</option>
                  <option value="case-study">Case Study</option>
                  <option value="theory">Theory</option>
                </select>
                <select value={aiMode} onChange={(e) => setAiMode(e.target.value)} className="input-field">
                  <option value="strict">Strict</option>
                  <option value="balanced">Balanced</option>
                  <option value="creative">Creative</option>
                </select>
                <button
                  type="button"
                  onClick={handleGenerateWithAI}
                  disabled={aiLoading}
                  className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {aiLoading ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FiCpu className="w-4 h-4" />
                      Generate with AI
                    </>
                  )}
                </button>
              </div>
              <input
                value={learningOutcome}
                onChange={(e) => setLearningOutcome(e.target.value)}
                placeholder="Learning outcome (e.g. Build reusable React components with props and state)"
                className="input-field"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tip: AI uses title/description + outcome + mode to generate less repetitive, more course-specific content.
              </p>
            </div>
            <select
              required
              value={createForm.courseId}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, courseId: e.target.value }))}
              className="input-field"
            >
              <option value="">Select Course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            <input
              required
              value={createForm.title}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Assignment title"
              className="input-field"
            />
            <textarea
              value={createForm.description}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              placeholder="Assignment description"
              className="input-field"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="datetime-local"
                value={createForm.dueDate}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="input-field"
              />
              <input
                type="number"
                min="1"
                value={createForm.maxScore}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, maxScore: Number(e.target.value) }))}
                className="input-field"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAssignmentId(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" disabled={createLoading} className="btn-primary disabled:opacity-50">
                {createLoading ? 'Saving...' : editingAssignmentId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Submission Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-semibold mb-4">Submit Assignment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Submission Text</label>
                <textarea
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  rows={10}
                  className="input-field"
                  placeholder="Enter your submission..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setSelectedAssignment(null);
                    setSubmissionText('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSubmit(selectedAssignment.id)}
                  disabled={submitting || !submissionText.trim()}
                  className="btn-primary disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;

