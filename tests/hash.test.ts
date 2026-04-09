import { describe, it, expect } from 'vitest';
import { sha256, sha256Buffer } from '../src/hash';

describe('sha256', () => {
  it('returns lowercase hex digest', () => {
    expect(sha256('hello')).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });

  it('produces 64-character output', () => {
    expect(sha256('any input').length).toBe(64);
  });

  it('handles empty string', () => {
    expect(sha256('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('handles unicode strings', () => {
    expect(sha256('héllo 🔐').length).toBe(64);
  });

  it('is deterministic', () => {
    expect(sha256('payload')).toBe(sha256('payload'));
  });
});

describe('sha256Buffer', () => {
  it('hashes a binary buffer', () => {
    const buf = Buffer.from('hello', 'utf8');
    expect(sha256Buffer(buf)).toBe(
      '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824',
    );
  });

  it('matches sha256 output for the same UTF-8 content', () => {
    expect(sha256Buffer(Buffer.from('test', 'utf8'))).toBe(sha256('test'));
  });

  it('handles arbitrary binary data', () => {
    const buf = Buffer.from([0x00, 0xff, 0xa5, 0x5a]);
    expect(sha256Buffer(buf).length).toBe(64);
  });
});
