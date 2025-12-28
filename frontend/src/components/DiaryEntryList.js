import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import ImageLightbox from './ImageLightbox';
import RichTextDisplay from './RichTextDisplay';
import { diaryAPI } from '../services/api';
import './DiaryEntryList.css';

// Production: Use REACT_APP_API_BASE_URL, Development: '/api' (proxy)
const API_URL = process.env.REACT_APP_API_BASE_URL || '/api';
// Upload base URL: In production, this will be the storage service URL (S3, etc.)
// In development, use relative path (empty string) for proxy
// Note: In production, images are served from storage service, not /uploads
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

const DiaryEntryList = ({ entries, onEdit, onDelete, onView, viewType = 'daily', onEntryUpdate }) => {
  const [lightboxImages, setLightboxImages] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Determine default expansion behavior based on view type
  const getDefaultExpandedId = () => {
    if (viewType === 'daily' && entries.length > 0) {
      // Daily: expand first entry by default
      return entries[0].id;
    }
    // Weekly, Monthly: no expansion by default
    return null;
  };
  
  const [expandedEntryId, setExpandedEntryId] = useState(getDefaultExpandedId());
  
  // Reset expansion when entries or viewType changes
  useEffect(() => {
    const defaultId = viewType === 'daily' && entries.length > 0 ? entries[0].id : null;
    setExpandedEntryId(defaultId);
  }, [entries.length, viewType, entries]);
  
  // Helper to check if entry should show photos as thumbnails only (weekly view)
  const showThumbnailsOnly = viewType === 'weekly';

  if (entries.length === 0) {
    return (
      <div className="empty-state">
        <p>No diary entries yet. Create your first entry!</p>
      </div>
    );
  }

  const handleImageClick = (att, entry) => {
    // Get all photo attachments from this entry
    const photoAttachments = entry.attachments.filter(a => a.type === 'photo');
    const images = photoAttachments.map(photo => ({
      url: `${UPLOAD_BASE_URL}${photo.url}`,
      alt: photo.original_filename,
      filename: photo.original_filename
    }));
    
    // Find the index of the clicked image
    const index = photoAttachments.findIndex(p => p.url === att.url);
    
    setLightboxImages(images);
    setCurrentImageIndex(index >= 0 ? index : 0);
  };

  const handleEntryHeaderClick = (entryId) => {
    setExpandedEntryId(expandedEntryId === entryId ? null : entryId);
  };

  const getPhotoCount = (entry) => {
    return entry.attachments?.filter(a => a.type === 'photo').length || 0;
  };

  // Phase 3A: Handle favorite toggle
  const handleFavoriteToggle = async (e, entry) => {
    e.stopPropagation(); // Prevent expanding entry when clicking star
    try {
      await diaryAPI.toggleFavorite(entry.id);
      // Update local entry state
      if (onEntryUpdate) {
        onEntryUpdate(entry.id, { is_favorite: !entry.is_favorite });
      }
      // Also update entry in entries array if parent manages it
      entry.is_favorite = !entry.is_favorite;
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  return (
    <>
      <div className="diary-entry-list" data-view-type={viewType}>
        {entries.map((entry) => {
          const isExpanded = expandedEntryId === entry.id;
          const photoCount = getPhotoCount(entry);
          const photoAttachments = entry.attachments?.filter(a => a.type === 'photo') || [];

          return (
            <div 
              key={entry.id} 
              className={`diary-entry-card ${isExpanded ? 'expanded' : 'collapsed'}`}
            >
              {/* Header - always visible, clickable */}
              <div 
                className="entry-header" 
                onClick={() => handleEntryHeaderClick(entry.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="entry-header-left">
                  <div>
                    <h3>{entry.title || 'Untitled Entry'}</h3>
                    <p className="entry-date">
                      {format(new Date(entry.date), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                  {/* Phase 3A: Favorite star toggle */}
                  <button
                    className={`favorite-btn ${entry.is_favorite ? 'favorited' : ''}`}
                    onClick={(e) => handleFavoriteToggle(e, entry)}
                    title={entry.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                    aria-label={entry.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {entry.is_favorite ? '⭐' : '☆'}
                  </button>
                </div>
                <div className="entry-badges">
                  {entry.mood && (
                    <span className="mood-badge">
                      {getMoodEmoji(entry.mood)} {entry.mood}
                    </span>
                  )}
                  {entry.weather && (
                    <span className="weather-badge">
                      {getWeatherEmoji(entry.weather)} {entry.weather}
                    </span>
                  )}
                  {entry.tags && (
                    <div className="tags-container">
                      {entry.tags.split(',').map((tag, idx) => (
                        tag.trim() && (
                          <span key={idx} className="tag-badge">
                            #{tag.trim()}
                          </span>
                        )
                      ))}
                    </div>
                  )}
                  {photoCount > 0 && (
                    <span className="photo-count-badge">
                      📷 {photoCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded content - only visible when expanded */}
              {isExpanded && (
                <div className="entry-expanded-content">
                  {/* Photos first (prioritized) */}
                  {photoAttachments.length > 0 && (
                    <div className={`entry-attachments entry-photos ${showThumbnailsOnly ? 'thumbnails-only' : ''}`}>
                      <div className="attachments-grid">
                        {photoAttachments.map((att, idx) => (
                          <div key={idx} className="attachment-item">
                            <img
                              src={`${UPLOAD_BASE_URL}${att.url}`}
                              alt={att.original_filename}
                              className="attachment-image"
                              onClick={() => handleImageClick(att, entry)}
                              style={{ cursor: 'pointer' }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content text - show in Daily and Weekly views */}
                  {(entry.content_html || entry.content_text || entry.content) && (viewType === 'daily' || viewType === 'weekly') && (
                    <div className="entry-content">
                      <RichTextDisplay 
                        htmlContent={entry.content_html} 
                        plainTextContent={entry.content_text || entry.content} 
                      />
                    </div>
                  )}

                  {/* Other attachments (non-photos) - only in Daily view */}
                  {viewType === 'daily' && entry.attachments && entry.attachments.filter(a => a.type !== 'photo').length > 0 && (
                    <div className="entry-attachments">
                      <strong>Attachments:</strong>
                      <div className="attachments-grid">
                        {entry.attachments
                          .filter(a => a.type !== 'photo')
                          .map((att, idx) => (
                            <div key={idx} className="attachment-item">
                              {att.type === 'sticker' ? (
                                <span className="sticker-display">{att.original_filename}</span>
                              ) : (
                                <span className="file-display">📄 {att.original_filename}</span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Actions - Edit button in Daily view only, hidden in Weekly view */}
                  <div className="entry-actions">
                    {onEdit && viewType === 'daily' && (
                      <button onClick={() => onEdit(entry)} className="action-btn edit-btn">
                        Edit
                      </button>
                    )}
                    {onDelete && viewType === 'daily' && (
                      <button onClick={() => onDelete(entry.id)} className="action-btn delete-btn">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
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

export default DiaryEntryList;

