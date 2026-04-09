# Changelog

All notable changes to `@bedrockcompliance/notary` will be documented in
this file. The format is based on [Keep a Changelog][keep] and the
package adheres to [Semantic Versioning][semver].

[keep]: https://keepachangelog.com/en/1.1.0/
[semver]: https://semver.org/spec/v2.0.0.html

## [Unreleased]

## [0.1.2] — 2026-04-09

### Changed

- Updated README and package description to cover both compute and verify.

## [0.1.1] — 2026-04-09

### Changed

- Publish workflow switched to OIDC trusted publishing (no token).

## [0.1.0] — 2026-04-09

### Added

- Initial release.
- `canonicalise(value)` — Bedrock canonical JSON serialiser.
- `sha256(string)` and `sha256Buffer(buffer)` — SHA-256 helpers.
- `computeRecordHash(payload)` — record-hash primitive.
- `computeChainHash(recordHash, previousHash)` — chain-hash primitive.
- `verifyChain(records, firmId)` — full chain integrity verifier.
- `verifySignature(record, options?)` — ECDSA P-256 signature verifier
  with optional trusted-key pinning and curve enforcement.
- `verifyCertificate(input, options?)` — end-to-end certificate verifier.
- `Signer` interface for third-party signing implementations.
- `ChainInvalidReason`, `GENESIS_HASH`, `SIGNING_ALGORITHM` constants.
