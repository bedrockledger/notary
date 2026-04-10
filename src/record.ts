/**
 * Record-hash computation.
 *
 * @packageDocumentation
 */

import { canonicalise } from './canonicalise';
import { sha256 } from './hash';
import type { RecordPayload } from './types';

/**
 * Compute the `recordHash` for a partial ledger record.
 *
 * The input is the record's payload — every field except the
 * derived integrity fields (`recordHash`, `chainHash`, `signature`,
 * `publicKey`). Pass exactly the fields the writer would persist;
 * the canonicaliser will sort keys and drop `undefined` values for
 * you.
 *
 * @param payload - The record payload to hash.
 * @returns Lower-case hex SHA-256 of the canonical JSON.
 *
 * @example
 * ```ts
 * const recordHash = computeRecordHash({
 *   firmId: '01HW1...',
 *   sequenceNumber: 4271,
 *   eventType: 'DOCUMENT_APPROVED',
 *   actorId: '01HW2...',
 *   actorName: 'James Hargreaves',
 *   actorFcaRef: 'JH123456',
 *   documentHash: '9f86d081...',
 *   documentMetadata: { documentReference: 'SR-2026-0142' },
 *   previousHash: 'b7e23ec...',
 *   timestamp: '2026-04-07T12:35:02.000Z',
 *   reviewJobId: '01HX4...',
 * });
 * ```
 */
export function computeRecordHash(payload: RecordPayload): string {
  return sha256(canonicalise(payload) as string);
}
