import { batchGenerateMessages, type GenerateMessageItem } from "@/api/reminders";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ReminderStyle = "tegas" | "ngancam_halus" | "santai";

const TEMPLATES: Record<ReminderStyle, (name: string) => string> = {
  tegas: (name) => `Kerjakan ${name} sekarang. Jangan ditunda.`,
  ngancam_halus: (name) => `Yakin mau menunda ${name}? Konsekuensinya nempel di kamu.`,
  santai: (name) => `Hai, masih ada ${name} nih. Cek bentar yuk.`,
};

export function templateFallback(name: string, style: ReminderStyle | null): string {
  if (style && TEMPLATES[style]) return TEMPLATES[style](name);
  return `Jangan lupa: ${name}`;
}

/**
 * Two slots that only differ by a `-pulse-2` suffix share their generated
 * message — the +30min pulse for high-near tasks uses the same body as its
 * primary, halving Gemini calls for that bucket.
 */
function dedupeSlotLabel(slotLabel: string): string {
  return slotLabel.replace(/-pulse-2$/u, "");
}

function buildCacheKey(entityId: string, slotLabel: string, style: ReminderStyle): string {
  return `gemini:${entityId}:${dedupeSlotLabel(slotLabel)}:${style}`;
}

async function readCache(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function writeCache(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // best-effort; quota exceeded is non-fatal.
  }
}

export type SlotInput = {
  entityId: string;
  entityName: string;
  entityDeadline: string | null;
  slotLabel: string;
  style: ReminderStyle | null;
  manualOverride: string | null;
  isSubscribed: boolean;
};

function slotKeyOf(slot: SlotInput): string {
  return `${slot.entityId}:${slot.slotLabel}`;
}

function batchKeyOf(slot: SlotInput & { style: ReminderStyle }): string {
  return `${slot.entityId}:${dedupeSlotLabel(slot.slotLabel)}:${slot.style}`;
}

type GeminiCandidate = {
  slotKey: string;
  cacheKey: string;
  slot: SlotInput & { style: ReminderStyle };
};

/**
 * Pass 1: anything resolvable without I/O (manual overrides, non-subscriber
 * fallbacks) lands directly in `out`. The remainder is queued for cache lookup.
 */
function partitionSlots(slots: SlotInput[], out: Record<string, string>): GeminiCandidate[] {
  const candidates: GeminiCandidate[] = [];
  for (const slot of slots) {
    const slotKey = slotKeyOf(slot);
    const manual = slot.manualOverride?.trim();
    if (manual) {
      out[slotKey] = manual;
      continue;
    }
    if (!slot.isSubscribed || !slot.style) {
      out[slotKey] = templateFallback(slot.entityName, slot.style);
      continue;
    }
    candidates.push({
      slotKey,
      cacheKey: buildCacheKey(slot.entityId, slot.slotLabel, slot.style),
      slot: slot as SlotInput & { style: ReminderStyle },
    });
  }
  return candidates;
}

async function resolveFromCache(candidates: GeminiCandidate[], out: Record<string, string>): Promise<void> {
  await Promise.all(
    candidates.map(async ({ slotKey, cacheKey }) => {
      const cached = await readCache(cacheKey);
      if (cached) out[slotKey] = cached;
    }),
  );
}

type BatchPlan = {
  items: GenerateMessageItem[];
  cacheByBatchKey: Map<string, string>;
  slotKeysByBatchKey: Map<string, string[]>;
  slotByBatchKey: Map<string, SlotInput & { style: ReminderStyle }>;
};

function planBatch(candidates: GeminiCandidate[], out: Record<string, string>): BatchPlan {
  const items: GenerateMessageItem[] = [];
  const cacheByBatchKey = new Map<string, string>();
  const slotKeysByBatchKey = new Map<string, string[]>();
  const slotByBatchKey = new Map<string, SlotInput & { style: ReminderStyle }>();

  for (const { slotKey, cacheKey, slot } of candidates) {
    if (out[slotKey] !== undefined) continue;
    const batchKey = batchKeyOf(slot);
    const existing = slotKeysByBatchKey.get(batchKey);
    if (existing) {
      existing.push(slotKey);
      continue;
    }
    slotKeysByBatchKey.set(batchKey, [slotKey]);
    cacheByBatchKey.set(batchKey, cacheKey);
    slotByBatchKey.set(batchKey, slot);
    items.push({
      key: batchKey,
      entity_name: slot.entityName,
      deadline: slot.entityDeadline,
      style: slot.style,
      slot_label: dedupeSlotLabel(slot.slotLabel),
    });
  }

  return { items, cacheByBatchKey, slotKeysByBatchKey, slotByBatchKey };
}

async function runBatch(plan: BatchPlan, out: Record<string, string>, token: string | null): Promise<void> {
  if (plan.items.length === 0) return;

  let generated: Record<string, string> = {};
  try {
    const res = await batchGenerateMessages(plan.items, token);
    generated = res.messages ?? {};
  } catch {
    generated = {};
  }

  await Promise.all(
    plan.items.map(async ({ key: batchKey }) => {
      const slot = plan.slotByBatchKey.get(batchKey);
      if (!slot) return;
      const message = generated[batchKey];
      const finalText = message ?? templateFallback(slot.entityName, slot.style);
      const slotKeys = plan.slotKeysByBatchKey.get(batchKey) ?? [];
      for (const sk of slotKeys) {
        out[sk] = finalText;
      }
      if (message) {
        const cacheKey = plan.cacheByBatchKey.get(batchKey);
        if (cacheKey) await writeCache(cacheKey, message);
      }
    }),
  );
}

/**
 * Resolve message bodies for many slots in one go.
 *
 * Per slot:
 *  1. Manual override wins (no network).
 *  2. AsyncStorage cache (dedup pulse-2 -> primary key).
 *  3. Batch Gemini call for everything still unresolved.
 *  4. Local template fallback for whatever the server couldn't generate.
 *
 * Returns a map keyed by `${entityId}:${slotLabel}` matching the input order.
 */
export async function resolveReminderMessages(
  slots: SlotInput[],
  token: string | null,
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};

  const candidates = partitionSlots(slots, out);
  await resolveFromCache(candidates, out);
  const plan = planBatch(candidates, out);
  await runBatch(plan, out, token);

  for (const slot of slots) {
    out[slotKeyOf(slot)] ??= templateFallback(slot.entityName, slot.style);
  }

  return out;
}
