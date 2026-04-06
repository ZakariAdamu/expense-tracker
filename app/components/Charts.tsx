"use client";

import { useEffect, useMemo, useState } from "react";
import {
	Bar,
	BarChart,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { Plus, RefreshCw, TrendingUp } from "lucide-react";
import { dashboardStyles, trendStyles } from "../assets/styles";
import { COLORS, EXPENSE_CATEGORY_ICONS } from "../assets/colors";
import { calculateData, getTimeFrameRange } from "./Helper";
import AddTransactionModal, { type NewTransaction } from "./AddTransactions";
import {
	useDashboardOutletContext,
	type DashboardTransaction,
	type TimeFrame,
} from "../context/OutletContext";
import { useUserRole } from "../context/UserRoleContext";

const timeframeLabels: Record<TimeFrame, string> = {
	daily: "Today",
	weekly: "This Week",
	monthly: "This Month",
};

const timeframeOptions: TimeFrame[] = ["daily", "weekly", "monthly"];

type ChartPoint = {
	name: string;
	value: number;
};

function formatCurrency(value: number) {
	return value.toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

function getCategoryIcon(category: string) {
	return EXPENSE_CATEGORY_ICONS[
		category as keyof typeof EXPENSE_CATEGORY_ICONS
	];
}

function normalizeDate(value: string) {
	return new Date(value).toISOString();
}

export default function Charts() {
	const {
		transactions,
		timeFrame,
		setTimeFrame,
		refreshTransactions,
		lastUpdated,
		addTransaction,
	} = useDashboardOutletContext();
	const { role } = useUserRole();

	const [showModal, setShowModal] = useState(false);
	const [loading, setLoading] = useState(false);
	const [showAllIncome, setShowAllIncome] = useState(false);
	const [showAllExpense, setShowAllExpense] = useState(false);
	const [newTransaction, setNewTransaction] = useState<NewTransaction>({
		type: "expense",
		description: "",
		amount: "",
		category: "Food",
		date: new Date().toISOString().split("T")[0],
	});

	const timeframeRange = useMemo(
		() => getTimeFrameRange(timeFrame),
		[timeFrame],
	);

	const filteredTransactions = useMemo(() => {
		return transactions.filter((transaction) => {
			const transactionDate = new Date(transaction.date);
			return (
				transactionDate >= timeframeRange.start &&
				transactionDate <= timeframeRange.end
			);
		});
	}, [timeframeRange.end, timeframeRange.start, transactions]);

	const summary = useMemo(
		() => calculateData(filteredTransactions),
		[filteredTransactions],
	);

	const expenseByCategory = useMemo(() => {
		const grouped: Record<string, number> = {};

		filteredTransactions.forEach((transaction) => {
			if (transaction.type !== "expense") {
				return;
			}

			grouped[transaction.category] =
				(grouped[transaction.category] || 0) + Number(transaction.amount);
		});

		return Object.entries(grouped)
			.sort((left, right) => right[1] - left[1])
			.slice(0, 6)
			.map(([name, value]) => ({ name, value }));
	}, [filteredTransactions]);

	const recentIncome = useMemo(
		() =>
			filteredTransactions
				.filter((transaction) => transaction.type === "income")
				.sort(
					(left, right) =>
						new Date(right.date).getTime() - new Date(left.date).getTime(),
				),
		[filteredTransactions],
	);

	const recentExpense = useMemo(
		() =>
			filteredTransactions
				.filter((transaction) => transaction.type === "expense")
				.sort(
					(left, right) =>
						new Date(right.date).getTime() - new Date(left.date).getTime(),
				),
		[filteredTransactions],
	);

	const visibleIncome = showAllIncome ? recentIncome : recentIncome.slice(0, 4);
	const visibleExpense = showAllExpense
		? recentExpense
		: recentExpense.slice(0, 4);

	const overviewData: ChartPoint[] = [
		{ name: "Income", value: summary.income },
		{ name: "Spent", value: summary.expenses },
		{ name: "Savings", value: summary.savings },
	];

	useEffect(() => {
		if (role === "Guest" && showModal) {
			setShowModal(false);
		}
	}, [role, showModal]);

	const handleAddTransaction = async () => {
		if (role !== "Admin") {
			return;
		}

		if (!newTransaction.description.trim() || !newTransaction.amount) {
			return;
		}

		setLoading(true);
		try {
			await addTransaction({
				type: newTransaction.type,
				description: newTransaction.description.trim(),
				amount: Number(newTransaction.amount),
				category: newTransaction.category,
				date: normalizeDate(newTransaction.date),
			});

			setNewTransaction({
				type: "expense",
				description: "",
				amount: "",
				category: "Food",
				date: new Date().toISOString().split("T")[0],
			});
			setShowModal(false);
			await refreshTransactions();
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-6">
			<section className={dashboardStyles.headerContainer}>
				<div className={dashboardStyles.headerContent}>
					<div>
						<h2 className={dashboardStyles.headerTitle}>Financial Charts</h2>
						<p className={dashboardStyles.headerSubtitle}>
							A quick view of your {timeframeLabels[timeFrame].toLowerCase()}{" "}
							activity.
						</p>
					</div>
					<div className="flex items-center gap-3">
						{role === "Admin" && (
							<button
								type="button"
								onClick={() => setShowModal(true)}
								className={dashboardStyles.addButton}
							>
								<Plus size={16} />
								Add Transaction
							</button>
						)}
						<button
							type="button"
							onClick={refreshTransactions}
							className={dashboardStyles.addButton}
						>
							<RefreshCw size={16} />
							Refresh
						</button>
					</div>
				</div>

				<div className={dashboardStyles.timeFrameContainer}>
					<div className={dashboardStyles.timeFrameWrapper}>
						{timeframeOptions.map((option) => (
							<button
								key={option}
								type="button"
								onClick={() => setTimeFrame(option)}
								className={dashboardStyles.timeFrameButton(
									timeFrame === option,
								)}
							>
								{timeframeLabels[option]}
							</button>
						))}
					</div>
				</div>
			</section>

			<section className={dashboardStyles.summaryGrid}>
				<div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
					<p className="text-sm text-gray-500">Income</p>
					<p className="mt-2 text-3xl xl:text-2xl w-fit font-bold text-teal-600">
						${formatCurrency(summary.income)}
					</p>
				</div>
				<div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
					<p className="text-sm text-gray-500">Expenses</p>
					<p className="mt-2 text-3xl xl:text-2xl w-fit font-bold text-orange-600">
						${formatCurrency(summary.expenses)}
					</p>
				</div>
				<div className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100">
					<p className="text-sm text-gray-500">Savings</p>
					<p className="mt-2 text-3xl xl:text-2xl w-fit font-bold text-cyan-600">
						${formatCurrency(summary.savings)}
					</p>
					<p
						className={`${trendStyles.positiveRate} mt-3 inline-flex rounded-full px-3 py-1 text-xs font-medium`}
					>
						{summary.income > 0
							? ((summary.savings / summary.income) * 100).toFixed(1)
							: "0.0"}
						% savings rate
					</p>
				</div>
			</section>

			<section className={dashboardStyles.pieChartContainer}>
				<div className={dashboardStyles.pieChartHeader}>
					<div>
						<h3 className={dashboardStyles.pieChartTitle}>
							<TrendingUp className="h-5 w-5 text-teal-500" />
							Overview
						</h3>
						<p className={dashboardStyles.pieChartSubtitle}>
							Income, spending, and savings for the selected timeframe.
						</p>
					</div>
					<p className="text-sm text-gray-500">
						Last updated{" "}
						{lastUpdated.toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
						})}
					</p>
				</div>
				<div className={dashboardStyles.pieChartHeight}>
					<ResponsiveContainer width="100%" height="100%">
						<BarChart
							data={overviewData}
							margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
						>
							<XAxis dataKey="name" tick={{ fill: "#6b7280" }} />
							<YAxis
								tickFormatter={(value: number) => `$${value}`}
								tick={{ fill: "#6b7280" }}
							/>
							<Tooltip />
							<Legend />
							<Bar dataKey="value" radius={[12, 12, 0, 0]}>
								{overviewData.map((entry, index) => (
									<Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
								))}
							</Bar>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</section>

			<section className={dashboardStyles.pieChartContainer}>
				<div className={dashboardStyles.pieChartHeader}>
					<div>
						<h3 className={dashboardStyles.pieChartTitle}>Expense Breakdown</h3>
						<p className={dashboardStyles.pieChartSubtitle}>
							Your largest expense categories in the selected timeframe.
						</p>
					</div>
				</div>
				<div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
					<div className={dashboardStyles.pieChartHeight}>
						{expenseByCategory.length > 0 ? (
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={expenseByCategory}
										dataKey="value"
										nameKey="name"
										outerRadius={110}
										innerRadius={55}
										paddingAngle={3}
									>
										{expenseByCategory.map((entry, index) => (
											<Cell
												key={entry.name}
												fill={COLORS[index % COLORS.length]}
											/>
										))}
									</Pie>
									<Tooltip />
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						) : (
							<div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-500">
								No expense data for this timeframe.
							</div>
						)}
					</div>
					<div className="space-y-3">
						{expenseByCategory.map((entry, index) => {
							const icon = getCategoryIcon(entry.name);
							return (
								<div
									key={entry.name}
									className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
								>
									<div className="flex items-center gap-3">
										<div
											className="flex h-10 w-10 items-center justify-center rounded-lg"
											style={{
												backgroundColor: `${COLORS[index % COLORS.length]}22`,
											}}
										>
											{icon ?? <TrendingUp className="h-4 w-4 text-gray-500" />}
										</div>
										<div>
											<p className="font-medium text-gray-800">{entry.name}</p>
											<p className="text-xs text-gray-500">
												{summary.expenses > 0
													? ((entry.value / summary.expenses) * 100).toFixed(1)
													: "0.0"}
												% of expenses
											</p>
										</div>
									</div>
									<p className="font-semibold text-gray-800">
										${formatCurrency(entry.value)}
									</p>
								</div>
							);
						})}
						{expenseByCategory.length === 0 && (
							<div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
								Add expenses to see category insights here.
							</div>
						)}
					</div>
				</div>
			</section>

			<section className={dashboardStyles.pieChartContainer}>
				<div className={dashboardStyles.pieChartHeader}>
					<div>
						<h3 className={dashboardStyles.pieChartTitle}>
							Recent Transactions
						</h3>
						<p className={dashboardStyles.pieChartSubtitle}>
							The latest income and expense entries for this timeframe.
						</p>
					</div>
				</div>
				<div className="grid gap-6 lg:grid-cols-2">
					<div className="space-y-3">
						<h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
							Income
						</h4>
						{visibleIncome.map((transaction) => (
							<TransactionRow key={transaction.id} transaction={transaction} />
						))}
						{recentIncome.length > 4 && (
							<button
								type="button"
								onClick={() => setShowAllIncome((prev) => !prev)}
								className="text-sm font-medium text-teal-600 hover:underline"
							>
								{showAllIncome
									? "Show less"
									: `Show all ${recentIncome.length}`}
							</button>
						)}
					</div>
					<div className="space-y-3">
						<h4 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
							Expenses
						</h4>
						{visibleExpense.map((transaction) => (
							<TransactionRow key={transaction.id} transaction={transaction} />
						))}
						{recentExpense.length > 4 && (
							<button
								type="button"
								onClick={() => setShowAllExpense((prev) => !prev)}
								className="text-sm font-medium text-orange-600 hover:underline"
							>
								{showAllExpense
									? "Show less"
									: `Show all ${recentExpense.length}`}
							</button>
						)}
					</div>
				</div>
			</section>

			{role === "Admin" && (
				<AddTransactionModal
					showModal={showModal}
					setShowModal={setShowModal}
					newTransaction={newTransaction}
					setNewTransaction={setNewTransaction}
					handleAddTransaction={handleAddTransaction}
					title="Add New Transaction"
					buttonText={loading ? "Saving..." : "Add Transaction"}
					color={newTransaction.type === "income" ? "teal" : "orange"}
				/>
			)}
		</div>
	);
}

function TransactionRow({
	transaction,
}: {
	transaction: DashboardTransaction;
}) {
	return (
		<div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
			<div>
				<p className="font-medium text-gray-800">{transaction.description}</p>
				<p className="text-xs text-gray-500">
					{new Date(transaction.date).toLocaleDateString()} ·{" "}
					{transaction.category}
				</p>
			</div>
			<p
				className={
					transaction.type === "income" ? "text-teal-600" : "text-orange-600"
				}
			>
				{transaction.type === "income" ? "+" : "-"}$
				{formatCurrency(transaction.amount)}
			</p>
		</div>
	);
}
