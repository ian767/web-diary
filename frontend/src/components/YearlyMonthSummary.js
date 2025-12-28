import React from 'react';
import { format, startOfYear, eachMonthOfInterval, isSameMonth } from 'date-fns';
import './YearlyMonthSummary.css';

// Helper function for mood emoji
const getMoodEmoji = (mood) => {
  const moodEmojis = {
    happy: '😊',
    sad: '😢',
    angry: '😡',
    tired: '😴',
    excited: '😍',
    thoughtful: '🤔',
    cool: '😎',
    celebrating: '🥳',
    blessed: '😇',
    hungry: '😋',
  };
  return moodEmojis[mood] || '😊';
};

// Calculate dominant mood for a month
const getDominantMood = (monthEntries) => {
  if (!monthEntries || monthEntries.length === 0) return null;
  
  const moodCounts = {};
  monthEntries.forEach(entry => {
    if (entry.mood) {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    }
  });
  
  if (Object.keys(moodCounts).length === 0) return null;
  
  const dominantMood = Object.keys(moodCounts).reduce((a, b) => 
    moodCounts[a] > moodCounts[b] ? a : b
  );
  
  return dominantMood;
};

const YearlyMonthSummary = ({ selectedDate, entries = [], onMonthClick }) => {
  const yearStart = startOfYear(selectedDate);
  const months = eachMonthOfInterval({
    start: yearStart,
    end: new Date(selectedDate.getFullYear(), 11, 31)
  });

  // Group entries by month
  const entriesByMonth = {};
  entries.forEach(entry => {
    const entryMonth = format(new Date(entry.date), 'yyyy-MM');
    if (!entriesByMonth[entryMonth]) {
      entriesByMonth[entryMonth] = [];
    }
    entriesByMonth[entryMonth].push(entry);
  });

  // Calculate total entries for the year
  const totalEntries = entries.length;
  const monthsWithEntries = Object.keys(entriesByMonth).length;

  return (
    <div className="yearly-month-summary">
      <div className="yearly-summary-header">
        <h2>{format(selectedDate, 'yyyy')} Overview</h2>
        <div className="yearly-stats">
          <span className="yearly-stat-item">
            <strong>{totalEntries}</strong> entries
          </span>
          <span className="yearly-stat-item">
            <strong>{monthsWithEntries}</strong> active months
          </span>
        </div>
      </div>

      {totalEntries === 0 ? (
        <div className="yearly-empty-state">
          <p>No entries for {format(selectedDate, 'yyyy')} yet.</p>
          <p className="yearly-empty-hint">Start writing to see your year in review!</p>
        </div>
      ) : (
        <div className="yearly-months-grid">
          {months.map((month, index) => {
            const monthKey = format(month, 'yyyy-MM');
            const monthEntries = entriesByMonth[monthKey] || [];
            const entryCount = monthEntries.length;
            const dominantMood = getDominantMood(monthEntries);
            const isSelected = isSameMonth(month, selectedDate);

            return (
              <div
                key={index}
                className={`yearly-month-card ${isSelected ? 'selected' : ''} ${entryCount > 0 ? 'has-entries' : 'no-entries'}`}
                onClick={() => onMonthClick && onMonthClick(month)}
              >
                <div className="yearly-month-header">
                  <h3 className="yearly-month-name">{format(month, 'MMMM')}</h3>
                  {entryCount > 0 && (
                    <span className="yearly-month-count">{entryCount}</span>
                  )}
                </div>
                {entryCount > 0 ? (
                  <div className="yearly-month-details">
                    {dominantMood && (
                      <div className="yearly-month-mood">
                        <span className="yearly-mood-emoji">{getMoodEmoji(dominantMood)}</span>
                        <span className="yearly-mood-label">{dominantMood}</span>
                      </div>
                    )}
                    <div className="yearly-month-hint">Click to view month</div>
                  </div>
                ) : (
                  <div className="yearly-month-empty">No entries</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default YearlyMonthSummary;

