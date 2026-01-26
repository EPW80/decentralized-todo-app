import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { apiService } from '../services/api';
import TodoItem from './TodoItem';
import AddTodoForm from './AddTodoForm';
import { HexagonPattern, NetworkNodes, DigitalGrid, ChainLinkPattern } from './patterns';
import type { Todo, UserStats } from '../types/todo';

const TodoList: React.FC = () => {
  const { address, isConnected } = useWeb3();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const fetchTodos = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.getTodosByAddress(address, true, false);
      if (response.success && response.data) {
        setTodos(response.data);
      } else {
        console.error('Todos fetch failed:', response);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Error fetching todos:', err);
        setError(err.message || 'Failed to fetch todos');
      } else {
        console.error('Error fetching todos:', err);
        setError('Failed to fetch todos');
      }
    } finally {
      setLoading(false);
    }
  }, [address]);

  const fetchStats = useCallback(async () => {
    if (!address) return;

    try {
      const response = await apiService.getUserStats(address);
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        console.error('Stats fetch failed:', response);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address) {
      fetchTodos();
      fetchStats();
    } else {
      setTodos([]);
      setStats(null);
    }
  }, [address, isConnected, fetchTodos, fetchStats]);

  const handleRefresh = () => {
    fetchTodos();
    fetchStats();
  };

  // Optimistic update handlers
  const handleOptimisticUpdate = useCallback((id: string, updates: Partial<Todo>) => {
    setTodos(prev => prev.map(todo =>
      todo._id === id ? { ...todo, ...updates } : todo
    ));
  }, []);

  const handleOptimisticRevert = useCallback(() => {
    // Refetch to get the original state
    fetchTodos();
  }, [fetchTodos]);

  // Filter todos based on selected filter
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      if (filter === 'active') return !todo.completed && !todo.deleted;
      if (filter === 'completed') return todo.completed && !todo.deleted;
      return !todo.deleted;
    });
  }, [todos, filter]);

  // Paginate filtered todos
  const paginatedTodos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredTodos.slice(start, start + pageSize);
  }, [filteredTodos, page, pageSize]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredTodos.length / pageSize);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-slide-in">
        <div className="glass-effect rounded-2xl shadow-glow p-12 text-center relative overflow-hidden">
          {/* Background patterns */}
          <NetworkNodes nodeCount={15} animated={true} />
          <HexagonPattern opacity={0.06} size={40} />

          <div className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-glow relative z-10">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3 relative z-10">
            Welcome to Decentralized Todo
          </h2>
          <p className="text-gray-600 text-lg mb-6 relative z-10">
            Connect your wallet to start managing your tasks on the blockchain 🔐
          </p>
          <div className="flex flex-col gap-3 text-sm text-gray-500 max-w-md mx-auto relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Secure and immutable task storage</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Full ownership of your data</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Transparent and verifiable</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <AddTodoForm onTodoCreated={handleRefresh} />
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 animate-slide-in">
          <div className="glass-effect rounded-xl shadow-glow-sm p-5 hover:shadow-glow transition-all duration-300 group relative overflow-hidden">
            <HexagonPattern opacity={0.05} size={25} className="rounded-xl" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <p className="text-sm font-medium text-gray-600">Total Tasks</p>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800 relative z-10">{stats.total}</p>
          </div>
          <div className="glass-effect rounded-xl shadow-glow-sm p-5 hover:shadow-glow transition-all duration-300 group relative overflow-hidden">
            <HexagonPattern opacity={0.05} size={25} className="rounded-xl" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent relative z-10">{stats.active}</p>
          </div>
          <div className="glass-effect rounded-xl shadow-glow-sm p-5 hover:shadow-glow transition-all duration-300 group relative overflow-hidden">
            <HexagonPattern opacity={0.05} size={25} className="rounded-xl" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent relative z-10">{stats.completed}</p>
          </div>
          <div className="glass-effect rounded-xl shadow-glow-sm p-5 hover:shadow-glow transition-all duration-300 group relative overflow-hidden">
            <HexagonPattern opacity={0.05} size={25} className="rounded-xl" />
            <div className="flex items-center justify-between mb-2 relative z-10">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent relative z-10">{stats.completionRate}%</p>
          </div>
        </div>
      )}

      <div className="glass-effect rounded-2xl shadow-glow p-8 animate-slide-in relative overflow-hidden">
        {/* Background patterns */}
        <DigitalGrid opacity={0.04} gridSize={30} className="rounded-2xl" />
        <HexagonPattern opacity={0.03} size={35} className="rounded-2xl" />
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">Your Tasks</h2>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="glass-effect px-5 py-2.5 rounded-xl font-medium text-gray-700 hover:shadow-glow-sm transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-3 mb-8 animate-slide-in relative z-10">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              filter === 'all'
                ? 'gradient-primary text-white shadow-glow'
                : 'glass-effect text-gray-700 hover:shadow-glow-sm'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              All Tasks
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${filter === 'all' ? 'bg-white/30' : 'bg-purple-100 text-purple-700'}`}>
                {todos.filter((t) => !t.deleted).length}
              </span>
            </span>
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              filter === 'active'
                ? 'gradient-primary text-white shadow-glow'
                : 'glass-effect text-gray-700 hover:shadow-glow-sm'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Active
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${filter === 'active' ? 'bg-white/30' : 'bg-blue-100 text-blue-700'}`}>
                {todos.filter((t) => !t.completed && !t.deleted).length}
              </span>
            </span>
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
              filter === 'completed'
                ? 'gradient-primary text-white shadow-glow'
                : 'glass-effect text-gray-700 hover:shadow-glow-sm'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Completed
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full ${filter === 'completed' ? 'bg-white/30' : 'bg-green-100 text-green-700'}`}>
                {todos.filter((t) => t.completed && !t.deleted).length}
              </span>
            </span>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative z-10">
            {error}
          </div>
        )}

        {loading ? (
          <div className="glass-effect rounded-2xl shadow-glow p-12 text-center animate-scale-in relative overflow-hidden">
            <NetworkNodes nodeCount={12} animated={true} />
            <ChainLinkPattern count={3} animated={true} className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-20" />
            <div className="inline-block relative z-10">
              <div className="w-20 h-20 gradient-primary rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-20 h-20 gradient-primary rounded-full animate-ping opacity-50"></div>
            </div>
            <p className="mt-6 text-gray-600 font-medium text-lg relative z-10">Loading your tasks from the blockchain...</p>
            <p className="mt-2 text-gray-500 text-sm relative z-10">This may take a moment</p>
          </div>
        ) : filteredTodos.length === 0 ? (
          <div className="glass-effect rounded-2xl shadow-glow p-12 text-center animate-scale-in relative overflow-hidden">
            <HexagonPattern opacity={0.06} size={40} className="rounded-2xl" />
            <DigitalGrid opacity={0.04} gridSize={35} className="rounded-2xl" />
            <div className="w-32 h-32 mx-auto mb-6 gradient-primary rounded-3xl flex items-center justify-center shadow-glow-sm animate-float relative z-10">
              {filter === 'all' ? (
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ) : filter === 'active' ? (
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              ) : (
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3 relative z-10">
              {filter === 'all'
                ? '🎉 Ready to Start!'
                : filter === 'active'
                ? '✨ All Caught Up!'
                : '🎯 No Completed Tasks Yet'}
            </h3>
            <p className="text-gray-600 text-lg max-w-md mx-auto relative z-10">
              {filter === 'all'
                ? 'Create your first task above and start managing your todos on the blockchain!'
                : filter === 'active'
                ? 'You have no active tasks. Great work! Create a new one or check completed tasks.'
                : 'Complete some tasks to see them here. Keep going!'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4 animate-slide-in relative z-10">
              {paginatedTodos.map((todo, index) => (
                <div
                  key={todo._id}
                  className="animate-slide-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <TodoItem
                    todo={todo}
                    onTodoUpdated={handleRefresh}
                    onOptimisticUpdate={handleOptimisticUpdate}
                    onOptimisticRevert={handleOptimisticRevert}
                  />
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between glass-effect rounded-xl p-4">
                <div className="text-sm text-gray-600">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredTodos.length)} of {filteredTodos.length} tasks
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="glass-effect px-4 py-2 rounded-lg font-medium text-gray-700 hover:shadow-glow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-10 h-10 rounded-lg font-semibold transition-all duration-200 ${
                            page === pageNum
                              ? 'gradient-primary text-white shadow-glow'
                              : 'glass-effect text-gray-700 hover:shadow-glow-sm'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="glass-effect px-4 py-2 rounded-lg font-medium text-gray-700 hover:shadow-glow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TodoList;
