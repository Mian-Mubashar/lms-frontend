import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiSend, FiMessageCircle, FiVolume2 } from 'react-icons/fi';

const getBackendOrigin = () => {
  const baseURL = api.defaults.baseURL || '';
  try {
    const url = new URL(baseURL);
    return `${url.protocol}//${url.host}`;
  } catch {
    return window.location.origin;
  }
};

const resolveAudioUrl = (audioUrl) => {
  if (!audioUrl) {
    return '';
  }
  if (audioUrl.startsWith('data:')) {
    return audioUrl;
  }
  if (/^https?:\/\//i.test(audioUrl)) {
    return audioUrl;
  }
  return `${getBackendOrigin()}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
};

const AIChatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courses, setCourses] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchCourses();
    scrollToBottom();
  }, [messages]);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/courses');
      setCourses(response.data.courses.filter(c => 
        user?.role === 'student' ? c.isEnrolled : true
      ));
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        message: input,
        courseId: selectedCourse || null
      });

      const aiMessage = { role: 'assistant', content: response.data.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to get response from AI';
      toast.error(message);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `I could not process that request right now.\n${message}\nPlease try again in a moment.`
        }
      ]);
      console.error('AI chat error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextToSpeech = async (text) => {
    try {
      toast.loading('Converting to speech...', { id: 'tts' });
      const response = await api.post('/ai/text-to-speech', { 
        text,
        provider: 'openai'
      });
      
      const audioSrc = resolveAudioUrl(response.data.audioUrl);
      if (!audioSrc) {
        throw new Error('Audio URL is missing');
      }

      const audio = new Audio(audioSrc);
      audio.onended = () => {
        toast.dismiss('tts');
      };
      audio.onerror = () => {
        toast.error('Failed to play audio', { id: 'tts' });
      };
      audio.play();
      toast.success('Playing audio (OpenAI)', { id: 'tts' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to convert text to speech', { id: 'tts' });
      console.error('TTS error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Assistant</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Get help with your courses using our AI-powered chatbot
        </p>
      </div>

      <div className="card p-0 overflow-hidden">
        {/* Course Selection */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-2">Select Course (Optional)</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="input-field"
            >
              <option value="">General Questions</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <FiMessageCircle className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Start a conversation with the AI assistant
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.role === 'assistant' && (
                  <div className="mt-2 flex items-center space-x-2">
                    <button
                      onClick={() => handleTextToSpeech(message.content)}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center px-2 py-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900"
                      title="Listen with OpenAI TTS"
                    >
                      <FiVolume2 className="w-4 h-4 mr-1" />
                      OpenAI
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 input-field"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary disabled:opacity-50"
            >
              <FiSend className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIChatbot;

