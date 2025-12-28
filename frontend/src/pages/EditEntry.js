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
      await diaryAPI.updateEntry(id, data, data.files);
      // Navigate back to return path (or Home)
      navigate(returnPath);
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving entry');
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

