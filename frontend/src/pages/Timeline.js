import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, isSameMonth } from 'date-fns';
import { diaryAPI } from '../services/api';
import './Timeline.css';

/**
 * Timeline View
 * Displays diary entries chronologically with date grouping
 */
const Timeline = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadEntries(true);
  }, []);

  const loadEntries = async (reset = false) => {
    try {
      setLoading(true);
      setError('');
      const currentOffset = reset ? 0 : offset;
      const response = await diaryAPI.getTimeline({ limit, offset: currentOffset });
      
      if (reset) {
        setEntries(response.data.results);
      } else {
        setEntries(prev => [...prev, ...response.data.results]);
      }
      
      setHasMore(response.data.results.length === limit);
      setOffset(currentOffset + response.data.results.length);
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading timeline');
      console.error('Error loading timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadEntries(false);
    }
  };

  const handleEntryClick = (entryId) => {
    navigate(`/entries/${entryId}`);
  };

  // Group entries by month
  const groupEntriesByMonth = (entries) => {
    const groups = {};
    entries.forEach(entry => {
      const entryDate = new Date(entry.entry_date);
      const monthKey = format(entryDate, 'yyyy-MM');
      const monthLabel = format(entryDate, 'MMMM yyyy');
      
      if (!groups[monthKey]) {
        groups[monthKey] = {
          label: monthLabel,
          entries: []
        };
      }
      groups[monthKey].entries.push(entry);
    });
    return groups;
  };

  const monthGroups = groupEntriesByMonth(entries);

  return (
    <div className="timeline-page">
      <div className="timeline-header">
        <h1>Timeline</h1>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {loading && entries.length === 0 ? (
        <div className="loading-state">Loading timeline...</div>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <p>No entries yet. Create your first entry!</p>
        </div>
      ) : (
        <>
          <div className="timeline-content">
            {Object.keys(monthGroups).map(monthKey => {
              const group = monthGroups[monthKey];
              return (
                <div key={monthKey} className="timeline-month-group">
                  <h2 className="timeline-month-header">{group.label}</h2>
                  <div className="timeline-entries">
                    {group.entries.map(entry => (
                      <div
                        key={entry.id}
                        className="timeline-entry-card"
                        onClick={() => handleEntryClick(entry.id)}
                      >
                        <div className="timeline-entry-header">
                          <h3>{entry.title || 'Untitled Entry'}</h3>
                          {entry.is_favorite && (
                            <span className="timeline-favorite">⭐</span>
                          )}
                        </div>
                        <p className="timeline-entry-date">
                          {format(new Date(entry.entry_date), 'EEEE, MMMM dd, yyyy')}
                        </p>
                        {entry.snippet && (
                          <p className="timeline-entry-snippet">{entry.snippet}</p>
                        )}
                        <div className="timeline-entry-meta">
                          {entry.mood && (
                            <span className="timeline-mood">{entry.mood}</span>
                          )}
                          {entry.attachmentCount > 0 && (
                            <span className="timeline-attachments">
                              📷 {entry.attachmentCount}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="timeline-load-more">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="load-more-btn"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Timeline;

