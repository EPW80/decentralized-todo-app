const { isIpfsCid, extractCid, resolveDescription } = require('../../src/services/ipfsService');

// Mock global fetch for gateway calls
const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('ipfsService', () => {
  describe('isIpfsCid', () => {
    it('should return true for ipfs:// prefixed strings', () => {
      expect(isIpfsCid('ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco')).toBe(true);
      expect(isIpfsCid('ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi')).toBe(true);
    });

    it('should return false for plain text descriptions', () => {
      expect(isIpfsCid('Buy groceries')).toBe(false);
      expect(isIpfsCid('')).toBe(false);
      expect(isIpfsCid('IPFS://uppercase')).toBe(false);
    });
  });

  describe('extractCid', () => {
    it('should strip the ipfs:// prefix', () => {
      expect(extractCid('ipfs://QmAbc123')).toBe('QmAbc123');
    });

    it('should return the string unchanged if no prefix', () => {
      expect(extractCid('QmAbc123')).toBe('QmAbc123');
    });
  });

  describe('resolveDescription', () => {
    it('should return plain text unchanged with cid: null', async () => {
      const result = await resolveDescription('Buy groceries');
      expect(result).toEqual({ text: 'Buy groceries', cid: null });
    });

    it('should resolve an IPFS CID to its description text', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ description: 'Buy groceries', version: 1, timestamp: 123 }),
      });

      const result = await resolveDescription('ipfs://QmTestCid123');
      expect(result).toEqual({ text: 'Buy groceries', cid: 'QmTestCid123' });
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should fallback to second gateway on primary failure', async () => {
      global.fetch = jest.fn()
        .mockRejectedValueOnce(new Error('Gateway timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ description: 'Fallback result', version: 1 }),
        });

      const result = await resolveDescription('ipfs://QmFallbackTest');
      expect(result).toEqual({ text: 'Fallback result', cid: 'QmFallbackTest' });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should return raw URI when all gateways fail', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await resolveDescription('ipfs://QmFailedCid');
      expect(result).toEqual({ text: 'ipfs://QmFailedCid', cid: 'QmFailedCid' });
    });

    it('should handle unexpected JSON format', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: 'no description field' }),
      });

      const result = await resolveDescription('ipfs://QmWeirdFormat');
      expect(result.cid).toBe('QmWeirdFormat');
      expect(result.text).toContain('no description field');
    });
  });
});
