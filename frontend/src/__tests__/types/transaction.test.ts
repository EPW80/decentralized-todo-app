import { describe, it, expect } from 'vitest';
import {
  getGasPriceLevel,
  getStageProgress,
  getStageLabel,
  getStageIcon,
  getStageColor,
} from '../../types/transaction';

describe('Transaction utility functions', () => {
  describe('getGasPriceLevel', () => {
    it('returns low for gas price under 20 gwei', () => {
      const result = getGasPriceLevel(5);
      expect(result.level).toBe('low');
      expect(result.color).toBe('#10b981');
      expect(result.label).toBe('Low');
    });

    it('returns medium for gas price 20-49 gwei', () => {
      const result = getGasPriceLevel(35);
      expect(result.level).toBe('medium');
      expect(result.color).toBe('#f59e0b');
      expect(result.label).toBe('Medium');
    });

    it('returns high for gas price 50-99 gwei', () => {
      const result = getGasPriceLevel(75);
      expect(result.level).toBe('high');
      expect(result.color).toBe('#ef4444');
      expect(result.label).toBe('High');
    });

    it('returns extreme for gas price 100+ gwei', () => {
      const result = getGasPriceLevel(150);
      expect(result.level).toBe('extreme');
      expect(result.color).toBe('#7c3aed');
      expect(result.label).toBe('Extreme');
    });

    it('handles boundary at 20 gwei (medium)', () => {
      expect(getGasPriceLevel(20).level).toBe('medium');
    });

    it('handles boundary at 50 gwei (high)', () => {
      expect(getGasPriceLevel(50).level).toBe('high');
    });

    it('handles boundary at 100 gwei (extreme)', () => {
      expect(getGasPriceLevel(100).level).toBe('extreme');
    });

    it('handles zero gas price', () => {
      expect(getGasPriceLevel(0).level).toBe('low');
    });
  });

  describe('getStageProgress', () => {
    it('returns 0 for initiated', () => {
      expect(getStageProgress('initiated')).toBe(0);
    });

    it('returns 25 for pending', () => {
      expect(getStageProgress('pending')).toBe(25);
    });

    it('returns 50 for confirming', () => {
      expect(getStageProgress('confirming')).toBe(50);
    });

    it('returns 75 for confirmed', () => {
      expect(getStageProgress('confirmed')).toBe(75);
    });

    it('returns 100 for synced', () => {
      expect(getStageProgress('synced')).toBe(100);
    });

    it('returns 0 for failed', () => {
      expect(getStageProgress('failed')).toBe(0);
    });
  });

  describe('getStageLabel', () => {
    it('returns correct labels for all stages', () => {
      expect(getStageLabel('initiated')).toBe('Initiated');
      expect(getStageLabel('pending')).toBe('Pending');
      expect(getStageLabel('confirming')).toBe('Confirming');
      expect(getStageLabel('confirmed')).toBe('Confirmed');
      expect(getStageLabel('synced')).toBe('Synced');
      expect(getStageLabel('failed')).toBe('Failed');
    });
  });

  describe('getStageIcon', () => {
    it('returns correct icons for all stages', () => {
      expect(getStageIcon('initiated')).toBe('🔄');
      expect(getStageIcon('pending')).toBe('⏳');
      expect(getStageIcon('confirming')).toBe('⛓️');
      expect(getStageIcon('confirmed')).toBe('✅');
      expect(getStageIcon('synced')).toBe('💾');
      expect(getStageIcon('failed')).toBe('❌');
    });
  });

  describe('getStageColor', () => {
    it('returns correct colors for all stages', () => {
      expect(getStageColor('initiated')).toBe('#3b82f6');
      expect(getStageColor('pending')).toBe('#f59e0b');
      expect(getStageColor('confirming')).toBe('#8b5cf6');
      expect(getStageColor('confirmed')).toBe('#10b981');
      expect(getStageColor('synced')).toBe('#06b6d4');
      expect(getStageColor('failed')).toBe('#ef4444');
    });
  });
});
