/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SUPPORTED_CHAIN_IDS: string;
  readonly VITE_DEFAULT_CHAIN_ID: string;
  readonly VITE_CONTRACT_ADDRESS_31337: string;
  readonly VITE_CONTRACT_ADDRESS_11155111: string;
  readonly VITE_CONTRACT_ADDRESS_80001: string;
  readonly VITE_CONTRACT_ADDRESS_421613: string;
  readonly VITE_CONTRACT_ADDRESS_11155420: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Ethereum Provider Interface
interface EthereumProvider {
  isMetaMask?: boolean;
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, callback: (...args: unknown[]) => void): void;
  removeListener(event: string, callback: (...args: unknown[]) => void): void;
  send?: (method: string, params?: unknown[]) => Promise<unknown>;
}

interface Window {
  ethereum?: EthereumProvider;
}
