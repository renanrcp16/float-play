# FloatPlay Agent Instructions

This file is the entry point for coding agents working in this repository. It intentionally stays short and points to the canonical project documents instead of duplicating their rules.

## Canonical sources

Before making changes, use the document that owns the relevant decision:

- `docs/PRD.md` — product scope, supported behavior, release requirements, and v1 exclusions.
- `docs/ARCHITECTURE.md` — architecture boundaries, lifecycle rules, dependency principles, and technical constraints.
- `CONTRIBUTING.md` — development workflow, validation, branch and commit conventions, pull request expectations, and contribution terms.
- `LICENSE` — legal license terms.
- `NOTICE` — required copyright notice.

`README.md` is an entry point only and must not become a second policy document.

## Agent operating rules

1. Read the relevant canonical documents before changing product behavior, architecture, tooling, workflow, or licensing.
2. Do not implement product behavior that conflicts with `docs/PRD.md`.
3. Do not bypass the architecture constraints in `docs/ARCHITECTURE.md` to make a feature work quickly.
4. Follow the repository workflow defined in `CONTRIBUTING.md` for issues, branches, commits, validation, pull requests, merge strategy, and branch cleanup.
5. Do not claim that a validation step passed unless it was actually executed successfully.
6. Keep policy single-sourced. When a rule changes, update its canonical document and link to it elsewhere instead of copying the rule into multiple files.
7. Prefer the smallest coherent change that satisfies the approved requirement. Do not introduce speculative abstractions, permissions, dependencies, or infrastructure.
8. Significant architecture decisions should be documented in an ADR under `docs/decisions/` when the decision needs long-term rationale beyond `docs/ARCHITECTURE.md`.
9. Do not modify licensing terms or contribution licensing without explicit maintainer direction.
10. Repository-facing technical content must follow the repository language requirement defined in the PRD. Localized user-facing resources are the intended exception.

## Completion

A change is not complete merely because the code was written. Follow the validation and pull request requirements in `CONTRIBUTING.md`, update canonical documentation when required, and leave the repository in a clean state.
