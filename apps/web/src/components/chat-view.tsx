"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Message = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string };

export function ChatView({ conversationId, currentUserId, initialMessages, otherName, listingTitle }: { conversationId: string; currentUserId: string; initialMessages: Message[]; otherName: string; listingTitle?: string | null }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void supabase.rpc("mark_conversation_read", { p_conversation_id: conversationId });
    const channel = supabase.channel(`messages:${conversationId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, (payload) => {
      const message = payload.new as Message;
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [conversationId, supabase]);

  async function send(event: FormEvent) {
    event.preventDefault();
    const clean = body.trim();
    if (!clean || pending) return;
    setPending(true); setError(null);
    const { error: sendError } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: currentUserId, body: clean });
    if (sendError) setError(sendError.message); else setBody("");
    setPending(false); router.refresh();
  }

  return <section className="chat-panel"><header className="chat-header"><div><p className="eyebrow">Private conversation</p><h1>{otherName}</h1>{listingTitle && <p>About <strong>{listingTitle}</strong></p>}</div></header><div className="message-list" aria-live="polite">{messages.length ? messages.map((message) => <article className={`message-bubble ${message.sender_id === currentUserId ? "mine" : "theirs"}`} key={message.id}><p>{message.body}</p><time dateTime={message.created_at}>{new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(message.created_at))}</time></article>) : <p className="empty-chat">No messages yet. Keep contact details private and use this thread to arrange a return.</p>}</div><form className="message-composer" onSubmit={send}><textarea value={body} onChange={(event) => setBody(event.target.value)} rows={2} maxLength={4000} placeholder="Write a private message…" aria-label="Message" />{error && <p className="form-error" role="alert">{error}</p>}<button className="primary-button" disabled={pending || !body.trim()} type="submit">{pending ? "Sending…" : "Send message"}</button></form></section>;
}
