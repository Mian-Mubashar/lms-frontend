import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiEdit3, FiCopy } from 'react-icons/fi';

const AIAdminAnnouncements = () => {
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('all_users');
  const [tone, setTone] = useState('professional');
  const [context, setContext] = useState('');
  const [channel, setChannel] = useState('in-app');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generate = async () => {
    if (!topic.trim()) {
      toast.error('Enter a topic (e.g. maintenance Saturday 2am)');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/ai/admin/announcement-draft', {
        topic: topic.trim(),
        audience,
        tone,
        context,
        channel
      });
      setResult(data);
      toast.success(
        `Draft ready (${data.source || 'ai'})${data.note ? ` — ${data.note}` : ''}`
      );
    } catch (e) {
      const msg =
        e.response?.data?.error || e.response?.data?.message || 'Could not draft announcement';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-indigo-900 to-slate-900 text-white border border-indigo-700/30">
        <div className="flex items-center gap-3 mb-2">
          <FiEdit3 className="w-6 h-6 shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-bold">AI Announcement Studio</h1>
        </div>
        <p className="text-indigo-100 text-sm sm:text-base max-w-3xl">
          Maintenance windows, policy updates, events — pick audience and tone, then get a clear draft to edit and send.
        </p>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Topic *</label>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="input-field"
            placeholder="e.g. Scheduled maintenance — Dec 14, 2:00–4:00 AM"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Audience</label>
            <select value={audience} onChange={(e) => setAudience(e.target.value)} className="input-field">
              <option value="all_users">All users</option>
              <option value="students">Students</option>
              <option value="teachers">Teachers</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tone</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="input-field">
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Channel hint</label>
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className="input-field">
            <option value="in-app">In-app banner / notice</option>
            <option value="email">Email</option>
            <option value="sms">SMS / short push</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Extra context (optional)</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
            className="input-field"
            placeholder="Links, exact times, support contact, …"
          />
        </div>
        <button type="button" onClick={generate} disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? 'Drafting…' : 'Generate draft'}
        </button>
      </div>

      {result ? (
        <div className="card space-y-4">
          {result.note ? (
            <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              {result.note}
            </p>
          ) : null}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white pr-4">{result.title}</h2>
            <button
              type="button"
              onClick={() => copy(`${result.title}\n\n${result.body}\n\n—\n${result.shortBlurb}`, 'Full draft')}
              className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 shrink-0"
            >
              <FiCopy className="w-4 h-4" /> Copy all
            </button>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Body</span>
              <button type="button" onClick={() => copy(result.body, 'Body')} className="text-xs text-primary-600">
                Copy
              </button>
            </div>
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
              {result.body}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Short blurb (SMS / preview)</span>
              <button type="button" onClick={() => copy(result.shortBlurb, 'Blurb')} className="text-xs text-primary-600">
                Copy
              </button>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50">
              {result.shortBlurb}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AIAdminAnnouncements;
