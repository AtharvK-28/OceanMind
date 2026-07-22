import { mutate } from "swr";

/**
 * SWR keys backed by the catch ledger. Several pages read these, so writes
 * have to invalidate them by key rather than through any one component's
 * bound mutate.
 */
export const LEDGER_HISTORY_KEY = "/api/v1/trace/history";
export const LEDGER_CHAIN_KEY = "/api/v1/trace/chain-summary";
export const FOOTPRINT_SUMMARY_KEY = "/api/v1/footprint/summary";

/**
 * Refresh everything derived from the ledger, immediately after appending a
 * block. Without this the feed only picks a new catch up on its next poll,
 * which reads as a lag of several seconds between logging and seeing it.
 */
export function refreshLedger(): Promise<unknown> {
  return Promise.all([
    mutate(LEDGER_HISTORY_KEY),
    mutate(LEDGER_CHAIN_KEY),
    mutate(FOOTPRINT_SUMMARY_KEY),
  ]);
}
