import React from 'react';
import { format } from 'date-fns';
import './TaskList.css';

const TaskList = ({ tasks, onToggle, onEdit, onDelete, diaryEntryId = null }) => {
  const filteredTasks = diaryEntryId
    ? tasks.filter(t => t.diary_entry_id === diaryEntryId)
    : tasks;

  if (filteredTasks.length === 0) {
    return (
      <div className="empty-tasks">
        <p>No tasks yet. Add a task to get started!</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      <h3>Tasks</h3>
      {filteredTasks.map((task) => (
        <div
          key={task.id}
          className={`task-item ${task.completed ? 'completed' : ''} priority-${task.priority}`}
        >
          <div className="task-content">
            <div className="task-header">
              <input
                type="checkbox"
                checked={task.completed === 1}
                onChange={() => onToggle && onToggle(task.id)}
                className="task-checkbox"
              />
              <h4>{task.title}</h4>
            </div>
            {task.description && (
              <p className="task-description">{task.description}</p>
            )}
            {task.due_date && (
              <p className="task-due-date">
                Due: {format(new Date(task.due_date), 'MMM dd, yyyy')}
              </p>
            )}
            <span className={`priority-badge priority-${task.priority}`}>
              {task.priority}
            </span>
          </div>
          <div className="task-actions">
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="task-action-btn edit"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(task.id)}
                className="task-action-btn delete"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;



