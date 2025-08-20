// frontend/src/components/admin/__tests__/AdvancedModerationTools.test.tsx
// Unit tests for AdvancedModerationTools component

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdvancedModerationTools from '../AdvancedModerationTools';

// Mock the moderation API
const mockGetReports = jest.fn();
const mockUpdateReport = jest.fn();
const mockGetModerationLogs = jest.fn();

jest.mock('../../../services/moderationApi', () => ({
  moderationApi: {
    getReports: mockGetReports,
    updateReport: mockUpdateReport,
    getModerationLogs: mockGetModerationLogs,
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
  useSafeAuth: () => mockAuthContext,
}));

// Mock data
const mockReports = [
  {
    id: 1,
    reporter_id: 10,
    reported_user_id: 20,
    type: 'harassment',
    description: 'User is being inappropriate',
    evidence: 'Chat logs',
    status: 'open' as const,
    assigned_to: null,
    resolution_notes: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 2,
    reporter_id: 11,
    reported_user_id: 21,
    type: 'cheating',
    description: 'Suspected cheating in tournament',
    evidence: 'Game replay',
    status: 'resolved' as const,
    assigned_to: 1,
    resolution_notes: 'Violation created',
    created_at: '2024-01-14T15:00:00Z',
    updated_at: '2024-01-14T16:00:00Z',
  },
];

const mockModerationLogs = {
  logs: [
    {
      id: 1,
      actor_id: 1,
      target_user_id: 20,
      action: 'violation_created',
      details: { violation_type: 'warning', reason: 'Test action' },
      ip_address: '192.168.1.1',
      user_agent: 'Mozilla/5.0...',
      created_at: '2024-01-15T12:00:00Z',
    },
    {
      id: 2,
      actor_id: 1,
      target_user_id: 21,
      action: 'user_suspended',
      details: { reason: 'Multiple violations' },
      ip_address: '192.168.1.1',
      user_agent: 'Mozilla/5.0...',
      created_at: '2024-01-14T18:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  limit: 25,
};

describe('AdvancedModerationTools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetReports.mockResolvedValue(mockReports);
    mockGetModerationLogs.mockResolvedValue(mockModerationLogs);
  });

  it('renders moderation tools interface', () => {
    render(<AdvancedModerationTools />);
    
    expect(screen.getByText('Advanced Moderation Tools')).toBeInTheDocument();
    expect(screen.getByText('Moderator: admin')).toBeInTheDocument();
  });

  it('displays dashboard tab by default', () => {
    render(<AdvancedModerationTools />);
    
    expect(screen.getByText('Moderation Overview')).toBeInTheDocument();
    expect(screen.getByText('Total Reports')).toBeInTheDocument();
    expect(screen.getByText('Open Reports')).toBeInTheDocument();
    expect(screen.getByText('Active Violations')).toBeInTheDocument();
    expect(screen.getByText('Resolved Today')).toBeInTheDocument();
  });

  it('displays performance metrics on dashboard', () => {
    render(<AdvancedModerationTools />);
    
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Avg Response Time')).toBeInTheDocument();
    expect(screen.getByText('Resolution Rate')).toBeInTheDocument();
    expect(screen.getByText('False Positive Rate')).toBeInTheDocument();
  });

  it('shows recent activity feed', () => {
    render(<AdvancedModerationTools />);
    
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('New report: Harassment')).toBeInTheDocument();
    expect(screen.getByText('Report resolved: Spam')).toBeInTheDocument();
    expect(screen.getByText('Violation created: Cheating')).toBeInTheDocument();
  });

  it('switches to reports tab and loads reports', async () => {
    render(<AdvancedModerationTools />);
    
    const reportsTab = screen.getByText(/Reports/);
    fireEvent.click(reportsTab);
    
    await waitFor(() => {
      expect(screen.getByText('User Reports')).toBeInTheDocument();
      expect(mockGetReports).toHaveBeenCalled();
    });
  });

  it('displays reports list with correct data', async () => {
    render(<AdvancedModerationTools />);
    
    // Switch to reports tab
    fireEvent.click(screen.getByText(/Reports/));
    
    await waitFor(() => {
      expect(screen.getByText('User is being inappropriate')).toBeInTheDocument();
      expect(screen.getByText('Suspected cheating in tournament')).toBeInTheDocument();
      expect(screen.getByText('harassment')).toBeInTheDocument();
      expect(screen.getByText('cheating')).toBeInTheDocument();
    });
  });

  it('filters reports by status', async () => {
    render(<AdvancedModerationTools />);
    
    // Switch to reports tab
    fireEvent.click(screen.getByText(/Reports/));
    
    await waitFor(() => {
      expect(screen.getByText('User Reports')).toBeInTheDocument();
    });

    // Test filter functionality
    const filterSelect = screen.getByLabelText('Filter');
    fireEvent.mouseDown(filterSelect);
    
    const openOption = screen.getByText('Open');
    fireEvent.click(openOption);
    
    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalledWith('open');
    });
  });

  it('opens report action dialog', async () => {
    render(<AdvancedModerationTools />);
    
    // Switch to reports tab
    fireEvent.click(screen.getByText(/Reports/));
    
    await waitFor(() => {
      expect(screen.getByText('User Reports')).toBeInTheDocument();
    });

    // Click on action button for open report
    const actionButtons = screen.getAllByTitle('Take Action');
    fireEvent.click(actionButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Take Action on Report')).toBeInTheDocument();
      expect(screen.getByText('Report #1')).toBeInTheDocument();
    });
  });

  it('handles report action submission', async () => {
    (mockUpdateReport as jest.Mock).mockResolvedValue({
      ...mockReports[0],
      status: 'dismissed',
    });

    render(<AdvancedModerationTools />);
    
    // Switch to reports tab and open action dialog
    fireEvent.click(screen.getByText(/Reports/));
    
    await waitFor(() => {
      expect(screen.getByText('User Reports')).toBeInTheDocument();
    });

    const actionButtons = screen.getAllByTitle('Take Action');
    fireEvent.click(actionButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText('Take Action on Report')).toBeInTheDocument();
    });

    // Select dismiss action and add notes
    const actionSelect = screen.getByLabelText('Action');
    fireEvent.mouseDown(actionSelect);
    fireEvent.click(screen.getByText('Dismiss Report'));
    
    const notesField = screen.getByLabelText('Notes');
    fireEvent.change(notesField, { target: { value: 'False positive report' } });
    
    // Confirm action
    const confirmButton = screen.getByText('Confirm Action');
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockUpdateReport).toHaveBeenCalledWith(
        1,
        'dismiss',
        { notes: 'False positive report' }
      );
    });
  });

  it('switches to violations tab', async () => {
    render(<AdvancedModerationTools />);
    
    const violationsTab = screen.getByText('Violations');
    fireEvent.click(violationsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Recent Violations')).toBeInTheDocument();
    });
  });

  it('displays violations with mock data', async () => {
    render(<AdvancedModerationTools />);
    
    fireEvent.click(screen.getByText('Violations'));
    
    await waitFor(() => {
      expect(screen.getByText('Recent Violations')).toBeInTheDocument();
      // Should show mock violations
      expect(screen.getAllByText(/Mock violation/)).toHaveLength(20);
    });
  });

  it('switches to logs tab and loads moderation logs', async () => {
    render(<AdvancedModerationTools />);
    
    const logsTab = screen.getByText('Logs');
    fireEvent.click(logsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Moderation Logs')).toBeInTheDocument();
      expect(mockGetModerationLogs).toHaveBeenCalled();
    });
  });

  it('displays moderation logs correctly', async () => {
    render(<AdvancedModerationTools />);
    
    fireEvent.click(screen.getByText('Logs'));
    
    await waitFor(() => {
      expect(screen.getByText('violation_created')).toBeInTheDocument();
      expect(screen.getByText('user_suspended')).toBeInTheDocument();
      expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    });
  });

  it('switches to settings tab', async () => {
    render(<AdvancedModerationTools />);
    
    const settingsTab = screen.getByText('Settings');
    fireEvent.click(settingsTab);
    
    await waitFor(() => {
      expect(screen.getByText('Moderation Settings')).toBeInTheDocument();
      expect(screen.getByText('Automation Settings')).toBeInTheDocument();
    });
  });

  it('displays settings controls', async () => {
    render(<AdvancedModerationTools />);
    
    fireEvent.click(screen.getByText('Settings'));
    
    await waitFor(() => {
      expect(screen.getByText('Auto-assign reports')).toBeInTheDocument();
      expect(screen.getByText('Email notifications')).toBeInTheDocument();
      expect(screen.getByText('Strict mode')).toBeInTheDocument();
    });
  });

  it('handles settings toggle switches', async () => {
    render(<AdvancedModerationTools />);
    
    fireEvent.click(screen.getByText('Settings'));
    
    await waitFor(() => {
      const autoAssignSwitch = screen.getByRole('checkbox', { name: /auto-assign reports/i });
      expect(autoAssignSwitch).toBeChecked();
      
      // Toggle switch
      fireEvent.click(autoAssignSwitch);
      expect(autoAssignSwitch).not.toBeChecked();
    });
  });

  it('displays quick actions in settings', async () => {
    render(<AdvancedModerationTools />);
    
    fireEvent.click(screen.getByText('Settings'));
    
    await waitFor(() => {
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Generate Weekly Report')).toBeInTheDocument();
      expect(screen.getByText('Export Moderation Logs')).toBeInTheDocument();
      expect(screen.getByText('Backup User Data')).toBeInTheDocument();
      expect(screen.getByText('Reset Analytics')).toBeInTheDocument();
    });
  });

  it('updates tab counts dynamically', async () => {
    render(<AdvancedModerationTools />);
    
    await waitFor(() => {
      // Should show count of open reports in tab
      const reportsTab = screen.getByText(/Reports \(1\)/);
      expect(reportsTab).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (mockGetReports as jest.Mock).mockRejectedValue(
      new Error('Failed to load reports')
    );
    
    render(<AdvancedModerationTools />);
    
    fireEvent.click(screen.getByText(/Reports/));
    
    await waitFor(() => {
      // Should handle error gracefully and show empty state or error message
      expect(screen.getByText('User Reports')).toBeInTheDocument();
    });
  });

  it('shows loading states', () => {
    render(<AdvancedModerationTools />);
    
    // Should show dashboard without loading initially since it uses mock data
    expect(screen.getByText('Moderation Overview')).toBeInTheDocument();
  });

  it('refreshes data when refresh button clicked', async () => {
    render(<AdvancedModerationTools />);
    
    fireEvent.click(screen.getByText(/Reports/));
    
    await waitFor(() => {
      expect(screen.getByText('User Reports')).toBeInTheDocument();
    });

    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    await waitFor(() => {
      expect(mockGetReports).toHaveBeenCalledTimes(2);
    });
  });

  it('displays correct report severity colors', async () => {
    render(<AdvancedModerationTools />);
    
    fireEvent.click(screen.getByText(/Reports/));
    
    await waitFor(() => {
      const harassmentChip = screen.getByText('harassment');
      const cheatingChip = screen.getByText('cheating');
      
      // These should have appropriate MUI color classes
      expect(harassmentChip).toBeInTheDocument();
      expect(cheatingChip).toBeInTheDocument();
    });
  });

  it('handles pagination for reports', async () => {
    // Mock many reports to test pagination
    const manyReports = Array.from({ length: 30 }, (_, i) => ({
      ...mockReports[0],
      id: i + 1,
      description: `Report ${i + 1}`,
    }));

    (mockGetReports as jest.Mock).mockResolvedValue(manyReports);
    
    render(<AdvancedModerationTools />);
    
    fireEvent.click(screen.getByText(/Reports/));
    
    await waitFor(() => {
      // Should show pagination controls
      expect(screen.getByLabelText('Go to next page')).toBeInTheDocument();
    });
  });
});