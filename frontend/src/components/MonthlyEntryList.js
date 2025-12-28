import React, { useState } from 'react';
import { format } from 'date-fns';
import ImageLightbox from './ImageLightbox';
import './MonthlyEntryList.css';

// Production: Use REACT_APP_API_BASE_URL, Development: '/api' (proxy)
const API_URL = process.env.REACT_APP_API_BASE_URL || '/api';
// Upload base URL: In production, images are served from storage service URL
const UPLOAD_BASE_URL = API_URL === '/api' ? '' : API_URL.replace('/api', '');

// Helper functions for emoji mapping
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

const getWeatherEmoji = (weather) => {
  const weatherEmojis = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    snowy: '❄️',
    windy: '💨',
    foggy: '🌫️',
    stormy: '⛈️',
  };
  return weatherEmojis[weather] || '☀️';
};

const MonthlyEntryList = ({ entries, onEdit, onDelete }) => {
  const [expandedEntryId, setExpandedEntryId] = useState(null);
  const [lightboxImages, setLightboxImages] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <p>No diary entries for this month.</p>
      </div>
    );
  }

  const handleEntryClick = (entryId) => {
    setExpandedEntryId(expandedEntryId === entryId ? null : entryId);
  };

  const handleImageClick = (att, entry) => {
    const photoAttachments = entry.attachments.filter(a => a.type === 'photo');
    const images = photoAttachments.map(photo => ({
      url: `${UPLOAD_BASE_URL}${photo.url}`,
      alt: photo.original_filename,
      filename: photo.original_filename
    }));
    
    const index = photoAttachments.findIndex(p => p.url === att.url);
    setLightboxImages(images);
    setCurrentImageIndex(index >= 0 ? index : 0);
  };

  return (
    <>
      <div className="monthly-entry-list">
        {entries.map((entry) => {
          const isExpanded = expandedEntryId === entry.id;
          const photoCount = entry.attachments?.filter(a => a.type === 'photo').length || 0;
          const photoAttachments = entry.attachments?.filter(a => a.type === 'photo') || [];
          
          return (
            <div
              key={entry.id}
              className={`monthly-entry-item ${isExpanded ? 'expanded' : 'collapsed'}`}
            >
              {/* Header - clickable to expand/collapse */}
              <div 
                className="monthly-entry-main"
                onClick={() => handleEntryClick(entry.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="monthly-entry-header">
                  <h4 className="monthly-entry-title">{entry.title || 'Untitled Entry'}</h4>
                  <span className="monthly-entry-date">
                    {format(new Date(entry.date), 'MMM dd')}
                  </span>
                </div>
                <div className="monthly-entry-meta">
                  {entry.mood && (
                    <span className="monthly-entry-badge mood-badge">
                      {getMoodEmoji(entry.mood)}
                    </span>
                  )}
                  {entry.weather && (
                    <span className="monthly-entry-badge weather-badge">
                      {getWeatherEmoji(entry.weather)}
                    </span>
                  )}
                  {photoCount > 0 && (
                    <span className="monthly-entry-badge photo-badge">
                      📷 {photoCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="monthly-entry-expanded-content">
                  {/* Photos first */}
                  {photoAttachments.length > 0 && (
                    <div className="monthly-entry-photos">
                      <div className="monthly-attachments-grid">
                        {photoAttachments.map((att, idx) => (
                          <div key={idx} className="monthly-attachment-item">
                            <img
                              src={`${UPLOAD_BASE_URL}${att.url}`}
                              alt={att.original_filename}
                              className="monthly-attachment-image"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageClick(att, entry);
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content text */}
                  {entry.content && (
                    <div className="monthly-entry-content">
                      {entry.content.split('\n').map((line, idx) => (
                        <React.Fragment key={idx}>
                          {line}
                          {idx < entry.content.split('\n').length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {(onEdit || onDelete) && (
                    <div className="monthly-entry-actions">
                      {onEdit && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(entry);
                          }} 
                          className="action-btn edit-btn"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(entry.id);
                          }} 
                          className="action-btn delete-btn"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Image Lightbox */}
      {lightboxImages && lightboxImages.length > 0 && (
        <ImageLightbox
          images={lightboxImages}
          currentIndex={currentImageIndex}
          onClose={() => setLightboxImages(null)}
          onNavigate={(newIndex) => setCurrentImageIndex(newIndex)}
        />
      )}
    </>
  );
};

export default MonthlyEntryList;

