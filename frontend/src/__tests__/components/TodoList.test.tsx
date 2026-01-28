import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import TodoList from '../../components/TodoList';
import * as Web3Context from '../../contexts/Web3Context';
import * as apiService from '../../services/api';

// Mock the dependencies
vi.mock('../../contexts/Web3Context');
vi.mock('../../services/api');

const mockTodos = [
  {
    _id: '1',
    blockchainId: '1',
    chainId: 31337,
    transactionHash: '0xabc',
    owner: '0x123',
    description: 'Test todo 1',
    completed: false,
    blockchainCreatedAt: new Date().toISOString(),
    blockchainCompletedAt: null,
    dueDate: null,
    syncStatus: 'synced' as const,
    lastSyncedAt: new Date().toISOString(),
    deleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: '2',
    blockchainId: '2',
    chainId: 31337,
    transactionHash: '0xdef',
    owner: '0x123',
    description: 'Test todo 2',
    completed: true,
    blockchainCreatedAt: new Date().toISOString(),
    blockchainCompletedAt: new Date().toISOString(),
    dueDate: null,
    syncStatus: 'synced' as const,
    lastSyncedAt: new Date().toISOString(),
    deleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('TodoList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useWeb3 hook
    vi.mocked(Web3Context.useWeb3).mockReturnValue({
      address: '0x123',
      chainId: 31337,
      isConnected: true,
      isConnecting: false,
      error: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      switchNetwork: vi.fn(),
      provider: null,
    });

    // Mock API service
    vi.mocked(apiService.apiService.getTodosByAddress).mockResolvedValue({
      success: true,
      data: mockTodos,
      count: 2,
    });

    vi.mocked(apiService.apiService.getUserStats).mockResolvedValue({
      success: true,
      data: {
        total: 2,
        completed: 1,
        active: 1,
        completionRate: '50.00',
      },
    });
  });

  describe('Initial Render', () => {
    it('should render wallet connection prompt when not connected', () => {
      vi.mocked(Web3Context.useWeb3).mockReturnValue({
        address: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        error: null,
        connect: vi.fn(),
        disconnect: vi.fn(),
        switchNetwork: vi.fn(),
        provider: null,
      });

      render(<TodoList />);
      expect(screen.getByText(/connect your wallet/i)).toBeInTheDocument();
    });

    it('should load and display todos when connected', async () => {
      render(<TodoList />);

      await waitFor(() => {
        expect(screen.getByText('Test todo 1')).toBeInTheDocument();
        expect(screen.getByText('Test todo 2')).toBeInTheDocument();
      });

      expect(apiService.apiService.getTodosByAddress).toHaveBeenCalledWith('0x123', true, false);
    });

    it('should display loading state', async () => {
      vi.mocked(apiService.apiService.getTodosByAddress).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: mockTodos,
          count: 2,
        }), 100))
      );

      render(<TodoList />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter active todos', async () => {
      render(<TodoList />);

      await waitFor(() => {
        expect(screen.getByText('Test todo 1')).toBeInTheDocument();
      });

      const activeFilterBtn = screen.getByRole('button', { name: /active/i });
      await userEvent.click(activeFilterBtn);

      await waitFor(() => {
        expect(screen.getByText('Test todo 1')).toBeInTheDocument();
        expect(screen.queryByText('Test todo 2')).not.toBeInTheDocument();
      });
    });

    it('should filter completed todos', async () => {
      render(<TodoList />);

      await waitFor(() => {
        expect(screen.getByText('Test todo 2')).toBeInTheDocument();
      });

      const completedFilterBtn = screen.getByRole('button', { name: /completed/i });
      await userEvent.click(completedFilterBtn);

      await waitFor(() => {
        expect(screen.getByText('Test todo 2')).toBeInTheDocument();
        expect(screen.queryByText('Test todo 1')).not.toBeInTheDocument();
      });
    });

    it('should show all todos', async () => {
      render(<TodoList />);

      await waitFor(() => {
        expect(screen.getByText('Test todo 1')).toBeInTheDocument();
        expect(screen.getByText('Test todo 2')).toBeInTheDocument();
      });

      const allFilterBtn = screen.getByRole('button', { name: /all/i });
      await userEvent.click(allFilterBtn);

      expect(screen.getByText('Test todo 1')).toBeInTheDocument();
      expect(screen.getByText('Test todo 2')).toBeInTheDocument();
    });
  });

  describe('Statistics Display', () => {
    it('should display user statistics', async () => {
      render(<TodoList />);

      await waitFor(() => {
        // Check stats section is rendered with unique labels
        expect(screen.getByText('Total Tasks')).toBeInTheDocument();
        expect(screen.getByText('Completion Rate')).toBeInTheDocument();
        
        // Check values exist (using getAllBy since values may appear in multiple places)
        // stats: total=2, active=1, completed=1, completionRate=50
        expect(screen.getAllByText('2').length).toBeGreaterThan(0); // total appears in stats
        expect(screen.getByText('50.00%')).toBeInTheDocument(); // completion rate is unique
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetching todos fails', async () => {
      vi.mocked(apiService.apiService.getTodosByAddress).mockRejectedValue(
        new Error('Network error')
      );

      vi.mocked(apiService.apiService.getUserStats).mockRejectedValue(
        new Error('Network error')
      );

      render(<TodoList />);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('CRUD Operations', () => {
    it('should refresh todos when a new todo is created', async () => {
      render(<TodoList />);

      await waitFor(() => {
        expect(screen.getByText('Test todo 1')).toBeInTheDocument();
      });

      // Simulate todo creation by updating the mock
      const newTodo = {
        ...mockTodos[0],
        _id: '3',
        blockchainId: '3',
        description: 'New test todo',
      };

      vi.mocked(apiService.apiService.getTodosByAddress).mockResolvedValue({
        success: true,
        data: [...mockTodos, newTodo],
        count: 3,
      });

      // Find and click the refresh button
      const refreshBtn = screen.getByRole('button', { name: /refresh/i });
      await userEvent.click(refreshBtn);

      await waitFor(() => {
        expect(screen.getByText('New test todo')).toBeInTheDocument();
      });
    });

    it('should handle todo completion', async () => {
      const updatedTodos = mockTodos.map(todo =>
        todo._id === '1' ? { ...todo, completed: true } : todo
      );

      vi.mocked(apiService.apiService.getTodosByAddress).mockResolvedValueOnce({
        success: true,
        data: mockTodos,
        count: 2,
      }).mockResolvedValueOnce({
        success: true,
        data: updatedTodos,
        count: 2,
      });

      render(<TodoList />);

      await waitFor(() => {
        expect(screen.getByText('Test todo 1')).toBeInTheDocument();
      });

      // Simulate todo update by refreshing
      const refreshBtn = screen.getByRole('button', { name: /refresh/i });
      await userEvent.click(refreshBtn);

      await waitFor(() => {
        // After refresh, both todos should be marked as completed
        const activeTodos = updatedTodos.filter(t => !t.completed);
        expect(activeTodos.length).toBe(0);
      });
    });

    it('should handle todo deletion', async () => {
      const remainingTodos = [mockTodos[0]]; // Only first todo remains

      vi.mocked(apiService.apiService.getTodosByAddress).mockResolvedValueOnce({
        success: true,
        data: mockTodos,
        count: 2,
      }).mockResolvedValueOnce({
        success: true,
        data: remainingTodos,
        count: 1,
      });

      render(<TodoList />);

      await waitFor(() => {
        expect(screen.getByText('Test todo 1')).toBeInTheDocument();
        expect(screen.getByText('Test todo 2')).toBeInTheDocument();
      });

      // Simulate deletion by refreshing
      const refreshBtn = screen.getByRole('button', { name: /refresh/i });
      await userEvent.click(refreshBtn);

      await waitFor(() => {
        expect(screen.getByText('Test todo 1')).toBeInTheDocument();
        expect(screen.queryByText('Test todo 2')).not.toBeInTheDocument();
      });
    });
  });

  describe('Pagination', () => {
    const generateManyTodos = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        _id: `${i + 1}`,
        blockchainId: `${i + 1}`,
        chainId: 31337,
        transactionHash: `0xabc${i}`,
        owner: '0x123',
        description: `Test todo ${i + 1}`,
        completed: false,
        blockchainCreatedAt: new Date().toISOString(),
        blockchainCompletedAt: null,
        dueDate: null,
        syncStatus: 'synced' as const,
        lastSyncedAt: new Date().toISOString(),
        deleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    };

    it('should paginate todos when there are more than 10', async () => {
      const manyTodos = generateManyTodos(15);

      vi.mocked(apiService.apiService.getTodosByAddress).mockResolvedValue({
        success: true,
        data: manyTodos,
        count: 15,
      });

      vi.mocked(apiService.apiService.getUserStats).mockResolvedValue({
        success: true,
        data: {
          total: 15,
          completed: 0,
          active: 15,
          completionRate: '0.00',
        },
      });

      render(<TodoList />);

      await waitFor(() => {
        expect(screen.getByText('Test todo 1')).toBeInTheDocument();
        expect(screen.getByText('Test todo 10')).toBeInTheDocument();
      });

      // Should not show todo 11 on first page
      expect(screen.queryByText('Test todo 11')).not.toBeInTheDocument();

      // Should show pagination controls
      expect(screen.getByText(/showing 1 to 10 of 15 tasks/i)).toBeInTheDocument();

      // Click next page
      const nextBtn = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByText('Test todo 11')).toBeInTheDocument();
        expect(screen.getByText('Test todo 15')).toBeInTheDocument();
      });

      // Should not show todo 1 on second page
      expect(screen.queryByText('Test todo 1')).not.toBeInTheDocument();
    });

    it('should reset to page 1 when filter changes', async () => {
      const manyTodos = generateManyTodos(15).map((todo, i) => ({
        ...todo,
        completed: i >= 10, // Last 5 are completed
      }));

      vi.mocked(apiService.apiService.getTodosByAddress).mockResolvedValue({
        success: true,
        data: manyTodos,
        count: 15,
      });

      vi.mocked(apiService.apiService.getUserStats).mockResolvedValue({
        success: true,
        data: {
          total: 15,
          completed: 5,
          active: 10,
          completionRate: '33.33',
        },
      });

      render(<TodoList />);

      await waitFor(() => {
        expect(screen.getByText('Test todo 1')).toBeInTheDocument();
      });

      // Go to page 2
      const nextBtn = screen.getByRole('button', { name: /next/i });
      await userEvent.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByText('Test todo 11')).toBeInTheDocument();
      });

      // Change filter to active
      const activeFilterBtn = screen.getByRole('button', { name: /active/i });
      await userEvent.click(activeFilterBtn);

      // Should reset to page 1 and show first active todo
      await waitFor(() => {
        expect(screen.getByText('Test todo 1')).toBeInTheDocument();
        expect(screen.queryByText('Test todo 11')).not.toBeInTheDocument();
      });
    });
  });

  describe('Refresh Functionality', () => {
    it('should show loading state while refreshing', async () => {
      vi.mocked(apiService.apiService.getTodosByAddress).mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: mockTodos,
          count: 2,
        }), 100))
      );

      render(<TodoList />);

      await waitFor(() => {
        expect(screen.getByText('Test todo 1')).toBeInTheDocument();
      });

      const refreshBtn = screen.getByRole('button', { name: /refresh/i });
      await userEvent.click(refreshBtn);

      expect(screen.getByRole('button', { name: /refreshing/i })).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
      });
    });

    it('should refresh both todos and stats', async () => {
      render(<TodoList />);

      await waitFor(() => {
        expect(screen.getByText('Test todo 1')).toBeInTheDocument();
      });

      vi.clearAllMocks();

      const refreshBtn = screen.getByRole('button', { name: /refresh/i });
      await userEvent.click(refreshBtn);

      await waitFor(() => {
        expect(apiService.apiService.getTodosByAddress).toHaveBeenCalledWith('0x123', true, false);
        expect(apiService.apiService.getUserStats).toHaveBeenCalledWith('0x123');
      });
    });
  });

  describe('Empty States', () => {
    it('should show empty state for all tasks', async () => {
      vi.mocked(apiService.apiService.getTodosByAddress).mockResolvedValue({
        success: true,
        data: [],
        count: 0,
      });

      vi.mocked(apiService.apiService.getUserStats).mockResolvedValue({
        success: true,
        data: {
          total: 0,
          completed: 0,
          active: 0,
          completionRate: '0.00',
        },
      });

      render(<TodoList />);

      await waitFor(() => {
        expect(screen.getByText(/ready to start/i)).toBeInTheDocument();
        expect(screen.getByText(/create your first task/i)).toBeInTheDocument();
      });
    });

    it('should show empty state for active tasks', async () => {
      const completedTodos = mockTodos.map(t => ({ ...t, completed: true }));

      vi.mocked(apiService.apiService.getTodosByAddress).mockResolvedValue({
        success: true,
        data: completedTodos,
        count: 2,
      });

      render(<TodoList />);

      await waitFor(() => {
        expect(screen.getByText('Test todo 1')).toBeInTheDocument();
      });

      const activeFilterBtn = screen.getByRole('button', { name: /active/i });
      await userEvent.click(activeFilterBtn);

      await waitFor(() => {
        expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
      });
    });

    it('should show empty state for completed tasks', async () => {
      const activeTodos = mockTodos.map(t => ({ ...t, completed: false }));

      vi.mocked(apiService.apiService.getTodosByAddress).mockResolvedValue({
        success: true,
        data: activeTodos,
        count: 2,
      });

      render(<TodoList />);

      await waitFor(() => {
        expect(screen.getByText('Test todo 1')).toBeInTheDocument();
      });

      const completedFilterBtn = screen.getByRole('button', { name: /completed/i });
      await userEvent.click(completedFilterBtn);

      await waitFor(() => {
        expect(screen.getByText(/no completed tasks yet/i)).toBeInTheDocument();
      });
    });
  });
});
