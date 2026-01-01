import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { diaryAPI, categoriesAPI } from '../services/api';
import MobileViewSelector from './MobileViewSelector';
import '../App.css';
import './Search.css';

/**
 * Search Component
 * Provides full-text search with filters (date range, mood, tags)
 * Debounced input for better UX
 */
const Search = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [mood, setMood] = useState('');
  const [tags, setTags] = useState('');
  const [favorite, setFavorite] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Load categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoriesAPI.getCategories();
        setCategories(response.data || []);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    loadCategories();
    
    // Listen for category updates
    const handleCategoriesUpdated = () => {
      loadCategories();
    };
    window.addEventListener('categoriesUpdated', handleCategoriesUpdated);
    
    return () => {
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdated);
    };
  }, []);

  // Debounce search query (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Perform search when filters change
  const performSearch = useCallback(async () => {
    // Don't search if no query and no filters
    if (!debouncedQuery.trim() && !fromDate && !toDate && !mood && !tags.trim() && !favorite && !categoryId) {
      setResults([]);
      setTotal(0);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const params = {
        q: debouncedQuery.trim() || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        mood: mood || undefined,
        tags: tags.trim() || undefined,
        favorite: favorite ? 'true' : undefined,
        category_id: categoryId || undefined,
        limit: 20,
        offset: 0,
      };

      // Remove undefined values
      Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

      // Debug logging - show final params and request URL
      console.log('Search component - Final params object:', params);
      const queryString = new URLSearchParams();
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
          queryString.append(key, params[key]);
        }
      });
      console.log('Search component - Request URL will be: /api/diary/search?' + queryString.toString());

      const response = await diaryAPI.searchEntries(params);
      setResults(response.data.results || []);
      setTotal(response.data.total || 0);
    } catch (err) {
      setError(err.response?.data?.error || 'Error searching entries');
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, fromDate, toDate, mood, tags, favorite, categoryId]);

  // Trigger search when filters change
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleResultClick = (entryId) => {
    // Navigate to dedicated entry view page
    navigate(`/entries/${entryId}`);
  };

  const clearFilters = () => {
    setQuery('');
    setFromDate('');
    setToDate('');
    setMood('');
    setTags('');
    setFavorite(false);
    setCategoryId('');
  };

  const location = useLocation();

  const handleViewChange = (view) => {
    if (view === 'search') {
      navigate('/search');
    } else if (view === 'home') {
      navigate('/');
    } else {
      navigate(`/?view=${view}`);
    }
  };

  return (
    <div className="search-page">
      {/* Mobile View Selector */}
      <div className="mobile-view-selector-wrapper">
        <MobileViewSelector view="search" onViewChange={handleViewChange} />
      </div>

      {/* Desktop View Selector */}
      <div className="desktop-view-selector">
        <div className="view-selector">
          <button
            onClick={() => handleViewChange('home')}
            className={location.pathname === '/' && !location.search ? 'active' : ''}
          >
            Home
          </button>
          <button
            onClick={() => handleViewChange('daily')}
            className={location.pathname === '/' && location.search === '?view=daily' ? 'active' : ''}
          >
            Daily
          </button>
          <button
            onClick={() => handleViewChange('weekly')}
            className={location.pathname === '/' && location.search === '?view=weekly' ? 'active' : ''}
          >
            Weekly
          </button>
          <button
            onClick={() => handleViewChange('monthly')}
            className={location.pathname === '/' && location.search === '?view=monthly' ? 'active' : ''}
          >
            Monthly
          </button>
          <button
            onClick={() => handleViewChange('yearly')}
            className={location.pathname === '/' && location.search === '?view=yearly' ? 'active' : ''}
          >
            Yearly
          </button>
          <button
            onClick={() => handleViewChange('search')}
            className={location.pathname === '/search' ? 'active' : ''}
            title="Search"
          >
            Search
          </button>
        </div>
      </div>

      <div className="search-container">
        <div className="search-header">
          <h2>Search Diary Entries</h2>
        </div>

      <div className="search-filters">
        <div className="search-input-group">
          <label htmlFor="search-query">Search</label>
          <input
            id="search-query"
            type="text"
            placeholder="Enter keywords..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label htmlFor="from-date">From Date</label>
            <input
              id="from-date"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="to-date">To Date</label>
            <input
              id="to-date"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="mood-filter">Mood</label>
            <select
              id="mood-filter"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className="filter-input"
            >
              <option value="">All</option>
              <option value="happy">Happy</option>
              <option value="sad">Sad</option>
              <option value="excited">Excited</option>
              <option value="calm">Calm</option>
              <option value="anxious">Anxious</option>
              <option value="grateful">Grateful</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="tags-filter">Tags (comma-separated)</label>
            <input
              id="tags-filter"
              type="text"
              placeholder="tag1, tag2..."
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label htmlFor="favorite-filter" className="checkbox-label">
              <input
                id="favorite-filter"
                type="checkbox"
                checked={favorite}
                onChange={(e) => setFavorite(e.target.checked)}
                className="filter-checkbox"
              />
              <span>Favorites only</span>
            </label>
          </div>

          <div className="filter-group">
            <label htmlFor="category-filter">Category</label>
            <select
              id="category-filter"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="filter-input"
            >
              <option value="">All categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={clearFilters} className="clear-filters-btn">
          Clear Filters
        </button>
      </div>

      {/* Search Feedback Section */}
      {!loading && !error && (debouncedQuery || fromDate || toDate || mood || tags || favorite || categoryId) && (
        <div className="search-feedback">
          <div className="search-results-count">
            {total > 0 ? (
              <span>Found {total} {total === 1 ? 'entry' : 'entries'}</span>
            ) : (
              <span>No entries found</span>
            )}
          </div>
          <div className="search-active-filters">
            {debouncedQuery && <span className="filter-tag">Query: "{debouncedQuery}"</span>}
            {fromDate && <span className="filter-tag">From: {fromDate}</span>}
            {toDate && <span className="filter-tag">To: {toDate}</span>}
            {mood && <span className="filter-tag">Mood: {mood}</span>}
            {tags && <span className="filter-tag">Tags: {tags}</span>}
            {favorite && <span className="filter-tag">Favorites only</span>}
            {categoryId && <span className="filter-tag">Category: {categories.find(c => c.id.toString() === categoryId)?.name || categoryId}</span>}
          </div>
        </div>
      )}

      {error && <div className="search-error">{error}</div>}

      {loading && (
        <div className="search-loading">
          <div className="loading-spinner"></div>
          <span>Searching...</span>
        </div>
      )}

      {!loading && !error && (
        <div className="search-results">
          {total > 0 ? (
            <>
              <div className="results-list">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="search-result-item"
                    onClick={() => handleResultClick(result.id)}
                  >
                    <div className="result-header">
                      <h3 className="result-title">
                        {result.title || `Entry from ${result.entry_date}`}
                      </h3>
                      <span className="result-date">{result.entry_date}</span>
                    </div>
                    {result.snippet && result.snippet.trim() && (
                      <p className="result-snippet" dangerouslySetInnerHTML={{ __html: result.snippet }} />
                    )}
                    <div className="result-meta">
                      {result.mood && <span className="result-mood">{result.mood}</span>}
                      {result.tags && (
                        <span className="result-tags">
                          {result.tags.split(',').map((tag, idx) => (
                            <span key={idx} className="tag">#{tag.trim()}</span>
                          ))}
                        </span>
                      )}
                      {result.attachmentCount > 0 && (
                        <span className="result-attachments">
                          📎 {result.attachmentCount} {result.attachmentCount === 1 ? 'attachment' : 'attachments'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : debouncedQuery || fromDate || toDate || mood || tags || favorite || categoryId ? (
            <div className="search-empty">No entries found matching your search criteria.</div>
          ) : null}
        </div>
      )}
      </div>
    </div>
  );
};

export default Search;

