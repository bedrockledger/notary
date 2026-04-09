import { describe, it, expect } from 'vitest';
import { canonicalise } from '../src/canonicalise';

describe('canonicalise', () => {
  it('handles empty object', () => {
    expect(canonicalise({})).toBe('{}');
  });

  it('sorts object keys alphabetically', () => {
    const input = { z: 1, a: 2, m: 3 };
    expect(canonicalise(input)).toBe('{"a":2,"m":3,"z":1}');
  });

  it('sorts nested objects recursively', () => {
    const input = { b: { d: 1, c: 2 }, a: { f: 3, e: 4 } };
    expect(canonicalise(input)).toBe('{"a":{"e":4,"f":3},"b":{"c":2,"d":1}}');
  });

  it('preserves array order', () => {
    const input = { arr: [3, 1, 2] };
    expect(canonicalise(input)).toBe('{"arr":[3,1,2]}');
  });

  it('handles arrays of objects with sorted keys', () => {
    const input = [{ b: 1, a: 2 }, { d: 3, c: 4 }];
    expect(canonicalise(input)).toBe('[{"a":2,"b":1},{"c":4,"d":3}]');
  });

  it('handles unicode strings including emoji', () => {
    const input = { emoji: '🔐', text: 'héllo' };
    expect(canonicalise(input)).toBe('{"emoji":"🔐","text":"héllo"}');
  });

  it('handles numbers: zero, negative, floats', () => {
    const input = { zero: 0, negative: -42, float: 3.14 };
    expect(canonicalise(input)).toBe('{"float":3.14,"negative":-42,"zero":0}');
  });

  it('serialises null as null', () => {
    const input = { value: null };
    expect(canonicalise(input)).toBe('{"value":null}');
  });

  it('handles boolean values', () => {
    const input = { yes: true, no: false };
    expect(canonicalise(input)).toBe('{"no":false,"yes":true}');
  });

  it('handles deeply nested structures', () => {
    let obj: Record<string, unknown> = { leaf: 'value' };
    for (let i = 0; i < 12; i++) {
      obj = { [`level${i}`]: obj };
    }
    const result = canonicalise(obj);
    expect(result).toContain('"leaf":"value"');
    expect(() => JSON.parse(result!)).not.toThrow();
  });

  it('produces identical output regardless of key insertion order', () => {
    const obj1: Record<string, unknown> = {};
    obj1['z'] = 1;
    obj1['a'] = 2;
    obj1['m'] = 3;

    const obj2: Record<string, unknown> = {};
    obj2['a'] = 2;
    obj2['m'] = 3;
    obj2['z'] = 1;

    expect(canonicalise(obj1)).toBe(canonicalise(obj2));
  });

  it('omits undefined values in objects', () => {
    const input = { a: 1, b: undefined, c: 3 };
    expect(canonicalise(input)).toBe('{"a":1,"c":3}');
  });

  it('handles top-level null', () => {
    expect(canonicalise(null)).toBe('null');
  });

  it('returns undefined for top-level undefined (mirrors JSON.stringify)', () => {
    expect(canonicalise(undefined)).toBeUndefined();
  });

  it('handles top-level string', () => {
    expect(canonicalise('hello')).toBe('"hello"');
  });

  it('handles top-level number', () => {
    expect(canonicalise(42)).toBe('42');
  });

  it('handles top-level boolean', () => {
    expect(canonicalise(true)).toBe('true');
  });

  it('handles top-level array', () => {
    expect(canonicalise([1, 2, 3])).toBe('[1,2,3]');
  });

  it('handles arrays containing null', () => {
    expect(canonicalise([1, null, 3])).toBe('[1,null,3]');
  });

  it('produces no whitespace in output', () => {
    const input = { a: { b: [1, 2, { c: 3 }] } };
    const result = canonicalise(input);
    expect(result).not.toMatch(/\s/);
  });

  it('serialises NaN as null (matching JSON.stringify)', () => {
    expect(canonicalise({ x: Number.NaN })).toBe('{"x":null}');
  });

  it('serialises +Infinity and -Infinity as null', () => {
    expect(canonicalise({ a: Number.POSITIVE_INFINITY, b: Number.NEGATIVE_INFINITY })).toBe(
      '{"a":null,"b":null}',
    );
  });

  it('preserves U+2028 and U+2029 literally (matching modern V8 JSON.stringify)', () => {
    // ES2019 changed JSON.stringify to emit U+2028 / U+2029
    // verbatim rather than escaping them. Both V8 and Python's
    // json.dumps with ensure_ascii=False produce the literal
    // bytes — assert that here so any future regression in
    // either language is caught.
    const result = canonicalise({ text: 'line1\u2028line2\u2029line3' });
    expect(result).toBe('{"text":"line1\u2028line2\u2029line3"}');
  });

  it('throws on Date instances', () => {
    expect(() => canonicalise({ when: new Date('2026-04-09T00:00:00Z') })).toThrow(/plain objects/);
  });

  it('throws on Buffer instances', () => {
    expect(() => canonicalise({ blob: Buffer.from('hello') })).toThrow(/plain objects/);
  });

  it('throws on Map instances', () => {
    expect(() => canonicalise({ m: new Map() })).toThrow(/plain objects/);
  });

  it('throws on class instances', () => {
    class Custom {
      readonly value = 1;
    }
    expect(() => canonicalise({ x: new Custom() })).toThrow(/Custom/);
  });

  it('accepts plain objects with null prototype', () => {
    const obj = Object.create(null) as Record<string, unknown>;
    obj['a'] = 1;
    expect(canonicalise({ inner: obj })).toBe('{"inner":{"a":1}}');
  });

  it('throws with "unknown" when the prototype has no constructor', () => {
    // A non-null prototype that doesn't carry a `constructor`
    // property exercises the `?? 'unknown'` fallback in the
    // error message.
    const orphanProto = Object.create(null) as object;
    const orphan = Object.create(orphanProto) as Record<string, unknown>;
    orphan['a'] = 1;
    expect(() => canonicalise({ x: orphan })).toThrow(/unknown/);
  });

  it('throws on a plain object literal with an own toJSON method', () => {
    // Object.prototype proto, but its own `toJSON` would be
    // invoked by JSON.stringify and bypass our key-sort.
    const sneaky = { a: 1, toJSON: () => ({ b: 2 }) };
    expect(() => canonicalise({ value: sneaky })).toThrow(/toJSON/);
  });

  it('throws on a top-level plain object with an own toJSON method', () => {
    const sneaky = { a: 1, toJSON: () => 'forged' };
    expect(() => canonicalise(sneaky)).toThrow(/toJSON/);
  });
});
