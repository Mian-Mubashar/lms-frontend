import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiCpu, FiTarget, FiCheckCircle, FiClock } from 'react-icons/fi';

const AIStudyCoach = () => {
  const [topic, setTopic] = useState('');
  const [availableHours, setAvailableHours] = useState(2);
  const [goal, setGoal] = useState('Improve quiz scores');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const generateCoachPlan = async () => {
    if (!topic.trim()) {
      toast.error('Please add a topic first');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/ai/study-coach', {
        topic,
        availableHours: Number(availableHours) || 2,
        goal
      });
      setResult(response.data);
      toast.success(`Study coach plan ready (${response.data.source || 'ai'})`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate study plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-green-900 to-primary-900 text-white border border-green-700/40">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FiCpu className="w-7 h-7" />
          AI Study Coach
        </h1>
        <p className="text-green-100 mt-2">Personalized study planning for students with daily focus and revision strategy.</p>
      </div>

      <div className="card space-y-4">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="input-field"
          placeholder="Topic (e.g., OOP in Java, DBMS normalization)"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="number"
            min="1"
            max="12"
            value={availableHours}
            onChange={(e) => setAvailableHours(e.target.value)}
            className="input-field"
            placeholder="Available study hours per day"
          />
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="input-field"
            placeholder="Goal (e.g., improve assignment quality)"
          />
        </div>
        <button onClick={generateCoachPlan} disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? 'Generating...' : 'Generate Study Plan'}
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InfoCard title={result.title || 'Weekly Plan'} icon={FiTarget} items={result.plan} />
          <InfoCard title="Daily Checklist" icon={FiCheckCircle} items={result.checklist} />
          <InfoCard title="Revision Strategy" icon={FiClock} items={result.revisionTips} />
          <InfoCard title="Exam Readiness" icon={FiCpu} items={result.examReadiness} />
        </div>
      )}
    </div>
  );
};

const InfoCard = ({ title, icon: Icon, items = [] }) => (
  <div className="card">
    <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
      <Icon className="w-5 h-5 text-primary-600" />
      {title}
    </h3>
    <ul className="space-y-2">
      {(items || []).map((item, index) => (
        <li key={`${title}-${index}`} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
          {index + 1}. {item}
        </li>
      ))}
    </ul>
  </div>
);

export default AIStudyCoach;

