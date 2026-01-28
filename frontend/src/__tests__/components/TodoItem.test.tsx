import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TodoItem from '../../components/TodoItem';
import type { Todo } from '../../types/todo';

// Mock useWeb3 hook
vi.mock('../../contexts/Web3Context', () => ({
  useWeb3: () => ({
    address: '0x1234567890123456789012345678901234567890',
    chainId: 1,
    isConnecting: false,
    isConnected: true,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    switchNetwork: vi.fn(),
    provider: { getSigner: vi.fn() },
  }),
  Web3Provider: ({ children }: any) => children,
}));

// Mock blockchain service
const mockCompleteTask = vi.fn();
const mockDeleteTask = vi.fn();
vi.mock('../../services/blockchain', () => ({
  blockchainService: {
    completeTask: (...args: any[]) => mockCompleteTask(...args),
    deleteTask: (...args: any[]) => mockDeleteTask(...args),
  },
}));

// Mock patterns and other components
vi.mock('../../components/patterns', () => ({
  HexagonPattern: () => <div data-testid="hexagon-pattern" />,
  DigitalGrid: () => <div data-testid="digital-grid" />,
  BlockchainBorder: () => <div data-testid="blockchain-border" />,
}));

vi.mock('../../components/Tooltip', () => ({
  default: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../../components/CopyButton', () => ({
  default: () => <button>Copy</button>,
}));

vi.mock('../../hooks/useNetworkTheme', () => ({
  useNetworkTheme: () => ({
    primaryColor: '#667eea',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glowColor: 'rgba(102, 126, 234, 0.5)',
  }),
}));

vi.mock('../../config/networkThemes', () => ({
  getNetworkTheme: () => ({
    primaryColor: '#667eea',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    glowColor: 'rgba(102, 126, 234, 0.5)',
    name: 'Ethereum',
  }),
}));

describe('TodoItem Component', () => {
  const mockTodo: Todo = {
    _id: '1',
    blockchainId: '123',
    chainId: 1,
    transactionHash: '0xabc123',
    owner: '0x123',
    description: 'Buy groceries',
    completed: false,
    blockchainCreatedAt: new Date().toISOString(),
    blockchainCompletedAt: null,
    dueDate: null,
    syncStatus: 'synced',
    lastSyncedAt: new Date().toISOString(),
    deleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockOnTodoUpdated = vi.fn();
  const mockOnOptimisticUpdate = vi.fn();
  const mockOnOptimisticRevert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCompleteTask.mockResolvedValue({ transactionHash: '0xdef456' });
    mockDeleteTask.mockResolvedValue({ transactionHash: '0xdef456' });
  });

  const renderTodoItem = (todo: Todo = mockTodo) => {
    return render(
      <TodoItem
        todo={todo}
        onTodoUpdated={mockOnTodoUpdated}
        onOptimisticUpdate={mockOnOptimisticUpdate}
        onOptimisticRevert={mockOnOptimisticRevert}
      />
    );
  };

  // Helper to find the delete button by title
  const getDeleteButton = () => screen.getByTitle('Delete task');

  it('renders todo description', () => {
    renderTodoItem();
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
  });

  it('renders todo with blockchain ID', () => {
    renderTodoItem();
    expect(screen.getByText(/#123/i)).toBeInTheDocument();
  });

  it('renders sync status badge', () => {
    renderTodoItem();
    expect(screen.getByText(/synced/i)).toBeInTheDocument();
  });

  it('renders network badge', () => {
    renderTodoItem();
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });

  it('shows checkbox for incomplete task', () => {
    renderTodoItem();
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('shows checked checkbox for completed task', () => {
    const completedTodo = { ...mockTodo, completed: true };
    renderTodoItem(completedTodo);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('completes task when checkbox is clicked', async () => {
    renderTodoItem();

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockCompleteTask).toHaveBeenCalled();
    });
  });

  it('calls optimistic update when completing task', async () => {
    renderTodoItem();

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockOnOptimisticUpdate).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({ completed: true })
      );
    });
  });

  it('calls optimistic revert on error', async () => {
    mockCompleteTask.mockRejectedValue(new Error('Failed'));

    renderTodoItem();

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockOnOptimisticRevert).toHaveBeenCalledWith('1');
    });
  });

  it('shows delete button', () => {
    renderTodoItem();
    const deleteButton = getDeleteButton();
    expect(deleteButton).toBeInTheDocument();
  });

  it('confirms before deleting task', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderTodoItem();

    const deleteButton = getDeleteButton();
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(confirmSpy).toHaveBeenCalled();
    });
    expect(mockDeleteTask).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('deletes task when confirmed', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderTodoItem();

    const deleteButton = getDeleteButton();
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockDeleteTask).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });

  it('displays error message on action failure', async () => {
    mockCompleteTask.mockRejectedValue(new Error('Network error'));

    renderTodoItem();

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('shows processing state during action', async () => {
    mockCompleteTask.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ transactionHash: '0xabc' }), 100)));

    renderTodoItem();

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(screen.getByText(/processing transaction/i)).toBeInTheDocument();
    });

    // Wait for completion
    await waitFor(() => {
      expect(mockCompleteTask).toHaveBeenCalled();
    });
  });

  it('disables actions while processing', async () => {
    mockCompleteTask.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ transactionHash: '0xabc' }), 100)));

    renderTodoItem();

    const checkbox = screen.getByRole('checkbox');
    const deleteButton = getDeleteButton();

    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(checkbox).toBeDisabled();
      expect(deleteButton).toBeDisabled();
    });

    // Wait for completion
    await waitFor(() => {
      expect(mockCompleteTask).toHaveBeenCalled();
    });
  });

  it('applies line-through style to completed task', () => {
    const completedTodo = { ...mockTodo, completed: true };
    renderTodoItem(completedTodo);

    const description = screen.getByText('Buy groceries');
    expect(description).toHaveClass('line-through');
  });

  it('shows warning when on different network', () => {
    const differentNetworkTodo = { ...mockTodo, chainId: 11155111 };
    renderTodoItem(differentNetworkTodo);

    expect(screen.getByText(/wrong network/i)).toBeInTheDocument();
  });

  it('displays transaction link', () => {
    renderTodoItem();

    const txLink = screen.getByText(/view tx/i).closest('a');
    expect(txLink).toHaveAttribute('href', expect.stringContaining('0xabc123'));
  });

  it('prevents duplicate complete actions', async () => {
    renderTodoItem();

    const checkbox = screen.getByRole('checkbox');

    fireEvent.click(checkbox);
    fireEvent.click(checkbox); // Second click

    await waitFor(() => {
      expect(mockCompleteTask).toHaveBeenCalledTimes(1);
    });
  });
});
