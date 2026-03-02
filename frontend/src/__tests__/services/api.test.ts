import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { apiService } from '../../services/api';

// Mock axios
vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

// Get the mock instance that apiService uses
const mockAxios = axios.create() as any;

describe('apiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealth', () => {
    it('calls GET /health and returns data', async () => {
      const healthData = { status: 'ok', uptime: 12345 };
      mockAxios.get.mockResolvedValue({ data: healthData });

      const result = await apiService.getHealth();

      expect(mockAxios.get).toHaveBeenCalledWith('/health');
      expect(result).toEqual(healthData);
    });

    it('propagates errors', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network Error'));

      await expect(apiService.getHealth()).rejects.toThrow('Network Error');
    });
  });

  describe('getNonce', () => {
    it('calls GET /auth/nonce/:address', async () => {
      const nonceData = { nonce: 'abc123', message: 'Sign this' };
      mockAxios.get.mockResolvedValue({ data: nonceData });

      const result = await apiService.getNonce('0xABC');

      expect(mockAxios.get).toHaveBeenCalledWith('/auth/nonce/0xABC');
      expect(result).toEqual(nonceData);
    });

    it('handles invalid address errors', async () => {
      mockAxios.get.mockRejectedValue({ response: { status: 400, data: { error: 'Invalid address' } } });

      await expect(apiService.getNonce('bad')).rejects.toEqual(
        expect.objectContaining({ response: expect.objectContaining({ status: 400 }) })
      );
    });
  });

  describe('login', () => {
    it('calls POST /auth/login with credentials', async () => {
      const loginResponse = { token: 'jwt-token', address: '0xABC' };
      mockAxios.post.mockResolvedValue({ data: loginResponse });

      const result = await apiService.login('0xABC', 'sig123', 'Sign this');

      expect(mockAxios.post).toHaveBeenCalledWith('/auth/login', {
        address: '0xABC',
        signature: 'sig123',
        message: 'Sign this',
      });
      expect(result).toEqual(loginResponse);
    });

    it('handles authentication failure', async () => {
      mockAxios.post.mockRejectedValue({ response: { status: 401, data: { error: 'Invalid signature' } } });

      await expect(apiService.login('0xABC', 'bad', 'msg')).rejects.toEqual(
        expect.objectContaining({ response: expect.objectContaining({ status: 401 }) })
      );
    });
  });

  describe('getTodosByAddress', () => {
    it('calls GET /todos/:address with default params', async () => {
      const todosResponse = { success: true, data: [], count: 0 };
      mockAxios.get.mockResolvedValue({ data: todosResponse });

      const result = await apiService.getTodosByAddress('0xABC');

      expect(mockAxios.get).toHaveBeenCalledWith('/todos/0xABC', {
        params: { includeCompleted: true, includeDeleted: false },
      });
      expect(result).toEqual(todosResponse);
    });

    it('passes custom filter params', async () => {
      const todosResponse = { success: true, data: [], count: 0 };
      mockAxios.get.mockResolvedValue({ data: todosResponse });

      await apiService.getTodosByAddress('0xABC', false, true);

      expect(mockAxios.get).toHaveBeenCalledWith('/todos/0xABC', {
        params: { includeCompleted: false, includeDeleted: true },
      });
    });

    it('returns typed ApiResponse<Todo[]>', async () => {
      const todo = {
        _id: '1',
        blockchainId: '0',
        chainId: 31337,
        transactionHash: '0xhash',
        owner: '0xABC',
        description: 'Test todo',
        completed: false,
        blockchainCreatedAt: '2026-01-01',
        blockchainCompletedAt: null,
        dueDate: null,
        syncStatus: 'synced',
        lastSyncedAt: '2026-01-01',
        deleted: false,
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01',
      };
      mockAxios.get.mockResolvedValue({ data: { success: true, data: [todo], count: 1 } });

      const result = await apiService.getTodosByAddress('0xABC');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].description).toBe('Test todo');
    });
  });

  describe('getTodoById', () => {
    it('calls GET /todos/todo/:id', async () => {
      const todoResponse = { success: true, data: { _id: '123', description: 'Test' } };
      mockAxios.get.mockResolvedValue({ data: todoResponse });

      const result = await apiService.getTodoById('123');

      expect(mockAxios.get).toHaveBeenCalledWith('/todos/todo/123');
      expect(result.success).toBe(true);
    });

    it('handles not found', async () => {
      mockAxios.get.mockRejectedValue({ response: { status: 404, data: { error: 'Not found' } } });

      await expect(apiService.getTodoById('missing')).rejects.toEqual(
        expect.objectContaining({ response: expect.objectContaining({ status: 404 }) })
      );
    });
  });

  describe('verifyTodo', () => {
    it('calls GET /todos/verify/:id', async () => {
      const verifyResponse = { verified: true, onChain: true, inDb: true };
      mockAxios.get.mockResolvedValue({ data: verifyResponse });

      const result = await apiService.verifyTodo('abc');

      expect(mockAxios.get).toHaveBeenCalledWith('/todos/verify/abc');
      expect(result).toEqual(verifyResponse);
    });
  });

  describe('getUserStats', () => {
    it('calls GET /todos/:address/stats', async () => {
      const statsResponse = {
        success: true,
        data: { total: 10, completed: 6, active: 4, completionRate: '60%' },
      };
      mockAxios.get.mockResolvedValue({ data: statsResponse });

      const result = await apiService.getUserStats('0xABC');

      expect(mockAxios.get).toHaveBeenCalledWith('/todos/0xABC/stats');
      expect(result.data!.completionRate).toBe('60%');
    });
  });

  describe('syncTodoFromBlockchain', () => {
    it('calls POST /todos/sync with chainId and blockchainId', async () => {
      const syncResponse = { success: true, data: { _id: '1', blockchainId: '5', chainId: 31337 } };
      mockAxios.post.mockResolvedValue({ data: syncResponse });

      const result = await apiService.syncTodoFromBlockchain(31337, '5');

      expect(mockAxios.post).toHaveBeenCalledWith('/todos/sync', {
        chainId: 31337,
        blockchainId: '5',
      });
      expect(result.success).toBe(true);
    });

    it('handles sync errors', async () => {
      mockAxios.post.mockRejectedValue({ response: { status: 500, data: { error: 'Sync failed' } } });

      await expect(apiService.syncTodoFromBlockchain(1, '99')).rejects.toEqual(
        expect.objectContaining({ response: expect.objectContaining({ status: 500 }) })
      );
    });
  });

});
