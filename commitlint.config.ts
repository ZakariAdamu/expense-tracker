import type { UserConfig } from "@commitlint/types";

const CommitlintConfig: UserConfig = {
  // Extend the standard conventional commit guidelines
  extends: ["@commitlint/config-conventional"],

  // Custom rules (0 = off, 1 = warning, 2 = error)
  rules: {
    // Force lowercase scope names (e.g., feat(auth): instead of feat(Auth):)
    "scope-case": [2, "always", "kebab-case"],

    // Prevent commit description from ending with a period
    "subject-full-stop": [2, "never", "."],

    // Ensure the description is not empty
    "subject-empty": [2, "never"],

    // Set maximum subject length to 72 characters
    "subject-max-length": [2, "always", 72],

    // Enforce specific allowed types
    "type-enum": [
      2,
      "always",
      [
        "build", // Changes affecting build system or dependencies
        "chore", // Routine tasks, maintenance, or tooling changes
        "ci", // Continuous Integration configurations
        "docs", // Documentation changes only
        "feat", // New features
        "fix", // Bug fixes
        "perf", // Code changes improving performance
        "refactor", // Code changes that neither fix a bug nor add a feature
        "revert", // Reverting a previous commit
        "style", // Formatting, missing semi-colons, style tweaks
        "test", // Adding missing tests or correcting existing tests
      ],
    ],
  },
};

export default CommitlintConfig;
