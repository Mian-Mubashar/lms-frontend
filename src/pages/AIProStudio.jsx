import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiCpu, FiLayers, FiCheckCircle, FiArrowRightCircle, FiCopy } from 'react-icons/fi';

const FEATURES = [
  { id: 'lesson-plan', label: 'Lesson Plan' },
  { id: 'question-bank', label: 'Question Bank' },
  { id: 'intervention-plan', label: 'Intervention Plan' }
];

const AIProStudio = () => {
  const [feature, setFeature] = useState('lesson-plan');
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('students');
  const [level, setLevel] = useState('intermediate');
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generatePlan = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic first');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/ai/pro-studio', {
        feature,
        topic,
        audience,
        level,
        context
      });
      setResult(response.data);
      toast.success(`AI Pro output generated (${response.data.source || 'ai'})`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate AI Pro output');
    } finally {
      setLoading(false);
    }
  };

  const copyAll = async () => {
    if (!result) {
      return;
    }
    const content = [
      result.title,
      '',
      'Sections:',
      ...(result.sections || []).map((s, i) => `${i + 1}. ${s}`),
      '',
      'Checklist:',
      ...(result.checklist || []).map((s, i) => `${i + 1}. ${s}`),
      '',
      'Next Actions:',
      ...(result.nextActions || []).map((s, i) => `${i + 1}. ${s}`)
    ].join('\n');
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-primary-900 to-indigo-900 text-white border border-primary-700/30">
        <div className="flex items-center gap-3 mb-2">
          <FiCpu className="w-6 h-6" />
          <h1 className="text-3xl font-bold">AI Pro Studio</h1>
        </div>
        <p className="text-primary-100">
          Advanced AI workspace for professional teaching workflows.
        </p>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FEATURES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFeature(item.id)}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                feature === item.id
                  ? 'bg-primary-100 dark:bg-primary-900 border-primary-400 text-primary-700 dark:text-primary-200'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="input-field md:col-span-2"
            placeholder="Topic (e.g., React state management)"
          />
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="input-field">
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="input-field"
            placeholder="Audience (students, interns, final year, etc.)"
          />
          <button onClick={generatePlan} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? 'Generating...' : 'Generate AI Pro Output'}
          </button>
        </div>

        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          className="input-field"
          rows={4}
          placeholder="Context (optional): class weaknesses, syllabus goals, assessment style..."
        />
      </div>

      {result && (
        <div className="space-y-4">
          <div className="card flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{result.title}</h2>
            <button onClick={copyAll} className="btn-secondary inline-flex items-center gap-2">
              <FiCopy className="w-4 h-4" />
              Copy
            </button>
          </div>

          <InfoCard title="Structured Sections" icon={FiLayers} items={result.sections} />
          <InfoCard title="Quality Checklist" icon={FiCheckCircle} items={result.checklist} />
          <InfoCard title="Next Actions" icon={FiArrowRightCircle} items={result.nextActions} />
        </div>
      )}
    </div>
  );
};

const InfoCard = ({ title, icon: Icon, items = [] }) => (
  <div className="card">
    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
      <Icon className="w-5 h-5 text-primary-600" />
      {title}
    </h3>
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={`${title}-${index}`} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
          {index + 1}. {item}
        </li>
      ))}
    </ul>
  </div>
);

export default AIProStudio;

