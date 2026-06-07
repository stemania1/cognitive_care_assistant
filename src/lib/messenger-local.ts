import type {
  MessengerContact,
  MessengerMessage,
  MessengerMessageType,
} from "@/lib/messenger-table";
import { normalizeMessageType } from "@/lib/messenger-table";

const MESSAGES_KEY = "cca:messenger:messages:v2";
const CONTACTS_KEY = "cca:messenger:contacts:v1";
const MAX_LOCAL_MESSAGES = 200;

function readMessages(): MessengerMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(MESSAGES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MessengerMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeMessages(messages: MessengerMessage[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages.slice(-MAX_LOCAL_MESSAGES)));
  } catch {
    // ignore quota errors
  }
}

function readContacts(): MessengerContact[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MessengerContact[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeContacts(contacts: MessengerContact[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  } catch {
    // ignore quota errors
  }
}

export function loadLocalContacts(ownerUserId: string): MessengerContact[] {
  return readContacts()
    .filter((c) => c.owner_user_id === ownerUserId)
    .sort((a, b) => a.contact_display_name.localeCompare(b.contact_display_name));
}

export function addLocalContact(input: {
  ownerUserId: string;
  contactUserId: string;
  contactDisplayName: string;
}): MessengerContact {
  const existing = readContacts().find(
    (c) =>
      c.owner_user_id === input.ownerUserId && c.contact_user_id === input.contactUserId
  );
  if (existing) return existing;

  const contact: MessengerContact = {
    id: `local-contact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    owner_user_id: input.ownerUserId,
    contact_user_id: input.contactUserId,
    contact_display_name: input.contactDisplayName,
    created_at: new Date().toISOString(),
  };
  writeContacts([...readContacts(), contact]);
  return contact;
}

export function removeLocalContact(ownerUserId: string, contactUserId: string) {
  writeContacts(
    readContacts().filter(
      (c) => !(c.owner_user_id === ownerUserId && c.contact_user_id === contactUserId)
    )
  );
}

export function loadLocalMessagesForContact(
  userId: string,
  contactUserId: string
): MessengerMessage[] {
  return readMessages()
    .filter(
      (m) =>
        (m.user_id === userId && m.recipient_user_id === contactUserId) ||
        (m.user_id === contactUserId && m.recipient_user_id === userId)
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function appendLocalMessage(input: {
  userId: string;
  displayName: string;
  content: string;
  messageType: MessengerMessageType;
  recipientUserId: string;
}): MessengerMessage {
  const message: MessengerMessage = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    user_id: input.userId,
    display_name: input.displayName,
    content: input.content,
    message_type: normalizeMessageType(input.messageType),
    recipient_user_id: input.recipientUserId,
    created_at: new Date().toISOString(),
  };
  writeMessages([...readMessages(), message]);
  return message;
}

export const LOCAL_MESSENGER_NOTICE =
  "Using offline mode on this device. Contacts and messages are saved locally until Supabase is connected.";

/** @deprecated use loadLocalMessagesForContact */
export function loadLocalMessages(): MessengerMessage[] {
  return readMessages().sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}
