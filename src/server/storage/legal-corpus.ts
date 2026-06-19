import "server-only";

import {
  getFromBucket,
  isR2Configured,
  R2_BUCKETS,
  type R2Bucket,
} from "@/server/storage/r2";

/** Legal reference corpus bucket — wired for future agent / search use. */
export const LEGAL_CORPUS_BUCKET: R2Bucket = R2_BUCKETS.LEGAL_CORPUS;

/**
 * Fetch an object from the legal corpus bucket.
 * Returns null when R2 is not configured (local dev / CI).
 */
export async function getLegalCorpusObject(
  key: string,
): Promise<Buffer | null> {
  if (!isR2Configured()) return null;
  return getFromBucket(LEGAL_CORPUS_BUCKET, key);
}

/**
 * List corpus keys under a prefix (stub — implement when corpus indexing ships).
 */
export async function listLegalCorpusKeys(
  _prefix: string,
): Promise<string[]> {
  return [];
}
