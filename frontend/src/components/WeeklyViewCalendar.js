import React from 'react';
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, startOfMonth, endOfMonth, isSameWeek, isWithinInterval } from 'date-fns';
import './WeeklyViewCalendar.css';

const WeeklyViewCalendar = ({ selectedDate, onDateChange, entries = [] }) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  
  // Get all weeks in the month
  const weeks = eachWeekOfInterval(
    { start: monthStart, end: monthEnd },
    { weekStartsOn: 1 }
  );

  // Count entries per week
  const entriesByWeek = {};
  entries.forEach(entry => {
    const entryDate = new Date(entry.date);
    weeks.forEach((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      if (isWithinInterval(entryDate, { start: weekStart, end: weekEnd })) {
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        entriesByWeek[weekKey] = (entriesByWeek[weekKey] || 0) + 1;
      }
    });
  });

  const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });

  return (
    <div className="weekly-view-calendar">
      <div className="weeks-grid">
        {weeks.map((weekStart, index) => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const weekKey = format(weekStart, 'yyyy-MM-dd');
          const entryCount = entriesByWeek[weekKey] || 0;
          const isSelected = isSameWeek(weekStart, currentWeekStart, { weekStartsOn: 1 });
          
          return (
            <div
              key={index}
              className={`week-block ${isSelected ? 'selected' : ''}`}
              onClick={() => onDateChange(weekStart)}
            >
              <div className="week-label">
                Week {index + 1}
              </div>
              <div className="week-dates">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
              </div>
              <div className="week-entry-indicator">
                {entryCount > 0 ? (
                  <span className="week-entry-count">{entryCount}</span>
                ) : (
                  <span className="week-entry-empty">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyViewCalendar;

