import React from 'react';
import { useApp } from '../context/AppContext';
import { LazyImage } from './common/LazyImage';
import { ArrowRight, Flower, Palette, Ruler, Sparkles } from 'lucide-react';

export const CustomMalaBanner: React.FC = () => {
  const { setIsCustomBuilderOpen, siteAssets } = useApp();

  const steps = [
    { num: '1', title: 'Choose Flowers', icon: Flower },
    { num: '2', title: 'Select Colors', icon: Palette },
    { num: '3', title: 'Pick Size', icon: Ruler },
    { num: '4', title: 'Add Finishing', icon: Sparkles },
  ];

  return (
    <section className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-[#171003] via-[#241704] to-[#120c02] border-2 border-[#D4AF37]/50 p-6 lg:p-8 shadow-2xl overflow-hidden">
          
          {/* Subtle floral background glow */}
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            
            {/* Left Column: Heading & CTA */}
            <div className="lg:col-span-4 text-center lg:text-left space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-[#E5C158] block">
                CREATE YOUR OWN
              </span>
              <h3 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                CUSTOM MALA
              </h3>
              <p className="text-xs text-amber-200/80 leading-relaxed max-w-sm mx-auto lg:mx-0">
                Choose your flowers, color, size & style and we will make it perfect for you.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsCustomBuilderOpen(true)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto lg:mx-0 cursor-pointer"
                >
                  <span>CUSTOMIZE NOW</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Center Column: 4 Circular Step Connectors */}
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap justify-center">
                {steps.map((st, idx) => {
                  const Icon = st.icon;
                  return (
                    <React.Fragment key={st.num}>
                      <div className="flex flex-col items-center text-center group cursor-pointer" onClick={() => setIsCustomBuilderOpen(true)}>
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-[#2f1f05] to-[#120c02] border-2 border-[#D4AF37]/60 flex flex-col items-center justify-center text-[#E5C158] shadow-[0_0_15px_rgba(212,175,55,0.25)] group-hover:scale-110 transition-transform">
                          <Icon className="w-4 h-4 text-amber-300 mb-0.5" />
                          <span className="text-xs font-bold text-white">{st.num}</span>
                        </div>
                        <span className="text-[11px] font-medium text-amber-200 mt-2 max-w-[70px] leading-tight">
                          {st.title}
                        </span>
                      </div>

                      {idx < steps.length - 1 && (
                        <div className="hidden sm:block w-6 sm:w-8 h-[2px] bg-gradient-to-r from-[#D4AF37] to-amber-500/40 -mt-6" />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Mala on Sacred Thali Preview */}
            <div className="lg:col-span-3 flex justify-center">
              <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full p-1.5 bg-gradient-to-tr from-[#D4AF37] via-amber-200 to-[#996515] shadow-2xl">
                <div className="w-full h-full rounded-full overflow-hidden border-2 border-black/40 relative">
                  <LazyImage
                    src={siteAssets.customThaliImage}
                    alt="Custom Mala Arrangement"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/15" />
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};
