import React, { useState, useEffect, useRef } from 'react';
import './DiaryEntryForm.css';

const DiaryEntryForm = ({ entry, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    date: entry?.date || new Date().toISOString().split('T')[0],
    title: entry?.title || '',
    content: entry?.content || '',
    mood: entry?.mood || '',
    weather: entry?.weather || '',
    tags: entry?.tags || '',
  });
  const [files, setFiles] = useState([]); // New files to upload
  const [existingAttachments, setExistingAttachments] = useState(
    entry?.attachments?.filter(a => a.type !== 'sticker') || []
  ); // Existing attachments (photos/documents)
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const filesRef = useRef(files);
  const contentTextareaRef = useRef(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    filesRef.current = files;
  }, [files]);

  // Initialize existing attachments when editing
  useEffect(() => {
    if (entry?.attachments) {
      setExistingAttachments(
        entry.attachments
          .filter(a => a.type !== 'sticker')
          .map(att => ({ ...att, originalFilename: att.original_filename })) // Store original for comparison
      );
    }
  }, [entry]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Use relative URL for uploads when using proxy (empty string), otherwise remove /api
  // Production: Use REACT_APP_API_BASE_URL, Development: '/api' (proxy)
  const API_URL = process.env.REACT_APP_API_BASE_URL || '/api';
  // Upload base URL: In production, images are served from storage service URL
  const UPLOAD_BASE_URL = API_URL === '/api' ? '' : API_URL.replace('/api', '');

  // Helper function to check if a file is an image
  const isImageFile = (file) => {
    if (!file) return false;
    // Primary check: MIME type
    if (file.type && typeof file.type === 'string' && file.type.startsWith('image/')) {
      return true;
    }
    // Fallback: check file extension
    const fileName = file.name || '';
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    const lowerFileName = fileName.toLowerCase();
    return imageExtensions.some(ext => lowerFileName.endsWith(ext));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      // Process each file: keep original File object and add metadata
      const newFiles = selectedFiles.map(file => {
        // Create preview URL immediately for images
        let previewUrl = null;
        const isImage = isImageFile(file);
        
        if (isImage) {
          try {
            previewUrl = URL.createObjectURL(file);
            console.log('Created preview URL for image:', file.name, 'Type:', file.type, 'Preview URL:', previewUrl);
          } catch (err) {
            console.error('Error creating preview URL for file:', file.name, err);
          }
        } else {
          console.log('File is not an image:', file.name, 'Type:', file.type);
        }
        
        // Return object with File and metadata (don't mutate File object)
        return {
          file: file, // Keep original File object intact
          customName: file.name, // Default to original name, user can change
          preview: previewUrl, // Preview URL for images
        };
      });
      
      console.log('Processed files:', newFiles);
      setFiles([...files, ...newFiles]);
    }
    // Reset input to allow selecting same files again
    e.target.value = '';
  };

  const handleRenameNewFile = (index, newName) => {
    setFiles(files.map((fileItem, i) => 
      i === index ? { ...fileItem, customName: newName } : fileItem
    ));
  };

  const removeFile = (index) => {
    const fileItem = files[index];
    // Revoke object URL if it exists
    if (fileItem && fileItem.preview) {
      try {
        URL.revokeObjectURL(fileItem.preview);
      } catch (err) {
        console.warn('Error revoking preview URL:', err);
      }
    }
    setFiles(files.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (attachmentId) => {
    setExistingAttachments(existingAttachments.filter(att => att.id !== attachmentId));
  };

  const handleRenameAttachment = (attachmentId, newName) => {
    setExistingAttachments(existingAttachments.map(att => {
      if (att.id === attachmentId) {
        // Mark as renamed if the name changed from original
        const isRenamed = att.originalFilename !== newName;
        return { ...att, original_filename: newName, renamed: isRenamed };
      }
      return att;
    }));
  };

  const insertSticker = (sticker) => {
    const textarea = contentTextareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const textBefore = formData.content.substring(0, start);
      const textAfter = formData.content.substring(end);
      const newContent = textBefore + sticker + textAfter;
      
      setFormData({
        ...formData,
        content: newContent,
      });
      
      // Set cursor position after inserted sticker
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + sticker.length, start + sticker.length);
      }, 0);
    } else {
      // If textarea not focused, append to end
      setFormData({
        ...formData,
        content: formData.content + sticker,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date) {
      setError('Date is required');
      return;
    }

    if (isSubmitting) {
      return; // Prevent double submission
    }

    setIsSubmitting(true);
    setError(''); // Clear previous errors

    try {
      // Prepare deleted attachments (existing attachments that were removed)
      const deletedAttachments = entry?.attachments
        ?.filter(att => att.type !== 'sticker' && !existingAttachments.find(ea => ea.id === att.id))
        .map(att => att.id) || [];

      // Prepare renamed attachments (only those that actually changed)
      const renamedAttachments = existingAttachments
        .filter(att => {
          // Check if renamed flag is set OR if filename differs from original
          const isRenamed = att.renamed || (att.originalFilename && att.original_filename !== att.originalFilename);
          return isRenamed;
        })
        .map(att => ({ id: att.id, original_filename: att.original_filename }));

      // Debug logging
      console.log('Submitting entry update:');
      console.log('- Deleted attachments:', deletedAttachments);
      console.log('- Renamed attachments:', renamedAttachments);
      console.log('- New files:', files.length);

      // Prepare files with custom names for new uploads
      // files array already contains { file: File, customName: string, preview: string } objects
      const filesToUpload = files.length > 0 ? files : null;

      // Call onSubmit (which is async in parent)
      await onSubmit({
        ...formData,
        files: filesToUpload,
        existingAttachments: existingAttachments.map(att => ({
          id: att.id,
          type: att.type,
          url: att.url,
          original_filename: att.original_filename,
        })),
        deletedAttachments: deletedAttachments.length > 0 ? deletedAttachments : null,
        renamedAttachments: renamedAttachments.length > 0 ? renamedAttachments : null,
      });
      // Reset submitting state on success (parent will close form)
      setIsSubmitting(false);
    } catch (err) {
      // Error handling is done in parent component, but we can set local error as fallback
      setError(err.message || 'Error submitting form');
      setIsSubmitting(false);
    }
  };

  const availableStickers = ['😊', '😢', '😡', '😴', '😍', '🤔', '😎', '🥳', '😇', '😋'];

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      // Clean up all preview URLs when component unmounts
      if (filesRef.current) {
        filesRef.current.forEach(fileItem => {
          if (fileItem && fileItem.preview) {
            try {
              URL.revokeObjectURL(fileItem.preview);
            } catch (err) {
              console.warn('Error revoking preview URL on cleanup:', err);
            }
          }
        });
      }
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className="diary-entry-form">
      <div className="form-header">
        <h3>{entry ? 'Edit Entry' : 'New Entry'}</h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        )}
      </div>

      <div className="form-group">
        <label>Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label>Title (optional)</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Entry title..."
        />
      </div>

      <div className="form-group">
        <div className="content-with-stickers">
          <div className="content-header">
            <label>Content</label>
            <div className="sticker-selector-inline">
              {availableStickers.map((sticker) => (
                <button
                  key={sticker}
                  type="button"
                  onClick={() => insertSticker(sticker)}
                  className="sticker-btn-inline"
                  title={`Insert ${sticker}`}
                >
                  {sticker}
                </button>
              ))}
            </div>
          </div>
          <textarea
            ref={contentTextareaRef}
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows="10"
            placeholder="Write your thoughts here..."
          />
        </div>
      </div>

      <div className="form-group">
        <label>Mood (optional)</label>
        <select name="mood" value={formData.mood} onChange={handleChange}>
          <option value="">Select mood</option>
          <option value="happy">😊 Happy</option>
          <option value="sad">😢 Sad</option>
          <option value="angry">😡 Angry</option>
          <option value="tired">😴 Tired</option>
          <option value="excited">😍 Excited</option>
          <option value="thoughtful">🤔 Thoughtful</option>
          <option value="cool">😎 Cool</option>
          <option value="celebrating">🥳 Celebrating</option>
          <option value="blessed">😇 Blessed</option>
          <option value="hungry">😋 Hungry</option>
        </select>
      </div>

      <div className="form-group">
        <label>Weather (optional)</label>
        <select name="weather" value={formData.weather} onChange={handleChange}>
          <option value="">Select weather</option>
          <option value="sunny">☀️ Sunny</option>
          <option value="cloudy">☁️ Cloudy</option>
          <option value="rainy">🌧️ Rainy</option>
          <option value="snowy">❄️ Snowy</option>
          <option value="windy">💨 Windy</option>
          <option value="foggy">🌫️ Foggy</option>
          <option value="stormy">⛈️ Stormy</option>
        </select>
      </div>

      <div className="form-group">
        <label>Tags (optional, comma-separated)</label>
        <input
          type="text"
          name="tags"
          value={formData.tags}
          onChange={handleChange}
          placeholder="e.g., vacation, family, work"
        />
      </div>

      <div className="form-group">
        <label>Attach Photos/Documents (Multiple files allowed)</label>
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.doc,.docx"
          onChange={handleFileChange}
          id="file-input"
          style={{ display: 'none' }}
        />
        <label htmlFor="file-input" className="file-input-label">
          Choose Files ({files.length + existingAttachments.length} selected)
        </label>
        
        {/* Existing attachments (when editing) */}
        {existingAttachments.length > 0 && (
          <div className="file-list">
            <div className="file-list-header">Existing Files</div>
            {existingAttachments.map((att) => (
              <div key={att.id} className="file-item existing-file">
                {att.type === 'photo' && (
                  <div className="file-preview">
                    <img 
                      src={`${UPLOAD_BASE_URL}${att.url}`} 
                      alt={att.original_filename} 
                      className="file-preview-image" 
                    />
                    <input
                      type="text"
                      value={att.original_filename}
                      onChange={(e) => handleRenameAttachment(att.id, e.target.value)}
                      className="file-name-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                {att.type !== 'photo' && (
                  <div className="file-item-content">
                    <span className="file-name">📄 {att.original_filename}</span>
                    <input
                      type="text"
                      value={att.original_filename}
                      onChange={(e) => handleRenameAttachment(att.id, e.target.value)}
                      className="file-name-input"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeExistingAttachment(att.id)}
                  className="remove-btn"
                  aria-label={`Remove ${att.original_filename}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New files */}
        {files.length > 0 && (
          <div className="file-list">
            {existingAttachments.length > 0 && <div className="file-list-header">New Files</div>}
            {files.map((fileItem, index) => {
              if (!fileItem || !fileItem.file) return null; // Skip if file is undefined
              
              const file = fileItem.file; // Original File object
              const isImage = isImageFile(file);
              const previewUrl = fileItem.preview || null;
              const displayName = fileItem.customName || file.name || 'Untitled';
              
              return (
                <div key={`${file.name}-${file.size}-${index}`} className="file-item">
                  {isImage && previewUrl ? (
                    <div className="file-preview">
                      <img 
                        src={previewUrl} 
                        alt={displayName} 
                        className="file-preview-image"
                        onError={(e) => {
                          console.error('Error loading preview image:', displayName);
                          e.target.style.display = 'none';
                        }}
                      />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => handleRenameNewFile(index, e.target.value)}
                        className="file-name-input"
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Enter file name"
                      />
                    </div>
                  ) : (
                    <div className="file-item-content">
                      <span className="file-name">📄 {displayName}</span>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => handleRenameNewFile(index, e.target.value)}
                        className="file-name-input"
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Enter file name"
                      />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="remove-btn"
                    aria-label={`Remove ${displayName}`}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <button 
        type="submit" 
        className="submit-btn" 
        disabled={isSubmitting}
      >
        {isSubmitting 
          ? (entry ? 'Updating...' : 'Saving...') 
          : (entry ? 'Update Entry' : 'Create Entry')
        }
      </button>
    </form>
  );
};

export default DiaryEntryForm;
