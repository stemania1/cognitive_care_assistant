import type { MessengerMessageType } from "@/lib/messenger-table";

export function formatMessageTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function formatMessageDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function messageBubbleClasses(
  messageType: MessengerMessageType,
  isOwn: boolean
): string {
  if (messageType === "urgent") {
    return isOwn
      ? "rounded-br-md border border-red-400/40 bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-[0_0_20px_rgba(239,68,68,0.25)]"
      : "rounded-bl-md border border-red-400/35 bg-red-950/50 text-red-50 shadow-[0_0_16px_rgba(239,68,68,0.15)]";
  }

  return isOwn
    ? "rounded-br-md bg-gradient-to-br from-sky-500 to-indigo-600 text-white"
    : "rounded-bl-md border border-slate-200/80 bg-slate-50 text-slate-800 dark:border-white/10 dark:bg-white/10 dark:text-slate-100";
}

export function messageTypeBadgeClasses(messageType: MessengerMessageType): string {
  if (messageType === "urgent") {
    return "bg-red-500/20 text-red-300 ring-1 ring-red-400/30";
  }
  return "bg-sky-500/15 text-sky-300 ring-1 ring-sky-400/20";
}
