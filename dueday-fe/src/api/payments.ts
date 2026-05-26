import { apiFetch } from "./client";

export type PaymentMethod = {
  id: string;
  name: string;
};

export type PlanValue = "satu_bulan" | "tiga_bulan" | "satu_tahun";

export type PremiumMode = "upgrade" | "extend" | "view";

export type CreateSubscriptionInput = {
  plan: PlanValue;
  status: "active" | "expired" | "cancelled" | "pending";
  started_at?: string;
  expired_at?: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan: PlanValue | null;
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
  status: "pending" | "paid" | "failed";
  plan?: PlanValue;
};

export type Payment = {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  method: string | null;
  status: "pending" | "paid" | "failed";
  plan: PlanValue | null;
  created_at: string;
  updated_at: string;
};

export type PendingPaymentTransferParams = {
  paymentId: string;
  paymentStatus: Payment["status"];
  methodId: string;
  plan: PlanValue;
  planName: string;
  planPrice: string;
  planAmount: string;
  planDuration: string;
};

export type PaymentFlowInput = {
  plan: PlanValue;
  planName: string;
  planPrice: string;
  planDuration: string;
  amount: number;
  method: PaymentMethod;
};

export type SubscriptionFlowInput = PaymentFlowInput & {
  subscriptionId: string;
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
  expiredAt.setMonth(expiredAt.getMonth() + planMonths(input.plan));

  const subscription = await createSubscription(token, {
    plan: input.plan,
    status: "pending",
    started_at: formatSqlDateTime(startedAt),
    expired_at: formatSqlDateTime(expiredAt),
  });

  return createPayment(token, {
    subscription_id: subscription.id,
    amount: input.amount,
    method: input.method.id,
    status: "pending",
    plan: input.plan,
  });
}

export async function createExtendPaymentFlow(
  token: string,
  input: SubscriptionFlowInput,
): Promise<Payment> {
  return createPayment(token, {
    subscription_id: input.subscriptionId,
    amount: input.amount,
    method: input.method.id,
    status: "pending",
    plan: input.plan,
  });
}

export async function getActiveSubscription(token: string): Promise<Subscription | null> {
  const subscriptions = await apiFetch<Subscription[]>('/subscriptions', token);
  // Pick the active subscription with the latest expiry — deterministic across users
  // who might end up with multiple active rows (race, stale data, manual seed).
  const active = subscriptions
    .filter((subscription) => subscription.status === 'active' && subscription.plan != null)
    .sort(
      (a, b) =>
        new Date(b.expired_at ?? 0).getTime() - new Date(a.expired_at ?? 0).getTime(),
    );
  return active[0] ?? null;
}

export async function getPendingPaymentTransferParams(
  token: string,
): Promise<PendingPaymentTransferParams | null> {
  const payments = await apiFetch<Payment[]>("/payments", token);
  const pendingPayment = payments.find((payment) => payment.status === "pending");

  if (!pendingPayment) {
    return null;
  }

  const subscriptions = await apiFetch<Subscription[]>("/subscriptions", token);
  const subscription = subscriptions.find((item) => item.id === pendingPayment.subscription_id);
  return buildPendingPaymentTransferParams(pendingPayment, subscription ?? null);
}

// Double-tap guard for the extend flow. Returns params for an existing pending payment
// on this subscription so the caller can navigate instead of creating a duplicate row.
export async function findPendingExtendPaymentParams(
  token: string,
  subscription: Subscription,
): Promise<PendingPaymentTransferParams | null> {
  const payments = await apiFetch<Payment[]>("/payments", token);
  const pendingPayment = payments.find(
    (payment) => payment.status === "pending" && payment.subscription_id === subscription.id,
  );

  if (!pendingPayment) {
    return null;
  }

  return buildPendingPaymentTransferParams(pendingPayment, subscription);
}

function buildPendingPaymentTransferParams(
  payment: Payment,
  subscription: Subscription | null,
): PendingPaymentTransferParams {
  const amount = Number(payment.amount) || 0;
  // Prefer the plan persisted on the payment row itself (set at create time, source of truth
  // for the user's actual selection). Fall back to the subscription's plan for legacy rows.
  const plan: PlanValue = payment.plan ?? subscription?.plan ?? "satu_bulan";

  return {
    paymentId: payment.id,
    paymentStatus: payment.status,
    methodId: payment.method || "bca",
    plan,
    planName: planLabel(plan),
    planPrice: formatCurrency(amount),
    planAmount: String(amount),
    planDuration: planDurationFor(plan),
  };
}

export function planLabel(plan: PlanValue): string {
  switch (plan) {
    case "satu_bulan": return "Paket 1 Bulan";
    case "tiga_bulan": return "Paket 3 Bulan";
    case "satu_tahun": return "Paket 1 Tahun";
  }
}

export function planMonths(plan: PlanValue): number {
  switch (plan) {
    case "satu_bulan": return 1;
    case "tiga_bulan": return 3;
    case "satu_tahun": return 12;
  }
}

export function planDurationFor(plan: PlanValue): string {
  switch (plan) {
    case "satu_bulan": return "1 bulan";
    case "tiga_bulan": return "3 bulan";
    case "satu_tahun": return "12 bulan";
  }
}

export function parseRupiahAmount(value: string): number {
  const numericValue = value.replace(/[^0-9]/g, "");
  return Number(numericValue) || 0;
}

export function formatCurrency(amount: number): string {
  return `Rp${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
}


const MONTH_LABELS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];

export function formatDateLabel(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${MONTH_LABELS_ID[date.getMonth()]} ${date.getFullYear()}`;
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
