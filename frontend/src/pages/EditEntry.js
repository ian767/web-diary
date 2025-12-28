import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import DiaryEntryForm from '../components/DiaryEntryForm';
import { diaryAPI } from '../services/api';
import './EditEntry.css';

const EditEntry = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [entry, setEntry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Get return path from location state, or default to Home
  const returnPath = location.state?.returnPath || '/';

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

  const handleSubmit = async (data) => {
    try {
      setError('');
      const response = await diaryAPI.updateEntry(id, data, data.files);
      
      // Check for partial success (207) or upload errors
      const status = response.status || (response.response?.status);
      const responseData = response.data || response.response?.data;
      if (status === 207 || responseData?.uploadErrors) {
        const uploadErrors = responseData?.uploadErrors || [];
        if (uploadErrors.length > 0) {
          // Show warning about failed uploads
          const errorDetails = uploadErrors.map(e => `${e.filename}: ${e.error}`).join('; ');
          setError(`Entry updated but file upload failed: ${errorDetails}`);
          console.warn('Entry updated but uploads failed:', uploadErrors);
          // Keep form open so user sees the error
          return;
        }
      }
      
      // Full success - navigate back to return path (or Home)
      navigate(returnPath);
    } catch (err) {
      // Show detailed error message
      const errorMessage = err.response?.data?.error || err.message || 'Error saving entry';
      setError(errorMessage);
      console.error('Error saving entry:', err);
      // Keep form open so user can fix and retry
    }
  };

  const handleCancel = () => {
    navigate(returnPath);
  };

  if (loading) {
    return (
      <div className="edit-entry-page">
        <div className="edit-entry-container">
          <div className="loading-state">Loading entry...</div>
        </div>
      </div>
    );
  }

  if (error && !entry) {
    return (
      <div className="edit-entry-page">
        <div className="edit-entry-container">
          <div className="error-state">
            <p>{error}</p>
            <button onClick={handleCancel} className="back-button">
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="edit-entry-page">
      <div className="edit-entry-container">
        <div className="edit-entry-header">
          <h2>Edit Entry</h2>
          <button
            className="close-edit-btn"
            onClick={handleCancel}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
        {entry && (
          <DiaryEntryForm
            entry={entry}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
};

export default EditEntry;

