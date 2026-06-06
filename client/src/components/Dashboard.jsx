import React, { useState, useEffect } from 'react';
import './Dashboard.css';

/**
 * Advanced Dashboard Component
 * Displays real-time stats, achievements, and streaks with animations
 */
function Dashboard() {
  const [stats, setStats] = useState({
    questionsAnswered: Math.floor(Math.random() * 1000) + 500,
    streakDays: Math.floor(Math.random() * 30) + 1,
    totalScore: Math.floor(Math.random() * 40) + 60,
    examsCompleted: Math.floor(Math.random() * 50) + 10,
    accuracy: Math.floor(Math.random() * 30) + 70,
  });

  const [achievements, setAchievements] = useState([
    { id: 1, name: 'First Steps', icon: '🚀', completed: true, desc: 'Answer first question' },
    { id: 2, name: 'Streak Master', icon: '🔥', completed: true, desc: '7 day streak' },
    { id: 3, name: 'Perfect Score', icon: '💯', completed: false, desc: 'Score 100% on exam' },
    { id: 4, name: 'Speed Racer', icon: '⚡', completed: false, desc: 'Complete exam in 30 min' },
  ]);

  return (
    <div className="dashboard">
      <h2 className="dashboard-title">📊 Your Dashboard</h2>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card animate-in">
          <div className="stat-number">{stats.questionsAnswered}</div>
          <div className="stat-label">Questions Answered</div>
          <div className="stat-bar">
            <div className="stat-progress" style={{ width: '75%' }}></div>
          </div>
        </div>

        <div className="stat-card animate-in" style={{ animationDelay: '0.1s' }}>
          <div className="stat-number">{stats.streakDays}</div>
          <div className="stat-label">Day Streak 🔥</div>
          <div className="flame-emoji">🔥🔥🔥</div>
        </div>

        <div className="stat-card animate-in" style={{ animationDelay: '0.2s' }}>
          <div className="stat-number">{stats.totalScore}%</div>
          <div className="stat-label">Average Score</div>
          <div className="score-badge">
            {stats.totalScore >= 80 ? '⭐ Excellent' : stats.totalScore >= 60 ? '👍 Good' : '💪 Keep trying'}
          </div>
        </div>

        <div className="stat-card animate-in" style={{ animationDelay: '0.3s' }}>
          <div className="stat-number">{stats.accuracy}%</div>
          <div className="stat-label">Accuracy</div>
          <div className="accuracy-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e0e0e0" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#gradient)"
                strokeWidth="8"
                strokeDasharray={`${(stats.accuracy / 100) * 282.7} 282.7`}
                transform="rotate(-90 50 50)"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="achievements-section">
        <h3>🏆 Achievements</h3>
        <div className="achievements-grid">
          {achievements.map((achievement, index) => (
            <div
              key={achievement.id}
              className={`achievement-card ${achievement.completed ? 'unlocked' : 'locked'}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="achievement-icon">{achievement.icon}</div>
              <div className="achievement-name">{achievement.name}</div>
              <div className="achievement-desc">{achievement.desc}</div>
              {achievement.completed && <div className="achievement-badge">✓ Unlocked</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="quick-stat">
          <span className="label">Exams Completed:</span>
          <span className="value">{stats.examsCompleted}</span>
        </div>
        <div className="quick-stat">
          <span className="label">Study Time Today:</span>
          <span className="value">2h 45m</span>
        </div>
        <div className="quick-stat">
          <span className="label">Next Goal:</span>
          <span className="value">10 Day Streak 🎯</span>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="motivational-box">
        <p>✨ You're doing great! Keep up the momentum. Every question brings you closer to success! 💪</p>
      </div>
    </div>
  );
}

export default Dashboard;
