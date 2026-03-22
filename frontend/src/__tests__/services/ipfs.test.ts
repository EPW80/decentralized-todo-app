import { describe, it, expect } from 'vitest';
import { isIpfsCid, extractCid, gatewayUrl } from '../../services/ipfs';

describe('ipfs service utilities', () => {
  describe('isIpfsCid', () => {
    it('returns true for ipfs:// prefixed strings', () => {
      expect(isIpfsCid('ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco')).toBe(true);
      expect(isIpfsCid('ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi')).toBe(true);
    });

    it('returns false for plain text', () => {
      expect(isIpfsCid('Buy groceries')).toBe(false);
      expect(isIpfsCid('')).toBe(false);
      expect(isIpfsCid('IPFS://uppercase')).toBe(false);
    });
  });

  describe('extractCid', () => {
    it('strips the ipfs:// prefix', () => {
      expect(extractCid('ipfs://QmAbc123')).toBe('QmAbc123');
    });
  });

  describe('gatewayUrl', () => {
    it('builds a full URL from a CID', () => {
      const url = gatewayUrl('QmAbc123');
      expect(url).toContain('QmAbc123');
      expect(url).toMatch(/^https?:\/\//);
    });
  });
});
