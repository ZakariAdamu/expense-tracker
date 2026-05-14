export interface BudgetRule {
  path: string; // Substring to match within .next/static relative paths
  maxSizeKB: number; // Maximum allowed size in Kilobytes (KB)
}

export const bundleBudgets: BudgetRule[] = [
  {
    path: "chunks/framework", // Matches framework runtime chunk
    maxSizeKB: 500, // Framework entry point limit
  },
  {
    path: "chunks/main-", // Matches main shared chunk files
    maxSizeKB: 600, // Shared chunk file limit
  },
  {
    path: "chunks/app/", // Matches app router chunks
    maxSizeKB: 700, // App chunk file limit
  },
  {
    path: "chunks/pages/", // Matches pages router chunks (if any)
    maxSizeKB: 700, // Page chunk file limit
  },
  {
    path: "css/", // Matches extracted CSS
    maxSizeKB: 250, // Per CSS file limit
  },
  {
    path: "media/", // Matches static media assets
    maxSizeKB: 400, // Per asset limit
  },
  {
    path: ".js", // Fallback for any JS not matched above
    maxSizeKB: 800, // Generic JS file limit
  },
  {
    path: ".css", // Fallback for any CSS not matched above
    maxSizeKB: 250, // Generic CSS file limit
  },
];
