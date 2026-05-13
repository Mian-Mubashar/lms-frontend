import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiCheckSquare, FiClock, FiPlus, FiTrash2, FiCpu, FiEdit2 } from 'react-icons/fi';

const Quizzes = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [courses, setCourses] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [pendingDeleteQuiz, setPendingDeleteQuiz] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [aiCount, setAiCount] = useState(5);
  const [aiMode, setAiMode] = useState('accurate');
  const [createForm, setCreateForm] = useState({
    courseId: '',
    title: '',
    description: '',
    timeLimit: 30,
    maxScore: 100,
    questions: [
      { question: '', questionType: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', points: 1 }
    ]
  });

  useEffect(() => {
    fetchQuizzes();
    if (user?.role === 'teacher' || user?.role === 'admin') {
      fetchCourses();
    }
  }, []);

  useEffect(() => {
    if (selectedQuiz && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [selectedQuiz, timeRemaining]);

  const fetchQuizzes = async () => {
    try {
      const response = await api.get('/quizzes');
      setQuizzes(response.data.quizzes);
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const params = user?.role === 'teacher' ? { instructorId: user.id } : {};
      const response = await api.get('/courses', { params });
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const startQuiz = async (quizId) => {
    try {
      const response = await api.get(`/quizzes/${quizId}`);
      setSelectedQuiz(response.data.quiz);
      setTimeRemaining(response.data.quiz.timeLimit * 60); // Convert to seconds
      setAnswers({});
    } catch (error) {
      toast.error('Failed to load quiz');
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      const response = await api.post(`/quizzes/${selectedQuiz.id}/submit`, { answers });
      toast.success(`Quiz submitted! Score: ${response.data.score}/${selectedQuiz.maxScore}`);
      setSelectedQuiz(null);
      setAnswers({});
      fetchQuizzes();
    } catch (error) {
      toast.error('Failed to submit quiz');
    }
  };

  const handleQuestionChange = (index, key, value) => {
    setCreateForm((prev) => {
      const updated = [...prev.questions];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, questions: updated };
    });
  };

  const addQuestion = () => {
    setCreateForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { question: '', questionType: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', points: 1 }
      ]
    }));
  };

  const removeQuestion = (index) => {
    setCreateForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const payload = {
        ...createForm,
        questions: createForm.questions.map((q) => ({
          ...q,
          options: q.questionType === 'multiple_choice' ? q.options.filter(Boolean) : [],
          points: Number(q.points) || 1
        }))
      };
      if (editingQuizId) {
        await api.put(`/quizzes/${editingQuizId}`, payload);
        toast.success('Quiz updated successfully');
      } else {
        await api.post('/quizzes', payload);
        toast.success('Quiz created successfully');
      }
      setShowCreateModal(false);
      setEditingQuizId(null);
      fetchQuizzes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save quiz');
    } finally {
      setCreateLoading(false);
    }
  };

  const openCreateQuizModal = () => {
    setEditingQuizId(null);
    setCreateForm({
      courseId: '',
      title: '',
      description: '',
      timeLimit: 30,
      maxScore: 100,
      questions: [
        { question: '', questionType: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', points: 1 }
      ]
    });
    setShowCreateModal(true);
  };

  const handleEditQuiz = async (quizId) => {
    try {
      const response = await api.get(`/quizzes/${quizId}`);
      const quiz = response.data.quiz;
      setEditingQuizId(quizId);
      const normalizedQuestions = (quiz.questions || []).map((q) => ({
        question: q.question || '',
        questionType: q.questionType || 'multiple_choice',
        options: q.questionType === 'multiple_choice'
          ? (Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]')).concat(['', '', '', '']).slice(0, 4)
          : ['', '', '', ''],
        correctAnswer: q.correctAnswer || '',
        points: q.points || 1
      }));
      setCreateForm({
        courseId: quiz.courseId,
        title: quiz.title || '',
        description: quiz.description || '',
        timeLimit: quiz.timeLimit || 30,
        maxScore: quiz.maxScore || 100,
        questions: normalizedQuestions.length > 0
          ? normalizedQuestions
          : [{ question: '', questionType: 'multiple_choice', options: ['', '', '', ''], correctAnswer: '', points: 1 }]
      });
      setShowCreateModal(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load quiz for edit');
    }
  };

  const handleDeleteQuiz = async () => {
    if (!pendingDeleteQuiz) {
      return;
    }
    setDeleteLoading(true);
    try {
      await api.delete(`/quizzes/${pendingDeleteQuiz.id}`);
      toast.success('Quiz deleted successfully');
      setPendingDeleteQuiz(null);
      fetchQuizzes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete quiz');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Add topic first for AI generation');
      return;
    }

    setAiGenerating(true);
    try {
      const response = await api.post('/ai/generate-quiz-questions', {
        topic: aiPrompt,
        difficulty: aiDifficulty,
        count: aiCount,
        questionType: 'multiple_choice',
        generationMode: aiMode
      });

      if (Array.isArray(response.data.questions) && response.data.questions.length > 0) {
        setCreateForm((prev) => ({ ...prev, questions: response.data.questions }));
        toast.success(`Questions generated (${response.data.source || 'ai'} - ${response.data.mode || aiMode})`);
      } else {
        toast.error('AI returned no questions');
      }
    } catch (error) {
      const serverMessage = error.response?.data?.message || error.response?.data?.error;
      toast.error(serverMessage || 'Failed to generate questions');
    } finally {
      setAiGenerating(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionOptions = (rawOptions) => {
    if (Array.isArray(rawOptions)) {
      return rawOptions;
    }
    if (typeof rawOptions === 'string') {
      try {
        const parsed = JSON.parse(rawOptions);
        return Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    }
    return [];
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quizzes</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {user?.role === 'student' ? 'Take quizzes and test your knowledge' : 'Manage quizzes'}
        </p>
      </div>
      {(user?.role === 'teacher' || user?.role === 'admin') && (
        <button onClick={openCreateQuizModal} className="btn-primary inline-flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          Create Quiz
        </button>
      )}

      {selectedQuiz ? (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">{selectedQuiz.title}</h2>
            <div className="flex items-center space-x-2 text-lg font-medium">
              <FiClock className="w-5 h-5" />
              <span>{formatTime(timeRemaining)}</span>
            </div>
          </div>

          <div className="space-y-6">
            {selectedQuiz.questions?.map((question, index) => (
              <div key={question.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="font-medium mb-3">
                  {index + 1}. {question.question}
                </p>
                {question.questionType === 'multiple_choice' && question.options && (
                  <div className="space-y-2">
                    {getQuestionOptions(question.options).map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) =>
                            setAnswers({ ...answers, [question.id]: e.target.value })
                          }
                          className="mr-2"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                {question.questionType === 'true_false' && (
                  <div className="space-y-2">
                    {['True', 'False'].map((option) => (
                      <label
                        key={option}
                        className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) =>
                            setAnswers({ ...answers, [question.id]: e.target.value })
                          }
                          className="mr-2"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
                {question.questionType === 'short_answer' && (
                  <input
                    type="text"
                    value={answers[question.id] || ''}
                    onChange={(e) =>
                      setAnswers({ ...answers, [question.id]: e.target.value })
                    }
                    className="input-field"
                    placeholder="Enter your answer"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-end">
            <button onClick={handleSubmitQuiz} className="btn-primary">
              Submit Quiz
            </button>
          </div>
        </div>
      ) : (
        <>
          {quizzes.length === 0 ? (
            <div className="card text-center py-12">
              <FiCheckSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No quizzes found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="card">
                  <h3 className="text-xl font-semibold mb-2">{quiz.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{quiz.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>Time Limit: {quiz.timeLimit} minutes</span>
                    <span>Max Score: {quiz.maxScore}</span>
                  </div>
                  {(user?.role === 'teacher' || user?.role === 'admin') && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditQuiz(quiz.id)} className="btn-secondary text-sm inline-flex items-center gap-1">
                        <FiEdit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => setPendingDeleteQuiz({ id: quiz.id, title: quiz.title })}
                        className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 inline-flex items-center gap-1"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                  {user?.role === 'student' && (
                    <div className="flex items-center justify-between">
                      {quiz.lastAttempt ? (
                        <span className="text-sm">
                          Best Score: {quiz.lastAttempt.score}/{quiz.maxScore}
                        </span>
                      ) : (
                        <button onClick={() => startQuiz(quiz.id)} className="btn-primary">
                          Start Quiz
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateQuiz} className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-semibold">{editingQuizId ? 'Edit Quiz' : 'Create Quiz'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                required
                value={createForm.courseId}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, courseId: e.target.value }))}
                className="input-field"
              >
                <option value="">Select Course</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
              </select>
              <input required value={createForm.title} onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))} placeholder="Quiz title" className="input-field" />
            </div>
            <textarea value={createForm.description} onChange={(e) => setCreateForm((prev) => ({ ...prev, description: e.target.value }))} rows={3} placeholder="Quiz description" className="input-field" />
            <div className="grid grid-cols-2 gap-4">
              <input type="number" min="1" value={createForm.timeLimit} onChange={(e) => setCreateForm((prev) => ({ ...prev, timeLimit: Number(e.target.value) }))} className="input-field" placeholder="Time limit (minutes)" />
              <input type="number" min="1" value={createForm.maxScore} onChange={(e) => setCreateForm((prev) => ({ ...prev, maxScore: Number(e.target.value) }))} className="input-field" placeholder="Max score" />
            </div>

            <div className="p-4 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50/40 dark:bg-primary-900/20 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FiCpu className="w-4 h-4" />
                AI Question Generator
              </h3>
              <input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Topic e.g. JavaScript ES6, OOP, DBMS normalization"
                className="input-field"
              />
              <div className="grid grid-cols-4 gap-3">
                <select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)} className="input-field">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <select value={aiMode} onChange={(e) => setAiMode(e.target.value)} className="input-field">
                  <option value="fast">Fast</option>
                  <option value="accurate">Accurate</option>
                  <option value="exam">Exam-style</option>
                </select>
                <input type="number" min="1" max="10" value={aiCount} onChange={(e) => setAiCount(Number(e.target.value))} className="input-field" />
                <button type="button" onClick={handleGenerateQuestions} disabled={aiGenerating} className="btn-primary disabled:opacity-50">
                  {aiGenerating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {createForm.questions.map((q, index) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Question {index + 1}</h3>
                    {createForm.questions.length > 1 && (
                      <button type="button" onClick={() => removeQuestion(index)} className="text-red-500">
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <input value={q.question} onChange={(e) => handleQuestionChange(index, 'question', e.target.value)} placeholder="Question text" className="input-field" required />
                  <div className="grid grid-cols-2 gap-3">
                    <select value={q.questionType} onChange={(e) => handleQuestionChange(index, 'questionType', e.target.value)} className="input-field">
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">True/False</option>
                      <option value="short_answer">Short Answer</option>
                    </select>
                    <input type="number" min="1" value={q.points} onChange={(e) => handleQuestionChange(index, 'points', e.target.value)} className="input-field" placeholder="Points" />
                  </div>
                  {q.questionType === 'multiple_choice' && (
                    <div className="grid grid-cols-2 gap-3">
                      {q.options.map((opt, optIndex) => (
                        <input
                          key={optIndex}
                          value={opt}
                          onChange={(e) => {
                            const options = [...q.options];
                            options[optIndex] = e.target.value;
                            handleQuestionChange(index, 'options', options);
                          }}
                          placeholder={`Option ${optIndex + 1}`}
                          className="input-field"
                        />
                      ))}
                    </div>
                  )}
                  <input value={q.correctAnswer} onChange={(e) => handleQuestionChange(index, 'correctAnswer', e.target.value)} placeholder="Correct answer" className="input-field" required />
                </div>
              ))}
            </div>

            <button type="button" onClick={addQuestion} className="btn-secondary inline-flex items-center gap-2">
              <FiPlus className="w-4 h-4" />
              Add Question
            </button>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingQuizId(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" disabled={createLoading} className="btn-primary disabled:opacity-50">
                {createLoading ? 'Saving...' : editingQuizId ? 'Update Quiz' : 'Create Quiz'}
              </button>
            </div>
          </form>
        </div>
      )}

      {pendingDeleteQuiz && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Delete Quiz</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to delete <strong>{pendingDeleteQuiz.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPendingDeleteQuiz(null)}
                disabled={deleteLoading}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteQuiz}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quizzes;

