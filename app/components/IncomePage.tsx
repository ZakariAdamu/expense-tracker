"use client";

import TransactionOverviewPage, {
  type TransactionOverviewPageConfig,
} from "./TransactionOverviewPage";
import { CATEGORY_ICONS_Inc, INCOME_COLORS } from "../assets/colors";
import { incomeStyles } from "../assets/styles";

const incomePageConfig: TransactionOverviewPageConfig = {
  entityLabel: "Income",
  entityLabelLower: "income",
  transactionType: "income",
  apiPath: "income",
  addModalColor: "teal",
  timeFrameColor: "teal",
  categories: ["Salary", "Freelance", "Investment", "Bonus", "Other"],
  categoryIcons: CATEGORY_ICONS_Inc,
  styles: {
    wrapper:
      "w-full grid max-w-7xl mx-auto space-y-4 md:space-y-6 px-3 py-3 md:px-6 md:py-4",
    headerCard:
      "bg-white rounded-xl grid-cols-1 p-4 md:p-6 shadow-sm border border-gray-100 overflow-hidden",
    headerCol: incomeStyles.header,
    headerTitle: incomeStyles.headerTitle,
    headerSubtitle: incomeStyles.headerSubtitle,
    addButton: incomeStyles.addButton,
    timeFrameContainer: "flex w-full ml-auto mt-4 px-0 md:px-0",
    summaryGrid:
      "grid grid-cols-1 gap-4 md:gap-5 md:grid-cols-3 lg:grid-cols-3 2xl:px-10",
    chartContainer:
      "hidden md:block mt-4 bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 2xl:mx-10",
    chartHeaderRow: incomeStyles.chartHeaderContainer,
    chartTitle: incomeStyles.chartTitle,
    chartHeight: "h-72 md:h-80",
    filterContainer:
      "flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto",
    filterSelect: incomeStyles.filterSelect,
    filterIcon: incomeStyles.filterIcon,
    exportButton: incomeStyles.exportButton,
    transactionsCard:
      "bg-white mt-4 rounded-xl md:rounded-2xl 2xl:mx-10 p-4 md:p-6 shadow-sm border border-gray-100 relative overflow-hidden",
    transactionsHeaderRow: incomeStyles.header,
    transactionsTitle: incomeStyles.sectionTitle,
    transactionsList: "space-y-3 -mx-3 md:mx-0",
    viewAllButton: incomeStyles.viewAllButton,
    emptyStateContainer: "text-center py-6 md:py-8",
    emptyStateIcon: incomeStyles.emptyStateIcon,
    emptyStateText: incomeStyles.emptyStateText,
    emptyStateSubtext: incomeStyles.emptyStateSubtext,
    emptyStateButton:
      "mt-3 md:mt-4 flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-3 py-2 md:px-4 md:py-2.5 rounded-lg md:rounded-xl transition-all shadow-md hover:shadow-lg mx-auto text-sm md:text-base",
    tooltipContent: incomeStyles.tooltipContent,
    iconTotal: incomeStyles.iconGreen,
    iconAverage: incomeStyles.iconBlue,
    iconCount: incomeStyles.iconPurple,
    textTotal: incomeStyles.textGreen,
    textAverage: incomeStyles.textBlue,
    textCount: incomeStyles.textPurple,
  },
  chart: {
    dataKey: "income",
    gradientId: "incomeBarGradient",
    gradientStart: "#10b981",
    gradientEnd: "#059669",
    referenceLineColor: "#10b981",
    cellColors: INCOME_COLORS,
    iconClassName: "text-green-500",
  },
  overviewKeys: {
    total: ["totalIncome"],
    average: ["averageIncome"],
  },
};

export default function IncomePage() {
  return <TransactionOverviewPage sidebarCollapsed config={incomePageConfig} />;
}
