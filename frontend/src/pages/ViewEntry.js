import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Logo from '../components/Logo';
import RichTextDisplay from '../components/RichTextDisplay';
import ImageLightbox from '../components/ImageLightbox';
import { diaryAPI } from '../services/api';
import './ViewEntry.css';

/**
 * View Entry Page
 * Read-only view for a single diary entry
 * Accessed from search results or direct links
 */
const ViewEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxImages, setLightboxImages] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Use relative URL for uploads when using proxy (empty string), otherwise remove /api
  const API_URL = process.env.REACT_APP_API_BASE_URL || '/api';
  const UPLOAD_BASE_URL = API_URL === '/api' ? '' : API_URL.replace('/api', '');

  useEffect(() => {
    const fetchEntry = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await diaryAPI.getEntry(id);
        setEntry(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Error loading entry');
        console.error('Error fetching entry:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEntry();
    }
  }, [id]);

  const handleImageClick = (attachment, entry) => {
    const photoAttachments = entry.attachments?.filter(a => a.type === 'photo') || [];
    const images = photoAttachments.map(att => ({
      url: `${UPLOAD_BASE_URL}${att.url}`,
      alt: att.original_filename,
      filename: att.original_filename
    }));
    const index = photoAttachments.findIndex(att => att.id === attachment.id);
    setLightboxImages(images);
    setCurrentImageIndex(index >= 0 ? index : 0);
  };

  if (loading) {
    return (
      <div className="view-entry-page">
        <div className="view-entry-container">
          <div className="loading-state">Loading entry...</div>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="view-entry-page">
        <div className="view-entry-container">
          <div className="error-state">
            <p>{error || 'Entry not found'}</p>
            <button onClick={() => navigate('/')} className="back-button">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const photoAttachments = entry.attachments?.filter(a => a.type === 'photo') || [];

  return (
    <div className="view-entry-page">
      <div className="view-entry-header-top">
        <Logo />
      </div>
      <div className="view-entry-container">
        <div className="view-entry-header">
          <button onClick={() => navigate('/')} className="back-button">
            ← Back
          </button>
          <h1 className="view-entry-title">{entry.title || 'Untitled Entry'}</h1>
          <div className="view-entry-meta">
            <span className="entry-date">{format(new Date(entry.date), 'EEEE, MMMM dd, yyyy')}</span>
            {entry.mood && (
              <span className="entry-mood">Mood: {entry.mood}</span>
            )}
            {entry.weather && (
              <span className="entry-weather">Weather: {entry.weather}</span>
            )}
            {entry.tags && (
              <div className="entry-tags">
                {entry.tags.split(',').map((tag, idx) => (
                  <span key={idx} className="tag">#{tag.trim()}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="view-entry-content">
          {/* Photos */}
          {photoAttachments.length > 0 && (
            <div className="view-entry-photos">
              <div className="photos-grid">
                {photoAttachments.map((att, idx) => (
                  <div key={idx} className="photo-item">
                    <img
                      src={`${UPLOAD_BASE_URL}${att.url}`}
                      alt={att.original_filename}
                      className="entry-photo"
                      onClick={() => handleImageClick(att, entry)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          {(entry.content_html || entry.content_text || entry.content) && (
            <div className="view-entry-text">
              <RichTextDisplay 
                htmlContent={entry.content_html} 
                plainTextContent={entry.content_text || entry.content} 
              />
            </div>
          )}

          {/* Other attachments */}
          {entry.attachments && entry.attachments.filter(a => a.type !== 'photo').length > 0 && (
            <div className="view-entry-attachments">
              <h3>Attachments</h3>
              <ul>
                {entry.attachments.filter(a => a.type !== 'photo').map((att, idx) => (
                  <li key={idx}>
                    <a href={`${UPLOAD_BASE_URL}${att.url}`} target="_blank" rel="noopener noreferrer">
                      {att.original_filename}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
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
    </div>
  );
};

export default ViewEntry;

