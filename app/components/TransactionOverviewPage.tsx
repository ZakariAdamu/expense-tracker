"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart2,
  Calendar,
  DollarSign,
  Download,
  Eye,
  Filter,
  Plus,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import {
  type DashboardTransaction,
  type TimeFrame,
  type TransactionPayload,
  useDashboardOutletContext,
} from "../context/OutletContext";
import { exportToExcel } from "../utils/exportUtils";
import AddTransactionModal, { type NewTransaction } from "./AddTransactions";
import FinancialCard from "./FinancialCard";
import TransactionItem from "./TransactionItem";
import TimeFrameSelector from "./Timeframe";
import { generateChartPoints, getTimeFrameRange } from "./Helper";
import { styles } from "../assets/styles";

type ChartPoint = {
  date: Date;
  label: string;
  hour?: number;
  isCurrent?: boolean;
  [key: string]: Date | string | number | boolean | undefined;
};

type TransactionPageStyles = {
  wrapper: string;
  headerCard: string;
  headerCol: string;
  headerTitle: string;
  headerSubtitle: string;
  addButton: string;
  timeFrameContainer: string;
  summaryGrid: string;
  chartContainer: string;
  chartHeaderRow: string;
  chartTitle: string;
  chartHeight: string;
  filterContainer: string;
  filterSelect: string;
  filterIcon: string;
  exportButton: string;
  transactionsCard: string;
  transactionsHeaderRow: string;
  transactionsTitle: string;
  transactionsList: string;
  viewAllButton: string;
  emptyStateContainer: string;
  emptyStateIcon: string;
  emptyStateText: string;
  emptyStateSubtext: string;
  emptyStateButton: string;
  tooltipContent: {
    backgroundColor: string;
    border: string;
    borderRadius: string;
    boxShadow: string;
    padding: string;
    backdropFilter?: string;
  };
  iconTotal: string;
  iconAverage: string;
  iconCount: string;
  textTotal: string;
  textAverage: string;
  textCount: string;
};

export type TransactionOverviewPageConfig = {
  entityLabel: string;
  entityLabelLower: string;
  transactionType: "income" | "expense";
  apiPath: "income" | "expenses";
  addModalColor: "teal" | "orange";
  timeFrameColor: "teal" | "orange";
  categories: string[];
  categoryIcons: Record<string, React.ReactNode>;
  styles: TransactionPageStyles;
  chart: {
    dataKey: "income" | "expense";
    gradientId: string;
    gradientStart: string;
    gradientEnd: string;
    referenceLineColor: string;
    cellColors: string[];
    iconClassName: string;
  };
  overviewKeys: {
    total: string[];
    average: string[];
  };
};

function toIsoWithClientTime(dateValue: string | undefined) {
  try {
    if (!dateValue) {
      return new Date().toISOString();
    }

    if (typeof dateValue === "string" && dateValue.length === 10) {
      const now = new Date();
      const hhmmss = now.toTimeString().slice(0, 8);
      const combined = new Date(`${dateValue}T${hhmmss}`);
      if (isNaN(combined.getTime())) {
        return new Date().toISOString();
      }
      return combined.toISOString();
    }

    const parsed = new Date(dateValue);
    if (isNaN(parsed.getTime())) {
      return new Date().toISOString();
    }
    return parsed.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function readFirstAvailableValue(
  source: Record<string, unknown>,
  keys: string[],
) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }
  return undefined;
}

function getServerMessage(error: unknown) {
  if (typeof error !== "object" || error === null || !("response" in error)) {
    return undefined;
  }

  const response = (error as { response?: { data?: { message?: string } } })
    .response;
  return response?.data?.message;
}

const DeleteConfirmationModal = ({
  open,
  transaction,
  isDeleting,
  onCancel,
  onConfirm,
  entityLabelLower,
}: {
  open: boolean;
  transaction: DashboardTransaction | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  entityLabelLower: string;
}) => {
  if (!open || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
            Delete {entityLabelLower}
          </p>
          <h2 className="mt-2 text-xl font-bold text-gray-900">
            Are you sure you want to delete this {entityLabelLower} entry?
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            This will permanently remove{" "}
            <span className="font-medium text-gray-900">
              {transaction.description}
            </span>
            {transaction.category ? (
              <span> in {transaction.category}</span>
            ) : null}
            .
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : `Delete ${entityLabelLower}`}
          </button>
        </div>
      </div>
    </div>
  );
};

