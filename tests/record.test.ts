import { describe, it, expect } from 'vitest';

import { canonicalise } from '../src/canonicalise';
import { sha256 } from '../src/hash';
import { computeRecordHash } from '../src/record';

describe('computeRecordHash', () => {
  it('matches sha256(canonicalise(payload))', () => {
    const payload = { b: 1, a: 2 };
    expect(computeRecordHash(payload)).toBe(sha256(canonicalise(payload)!));
  });

  it('is order-independent for object keys', () => {
    expect(computeRecordHash({ z: 1, a: 2 })).toBe(computeRecordHash({ a: 2, z: 1 }));
  });

  it('changes when a field value changes', () => {
    expect(computeRecordHash({ a: 1 })).not.toBe(computeRecordHash({ a: 2 }));
  });

  it('drops undefined fields the same way the canonicaliser does', () => {
    expect(computeRecordHash({ a: 1, b: undefined })).toBe(computeRecordHash({ a: 1 }));
  });

  it('handles a realistic Bedrock ledger payload', () => {
    const payload = {
      firmId: '01HW1AAAAA',
      sequenceNumber: 1,
      eventType: 'DOCUMENT_SUBMITTED',
      actorId: '01HW2BBBBB',
      actorFcaRef: null,
      actorName: 'Test Firm',
      documentHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      documentMetadata: {
        documentReference: 'SR-2026-0142',
        documentType: 'SUITABILITY_REPORT',
      },
      previousHash: '0'.repeat(64),
      timestamp: '2026-04-09T00:00:00.000Z',
      reviewJobId: null,
    };
    const hash = computeRecordHash(payload);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    // Re-running yields the same hash.
    expect(computeRecordHash(payload)).toBe(hash);
  });
});
