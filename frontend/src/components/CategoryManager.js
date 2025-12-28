import React, { useState, useEffect } from 'react';
import { categoriesAPI } from '../services/api';
import './CategoryManager.css';

/**
 * CategoryManager Component
 * Simple UI for managing categories (list, create, delete)
 * Used in Navigation panel
 */
const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(false);

  // Load categories on mount
  useEffect(() => {
    if (expanded) {
      loadCategories();
    }
  }, [expanded]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await categoriesAPI.getCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      setError('');
      const response = await categoriesAPI.createCategory(newCategoryName.trim());
      setCategories([...categories, response.data]);
      setNewCategoryName('');
      // Trigger a custom event to refresh category dropdowns in forms
      window.dispatchEvent(new CustomEvent('categoriesUpdated'));
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err.response?.data?.error || 'Failed to create category');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? Entries using this category will have their category removed.')) {
      return;
    }

    try {
      setError('');
      await categoriesAPI.deleteCategory(id);
      setCategories(categories.filter(cat => cat.id !== id));
      // Trigger a custom event to refresh category dropdowns in forms
      window.dispatchEvent(new CustomEvent('categoriesUpdated'));
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.response?.data?.error || 'Failed to delete category');
    }
  };

  return (
    <div className="category-manager">
      <div className="category-manager-header">
        <h4 className="category-manager-title">Categories</h4>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="category-manager-toggle"
          aria-label={expanded ? "Collapse categories" : "Expand categories"}
        >
          {expanded ? '▼' : '▶'}
        </button>
      </div>
      
      {expanded && (
        <div className="category-manager-content">
          {error && <div className="category-manager-error">{error}</div>}
          
          {/* Create new category */}
          <form onSubmit={handleCreateCategory} className="category-create-form">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="New category name..."
              className="category-input"
              maxLength={255}
            />
            <button type="submit" className="category-add-btn" disabled={loading}>
              + Add
            </button>
          </form>

          {/* List categories */}
          {loading && categories.length === 0 ? (
            <div className="category-loading">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="category-empty">No categories yet. Create one above!</div>
          ) : (
            <ul className="category-list">
              {categories.map(category => (
                <li key={category.id} className="category-item">
                  <span className="category-name">{category.name}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="category-delete-btn"
                    title="Delete category"
                    aria-label={`Delete ${category.name}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryManager;

