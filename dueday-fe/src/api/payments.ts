import { apiFetch } from "./client";

export type PaymentMethod = {
  id: string;
  name: string;
};

export type CreateSubscriptionInput = {
  plan: string;
  status: "active" | "expired" | "cancelled" | "pending";
  started_at?: string;
  expired_at?: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: string | null;
  status: "active" | "expired" | "cancelled" | "pending";
  started_at: string | null;
  expired_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CreatePaymentInput = {
  subscription_id: string;
  amount: number;
  method: string;
  status: "pending" | "paid" | "failed" | "refunded";
};

export type Payment = {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  method: string | null;
  status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
  updated_at: string;
};

export type PaymentFlowInput = {
  planName: string;
  planPrice: string;
  planDuration: string;
  amount: number;
  method: PaymentMethod;
};

export async function createSubscription(
  token: string,
  input: CreateSubscriptionInput,
): Promise<Subscription> {
  return apiFetch<Subscription>("/subscriptions", token, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createPayment(
  token: string,
  input: CreatePaymentInput,
): Promise<Payment> {
  return apiFetch<Payment>("/payments", token, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createPaymentFlow(
  token: string,
  input: PaymentFlowInput,
): Promise<Payment> {
  const startedAt = new Date();
  const expiredAt = new Date(startedAt);
  expiredAt.setMonth(expiredAt.getMonth() + resolvePlanMonths(input.planDuration));

  const subscription = await createSubscription(token, {
    plan: input.planName,
    status: "pending",
    started_at: formatSqlDateTime(startedAt),
    expired_at: formatSqlDateTime(expiredAt),
  });

  return createPayment(token, {
    subscription_id: subscription.id,
    amount: input.amount,
    method: input.method.id,
    status: "pending",
  });
}

export function parseRupiahAmount(value: string): number {
  const numericValue = value.replace(/[^0-9]/g, "");
  return Number(numericValue) || 0;
}

export function resolvePlanMonths(duration: string): number {
  const normalized = duration.toLowerCase();

  if (normalized.includes("12")) return 12;
  if (normalized.includes("3")) return 3;
  return 1;
}

export function formatSqlDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function getBackendOrigin(apiBaseUrl: string): string {
  return apiBaseUrl.replace(/\/api$/, "");
}
