"use client";

import {
	createContext,
	useContext,
	type Dispatch,
	type PropsWithChildren,
	type SetStateAction,
} from "react";

export type TimeFrame = "daily" | "weekly" | "monthly";

export type TransactionType = "income" | "expense";

export type DashboardTransaction = {
	id: string;
	description: string;
	amount: number;
	date: string;
	category: string;
	type: TransactionType;
};

export type TransactionPayload = {
	type: TransactionType;
	[key: string]: unknown;
};

export type DashboardOutletContextValue = {
	transactions: DashboardTransaction[];
	addTransaction: (transaction: TransactionPayload) => Promise<boolean>;
	editTransaction: (
		id: string | number,
		transaction: TransactionPayload,
	) => Promise<boolean>;
	deleteTransaction: (
		id: string | number,
		type: TransactionType,
	) => Promise<boolean>;
	refreshTransactions: () => Promise<void>;
	timeFrame: TimeFrame;
	setTimeFrame: Dispatch<SetStateAction<TimeFrame>>;
	lastUpdated: Date;
};

const DashboardOutletContext =
	createContext<DashboardOutletContextValue | null>(null);

export function DashboardOutletProvider({
	value,
	children,
}: PropsWithChildren<{ value: DashboardOutletContextValue }>) {
	return (
		<DashboardOutletContext.Provider value={value}>
			{children}
		</DashboardOutletContext.Provider>
	);
}

export function useDashboardOutletContext() {
	const context = useContext(DashboardOutletContext);

	if (!context) {
		throw new Error(
			"useDashboardOutletContext must be used within a DashboardOutletProvider",
		);
	}

	return context;
}
