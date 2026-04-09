/**
 * SHA-256 helpers (lower-case hex output).
 *
 * @packageDocumentation
 */

import { createHash } from 'node:crypto';

/**
 * Compute the SHA-256 hash of a UTF-8 string.
 *
 * @param input - The string to hash.
 * @returns Lower-case hex digest (64 characters).
 *
 * @example
 * ```ts
 * sha256('hello');
 * // → '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'
 * ```
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Compute the SHA-256 hash of a binary buffer.
 *
 * @param buffer - The bytes to hash.
 * @returns Lower-case hex digest (64 characters).
 */
export function sha256Buffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}
