import { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiEdit3, FiCheckCircle } from 'react-icons/fi';

const GradeStudents = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    fetchPendingSubmissions();
  }, []);

  const fetchPendingSubmissions = async () => {
    setLoading(true);
    try {
      const assignmentResponse = await api.get('/assignments');
      const assignments = assignmentResponse.data.assignments || [];

      const details = await Promise.all(
        assignments.map(async (assignment) => {
          try {
            const detailResponse = await api.get(`/assignments/${assignment.id}`);
            return detailResponse.data.assignment;
          } catch {
            return null;
          }
        })
      );

      const rows = [];
      details.filter(Boolean).forEach((assignment) => {
        const submissions = Array.isArray(assignment.submissions) ? assignment.submissions : [];
        submissions
          .filter((submission) => submission.score === null || submission.score === undefined)
          .forEach((submission) => {
            rows.push({
              assignmentId: assignment.id,
              assignmentTitle: assignment.title,
              maxScore: assignment.maxScore || 100,
              submissionId: submission.id,
              studentName: `${submission.firstName} ${submission.lastName}`,
              studentEmail: submission.email,
              submittedAt: submission.submittedAt,
              submissionText: submission.submissionText || '',
              existingFeedback: submission.feedback || ''
            });
          });
      });

      setPending(rows);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load pending submissions');
    } finally {
      setLoading(false);
    }
  };

  const openGradeModal = (row) => {
    setSelected(row);
    setScore('');
    setFeedback(row.existingFeedback || '');
  };

  const submitGrade = async (e) => {
    e.preventDefault();
    if (!selected) {
      return;
    }
    const numericScore = Number(score);
    if (Number.isNaN(numericScore) || numericScore < 0 || numericScore > selected.maxScore) {
      toast.error(`Score must be between 0 and ${selected.maxScore}`);
      return;
    }

    setGrading(true);
    try {
      await api.put(`/assignments/${selected.assignmentId}/grade`, {
        submissionId: selected.submissionId,
        score: numericScore,
        feedback: feedback.trim()
      });
      toast.success('Submission graded successfully');
      setSelected(null);
      fetchPendingSubmissions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to grade submission');
    } finally {
      setGrading(false);
    }
  };

  const pendingCount = pending.length;
  const recentPending = useMemo(() => {
    return [...pending]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 12);
  }, [pending]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Grade Students</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and grade pending assignment submissions.</p>
      </div>

      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending Submissions</p>
            <p className="text-3xl font-bold">{pendingCount}</p>
          </div>
          <button onClick={fetchPendingSubmissions} className="btn-secondary text-sm">
            Refresh
          </button>
        </div>
      </div>

      {recentPending.length === 0 ? (
        <div className="card text-center py-12">
          <FiCheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No pending submissions right now.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4">Student</th>
                <th className="text-left py-3 px-4">Assignment</th>
                <th className="text-left py-3 px-4">Submitted</th>
                <th className="text-left py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentPending.map((row) => (
                <tr key={row.submissionId} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-4">
                    <p className="font-medium">{row.studentName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{row.studentEmail}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium">{row.assignmentTitle}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Max: {row.maxScore}</p>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                    {new Date(row.submittedAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <button onClick={() => openGradeModal(row)} className="btn-primary text-sm inline-flex items-center gap-2">
                      <FiEdit3 className="w-4 h-4" />
                      Grade
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={submitGrade} className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Grade Submission</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>{selected.studentName}</strong> - {selected.assignmentTitle}
            </p>
            <textarea
              value={selected.submissionText}
              readOnly
              rows={6}
              className="input-field"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="number"
                min="0"
                max={selected.maxScore}
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="input-field"
                placeholder={`Score (0-${selected.maxScore})`}
                required
              />
              <input
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="input-field"
                placeholder="Feedback"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setSelected(null)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={grading} className="btn-primary disabled:opacity-50">
                {grading ? 'Saving...' : 'Save Grade'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default GradeStudents;

