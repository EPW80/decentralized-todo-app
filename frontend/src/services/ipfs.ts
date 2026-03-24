import axios from "axios";

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT || "";
const IPFS_GATEWAY =
  import.meta.env.VITE_IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";

const PINATA_API_URL = "https://api.pinata.cloud";

/**
 * Check whether a value is an IPFS CID reference (prefixed with ipfs://).
 */
export function isIpfsCid(value: string): boolean {
  return value.startsWith("ipfs://");
}

/**
 * Extract the raw CID from an ipfs:// URI.
 */
export function extractCid(uri: string): string {
  return uri.replace("ipfs://", "");
}

/**
 * Build a gateway URL for a given CID.
 */
export function gatewayUrl(cid: string): string {
  const base = IPFS_GATEWAY.endsWith("/") ? IPFS_GATEWAY : `${IPFS_GATEWAY}/`;
  return `${base}${cid}`;
}

/**
 * Upload a task description to IPFS via Pinata and return an ipfs:// URI.
 *
 * The description is wrapped in a JSON envelope:
 *   { description, version: 1, timestamp }
 *
 * Retries once on failure with a 1 s delay.
 */
export async function uploadDescription(text: string): Promise<string> {
  if (!PINATA_JWT) {
    throw new Error("IPFS upload not configured — VITE_PINATA_JWT is missing");
  }

  const payload = {
    pinataContent: {
      description: text,
      version: 1,
      timestamp: Date.now(),
    },
    pinataMetadata: {
      name: `todo-${Date.now()}`,
    },
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await axios.post(
        `${PINATA_API_URL}/pinning/pinJSONToIPFS`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${PINATA_JWT}`,
          },
          timeout: 15000,
        },
      );

      const cid: string = response.data.IpfsHash;
      return `ipfs://${cid}`;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  throw new Error(`Failed to upload to IPFS: ${lastError?.message}`);
}

/**
 * Resolve an IPFS CID to its description text via the gateway.
 * Returns the original string unchanged if it's not an ipfs:// URI.
 */
export async function resolveDescription(value: string): Promise<string> {
  if (!isIpfsCid(value)) return value;

  const cid = extractCid(value);
  const url = gatewayUrl(cid);

  const response = await axios.get(url, { timeout: 10000 });
  const data = response.data;

  if (typeof data === "object" && data.description) {
    return data.description;
  }

  // Fallback: return raw content if it's a plain string
  return typeof data === "string" ? data : JSON.stringify(data);
}

export const ipfsService = {
  isIpfsCid,
  extractCid,
  gatewayUrl,
  uploadDescription,
  resolveDescription,
};

export default ipfsService;
