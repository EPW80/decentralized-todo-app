import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { blockchainService } from '../services/blockchain';

interface Todo {
  _id: string;
  blockchainId: string;
  chainId: number;
  transactionHash: string;
  owner: string;
  description: string;
  completed: boolean;
  blockchainCreatedAt: string;
  blockchainCompletedAt: string | null;
  syncStatus: 'synced' | 'pending' | 'error';
  lastSyncedAt: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TodoItemProps {
  todo: Todo;
  onTodoUpdated: () => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onTodoUpdated }) => {
  const { provider, chainId } = useWeb3();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    if (!provider || !chainId) {
      setError('Please connect your wallet');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await blockchainService.completeTask(provider, chainId, todo.blockchainId);

      // Wait a bit for backend to sync
      setTimeout(() => {
        onTodoUpdated();
      }, 2000);
    } catch (err: any) {
      console.error('Error completing task:', err);
      setError(err.message || 'Failed to complete task');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!provider || !chainId) {
      setError('Please connect your wallet');
      return;
    }

    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await blockchainService.deleteTask(provider, chainId, todo.blockchainId);

      // Wait a bit for backend to sync
      setTimeout(() => {
        onTodoUpdated();
      }, 2000);
    } catch (err: any) {
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSyncStatusColor = () => {
    switch (todo.syncStatus) {
      case 'synced':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className={`glass-effect rounded-xl shadow-glow-sm p-6 transition-all duration-300 hover:shadow-glow group ${
        todo.completed ? 'opacity-80' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-start gap-4">
            <div className="relative mt-1">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={handleComplete}
                disabled={isProcessing || todo.completed}
                className="peer w-6 h-6 text-purple-600 rounded-lg border-2 border-purple-300 focus:ring-4 focus:ring-purple-200 disabled:opacity-50 cursor-pointer transition-all"
              />
              {todo.completed && (
                <svg className="absolute inset-0 w-6 h-6 text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p
                className={`text-lg font-medium leading-relaxed ${
                  todo.completed ? 'line-through text-gray-500' : 'text-gray-800'
                }`}
              >
                {todo.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formatDate(todo.blockchainCreatedAt)}</span>
                </div>
                {todo.completed && todo.blockchainCompletedAt && (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{formatDate(todo.blockchainCompletedAt)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full ${getSyncStatusColor()}`}
                >
                  {todo.syncStatus === 'synced' ? '✓ ' : todo.syncStatus === 'pending' ? '⏳ ' : '⚠️ '}
                  {todo.syncStatus}
                </span>
                <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                  #{todo.blockchainId}
                </span>
                <a
                  href={`https://etherscan.io/tx/${todo.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-purple-50 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span>View TX</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={isProcessing}
          className="glass-effect text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 font-medium px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2 group-hover:shadow-glow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {isProcessing && (
        <div className="mt-4 flex items-center gap-2 text-sm text-purple-600 font-medium animate-fade-in">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Processing transaction on blockchain...</span>
        </div>
      )}
    </div>
  );
};

export default TodoItem;
