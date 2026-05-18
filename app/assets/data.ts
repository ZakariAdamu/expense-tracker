import { v4 as uuidv4 } from "uuid";

// Colors for charts (stable constant)
export const COLORS = [
  "#4f46e5",
  "#10b981",
  "#f97316",
  "#0ea5e9",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
];

// Utility to generate random date string (ISO date) within last N days
const randomDate = (days = 30) => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  )
    .toISOString()
    .split("T")[0];
};

export function generateDummyTransactions(count = 100) {
  const categories = [
    "Food",
    "Housing",
    "Transport",
    "Shopping",
    "Entertainment",
    "Utilities",
    "Healthcare",
  ];

  return Array.from({ length: count }, () => {
    const isExpense = Math.random() > 0.3;
    const amount = (Math.random() * 500 + 10).toFixed(2);
    const category = categories[Math.floor(Math.random() * categories.length)];

    return {
      id: uuidv4(),
      type: isExpense ? "expense" : "income",
      amount,
      description: `${isExpense ? "Payment for" : "Income from"} ${category.toLowerCase()}`,
      category,
      date: randomDate(),
      receipt: null,
    };
  });
}

export function getGaugeData() {
  return [
    { name: "Income", value: 4500, history: [3200, 4000, 5000, 6000, 5500] },
    { name: "Expenses", value: 3200, history: [1800, 1900, 2100, 2400, 3000] },
    { name: "Savings", value: 1800, history: [1000, 1200, 900, 1500, 1800] },
  ];
}

export function getStatsData() {
  return {
    monthSpent: 2450.75,
    monthRemaining: 1549.25,
    topCategory: "Food",
    topCategoryAmount: 780.5,
    budget: 4000,
  };
}

export function getFinancialOverviewData() {
  return [
    { name: "Food", value: 780.5 },
    { name: "Housing", value: 1200.0 },
    { name: "Transport", value: 350.25 },
    { name: "Shopping", value: 420.75 },
    { name: "Entertainment", value: 230.5 },
    { name: "Utilities", value: 180.0 },
    { name: "Healthcare", value: 150.0 },
  ];
}
