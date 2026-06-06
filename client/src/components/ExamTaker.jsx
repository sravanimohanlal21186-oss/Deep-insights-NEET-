import React, { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from 'react-query';
import offlineDB from '../utils/offlineDB';
import './ExamTaker.css';

/**
 * Modern Exam Taker Component with Offline Support
 */
const ExamTaker = ({ examId }) => {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load questions from cache or network
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        let qs = [];

        if (isOnline) {
          // Fetch from server
          const res = await fetch(`/api/exams/${examId}/questions`);
          if (res.ok) {
            qs = await res.json();
            // Cache for offline
            await offlineDB.cacheData(`exam-${examId}`, qs, 86400);
          }
        } else {
          // Load from cache
          qs = await offlineDB.getCachedData(`exam-${examId}`);
        }

        setQuestions(qs || []);
      } catch (error) {
        console.error('Failed to load questions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [examId, isOnline]);

  // Timer
  useEffect(() => {
    if (submitted || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(t => t - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [submitted, timeLeft]);

  // Online/Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAnswer = useCallback((questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!window.confirm('Submit exam? You cannot change answers after submission.')) {
      return;
    }

    const result = {
      examId,
      answers,
      score: calculateScore(),
      timeTaken: 3600 - timeLeft,
      submittedAt: new Date().toISOString(),
    };

    try {
      if (isOnline) {
        // Submit to server
        const res = await fetch('/api/results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result),
        });

        if (res.ok) {
          setSubmitted(true);
          queryClient.invalidateQueries('results');
        }
      } else {
        // Save for offline submission
        await offlineDB.savePendingResult(result);
        setSubmitted(true);
        alert('Exam saved offline. It will sync when you go online.');
      }
    } catch (error) {
      console.error('Submit failed:', error);
      alert('Failed to submit exam. Please try again.');
    }
  }, [answers, examId, isOnline, queryClient, timeLeft]);

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswer) correct++;
    });
    return Math.round((correct / questions.length) * 100);
  };

  if (loading) return <div className="exam-loading">📚 Loading exam...</div>;

  if (submitted) {
    return (
      <div className="exam-submitted">
        <div className="submitted-card">
          <h2>✅ Exam Submitted Successfully!</h2>
          <p>Your score: <strong>{calculateScore()}%</strong></p>
          <p className="sync-status">
            {isOnline ? '✓ Results synced to server' : '⏳ Will sync when online'}
          </p>
          <button onClick={() => window.location.href = '/results'}>View Results</button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return <div className="exam-error">❌ No questions available</div>;
  }

  const q = questions[currentQuestion];
  const answered = Object.keys(answers).length;

  return (
    <div className="exam-container">
      {/* Header */}
      <div className="exam-header">
        <div className="exam-progress">
          <span className="progress-text">Question {currentQuestion + 1} of {questions.length}</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="exam-stats">
          <span className="stat">
            <span className="stat-icon">⏱️</span>
            <span className="time" style={{ color: timeLeft < 300 ? '#ff6b6b' : '#333' }}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
          </span>
          <span className="stat">
            <span className="stat-icon">✅</span>
            {answered}/{questions.length}
          </span>
          <span className="stat online-status" style={{ color: isOnline ? '#51cf66' : '#ff6b6b' }}>
            {isOnline ? '🟢 Online' : '🔴 Offline'}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="exam-content">
        <h2 className="question-text">{q.question}</h2>

        <div className="options">
          {q.options?.map((option, idx) => (
            <label key={idx} className="option">
              <input
                type="radio"
                name={`question-${currentQuestion}`}
                value={option}
                checked={answers[currentQuestion] === option}
                onChange={(e) => handleAnswer(currentQuestion, e.target.value)}
                disabled={submitted}
              />
              <span className="option-content">
                <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                <span className="option-text">{option}</span>
              </span>
            </label>
          ))}
        </div>

        {q.explanation && answers[currentQuestion] === q.correctAnswer && (
          <div className="explanation">
            <strong>💡 Explanation:</strong>
            <p>{q.explanation}</p>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="exam-footer">
        <button
          className="nav-button"
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
        >
          ← Previous
        </button>

        <div className="question-map">
          {questions.map((_, idx) => (
            <button
              key={idx}
              className={`map-button ${idx === currentQuestion ? 'current' : ''} ${
                answers[idx] ? 'answered' : ''
              }`}
              onClick={() => setCurrentQuestion(idx)}
              title={`Question ${idx + 1}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {currentQuestion === questions.length - 1 ? (
          <button className="submit-button" onClick={handleSubmit}>
            🎯 Submit Exam
          </button>
        ) : (
          <button
            className="nav-button"
            onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamTaker;
