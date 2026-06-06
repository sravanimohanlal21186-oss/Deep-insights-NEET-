import React, { useState, useEffect } from 'react';
import './Leaderboard.css';

/**
 * Real-time Leaderboard Component
 * Display top performers with animated rankings
 */
function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: 'Arjun Kumar', score: 98, streak: 45, avatar: '🎓' },
    { rank: 2, name: 'Priya Sharma', score: 96, streak: 38, avatar: '📚' },
    { rank: 3, name: 'Rohit Patel', score: 94, streak: 32, avatar: '🏆' },
    { rank: 4, name: 'Neha Singh', score: 92, streak: 28, avatar: '⭐' },
    { rank: 5, name: 'You', score: 87, streak: 12, avatar: '👤', isYou: true },
    { rank: 6, name: 'Vikram Rao', score: 85, streak: 15, avatar: '🚀' },
    { rank: 7, name: 'Anjali Das', score: 82, streak: 10, avatar: '💡' },
    { rank: 8, name: 'Karan Nair', score: 79, streak: 8, avatar: '🎯' },
    { rank: 9, name: 'Divya Gupta', score: 76, streak: 6, avatar: '✨' },
    { rank: 10, name: 'Akshay Kumar', score: 72, streak: 4, avatar: '💪' },
  ]);

  const [filter, setFilter] = useState('all'); // 'all', 'weekly', 'monthly'

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#667eea';
  };

  return (
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">🏆 Global Leaderboard</h2>

      {/* Filter Buttons */}
      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Time
        </button>
        <button
          className={`filter-btn ${filter === 'weekly' ? 'active' : ''}`}
          onClick={() => setFilter('weekly')}
        >
          This Week
        </button>
        <button
          className={`filter-btn ${filter === 'monthly' ? 'active' : ''}`}
          onClick={() => setFilter('monthly')}
        >
          This Month
        </button>
      </div>

      {/* Leaderboard Table */}
      <div className="leaderboard-wrapper">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
              <th>Streak</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player, index) => (
              <tr
                key={player.rank}
                className={`leaderboard-row ${player.rank <= 3 ? 'top-rank' : ''} ${player.isYou ? 'current-user' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <td className="rank-cell">
                  <span
                    className="rank-badge"
                    style={{ background: getRankColor(player.rank) }}
                  >
                    {getMedalEmoji(player.rank)}
                  </span>
                </td>
                <td className="player-cell">
                  <div className="player-info">
                    <span className="player-avatar">{player.avatar}</span>
                    <span className={`player-name ${player.isYou ? 'you' : ''}`}>
                      {player.name}
                      {player.isYou && <span className="you-badge">You</span>}
                    </span>
                  </div>
                </td>
                <td className="score-cell">
                  <span className="score-value">{player.score}</span>
                  <span className="score-max">/100</span>
                </td>
                <td className="streak-cell">
                  <div className="streak-display">
                    <span className="streak-fire">🔥</span>
                    <span className="streak-number">{player.streak}</span>
                  </div>
                </td>
                <td className="trend-cell">
                  <span className="trend-up">📈</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Motivational Stats */}
      <div className="leaderboard-stats">
        <div className="stat-box">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-label">Active Players</div>
            <div className="stat-value">45,234</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <div className="stat-label">Questions Today</div>
            <div className="stat-value">1.2M</div>
          </div>
        </div>
        <div className="stat-box">
          <div className="stat-icon">🎯</div>
          <div className="stat-info">
            <div className="stat-label">Avg Score</div>
            <div className="stat-value">76%</div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="leaderboard-cta">
        <p>🚀 You're 4 positions away from the top 5!</p>
        <button className="cta-button">Keep Practicing</button>
      </div>
    </div>
  );
}

export default Leaderboard;
