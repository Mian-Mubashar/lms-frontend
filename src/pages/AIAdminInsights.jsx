import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiTrendingUp, FiCopy, FiRefreshCw } from 'react-icons/fi';

const AIAdminInsights = () => {
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/ai/admin/platform-brief', { focus });
      setResult(data);
      toast.success(`Brief ready (${data.source || 'ai'})`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not generate brief');
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-slate-900 to-primary-900 text-white border border-primary-700/30">
        <div className="flex items-center gap-3 mb-2">
          <FiTrendingUp className="w-6 h-6 shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-bold">AI Platform Insights</h1>
        </div>
        <p className="text-primary-100 text-sm sm:text-base max-w-3xl">
          Live stats from your database: executive summary, priorities, watchlist, and next steps for administrators.
        </p>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Optional focus / question (e.g. exam week prep, enrollment growth)
          </label>
          <textarea
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            rows={2}
            className="input-field"
            placeholder="Leave empty for a general platform brief."
          />
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          {loading ? 'Generating…' : 'Generate insights'}
        </button>
      </div>

      {result?.snapshot ? (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Live snapshot</h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Users</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">{result.snapshot.totalUsers}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Courses</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">{result.snapshot.totalCourses}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Enrollments</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">{result.snapshot.totalEnrollments}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Active students</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">{result.snapshot.activeStudents}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Ungraded submissions</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">{result.snapshot.ungradedSubmissions}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">New users (7d)</dt>
              <dd className="font-semibold text-gray-900 dark:text-white">{result.snapshot.newUsersLast7Days}</dd>
            </div>
          </dl>
        </div>
      ) : null}

      {result ? (
        <div className="card space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{result.title}</h2>
            <button
              type="button"
              onClick={() =>
                copyText(
                  [result.title, '', result.executiveSummary, '', 'Priorities:', ...(result.priorities || []).map((p, i) => `${i + 1}. ${p}`)].join('\n'),
                  'Brief'
                )
              }
              className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
            >
              <FiCopy className="w-4 h-4" /> Copy brief
            </button>
          </div>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{result.executiveSummary}</p>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Priorities</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
              {(result.priorities || []).map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Watchlist</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
              {(result.watchlist || []).map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Next steps</h3>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-300">
              {(result.nextSteps || []).map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AIAdminInsights;
