# Releasing @bedrockcompliance/notary

## Pre-flight

- [ ] CI green on `main` for `notary-ts.yml`.
- [ ] Fixtures up to date (`pnpm --filter @bedrockcompliance/notary gen:fixtures` produces no diff).
- [ ] `CHANGELOG.md` updated.
- [ ] If the canonical-form bytes changed, the version bump is **major**.

## One-time setup

1. Create the npm scope `@bedrockledger` (via `npm org create bedrockledger` or the web UI).
2. Add a repository secret `NPM_TOKEN` — an automation token scoped to `@bedrockledger`, 2FA auth-only.

## Cutting a release

1. Bump `version` in `packages/notary/package.json`.
2. Move `## [Unreleased]` notes in `CHANGELOG.md` to a dated heading.
3. Commit and merge to `main`.
4. Trigger the **Notary (Publish)** workflow from the Actions tab.
5. Verify on <https://www.npmjs.com/package/@bedrockcompliance/notary>.

## Yanking

```sh
npm deprecate @bedrockcompliance/notary@<version> "see SECURITY-ADVISORY-..."
```
