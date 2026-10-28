import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Truck, Phone, Globe, Smartphone, Moon, Sun } from 'lucide-react';
import { Language } from '../types';

export const AnnouncementBar: React.FC = () => {
  const { t, language, setLanguage, setIsTrackerOpen, theme, toggleTheme, siteAssets } = useApp();
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 42, seconds: 18 });

  // Countdown timer for Ganpati Festival Offer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'mr', label: 'मराठी' },
    { code: 'gu', label: 'ગુજરાતી' },
  ];

  return (
    <div className="w-full bg-gradient-to-r from-[#211603] via-[#3a2606] to-[#211603] border-b border-[#D4AF37]/25 text-xs text-amber-100 py-1.5 px-3 sm:px-6 relative z-50">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-1.5 md:gap-4">
        {/* Left Offer with Countdown */}
        <div className="flex items-center gap-2 text-center md:text-left">
          <span className="flex items-center justify-center p-1 rounded-full bg-amber-400/20 text-[#E5C158]">
            <Sparkles className="w-3 h-3" />
          </span>
          <span className="font-semibold text-[#F3E5AB]">
            {siteAssets.offerBannerText || t('festiveOffer')}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] bg-black/40 px-2 py-0.5 rounded border border-amber-500/30 text-amber-300">
            {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
          </span>
        </div>

        {/* Center Free Delivery Highlight */}
        <div className="hidden lg:flex items-center gap-1.5 text-amber-200/90 font-medium">
          <Truck className="w-3.5 h-3.5 text-[#E5C158]" />
          <span>Free Express Cold-Chain Delivery Above ₹{siteAssets.freeDeliveryThreshold}</span>
        </div>

        {/* Right utility links */}
        <div className="flex items-center gap-3 text-[11px] text-amber-200/80">
          <button
            onClick={() => setIsTrackerOpen(true)}
            className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 underline-offset-2 hover:underline"
          >
            {t('trackOrder')}
          </button>
          <span className="opacity-30">|</span>

          <a
            href="tel:+918005556252"
            className="hidden sm:flex items-center gap-1 hover:text-white transition-colors"
          >
            <Phone className="w-3 h-3 text-[#E5C158]" />
            <span>+91 800-555-MALA</span>
          </a>
          <span className="hidden sm:inline opacity-30">|</span>

          {/* Language Selector */}
          <div className="flex items-center gap-1">
            <Globe className="w-3 h-3 text-[#E5C158]" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-black/50 text-amber-200 text-[11px] rounded px-1.5 py-0.5 border border-amber-500/30 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {languages.map((l) => (
                <option key={l.code} value={l.code} className="bg-gray-900 text-white">
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title="Toggle Theme"
            className="p-1 rounded hover:bg-white/10 text-amber-300 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
          </button>
        </div>
      </div>
    </div>
  );
};
