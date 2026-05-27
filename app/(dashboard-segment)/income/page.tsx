/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
// import { useOutletContext } ;
import {
  Plus,
  DollarSign,
  Download,
  Eye,
  Calendar,
  TrendingUp,
  Filter,
  BarChart2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { exportToExcel } from "../../utils/exportUtils";
import AddTransactionModal from "../../components/AddTransactions";
import TransactionItem from "../../components/TransactionItem";
import TimeFrameSelector from "../../components/Timeframe";
import FinancialCard from "../../components/FinancialCard";
import {
  getTimeFrameRange,
  generateChartPoints,
} from "../../components/Helper";
import { INCOME_COLORS, CATEGORY_ICONS_Inc } from "../../assets/colors";
import { incomeStyles as styles } from "../../assets/styles";
import { useDashboardOutletContext } from "../../context/OutletContext";
import type {
  TransactionPayload,
  TimeFrame,
  DashboardTransaction,
} from "../../context/OutletContext";
import type { NewTransaction } from "../../components/AddTransactions";
import { toast } from "sonner";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL_LOCAL ||
  process.env.NEXT_PUBLIC_API_BASE_URL_PROD ||
  "http://localhost:4000/api";

function toIsoWithClientTime(dateValue: string | undefined) {
  if (!dateValue) {
    return new Date().toISOString();
  }

  if (typeof dateValue === "string" && dateValue.length === 10) {
    const now = new Date();
    const hhmmss = now.toTimeString().slice(0, 8);
    const combined = new Date(`${dateValue}T${hhmmss}`);
    return combined.toISOString();
  }

  try {
    return new Date(dateValue).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

type ChartPoint = {
  date: Date;
  label: string;
  hour?: number;
  isCurrent?: boolean;
  income?: number;
};

type TimeFrameRange = {
  start: Date;
  end: Date;
  label: string;
};

const IncomeChart = ({
  chartData,
  timeFrame,
  timeFrameRange,
}: {
  chartData: ChartPoint[];
  timeFrame: TimeFrame;
  timeFrameRange: TimeFrameRange;
}) => (
  <div className={styles.chartContainer}>
    <div className={styles.chartHeaderContainer}>
      <h3 className={styles.chartTitle}>
        <BarChart2 className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
        {timeFrame === "daily"
          ? "Hourly"
          : timeFrame === "yearly"
            ? "Monthly"
            : "Daily"}{" "}
        Income Trends
        <span className="text-sm text-gray-500 font-normal">
          {" "}
          ({timeFrameRange.label})
        </span>
      </h3>
    </div>

    <div className={styles.chartHeight}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
        >
          <defs>
            <linearGradient id="incomeBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
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
            formatter={(value: any) => [
              `$${Math.round(value ?? 0).toLocaleString()}`,
              "Income",
            ]}
            contentStyle={styles.tooltipContent}
          />
          <Bar
            dataKey="income"
            name="Income"
            radius={[6, 6, 0, 0]}
            barSize={20}
          >
            {chartData.map((entry: ChartPoint, index: number) => (
              <Cell
                key={`cell-${index}`}
                fill={INCOME_COLORS[index % INCOME_COLORS.length]}
              />
            ))}
          </Bar>

          {chartData.map((point: ChartPoint, index: number) =>
            point.isCurrent ? (
              <ReferenceLine
                key={index}
                x={point.label}
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="3 3"
              />
            ) : null,
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const FilterSection = ({
  filter,
  setFilter,
  handleExport,
}: {
  filter: string;
  setFilter: (v: string) => void;
  handleExport: () => Promise<void> | void;
}) => (
  <div className={styles.filterContainer}>
    <div className="relative w-full sm:w-auto">
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className={styles.filterSelect}
      >
        <option value="all">All Transactions</option>
        <option value="month">This Month</option>
        <option value="year">This Year</option>
        <option value="Salary">Salary</option>
        <option value="Freelance">Freelance</option>
        <option value="Investment">Investment</option>
        <option value="Bonus">Bonus</option>
        <option value="Other">Other</option>
      </select>
      <Filter className={styles.filterIcon} />
    </div>

    <button onClick={handleExport} className={styles.exportButton}>
      <Download size={16} className="md:size-4" /> Export
    </button>
  </div>
);

const Income: React.FC = () => {
  const {
    transactions: outletTransactions = [],
    timeFrame = "monthly",
    setTimeFrame = () => {},
    addTransaction,
    refreshTransactions,
  } = useDashboardOutletContext();

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(false);
  type Overview = {
    totalIncome: number;
    averageIncome: number;
    numberOfTransactions: number;
    recentTransactions: DashboardTransaction[];
    range: string;
  };

  const [overview, setOverview] = useState<Overview>({
    totalIncome: 0,
    averageIncome: 0,
    numberOfTransactions: 0,
    recentTransactions: [],
    range: "monthly",
  });
  const { token } = useAuth();

  const [newTransaction, setNewTransaction] = useState<NewTransaction>({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "income",
    category: "Salary",
  });
  const [editForm, setEditForm] = useState({
    description: "",
    amount: "",
    category: "Salary",
    date: new Date().toISOString().split("T")[0],
  });

  const getAuthHeaders = useCallback(() => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [token]);

  const timeFrameRange = useMemo(
    () => getTimeFrameRange(timeFrame),
    [timeFrame],
  );
  const chartPoints = useMemo(
    () => generateChartPoints(timeFrame),
    [timeFrame],
  );

  const isDateInRange = useCallback((date: string, start: Date, end: Date) => {
    const transactionDate = new Date(date);
    const startDate = new Date(start);
    const endDate = new Date(end);

    transactionDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return transactionDate >= startDate && transactionDate <= endDate;
  }, []);

  const incomeTransactions = useMemo(
    () =>
      (outletTransactions || [])
        .filter((t: DashboardTransaction) => t.type === "income")
        .sort(
          (a: DashboardTransaction, b: DashboardTransaction) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [outletTransactions],
  );

  const timeFrameTransactions = useMemo(
    () =>
      incomeTransactions.filter((t: DashboardTransaction) =>
        isDateInRange(t.date, timeFrameRange.start, timeFrameRange.end),
      ),
    [incomeTransactions, timeFrameRange, isDateInRange],
  );

  const filteredTransactions = useMemo(() => {
    if (filter === "all") return timeFrameTransactions;

    return timeFrameTransactions.filter((t: DashboardTransaction) => {
      if (filter === "month" || filter === "year") {
        const transDate = new Date(t.date);
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
      return t.category.toLowerCase() === filter.toLowerCase();
    });
  }, [timeFrameTransactions, filter, timeFrameRange]);

  const chartData = useMemo(() => {
    const data = chartPoints.map((point: ChartPoint) => ({
      ...point,
      income: 0,
    }));

    filteredTransactions.forEach((transaction: DashboardTransaction) => {
      const transDate = new Date(transaction.date);
      const tf = timeFrame as TimeFrame;
      const point = data.find((d: ChartPoint) =>
        tf === "daily"
          ? d.hour === transDate.getHours()
          : tf === "yearly"
            ? d.date.getMonth() === transDate.getMonth()
            : d.date.getDate() === transDate.getDate() &&
              d.date.getMonth() === transDate.getMonth(),
      );
      if (point) {
        point.income =
          (point.income || 0) + Math.round(Number(transaction.amount));
      }
    });

    return data;
  }, [filteredTransactions, chartPoints, timeFrame]);

  const fetchOverview = useCallback(
    async (range = timeFrame ?? "monthly") => {
      try {
        const res = await axios.get(`${API_BASE}/income`, {
          headers: getAuthHeaders(),
          params: { range },
        });

        if (res.data?.success) {
          const payload = res.data.data ?? {};
          setOverview({
            totalIncome: payload.totalIncome ?? 0,
            averageIncome: payload.averageIncome ?? 0,
            numberOfTransactions: payload.numberOfTransactions ?? 0,
            recentTransactions: payload.recentTransactions ?? [],
            range: payload.range ?? range,
          });
        }
      } catch (err) {
        console.error("Failed to fetch overview:", err);
      }
    },
    [timeFrame, getAuthHeaders],
  );

  useEffect(() => {
    fetchOverview(timeFrame ?? "monthly");
  }, [fetchOverview, timeFrame]);

  const totalIncome = useMemo(
    () =>
      overview.totalIncome ??
      filteredTransactions.reduce(
        (sum: number, t: DashboardTransaction) =>
          sum + Math.round(Number(t.amount || 0)),
        0,
      ),
    [overview.totalIncome, filteredTransactions],
  );

  const averageIncome = useMemo(
    () =>
      overview.averageIncome
        ? Math.round(overview.averageIncome)
        : filteredTransactions.length
          ? Math.round(
              filteredTransactions.reduce(
                (s: number, t: DashboardTransaction) =>
                  s + Math.round(Number(t.amount || 0)),
                0,
              ) / filteredTransactions.length,
            )
          : 0,
    [overview.averageIncome, filteredTransactions],
  );

  const transactionsCount = useMemo(
    () => overview.numberOfTransactions ?? filteredTransactions.length,
    [overview.numberOfTransactions, filteredTransactions],
  );

  const handleAddTransaction = useCallback(async () => {
    if (!newTransaction.description || !newTransaction.amount) return false;

    try {
      setLoading(true);

      const payload: TransactionPayload = {
        type: "income",
        description: newTransaction.description.trim(),
        amount: Number(newTransaction.amount),
        category: newTransaction.category,
        date: toIsoWithClientTime(newTransaction.date),
      };

      const created = await addTransaction(payload as TransactionPayload);
      if (!created) {
        toast.error("Server error while adding income.");
        return false;
      }

      await refreshTransactions();
      await fetchOverview(timeFrame ?? "monthly");

      setNewTransaction({
        date: new Date().toISOString().split("T")[0],
        description: "",
        amount: "",
        type: "income",
        category: "Salary",
      });
      toast.success("Income added successfully.");
      return true;
    } catch (err: unknown) {
      console.error("Add income error:", err);
      const serverMsg = (err as any)?.response?.data?.message;
      toast.error(serverMsg || "Server error while adding income.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [
    newTransaction,
    addTransaction,
    refreshTransactions,
    fetchOverview,
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

      await axios.put(`${API_BASE}/income/${editingId}`, payload, {
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      });

      await refreshTransactions();
      await fetchOverview(timeFrame ?? "monthly");
      toast.success("Income updated successfully.");

      setEditingId(null);
    } catch (err: unknown) {
      console.error("Update income error:", err);
      const serverMsg = (err as any)?.response?.data?.message;
      toast.error(serverMsg || "Server error while updating income.");
    } finally {
      setLoading(false);
    }
  }, [
    editingId,
    editForm,
    getAuthHeaders,
    refreshTransactions,
    fetchOverview,
    timeFrame,
  ]);

  const handleDeleteTransaction = useCallback(
    async (id?: string | number) => {
      if (!id) return;
      if (!window.confirm("Are you sure you want to delete this income?"))
        return;

      try {
        setLoading(true);
        await axios.delete(`${API_BASE}/income/${id}`, {
          headers: getAuthHeaders(),
        });

        await refreshTransactions();
        await fetchOverview(timeFrame ?? "monthly");
        toast.success("Income deleted successfully.");
      } catch (err: unknown) {
        console.error("Delete income error:", err);
        const serverMsg = (err as any)?.response?.data?.message;
        toast.error(serverMsg || "Server error while deleting income.");
      } finally {
        setLoading(false);
      }
    },
    [getAuthHeaders, refreshTransactions, fetchOverview, timeFrame],
  );

  const handleExport = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/income/export/csv`, {
        headers: getAuthHeaders(),
        responseType: "blob",
      });

      const blob = new Blob([res.data], {
        type: res.headers["content-type"] || "application/octet-stream",
      });
      const disposition = res.headers["content-disposition"];
      let filename = "income_details.xlsx";
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
      toast.success("Income exported successfully.");
    } catch (err) {
      console.error("Export error:", err);
      try {
        const exportData = filteredTransactions.map(
          (t: DashboardTransaction) => ({
            Date: new Date(t.date).toLocaleDateString(),
            Description: t.description,
            Category: t.category,
            Amount: t.amount,
            Type: "Income",
          }),
        );
        exportToExcel(
          exportData,
          `income_${new Date().toISOString().slice(0, 10)}`,
        );
        toast.success("Income exported successfully.");
      } catch (e) {
        console.error("Fallback export failed:", e);
        toast.error("Failed to export data.");
      }
    }
  }, [getAuthHeaders, filteredTransactions]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.headerContainer}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>Income Overview</h1>
            <p className={styles.headerSubtitle}>
              Track and manage your income sources
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className={styles.addButton}
            disabled={loading}
          >
            <Plus size={18} className="md:size-5" />{" "}
            {loading ? "Processing..." : "Add Income"}
          </button>
        </div>

        <div className={styles.timeFrameContainer}>
          <TimeFrameSelector
            timeFrame={timeFrame}
            setTimeFrame={setTimeFrame}
            options={["daily", "weekly", "monthly", "yearly"]}
            color="teal"
          />
        </div>
      </div>

      <div className={styles.summaryGrid}>
        <FinancialCard
          icon={
            <div className={styles.iconGreen}>
              <DollarSign
                className={`w-4 h-4 md:w-5 md:h-5 ${styles.textGreen}`}
              />
            </div>
          }
          label="Total Income"
          value={`$${Number(totalIncome || 0).toLocaleString()}`}
          additionalContent={
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" /> {timeFrameRange.label}
            </div>
          }
        />

        <FinancialCard
          icon={
            <div className={styles.iconBlue}>
              <BarChart2
                className={`w-4 h-4 md:w-5 md:h-5 ${styles.textBlue}`}
              />
            </div>
          }
          label="Average Income"
          value={`$${Number(averageIncome || 0).toLocaleString()}`}
          additionalContent={
            <div className="mt-2 text-xs text-gray-500 flex items-center">
              <Calendar className="w-3 h-3 mr-1" /> {transactionsCount}{" "}
              transactions
            </div>
          }
        />

        <FinancialCard
          icon={
            <div className={styles.iconPurple}>
              <TrendingUp
                className={`w-4 h-4 md:w-5 md:h-5 ${styles.textPurple}`}
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

      <IncomeChart
        chartData={chartData}
        timeFrame={timeFrame}
        timeFrameRange={timeFrameRange}
      />

      <div className={styles.listContainer}>
        <div className={styles.header}>
          <h3 className={styles.sectionTitle}>
            <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-500" />{" "}
            Income Transactions{" "}
            <span className="text-sm text-gray-500 font-normal">
              {" "}
              ({timeFrameRange.label})
            </span>
          </h3>

          <FilterSection
            filter={filter}
            setFilter={setFilter}
            handleExport={handleExport}
          />
        </div>

        <div className={styles.transactionList}>
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
                onDelete={handleDeleteTransaction}
                type="income"
                categoryIcons={CATEGORY_ICONS_Inc}
                setEditingId={setEditingId}
              />
            ))}

          {!showAll && filteredTransactions.length > 8 && (
            <button
              onClick={() => setShowAll(true)}
              className={styles.viewAllButton}
            >
              <Eye size={18} /> View All {filteredTransactions.length}{" "}
              Transactions
            </button>
          )}

          {filteredTransactions.length === 0 && (
            <div className={styles.emptyStateContainer}>
              <div className={styles.emptyStateIcon}>
                <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-400" />
              </div>
              <p className={styles.emptyStateText}>
                No income transactions found
              </p>
              <p className={styles.emptyStateSubtext}>
                {filter === "all"
                  ? "You haven't recorded any income yet"
                  : `No ${filter} transactions found`}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className={styles.emptyStateButton}
              >
                <Plus size={16} className="md:size-5" /> Add Income
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
        type="income"
        title="Add New Income"
        buttonText={loading ? "Processing..." : "Add Income"}
        categories={["Salary", "Freelance", "Investment", "Bonus", "Other"]}
        color="teal"
      />
    </div>
  );
};

export default Income;
