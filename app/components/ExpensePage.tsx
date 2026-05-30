"use client";

import TransactionOverviewPage, {
  type TransactionOverviewPageConfig,
} from "./TransactionOverviewPage";
import { EXPENSE_CATEGORY_ICONS } from "../assets/colors";
import { expensePageStyles } from "../assets/styles";

const expensePageConfig: TransactionOverviewPageConfig = {
  entityLabel: "Expense",
  entityLabelLower: "expense",
  transactionType: "expense",
  apiPath: "expenses",
  addModalColor: "orange",
  timeFrameColor: "orange",
  categories: [
    "Food",
    "Housing",
    "Transport",
    "Shopping",
    "Entertainment",
    "Utilities",
    "Healthcare",
    "Other",
  ],
  categoryIcons: EXPENSE_CATEGORY_ICONS,
  styles: {
    wrapper:
      "w-full max-w-7xl mx-auto space-y-4 md:space-y-6 px-3 py-3 md:px-6 md:py-4",
    headerCard:
      "bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 overflow-hidden",
    headerCol: expensePageStyles.headerContainer,
    headerTitle: expensePageStyles.headerTitle,
    headerSubtitle: expensePageStyles.headerSubtitle,
    addButton: expensePageStyles.addButton,
    timeFrameContainer:
      "flex w-full justify-center md:justify-end mt-4 px-0 md:px-0",
    summaryGrid:
      "grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-3 lg:grid-cols-3 2xl:px-10",
    chartContainer:
      "hidden md:block mt-4 bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 2xl:mx-10",
    chartHeaderRow: expensePageStyles.chartHeader,
    chartTitle: expensePageStyles.chartTitle,
    chartHeight: "h-72 md:h-80",
    filterContainer:
      "flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto",
    filterSelect: expensePageStyles.filterSelect,
    filterIcon:
      "absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 md:w-4 md:h-4 text-gray-500 pointer-events-none",
    exportButton: expensePageStyles.exportButton,
    transactionsCard:
      "bg-white mt-4 rounded-xl md:rounded-2xl 2xl:mx-10 p-4 md:p-6 shadow-sm border border-gray-100 relative overflow-hidden",
    transactionsHeaderRow: expensePageStyles.transactionsHeader,
    transactionsTitle: expensePageStyles.transactionsTitle,
    transactionsList: "space-y-3 -mx-3 md:mx-0",
    viewAllButton: expensePageStyles.viewAllButton,
    emptyStateContainer: "text-center py-6 md:py-8",
    emptyStateIcon: expensePageStyles.emptyStateIcon,
    emptyStateText: expensePageStyles.emptyStateText,
    emptyStateSubtext: expensePageStyles.emptyStateSubtext,
    emptyStateButton:
      "mt-3 md:mt-4 flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg md:rounded-xl transition-all shadow-md hover:shadow-lg mx-auto text-sm md:text-base",
    tooltipContent: expensePageStyles.tooltipContent,
    iconTotal: expensePageStyles.iconOrange,
    iconAverage: expensePageStyles.iconAmber,
    iconCount: expensePageStyles.iconYellow,
    textTotal: expensePageStyles.textOrange,
    textAverage: expensePageStyles.textAmber,
    textCount: expensePageStyles.textYellow,
  },
  chart: {
    dataKey: "expense",
    gradientId: "expenseBarGradient",
    gradientStart: "#f97316",
    gradientEnd: "#ea580c",
    referenceLineColor: "#f97316",
    cellColors: ["#f97316", "#fb923c", "#fdba74", "#fed7aa"],
    iconClassName: "text-orange-500",
  },
  overviewKeys: {
    total: ["totalExpenses", "totalExpense"],
    average: ["averageExpense", "averageExpenses"],
  },
};

export default function ExpensePage() {
  return (
    <TransactionOverviewPage sidebarCollapsed config={expensePageConfig} />
  );
}
