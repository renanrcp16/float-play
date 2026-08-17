# Contributing to FloatPlay

Thank you for helping improve FloatPlay. Contributions are welcome through issues and pull requests.

Potential security vulnerabilities are the exception: do not disclose them through public issues or pull requests. Follow `.github/SECURITY.md` and use the repository's private vulnerability-reporting channel.

This document is the canonical source for the repository's development workflow and contribution process. Product behavior belongs in `docs/PRD.md`, architectural constraints belong in `docs/ARCHITECTURE.md`, test strategy and browser smoke procedures belong in `docs/TESTING.md`, release/store preparation belongs in `docs/RELEASE.md` and `docs/WEB_STORE.md`, and vulnerability-reporting policy belongs in `.github/SECURITY.md`.

## Contribution license

FloatPlay is licensed under the PolyForm Noncommercial License 1.0.0.

By submitting a contribution to FloatPlay, you agree to license your contribution under the same PolyForm Noncommercial License 1.0.0 that applies to the project. No copyright assignment is requested: you retain copyright in the work you author.

By submitting a contribution, you also represent that you have the right to provide it under these terms. Do not submit code, assets, or other material that you are not authorized to license to the project.

Commercial use of FloatPlay and derived versions is not permitted by the project license. See `LICENSE` for the complete terms.

## Repository language

Follow the repository language requirement defined in `docs/PRD.md`. Repository-facing technical content is written in English. Localized user-facing resources are the intended exception.

## Development requirements

- Node.js 22.12 or newer.
- pnpm version declared by the `packageManager` field in `package.json`.
- Google Chrome desktop for extension smoke testing.

Install dependencies with:

```bash
pnpm install
```

The generated `pnpm-lock.yaml` is part of the repository's reproducibility contract and must be committed. The isolated `e2e/pnpm-lock.yaml` is equally authoritative for the Playwright package. Do not delete or regenerate either lockfile merely to bypass dependency or policy failures; investigate the underlying cause instead.

## Development workflow

Meaningful changes should start from an issue that describes the goal, scope, and expected behavior.

External contributors normally work from a fork and open a pull request back to this repository. Maintainers may create short-lived branches directly in the repository.

Do not develop directly on `main`. Repository settings should enforce pull-request-based changes and prevent force pushes to `main`; required CI checks should be enforced once the complete workflow can run reliably within the repository's Actions quota.

Use these branch prefixes:

- `feature/<short-description>` for new behavior.
- `fix/<short-description>` for bug fixes.
- `refactor/<short-description>` for structural changes without intended behavior changes.
- `docs/<short-description>` for documentation-only work.
- `chore/<short-description>` for maintenance and tooling work.

Keep branches focused and short-lived. Remove the branch after its pull request is merged.

## Commits

Use Conventional Commits.

Common types include:

- `feat:` — new behavior.
- `fix:` — bug fix.
- `refactor:` — structural change without intended behavior change.
- `test:` — test-only change.
- `docs:` — documentation-only change.
- `chore:` — maintenance, tooling, or repository work.

Commit messages and pull request content must describe the actual change rather than implementation activity.

## Validation

The canonical local validation command is:

```bash
pnpm validate
```

It runs linting, TypeScript type checking, automated tests, and the production build.

GitHub Actions runs automated gates on pull requests targeting `main` and pushes to `main`:

- `Validate` installs the root dependencies with `--frozen-lockfile`, runs `pnpm validate`, and runs `pnpm verify:release`.
- `Dependency audit` installs both locked dependency trees and runs `pnpm audit:dependencies`, failing for known high or critical advisories.
- `Browser E2E` installs the root and isolated E2E lockfiles, installs Playwright Chromium with its Linux dependencies, and runs `pnpm test:e2e`.

CI uses Node.js 22.12.0 and Corepack so the pnpm version is resolved from the repository's `packageManager` field rather than silently selecting a different package manager version.

To reproduce the dependency security check locally, run:

```bash
pnpm audit:dependencies
```

An audit failure must be investigated rather than bypassed. If an advisory does not affect FloatPlay in its actual build/runtime context, document the reasoning before adding any explicit exception.

Follow `docs/TESTING.md` for browser-level and real YouTube validation when the change affects extension behavior, media lifecycle, or YouTube integration.

Do not mark a validation item as complete when it was not executed. If an environment prevents a required check from running, document that limitation explicitly in the pull request.

## Pull requests

A pull request should:

- Link the relevant issue.
- Explain what changed and why.
- Stay within the approved issue scope.
- Include validation results.
- Describe relevant manual testing.
- Update canonical documentation when behavior, architecture, workflow, testing strategy, release process, or legal terms change.
- Avoid unrelated cleanup unless it is required for the change.

The repository uses squash merge for completed pull requests so `main` keeps a concise history. The feature branch should be deleted after merge.

## Product changes

Changes to supported behavior, user-facing requirements, scope, exclusions, or the v1 Definition of Done must update `docs/PRD.md` in the same pull request.

Do not silently expand product scope while implementing another issue.

## Architecture changes

Read `docs/ARCHITECTURE.md` before changing architectural boundaries or YouTube integration strategy.

A significant decision that introduces or replaces a long-term architectural choice should add an Architecture Decision Record under `docs/decisions/` when the rationale would otherwise be lost.

## Dependencies and permissions

Dependency and Chrome permission decisions are governed by `docs/ARCHITECTURE.md` and the product security requirements in `docs/PRD.md`.

A new dependency or permission must solve a concrete requirement. Do not add either speculatively. Dependency version changes must be intentional and reviewed; do not rely on broad version ranges as a substitute for the lockfiles.

`.github/dependabot.yml` monitors GitHub Actions for weekly version updates. The repository currently uses pnpm 11, while GitHub's documented Dependabot package-manager support currently stops at pnpm 10. Root and `e2e/` package updates must therefore remain intentionally reviewed rather than relying on a Dependabot configuration that is not documented as compatible. The CI `Dependency audit` job and `pnpm audit:dependencies` cover known high/critical advisories in both pnpm dependency trees; revisit package-version automation when GitHub documents pnpm 11 support.

Repository administrators must also keep the GitHub dependency graph and Dependabot alerts enabled under the repository's Advanced Security settings. Enable Dependabot security updates where GitHub supports the repository's current dependency ecosystem; do not assume that this replaces the pnpm audit gate.

## Release preparation

Use `docs/RELEASE.md` for the release candidate checklist and packaging procedure. Use `docs/WEB_STORE.md` for Chrome Web Store listing, permission/privacy justification, and asset preparation. Keep `docs/PRIVACY.md` synchronized with the shipped data-handling behavior before publishing its final public copy.

## Documentation ownership

Keep project rules single-sourced:

- `README.md` — project entry point.
- `docs/PRD.md` — product requirements.
- `docs/ARCHITECTURE.md` — architecture.
- `docs/TESTING.md` — testing strategy and smoke-test procedures.
- `docs/RELEASE.md` — release candidate and packaging checklist.
- `docs/WEB_STORE.md` — Chrome Web Store metadata, disclosure, and asset preparation.
- `docs/PRIVACY.md` — source draft for the public privacy policy.
- `.github/SECURITY.md` — vulnerability reporting and supported security versions.
- `CONTRIBUTING.md` — contribution and development workflow.
- `AGENTS.md` — coding-agent entry point.
- `LICENSE` — license terms.
- `NOTICE` — required copyright notice.

When a rule changes, update the document that owns it and link to that document from other locations instead of copying the policy.
