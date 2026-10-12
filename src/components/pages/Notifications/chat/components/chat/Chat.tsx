"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { io, type Socket } from "socket.io-client";
import { useSearchParams } from "next/navigation";
import {
  useCreateChatThread,
  useGetChatThread,
  useGetChatThreads,
  useSendChatMessage,
} from "@/hooks/useChat";
import { useVisibilityPolling } from "@/hooks/useVisibilityPolling";
import { formatTime24 } from "@/lib/date-time-format";
import { CHAT_BASE_URL, REALTIME_ENABLED } from "@/lib/constants";
import {
  ExactEventIdDedupe,
  ReconnectEventBuffer,
} from "@/lib/realtime-event-buffer";

export default function ChatUI() {
  const { token, user } = useAuth();
  const createThreadMutation = useCreateChatThread();
  const sendMessageMutation = useSendChatMessage();
const searchParams = useSearchParams();

const orderId = searchParams.get("orderId");
const [creatingThread, setCreatingThread] = useState(false);
  const [message, setMessage] = useState("");
  const [threads, setThreads] = useState<any[]>([]);
  const [activeThread, setActiveThread] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [realtimeHealthy, setRealtimeHealthy] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const activeThreadRef = useRef<any>(null);
  const joinedThreadRef = useRef<string | null>(null);
  const threadsRefetchRef = useRef<() => Promise<unknown>>(async () => undefined);
  const messagesRefetchRef = useRef<() => Promise<unknown>>(async () => undefined);

  const threadsQuery = useGetChatThreads(Boolean(token));
  const messagesQuery = useGetChatThread(activeThread?.id);
  threadsRefetchRef.current = threadsQuery.refetch;
  messagesRefetchRef.current = messagesQuery.refetch;

  useEffect(() => {
    if (threadsQuery.data?.success) {
      const nextThreads = threadsQuery.data.data || [];
      setThreads(nextThreads);
      setActiveThread((current: any) =>
        current || orderId ? current : (nextThreads[0] ?? null),
      );
    }
  }, [orderId, threadsQuery.data]);

  useEffect(() => {
    if (messagesQuery.data?.success) {
      setMessages(messagesQuery.data.data?.messages || []);
    }
  }, [messagesQuery.data]);

  useEffect(() => {
    activeThreadRef.current = activeThread;
  }, [activeThread]);

  const ensureOrderThread = async (orderId: string) => {
  if (!orderId) return;

  setCreatingThread(true);

  // 1️⃣ Check if thread already exists
  const existing = threads.find((t) => t.orderId === orderId);

  if (existing) {
    setActiveThread(existing);
    setCreatingThread(false);
    return;
  }

  // 2️⃣ Create new thread
  const shortId = orderId.slice(-6).toUpperCase(); // nice UX
  const subject = `Order #${shortId}`;

  const res = await createThreadMutation.mutateAsync({
    message: "Hi, I need help regarding this order.",
    orderId,
    subject,
  });

  if (res?.success) {
    const newThread = res.data;

    // add to list (top)
    setThreads((prev) => [newThread, ...prev]);

    setActiveThread(newThread);
  }

  setCreatingThread(false);
};
useEffect(() => {
  if (!orderId || threads.length === 0) return;

  ensureOrderThread(orderId);
}, [orderId, threads]);
  const formatTime = (date: string) => formatTime24({ value: date });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

  useEffect(() => {
    if (!token || !REALTIME_ENABLED) {
      setRealtimeHealthy(false);
      return;
    }

    let active = true;
    type ChatMessage = { id?: string; body?: string };
    type ChatThread = {
      id?: string;
      messages?: ChatMessage[];
      [key: string]: unknown;
    };
    type ChatRealtimePayload = ChatThread & {
      eventId?: string;
      threadId?: string;
      message?: ChatMessage;
      thread?: ChatThread;
    };
    type ChatRealtimeEvent = {
      event:
        | "chat.thread.created"
        | "chat.thread.updated"
        | "chat.message.created"
        | "chat.thread.read";
      payload: ChatRealtimePayload;
    };
    const dedupe = new ExactEventIdDedupe();
    const buffer = new ReconnectEventBuffer<ChatRealtimeEvent>();
    const socket = io(CHAT_BASE_URL, {
      autoConnect: false,
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Number.POSITIVE_INFINITY,
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 30_000,
    });
    socketRef.current = socket;

    const applyEvent = ({ event, payload }: ChatRealtimeEvent) => {
      const thread = payload.thread ?? payload;
      const threadId = payload.threadId ?? thread?.id;
      if (!threadId || !dedupe.accept(threadId, payload.eventId)) return;

      if (event === "chat.message.created") {
        const incomingMessage = payload.message;
        if (threadId === activeThreadRef.current?.id && incomingMessage?.id) {
          setMessages((current) =>
            current.some((item) => item.id === incomingMessage.id)
              ? current
              : [...current, incomingMessage],
          );
        }
        setThreads((current) =>
          current.map((item) =>
            item.id === threadId
              ? {
                  ...item,
                  ...(thread ?? {}),
                  lastMessagePreview: incomingMessage?.body,
                }
              : item,
          ),
        );
        return;
      }

      setThreads((current) => {
        const index = current.findIndex((item) => item.id === threadId);
        if (index < 0) return thread?.id ? [thread, ...current] : current;
        return current.map((item) =>
          item.id === threadId ? { ...item, ...(thread ?? payload) } : item,
        );
      });
      if (threadId === activeThreadRef.current?.id && thread?.messages) {
        setMessages(thread.messages);
      }
    };

    const register = (event: ChatRealtimeEvent["event"]) => {
      socket.on(event, (payload) => buffer.push({ event, payload }, applyEvent));
    };
    register("chat.thread.created");
    register("chat.thread.updated");
    register("chat.message.created");
    register("chat.thread.read");
    socket.on("chat.inbox.summary", () => {
      void threadsRefetchRef.current();
    });
    socket.on("connect", () => {
      setRealtimeHealthy(false);
      buffer.disconnect();
      socket.emit("chat.inbox.subscribe");
      const threadId = activeThreadRef.current?.id;
      if (threadId) socket.emit("chat.thread.join", { threadId });
      void (async () => {
        try {
          const requests: Promise<unknown>[] = [threadsRefetchRef.current()];
          if (threadId) requests.push(messagesRefetchRef.current());
          await Promise.all(requests);
          if (!active || !socket.connected) return;
          buffer.resynced(applyEvent);
          setRealtimeHealthy(true);
        } catch {
          if (active) setRealtimeHealthy(false);
        }
      })();
    });
    socket.on("disconnect", () => {
      buffer.disconnect();
      setRealtimeHealthy(false);
    });
    socket.on("chat.error", () => setRealtimeHealthy(false));
    socket.connect();

    return () => {
      active = false;
      buffer.reset();
      setRealtimeHealthy(false);
      joinedThreadRef.current = null;
      socketRef.current = null;
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!realtimeHealthy || !socket || !activeThread?.id) return;
    const previousThreadId = joinedThreadRef.current;
    if (previousThreadId && previousThreadId !== activeThread.id) {
      socket.emit("chat.thread.leave", { threadId: previousThreadId });
    }
    joinedThreadRef.current = activeThread.id;
    socket.emit("chat.thread.join", { threadId: activeThread.id });
    socket.emit("chat.thread.markRead", { threadId: activeThread.id });
  }, [activeThread?.id, realtimeHealthy]);

  // 🔹 Send Message
  const handleSend = async () => {
    if (!message.trim() || !activeThread) return;

    setSending(true);

    const socket = socketRef.current;
    if (realtimeHealthy && socket?.connected) {
      await socket.timeout(10_000).emitWithAck("chat.message.send", {
        threadId: activeThread.id,
        message,
      });
    } else {
      await sendMessageMutation.mutateAsync({ id: activeThread.id, message });
    }

    setMessage("");

    setSending(false);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  useVisibilityPolling({
    enabled: Boolean(token) && (!REALTIME_ENABLED || !realtimeHealthy),
    intervalMs: 10_000,
    poll: async () => {
      if (threadsQuery.isFetching || messagesQuery.isFetching) return;

      const requests: Promise<unknown>[] = [threadsQuery.refetch()];
      if (activeThread?.id) {
        requests.push(messagesQuery.refetch());
      }
      await Promise.all(requests);
    },
  });

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-[#f7f6f5] text-[13px] text-[#1f1f1f]">
      <aside className="hidden min-h-0 w-[260px] shrink-0 flex-col bg-white px-4 py-5 md:flex">
        <p className="text-[10px] tracking-widest text-gray-400 mb-3">
          USER CONTEXT
        </p>

        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#f4c7b8] text-[12px] font-semibold">
              {user?.profile?.firstName?.[0] || "U"}
            </div>
            <div>
              <p className="font-medium text-[13px]">
                {user?.profile?.firstName}
              </p>
              <p className="text-[11px] text-gray-400">
                Premium Member
              </p>
            </div>
          </div>

          <div className="mt-4 space-y-3 text-[11px]">
            <div>
              <p className="text-gray-400 uppercase text-[9px] tracking-wider">
                Account Since
              </p>
              <p className="text-[12px] mt-[2px]">
                {user?.profile?.createdAt
                  ? formatDate(user?.profile?.createdAt)
                  : "—"}
              </p>
            </div>

            <div>
              <p className="text-gray-400 uppercase text-[9px] tracking-wider">
                Recent Topic
              </p>
              <p className="text-[12px] mt-[2px]">
                {threads[0]?.subject || "Support Chat"}
              </p>
            </div>
          </div>
        </div>

        {/* THREADS */}
        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          <p className="text-[10px] tracking-widest text-gray-400 mb-3">
            CONVERSATIONS
          </p>

          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
            {threads.map((t) => (
              <div
                key={t.id}
                onClick={() => setActiveThread(t)}
                className={`rounded-lg px-3 py-3 cursor-pointer ${
                  activeThread?.id === t.id
                    ? "bg-[#e7e5e4]"
                    : "bg-[#ecebea]"
                }`}
              >
               
                <div className="flex justify-between items-center"><p className="text-[12px] font-medium">
                  {t.subject}
                </p>
                 {t.orderId && (
  <span className="text-[9px] px-2 py-[1px] bg-orange-100 text-orange-600 rounded-full">
    Order
  </span>
)}</div>
                <p className="text-[10px] text-gray-400 mt-1 truncate">
                  {t.lastMessagePreview}
                </p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col rounded-sm border border-[#F0EDED]">
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
         <h2 className="font-medium text-[14px]">
  {activeThread?.orderId
    ? `Order #${activeThread.orderId} • Order Support`
    : activeThread?.subject || "Live Chat"}
</h2>

          <span className="text-[10px] px-3 py-[3px] rounded-full bg-[#e9e7e5] text-gray-500">
            ENCRYPTED
          </span>
        </div>

        {/* CHAT BODY */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
          <div className="bg-[#2f2f2f] text-white rounded-md px-4 py-3 max-w-[720px]">
            <p className="text-[10px] uppercase tracking-wider opacity-60 mb-1">
              Note
            </p>
            <p className="text-[12px] leading-relaxed">
              Please do not share personal or card details in this chat.
            </p>
          </div>
{creatingThread && (
  <div className="flex items-center gap-3 mt-6">
    <div className="w-8 h-8 rounded-full bg-[#ef5a2a]/20 flex items-center justify-center">
      <Loader2 className="animate-spin text-[#ef5a2a]" size={16} />
    </div>
    <p className="text-[12px] text-gray-500">
      Setting up your order conversation...
    </p>
  </div>
)}
          {messages.map((msg) => {
            const isMe = msg.senderType === "CUSTOMER";

            return isMe ? (
              <div key={msg.id} className="mt-6 flex justify-end">
                <div className="max-w-[420px] text-right">
                  <div className="bg-primary text-white px-4 py-3 rounded-2xl rounded-br-md inline-block">
                    <p className="text-[12px] leading-relaxed">
                      {msg.body}
                    </p>
                  </div>

                  <p className="text-[10px] text-gray-400 mt-1 mr-1">
                    You · {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ) : (
              <div key={msg.id} className="mt-6 max-w-[360px]">
                <div className="bg-[#E5E2E1] px-4 py-2 rounded-2xl rounded-bl-md inline-block">
                  <p className="text-[12px]">{msg.body}</p>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 ml-1">
                  Support · {formatTime(msg.createdAt)}
                </p>
              </div>
            );
          })}
        </div>

        {/* INPUT */}
        <div className="border-t border-gray-200 px-4 py-3 bg-[#f7f6f5] ">
          <div className="flex items-center bg-white rounded-full px-4 py-2 border border-gray-200 focus-within:ring-2 focus-within:ring-[#ef5a2a]/40
                focus-within:border-[#ef5a2a]
                transition-all duration-200">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none text-[12px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button
              onClick={handleSend}
              disabled={sending}
              className="ml-2 bg-primary hover:bg-[#e14f20] transition p-2 rounded-full text-white"
            >
              {sending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
