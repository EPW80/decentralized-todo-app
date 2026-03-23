const logger = require("../utils/logger");

const IPFS_GATEWAY =
  process.env.IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs/";
const IPFS_GATEWAY_FALLBACK =
  process.env.IPFS_GATEWAY_FALLBACK || "https://ipfs.io/ipfs/";

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
function gatewayUrl(gateway: string, cid: string): string {
  const base = gateway.endsWith("/") ? gateway : `${gateway}/`;
  return `${base}${cid}`;
}

/**
 * Fetch JSON content from an IPFS gateway.
 * Uses Node 18+ native fetch.
 */
async function fetchFromGateway(
  gateway: string,
  cid: string,
): Promise<unknown> {
  const url = gatewayUrl(gateway, cid);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Gateway returned ${response.status}: ${url}`);
  }

  return response.json();
}

export interface ResolvedDescription {
  text: string;
  cid: string | null;
}

/**
 * Resolve a description value that may be an IPFS CID or plain text.
 *
 * - If the value starts with "ipfs://", fetches the JSON envelope from
 *   IPFS gateways (primary then fallback) and returns the description text.
 * - If it's plain text, returns it unchanged with cid: null.
 *
 * On resolution failure, returns the raw ipfs:// URI as text so the caller
 * can decide how to handle it (e.g. set syncStatus: 'error').
 */
export async function resolveDescription(
  rawDescription: string,
): Promise<ResolvedDescription> {
  if (!isIpfsCid(rawDescription)) {
    return { text: rawDescription, cid: null };
  }

  const cid = extractCid(rawDescription);
  const gateways = [IPFS_GATEWAY, IPFS_GATEWAY_FALLBACK];

  for (const gw of gateways) {
    try {
      const data = (await fetchFromGateway(gw, cid)) as Record<string, unknown>;

      if (
        typeof data === "object" &&
        data !== null &&
        typeof data.description === "string"
      ) {
        logger.info(`Resolved IPFS CID ${cid} via ${gw}`);
        return { text: data.description, cid };
      }

      // Unexpected format — return stringified content
      const fallbackText =
        typeof data === "string" ? data : JSON.stringify(data);
      logger.warn(
        `IPFS content for ${cid} has unexpected format, using raw content`,
      );
      return { text: fallbackText, cid };
    } catch (err) {
      const error = err as Error;
      logger.warn(`Failed to resolve CID ${cid} via ${gw}: ${error.message}`);
    }
  }

  // All gateways failed — return the raw URI so the caller can retry later
  logger.error(`Failed to resolve IPFS CID ${cid} from all gateways`);
  return { text: rawDescription, cid };
}

module.exports = { isIpfsCid, extractCid, resolveDescription };
export default { isIpfsCid, extractCid, resolveDescription };
