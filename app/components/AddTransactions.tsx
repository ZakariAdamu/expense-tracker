"use client";

import type {
	Dispatch,
	SyntheticEvent as FormEvent,
	SetStateAction,
} from "react";
import { modalStyles } from "../assets/styles";

type TransactionType = "income" | "expense";
type ModalVariant = "both" | TransactionType;
type ModalColor = keyof typeof modalStyles.colorClasses;

export type NewTransaction = {
	type: TransactionType;
	description: string;
	amount: number | string;
	category: string;
	date: string;
	[key: string]: unknown;
};

export type AddTransactionModalProps = {
	showModal: boolean;
	setShowModal: Dispatch<SetStateAction<boolean>>;
	newTransaction: NewTransaction;
	setNewTransaction: Dispatch<SetStateAction<NewTransaction>>;
	handleAddTransaction: () => void;
	type?: ModalVariant;
	title?: string;
	buttonText?: string;
	categories?: string[];
	color?: ModalColor;
};

export default function AddTransactionModal({
	showModal,
	setShowModal,
	newTransaction,
	setNewTransaction,
	handleAddTransaction,
	type = "both",
	title = "Add New Transaction",
	buttonText = "Add Transaction",
	categories = [
		"Food",
		"Housing",
		"Transport",
		"Shopping",
		"Entertainment",
		"Utilities",
		"Healthcare",
		"Salary",
		"Freelance",
		"Investments",
		"Bonus",
		"Other",
	],
	color = "teal",
}: AddTransactionModalProps) {
	if (!showModal) return null;

	// Get current date in YYYY-MM-DD format for date input constraints
	const today = new Date();
	const currentYear = today.getFullYear();
	const currentDate = today.toISOString().split("T")[0];
	const minDate = `${currentYear}-01-01`;
	const colorClass = modalStyles.colorClasses[color];

	const onSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		handleAddTransaction();
		setShowModal(false);
	};

	return (
		<div className={modalStyles.overlay}>
			<div className={modalStyles.modalContainer}>
				<div className={modalStyles.modalHeader}>
					<h2 className={modalStyles.modalTitle}>{title}</h2>
					<button
						type="button"
						onClick={() => setShowModal(false)}
						className={modalStyles.closeButton}
					>
						x
					</button>
				</div>

				<form className={modalStyles.form} onSubmit={onSubmit}>
					{type === "both" && (
						<div>
							<label className={modalStyles.label}>Type</label>
							<div className={modalStyles.typeButtonContainer}>
								<button
									type="button"
									className={modalStyles.typeButton(
										newTransaction.type === "income",
										modalStyles.colorClasses.teal.typeButtonSelected,
									)}
									onClick={() =>
										setNewTransaction((prev) => ({ ...prev, type: "income" }))
									}
								>
									Income
								</button>
								<button
									type="button"
									className={modalStyles.typeButton(
										newTransaction.type === "expense",
										modalStyles.colorClasses.orange.typeButtonSelected,
									)}
									onClick={() =>
										setNewTransaction((prev) => ({ ...prev, type: "expense" }))
									}
								>
									Expense
								</button>
							</div>
						</div>
					)}

					<div>
						<label className={modalStyles.label}>Description</label>
						<input
							type="text"
							value={newTransaction.description}
							onChange={(event) =>
								setNewTransaction((prev) => ({
									...prev,
									description: event.target.value,
								}))
							}
							placeholder="Enter description"
							required
							className={modalStyles.input(colorClass.ring)}
						/>
					</div>

					<div>
						<label className={modalStyles.label}>Amount</label>
						<input
							type="number"
							value={newTransaction.amount}
							onChange={(event) =>
								setNewTransaction((prev) => ({
									...prev,
									amount: Number(event.target.value),
								}))
							}
							placeholder="0.00"
							min="0"
							step="0.01"
							required
							className={modalStyles.input(colorClass.ring)}
						/>
					</div>

					<div>
						<label className={modalStyles.label}>Category</label>
						<select
							value={newTransaction.category}
							onChange={(event) =>
								setNewTransaction((prev) => ({
									...prev,
									category: event.target.value,
								}))
							}
							required
							className={modalStyles.input(colorClass.ring)}
						>
							<option value="" disabled>
								Select category
							</option>
							{categories.map((categoryName) => (
								<option key={categoryName} value={categoryName}>
									{categoryName}
								</option>
							))}
						</select>
					</div>

					<div>
						<label className={modalStyles.label}>Date</label>
						<input
							type="date"
							value={newTransaction.date}
							onChange={(event) =>
								setNewTransaction((prev) => ({
									...prev,
									date: event.target.value,
								}))
							}
							min={minDate}
							max={currentDate}
							required
							className={modalStyles.input(colorClass.ring)}
						/>
					</div>

					<button
						type="submit"
						className={modalStyles.submitButton(colorClass.button)}
					>
						{buttonText}
					</button>
				</form>
			</div>
		</div>
	);
}
