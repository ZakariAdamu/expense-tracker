"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/app/services/api";

type RawTransaction = {
  _id?: string | number;
  id?: string | number;
  id_str?: string | number;
  description?: string;
  title?: string;
  note?: string;
  amount?: number | string | null;
  value?: number | string | null;
  date?: string;
  createdAt?: string;
  category?: string;
  type?: string;
  [key: string]: unknown;
};

type ApiArrayBody<T> = {
  data?: T[];
  incomes?: T[];
  expenses?: T[];
};

type ApiResponse<T> = {
  data?: T[] | ApiArrayBody<T>;
};

type DashboardTransaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type?: string | undefined;
};

export type NormalizedTransaction = DashboardTransaction & {
  raw: RawTransaction;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const safeArrayFromResponse = (
  res: { data?: unknown } | null | undefined,
): RawTransaction[] => {
  const body = res?.data;
  if (!body) return [];
  if (Array.isArray(body)) return body as RawTransaction[];
  if (isRecord(body) && Array.isArray(body.data))
    return body.data as RawTransaction[];
  if (isRecord(body) && Array.isArray(body.incomes))
    return body.incomes as RawTransaction[];
  if (isRecord(body) && Array.isArray(body.expenses))
    return body.expenses as RawTransaction[];
  return [];
};

const normalize = (t: RawTransaction): NormalizedTransaction => {
  return {
    id: String(
      t._id ?? t.id ?? t.id_str ?? Math.random().toString(36).slice(2),
    ),
    description: String(t.description ?? t.title ?? t.note ?? ""),
    amount: t.amount != null ? Number(t.amount) : Number(t.value) || 0,
    date: String(t.date ?? t.createdAt ?? new Date().toISOString()),
    category: String(t.category ?? t.type ?? "Other"),
    type: t.type,
    raw: t,
  };
};

export function useTransactions() {
  const queryClient = useQueryClient();

  const query = useQuery<NormalizedTransaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      const [incomeRes, expenseRes] = await Promise.all([
        api.get<ApiResponse<RawTransaction[]>>(`/income`),
        api.get<ApiResponse<RawTransaction[]>>(`/expenses`),
      ]);

      const incomes = safeArrayFromResponse(incomeRes.data).map((i) => ({
        ...i,
        type: "income" as const,
      }));
      const expenses = safeArrayFromResponse(expenseRes.data).map((e) => ({
        ...e,
        type: "expense" as const,
      }));

      const all = [...incomes, ...expenses]
        .map(normalize)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

      return all;
    },
    staleTime: 1000 * 60, // 1 minute
    gcTime: 1000 * 60 * 5,
  });

  const addMutation = useMutation({
    mutationFn: async (transaction: RawTransaction) => {
      const endpoint = transaction.type === "income" ? "income" : "expenses";
      return api.post(`/${endpoint}`, transaction);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const editMutation = useMutation({
    mutationFn: async ({
      id,
      transaction,
    }: {
      id: string | number;
      transaction: RawTransaction;
    }) => {
      const endpoint =
        transaction.type === "income" ? "income/update" : "expense/update";
      return api.put(`/${endpoint}/${id}`, transaction);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({
      id,
      type,
    }: {
      id: string | number;
      type: "income" | "expense";
    }) => {
      const endpoint = type === "income" ? "income/delete" : "expense/delete";
      return api.delete(`/${endpoint}/${id}`);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
  });

  return {
    transactions: query.data ?? [],
    dataUpdatedAt: query.dataUpdatedAt,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
    addTransaction: async (t: RawTransaction) => addMutation.mutateAsync(t),
    editTransaction: async (id: string | number, t: RawTransaction) =>
      editMutation.mutateAsync({ id, transaction: t }),
    deleteTransaction: async (
      id: string | number,
      type: "income" | "expense",
    ) => deleteMutation.mutateAsync({ id, type }),
    // expose raw mutation objects if the caller needs status
    mutations: { addMutation, editMutation, deleteMutation },
  };
}
