import { useState, useRef, useEffect } from "react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:5000" : "https://portfolio-api-kean.onrender.com");

const MAX_MESSAGE_LENGTH = 500;

function KaidAIChat() {
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (open) {
      setEntered(false);
      const t = requestAnimationFrame(() => {
        requestAnimationFrame(() => setEntered(true));
      });
      return () => cancelAnimationFrame(t);
    }
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const closeWidget = () => {
    setEntered(false);
    setTimeout(() => setOpen(false), 250);
  };

  const sendMessage = async (text) => {
    const message = (text || input).trim();
    if (!message || loading) return;
    if (message.length > MAX_MESSAGE_LENGTH) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Message too long. Please keep under 500 characters." }
      ]);
      return;
    }

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, stream: true })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "AI failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const raw = line.slice(6);
            if (raw === "[DONE]") continue;
            try {
              const data = JSON.parse(raw);
              const chunk = data?.choices?.[0]?.delta?.content;
              if (chunk) {
                fullContent += chunk;
                setMessages((prev) => {
                  const next = [...prev];
                  const last = next[next.length - 1];
                  if (last?.role === "assistant")
                    next[next.length - 1] = { ...last, content: fullContent };
                  return next;
                });
              }
            } catch (_) {}
          }
        }
      }
    } catch (err) {
      const isNetworkError =
        err.message === "Failed to fetch" ||
        err.name === "TypeError";
      const message = isNetworkError
        ? "Couldn't reach the server. Is the backend running? (e.g. cd server && npm run dev)"
        : `Error: ${err.message}. Please try again.`;
      setMessages((prev) => [...prev, { role: "assistant", content: message }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="fixed left-4 right-4 z-40 flex flex-col items-center gap-3 bottom-[max(1rem,env(safe-area-inset-bottom,0px))] sm:left-auto sm:right-6 sm:bottom-6 sm:items-end">
      {open && (
        <div
          className={`grid h-[70vh] max-h-[calc(100vh-5rem)] w-full max-w-[350px] grid-rows-[auto_1fr_auto] overflow-hidden rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-[250ms] ease-out sm:h-[55vh] sm:w-[calc(100vw-2rem)] ${
            entered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          role="dialog"
          aria-modal="false"
          aria-label="Mikasa AI Chat"
        >
          <div className="flex min-h-[56px] shrink-0 items-center justify-between border-b-2 border-black bg-white px-4 py-3">
            <span className="text-lg font-bold tracking-wide text-black">Mikasa</span>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  className="rounded-none border-2 border-black px-2 py-1.5 text-xs font-medium text-black hover:bg-black hover:text-white transition-colors"
                  aria-label="Clear chat"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={closeWidget}
                className="rounded-none p-1.5 border-2 border-black text-black hover:bg-black hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto overflow-x-hidden bg-[#f4f4f5] p-4 space-y-3 overscroll-contain">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`rounded-none px-3 py-2 border-2 border-black ${
                  msg.role === "user"
                    ? "ml-6 bg-black text-white"
                    : "mr-2 bg-white text-black"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {msg.content}
                  {loading && i === messages.length - 1 && msg.role === "assistant" && (
                    <span className="ml-0.5 inline-block h-4 w-2 animate-pulse rounded bg-black" />
                  )}
                </p>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === "user" && (
              <div className="mr-2 flex rounded-none border-2 border-black bg-white px-3 py-2">
                <span className="text-sm text-black">Typing</span>
                <span className="ml-1 animate-pulse text-black">...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="shrink-0 border-t-2 border-black bg-white p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message"
                disabled={loading}
                maxLength={MAX_MESSAGE_LENGTH}
                className="min-w-0 flex-1 rounded-none border-2 border-black bg-white px-3 py-2.5 text-sm text-black placeholder-black/50 focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="shrink-0 rounded-none border-2 border-black bg-black px-3 py-2.5 text-sm font-medium text-white hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => (open ? closeWidget() : setOpen(true))}
        className="flex h-12 w-12 items-center justify-center rounded-none border-2 border-black bg-white text-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        <svg className="h-6 w-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>
    </div>
  );
}

export default KaidAIChat;
