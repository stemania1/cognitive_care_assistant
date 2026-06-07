'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import type { MessengerContact, MessengerMessage, MessengerMessageType } from '@/lib/messenger-table';
import {
  getMessageTypeLabel,
  MESSENGER_CONTACTS_SETUP_MESSAGE,
  MESSENGER_MESSAGE_TYPES,
  MESSENGER_TABLE_SETUP_MESSAGE,
} from '@/lib/messenger-table';
import {
  addLocalContact,
  appendLocalMessage,
  loadLocalContacts,
  loadLocalMessagesForContact,
  LOCAL_MESSENGER_NOTICE,
  removeLocalContact,
} from '@/lib/messenger-local';
import {
  formatMessageTime,
  messageBubbleClasses,
  messageTypeBadgeClasses,
} from '@/app/components/messenger/messenger-ui';

export function MessengerScreen() {
  const { user, isLoaded } = useUser();
  const [contacts, setContacts] = useState<MessengerContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessengerMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [messageType, setMessageType] = useState<MessengerMessageType>('casual');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [setupWarning, setSetupWarning] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactUserId, setNewContactUserId] = useState('');
  const [addingContact, setAddingContact] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const displayName =
    user?.fullName?.trim() ||
    user?.firstName?.trim() ||
    user?.emailAddresses[0]?.emailAddress?.split('@')[0] ||
    'User';

  const selectedContact = contacts.find((c) => c.contact_user_id === selectedContactId) ?? null;

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    setLoadingContacts(true);
    try {
      const res = await fetch('/api/messenger/contacts', { cache: 'no-store' });
      const result = await res.json();

      if (res.ok && result.data && !result.offlineFallback) {
        setContacts(result.data);
        setOfflineMode(false);
        setSetupWarning(result.setupMessage || null);
        setError(null);
        return;
      }

      setContacts(loadLocalContacts(user.id));
      setOfflineMode(true);
      setSetupWarning(result.setupMessage || result.warning ? MESSENGER_CONTACTS_SETUP_MESSAGE : null);
      setError(result.error || null);
    } catch {
      setContacts(loadLocalContacts(user.id));
      setOfflineMode(true);
      setError('Could not reach the server. Using offline contacts on this device.');
    } finally {
      setLoadingContacts(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user || !selectedContactId) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(
        `/api/messenger?contactUserId=${encodeURIComponent(selectedContactId)}`,
        { cache: 'no-store' }
      );
      const result = await res.json();

      if (res.ok && result.data && !result.offlineFallback) {
        setMessages(result.data);
        setOfflineMode(false);
        setSetupWarning(result.setupMessage || null);
        setError(null);
        return;
      }

      setMessages(loadLocalMessagesForContact(user.id, selectedContactId));
      setOfflineMode(true);
      setSetupWarning(
        result.setupMessage || (result.warning ? MESSENGER_TABLE_SETUP_MESSAGE : null)
      );
      setError(result.error || null);
    } catch {
      setMessages(loadLocalMessagesForContact(user.id, selectedContactId));
      setOfflineMode(true);
      setError('Could not reach the server. Showing local messages.');
    } finally {
      setLoadingMessages(false);
    }
  }, [user, selectedContactId]);

  useEffect(() => {
    if (!isLoaded || !user) return;
    void fetchContacts();
  }, [isLoaded, user, fetchContacts]);

  useEffect(() => {
    if (!selectedContactId) {
      setMessages([]);
      return;
    }
    void fetchMessages();
    const interval = window.setInterval(() => void fetchMessages(), 4000);
    return () => window.clearInterval(interval);
  }, [selectedContactId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (contacts.length > 0 && !selectedContactId) {
      setSelectedContactId(contacts[0].contact_user_id);
    }
  }, [contacts, selectedContactId]);

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    if (!user || addingContact) return;

    const name = newContactName.trim();
    const contactUserId = newContactUserId.trim();
    if (!name || !contactUserId) return;

    setAddingContact(true);
    setError(null);
    try {
      const res = await fetch('/api/messenger/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactDisplayName: name, contactUserId }),
      });
      const result = await res.json();

      if (res.ok && result.data) {
        setContacts((prev) => {
          const filtered = prev.filter((c) => c.contact_user_id !== result.data.contact_user_id);
          return [...filtered, result.data as MessengerContact].sort((a, b) =>
            a.contact_display_name.localeCompare(b.contact_display_name)
          );
        });
        setSelectedContactId(result.data.contact_user_id);
        setNewContactName('');
        setNewContactUserId('');
        setShowAddContact(false);
        setOfflineMode(false);
        return;
      }

      if (result.offlineFallback || !res.ok) {
        const local = addLocalContact({
          ownerUserId: user.id,
          contactUserId,
          contactDisplayName: name,
        });
        setContacts(loadLocalContacts(user.id));
        setSelectedContactId(local.contact_user_id);
        setNewContactName('');
        setNewContactUserId('');
        setShowAddContact(false);
        setOfflineMode(true);
        return;
      }

      setError(result.error || 'Could not add contact');
    } catch {
      const local = addLocalContact({
        ownerUserId: user.id,
        contactUserId,
        contactDisplayName: name,
      });
      setContacts(loadLocalContacts(user.id));
      setSelectedContactId(local.contact_user_id);
      setNewContactName('');
      setNewContactUserId('');
      setShowAddContact(false);
      setOfflineMode(true);
    } finally {
      setAddingContact(false);
    }
  }

  async function handleRemoveContact(contactUserId: string) {
    if (!user) return;
    setContacts((prev) => prev.filter((c) => c.contact_user_id !== contactUserId));
    if (selectedContactId === contactUserId) {
      setSelectedContactId(null);
      setMessages([]);
    }

    try {
      await fetch(
        `/api/messenger/contacts?contactUserId=${encodeURIComponent(contactUserId)}`,
        { method: 'DELETE' }
      );
    } catch {
      // local already updated
    }
    removeLocalContact(user.id, contactUserId);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending || !user || !selectedContactId) return;

    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/messenger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          displayName,
          messageType,
          recipientUserId: selectedContactId,
        }),
      });
      const result = await res.json();

      if (res.ok && result.data) {
        setMessages((prev) => [...prev, result.data as MessengerMessage]);
        setOfflineMode(false);
        setDraft('');
        return;
      }

      if (result.offlineFallback || !res.ok) {
        const localMessage = appendLocalMessage({
          userId: user.id,
          displayName,
          content: text,
          messageType,
          recipientUserId: selectedContactId,
        });
        setMessages((prev) => [...prev, localMessage]);
        setOfflineMode(true);
        setDraft('');
        return;
      }

      setError(result.error || 'Could not send message');
    } catch {
      const localMessage = appendLocalMessage({
        userId: user.id,
        displayName,
        content: text,
        messageType,
        recipientUserId: selectedContactId,
      });
      setMessages((prev) => [...prev, localMessage]);
      setOfflineMode(true);
      setDraft('');
    } finally {
      setSending(false);
    }
  }

  async function copyShareCode() {
    if (!user?.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
      setCopiedCode(true);
      window.setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setError('Could not copy your share code. Select and copy it manually.');
    }
  }

  if (!isLoaded) {
    return (
      <div className="cca-dashboard cca-dashboard-saas flex min-h-screen items-center justify-center text-slate-400">
        Loading messenger…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="cca-dashboard cca-dashboard-saas flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-slate-300">Sign in to use Messenger.</p>
        <Link
          href="/signin"
          className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="cca-dashboard cca-dashboard-saas relative min-h-screen text-slate-100">
      <div className="cca-dashboard-bg-base pointer-events-none absolute inset-0 -z-10" aria-hidden />
      <div className="cca-dashboard-ambient pointer-events-none absolute inset-0 -z-10" aria-hidden />

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-6">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm text-sky-300/80 transition-colors hover:text-sky-200"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-slate-50 sm:text-3xl">Messenger</h1>
            <p className="mt-1 text-sm text-slate-400">
              Add caregivers or family members and send everyday chats or urgent alerts.
            </p>
          </div>

          <div className="light-ui-frame w-full max-w-md rounded-xl border border-slate-200/20 bg-white/5 p-4 sm:w-auto">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Your share code</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Others need this to add you as a contact.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg bg-black/20 px-3 py-2 text-xs text-sky-200">
                {user.id}
              </code>
              <button
                type="button"
                onClick={() => void copyShareCode()}
                className="shrink-0 rounded-lg bg-sky-500/20 px-3 py-2 text-xs font-semibold text-sky-200 ring-1 ring-sky-400/30 transition-colors hover:bg-sky-500/30"
              >
                {copiedCode ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        </header>

        {(setupWarning || offlineMode) && (
          <div className="mb-4 space-y-2">
            {setupWarning && (
              <p className="rounded-xl border border-amber-400/30 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
                {setupWarning}
              </p>
            )}
            {offlineMode && (
              <p className="rounded-xl border border-sky-400/30 bg-sky-950/40 px-4 py-3 text-sm text-sky-100">
                {LOCAL_MESSENGER_NOTICE}
              </p>
            )}
          </div>
        )}

        <div className="light-ui-frame flex min-h-[32rem] flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a1220]/80 lg:flex-row">
          {/* Contacts sidebar */}
          <aside className="flex w-full flex-col border-b border-white/10 lg:w-80 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-100">Contacts</h2>
              <button
                type="button"
                onClick={() => setShowAddContact((v) => !v)}
                className="rounded-lg bg-sky-500/20 px-3 py-1.5 text-xs font-semibold text-sky-200 ring-1 ring-sky-400/30 hover:bg-sky-500/30"
              >
                {showAddContact ? 'Cancel' : '+ Add'}
              </button>
            </div>

            {showAddContact && (
              <form onSubmit={handleAddContact} className="space-y-3 border-b border-white/10 p-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Name</label>
                  <input
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="e.g. Mom, Dr. Smith"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Their share code</label>
                  <input
                    value={newContactUserId}
                    onChange={(e) => setNewContactUserId(e.target.value)}
                    placeholder="Paste their Clerk user ID"
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newContactName.trim() || !newContactUserId.trim() || addingContact}
                  className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {addingContact ? 'Adding…' : 'Add contact'}
                </button>
              </form>
            )}

            <div className="flex-1 overflow-y-auto p-2">
              {loadingContacts ? (
                <p className="px-2 py-6 text-center text-sm text-slate-500">Loading contacts…</p>
              ) : contacts.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-slate-500">
                  No contacts yet. Tap <strong>+ Add</strong> and paste someone&apos;s share code.
                </p>
              ) : (
                <ul className="space-y-1">
                  {contacts.map((contact) => {
                    const selected = selectedContactId === contact.contact_user_id;
                    return (
                      <li key={contact.id} className="group flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedContactId(contact.contact_user_id)}
                          className={`flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                            selected
                              ? 'bg-sky-500/20 ring-1 ring-sky-400/30'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/40 to-sky-500/40 text-sm font-bold text-white">
                            {contact.contact_display_name.charAt(0).toUpperCase()}
                          </span>
                          <span className="min-w-0 truncate text-sm font-medium text-slate-100">
                            {contact.contact_display_name}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleRemoveContact(contact.contact_user_id)}
                          className="rounded-md px-2 py-1 text-xs text-slate-500 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                          aria-label={`Remove ${contact.contact_display_name}`}
                        >
                          ✕
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </aside>

          {/* Chat panel */}
          <section className="flex min-h-[24rem] flex-1 flex-col">
            {!selectedContact ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500">
                Select a contact or add someone to start messaging.
              </div>
            ) : (
              <>
                <div className="border-b border-white/10 px-5 py-4">
                  <h2 className="text-lg font-semibold text-slate-50">{selectedContact.contact_display_name}</h2>
                  <p className="text-xs text-slate-500">Private conversation</p>
                </div>

                <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
                  {loadingMessages && messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">Loading messages…</p>
                  ) : messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      No messages yet. Say hello to {selectedContact.contact_display_name}.
                    </p>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.user_id === user.id;
                      const type = msg.message_type ?? 'casual';
                      const typeMeta = MESSENGER_MESSAGE_TYPES.find((t) => t.value === type);
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col gap-0.5 ${isOwn ? 'items-end' : 'items-start'}`}
                        >
                          <div className="flex flex-wrap items-center gap-2 px-1">
                            <span className="text-[11px] font-medium text-slate-500">
                              {isOwn ? 'You' : msg.display_name}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${messageTypeBadgeClasses(type)}`}
                            >
                              <span aria-hidden>{typeMeta?.emoji}</span>
                              {getMessageTypeLabel(type)}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {formatMessageTime(msg.created_at)}
                            </span>
                          </div>
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${messageBubbleClasses(type, isOwn)}`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {error && (
                  <p className="px-5 pb-1 text-xs text-red-400">{error}</p>
                )}

                <form
                  onSubmit={sendMessage}
                  className="border-t border-white/10 p-4"
                >
                  <fieldset className="mb-3">
                    <legend className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      Message type
                    </legend>
                    <div className="grid grid-cols-2 gap-2 sm:max-w-md">
                      {MESSENGER_MESSAGE_TYPES.map((type) => {
                        const selected = messageType === type.value;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setMessageType(type.value)}
                            aria-pressed={selected}
                            className={`rounded-xl border px-2.5 py-2 text-left transition-all ${
                              selected
                                ? type.value === 'urgent'
                                  ? 'border-red-400/50 bg-red-500/15 ring-1 ring-red-400/30'
                                  : 'border-sky-400/50 bg-sky-500/15 ring-1 ring-sky-400/30'
                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
                              <span aria-hidden>{type.emoji}</span>
                              {type.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>

                  <div className="flex items-end gap-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void sendMessage(e);
                        }
                      }}
                      rows={2}
                      placeholder={
                        messageType === 'urgent'
                          ? 'Describe what help is needed…'
                          : 'Write a message…'
                      }
                      className={`min-h-[2.75rem] flex-1 resize-none rounded-xl border bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none ${
                        messageType === 'urgent'
                          ? 'border-red-500/30 focus:border-red-400/50'
                          : 'border-white/10 focus:border-sky-400/50'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim() || sending}
                      className={`inline-flex h-10 shrink-0 items-center justify-center rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-50 ${
                        messageType === 'urgent'
                          ? 'bg-gradient-to-r from-red-600 to-rose-700'
                          : 'bg-gradient-to-r from-sky-500 to-indigo-600'
                      }`}
                    >
                      {sending ? '…' : messageType === 'urgent' ? 'Alert' : 'Send'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
