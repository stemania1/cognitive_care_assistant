/**
 * Supabase/PostgREST errors when `messenger_messages` has not been created (or cache is stale).
 */
export function isMessengerTableMissing(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
} | null | undefined): boolean {
  if (!error) return false;
  const msg = `${error.message || ""} ${error.details || ""} ${error.hint || ""}`.toLowerCase();
  const code = String(error.code || "");

  if (code === "42P01") return true;
  if (code === "PGRST205") return true;
  if (msg.includes("schema cache") && msg.includes("messenger_messages")) return true;
  if (msg.includes("could not find the table") && msg.includes("messenger_messages")) return true;
  if (msg.includes("relation") && msg.includes("messenger_messages") && msg.includes("does not exist")) {
    return true;
  }
  return false;
}

export function isMessengerContactsTableMissing(error: {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
} | null | undefined): boolean {
  if (!error) return false;
  const msg = `${error.message || ""} ${error.details || ""} ${error.hint || ""}`.toLowerCase();
  const code = String(error.code || "");

  if (code === "42P01") return true;
  if (code === "PGRST205") return true;
  if (msg.includes("schema cache") && msg.includes("messenger_contacts")) return true;
  if (msg.includes("could not find the table") && msg.includes("messenger_contacts")) return true;
  if (msg.includes("relation") && msg.includes("messenger_contacts") && msg.includes("does not exist")) {
    return true;
  }
  return false;
}

export function isRecipientColumnMissing(error: {
  message?: string;
  details?: string;
} | null | undefined): boolean {
  if (!error) return false;
  const msg = `${error.message || ""} ${error.details || ""}`.toLowerCase();
  return msg.includes("recipient_user_id");
}

export function isMessageTypeColumnMissing(error: {
  message?: string;
  details?: string;
} | null | undefined): boolean {
  if (!error) return false;
  const msg = `${error.message || ""} ${error.details || ""}`.toLowerCase();
  return msg.includes("message_type");
}

export function isSupabaseNetworkError(message: string | null | undefined): boolean {
  if (!message) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("fetch failed") ||
    lower === "failed to fetch" ||
    lower.includes("network") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound")
  );
}

export function formatMessengerError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error ?? "Unknown error");
  if (isSupabaseNetworkError(msg)) {
    return "Cannot reach Supabase. Check your internet connection and that NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local.";
  }
  if (msg.includes("Service role key not configured")) {
    return "Database not configured. Set SUPABASE_SERVICE_ROLE_KEY in .env.local.";
  }
  return msg;
}

export const MESSENGER_TABLE_SETUP_MESSAGE =
  "Messenger tables are missing in Supabase. Run migrations 016–019 in the SQL Editor (see supabase/migrations/), then restart the app.";

export const MESSENGER_CONTACTS_SETUP_MESSAGE =
  "The messenger_contacts table is missing. Run supabase/migrations/019_messenger_contacts_and_recipient.sql in Supabase SQL Editor.";

export type MessengerMessageType = "urgent" | "casual";

export const MESSENGER_MESSAGE_TYPES: {
  value: MessengerMessageType;
  label: string;
  description: string;
  emoji: string;
}[] = [
  {
    value: "casual",
    label: "Everyday Chat",
    description: "General updates and friendly messages",
    emoji: "💬",
  },
  {
    value: "urgent",
    label: "Urgent Alert",
    description: "Immediate help or safety concerns",
    emoji: "🚨",
  },
];

export function getMessageTypeLabel(type: MessengerMessageType | string | null | undefined): string {
  const found = MESSENGER_MESSAGE_TYPES.find((t) => t.value === type);
  return found?.label ?? MESSENGER_MESSAGE_TYPES[0].label;
}

export function normalizeMessageType(value: unknown): MessengerMessageType {
  return value === "urgent" ? "urgent" : "casual";
}

export type MessengerMessage = {
  id: string;
  user_id: string;
  display_name: string;
  content: string;
  message_type: MessengerMessageType;
  recipient_user_id: string | null;
  created_at: string;
};

export type MessengerContact = {
  id: string;
  owner_user_id: string;
  contact_user_id: string;
  contact_display_name: string;
  created_at: string;
};
