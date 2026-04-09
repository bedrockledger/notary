/**
 * Canonical JSON serialiser for deterministic hashing of ledger records.
 *
 * @packageDocumentation
 */

/**
 * Serialise a value into Bedrock's canonical JSON form.
 *
 * Object keys are sorted lexicographically, `undefined` properties
 * are dropped, and arrays preserve order. Non-plain objects (Date,
 * Buffer, Map, Set, class instances) throw a `TypeError`.
 *
 * @param value - The value to serialise.
 * @returns The canonical JSON string, or `undefined` when the
 *   top-level value is itself `undefined`.
 * @throws {TypeError} If `value` contains a non-plain object.
 *
 * @example
 * ```ts
 * canonicalise({ z: 1, a: 2 });
 * // → '{"a":2,"z":1}'
 * ```
 */
export function canonicalise(value: unknown): string | undefined {
  return JSON.stringify(sortKeys(value));
}

/** Recursively sort object keys and drop `undefined` properties. */
function sortKeys(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (typeof value === 'object') {
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      const name =
        (proto as { constructor?: { name?: string } } | null)?.constructor?.name ?? 'unknown';
      throw new TypeError(
        `canonicalise: only plain objects, arrays, and JSON primitives are supported; got ${name}`,
      );
    }
    // Own `toJSON` would bypass the canonical key-sort via JSON.stringify.
    if (typeof (value as { toJSON?: unknown }).toJSON === 'function') {
      throw new TypeError(
        'canonicalise: objects with a `toJSON` method are not supported',
      );
    }
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(value as Record<string, unknown>).sort();
    for (const key of keys) {
      const v = (value as Record<string, unknown>)[key];
      if (v !== undefined) {
        sorted[key] = sortKeys(v);
      }
    }
    return sorted;
  }

  return value;
}
