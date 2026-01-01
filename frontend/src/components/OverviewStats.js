import React from 'react';
import { format } from 'date-fns';
import './OverviewStats.css';

const getMoodEmoji = (mood) => {
  const moodEmojis = {
    happy: '😊',
    sad: '😢',
    angry: '😡',
    tired: '😴',
    excited: '😍',
    thoughtful: '🤔',
    calm: '😌',
    anxious: '😰',
    grateful: '🙏',
  };
  return moodEmojis[mood] || '😊';
};

const OverviewStats = ({ stats, onMonthClick, onMoodClick, onTagClick }) => {
  const { totalEntries, entriesThisWeek, entriesThisMonth, mostCommonMood, entriesByMonth, moodFrequency, tagFrequency } = stats;

  // Get top moods (sorted by frequency)
  const topMoods = Object.entries(moodFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([mood, count]) => ({ mood, count }));

  // Get top tags (sorted by frequency)
  const topTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Find max count for bar scaling
  const maxMonthCount = entriesByMonth.length > 0 
    ? Math.max(...entriesByMonth.map(m => m.count), 1)
    : 1;

  return (
    <div className="overview-stats">
      {/* Summary Cards */}
      <div className="stats-summary-grid">
        <div className="stat-card clickable" onClick={() => onMonthClick && onMonthClick(null)}>
          <div className="stat-value">{totalEntries}</div>
          <div className="stat-label">Total Entries</div>
        </div>
        <div className="stat-card clickable" onClick={() => onMonthClick && onMonthClick(new Date())}>
          <div className="stat-value">{entriesThisWeek}</div>
          <div className="stat-label">This Week</div>
        </div>
        <div className="stat-card clickable" onClick={() => onMonthClick && onMonthClick(new Date())}>
          <div className="stat-value">{entriesThisMonth}</div>
          <div className="stat-label">This Month</div>
        </div>
        {mostCommonMood && (
          <div className="stat-card clickable" onClick={() => onMoodClick && onMoodClick(mostCommonMood)}>
            <div className="stat-value">{getMoodEmoji(mostCommonMood)}</div>
            <div className="stat-label">Most Common Mood</div>
          </div>
        )}
      </div>

      {/* Entries by Month */}
      {entriesByMonth.length > 0 && (
        <div className="stats-section">
          <h3 className="stats-section-title">Entries by Month</h3>
          <div className="month-bars">
            {entriesByMonth.map(({ month, label, count, date }) => (
              <div
                key={month}
                className="month-bar-item clickable"
                onClick={() => onMonthClick && onMonthClick(date)}
                title={`${count} entries in ${label}`}
              >
                <div className="month-bar-label">{label}</div>
                <div className="month-bar-container">
                  <div
                    className="month-bar-fill"
                    style={{ width: `${(count / maxMonthCount) * 100}%` }}
                  >
                    <span className="month-bar-value">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Moods */}
      {topMoods.length > 0 && (
        <div className="stats-section">
          <h3 className="stats-section-title">Top Moods</h3>
          <div className="mood-list">
            {topMoods.map(({ mood, count }) => (
              <div
                key={mood}
                className="mood-item clickable"
                onClick={() => onMoodClick && onMoodClick(mood)}
              >
                <span className="mood-emoji">{getMoodEmoji(mood)}</span>
                <span className="mood-label">{mood}</span>
                <span className="mood-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Tags */}
      {topTags.length > 0 && (
        <div className="stats-section">
          <h3 className="stats-section-title">Top Tags</h3>
          <div className="tag-list">
            {topTags.map(({ tag, count }) => (
              <div
                key={tag}
                className="tag-item clickable"
                onClick={() => onTagClick && onTagClick(tag)}
              >
                <span className="tag-name">#{tag}</span>
                <span className="tag-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OverviewStats;

