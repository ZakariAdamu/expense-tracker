export interface BudgetRule {
  path: string; // Path containing regex patterns to match built files
  maxSizeKB: number; // Maximum allowed size in Kilobytes (KB)
}

export const bundleBudgets: BudgetRule[] = [
  {
    path: "_app", // Matches framework main entry chunks
    maxSizeKB: 500, // Framework entry point limit
  },
  {
    path: "main-", // Matches main shared chunk files
    maxSizeKB: 600, // Shared chunk file limit
  },
  {
    path: "page", // Matches page chunks
    maxSizeKB: 700, // Page chunk file limit
  },
];
