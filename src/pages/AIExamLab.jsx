import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiCpu, FiFileText, FiCheckSquare, FiTarget } from 'react-icons/fi';

const AIExamLab = () => {
  const [mode, setMode] = useState('generate');
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [promptContext, setPromptContext] = useState('');
  const [question, setQuestion] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    setLoading(true);
    try {
      const payload =
        mode === 'generate'
          ? { mode, topic, level, promptContext }
          : { mode, question, studentAnswer };
      const response = await api.post('/ai/exam-lab', payload);
      setResult(response.data);
      toast.success(`AI Exam Lab complete (${response.data.source || 'ai'})`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to run AI Exam Lab');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-indigo-900 to-primary-900 text-white border border-indigo-700/40">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FiCpu className="w-7 h-7" />
          AI Exam Lab
        </h1>
        <p className="text-indigo-100 mt-2">Advanced scenario generation and AI-powered answer evaluation.</p>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setMode('generate');
              setResult(null);
            }}
            className={`p-3 rounded-lg border ${mode === 'generate' ? 'bg-primary-100 dark:bg-primary-900 border-primary-400' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
          >
            Generate Scenario
          </button>
          <button
            onClick={() => {
              setMode('evaluate');
              setResult(null);
            }}
            className={`p-3 rounded-lg border ${mode === 'evaluate' ? 'bg-primary-100 dark:bg-primary-900 border-primary-400' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}
          >
            Evaluate Answer
          </button>
        </div>

        {mode === 'generate' ? (
          <div className="space-y-3">
            <input value={topic} onChange={(e) => setTopic(e.target.value)} className="input-field" placeholder="Topic (e.g., DB indexing strategies)" />
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="input-field">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <textarea
              value={promptContext}
              onChange={(e) => setPromptContext(e.target.value)}
              className="input-field"
              rows={4}
              placeholder="Context (optional): class profile, exam pattern, expected complexity..."
            />
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="input-field"
              rows={4}
              placeholder="Paste question/scenario"
            />
            <textarea
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              className="input-field"
              rows={6}
              placeholder="Paste student answer"
            />
          </div>
        )}

        <button onClick={run} disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? 'Running...' : mode === 'generate' ? 'Generate with AI Exam Lab' : 'Evaluate with AI Exam Lab'}
        </button>
      </div>

      {result && mode === 'generate' && (
        <div className="space-y-4">
          <Card title={result.title} icon={FiFileText}>
            <p className="text-sm">{result.scenario}</p>
          </Card>
          <ListCard title="Tasks" icon={FiTarget} items={result.tasks} />
          <ListCard title="Rubric" icon={FiCheckSquare} items={result.rubric} />
        </div>
      )}

      {result && mode === 'evaluate' && (
        <div className="space-y-4">
          <Card title={`Score: ${result.score}/100`} icon={FiCheckSquare}>
            <p className="text-sm">{result.feedback}</p>
          </Card>
          <ListCard title="Strengths" icon={FiTarget} items={result.strengths} />
          <ListCard title="Improvements" icon={FiFileText} items={result.improvements} />
        </div>
      )}
    </div>
  );
};

const Card = ({ title, icon: Icon, children }) => (
  <div className="card">
    <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
      <Icon className="w-5 h-5 text-primary-600" />
      {title}
    </h3>
    {children}
  </div>
);

const ListCard = ({ title, icon: Icon, items = [] }) => (
  <div className="card">
    <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
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

export default AIExamLab;

