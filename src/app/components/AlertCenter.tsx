"use client";

import { createContext, useContext, useCallback, useMemo, useState } from "react";

export type AlertSeverity = "info" | "warning" | "critical";

export interface AppAlert {
  id: string;
  message: string;
  severity: AlertSeverity;
  source?: string;
  timestamp: number;
  acknowledged: boolean;
}

interface AlertCenterContextValue {
  alerts: AppAlert[];
  addAlert: (alert: Omit<AppAlert, "id" | "timestamp" | "acknowledged"> & { id?: string }) => void;
  acknowledgeAlert: (id: string) => void;
  clearAlert: (id: string) => void;
  clearAllAlerts: () => void;
}

const AlertCenterContext = createContext<AlertCenterContextValue | undefined>(undefined);

const generateId = () => crypto.randomUUID();

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [alerts, setAlerts] = useState<AppAlert[]>([]);

  const addAlert = useCallback(
    (alert: Omit<AppAlert, "id" | "timestamp" | "acknowledged"> & { id?: string }) => {
      setAlerts((prev) => {
        const id = alert.id ?? generateId();
        const now = Date.now();

        // Deduplicate by message/severity/source within the last minute
        const hasRecentDuplicate = prev.some(
          (existing) =>
            existing.message === alert.message &&
            existing.severity === alert.severity &&
            existing.source === alert.source &&
            now - existing.timestamp < 60_000
        );

        if (hasRecentDuplicate) {
          return prev.map((existing) =>
            existing.message === alert.message &&
            existing.severity === alert.severity &&
            existing.source === alert.source
              ? { ...existing, timestamp: now, acknowledged: false }
              : existing
          );
        }

        const nextAlert: AppAlert = {
          id,
          message: alert.message,
          severity: alert.severity,
          source: alert.source,
          timestamp: now,
          acknowledged: false,
        };

        return [...prev, nextAlert].slice(-50); // Keep last 50 alerts
      });
    },
    []
  );

  const acknowledgeAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === id ? { ...alert, acknowledged: true } : alert
      )
    );
  }, []);

  const clearAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const value = useMemo(
    () => ({
      alerts,
      addAlert,
      acknowledgeAlert,
      clearAlert,
      clearAllAlerts,
    }),
    [alerts, addAlert, acknowledgeAlert, clearAlert, clearAllAlerts]
  );

  return (
    <AlertCenterContext.Provider value={value}>
      {children}
    </AlertCenterContext.Provider>
  );
}

export function useAlertCenter() {
  const context = useContext(AlertCenterContext);
  if (!context) {
    throw new Error("useAlertCenter must be used within an AlertProvider");
  }
  return context;
}

