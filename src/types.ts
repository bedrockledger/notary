/**
 * Type definitions for the Bedrock notary package.
 *
 * @packageDocumentation
 */

/**
 * Reasons a chain can fail verification.
 *
 * A value-identical copy lives in `@bedrock/types` for browser-safe
 * use -- the two must stay in lockstep.
 */
export enum ChainInvalidReason {
  /** A stored hash does not match the recomputed hash. */
  HASH_MISMATCH = 'HASH_MISMATCH',
  /** The ECDSA signature failed verification. */
  SIGNATURE_INVALID = 'SIGNATURE_INVALID',
  /** A sequence number was skipped. */
  SEQUENCE_GAP = 'SEQUENCE_GAP',
  /** `previousHash` does not match the previous record's `chainHash`. */
  PREVIOUS_HASH_MISMATCH = 'PREVIOUS_HASH_MISMATCH',
}

/** Result of running {@link verifyChain} over a sequence of records. */
export interface ChainVerificationResult {
  /** Firm identifier the chain belongs to. Echoed back from the input. */
  firmId: string;
  /** ISO 8601 timestamp at which verification was performed. */
  verifiedAt: string;
  /** Number of records that were inspected. */
  totalRecords: number;
  /** Whether every record passed every check. */
  isValid: boolean;
  /** Identifier of the first record that failed, or `null` on success. */
  firstInvalidRecordId: string | null;
  /** Sequence number of the first record that failed, or `null` on success. */
  firstInvalidSequenceNumber: number | null;
  /** Reason the first invalid record failed, or `null` on success. */
  invalidReason: ChainInvalidReason | null;
}

/** Minimal projection of a ledger record for verification. */
export interface LedgerRecordProjection {
  /** Stable record identifier. */
  id: string;
  /** Strictly monotonic per-firm sequence number. */
  sequenceNumber: number;
  /** sha256 of the canonical JSON of the record's payload. */
  recordHash: string;
  /** sha256 of `recordHash || previousHash`; what the next record references. */
  chainHash: string;
  /**
   * The previous record's `chainHash` verbatim, or
   * {@link GENESIS_HASH} for the first record on the chain.
   */
  previousHash: string;
  /** Base64-encoded ECDSA P-256 signature over `chainHash`. */
  signature: string;
  /** Base64-encoded SPKI DER public key in effect when this record was signed. */
  publicKey: string;
}

/** Minimal projection of a certificate envelope. */
export interface CertificateProjection {
  /** Certificate identifier. */
  id: string;
  /** Display name of the firm that issued the certificate. */
  firmName: string;
  /** FCA Firm Reference Number of the issuing firm. */
  firmFrnNumber: string;
  /** ISO 8601 timestamp at which the certificate was issued. */
  issuedAt: string;
  /** Event-specific metadata projected from the linked ledger record. */
  metadata: Record<string, unknown>;
}

/** Result of running {@link verifySignature}. */
export interface SignatureVerificationResult {
  /** Whether the chain hash and signature both check out. */
  valid: boolean;
  /** Failure reason when `valid` is `false`; `null` on success. */
  reason: ChainInvalidReason | null;
}

/** Result of running {@link verifyCertificate} end-to-end. */
export interface CertificateVerificationResult {
  /** Whether the certificate's underlying record verifies. */
  valid: boolean;
  /** Failure reason when `valid` is `false`; `null` on success. */
  reason: ChainInvalidReason | null;
  /** The certificate envelope that was checked. */
  certificate: CertificateProjection;
  /** The ledger record the certificate is anchored to. */
  record: LedgerRecordProjection;
  /** ISO 8601 timestamp at which verification was performed. */
  verifiedAt: string;
}

/** Algorithm identifier: ECDSA P-256 with SHA-256. */
export const SIGNING_ALGORITHM = 'ECDSA P-256' as const;

/** Abstract signing capability for anchoring ledger records. */
export interface Signer {
  /**
   * Sign the given UTF-8 payload (typically a `chainHash`) and
   * return the signature as base64.
   */
  sign(payload: string): Promise<string>;
  /**
   * Verify a base64 signature against the given UTF-8 payload.
   * Returns `true` if the signature is valid for the signer's key.
   */
  verify(payload: string, signature: string): Promise<boolean>;
  /**
   * Return the signer's public key, base64-encoded SPKI DER. The
   * Bedrock platform records this on every ledger row so historical
   * records remain verifiable across key rotations.
   */
  getPublicKey(): Promise<string>;
}

/** Genesis hash: `previousHash` for the first record on a chain. */
export const GENESIS_HASH =
  '0000000000000000000000000000000000000000000000000000000000000000' as const;