const FilterSection = ({
  filter,
  setFilter,
  handleExport,
  categories,
  styles,
}: {
  filter: string;
  setFilter: (value: string) => void;
  handleExport: () => Promise<void> | void;
  categories: string[];
  styles: TransactionPageStyles;
}) => (
  <div className={styles.filterContainer}>
    <div className="relative w-full sm:w-auto">
      <select
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        className={styles.filterSelect}
      >
        <option value="all">All Transactions</option>
        <option value="month">This Month</option>
        <option value="year">This Year</option>
        {categories.map((categoryName) => (
          <option key={categoryName} value={categoryName}>
            {categoryName}
          </option>
        ))}
      </select>
      <Filter className={styles.filterIcon} />
    </div>

    <button onClick={handleExport} className={styles.exportButton}>
      <Download size={16} className="md:size-4" /> Export
    </button>
  </div>
);

function TransactionOverviewPage({
  config,
  sidebarCollapsed,
}: {
  config: TransactionOverviewPageConfig;
  sidebarCollapsed: boolean;
}) {
  const {
    transactions: outletTransactions = [],
    timeFrame = "monthly",
    setTimeFrame = () => {},
    addTransaction,
    refreshTransactions,
  } = useDashboardOutletContext();

  const { token } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DashboardTransaction | null>(
    null,
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [newTransaction, setNewTransaction] = useState<NewTransaction>({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: config.transactionType,
    category: config.categories[0] ?? "Other",
  });
  const [editForm, setEditForm] = useState({
    description: "",
    amount: "",
    category: config.categories[0] ?? "Other",
    date: new Date().toISOString().split("T")[0],
  });
  const [overview, setOverview] = useState({
    total: 0,
    average: 0,
    numberOfTransactions: 0,
    recentTransactions: [] as DashboardTransaction[],
    range: "monthly",
  });

  const timeFrameRange = useMemo(
    () => getTimeFrameRange(timeFrame),
    [timeFrame],
  );
  const chartPoints = useMemo(
    () => generateChartPoints(timeFrame),
    [timeFrame],
  );

  const getAuthHeaders = useCallback(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const isDateInRange = useCallback((date: string, start: Date, end: Date) => {
    const parts = date.split("T")[0].split("-");
    const transactionDate =
      parts.length === 3
        ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
        : new Date(date);

    const startDate = new Date(start);
    const endDate = new Date(end);

    transactionDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return transactionDate >= startDate && transactionDate <= endDate;
  }, []);

  const matchingTransactions = useMemo(
    () =>
      (outletTransactions || [])
        .filter(
          (transaction: DashboardTransaction) =>
            transaction.type === config.transactionType,
        )
        .sort(
          (left: DashboardTransaction, right: DashboardTransaction) =>
            new Date(right.date).getTime() - new Date(left.date).getTime(),
        ),
    [outletTransactions, config.transactionType],
  );

  const timeFrameTransactions = useMemo(
    () =>
      matchingTransactions.filter((transaction: DashboardTransaction) =>
        isDateInRange(
          transaction.date,
          timeFrameRange.start,
          timeFrameRange.end,
        ),
      ),
    [matchingTransactions, timeFrameRange, isDateInRange],
  );

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return timeFrameTransactions;

    return timeFrameTransactions.filter((transaction: DashboardTransaction) => {
      if (filter === "month" || filter === "year") {
        const transDate = new Date(transaction.date);
        if (filter === "month") {
          return (
            transDate.getMonth() === timeFrameRange.start.getMonth() &&
            transDate.getFullYear() === timeFrameRange.start.getFullYear()
          );
        }
        if (filter === "year") {
          return transDate.getFullYear() === timeFrameRange.start.getFullYear();
        }
      }
      return transaction.category.toLowerCase() === filter.toLowerCase();
    });
  }, [timeFrameTransactions, filter, timeFrameRange]);

  const chartData = useMemo(() => {
    const data = chartPoints.map((point: ChartPoint) => ({
      ...point,
      [config.chart.dataKey]: 0,
    }));

    filteredTransactions.forEach((transaction: DashboardTransaction) => {
      const parts = transaction.date.split("T")[0].split("-");
      const transDate =
        parts.length === 3
          ? new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
          : new Date(transaction.date);
      const currentTimeFrame = timeFrame as TimeFrame;
      const point = data.find((entry: ChartPoint) =>
        currentTimeFrame === "daily"
          ? entry.hour === transDate.getHours()
          : currentTimeFrame === "yearly"
            ? entry.date.getMonth() === transDate.getMonth()
            : entry.date.getDate() === transDate.getDate() &&
              entry.date.getMonth() === transDate.getMonth(),
      );

      if (point) {
        const currentValue = Number(point[config.chart.dataKey] ?? 0);
        point[config.chart.dataKey] =
          currentValue + Math.round(Number(transaction.amount));
      }
    });

    return data;
  }, [chartPoints, config.chart.dataKey, filteredTransactions, timeFrame]);

  const totalAmount = useMemo(() => {
    const computedTotal = filteredTransactions.reduce(
      (sum: number, transaction: DashboardTransaction) =>
        sum + Math.round(Number(transaction.amount || 0)),
      0,
    );

    return overview.total > 0 || filteredTransactions.length === 0
      ? overview.total
      : computedTotal;
  }, [filteredTransactions, overview.total]);

  const averageAmount = useMemo(() => {
    const computedAverage = filteredTransactions.length
      ? Math.round(
          filteredTransactions.reduce(
            (sum: number, transaction: DashboardTransaction) =>
              sum + Math.round(Number(transaction.amount || 0)),
            0,
          ) / filteredTransactions.length,
        )
      : 0;

    return overview.average > 0 || filteredTransactions.length === 0
      ? Math.round(overview.average)
      : computedAverage;
  }, [filteredTransactions, overview.average]);

  const transactionsCount = useMemo(
    () => filteredTransactions.length,
    [filteredTransactions.length],
  );

  const fetchOverview = useCallback(
    async (range = timeFrame ?? "monthly") => {
      try {
        const response = await axios.get(
          `process.env.NEXT_PUBLIC_API_BASE_URL_PROD/${config.apiPath}`,
          {
            headers: getAuthHeaders(),
            params: { range },
          },
        );

        if (response.data?.success) {
          const payload = response.data.data ?? {};
          setOverview({
            total: Number(
              readFirstAvailableValue(payload, config.overviewKeys.total) ?? 0,
            ),
            average: Number(
              readFirstAvailableValue(payload, config.overviewKeys.average) ??
                0,
            ),
            numberOfTransactions: payload.numberOfTransactions ?? 0,
            recentTransactions: payload.recentTransactions ?? [],
            range: payload.range ?? range,
          });
        }
      } catch (error) {
        console.error(
          `Failed to fetch ${config.entityLabelLower} overview:`,
          error,
        );
      }
    },
    [
      config.apiPath,
      config.entityLabelLower,
      config.overviewKeys.average,
      config.overviewKeys.total,
      getAuthHeaders,
      timeFrame,
    ],
  );

  useEffect(() => {
    fetchOverview(timeFrame ?? "monthly");
  }, [fetchOverview, timeFrame]);

  const handleAddTransaction = useCallback(async () => {
    if (!newTransaction.description || !newTransaction.amount) return false;

    try {
      setLoading(true);

      const payload: TransactionPayload = {
        type: config.transactionType,
        description: newTransaction.description.trim(),
        amount: Number(newTransaction.amount),
        category: newTransaction.category,
        date: toIsoWithClientTime(newTransaction.date),
      };

      const created = await addTransaction(payload as TransactionPayload);
      if (!created) {
        toast.error(`Server error while adding ${config.entityLabelLower}.`);
        return false;
      }

      await refreshTransactions();
      await fetchOverview(timeFrame ?? "monthly");

      setNewTransaction({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        type: config.transactionType,
        category: config.categories[0] ?? "Other",
      });
      toast.success(`${config.entityLabel} added successfully.`);
      return true;
    } catch (error: unknown) {
      console.error(`Add ${config.entityLabelLower} error:`, error);
      const serverMsg = getServerMessage(error);
      toast.error(
        serverMsg || `Server error while adding ${config.entityLabelLower}.`,
      );
      return false;
    } finally {
      setLoading(false);
    }
  }, [
    addTransaction,
    config.categories,
    config.entityLabel,
    config.entityLabelLower,
    config.transactionType,
    fetchOverview,
    newTransaction,
    refreshTransactions,
    timeFrame,
  ]);

  const handleEditTransaction = useCallback(async () => {
    if (!editingId || !editForm.description || !editForm.amount) return;

    try {
      setLoading(true);

      const payload = {
        description: editForm.description.trim(),
        amount: parseFloat(editForm.amount),
        category: editForm.category,
        date: toIsoWithClientTime(editForm.date),
      };

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_BASE_URL_PROD}/${config.apiPath}/${editingId}`,
        payload,
        {
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        },
      );

      await refreshTransactions();
      await fetchOverview(timeFrame ?? "monthly");
      toast.success(`${config.entityLabel} updated successfully.`);

      setEditingId(null);
    } catch (error: unknown) {
      console.error(`Update ${config.entityLabelLower} error:`, error);
      const serverMsg = getServerMessage(error);
      toast.error(
        serverMsg || `Server error while updating ${config.entityLabelLower}.`,
      );
    } finally {
      setLoading(false);
    }
  }, [
    config.apiPath,
    config.entityLabel,
    config.entityLabelLower,
    editForm,
    editingId,
    fetchOverview,
    getAuthHeaders,
    refreshTransactions,
    timeFrame,
  ]);

  const handleDeleteTransaction = useCallback(
    async (id?: string | number) => {
      if (!id) return;

      try {
        setLoading(true);
        await axios.delete(
          `${process.env.NEXT_PUBLIC_API_BASE_URL_PROD}/${config.apiPath}/${id}`,
          {
            headers: getAuthHeaders(),
          },
        );

        await refreshTransactions();
        await fetchOverview(timeFrame ?? "monthly");
        toast.success(`${config.entityLabel} deleted successfully.`);
      } catch (error: unknown) {
        console.error(`Delete ${config.entityLabelLower} error:`, error);
        const serverMsg = getServerMessage(error);
        toast.error(
          serverMsg ||
            `Server error while deleting ${config.entityLabelLower}.`,
        );
      } finally {
        setLoading(false);
      }
    },
    [
      config.apiPath,
      config.entityLabel,
      config.entityLabelLower,
      fetchOverview,
      getAuthHeaders,
      refreshTransactions,
      timeFrame,
    ],
  );

  const openDeleteModal = useCallback(
    (id?: string | number) => {
      if (!id) return;
      const transaction = filteredTransactions.find(
        (item: DashboardTransaction) => item.id === id,
      );
      if (!transaction) return;
      setDeleteTarget(transaction);
    },
    [filteredTransactions],
  );

  const closeDeleteModal = useCallback(() => {
    if (loading) return;
    setDeleteTarget(null);
  }, [loading]);

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    await handleDeleteTransaction(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteTarget, handleDeleteTransaction]);

  const handleExport = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_BASE_URL_PROD}/${config.apiPath}/export/csv`,
        {
          headers: getAuthHeaders(),
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });
      const disposition = response.headers["content-disposition"];
      let filename = `${config.apiPath}_details.xlsx`;
      if (disposition) {
        const match = disposition.match(/filename="?(.+)"?/);
        if (match && match[1]) filename = match[1];
      }
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${config.entityLabel} exported successfully.`);
    } catch (error) {
      console.error("Export error:", error);
      try {
        const exportData = filteredTransactions.map(
          (transaction: DashboardTransaction) => ({
            Date: new Date(transaction.date).toLocaleDateString(),
            Description: transaction.description,
            Category: transaction.category,
            Amount: transaction.amount,
            Type: config.entityLabel,
          }),
        );
        exportToExcel(
          exportData,
          `${config.apiPath}_${new Date().toISOString().slice(0, 10)}`,
        );
        toast.success(`${config.entityLabel} exported successfully.`);
      } catch (fallbackError) {
        console.error("Fallback export failed:", fallbackError);
        toast.error("Failed to export data.");
      }
    }
  }, [
    config.entityLabel,
    config.apiPath,
    filteredTransactions,
    getAuthHeaders,
  ]);

  return (
    <div className={`${styles.layout.mainContainer(sidebarCollapsed)}`}>
      <div
        className={`bg-white mb-4 rounded-xl md:rounded-2xl 2xl:mx-10 p-4 md:p-6 shadow-sm
				border border-gray-100 xl:pr-12 2xl:px-10`}
      >
        <div className="flex flex-col items-end w-full gap-8 md:gap-4 mb-4 md:mb-6">
          <div className="flex flex-row w-full justify-between gap-22">
            <header className="mr-auto">
              <h1 className="text-gray-700 text-lg font-semibold">
                {config.entityLabel} Overview
              </h1>
              <p className={config.styles.headerSubtitle}>
                Track and manage your {config.entityLabelLower} sources
              </p>
            </header>
            <button
              onClick={() => setShowModal(true)}
              className={`${config.styles.addButton}`}
              disabled={loading}
            >
              <Plus size={18} className="md:size-5" />{" "}
              {loading ? "Processing..." : `Add ${config.entityLabel}`}
            </button>
          </div>

          <div className="flex w-full mt-4 px-0 md:px-0">
            <TimeFrameSelector
              timeFrame={timeFrame}
              setTimeFrame={setTimeFrame}
              options={["daily", "weekly", "monthly", "yearly"]}
              color={config.timeFrameColor}
            />
          </div>
        </div>
      </div>

      <div className={config.styles.summaryGrid}>
        <FinancialCard
          icon={
            <div className={config.styles.iconTotal}>
              <DollarSign
                className={`w-4 h-4 md:w-5 md:h-5 ${config.styles.textTotal}`}
              />
            </div>
          }
          label={`Total ${config.entityLabel}`}
          value={`$${Number(totalAmount || 0).toLocaleString()}`}
          additionalContent={
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" /> {timeFrameRange.label}
            </div>
          }
        />

        <FinancialCard
          icon={
            <div className={config.styles.iconAverage}>
              <BarChart2
                className={`w-4 h-4 md:w-5 md:h-5 ${config.styles.textAverage}`}
              />
            </div>
          }
          label={`Average ${config.entityLabel}`}
          value={`$${Number(averageAmount || 0).toLocaleString()}`}
          additionalContent={
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" /> {transactionsCount}{" "}
              transactions
            </div>
          }
        />

        <FinancialCard
          icon={
            <div className={config.styles.iconCount}>
              <TrendingUp
                className={`w-4 h-4 md:w-5 md:h-5 ${config.styles.textCount}`}
              />
            </div>
          }
          label="Transactions"
          value={transactionsCount}
          additionalContent={
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {filter === "all" ? "All records" : "Filtered records"}
            </div>
          }
        />
      </div>

      <div className={config.styles.chartContainer}>
        <div className={config.styles.chartHeaderRow}>
          <h3 className={config.styles.chartTitle}>
            <BarChart2
              className={`w-5 h-5 md:w-6 md:h-6 ${config.chart.iconClassName}`}
            />
            {timeFrame === "daily"
              ? "Hourly"
              : timeFrame === "yearly"
                ? "Monthly"
                : "Daily"}{" "}
            {config.entityLabel} Trends
            <span className="text-sm text-gray-500 font-normal">
              {" "}
              ({timeFrameRange.label})
            </span>
          </h3>
        </div>

        <div className={config.styles.chartHeight}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
            >
              <defs>
                <linearGradient
                  id={config.chart.gradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor={config.chart.gradientStart} />
                  <stop offset="100%" stopColor={config.chart.gradientEnd} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b7280", fontSize: 12 }}
                width={50}
                tickFormatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                formatter={(value) => {
                  const normalizedValue = Array.isArray(value)
                    ? value[0]
                    : value;
                  return [
                    `$${Math.round(Number(normalizedValue ?? 0)).toLocaleString()}`,
                    config.entityLabel,
                  ];
                }}
                contentStyle={config.styles.tooltipContent}
              />
              <Bar
                dataKey={config.chart.dataKey}
                name={config.entityLabel}
                radius={[6, 6, 0, 0]}
                barSize={20}
              >
                {chartData.map((entry: ChartPoint, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      config.chart.cellColors[
                        index % config.chart.cellColors.length
                      ]
                    }
                  />
                ))}
              </Bar>
              {chartData.map((point: ChartPoint, index: number) =>
                point.isCurrent ? (
                  <ReferenceLine
                    key={index}
                    x={point.label}
                    stroke={config.chart.referenceLineColor}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                  />
                ) : null,
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={config.styles.transactionsCard}>
        <div className={config.styles.transactionsHeaderRow}>
          <h3 className={config.styles.transactionsTitle}>
            <DollarSign
              className={`w-5 h-5 md:w-6 md:h-6 ${config.chart.iconClassName}`}
            />
            {config.entityLabel} Transactions
            <span className="text-sm text-gray-500 font-normal">
              {" "}
              ({timeFrameRange.label})
            </span>
          </h3>

          <FilterSection
            filter={filter}
            setFilter={setFilter}
            handleExport={handleExport}
            categories={config.categories}
            styles={config.styles}
          />
        </div>

        <div className={config.styles.transactionsList}>
          {filteredTransactions
            .slice(0, showAll ? filteredTransactions.length : 8)
            .map((transaction: DashboardTransaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                isEditing={editingId === transaction.id}
                editForm={editForm}
                setEditForm={setEditForm}
                onSave={handleEditTransaction}
                onCancel={() => setEditingId(null)}
                onDelete={openDeleteModal}
                type={config.transactionType}
                categoryIcons={config.categoryIcons}
                setEditingId={setEditingId}
              />
            ))}

          {!showAll && filteredTransactions.length > 8 && (
            <button
              onClick={() => setShowAll(true)}
              className={config.styles.viewAllButton}
            >
              <Eye size={18} /> View All {filteredTransactions.length}{" "}
              Transactions
            </button>
          )}

          {filteredTransactions.length === 0 && (
            <div className={config.styles.emptyStateContainer}>
              <div className={config.styles.emptyStateIcon}>
                <DollarSign
                  className={`w-6 h-6 md:w-8 md:h-8 ${config.chart.referenceLineColor === "#f97316" ? "text-orange-400" : "text-green-400"}`}
                />
              </div>
              <p className={config.styles.emptyStateText}>
                No {config.entityLabelLower} transactions found
              </p>
              <p className={config.styles.emptyStateSubtext}>
                {filter === "all"
                  ? `You haven't recorded any ${config.entityLabelLower}s yet`
                  : `No ${filter} transactions found`}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className={config.styles.emptyStateButton}
              >
                <Plus size={16} className="md:size-5" /> Add{" "}
                {config.entityLabel}
              </button>
            </div>
          )}
        </div>
      </div>

      <AddTransactionModal
        showModal={showModal}
        setShowModal={setShowModal}
        newTransaction={newTransaction}
        setNewTransaction={setNewTransaction}
        handleAddTransaction={handleAddTransaction}
        type={config.transactionType}
        title={`Add New ${config.entityLabel}`}
        buttonText={loading ? "Processing..." : `Add ${config.entityLabel}`}
        categories={config.categories}
        color={config.addModalColor}
      />
      <DeleteConfirmationModal
        open={!!deleteTarget}
        transaction={deleteTarget}
        isDeleting={loading}
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
        entityLabelLower={config.entityLabelLower}
      />
    </div>
  );
}

export default TransactionOverviewPage;
