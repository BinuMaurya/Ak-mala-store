import React, { FormEvent, useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Sparkles, X, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface AssistantProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  category: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  products?: AssistantProduct[];
}

const welcomeMessage: ChatMessage = {
  role: 'assistant',
  text: 'नमस्ते! AK माला स्टोर में आपका स्वागत है। 🌼 मैं माला चुनने, रंग और डिज़ाइन की जानकारी, ऑर्डर और डिलीवरी से जुड़े सवालों में आपकी सहायता कर सकती हूँ।'
};

const speakHindi = (text: string) => {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utter.lang = 'hi-IN';
  utter.rate = 0.92;
  utter.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return true;
};

export const StoreAssistant: React.FC = () => {
  const { allProducts, cart, selectedProductForDetail, setSelectedProductForDetail } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isOpen]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

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
          })),
          context: {
            currentProductId: selectedProductForDetail?.id,
            cart: cart.map(({ productId, selectedSize, quantity }) => ({
              productId,
              selectedSize,
              quantity
            }))
          }
        })
      });
      const result = await response.json() as {
        reply?: string;
        products?: AssistantProduct[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(result.error || 'Assistant reply nahi de pa raha. Kripya dobara koshish karein.');
      }
      if (!result.reply) throw new Error('Assistant ka jawab khaali hai. Kripya dobara koshish karein.');
      setMessages((current) => [...current, {
        role: 'assistant',
        text: result.reply!,
        products: result.products
      }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Assistant reply nahi de pa raha. Kripya dobara koshish karein.');
    } finally {
      setIsSending(false);
    }
  };

  const openAssistant = () => {
    const opening = !isOpen;
    setIsOpen(opening);
    if (opening && messages.length === 1) speakHindi(welcomeMessage.text);
    if (!opening) window.speechSynthesis?.cancel();
  };

  return (
    <>
      <button
        type="button"
        onClick={openAssistant}
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
              <p className="text-[11px] text-gray-400">माला, ऑर्डर और डिलीवरी की सहायता</p>
            </div>
            <button
              type="button"
              onClick={() => { setIsOpen(false); window.speechSynthesis?.cancel(); }}
              aria-label="Close chat"
              className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-3 py-4" aria-live="polite">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[95%] rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${message.role === 'user' ? 'ml-auto bg-[#D4AF37] text-gray-950' : 'border border-white/10 bg-white/5 text-gray-100'} ${message.role === 'user' ? 'rounded-br-md' : 'rounded-bl-md'}`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.role === 'assistant' && (
                  <button type="button" onClick={() => speakHindi(message.text)} className="mt-2 inline-flex items-center gap-1 rounded-lg border border-amber-400/20 px-2 py-1 text-[11px] text-amber-200 hover:bg-amber-400/10" aria-label="Jawaab awaaz mein sunein">
                    <Volume2 className="h-3.5 w-3.5" /> सुनिए
                  </button>
                )}
                {message.products && message.products.length > 0 && (
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                    {message.products.map((suggestion) => {
                      const product = allProducts.find((item) => item.id === suggestion.id);
                      return (
                        <button
                          key={suggestion.id}
                          type="button"
                          disabled={!product}
                          onClick={() => {
                            if (!product) return;
                            setSelectedProductForDetail(product);
                            setIsOpen(false);
                            window.speechSynthesis?.cancel();
                          }}
                          className="w-28 shrink-0 overflow-hidden rounded-xl border border-[#D4AF37]/30 bg-black/30 text-left transition-colors hover:border-[#D4AF37] disabled:cursor-default"
                          aria-label={`View ${suggestion.name}`}
                        >
                          <img src={suggestion.image} alt={suggestion.name} loading="lazy" className="h-24 w-full object-cover" />
                          <span className="block truncate px-2 pt-1.5 text-[11px] font-semibold text-white">{suggestion.name}</span>
                          <span className="block px-2 pb-2 text-[11px] text-[#E5C158]">₹{suggestion.price.toLocaleString('en-IN')}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            {isSending && <p className="text-xs text-[#E5C158]" role="status">Assistant जवाब दे रहा है…</p>}
            <div ref={messagesEndRef} />
          </div>

          {error && <p className="px-4 pb-2 text-xs text-red-300" role="alert">{error}</p>}
          <form onSubmit={(event) => void sendMessage(event)} className="flex items-center gap-2 border-t border-white/10 p-3">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={1000}
              placeholder="माला या डिलीवरी के बारे में पूछें…"
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
