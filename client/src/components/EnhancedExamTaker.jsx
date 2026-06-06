import React, { useState, useEffect, useRef } from 'react';
import './EnhancedExamTaker.css';

/**
 * Enhanced Exam Taker Component with Cool Animations
 * Features: Full-screen mode, real-time timer, question map, offline support
 */
function EnhancedExamTaker() {
  const [examData, setExamData] = useState({
    title: 'NEET Biology - Mock Exam 2026',
    totalQuestions: 50,
    timeLimit: 3600,
    totalMarks: 200,
  });

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(examData.timeLimit);
  const [answers, setAnswers] = useState(new Array(examData.totalQuestions).fill(null));
  const [fullscreen, setFullscreen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const containerRef = useRef(null);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (option) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = option;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    setShowConfetti(true);
    setTimeout(() => alert('Exam submitted successfully!'), 500);
  };

  const getTimeWarning = () => {
    if (timeLeft > 300) return 'safe'; // > 5 min
    if (timeLeft > 60) return 'warning'; // > 1 min
    return 'danger'; // < 1 min
  };

  const progressPercentage = ((currentQuestion + 1) / examData.totalQuestions) * 100;
  const answeredCount = answers.filter(a => a !== null).length;

  return (
    <div
      className={`exam-taker-enhanced ${fullscreen ? 'fullscreen' : ''}`}
      ref={containerRef}
    >
      {/* Confetti Animation */}
      {showConfetti && (
        <div className=\"confetti-container\">
          {[...Array(50)].map((_, i) => (
            <div key={i} className=\"confetti\" style={{ left: Math.random() * 100 + '%' }} />
          ))}
        </div>
      )}

      {/* Header Bar */}
      <div className=\"exam-header\">
        <div className=\"exam-info\">
          <h2>{examData.title}</h2>
          <span className=\"question-counter\">
            Question {currentQuestion + 1}/{examData.totalQuestions}
          </span>
        </div>

        <div className={`timer ${getTimeWarning()}`}>
          <span className=\"timer-icon\">⏱️</span>
          <span className=\"time-display\">{formatTime(timeLeft)}</span>
          {timeLeft < 60 && <span className=\"timer-pulse\">⚠️</span>}
        </div>

        <button
          className=\"fullscreen-btn\"
          onClick={() => setFullscreen(!fullscreen)}
          title=\"Fullscreen\"
        >
          {fullscreen ? '⛌' : '⛶'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className=\"progress-section\">
        <div className=\"progress-info\">
          <span>Progress: {answeredCount}/{examData.totalQuestions} answered</span>
          <span className=\"progress-percentage\">{Math.round(progressPercentage)}%</span>
        </div>
        <div className=\"progress-bar\">
          <div className=\"progress-fill\" style={{ width: `${progressPercentage}%` }} />
        </div>
      </div>

      <div className=\"exam-content\">
        {/* Question Map Sidebar */}
        <div className=\"question-map\">
          <h4>Questions</h4>
          <div className=\"question-grid\">
            {answers.map((answer, index) => (
              <button
                key={index}
                className={`question-btn ${index === currentQuestion ? 'current' : ''} ${
                  answer !== null ? 'answered' : 'unanswered'
                }`}
                onClick={() => setCurrentQuestion(index)}
                title={`Question ${index + 1}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question Section */}
        <div className=\"question-section\">
          {/* Question Text */}
          <div className=\"question-card\">
            <div className=\"question-text\">
              <h3>Question {currentQuestion + 1}</h3>
              <p>
                Which of the following is a characteristic feature of prokaryotic cells?
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua.
              </p>
            </div>

            {/* Options */}
            <div className=\"options-container\">
              {['A', 'B', 'C', 'D'].map((option) => (
                <div
                  key={option}
                  className={`option ${answers[currentQuestion] === option ? 'selected' : ''}`}
                  onClick={() => handleAnswer(option)}
                >
                  <span className=\"option-label\">{option}</span>
                  <span className=\"option-text\">Option {option} content goes here</span>
                </div>
              ))}
            </div>

            {/* Statistics */}
            <div className=\"question-stats\">
              <div className=\"stat\">
                <span className=\"stat-icon\">✓</span>
                <span>{answeredCount} answered</span>
              </div>
              <div className=\"stat\">
                <span className=\"stat-icon\">◯</span>
                <span>{examData.totalQuestions - answeredCount} remaining</span>
              </div>
              <div className=\"stat\">
                <span className=\"stat-icon\">⏱️</span>
                <span>{formatTime(timeLeft)} left</span>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className=\"navigation-buttons\">
            <button
              className=\"nav-btn prev\"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              ← Previous
            </button>

            {currentQuestion === examData.totalQuestions - 1 ? (
              <button className=\"nav-btn submit\" onClick={handleSubmit}>
                ✓ Submit Exam
              </button>
            ) : (
              <button
                className=\"nav-btn next\"
                onClick={() =>
                  setCurrentQuestion(Math.min(examData.totalQuestions - 1, currentQuestion + 1))
                }
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EnhancedExamTaker;
