import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const READ_KEY = "notif:read";
const DISMISSED_KEY = "notif:dismissed";

export type NotificationState = {
  /** false until AsyncStorage has been read once — avoids a flash of "all unread". */
  ready: boolean;
  isRead: (id: string) => boolean;
  isDismissed: (id: string) => boolean;
  markRead: (id: string) => void;
  markAllRead: (ids: readonly string[]) => void;
  dismiss: (id: string) => void;
  /** Drop persisted ids that no longer correspond to a live notification. */
  prune: (validIds: readonly string[]) => void;
};

function persist(key: string, set: Set<string>): void {
  AsyncStorage.setItem(key, JSON.stringify([...set])).catch(() => null);
}

/**
 * Per-device read/dismissed state for the notification center, backed by
 * AsyncStorage. The feed itself is computed from tasks/activities/subscription,
 * so the only thing we persist is which notification ids the user has already
 * seen or swiped away. Ids are stable per entity (`task:<id>`, `activity:<id>`,
 * `premium:expiry:<date>`) so state survives refetches.
 */
export function useNotificationState(): NotificationState {
  const [read, setRead] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [r, d] = await Promise.all([AsyncStorage.getItem(READ_KEY), AsyncStorage.getItem(DISMISSED_KEY)]);
        if (!active) return;
        if (r) setRead(new Set(JSON.parse(r) as string[]));
        if (d) setDismissed(new Set(JSON.parse(d) as string[]));
      } catch {
        // corrupt/missing storage — start clean
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const markRead = useCallback((id: string) => {
    setRead((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      persist(READ_KEY, next);
      return next;
    });
  }, []);

  const markAllRead = useCallback((ids: readonly string[]) => {
    setRead((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of ids) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      if (!changed) return prev;
      persist(READ_KEY, next);
      return next;
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      persist(DISMISSED_KEY, next);
      return next;
    });
  }, []);

  const prune = useCallback((validIds: readonly string[]) => {
    const valid = new Set(validIds);
    const keepValid = (prev: Set<string>): Set<string> => {
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    };
    setRead((prev) => {
      const next = keepValid(prev);
      if (next !== prev) persist(READ_KEY, next);
      return next;
    });
    setDismissed((prev) => {
      const next = keepValid(prev);
      if (next !== prev) persist(DISMISSED_KEY, next);
      return next;
    });
  }, []);

  const isRead = useCallback((id: string) => read.has(id), [read]);
  const isDismissed = useCallback((id: string) => dismissed.has(id), [dismissed]);

  return { ready, isRead, isDismissed, markRead, markAllRead, dismiss, prune };
}
