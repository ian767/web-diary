import React from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import './WeeklyCalendar.css';

const WeeklyCalendar = ({ selectedDate, onDateChange, entries = [], viewType = 'weekly' }) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Count entries per day
  const entriesByDate = {};
  entries.forEach(entry => {
    const entryDate = format(new Date(entry.date), 'yyyy-MM-dd');
    entriesByDate[entryDate] = (entriesByDate[entryDate] || 0) + 1;
  });

  const isDailyView = viewType === 'daily';

  return (
    <div className={`weekly-calendar ${isDailyView ? 'daily-view' : 'weekly-view'}`}>
      <div className="week-header">
        {weekDays.map((day, index) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const entryCount = entriesByDate[dayKey] || 0;
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={index}
              className={`week-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${isDailyView ? 'daily-day' : ''}`}
              onClick={() => onDateChange(day)}
              spellCheck="false"
            >
              <div className="day-name" spellCheck="false">{format(day, 'EEE')}</div>
              <div className="day-number">{format(day, 'd')}</div>
              {entryCount > 0 && (
                <div className="entry-indicator">
                  <span className="entry-count-number">{entryCount}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyCalendar;


