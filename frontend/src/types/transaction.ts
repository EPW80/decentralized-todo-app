export type TransactionStage =
  | 'initiated'    // User approved in wallet
  | 'pending'      // Submitted to network
  | 'confirming'   // In mempool, waiting for confirmations
  | 'confirmed'    // Required confirmations reached
  | 'synced'       // Synced with backend database
  | 'failed';      // Transaction failed

export interface TransactionStatus {
  stage: TransactionStage;
  hash?: string;
  blockNumber?: number;
  confirmations: number;
  requiredConfirmations: number;
  gasPrice?: string;
  gasPriceGwei?: number;
  timestamp: number;
  error?: string;
}

export interface GasPriceLevel {
  level: 'low' | 'medium' | 'high' | 'extreme';
  color: string;
  label: string;
  icon: string;
}

export const getGasPriceLevel = (gasPriceGwei: number): GasPriceLevel => {
  if (gasPriceGwei < 20) {
    return {
      level: 'low',
      color: '#10b981', // green
      label: 'Low',
      icon: '🟢',
    };
  } else if (gasPriceGwei < 50) {
    return {
      level: 'medium',
      color: '#f59e0b', // orange
      label: 'Medium',
      icon: '🟡',
    };
  } else if (gasPriceGwei < 100) {
    return {
      level: 'high',
      color: '#ef4444', // red
      label: 'High',
      icon: '🔴',
    };
  } else {
    return {
      level: 'extreme',
      color: '#7c3aed', // purple
      label: 'Extreme',
      icon: '🔥',
    };
  }
};

export const getStageProgress = (stage: TransactionStage): number => {
  const stageMap: Record<TransactionStage, number> = {
    initiated: 0,
    pending: 25,
    confirming: 50,
    confirmed: 75,
    synced: 100,
    failed: 0,
  };
  return stageMap[stage] || 0;
};

export const getStageLabel = (stage: TransactionStage): string => {
  const labelMap: Record<TransactionStage, string> = {
    initiated: 'Initiated',
    pending: 'Pending',
    confirming: 'Confirming',
    confirmed: 'Confirmed',
    synced: 'Synced',
    failed: 'Failed',
  };
  return labelMap[stage] || 'Unknown';
};

export const getStageIcon = (stage: TransactionStage): string => {
  const iconMap: Record<TransactionStage, string> = {
    initiated: '🔄',
    pending: '⏳',
    confirming: '⛓️',
    confirmed: '✅',
    synced: '💾',
    failed: '❌',
  };
  return iconMap[stage] || '❓';
};

export const getStageColor = (stage: TransactionStage): string => {
  const colorMap: Record<TransactionStage, string> = {
    initiated: '#3b82f6', // blue
    pending: '#f59e0b', // orange
    confirming: '#8b5cf6', // purple
    confirmed: '#10b981', // green
    synced: '#06b6d4', // cyan
    failed: '#ef4444', // red
  };
  return colorMap[stage] || '#6b7280';
};
