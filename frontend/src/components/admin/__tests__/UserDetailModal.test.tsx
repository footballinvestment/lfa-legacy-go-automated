// frontend/src/components/admin/__tests__/UserDetailModal.test.tsx
// Unit tests for UserDetailModal component

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserDetailModal from '../UserDetailModal';
import { moderationApi } from '../../../services/moderationApi';

// Mock the moderation API
jest.mock('../../../services/moderationApi', () => ({
  moderationApi: {
    getUser: jest.fn(),
    updateUser: jest.fn(),
    getUserViolations: jest.fn(),
    createViolation: jest.fn(),
    updateViolation: jest.fn(),
    deleteViolation: jest.fn(),
  },
}));

// Mock auth context
const mockAuthContext = {
  user: { id: 1, username: 'admin', roles: ['admin'] },
  isAuthenticated: true,
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  refreshStats: jest.fn(),
};

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext,
}));

// Mock user data
const mockUserData = {
  id: 123,
  email: 'testuser@example.com',
  name: 'Test User',
  roles: ['player'],
  status: 'active' as const,
  created_at: '2024-01-01T00:00:00Z',
  last_login: '2024-01-15T12:00:00Z',
  profile: {
    bio: 'Test bio',
    location: 'Test City',
    phone: '+1234567890',
  },
  game_stats: {
    tournaments_played: 10,
    wins: 6,
    losses: 4,
    win_rate: 60,
    total_points: 1200,
    rank: 25,
  },
  violations: [],
};

const mockViolations = [
  {
    id: 1,
    user_id: 123,
    type: 'warning',
    reason: 'Test violation',
    notes: 'Test notes',
    created_by: 1,
    created_at: '2024-01-10T10:00:00Z',
    status: 'active',
  },
];

describe('UserDetailModal', () => {
  const defaultProps = {
    userId: 123,
    open: true,
    onClose: jest.fn(),
    onUserUpdate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (moderationApi.getUser as jest.Mock).mockResolvedValue(mockUserData);
    (moderationApi.getUserViolations as jest.Mock).mockResolvedValue({
      items: mockViolations,
      total: 1,
      page: 1,
      limit: 25,
      total_pages: 1,
    });
  });

  it('renders modal when open', async () => {
    render(<UserDetailModal {...defaultProps} />);
    
    expect(screen.getByText('User Details')).toBeInTheDocument();
    
    // Wait for user data to load
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('does not render when closed', () => {
    render(<UserDetailModal {...defaultProps} open={false} />);
    
    expect(screen.queryByText('User Details')).not.toBeInTheDocument();
  });

  it('loads user data on mount', async () => {
    render(<UserDetailModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(moderationApi.getUser).toHaveBeenCalledWith(123);
    });
  });

  it('displays user information in overview tab', async () => {
    render(<UserDetailModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('testuser@example.com')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
    });
  });

  it('switches between tabs correctly', async () => {
    render(<UserDetailModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Click on Profile tab
    const profileTab = screen.getByText('Profile');
    fireEvent.click(profileTab);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      expect(screen.getByDisplayValue('testuser@example.com')).toBeInTheDocument();
    });

    // Click on Violations tab
    const violationsTab = screen.getByText('Violations');
    fireEvent.click(violationsTab);
    
    await waitFor(() => {
      expect(screen.getByText('User Violations')).toBeInTheDocument();
    });
  });

  it('handles tab navigation', async () => {
    render(<UserDetailModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Test all tabs are present
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Violations')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // Test clicking History tab
    fireEvent.click(screen.getByText('History'));
    
    await waitFor(() => {
      expect(screen.getByText('User Activity History')).toBeInTheDocument();
    });
  });

  it('displays game statistics', async () => {
    render(<UserDetailModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument(); // tournaments played
      expect(screen.getByText('60%')).toBeInTheDocument(); // win rate
      expect(screen.getByText('1200')).toBeInTheDocument(); // total points
      expect(screen.getByText('25')).toBeInTheDocument(); // rank
    });
  });

  it('calls onClose when close button is clicked', async () => {
    const mockOnClose = jest.fn();
    render(<UserDetailModal {...defaultProps} onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const closeButton = screen.getByLabelText('close');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    mockGetUser.mockRejectedValue(
      new Error('Failed to load user')
    );
    
    render(<UserDetailModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load user details')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    render(<UserDetailModal {...defaultProps} />);
    
    // Should show loading initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('handles user updates', async () => {
    const mockOnUserUpdate = jest.fn();
    render(<UserDetailModal {...defaultProps} onUserUpdate={mockOnUserUpdate} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Navigate to Profile tab
    fireEvent.click(screen.getByText('Profile'));
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });

    // Simulate saving profile changes
    mockUpdateUser.mockResolvedValue({
      ...mockUserData,
      name: 'Updated Name',
    });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalled();
      expect(mockOnUserUpdate).toHaveBeenCalled();
    });
  });

  it('handles violations tab functionality', async () => {
    render(<UserDetailModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Navigate to Violations tab
    fireEvent.click(screen.getByText('Violations'));
    
    await waitFor(() => {
      expect(screen.getByText('User Violations')).toBeInTheDocument();
      expect(screen.getByText('Test violation')).toBeInTheDocument();
    });

    // Test Add Violation button
    const addButton = screen.getByText('Add Violation');
    fireEvent.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText('Add New Violation')).toBeInTheDocument();
    });
  });

  it('displays violation count badge on violations tab', async () => {
    render(<UserDetailModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Should show violation count badge
    const violationsTab = screen.getByText('Violations (1)');
    expect(violationsTab).toBeInTheDocument();
  });

  it('handles empty violations list', async () => {
    mockGetUserViolations.mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      limit: 25,
      total_pages: 0,
    });

    render(<UserDetailModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Navigate to Violations tab
    fireEvent.click(screen.getByText('Violations'));
    
    await waitFor(() => {
      expect(screen.getByText('No violations found')).toBeInTheDocument();
    });
  });

  it('handles settings tab functionality', async () => {
    render(<UserDetailModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // Navigate to Settings tab
    fireEvent.click(screen.getByText('Settings'));
    
    await waitFor(() => {
      expect(screen.getByText('Account Settings')).toBeInTheDocument();
      expect(screen.getByText('Change Status')).toBeInTheDocument();
    });
  });

  it('refreshes data when userId changes', async () => {
    const { rerender } = render(<UserDetailModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(moderationApi.getUser).toHaveBeenCalledWith(123);
    });

    // Change userId and rerender
    rerender(<UserDetailModal {...defaultProps} userId={456} />);
    
    await waitFor(() => {
      expect(moderationApi.getUser).toHaveBeenCalledWith(456);
    });
  });
});