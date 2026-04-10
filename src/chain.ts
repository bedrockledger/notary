/**
 * Chain hash computation and full-chain verification.
 *
 * @packageDocumentation
 */

import { sha256 } from './hash';
import { computeRecordHash } from './record';
import {
  ChainInvalidReason,
  GENESIS_HASH,
  type ChainVerificationResult,
  type LedgerRecordProjection,
} from './types';

/**
 * Compute the chain hash for a record.
 *
 * @param recordHash - SHA-256 of the canonical JSON of the record's
 *   payload.
 * @param previousHash - The previous record's `chainHash`, or
 *   {@link GENESIS_HASH} for the first record on the chain.
 * @returns Lower-case hex SHA-256 of `recordHash || previousHash`.
 *
 * @example
 * ```ts
 * const chainHash = computeChainHash(
 *   sha256(canonicalise(payload)),
 *   GENESIS_HASH,
 * );
 * ```
 */
export function computeChainHash(recordHash: string, previousHash: string): string {
  return sha256(recordHash + previousHash);
}

/**
 * Verify the integrity of a sequence of Bedrock ledger records.
 *
 * The function walks the records in order and, at every position,
 * checks that:
 *
 *   1. When `payload` is present, the recomputed `recordHash` matches
 *      the stored `recordHash` (detects field-level tampering).
 *   2. The sequence number is exactly one greater than the previous
 *      record's (gaps and reorderings are detected).
 *   3. The `previousHash` matches the previous record's `chainHash`
 *      ({@link GENESIS_HASH} for the first record).
 *   4. The recomputed `chainHash` matches the stored `chainHash`
 *      (catches edits to either field).
 *
 * If any check fails, verification stops at that record and the
 * result identifies it. Signature verification is performed
 * separately by {@link verifySignature} so that callers who only
 * have the chain (without the public key) can still detect tampering
 * in the structure.
 *
 * @param records - The records to verify, ordered by `sequenceNumber`
 *   ascending and starting from the firm's genesis record (the
 *   first record's `previousHash` must equal {@link GENESIS_HASH}).
 *   Pass an empty array to get a trivially valid result. Verifying
 *   a mid-chain slice is not currently supported.
 * @param firmId - Firm identifier echoed back on the result. Not
 *   compared against the records themselves.
 * @returns A {@link ChainVerificationResult} describing the outcome.
 */
export function verifyChain(
  records: readonly LedgerRecordProjection[],
  firmId: string,
): ChainVerificationResult {
  const verifiedAt = new Date().toISOString();

  if (records.length === 0) {
    return {
      firmId,
      verifiedAt,
      totalRecords: 0,
      isValid: true,
      firstInvalidRecordId: null,
      firstInvalidSequenceNumber: null,
      invalidReason: null,
    };
  }

  for (let i = 0; i < records.length; i++) {
    const record = records[i] as LedgerRecordProjection;
    const previousRecord = i > 0 ? (records[i - 1] as LedgerRecordProjection) : null;
    const expectedPreviousHash = previousRecord ? previousRecord.chainHash : GENESIS_HASH;

    if (record.payload !== undefined) {
      let recomputed: string;
      try {
        recomputed = computeRecordHash(record.payload);
      } catch {
        return failure(records, firmId, verifiedAt, record, ChainInvalidReason.HASH_MISMATCH);
      }
      if (recomputed !== record.recordHash) {
        return failure(records, firmId, verifiedAt, record, ChainInvalidReason.HASH_MISMATCH);
      }
    }

    if (previousRecord && record.sequenceNumber !== previousRecord.sequenceNumber + 1) {
      return failure(records, firmId, verifiedAt, record, ChainInvalidReason.SEQUENCE_GAP);
    }

    if (record.previousHash !== expectedPreviousHash) {
      return failure(
        records,
        firmId,
        verifiedAt,
        record,
        ChainInvalidReason.PREVIOUS_HASH_MISMATCH,
      );
    }

    const expectedChainHash = computeChainHash(record.recordHash, record.previousHash);
    if (record.chainHash !== expectedChainHash) {
      return failure(records, firmId, verifiedAt, record, ChainInvalidReason.HASH_MISMATCH);
    }
  }

  return {
    firmId,
    verifiedAt,
    totalRecords: records.length,
    isValid: true,
    firstInvalidRecordId: null,
    firstInvalidSequenceNumber: null,
    invalidReason: null,
  };
}

/** Build a structured failure result for {@link verifyChain}. */
function failure(
  records: readonly LedgerRecordProjection[],
  firmId: string,
  verifiedAt: string,
  record: LedgerRecordProjection,
  reason: ChainInvalidReason,
): ChainVerificationResult {
  return {
    firmId,
    verifiedAt,
    totalRecords: records.length,
    isValid: false,
    firstInvalidRecordId: record.id,
    firstInvalidSequenceNumber: record.sequenceNumber,
    invalidReason: reason,
  };
}
