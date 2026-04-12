import type { AlertItem } from "./useBiomedicalTelemetry";

export type CollapsedAlertRow = {
  key: string;
  severity: AlertItem["severity"];
  message: string;
  dismissIds: string[];
};

/**
 * Groups repeated thermal excursion lines into one row with instance count.
 */
export function collapseAlertsForDisplay(alerts: AlertItem[]): CollapsedAlertRow[] {
  const thermal: AlertItem[] = [];
  const rest: AlertItem[] = [];
  for (const a of alerts) {
    if (a.message.startsWith("Thermal excursion")) thermal.push(a);
    else rest.push(a);
  }

  const rows: CollapsedAlertRow[] = rest.map((a) => ({
    key: a.id,
    severity: a.severity,
    message: a.message,
    dismissIds: [a.id],
  }));

  if (thermal.length > 0) {
    let maxPeak = 0;
    for (const t of thermal) {
      const m = t.message.match(/([\d.]+)\s*°C/);
      if (m) maxPeak = Math.max(maxPeak, parseFloat(m[1]));
    }
    const peakStr = maxPeak > 0 ? ` · peak ${maxPeak.toFixed(1)} °C` : "";
    const n = thermal.length;
    const countLabel = n === 1 ? "1 instance" : `${n} instances`;
    rows.unshift({
      key: "thermal-grouped",
      severity: "crit",
      message: `Thermal excursion detected (${countLabel})${peakStr}`,
      dismissIds: thermal.map((t) => t.id),
    });
  }

  return rows;
}
