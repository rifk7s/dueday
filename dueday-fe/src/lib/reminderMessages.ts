import { apiFetch } from "@/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ReminderStyle = "tegas" | "ngancam_halus" | "santai";

export type ResolveMessageInput = {
  entityId: string;
  entityName: string;
  entityDeadline: string | null;
  slotLabel: string;
  style: ReminderStyle | null;
  manualOverride: string | null;
  isSubscribed: boolean;
  token: string | null;
};

const TEMPLATES: Record<ReminderStyle, (name: string) => string> = {
  tegas: (name) => `Kerjakan ${name} sekarang. Jangan ditunda.`,
  ngancam_halus: (name) => `Yakin mau menunda ${name}? Konsekuensinya nempel di kamu.`,
  santai: (name) => `Hai, masih ada ${name} nih. Cek bentar yuk.`,
};

function templateFallback(name: string, style: ReminderStyle | null): string {
  if (style && TEMPLATES[style]) return TEMPLATES[style](name);
  return `Jangan lupa: ${name}`;
}

function cacheKey(entityId: string, slotLabel: string, style: ReminderStyle): string {
  return `gemini:${entityId}:${slotLabel}:${style}`;
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
    // best-effort, ignore quota errors
  }
}

async function callGemini(input: {
  entity_name: string;
  deadline: string | null;
  style: ReminderStyle;
  slot_label: string;
  token: string | null;
}): Promise<string | null> {
  try {
    const res = await apiFetch<{ message: string | null }>("/reminders/generate-message", input.token, {
      method: "POST",
      body: JSON.stringify({
        entity_name: input.entity_name,
        deadline: input.deadline,
        style: input.style,
        slot_label: input.slot_label,
      }),
    });
    return res?.message ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolve the body text for one reminder slot.
 *
 * Precedence:
 * 1. Manual override string from user settings (always wins, no remote call).
 * 2. Cached Gemini result (subscriber + style).
 * 3. Fresh Gemini call (subscriber + style), then cached.
 * 4. Local template for the style (offline-safe).
 * 5. Generic fallback.
 */
export async function resolveReminderMessage(input: ResolveMessageInput): Promise<string> {
  const manual = input.manualOverride?.trim();
  if (manual) return manual;

  if (input.isSubscribed && input.style) {
    const key = cacheKey(input.entityId, input.slotLabel, input.style);
    const cached = await readCache(key);
    if (cached) return cached;

    const generated = await callGemini({
      entity_name: input.entityName,
      deadline: input.entityDeadline,
      style: input.style,
      slot_label: input.slotLabel,
      token: input.token,
    });
    if (generated) {
      await writeCache(key, generated);
      return generated;
    }
  }

  return templateFallback(input.entityName, input.style);
}
