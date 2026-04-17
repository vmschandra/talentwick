"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { getRecruiterProfile } from "@/lib/firebase/firestore";
import {
  subscribeToConversations,
  subscribeToMessages,
  getOrCreateConversation,
  sendMessage,
  markConversationRead,
} from "@/lib/firebase/firestore";
import { Conversation, Message, RecruiterProfile } from "@/types";
import { timeAgo } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { MessageSquare, Send, Search, ArrowLeft, AlertCircle } from "lucide-react";

function hasValidCredits(profile: RecruiterProfile | null): boolean {
  if (!profile || profile.jobPostCredits <= 0) return false;
  if (!profile.creditsExpiresAt) return true;
  return (profile.creditsExpiresAt as any).toDate() > new Date();
}

function ChatPage() {
  const { user, userDoc } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [recruiterProfile, setRecruiterProfile] = useState<RecruiterProfile | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load recruiter profile (credits + expiry)
  useEffect(() => {
    if (!user) return;
    getRecruiterProfile(user.uid).then((p) => {
      setRecruiterProfile(p);
      setCompanyName(p?.companyName ?? "");
    });
  }, [user]);

  // Subscribe to all conversations for this recruiter
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToConversations(user.uid, setConversations);
    return unsub;
  }, [user]);

  // Handle ?start=candidateUid&name=CandidateName query param (from browse-candidates)
  useEffect(() => {
    const startId = searchParams.get("start");
    const candidateName = searchParams.get("name") ?? "Candidate";
    if (!startId || !user || !userDoc) return;

    getOrCreateConversation(startId, user.uid, {
      candidateName,
      recruiterName: userDoc.displayName ?? "Recruiter",
      companyName,
    }).then((convId) => {
      setActiveId(convId);
      router.replace("/recruiter/messages");
    }).catch((err) => {
      console.error("[Messages] getOrCreateConversation failed:", err);
      toast.error("Could not open conversation. Please try again.");
    });
  }, [searchParams, user, userDoc, companyName, router]);

  // Subscribe to messages in the active conversation
  useEffect(() => {
    if (!activeId) return;
    setMessages([]);
    const unsub = subscribeToMessages(activeId, setMessages);
    return unsub;
  }, [activeId]);

  // Mark as read when opening a conversation
  useEffect(() => {
    if (!activeId || !user) return;
    markConversationRead(activeId, user.uid).catch(() => {});
  }, [activeId, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !activeId || !user || !userDoc) return;
    const conv = conversations.find((c) => c.id === activeId);
    if (!conv) return;

    setSending(true);
    try {
      await sendMessage(
        activeId,
        user.uid,
        userDoc.displayName ?? "Recruiter",
        input,
        conv.candidateId
      );
      setInput("");
    } finally {
      setSending(false);
    }
  }, [input, activeId, user, userDoc, conversations]);

  const activeConv = conversations.find((c) => c.id === activeId) ?? null;

  const filteredConvs = conversations.filter((c) =>
    c.candidateName.toLowerCase().includes(search.toLowerCase())
  );

  const unreadFor = (c: Conversation) =>
    user ? (c.unreadCount?.[user.uid] ?? 0) : 0;

  const initials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  if (!user || !userDoc) return null;

  return (
    <div className="flex h-[calc(100vh-4rem-2rem)] overflow-hidden rounded-lg border bg-background">

      {/* ── Conversation list ── */}
      <div className={cn(
        "flex w-full flex-col border-r sm:w-80 shrink-0",
        activeId ? "hidden sm:flex" : "flex"
      )}>
        <div className="border-b p-3">
          <h2 className="mb-2 text-base font-semibold">Messages</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search candidates…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground px-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground/40" />
              <p>No conversations yet.</p>
              <p className="text-xs">Go to Browse Candidates and click &quot;Message&quot; to start a chat.</p>
            </div>
          ) : (
            filteredConvs.map((c) => {
              const unread = unreadFor(c);
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50",
                    activeId === c.id && "bg-muted"
                  )}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs">{initials(c.candidateName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className={cn("truncate text-sm", unread > 0 && "font-semibold")}>
                        {c.candidateName}
                      </p>
                      {c.lastMessageAt && (
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {timeAgo(c.lastMessageAt.toDate())}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-xs text-muted-foreground">{c.lastMessage || "No messages yet"}</p>
                      {unread > 0 && (
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Chat panel ── */}
      <div className={cn(
        "flex flex-1 flex-col",
        !activeId ? "hidden sm:flex" : "flex"
      )}>
        {!activeConv ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-sm text-muted-foreground">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
            <p className="font-medium">Select a conversation</p>
            <p className="text-xs max-w-xs">Or go to Browse Candidates and click &quot;Message&quot; on any candidate card.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 border-b px-4 py-3">
              <button
                className="sm:hidden text-muted-foreground hover:text-foreground"
                onClick={() => setActiveId(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">{initials(activeConv.candidateName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold leading-none">{activeConv.candidateName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Candidate</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-center text-xs text-muted-foreground pt-8">
                  Send the first message to start the conversation.
                </p>
              )}
              {messages.map((msg) => {
                const isMe = msg.senderId === user.uid;
                return (
                  <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm"
                    )}>
                      <p>{msg.text}</p>
                      {msg.createdAt && (
                        <p className={cn(
                          "mt-0.5 text-[10px]",
                          isMe ? "text-primary-foreground/70 text-right" : "text-muted-foreground"
                        )}>
                          {timeAgo(msg.createdAt.toDate())}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t px-4 py-3">
              {!hasValidCredits(recruiterProfile) ? (
                <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-800">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>
                    {recruiterProfile && recruiterProfile.jobPostCredits > 0
                      ? "Your credits have expired. "
                      : "You have no credits. "}
                    <a href="/recruiter/pricing" className="font-semibold underline underline-offset-2">
                      Buy credits
                    </a>{" "}
                    to send messages.
                  </span>
                </div>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex gap-2"
                >
                  <Input
                    placeholder="Type a message…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!input.trim() || sending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function RecruiterMessagesPage() {
  return (
    <Suspense>
      <ChatPage />
    </Suspense>
  );
}
