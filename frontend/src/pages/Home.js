import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, addDays, subMonths, addMonths, subYears, addYears, subWeeks, addWeeks } from 'date-fns';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import WeeklyCalendar from '../components/WeeklyCalendar';
import WeeklyViewCalendar from '../components/WeeklyViewCalendar';
import YearlyCalendar from '../components/YearlyCalendar';
import YearlyMonthSummary from '../components/YearlyMonthSummary';
import DiaryEntryForm from '../components/DiaryEntryForm';
import DiaryEntryList from '../components/DiaryEntryList';
import MonthlyEntryList from '../components/MonthlyEntryList';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import ImageLightbox from '../components/ImageLightbox';
import MobileDrawer from '../components/MobileDrawer';
import MobileViewSelector from '../components/MobileViewSelector';
import MobileActionBar from '../components/MobileActionBar';
import { diaryAPI, tasksAPI } from '../services/api';
import './Home.css';
import './CalendarDarkMode.css';

const Home = ({ onNavigateRef }) => {
  const navigate = useNavigate();
  const [view, setView] = useState('home'); // Default to home view
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Expose navigation function to parent (for logo click)
  useEffect(() => {
    if (onNavigateRef) {
      onNavigateRef(() => {
        setView('home');
        setSelectedDate(new Date()); // Navigate to today
      });
    }
  }, [onNavigateRef]);
  const [entries, setEntries] = useState([]);
  const [allWeekEntries, setAllWeekEntries] = useState([]); // Store all week entries for daily view calendar indicators
  const [allMonthEntries, setAllMonthEntries] = useState([]); // Store all month entries for monthly view calendar indicators
  const [tasks, setTasks] = useState([]);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Navigation menu state
  const [navigationExpanded, setNavigationExpanded] = useState(true);
  const [filters, setFilters] = useState({
    mood: '',
    location: '',
    weather: '',
    tags: ''
  });
  // Lightbox state for Home page photos
  const [lightboxImages, setLightboxImages] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  // Mobile drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Listen for drawer toggle from header hamburger button
  useEffect(() => {
    const handleToggleDrawer = () => {
      setDrawerOpen(prev => !prev);
    };
    window.addEventListener('toggleDrawer', handleToggleDrawer);
    return () => {
      window.removeEventListener('toggleDrawer', handleToggleDrawer);
    };
  }, []);

  useEffect(() => {
    if (view !== 'home') {
      loadData();
    }
  }, [view, selectedDate, filters.mood, filters.weather, filters.tags]);

  // Load overview data for home view
  const [todayEntry, setTodayEntry] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [overviewStats, setOverviewStats] = useState({
    totalEntries: 0,
    entriesThisWeek: 0,
    entriesThisMonth: 0,
    mostCommonMood: null
  });

  const loadOverviewData = async () => {
    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);

      // Fetch today's entry
      const todayRes = await diaryAPI.getEntries({
        view: 'daily',
        date: todayStr,
        startDate: todayStr,
        endDate: todayStr
      });
      setTodayEntry(todayRes.data.length > 0 ? todayRes.data[0] : null);

      // Fetch recent entries (last 7)
      const recentRes = await diaryAPI.getEntries({
        view: 'monthly',
        date: format(today, 'yyyy-MM-dd'),
        startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd')
      });
      const sortedRecent = recentRes.data
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 7);
      setRecentEntries(sortedRecent);

      // Calculate stats
      const allEntriesRes = await diaryAPI.getEntries({
        view: 'yearly',
        date: format(today, 'yyyy-MM-dd'),
        startDate: format(startOfYear(today), 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd')
      });
      const allEntries = allEntriesRes.data;
      
      const entriesThisWeek = allEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= weekStart && entryDate <= weekEnd;
      }).length;

      const entriesThisMonth = allEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= monthStart && entryDate <= monthEnd;
      }).length;

      // Calculate most common mood
      const moodCounts = {};
      allEntries.forEach(entry => {
        if (entry.mood) {
          moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
        }
      });
      const mostCommonMood = Object.keys(moodCounts).length > 0
        ? Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b)
        : null;

      setOverviewStats({
        totalEntries: allEntries.length,
        entriesThisWeek,
        entriesThisMonth,
        mostCommonMood
      });
    } catch (err) {
      console.error('Error loading overview data:', err);
    }
  };

  useEffect(() => {
    if (view === 'home') {
      loadOverviewData();
    }
  }, [view]);

  const getDateRange = () => {
    const date = selectedDate;
    switch (view) {
      case 'daily':
        return { startDate: format(date, 'yyyy-MM-dd'), endDate: format(date, 'yyyy-MM-dd') };
      case 'weekly':
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
        return { startDate: format(weekStart, 'yyyy-MM-dd'), endDate: format(weekEnd, 'yyyy-MM-dd') };
      case 'monthly':
        return { startDate: format(startOfMonth(date), 'yyyy-MM-dd'), endDate: format(endOfMonth(date), 'yyyy-MM-dd') };
      case 'yearly':
        return { startDate: format(startOfYear(date), 'yyyy-MM-dd'), endDate: format(endOfYear(date), 'yyyy-MM-dd') };
      default:
        return { startDate: format(date, 'yyyy-MM-dd'), endDate: format(date, 'yyyy-MM-dd') };
    }
  };

  const loadData = async () => {
    // Skip loading if we're on home view
    if (view === 'home') {
      return;
    }
    setLoading(true);
    setError('');
    try {
      const dateRange = getDateRange();
      
      // For daily view, we need entries for the entire week to show indicators in WeeklyCalendar
      // but we'll filter the displayed entries to just the selected day
      let entriesParams = {
        view,
        date: format(selectedDate, 'yyyy-MM-dd'),
        ...dateRange,
      };
      
      // If daily view, load entries for the entire week for calendar indicators
      if (view === 'daily') {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        entriesParams = {
          view: 'weekly',
          date: format(selectedDate, 'yyyy-MM-dd'),
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd'),
        };
      }
      
      // If weekly view, load entries for the entire month for week calendar indicators
      if (view === 'weekly') {
        const monthStart = startOfMonth(selectedDate);
        const monthEnd = endOfMonth(selectedDate);
        entriesParams = {
          view: 'monthly',
          date: format(selectedDate, 'yyyy-MM-dd'),
          startDate: format(monthStart, 'yyyy-MM-dd'),
          endDate: format(monthEnd, 'yyyy-MM-dd'),
        };
      }

      const [entriesRes, tasksRes] = await Promise.all([
        diaryAPI.getEntries(entriesParams),
        tasksAPI.getTasks({ 
          ...(view === 'daily' && { due_date: format(selectedDate, 'yyyy-MM-dd') }),
          ...(view === 'weekly' && { startDate: dateRange.startDate, endDate: dateRange.endDate }),
          ...(view === 'monthly' && { startDate: dateRange.startDate, endDate: dateRange.endDate }),
          ...(view === 'yearly' && { startDate: dateRange.startDate, endDate: dateRange.endDate }),
        }),
      ]);

      // For daily view, filter entries to only show the selected day
      // For weekly view, filter entries to only show the selected week
      // For monthly view, store all entries for calendar indicators
      let filteredEntries = entriesRes.data;
      if (view === 'daily') {
        // Store all week entries for calendar indicators
        setAllWeekEntries(entriesRes.data);
        setAllMonthEntries([]);
        // Filter to only show entries for the selected day
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
        filteredEntries = entriesRes.data.filter(entry => {
          const entryDate = format(new Date(entry.date), 'yyyy-MM-dd');
          return entryDate === selectedDateStr;
        });
      } else if (view === 'weekly') {
        // Store all month entries for calendar indicators
        setAllWeekEntries([]);
        setAllMonthEntries(entriesRes.data);
        // Filter to only show entries for the selected week
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        filteredEntries = entriesRes.data.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= weekStart && entryDate <= weekEnd;
        });
      } else if (view === 'monthly') {
        // Store all month entries for calendar indicators
        setAllWeekEntries([]);
        setAllMonthEntries(entriesRes.data);
        // No filtering needed - show all entries for the month
        filteredEntries = entriesRes.data;
      } else if (view === 'yearly') {
        // Store all year entries for yearly view summary
        setAllWeekEntries([]);
        setAllMonthEntries([]);
        // Show all entries for the year (used for month summaries)
        filteredEntries = entriesRes.data;
      } else {
        setAllWeekEntries([]);
        setAllMonthEntries([]);
      }

      // Apply navigation filters (only if filter is set and not empty)
      // Note: Filters are optional - entries without these fields will still show when filters are empty
      if (filters.mood && filters.mood.trim() !== '') {
        filteredEntries = filteredEntries.filter(entry => entry.mood === filters.mood);
      }
      if (filters.weather && filters.weather.trim() !== '') {
        filteredEntries = filteredEntries.filter(entry => entry.weather === filters.weather);
      }
      if (filters.tags && filters.tags.trim() !== '') {
        const searchTags = filters.tags.toLowerCase().split(',').map(tag => tag.trim()).filter(tag => tag);
        filteredEntries = filteredEntries.filter(entry => 
          entry.tags && searchTags.some(searchTag => entry.tags.toLowerCase().includes(searchTag))
        );
      }

      setEntries(filteredEntries);
      setTasks(tasksRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleEntrySubmit = async (data) => {
    try {
      setError(''); // Clear any previous errors
      if (editingEntry) {
        await diaryAPI.updateEntry(editingEntry.id, data, data.files);
      } else {
        await diaryAPI.createEntry(data, data.files);
      }
      // Success - close form and reload data
      setShowEntryForm(false);
      setEditingEntry(null);
      await loadData();
      if (view === 'home') {
        await loadOverviewData();
      }
      // Success feedback - entries will be refreshed automatically
      console.log('Entry saved successfully');
    } catch (err) {
      // Show detailed error message from server
      let errorMessage = 'Error saving entry';
      if (err.response) {
        // Server responded with error status
        const status = err.response.status;
        const statusText = err.response.statusText;
        const serverError = err.response.data?.error || err.response.data?.message;
        errorMessage = serverError || `Server error (${status} ${statusText})`;
      } else if (err.request) {
        // Request made but no response (network error)
        errorMessage = 'Network error: Could not reach server';
      } else {
        // Error in request setup
        errorMessage = err.message || 'Error saving entry';
      }
      setError(errorMessage);
      console.error('Error saving entry:', err);
      // Keep form open so user can fix and retry
    }
  };

  const handleTaskSubmit = async (data) => {
    try {
      if (editingTask) {
        await tasksAPI.updateTask(editingTask.id, { ...data, completed: editingTask.completed });
      } else {
        await tasksAPI.createTask(data);
      }
      setShowTaskForm(false);
      setEditingTask(null);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving task');
    }
  };

  const handleDeleteEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      try {
        await diaryAPI.deleteEntry(id);
        loadData();
      } catch (err) {
        setError(err.response?.data?.error || 'Error deleting entry');
      }
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.deleteTask(id);
        loadData();
      } catch (err) {
        setError(err.response?.data?.error || 'Error deleting task');
      }
    }
  };

  const handleToggleTask = async (id) => {
    try {
      await tasksAPI.toggleTask(id);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating task');
    }
  };

  // Handle date change - close edit forms if open
  const handleDateChange = (newDate) => {
    if (showEntryForm) {
      setShowEntryForm(false);
      setEditingEntry(null);
    }
    if (showTaskForm) {
      setShowTaskForm(false);
      setEditingTask(null);
    }
    setSelectedDate(newDate);
  };

  // Handle view change - reset edit state
  const handleViewChange = (newView) => {
    if (showEntryForm) {
      setShowEntryForm(false);
      setEditingEntry(null);
    }
    if (showTaskForm) {
      setShowTaskForm(false);
      setEditingTask(null);
    }
    setView(newView);
  };

  // Handle month click in yearly view - navigate to monthly view
  const handleYearlyMonthClick = (month) => {
    setSelectedDate(month);
    setView('monthly');
  };

  // Helper functions for mood/weather emoji
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

  // Sidebar content (to be shown in drawer on mobile, sidebar on desktop)
  const sidebarContent = (
    <div className="calendar-section">
      <div className="calendar-time-filter">
        {view === 'daily' && (
          <>
            <WeeklyCalendar
              selectedDate={selectedDate}
              onDateChange={(date) => {
                handleDateChange(date);
                setDrawerOpen(false); // Close drawer on mobile after date selection
              }}
              entries={allWeekEntries}
              viewType="daily"
            />
            <div className="date-navigation">
              <button className="nav-arrow-button" onClick={() => handleDateChange(subDays(selectedDate, 1))} aria-label="Previous day">
                ←
              </button>
              <span className="current-date">
                {format(selectedDate, 'MMMM dd, yyyy')}
              </span>
              <button className="nav-arrow-button" onClick={() => handleDateChange(addDays(selectedDate, 1))} aria-label="Next day">
                →
              </button>
            </div>
          </>
        )}

        {view === 'weekly' && (
          <>
            <WeeklyViewCalendar
              selectedDate={selectedDate}
              onDateChange={(date) => {
                handleDateChange(date);
                setDrawerOpen(false);
              }}
              entries={allMonthEntries}
            />
            <div className="date-navigation">
              <button className="nav-arrow-button" onClick={() => handleDateChange(subWeeks(selectedDate, 1))} aria-label="Previous week">
                ←
              </button>
              <span className="current-date">
                {format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM dd')} - {format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
              </span>
              <button className="nav-arrow-button" onClick={() => handleDateChange(addWeeks(selectedDate, 1))} aria-label="Next week">
                →
              </button>
            </div>
          </>
        )}

        {view === 'monthly' && (
          <>
            <Calendar
              onChange={(date) => {
                handleDateChange(date);
                setDrawerOpen(false);
              }}
              value={selectedDate}
              className="diary-calendar"
              view="month"
              calendarType="US"
              locale="en-US"
              tileContent={({ date, view: tileView }) => {
                if (tileView === 'month') {
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const dayEntries = allMonthEntries.filter(entry => {
                    const entryDate = format(new Date(entry.date), 'yyyy-MM-dd');
                    return entryDate === dateStr;
                  });
                  const entryCount = dayEntries.length;
                  if (entryCount > 0) {
                    return (
                      <div className="calendar-entry-indicator">
                        <span className="calendar-entry-badge">{entryCount}</span>
                      </div>
                    );
                  }
                }
                return null;
              }}
            />
            <div className="date-navigation">
              <button className="nav-arrow-button" onClick={() => handleDateChange(subMonths(selectedDate, 1))} aria-label="Previous month">
                ←
              </button>
              <span className="current-date">
                {format(selectedDate, 'MMMM yyyy')}
              </span>
              <button className="nav-arrow-button" onClick={() => handleDateChange(addMonths(selectedDate, 1))} aria-label="Next month">
                →
              </button>
            </div>
          </>
        )}

        {view === 'yearly' && (
          <>
            <YearlyCalendar
              selectedDate={selectedDate}
              onDateChange={(date) => {
                handleDateChange(date);
                setDrawerOpen(false);
              }}
              entries={entries}
            />
            <div className="date-navigation">
              <button className="nav-arrow-button" onClick={() => handleDateChange(subYears(selectedDate, 1))} aria-label="Previous year">
                ←
              </button>
              <span className="current-date">
                {format(selectedDate, 'yyyy')}
              </span>
              <button className="nav-arrow-button" onClick={() => handleDateChange(addYears(selectedDate, 1))} aria-label="Next year">
                →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Navigation section */}
      <div className="calendar-attribute-filters">
        <div className="navigation-section-header">
          <h3 className="navigation-title">Navigation</h3>
          <button 
            className="navigation-expand-btn" 
            onClick={() => setNavigationExpanded(!navigationExpanded)}
            aria-label={navigationExpanded ? "Collapse navigation" : "Expand navigation"}
          >
            <span className="navigation-icon">{navigationExpanded ? '▼' : '▶'}</span>
          </button>
        </div>
        {navigationExpanded && (
          <div className="navigation-content">
            <div className="navigation-group">
              <div className="navigation-group-header">
                <div className="navigation-group-title">Filters</div>
                {(filters.mood || filters.weather || filters.tags) && (
                  <button
                    type="button"
                    onClick={() => setFilters({ mood: '', location: '', weather: '', tags: '' })}
                    className="clear-filters-btn"
                    title="Clear all filters"
                  >
                    Clear
                  </button>
                )}
              </div>
              <div className="navigation-filter-item">
                <label htmlFor="mood-filter">Mood</label>
                <select
                  id="mood-filter"
                  value={filters.mood}
                  onChange={(e) => {
                    setFilters({ ...filters, mood: e.target.value });
                  }}
                  className="navigation-select"
                >
                  <option value="">All moods</option>
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
              <div className="navigation-filter-item">
                <label htmlFor="location-filter">Location</label>
                <div className="navigation-placeholder-small">
                  Coming soon
                </div>
              </div>
              <div className="navigation-filter-item">
                <label htmlFor="weather-filter">Weather</label>
                <select
                  id="weather-filter"
                  value={filters.weather}
                  onChange={(e) => {
                    setFilters({ ...filters, weather: e.target.value });
                  }}
                  className="navigation-select"
                >
                  <option value="">All weather</option>
                  <option value="sunny">☀️ Sunny</option>
                  <option value="cloudy">☁️ Cloudy</option>
                  <option value="rainy">🌧️ Rainy</option>
                  <option value="snowy">❄️ Snowy</option>
                  <option value="windy">💨 Windy</option>
                  <option value="foggy">🌫️ Foggy</option>
                  <option value="stormy">⛈️ Stormy</option>
                </select>
              </div>
              <div className="navigation-filter-item">
                <label htmlFor="tags-filter">Tags</label>
                <input
                  id="tags-filter"
                  type="text"
                  value={filters.tags}
                  onChange={(e) => {
                    setFilters({ ...filters, tags: e.target.value });
                  }}
                  placeholder="Search tags..."
                  className="navigation-select"
                />
              </div>
            </div>
            <div className="navigation-group">
              <div className="navigation-group-title">Tools</div>
              <div className="navigation-placeholder">
                Coming soon: Metrics, Database, Export...
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="home-page">
      {/* Mobile View Selector */}
      <div className="mobile-view-selector-wrapper">
        <MobileViewSelector view={view} onViewChange={handleViewChange} />
      </div>

      {/* Desktop View Selector */}
      <div className="desktop-view-selector">
        <div className="view-selector">
          <button
            className={view === 'home' ? 'active' : ''}
            onClick={() => handleViewChange('home')}
          >
            Home
          </button>
          <button
            className={view === 'daily' ? 'active' : ''}
            onClick={() => handleViewChange('daily')}
          >
            Daily
          </button>
          <button
            className={view === 'weekly' ? 'active' : ''}
            onClick={() => handleViewChange('weekly')}
          >
            Weekly
          </button>
          <button
            className={view === 'monthly' ? 'active' : ''}
            onClick={() => handleViewChange('monthly')}
          >
            Monthly
          </button>
          <button
            className={view === 'yearly' ? 'active' : ''}
            onClick={() => handleViewChange('yearly')}
          >
            Yearly
          </button>
        </div>
      </div>

      {view === 'home' ? (
        <div className="home-overview">
          {/* Today Section */}
          <div className="home-section today-section">
            <div className="section-header">
              <h2>Today</h2>
              <span className="today-date">{format(new Date(), 'EEEE, MMMM dd, yyyy')}</span>
            </div>
            {todayEntry ? (
              <div className="today-entry-card">
                <div className="today-entry-header">
                  <h3>{todayEntry.title || 'Untitled Entry'}</h3>
                  <div className="today-entry-badges">
                    {todayEntry.mood && (
                      <span className="mood-badge">
                        {getMoodEmoji(todayEntry.mood)} {todayEntry.mood}
                      </span>
                    )}
                    {todayEntry.weather && (
                      <span className="weather-badge">
                        {getWeatherEmoji(todayEntry.weather)} {todayEntry.weather}
                      </span>
                    )}
                  </div>
                </div>
                {/* Photo thumbnails */}
                {todayEntry.attachments && todayEntry.attachments.filter(a => a.type === 'photo').length > 0 && (() => {
                  const photoAttachments = todayEntry.attachments.filter(a => a.type === 'photo');
                  // Production: Use REACT_APP_API_BASE_URL, Development: '/api' (proxy)
                  const API_URL = process.env.REACT_APP_API_BASE_URL || '/api';
                  // Upload base URL: In production, images are served from storage service URL
                  const UPLOAD_BASE_URL = API_URL === '/api' ? '' : API_URL.replace('/api', '');
                  return (
                    <div className="today-entry-photos">
                      {photoAttachments.slice(0, 3).map((photo, idx) => (
                        <img
                          key={idx}
                          src={`${UPLOAD_BASE_URL}${photo.url}`}
                          alt={photo.original_filename}
                          className="today-entry-photo-thumb"
                          onClick={() => {
                            const images = photoAttachments.map(p => ({
                              url: `${UPLOAD_BASE_URL}${p.url}`,
                              alt: p.original_filename,
                              filename: p.original_filename
                            }));
                            setLightboxImages(images);
                            setCurrentImageIndex(idx);
                          }}
                        />
                      ))}
                      {photoAttachments.length > 3 && (
                        <div 
                          className="today-entry-photo-more"
                          onClick={() => {
                            const images = photoAttachments.map(p => ({
                              url: `${UPLOAD_BASE_URL}${p.url}`,
                              alt: p.original_filename,
                              filename: p.original_filename
                            }));
                            setLightboxImages(images);
                            setCurrentImageIndex(3);
                          }}
                        >
                          +{photoAttachments.length - 3}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {todayEntry.content && (
                  <p className="today-entry-preview">
                    {todayEntry.content.length > 150
                      ? `${todayEntry.content.substring(0, 150)}...`
                      : todayEntry.content}
                  </p>
                )}
                <div className="today-entry-actions">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => {
                      console.log('Edit Entry clicked for today entry:', todayEntry.id);
                      navigate(`/entries/${todayEntry.id}/edit`, {
                        state: { returnPath: '/' }
                      });
                    }}
                  >
                    Edit Entry
                  </button>
                </div>
              </div>
            ) : (
              <div className="today-empty-state">
                <p className="empty-state-message">No entry for today yet.</p>
                  <button
                  className="cta-button"
                  onClick={() => {
                    console.log('Write Today\'s Entry clicked');
                    // For new entries, we'll use the existing form in Home view
                    setEditingEntry(null);
                    setShowEntryForm(true);
                    setSelectedDate(new Date());
                  }}
                >
                  Write Today's Entry
                </button>
              </div>
            )}
          </div>

          {/* Recent Entries Section */}
          <div className="home-section recent-entries-section">
            <div className="section-header">
              <h2>Recent Entries</h2>
              <button
                className="view-all-link"
                onClick={() => setView('daily')}
              >
                View All →
              </button>
            </div>
            {recentEntries.length > 0 ? (
              <div className="recent-entries-list">
                {recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="recent-entry-item"
                    onClick={() => {
                      setSelectedDate(new Date(entry.date));
                      setView('daily');
                    }}
                  >
                    <div className="recent-entry-date">
                      {format(new Date(entry.date), 'MMM dd, yyyy')}
                    </div>
                    <div className="recent-entry-content">
                      <h4>{entry.title || 'Untitled Entry'}</h4>
                      {entry.mood && (
                        <span className="recent-entry-mood">
                          {getMoodEmoji(entry.mood)} {entry.mood}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No recent entries. Start writing!</p>
              </div>
            )}
          </div>

          {/* Overview Stats Section */}
          <div className="home-section stats-section">
            <div className="section-header">
              <h2>Overview</h2>
            </div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{overviewStats.totalEntries}</div>
                <div className="stat-label">Total Entries</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{overviewStats.entriesThisWeek}</div>
                <div className="stat-label">This Week</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{overviewStats.entriesThisMonth}</div>
                <div className="stat-label">This Month</div>
              </div>
              {overviewStats.mostCommonMood && (
                <div className="stat-card">
                  <div className="stat-value">
                    {getMoodEmoji(overviewStats.mostCommonMood)}
                  </div>
                  <div className="stat-label">Most Common Mood</div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Drawer */}
          <MobileDrawer 
            isOpen={drawerOpen} 
            onClose={() => setDrawerOpen(false)}
          >
            {sidebarContent}
          </MobileDrawer>

          <div className="main-content">
            {/* Desktop Sidebar - only visible on desktop */}
            <div className="desktop-sidebar">
              {sidebarContent}
            </div>

        <div className="content-section">
          {error && <div className="error-message">{error}</div>}

          {showEntryForm && editingEntry ? (
            <div className="edit-entry-container">
              <div className="edit-entry-header">
                <h2>Edit Entry</h2>
                <button
                  className="close-edit-btn"
                  onClick={() => {
                    setShowEntryForm(false);
                    setEditingEntry(null);
                  }}
                  aria-label="Close edit form"
                >
                  ×
                </button>
              </div>
              <DiaryEntryForm
                entry={editingEntry}
                onSubmit={handleEntrySubmit}
                onCancel={() => {
                  setShowEntryForm(false);
                  setEditingEntry(null);
                }}
              />
            </div>
          ) : showEntryForm && !editingEntry ? (
            <div className="new-entry-container">
              <div className="edit-entry-header">
                <h2>New Entry</h2>
                <button
                  className="close-edit-btn"
                  onClick={() => {
                    setShowEntryForm(false);
                    setEditingEntry(null);
                  }}
                  aria-label="Close new entry form"
                >
                  ×
                </button>
              </div>
              <DiaryEntryForm
                entry={null}
                onSubmit={handleEntrySubmit}
                onCancel={() => {
                  setShowEntryForm(false);
                  setEditingEntry(null);
                }}
              />
            </div>
          ) : (
            <div>
              <div className="section-header">
                <h2>Diary Entries</h2>
                <button
                  onClick={() => {
                    setEditingEntry(null);
                    setShowEntryForm(true);
                    // Scroll to form
                    setTimeout(() => {
                      const formElement = document.querySelector('.new-entry-container');
                      if (formElement) {
                        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }}
                  className="add-btn"
                >
                  + New Entry
                </button>
              </div>

              {loading ? (
                <div className="loading">Loading...</div>
              ) : view === 'monthly' ? (
                <MonthlyEntryList
                  entries={entries}
                  onEdit={(entry) => {
                    // Navigate to edit route when clicking Edit button
                    navigate(`/entries/${entry.id}/edit`, {
                      state: { returnPath: '/' }
                    });
                  }}
                  onDelete={handleDeleteEntry}
                />
              ) : view === 'yearly' ? (
                <YearlyMonthSummary
                  selectedDate={selectedDate}
                  entries={entries}
                  onMonthClick={handleYearlyMonthClick}
                />
              ) : (
                <DiaryEntryList
                  entries={entries}
                  viewType={view}
                  onEdit={(entry) => {
                    // Navigate to edit route
                    navigate(`/entries/${entry.id}/edit`, {
                      state: { returnPath: '/' }
                    });
                  }}
                  onDelete={handleDeleteEntry}
                />
              )}
            </div>
          )}

          <div className="tasks-section">
            {showTaskForm ? (
              <TaskForm
                task={editingTask}
                onSubmit={handleTaskSubmit}
                onCancel={() => {
                  setShowTaskForm(false);
                  setEditingTask(null);
                }}
              />
            ) : (
              <div>
                <div className="section-header">
                  <h2>Tasks</h2>
                  <button
                    onClick={() => {
                      setEditingTask(null);
                      setShowTaskForm(true);
                    }}
                    className="add-btn"
                  >
                    + New Task
                  </button>
                </div>
                <TaskList
                  tasks={tasks}
                  onToggle={handleToggleTask}
                  onEdit={(task) => {
                    setEditingTask(task);
                    setShowTaskForm(true);
                  }}
                  onDelete={handleDeleteTask}
                />
              </div>
            )}
          </div>
          </div>
        </div>

        {/* Mobile Action Bar */}
        {view !== 'home' && !showEntryForm && (
          <MobileActionBar
            onNewEntry={() => {
              setEditingEntry(null);
              setShowEntryForm(true);
            }}
          />
        )}
        </>
      )}

      {/* Image Lightbox for Home page */}
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

export default Home;

