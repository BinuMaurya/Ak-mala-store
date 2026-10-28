import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GaneshaViewer } from './ThreeCanvas/GaneshaViewer';
import {
  Sparkles,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Flower2,
  HeartHandshake,
  ArrowRight
} from 'lucide-react';

export const Hero: React.FC = () => {
  const { t, setIsCustomBuilderOpen, setSelectedCategory, siteAssets } = useApp();
  const [selectedMalaColor, setSelectedMalaColor] = useState<'rose' | 'marigold' | 'mogra' | 'orchid' | 'lotus'>('rose');

  return (
    <section className="relative overflow-hidden pt-6 pb-16 lg:py-16">
      {/* Background ambient gold gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.12)_0%,transparent_70%)] pointer-events-none blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: Devotional Headline, Subtext, Badges & CTAs (5 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-6 text-center lg:text-left">
            {/* Top auspicious tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-[#D4AF37]/20 to-amber-700/15 border border-[#D4AF37]/40 w-fit mx-auto lg:mx-0 shadow-sm">
              <span className="text-sm">🪔</span>
              <span className="text-xs font-bold text-[#E5C158] uppercase tracking-wider">
                100% Shuddh & Sacred Malas
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
            </div>

            {/* Main Headline (Dynamic from Site Assets CMS) */}
            <div className="space-y-2">
              <h1 className="font-cinzel text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight tracking-tight">
                {siteAssets.heroHeadline}{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFF6D6] via-[#E5C158] to-[#D4AF37] underline decoration-[#D4AF37]/40 decoration-wavy decoration-1">
                  {siteAssets.heroHeadlineHighlight}
                </span>
              </h1>
              <p className="font-playfair italic text-xs sm:text-sm text-amber-200/90 max-w-lg mx-auto lg:mx-0">
                {siteAssets.heroSubtitle}
              </p>
            </div>

            {/* Feature Badges 2x2 grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-1 text-left">
              {[
                { title: t('heroBadge1'), desc: 'Traditional Karigari', icon: HeartHandshake },
                { title: t('heroBadge2'), desc: 'Dawn Plucked Blooms', icon: Flower2 },
                { title: t('heroBadge3'), desc: 'Zero Wilting Packaging', icon: Truck },
                { title: t('heroBadge4'), desc: 'Sacred Sanctity Guarantee', icon: ShieldCheck },
              ].map((badge, idx) => {
                const Icon = badge.icon;
                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white/[0.03] border border-[#D4AF37]/20 hover:border-amber-400/50 transition-all flex items-start gap-2.5"
                  >
                    <div className="p-1.5 rounded-lg bg-amber-400/10 text-[#E5C158] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-bold text-gray-200 leading-snug">{badge.title}</h4>
                      <p className="text-[10px] text-amber-200/70">{badge.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 justify-center lg:justify-start">
              <button
                onClick={() => {
                  const el = document.getElementById('bestsellers-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B8860B] text-black font-extrabold text-sm tracking-wide shadow-[0_0_25px_rgba(212,175,55,0.4)] hover:shadow-[0_0_35px_rgba(212,175,55,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{t('shopCollection')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsCustomBuilderOpen(true)}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-[#D4AF37]/40 text-[#F3E5AB] font-semibold text-sm hover:border-[#E5C158] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#E5C158]" />
                <span>{t('customizeMala')}</span>
              </button>
            </div>
          </div>

          {/* CENTER COLUMN: 3D Interactive Viewport or Murti Photo (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center">
            
            <div className="w-full relative">
              {/* The 3D Ganesha & Custom Mala Rotation Canvas */}
              <GaneshaViewer
                malaColor={selectedMalaColor}
                onColorChange={(c) => setSelectedMalaColor(c)}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Floating Trust Cards & Quick Preview (3 cols) */}
          <div className="lg:col-span-3 flex flex-col space-y-3">
            {/* Quick Card 1: Free Delivery */}
            <div className="p-3.5 rounded-2xl gold-card gold-card-hover flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#E5C158] shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-100">Pan-India Express</h4>
                <p className="text-[11px] text-amber-200/70">
                  Free Cold-Chain above ₹{siteAssets.freeDeliveryThreshold}
                </p>
              </div>
            </div>

            {/* Quick Card 2: Safe & Pure */}
            <div className="p-3.5 rounded-2xl gold-card gold-card-hover flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-100">100% Pure Flowers</h4>
                <p className="text-[11px] text-gray-400">Chemical-free morning harvests</p>
              </div>
            </div>

            {/* Quick Card 3: Easy Returns */}
            <div className="p-3.5 rounded-2xl gold-card gold-card-hover flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-100">Easy Replacements</h4>
                <p className="text-[11px] text-gray-400">Freshness guaranteed upon arrival</p>
              </div>
            </div>

            {/* Mini Interactive Promo Card: Ganpati Festival Special */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2a1705] via-[#1a0f02] to-[#0d0701] border-2 border-[#D4AF37]/50 shadow-xl relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Festive Special
                </span>
                <span className="font-cinzel text-xs font-extrabold text-[#E5C158]">
                  FLAT {siteAssets.offerDiscountPercent}% OFF
                </span>
              </div>

              <h4 className="text-xs font-bold text-white mb-1">
                Ganpati Sthapana & Temple Har Sets
              </h4>
              <p className="text-[11px] text-gray-300 mb-3">
                Pre-book your deity's sacred garland today with code <span className="font-mono text-amber-300 font-bold">{siteAssets.offerCode}</span>
              </p>

              <button
                onClick={() => {
                  setSelectedCategory('festive');
                  const el = document.getElementById('bestsellers-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black text-xs font-bold tracking-wide hover:opacity-95 transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Shop Festive Malas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
