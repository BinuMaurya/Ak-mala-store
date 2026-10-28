import React from 'react';
import { useApp } from '../context/AppContext';
import { Truck, ShieldCheck, RotateCcw, Headphones, Sparkles } from 'lucide-react';

export const TrustBadges: React.FC = () => {
  const { t } = useApp();

  const badges = [
    {
      icon: Truck,
      title: t('trust1Title'),
      desc: t('trust1Desc'),
      highlight: 'Express Cold-Chain'
    },
    {
      icon: ShieldCheck,
      title: t('trust2Title'),
      desc: t('trust2Desc'),
      highlight: '100% Encrypted'
    },
    {
      icon: Sparkles,
      title: t('trust3Title'),
      desc: t('trust3Desc'),
      highlight: 'Farm Fresh'
    },
    {
      icon: Headphones,
      title: t('trust4Title'),
      desc: t('trust4Desc'),
      highlight: 'Dedicated Pujari Support'
    },
  ];

  return (
    <section className="py-10 bg-gradient-to-r from-[#0d121f] via-[#111828] to-[#0d121f] border-y border-[#D4AF37]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((badge, idx) => {
            const Icon = badge.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-black/40 border border-[#D4AF37]/25 hover:border-amber-400/60 transition-all duration-300 flex items-start gap-4 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2a1d06] to-[#120d02] border border-[#D4AF37]/40 flex items-center justify-center text-[#E5C158] shrink-0 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-0.5">
                    {badge.highlight}
                  </span>
                  <h4 className="text-sm font-bold text-gray-100 group-hover:text-amber-200 transition-colors">
                    {badge.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    {badge.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
