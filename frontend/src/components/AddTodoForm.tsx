import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';
import { blockchainService } from '../services/blockchain';
import { apiService } from '../services/api';

interface AddTodoFormProps {
  onTodoCreated: () => void;
}

const AddTodoForm: React.FC<AddTodoFormProps> = ({ onTodoCreated }) => {
  const { provider, chainId } = useWeb3();
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setError('Please enter a task description');
      return;
    }

    if (description.length > 500) {
      setError('Description must be 500 characters or less');
      return;
    }

    if (!provider || !chainId) {
      setError('Please connect your wallet');
      return;
    }

    // Check if the network is supported
    if (!blockchainService.isSupportedNetwork(chainId)) {
      const networkNames: Record<number, string> = {
        31337: 'Localhost',
        11155111: 'Sepolia',
        80001: 'Polygon Mumbai',
        421613: 'Arbitrum Goerli',
        11155420: 'Optimism Sepolia',
      };
      const supportedNetworks = Object.entries(networkNames)
        .map(([id, name]) => name)
        .join(', ');
      setError(`Unsupported network. Please switch to one of: ${supportedNetworks}`);
      return;
    }

    setIsCreating(true);
    setError(null);
    setSuccess(false);

    try {
      // Create task on blockchain
      const result = await blockchainService.createTask(provider, chainId, description);

      // Backend will automatically sync via event listener
      // But we can also manually trigger sync if needed
      if (result.taskId) {
        setTimeout(async () => {
          try {
            await apiService.syncTodoFromBlockchain(chainId, result.taskId!);
          } catch (syncError) {
            console.error('Background sync error:', syncError);
          }
        }, 2000);
      }

      setSuccess(true);
      setDescription('');
      onTodoCreated();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error creating task:', err);
      const errorMessage = err.message || 'Failed to create task';

      // Provide helpful error messages
      if (errorMessage.includes('Contract not available')) {
        setError('Contract is not deployed on this network. Please switch to a supported network.');
      } else if (errorMessage.includes('user rejected')) {
        setError('Transaction was rejected. Please try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="glass-effect rounded-3xl shadow-lg hover:shadow-glow-sm p-6 sm:p-8 animate-slide-in transition-all duration-300">
      <div className="flex items-center gap-3 sm:gap-4 mb-6">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 gradient-primary rounded-xl blur-md opacity-50"></div>
          <div className="relative w-11 h-11 sm:w-12 sm:h-12 gradient-primary rounded-xl flex items-center justify-center shadow-md transform hover:scale-110 hover:rotate-6 transition-all duration-300">
            <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
          Create New Task
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="relative group">
            <textarea
              id="todo-description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What needs to be done? ✨"
              className="w-full px-5 py-4 border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-200/50 focus:border-purple-500 hover:border-purple-300 transition-all duration-300 resize-none text-gray-700 placeholder-gray-400 shadow-sm hover:shadow-md focus:shadow-lg bg-white/90 backdrop-blur-sm"
              rows={3}
              maxLength={500}
              disabled={isCreating}
              aria-label="Task description"
            />
          </div>
          <div className="flex justify-between items-center mt-3 px-1">
            <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Press enter to create
            </span>
            <span className={`text-sm font-semibold transition-colors duration-200 ${description.length > 450 ? 'text-red-500' : description.length > 400 ? 'text-yellow-500' : 'text-gray-500'}`}>
              {description.length}/500
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-center gap-3 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-2 border-green-200 text-green-700 px-5 py-4 rounded-xl flex items-center gap-3 animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Task created successfully! Syncing with blockchain... ⛓️</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isCreating || !description.trim()}
          className="w-full gradient-primary text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-glow transform hover:scale-[1.02] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg flex items-center justify-center gap-2.5 group"
        >
          {isCreating ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-base">Creating Task...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-base">Add Task to Blockchain</span>
              <svg className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AddTodoForm;
