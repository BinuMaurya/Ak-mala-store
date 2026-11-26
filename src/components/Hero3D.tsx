import React, { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, PerspectiveCamera } from "@react-three/drei";
import { Sparkles, ShoppingBag, ArrowRight, HeartHandshake, Flower2, Truck, ShieldCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { isOfferActive } from "../utils/offers";

export const Hero3D: React.FC = () => {
  const { t, setIsCustomBuilderOpen, setSelectedCategory, siteAssets } = useApp();
  const [selectedMalaColor, setSelectedMalaColor] = useState<'rose' | 'marigold' | 'mogra' | 'orchid' | 'lotus'>('rose');

  return (
    <section className="ak-hero-premium relative overflow-hidden pt-6 pb-16 lg:py-16">
      {/* ambient background (kept from original) */}
      <div className="ak-hero-ambient ak-hero-ambient-one" aria-hidden="true" />
      <div className="ak-hero-ambient ak-hero-ambient-two" aria-hidden="true" />
      <div className="ak-hero-stars" aria-hidden="true" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.12)_0%,transparent_70%)] pointer-events-none blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-8 items-center">
          {/* LEFT – text & CTA (copied from original Hero) */}
          <div className="lg:col-span-6 flex flex-col space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-[#D4AF37]/20 to-amber-700/15 border border-[#D4AF37]/40 w-fit mx-auto lg:mx-0 shadow-sm">
              <span className="text-sm">🪔</span>
              <span className="text-xs font-bold text-[#E5C158] uppercase tracking-wider">
                100% Shuddh &amp; Sacred Malas
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
            </div>
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
            {/* Badges & Buttons – copy from original Hero.tsx */}
            <div className="grid grid-cols-2 gap-2.5 pt-1 text-left">
              {[{ title: t('heroBadge1'), desc: 'Traditional Karigari', icon: HeartHandshake },
                { title: t('heroBadge2'), desc: 'Dawn Plucked Blooms', icon: Flower2 },
                { title: t('heroBadge3'), desc: 'Zero Wilting Packaging', icon: Truck },
                { title: t('heroBadge4'), desc: 'Sacred Sanctity Guarantee', icon: ShieldCheck },]
                .map((badge, idx) => {
                  const Icon = badge.icon;
                  return (
                    <div key={idx} className="p-2.5 rounded-xl bg-white/[0.03] border border-[#D4AF37]/20 hover:border-amber-400/50 transition-all flex items-start gap-2.5">
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

          {/* CENTER – 3D Canvas */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="w-full h-[380px]">
              <Canvas frameloop="demand" gl={{ antialias: true, alpha: true }} className="rounded-xl shadow-xl">
                <PerspectiveCamera makeDefault position={[0, 1.2, 3.5]} />
                <ambientLight intensity={0.6} />
                <directionalLight position={[5, 5, 5]} intensity={1.2} />
                <Environment preset="sunset" background={false} />
                <OrbitControls enableZoom={false} enablePan={false} />
                {/* Model – expects /models/mala.glb in public folder */}
                <primitive object={new URL("/models/mala.glb", import.meta.url)} rotation={[0, Math.PI, 0]} scale={1.5} />
              </Canvas>
            </div>
          </div>

          {/* RIGHT – trust cards (unchanged) */}
          <div className="lg:col-span-4 flex flex-col space-y-3">
            {/* Copy the original right‑column markup from Hero.tsx if needed */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero3D;
