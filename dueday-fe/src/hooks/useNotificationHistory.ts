import {
  getDelivered,
  subscribe,
  syncPresented,
  type DeliveredNotification,
} from "@/lib/notificationHistory";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";

export type NotificationHistory = {
  /** false until the persisted log has been read once — avoids an empty-state flash. */
  ready: boolean;
  delivered: DeliveredNotification[];
};

/**
 * Reads the persistent delivered-notification log and keeps it live: it
 * subscribes to in-app deliveries (foreground pushes recorded by the listener
 * in _layout) and, on focus, pulls anything still in the OS tray via
 * syncPresented() before reloading.
 */
export function useNotificationHistory(): NotificationHistory {
  const [delivered, setDelivered] = useState<DeliveredNotification[]>([]);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const list = await getDelivered();
    setDelivered(list);
    setReady(true);
  }, []);

  useEffect(() => {
    void reload();
    return subscribe(() => {
      void reload();
    });
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      void syncPresented().then(reload);
    }, [reload]),
  );

  return { ready, delivered };
}
