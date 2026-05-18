"use client";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  MessageCircle, X, Send, ChevronRight, Copy, ExternalLink,
  LifeBuoy, Loader2, RotateCcw, CheckCheck,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: Action[];
}

interface Action {
  label: string;
  type: "navigate" | "copy" | "ticket";
  href?: string;
  value?: string;
}

const PAGE_NAMES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/contacts": "Contacts",
  "/leads": "Leads",
  "/customers": "Customers",
  "/quotes": "Quotes",
  "/invoices": "Invoices",
  "/payments": "Payments",
  "/projects": "Projects",
  "/communications": "Communications",
  "/templates": "Templates",
  "/scheduling": "Scheduling",
  "/team": "Team",
  "/settings": "Settings",
  "/help": "Help & Support",
  "/notifications": "Notifications",
  "/subscription": "Subscription",
  "/audit-log": "Audit Log",
  "/change-orders": "Change Orders",
};

const QUICK_PROMPTS = [
  "How do I create an invoice?",
  "Create a quote follow-up message",
  "How do I invite a team member?",
  "Explain the dashboard",
  "Create a payment reminder",
  "How do I add a contact?",
  "Open Help Center",
  "Raise a support ticket",
];

const WELCOME = (pageName?: string): Message => ({
  id: "__welcome__",
  role: "assistant",
  content: `Hi! I'm your **ClearBuild assistant**. I can help you navigate the app, answer questions, and draft messages.\n\n${pageName ? `You're on the **${pageName}** page. ` : ""}What can I help you with?`,
  actions: [],
});

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const pageName = Object.entries(PAGE_NAMES).find(([p]) => pathname?.startsWith(p))?.[1];

  useEffect(() => {
    if (open) {
      if (messages.length === 0) setMessages([WELCOME(pageName)]);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const apiMessages = (msgs: Message[]) =>
    msgs
      .filter(m => m.id !== "__welcome__")
      .map(m => ({ role: m.role, content: m.content }));

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");

    const userMsg: Message = { id: `u_${Date.now()}`, role: "user", content };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages([...messages, userMsg]),
          currentPage: pathname,
        }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        id: `a_${Date.now()}`,
        role: "assistant",
        content: data.message ?? "I couldn't process that. Please try again.",
        actions: Array.isArray(data.actions) ? data.actions : [],
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: `e_${Date.now()}`,
        role: "assistant",
        content: "Something went wrong. Please try again.",
        actions: [],
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: Action) => {
    if (action.type === "navigate" && action.href) {
      router.push(action.href);
      setOpen(false);
    } else if (action.type === "ticket") {
      router.push("/help");
      setOpen(false);
    } else if (action.type === "copy" && action.value) {
      navigator.clipboard.writeText(action.value).then(() => {
        setCopied(action.label);
        setTimeout(() => setCopied(null), 2000);
      });
    }
  };

  const reset = () => setMessages([WELCOME(pageName)]);

  const showChips = messages.length <= 1 && !loading;

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div
          ref={panelRef}
          className="fixed bottom-[144px] right-4 lg:bottom-[88px] lg:right-6 z-[100] w-[calc(100vw-32px)] max-w-[380px] flex flex-col bg-white rounded-2xl shadow-2xl border border-[#e5e7eb] overflow-hidden"
          style={{ height: "clamp(400px, 65vh, 520px)" }}
        >
          {/* Header */}
          <div className="flex-shrink-0 bg-[#123B5D] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#3FA66B] flex items-center justify-center flex-shrink-0">
                <MessageCircle size={15} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-[13px] leading-tight">ClearBuild Assistant</p>
                <p className="text-[#90b8d4] text-[10px] leading-tight">Ask me anything about the app</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={reset} title="New conversation"
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#90b8d4] hover:text-white hover:bg-white/10 transition-colors">
                <RotateCcw size={13} />
              </button>
              <button onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#90b8d4] hover:text-white hover:bg-white/10 transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scroll-smooth">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] ${msg.role === "assistant" ? "space-y-2" : ""}`}>
                  <div className={`px-3 py-2 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#123B5D] text-white rounded-2xl rounded-br-sm"
                      : "bg-[#f3f4f6] text-[#1f2937] rounded-2xl rounded-bl-sm"
                  }`}>
                    <MsgContent content={msg.content} />
                  </div>

                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-1">
                      {msg.actions.map((action, i) => (
                        <button key={i} onClick={() => handleAction(action)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                            action.type === "copy"
                              ? copied === action.label
                                ? "bg-[#3FA66B] text-white border-[#3FA66B]"
                                : "bg-white text-[#3FA66B] border-[#3FA66B] hover:bg-[#f0fdf4]"
                              : action.type === "ticket"
                              ? "bg-white text-[#dc2626] border-[#fca5a5] hover:bg-[#fff5f5]"
                              : "bg-[#3FA66B] text-white border-[#3FA66B] hover:bg-[#359560]"
                          }`}>
                          {action.type === "navigate" && <ExternalLink size={10} />}
                          {action.type === "copy" && (copied === action.label ? <CheckCheck size={10} /> : <Copy size={10} />)}
                          {action.type === "ticket" && <LifeBuoy size={10} />}
                          {copied === action.label ? "Copied!" : action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#f3f4f6] rounded-2xl rounded-bl-sm px-3.5 py-3">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Quick chips */}
            {showChips && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_PROMPTS.map(p => (
                  <button key={p} onClick={() => send(p)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white border border-[#e5e7eb] hover:border-[#3FA66B] hover:text-[#3FA66B] text-[#6b7280] text-[11px] rounded-full transition-colors">
                    <ChevronRight size={10} />
                    {p}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 border-t border-[#f3f4f6] px-3 py-2.5">
            <form onSubmit={e => { e.preventDefault(); send(); }} className="flex gap-2 items-center">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask anything…"
                disabled={loading}
                className="flex-1 text-[13px] bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-3 py-2 outline-none focus:border-[#3FA66B] focus:bg-white transition-colors placeholder:text-[#9ca3af] disabled:opacity-60"
              />
              <button type="submit" disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-[#3FA66B] hover:bg-[#359560] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0">
                {loading
                  ? <Loader2 size={15} className="text-white animate-spin" />
                  : <Send size={15} className="text-white" />
                }
              </button>
            </form>
            <p className="text-[10px] text-[#d1d5db] mt-1.5 text-center">AI assistant · Phase 1</p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className={`fixed bottom-[80px] right-4 lg:bottom-6 lg:right-6 z-[100] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          open
            ? "bg-[#374151] hover:bg-[#4b5563] rotate-0"
            : "bg-[#123B5D] hover:bg-[#1a4f7a] hover:scale-105"
        }`}
      >
        {open
          ? <X size={21} className="text-white" />
          : <MessageCircle size={21} className="text-white" />
        }
      </button>
    </>
  );
}

function MsgContent({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (line.match(/^- /)) {
          return (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="text-[#9ca3af] mt-0.5 flex-shrink-0">•</span>
              <span>{inlineMd(line.slice(2))}</span>
            </div>
          );
        }
        if (line.match(/^\d+\. /)) {
          const dot = line.indexOf(". ");
          const num = line.slice(0, dot);
          const rest = line.slice(dot + 2);
          return (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="font-semibold text-[#9ca3af] flex-shrink-0 w-4">{num}.</span>
              <span>{inlineMd(rest)}</span>
            </div>
          );
        }
        return <p key={i}>{inlineMd(line)}</p>;
      })}
    </div>
  );
}

function inlineMd(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? <strong key={i} className="font-semibold">{p}</strong> : p
      )}
    </>
  );
}
