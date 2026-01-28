// Error type guards and utilities

export interface ErrorWithMessage {
  message: string;
}

export interface ErrorWithCode extends ErrorWithMessage {
  code: string | number;
}

export interface EthereumError extends ErrorWithCode {
  error?: {
    code: number;
    message: string;
  };
}

// Type guard to check if error has a message
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  );
}

// Type guard to check if error has a code
export function isErrorWithCode(error: unknown): error is ErrorWithCode {
  return (
    isErrorWithMessage(error) &&
    'code' in error &&
    (typeof (error as Record<string, unknown>).code === 'string' ||
      typeof (error as Record<string, unknown>).code === 'number')
  );
}

// Type guard for Ethereum errors
export function isEthereumError(error: unknown): error is EthereumError {
  if (!isErrorWithCode(error)) return false;

  const err = error as unknown as Record<string, unknown>;
  return (
    'error' in err &&
    typeof err.error === 'object' &&
    err.error !== null &&
    'code' in err.error &&
    'message' in err.error
  );
}

// Convert unknown error to a message string
export function toErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unknown error occurred';
}

// Get error code if available
export function getErrorCode(error: unknown): string | number | null {
  if (isErrorWithCode(error)) {
    return error.code;
  }
  return null;
}
