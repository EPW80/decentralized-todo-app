import { describe, it, expect } from 'vitest';
import {
  isErrorWithMessage,
  isErrorWithCode,
  isEthereumError,
  toErrorMessage,
  getErrorCode,
} from '../../types/error';

describe('Error type guard functions', () => {
  describe('isErrorWithMessage', () => {
    it('returns true for object with string message', () => {
      expect(isErrorWithMessage({ message: 'test error' })).toBe(true);
    });

    it('returns true for Error instances', () => {
      expect(isErrorWithMessage(new Error('test'))).toBe(true);
    });

    it('returns false for null', () => {
      expect(isErrorWithMessage(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isErrorWithMessage(undefined)).toBe(false);
    });

    it('returns false for string', () => {
      expect(isErrorWithMessage('error string')).toBe(false);
    });

    it('returns false for number', () => {
      expect(isErrorWithMessage(42)).toBe(false);
    });

    it('returns false for object without message', () => {
      expect(isErrorWithMessage({ code: 123 })).toBe(false);
    });

    it('returns false for object with non-string message', () => {
      expect(isErrorWithMessage({ message: 123 })).toBe(false);
    });
  });

  describe('isErrorWithCode', () => {
    it('returns true for error with string code', () => {
      expect(isErrorWithCode({ message: 'err', code: 'ERR_CODE' })).toBe(true);
    });

    it('returns true for error with number code', () => {
      expect(isErrorWithCode({ message: 'err', code: 4001 })).toBe(true);
    });

    it('returns false for error without code', () => {
      expect(isErrorWithCode({ message: 'err' })).toBe(false);
    });

    it('returns false for object without message', () => {
      expect(isErrorWithCode({ code: 'ERR' })).toBe(false);
    });

    it('returns false for null', () => {
      expect(isErrorWithCode(null)).toBe(false);
    });
  });

  describe('isEthereumError', () => {
    it('returns true for error with nested error object containing code and message', () => {
      const ethError = {
        message: 'tx failed',
        code: 4001,
        error: { code: -32603, message: 'internal error' },
      };
      expect(isEthereumError(ethError)).toBe(true);
    });

    it('returns false when nested error is missing', () => {
      expect(isEthereumError({ message: 'err', code: 4001 })).toBe(false);
    });

    it('returns false when nested error lacks code', () => {
      const err = { message: 'err', code: 4001, error: { message: 'no code' } };
      expect(isEthereumError(err)).toBe(false);
    });

    it('returns false when nested error lacks message', () => {
      const err = { message: 'err', code: 4001, error: { code: 123 } };
      expect(isEthereumError(err)).toBe(false);
    });

    it('returns false for non-object errors', () => {
      expect(isEthereumError('string')).toBe(false);
    });

    it('returns false when nested error is null', () => {
      expect(isEthereumError({ message: 'err', code: 1, error: null })).toBe(false);
    });
  });

  describe('toErrorMessage', () => {
    it('returns message from ErrorWithMessage', () => {
      expect(toErrorMessage({ message: 'specific error' })).toBe('specific error');
    });

    it('returns message from Error instance', () => {
      expect(toErrorMessage(new Error('native error'))).toBe('native error');
    });

    it('returns the string itself for string errors', () => {
      expect(toErrorMessage('string error')).toBe('string error');
    });

    it('returns fallback for numbers', () => {
      expect(toErrorMessage(42)).toBe('An unknown error occurred');
    });

    it('returns fallback for null', () => {
      expect(toErrorMessage(null)).toBe('An unknown error occurred');
    });

    it('returns fallback for undefined', () => {
      expect(toErrorMessage(undefined)).toBe('An unknown error occurred');
    });
  });

  describe('getErrorCode', () => {
    it('returns string code', () => {
      expect(getErrorCode({ message: 'err', code: 'ERR_NETWORK' })).toBe('ERR_NETWORK');
    });

    it('returns number code', () => {
      expect(getErrorCode({ message: 'err', code: 4001 })).toBe(4001);
    });

    it('returns null for error without code', () => {
      expect(getErrorCode({ message: 'err' })).toBeNull();
    });

    it('returns null for non-object errors', () => {
      expect(getErrorCode('string')).toBeNull();
    });

    it('returns null for null', () => {
      expect(getErrorCode(null)).toBeNull();
    });
  });
});
