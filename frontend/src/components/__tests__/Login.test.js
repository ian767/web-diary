import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../contexts/ThemeContext';
import Login from '../Login';
import { authAPI } from '../../services/api';

// Mock the API
jest.mock('../../services/api', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderLogin = () => {
  return render(
    <ThemeProvider>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </ThemeProvider>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form by default', () => {
    renderLogin();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('switches to register form', () => {
    renderLogin();
    const registerButton = screen.getByText('Register');
    fireEvent.click(registerButton);
    
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderLogin();
    const submitButton = screen.getByText('Login');
    fireEvent.click(submitButton);
    
    // HTML5 validation should prevent submission
    const usernameInput = screen.getByLabelText('Username');
    expect(usernameInput).toBeRequired();
  });

  it('handles successful login', async () => {
    const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };
    authAPI.login.mockResolvedValue({
      data: {
        token: 'mock-token',
        user: mockUser,
      },
    });

    renderLogin();
    
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(authAPI.login).toHaveBeenCalledWith('testuser', 'password123');
    });
  });

  it('displays error message on login failure', async () => {
    authAPI.login.mockRejectedValue({
      response: {
        data: { error: 'Invalid credentials' },
      },
    });

    renderLogin();
    
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpassword' },
    });
    
    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });

  it('validates password length on registration', async () => {
    renderLogin();
    const registerButton = screen.getByText('Register');
    fireEvent.click(registerButton);

    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'newuser' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'newuser@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: '12345' },
    });
    fireEvent.change(screen.getByLabelText('Confirm Password'), {
      target: { value: '12345' },
    });

    fireEvent.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });
});

