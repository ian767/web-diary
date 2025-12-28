import React from 'react';
import { format, startOfYear, eachMonthOfInterval, isSameMonth } from 'date-fns';
import './YearlyCalendar.css';

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

const YearlyCalendar = ({ selectedDate, onDateChange, entries = [] }) => {
  const yearStart = startOfYear(selectedDate);
  const months = eachMonthOfInterval({
    start: yearStart,
    end: new Date(selectedDate.getFullYear(), 11, 31)
  });

  // Group entries by month and calculate stats
  const entriesByMonth = {};
  entries.forEach(entry => {
    const entryMonth = format(new Date(entry.date), 'yyyy-MM');
    if (!entriesByMonth[entryMonth]) {
      entriesByMonth[entryMonth] = [];
    }
    entriesByMonth[entryMonth].push(entry);
  });

  return (
    <div className="yearly-calendar">
      <div className="year-header">
        <h3>{format(selectedDate, 'yyyy')}</h3>
      </div>
      <div className="months-grid">
        {months.map((month, index) => {
          const monthKey = format(month, 'yyyy-MM');
          const monthEntries = entriesByMonth[monthKey] || [];
          const entryCount = monthEntries.length;
          const dominantMood = getDominantMood(monthEntries);
          const isSelected = isSameMonth(month, selectedDate);
          
          return (
            <div
              key={index}
              className={`month-cell ${isSelected ? 'selected' : ''} ${entryCount > 0 ? 'has-entries' : ''}`}
              onClick={() => onDateChange(month)}
            >
              <div className="month-name">{format(month, 'MMMM')}</div>
              <div className="month-entry-indicator">
                {entryCount > 0 ? (
                  <>
                    <span className="month-entry-badge">{entryCount}</span>
                    {dominantMood && (
                      <span className="month-mood-indicator" title={`Dominant mood: ${dominantMood}`}>
                        {getMoodEmoji(dominantMood)}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="month-entry-empty">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default YearlyCalendar;


