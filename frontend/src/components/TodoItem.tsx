import React, { useState, useRef, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { blockchainService } from '../services/blockchain';
import { HexagonPattern, DigitalGrid, BlockchainBorder } from './patterns';
import { useNetworkTheme } from '../hooks/useNetworkTheme';
import { getNetworkTheme } from '../config/networkThemes';
import Tooltip from './Tooltip';
import CopyButton from './CopyButton';
import type { Todo } from '../types/todo';
import { toErrorMessage } from '../types/error';

interface TodoItemProps {
  todo: Todo;
  onTodoUpdated: () => void;
  onOptimisticUpdate?: (id: string, updates: Partial<Todo>) => void;
  onOptimisticRevert?: (id: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onTodoUpdated,
  onOptimisticUpdate,
  onOptimisticRevert
}) => {
  const { provider, chainId } = useWeb3();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localTodo, setLocalTodo] = useState<Todo>(todo);
  const [isEditing, setIsEditing] = useState(false);
  const [editDescription, setEditDescription] = useState(todo.description);
  const editInputRef = useRef<HTMLInputElement>(null);
  const _currentNetworkTheme = useNetworkTheme();

  // Get the theme for the network this todo was created on
  const todoNetworkTheme = getNetworkTheme(todo.chainId);
  const isOnDifferentNetwork = chainId !== todo.chainId;

  // Update local state when prop changes
  React.useEffect(() => {
    setLocalTodo(todo);
    setEditDescription(todo.description);
  }, [todo]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  // Get due date status and styling
  const getDueDateStatus = (): { status: 'overdue' | 'today' | 'upcoming' | 'none'; color: string; bgColor: string; label: string } => {
    if (!localTodo.dueDate) {
      return { status: 'none', color: '', bgColor: '', label: '' };
    }

    const now = new Date();
    const dueDate = new Date(localTodo.dueDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDateDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

    if (dueDateDay < today) {
      return { status: 'overdue', color: 'text-red-600', bgColor: 'bg-red-100 border-red-300', label: 'Overdue' };
    } else if (dueDateDay.getTime() === today.getTime()) {
      return { status: 'today', color: 'text-yellow-600', bgColor: 'bg-yellow-100 border-yellow-300', label: 'Due Today' };
    } else {
      return { status: 'upcoming', color: 'text-green-600', bgColor: 'bg-green-100 border-green-300', label: 'Upcoming' };
    }
  };

  const dueDateInfo = getDueDateStatus();

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const handleComplete = async () => {
    if (!provider || !chainId) {
      setError('Please connect your wallet');
      return;
    }

    // Prevent duplicate clicks or completing already completed tasks
    if (isProcessing || localTodo.completed) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Optimistic update - update UI immediately
    const now = new Date().toISOString();
    const optimisticUpdate = {
      completed: true,
      blockchainCompletedAt: now,
      syncStatus: 'pending' as const,
    };

    setLocalTodo(prev => ({ ...prev, ...optimisticUpdate }));

    // Notify parent component for optimistic update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(todo._id, optimisticUpdate);
    }

    try {
      await blockchainService.completeTask(provider, chainId, todo.blockchainId);

      // Wait for backend to sync (increased to 4s to ensure event is processed)
      setTimeout(() => {
        onTodoUpdated();
      }, 4000);
    } catch (err: unknown) {
      console.error('Error completing task:', err);
      setError(toErrorMessage(err) || 'Failed to complete task');

      // Revert optimistic update on error
      setLocalTodo(todo);
      if (onOptimisticRevert) {
        onOptimisticRevert(todo._id);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!provider || !chainId) {
      setError('Please connect your wallet');
      return;
    }

    // Prevent duplicate clicks or deleting already deleted tasks
    if (isProcessing || localTodo.deleted) {
      return;
    }

    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Optimistic update - mark as deleted immediately
    const optimisticUpdate = {
      deleted: true,
      syncStatus: 'pending' as const,
    };

    setLocalTodo(prev => ({ ...prev, ...optimisticUpdate }));

    // Notify parent component for optimistic update
    if (onOptimisticUpdate) {
      onOptimisticUpdate(todo._id, optimisticUpdate);
    }

    try {
      await blockchainService.deleteTask(provider, chainId, todo.blockchainId);

      // Wait for backend to sync (increased to 4s to ensure event is processed)
      setTimeout(() => {
        onTodoUpdated();
      }, 4000);
    } catch (err: unknown) {
      console.error('Error deleting task:', err);
      setError(toErrorMessage(err) || 'Failed to delete task');

      // Revert optimistic update on error
      setLocalTodo(todo);
      if (onOptimisticRevert) {
        onOptimisticRevert(todo._id);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditDescription(localTodo.description);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditDescription(localTodo.description);
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!provider || !chainId) {
      setError('Please connect your wallet');
      return;
    }

    const trimmedDescription = editDescription.trim();
    if (!trimmedDescription) {
      setError('Description cannot be empty');
      return;
    }

    if (trimmedDescription === localTodo.description) {
      setIsEditing(false);
      return;
    }

    setIsProcessing(true);
    setError(null);

    // Optimistic update
    const optimisticUpdate = {
      description: trimmedDescription,
      syncStatus: 'pending' as const,
    };

    setLocalTodo(prev => ({ ...prev, ...optimisticUpdate }));
    if (onOptimisticUpdate) {
      onOptimisticUpdate(todo._id, optimisticUpdate);
    }

    try {
      await blockchainService.updateTask(provider, chainId, todo.blockchainId, trimmedDescription);
      setIsEditing(false);

      setTimeout(() => {
        onTodoUpdated();
      }, 4000);
    } catch (err: unknown) {
      console.error('Error updating task:', err);
      setError(toErrorMessage(err) || 'Failed to update task');

      setLocalTodo(todo);
      if (onOptimisticRevert) {
        onOptimisticRevert(todo._id);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestore = async () => {
    if (!provider || !chainId) {
      setError('Please connect your wallet');
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    setError(null);

    // Optimistic update
    const optimisticUpdate = {
      deleted: false,
      syncStatus: 'pending' as const,
    };

    setLocalTodo(prev => ({ ...prev, ...optimisticUpdate }));
    if (onOptimisticUpdate) {
      onOptimisticUpdate(todo._id, optimisticUpdate);
    }

    try {
      await blockchainService.restoreTask(provider, chainId, todo.blockchainId);

      setTimeout(() => {
        onTodoUpdated();
      }, 4000);
    } catch (err: unknown) {
      console.error('Error restoring task:', err);
      setError(toErrorMessage(err) || 'Failed to restore task');

      setLocalTodo(todo);
      if (onOptimisticRevert) {
        onOptimisticRevert(todo._id);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
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
    switch (localTodo.syncStatus) {
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
      className={`
        glass-effect rounded-xl p-4 sm:p-6 group relative overflow-hidden
        floating-3d depth-shadow
        ${localTodo.completed ? 'opacity-80' : ''}
        ${!localTodo.completed && localTodo.syncStatus === 'synced' ? 'glow-intense' : ''}
        transition-all duration-300
      `}
      style={{
        borderLeft: `4px solid ${todoNetworkTheme.primaryColor}`,
        boxShadow: `0 4px 16px ${todoNetworkTheme.glowColor}, 0 2px 8px ${todoNetworkTheme.glowColor}`,
      }}
    >
      {/* Network color accent strip at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: todoNetworkTheme.gradient }}
      />

      {/* Background patterns using network colors */}
      <HexagonPattern opacity={0.08} size={30} className="rounded-xl" color={todoNetworkTheme.primaryColor} />
      <DigitalGrid opacity={0.05} gridSize={25} className="rounded-xl" color={todoNetworkTheme.primaryColor} />
      {!localTodo.completed && localTodo.syncStatus === 'synced' && (
        <BlockchainBorder animated={false} thickness={1} color={todoNetworkTheme.primaryColor} />
      )}

      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 relative z-10">
        <div className="flex-1 w-full">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="relative mt-1 flex-shrink-0">
              <input
                type="checkbox"
                checked={localTodo.completed}
                onChange={handleComplete}
                disabled={isProcessing || localTodo.completed}
                className="peer w-6 h-6 rounded-lg border-2 disabled:opacity-50 cursor-pointer transition-all"
                style={{
                  borderColor: todoNetworkTheme.primaryColor,
                  accentColor: todoNetworkTheme.primaryColor,
                }}
              />
              {localTodo.completed && (
                <div
                  className="absolute inset-0 w-6 h-6 rounded-lg flex items-center justify-center pointer-events-none"
                  style={{ background: todoNetworkTheme.gradient }}
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1">
              {/* Description - Inline Edit Mode */}
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isProcessing}
                    className="flex-1 text-lg font-medium px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all"
                    style={{
                      borderColor: todoNetworkTheme.primaryColor,
                      boxShadow: `0 0 0 3px ${todoNetworkTheme.glowColor}`,
                    }}
                    placeholder="Enter task description..."
                  />
                  <button
                    onClick={handleSaveEdit}
                    disabled={isProcessing}
                    className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors disabled:opacity-50"
                    title="Save changes"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isProcessing}
                    className="p-2 rounded-lg bg-gray-400 hover:bg-gray-500 text-white transition-colors disabled:opacity-50"
                    title="Cancel"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p
                    className={`text-lg font-medium leading-relaxed flex-1 ${
                      localTodo.completed ? 'line-through text-gray-500' : 'text-gray-800'
                    }`}
                  >
                    {localTodo.description}
                  </p>
                  {!localTodo.completed && !localTodo.deleted && (
                    <button
                      onClick={handleEdit}
                      disabled={isProcessing}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all"
                      title="Edit task"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 text-xs sm:text-sm">
                {/* Due Date Display with color indicators */}
                {localTodo.dueDate && (
                  <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${dueDateInfo.bgColor} ${dueDateInfo.color}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">{dueDateInfo.label}: {formatDueDate(localTodo.dueDate)}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 sm:gap-1.5 text-gray-600 dark:text-gray-400">
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="whitespace-nowrap">{formatDate(localTodo.blockchainCreatedAt)}</span>
                </div>
                {localTodo.completed && localTodo.blockchainCompletedAt && (
                  <div className="flex items-center gap-1.5 text-green-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>{formatDate(localTodo.blockchainCompletedAt)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3">
                {/* Network Badge */}
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-lg text-white shadow-sm flex items-center gap-1.5"
                  style={{
                    background: todoNetworkTheme.gradient,
                    boxShadow: `0 2px 8px ${todoNetworkTheme.glowColor}`,
                  }}
                  title={`Created on ${todoNetworkTheme.name}`}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {todoNetworkTheme.name}
                </span>

                {/* Different network warning */}
                {isOnDifferentNetwork && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-300 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Wrong Network
                  </span>
                )}

                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full ${getSyncStatusColor()}`}
                >
                  {localTodo.syncStatus === 'synced' ? '✓ ' : localTodo.syncStatus === 'pending' ? '⏳ ' : '⚠️ '}
                  {localTodo.syncStatus}
                </span>
                <Tooltip
                  content={`ID: ${localTodo.blockchainId}`}
                  position="top"
                  delay={200}
                >
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded cursor-help">
                    #{localTodo.blockchainId}
                  </span>
                </Tooltip>

                <Tooltip
                  content={
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">{localTodo.transactionHash}</span>
                      <CopyButton
                        text={localTodo.transactionHash}
                        variant="icon"
                        className="opacity-70 hover:opacity-100"
                      />
                    </div>
                  }
                  position="top"
                  delay={200}
                >
                  <a
                    href={`https://etherscan.io/tx/${localTodo.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium flex items-center gap-1 px-2 py-1 rounded transition-colors hover:underline"
                    style={{
                      color: todoNetworkTheme.primaryColor,
                    }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    <span className="hidden sm:inline">View TX</span>
                    <span className="sm:hidden">TX</span>
                  </a>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Restore Button - Only shown for deleted tasks */}
          {localTodo.deleted && (
            <button
              onClick={handleRestore}
              disabled={isProcessing}
              className="glass-effect text-green-600 hover:text-white hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 font-medium px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2 group-hover:shadow-glow-sm"
              title="Restore task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden sm:inline text-sm">Restore</span>
            </button>
          )}

          {/* Delete Button - Hidden for already deleted tasks */}
          {!localTodo.deleted && (
            <button
              onClick={handleDelete}
              disabled={isProcessing}
              className="glass-effect text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-red-600 font-medium px-3 sm:px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 flex items-center gap-2 group-hover:shadow-glow-sm"
              title="Delete task"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline text-sm">Delete</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-fade-in relative z-10">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {isProcessing && (
        <div
          className="mt-4 flex items-center gap-2 text-sm font-medium animate-fade-in relative z-10"
          style={{ color: todoNetworkTheme.primaryColor }}
        >
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
