import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskList from '../TaskList';

const mockTasks = [
  {
    id: 1,
    title: 'Test Task 1',
    description: 'Description 1',
    completed: 0,
    priority: 'high',
    due_date: '2024-12-31',
  },
  {
    id: 2,
    title: 'Test Task 2',
    description: 'Description 2',
    completed: 1,
    priority: 'low',
    due_date: null,
  },
];

describe('TaskList Component', () => {
  const mockToggle = jest.fn();
  const mockEdit = jest.fn();
  const mockDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tasks list', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onToggle={mockToggle}
        onEdit={mockEdit}
        onDelete={mockDelete}
      />
    );

    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
  });

  it('displays empty state when no tasks', () => {
    render(<TaskList tasks={[]} />);
    expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
  });

  it('calls onToggle when checkbox is clicked', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onToggle={mockToggle}
        onEdit={mockEdit}
        onDelete={mockDelete}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(mockToggle).toHaveBeenCalledWith(1);
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onToggle={mockToggle}
        onEdit={mockEdit}
        onDelete={mockDelete}
      />
    );

    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    expect(mockEdit).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <TaskList
        tasks={mockTasks}
        onToggle={mockToggle}
        onEdit={mockEdit}
        onDelete={mockDelete}
      />
    );

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]);

    expect(mockDelete).toHaveBeenCalledWith(1);
  });

  it('applies completed class to completed tasks', () => {
    const { container } = render(
      <TaskList
        tasks={mockTasks}
        onToggle={mockToggle}
        onEdit={mockEdit}
        onDelete={mockDelete}
      />
    );

    const taskItems = container.querySelectorAll('.task-item');
    expect(taskItems[1]).toHaveClass('completed');
  });
});




