import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

const welcomeMessage: ChatMessage = {
  role: 'assistant',
  text: 'Namaste! I can help you find the right mala and answer questions about our store, delivery, and orders.'
};

export const StoreAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isOpen]);

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;

    const nextMessages = [...messages, { role: 'user' as const, text }];
    setMessages(nextMessages);
    setDraft('');
    setError('');
    setIsSending(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages.slice(-10).map(({ role, text: messageText }) => ({
            role,
            text: messageText
          }))
        })
      });
      const result = await response.json() as { reply?: string; error?: string };
      if (!response.ok) {
        throw new Error(result.error || 'The assistant could not respond. Please try again.');
      }
      if (!result.reply) throw new Error('The assistant returned an empty response. Please try again.');
      setMessages((current) => [...current, { role: 'assistant', text: result.reply! }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'The assistant could not respond. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? 'Close store assistant' : 'Chat with store assistant'}
        aria-expanded={isOpen}
        className="fixed bottom-24 left-4 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[#F3E5AB]/70 bg-gradient-to-br from-[#E5C158] to-[#B8860B] text-gray-950 shadow-[0_8px_28px_rgba(212,175,55,0.35)] transition-transform hover:scale-105 lg:bottom-6"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {isOpen && (
        <section
          aria-label="AK MALA store assistant"
          className="fixed bottom-40 left-4 z-40 flex h-[min(32rem,calc(100dvh-12rem))] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-[#D4AF37]/50 bg-[#080d19] shadow-[0_20px_70px_rgba(0,0,0,0.75)] lg:bottom-24"
        >
          <header className="flex items-center gap-3 border-b border-[#D4AF37]/25 bg-[#0b1222] px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4AF37]/15 text-[#E5C158]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-cinzel text-sm font-bold text-white">AK MALA Assistant</h2>
              <p className="text-[11px] text-gray-400">Product, delivery & store help</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={`${index}-${message.role}`}
                className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                  message.role === 'user'
                    ? 'ml-auto rounded-br-md bg-[#D4AF37] text-gray-950'
                    : 'rounded-bl-md border border-white/10 bg-white/5 text-gray-100'
                }`}
              >
                {message.text}
              </div>
            ))}
            {isSending && (
              <p className="text-xs text-[#E5C158]" role="status">Assistant is replying…</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {error && (
            <p className="px-4 pb-2 text-xs text-red-300" role="alert">{error}</p>
          )}
          <form onSubmit={(event) => void sendMessage(event)} className="flex items-center gap-2 border-t border-white/10 p-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={1000}
              placeholder="Ask about malas or delivery…"
              aria-label="Message the store assistant"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-[#D4AF37]/70"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isSending}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37] text-gray-950 transition-colors hover:bg-[#E5C158] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}
    </>
  );
};
