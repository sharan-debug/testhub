import { useState, useEffect, useRef } from "react";
import { Sparkles, Send, User, Bot, X } from "lucide-react";
import { API } from "../lib/api";

function renderContent(text) {
  const parts = [];
  const regex = /```([\s\S]*?)```/g;
  let last = 0, m;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "text", value: text.slice(last, m.index) });
    parts.push({ type: "code", value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });

  return parts.map((p, idx) => {
    if (p.type === "code") {
      return <pre key={idx}><code>{p.value.trim()}</code></pre>;
    }
    const lines = p.value.split("\n");
    return (
      <div key={idx} className="whitespace-pre-wrap leading-relaxed">
        {lines.map((line, li) => {
          const segs = line.split(/(`[^`]+`)/g);
          return (
            <div key={li}>
              {segs.map((s, si) =>
                s.startsWith("`") && s.endsWith("`") ? (
                  <code key={si}>{s.slice(1, -1)}</code>
                ) : (
                  <span key={si}>{s}</span>
                )
              )}
            </div>
          );
        })}
      </div>
    );
  });
}

export default function ChatAgent({ open, onOpenChange }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch(`${API}/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, session_id: sessionId }),
      });
      if (!res.ok) throw new Error("Chat request failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop();
        for (const chunk of chunks) {
          const line = chunk.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const data = JSON.parse(line.slice(5).trim());
            if (data.delta) {
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + data.delta };
                return copy;
              });
            }
            if (data.session_id) setSessionId(data.session_id);
            if (data.error) {
              setMessages((m) => {
                const copy = [...m];
                copy[copy.length - 1] = { role: "assistant", content: `Error: ${data.error}` };
                return copy;
              });
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: "Something went wrong. Please try again." };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[#FAFAFA] border-l border-zinc-200 flex flex-col z-50 shadow-xl">
      {/* Header */}
      <div className="p-5 border-b border-zinc-200 bg-white flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 font-heading font-black text-lg tracking-tight">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Ask the Agent
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-0.5">Claude Sonnet 4.5 · grounded on your team's features</p>
        </div>
        <button
          onClick={() => onOpenChange(false)}
          className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-sm"
          data-testid="chat-close-button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5" data-testid="chat-panel">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-500">Try asking:</p>
            {[
              "What are the mocks for the checkout flow?",
              "Which Redis keys are used by the search feature?",
              "List all POST APIs tagged 'payments'",
            ].map((s, i) => (
              <button
                key={i}
                data-testid={`suggested-question-${i}`}
                onClick={() => setInput(s)}
                className="block w-full text-left text-sm p-3 bg-white border border-zinc-200 rounded-sm hover:border-zinc-400 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 shrink-0 bg-black text-white rounded-sm flex items-center justify-center">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`chat-markdown text-sm max-w-[85%] px-3.5 py-2.5 rounded-sm ${
                m.role === "user"
                  ? "bg-black text-white"
                  : "bg-white border border-zinc-200 text-zinc-900"
              }`}
              data-testid={`chat-msg-${m.role}`}
            >
              {m.content ? renderContent(m.content) : <span className="text-zinc-400">…</span>}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 shrink-0 bg-zinc-200 text-zinc-700 rounded-sm flex items-center justify-center">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-200 bg-white">
        <div className="flex gap-2">
          <input
            data-testid="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask about features, mocks, APIs…"
            disabled={streaming}
            className="flex-1 h-10 px-3 text-sm border border-zinc-200 rounded-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            data-testid="chat-send-button"
            onClick={sendMessage}
            disabled={streaming || !input.trim()}
            className="h-10 px-4 bg-black hover:bg-zinc-800 text-white rounded-sm disabled:opacity-40 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
