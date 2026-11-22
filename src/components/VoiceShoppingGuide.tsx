import React, { useEffect, useState } from 'react';
import { Volume2, VolumeX, PlayCircle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const speakHindi = (text: string) => {
  if (!('speechSynthesis' in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'hi-IN';
  utterance.rate = 0.92;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return true;
};

export const VoiceShoppingGuide: React.FC = () => {
  const { siteAssets } = useApp();
  const [enabled, setEnabled] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const offer = siteAssets.offerBannerText?.trim();
  const welcome = 'नमस्ते! AK माला स्टोर में आपका स्वागत है। यहाँ सुंदर हस्तनिर्मित रिबन मालाएँ उपलब्ध हैं। आप अपनी पसंद की माला आराम से देख सकते हैं।';
  const offerMessage = offer ? `आज की दुकान की जानकारी: ${offer}. कूपन और कीमत की जानकारी वेबसाइट पर देखकर ही लागू करें।` : '';
  const announceWelcome = () => speakHindi([welcome, offerMessage].filter(Boolean).join(' '));

  const toggle = () => {
    if (enabled) {
      window.speechSynthesis?.cancel();
      setEnabled(false);
      setExpanded(false);
      return;
    }
    setEnabled(true);
    setExpanded(true);
    announceWelcome();
  };

  return (
    <div className="fixed bottom-24 left-3 sm:left-5 z-[45] flex flex-col items-start gap-2">
      {expanded && enabled && (
        <div className="max-w-[280px] rounded-2xl border border-amber-400/30 bg-[#111827]/95 p-3 text-xs text-amber-100 shadow-xl backdrop-blur-xl">
          <div className="flex items-start justify-between gap-2">
            <div><p className="font-bold text-amber-300">Hindi Voice Guide</p><p className="mt-1 text-white/75">Welcome aur offer ko awaaz mein sunaye. Product details ke liye product par “Suniye” dabaye.</p></div>
            <button aria-label="Close voice guide tip" onClick={() => setExpanded(false)} className="text-white/60 hover:text-white"><X className="w-4 h-4"/></button>
          </div>
          <button onClick={announceWelcome} className="mt-2 inline-flex items-center gap-1 rounded-lg border border-amber-300/30 px-2.5 py-1.5 text-amber-200 hover:bg-amber-300/10"><PlayCircle className="w-3.5 h-3.5"/> Welcome/offer phir suno</button>
        <p className="mt-2 text-[10px] text-white/50">Awaaz sirf button dabane par chalegi. Browser mein Hindi voice available na ho to voice nahi sunai de sakti.</p>
      </div>
      )}
      <button onClick={toggle} aria-label={enabled ? 'Turn Hindi voice guide off' : 'Turn Hindi voice guide on'} className="inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-[#111827]/95 px-4 py-2.5 text-sm font-semibold text-amber-200 shadow-lg backdrop-blur-xl hover:bg-amber-400/10">
        {enabled ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
        {enabled ? 'Voice OFF' : 'Hindi mein suno'}
      </button>
    </div>
  );
};

export const speakProductHindi = (productName: string, description: string, price: number) => {
  const safeDescription = description?.trim() || 'इस माला की पूरी जानकारी वेबसाइट पर उपलब्ध है।';
  return speakHindi(`आप ${productName} देख रहे हैं। ${safeDescription} इसकी कीमत ${price} रुपये है। पसंद आए तो आप इसे कार्ट में जोड़ सकते हैं।`);
};
