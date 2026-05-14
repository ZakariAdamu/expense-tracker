# Commit Message Guide

Use Conventional Commits:

<type>(<scope>): <subject>

Examples:

- feat(auth): add login flow
- fix(charts): handle empty dataset
- chore(tooling): update lint-staged config

Rules (enforced by commitlint):

- type must be one of: build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test
- scope must be kebab-case when provided
- subject must not be empty
- subject must not end with a period
- subject must be at most 72 characters

Tips:

- Use the imperative mood: "add", "fix", "update"
- Keep it short and specific
- Use scope only when it adds clarity

More details: see commitlint.config.ts
