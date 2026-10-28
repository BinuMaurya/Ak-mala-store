import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CustomMalaConfig } from '../types';
import {
  Sparkles,
  Layers,
  Palette,
  Ruler,
  Gem,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Flame,
  Info
} from 'lucide-react';

export const CustomMalaBuilder: React.FC = () => {
  const { addCustomMalaToCart, t } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [config, setConfig] = useState<CustomMalaConfig>({
    flowerType: 'rose',
    pattern: 'dual',
    secondaryColor: 'white',
    size: '22"',
    deityTarget: 'Lord Ganesha (Ganpati Bappa)',
    finishing: 'zari_tassels',
    addHolyFragrance: true,
    addVelvetBox: true,
    customNotes: 'Please weave with morning dawn plucked roses for Ganesh Chaturthi.',
    totalPrice: 1499
  });

  const flowers = [
    {
      id: 'rose',
      name: 'Dutch Red Rose',
      hindi: 'डच लाल गुलाब',
      price: 1199,
      color: '#dc2626',
      desc: 'Velvety fragrant petals for royal deity darshan'
    },
    {
      id: 'mogra',
      name: 'Madurai Mogra',
      hindi: 'मदुरै मोगरा',
      price: 1399,
      color: '#fef9c3',
      desc: 'Pristine white jasmine buds with sublime divine aroma'
    },
    {
      id: 'marigold',
      name: 'Kesariya Genda',
      hindi: 'केसरिया गेंदा',
      price: 999,
      color: '#f97316',
      desc: 'Auspicious sun-yellow and saffron marigold clusters'
    },
    {
      id: 'orchid',
      name: 'Thai Purple Orchids',
      hindi: 'शाही आर्किड',
      price: 1599,
      color: '#a855f7',
      desc: 'Exotic long-lasting blooms for grand temple altars'
    },
    {
      id: 'lotus',
      name: 'Pink Sacred Lotus',
      hindi: 'गुलाबी कमल',
      price: 1699,
      color: '#f43f5e',
      desc: 'Rare dawn-picked lotus buds sacred to Mahalakshmi & Ganpati'
    },
  ];

  const patterns = [
    { id: 'single', name: 'Monotone Dense Rope', desc: 'Solid continuous floral rope with dense petal layering' },
    { id: 'dual', name: 'Royal Alternating Dual-Tone', desc: 'Interspersed with fragrant mogra or white buds' },
    { id: 'spiral', name: 'Swarna Spiral Weave', desc: 'Spiral helix pattern with gold zari cord interlaced' },
    { id: 'tricolor', name: 'Imperial 3-Tone Festive', desc: 'Red, Orange, and Jasmine sacred tricolor garland' },
  ];

  const sizes: { size: '16"' | '22"' | '28"' | '36"'; name: string; extra: number; recommendedFor: string }[] = [
    { size: '16"', name: 'Home Mandir (16 Inch)', extra: 0, recommendedFor: 'Small Pooja Ghar & Laddu Gopal' },
    { size: '22"', name: 'Ganpati Idol (22 Inch)', extra: 350, recommendedFor: 'Standard 2-3 ft Ganesh & Devi Murti' },
    { size: '28"', name: 'Grand Pandal (28 Inch)', extra: 750, recommendedFor: 'Society Mandals & 4-6 ft Murti' },
    { size: '36"', name: 'Imperial Temple (36 Inch)', extra: 1300, recommendedFor: 'Large Temple Deities & Grand Celebrations' },
  ];

  const deities = [
    'Lord Ganesha (Ganpati Bappa)',
    'Mata Mahalakshmi / Durga',
    'Shree Krishna / Laddu Gopal',
    'Lord Shiva (Shivling Har)',
    'Lord Venkateshwara (Balaji)',
    'Wedding Couple (Vivah Varmala)',
  ];

  const finishings = [
    { id: 'zari_tassels', name: 'Golden Zari Latkan & Tassels', extra: 150, desc: 'Pure Varanasi brocade gold hangings' },
    { id: 'pearls', name: 'Cultured Pearl & Moti Drops', extra: 250, desc: 'Lustrous white pearls along garland spine' },
    { id: 'kundan', name: 'Kundan Medallion Centerpiece', extra: 350, desc: 'Shimmering gold Kundan pendant at center' },
    { id: 'simple', name: 'Traditional Organic Silk Dori', extra: 0, desc: 'Eco-friendly sacred red silk cord' },
  ];

  // Price recalculation
  const calculateTotal = (updated: Partial<CustomMalaConfig>) => {
    const next = { ...config, ...updated };
    const flowerObj = flowers.find((f) => f.id === next.flowerType);
    const sizeObj = sizes.find((s) => s.size === next.size);
    const finishObj = finishings.find((fin) => fin.id === next.finishing);

    let base = flowerObj ? flowerObj.price : 1199;
    let sizeCost = sizeObj ? sizeObj.extra : 0;
    let finishCost = finishObj ? finishObj.extra : 0;
    let addOns = (next.addHolyFragrance ? 99 : 0) + (next.addVelvetBox ? 199 : 0);

    const total = base + sizeCost + finishCost + addOns;
    setConfig({ ...next, totalPrice: total });
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleFinalOrder = () => {
    addCustomMalaToCart(config);
  };

  return (
    <section id="custom-mala-studio" className="py-16 relative bg-[#060913] border-t border-[#D4AF37]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Sacred Studio</span>
          </div>
          <h2 className="font-cinzel text-3xl sm:text-4xl font-extrabold text-white">
            Custom Mala Builder
          </h2>
          <p className="font-playfair italic text-sm text-amber-200/80 mt-1">
            Choose your deity's favourite flowers, pattern, sacred size, and gold finishes. We handcraft it fresh for your auspicious muhurat.
          </p>
        </div>

        {/* Builder Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT 7 COLS: Step-by-Step Configuration Wizard */}
          <div className="lg:col-span-7 bg-[#0a0f1d] border border-[#D4AF37]/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            
            {/* Step Progress Connector Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3 text-xs font-bold text-gray-400">
                <span className={currentStep >= 1 ? 'text-[#E5C158]' : ''}>1. Flowers</span>
                <span className={currentStep >= 2 ? 'text-[#E5C158]' : ''}>2. Pattern</span>
                <span className={currentStep >= 3 ? 'text-[#E5C158]' : ''}>3. Size & Deity</span>
                <span className={currentStep >= 4 ? 'text-[#E5C158]' : ''}>4. Finishing</span>
              </div>
              
              <div className="w-full h-2 rounded-full bg-black/60 border border-amber-500/20 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* STEP 1: CHOOSE BLOOMS */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-[#E5C158] flex items-center justify-center text-xs font-bold">1</div>
                  <h3 className="font-semibold text-lg text-white">Choose Primary Sacred Blooms</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {flowers.map((fl) => {
                    const isSelected = config.flowerType === fl.id;
                    return (
                      <div
                        key={fl.id}
                        onClick={() => calculateTotal({ flowerType: fl.id as any })}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 shadow-md ring-1 ring-amber-400'
                            : 'bg-white/5 border-white/10 hover:border-amber-500/40'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full shrink-0 mt-0.5 border border-white/30"
                          style={{ backgroundColor: fl.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-gray-100">{fl.name}</h4>
                            <span className="text-xs font-semibold text-amber-300">₹{fl.price}</span>
                          </div>
                          <span className="text-[10px] text-amber-400/80 font-devanagari block">{fl.hindi}</span>
                          <p className="text-[10px] text-gray-400 mt-0.5">{fl.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 2: PATTERN & COLOR COMBINATIONS */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-[#E5C158] flex items-center justify-center text-xs font-bold">2</div>
                  <h3 className="font-semibold text-lg text-white">Select Weave Pattern & Harmony</h3>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {patterns.map((pat) => {
                    const isSelected = config.pattern === pat.id;
                    return (
                      <div
                        key={pat.id}
                        onClick={() => calculateTotal({ pattern: pat.id as any })}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400 shadow-md'
                            : 'bg-white/5 border-white/10 hover:border-amber-500/40'
                        }`}
                      >
                        <div>
                          <h4 className="text-sm font-bold text-gray-100">{pat.name}</h4>
                          <p className="text-xs text-gray-400 mt-0.5">{pat.desc}</p>
                        </div>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0 ml-3" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: SIZE & DEITY TARGET */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-[#E5C158] flex items-center justify-center text-xs font-bold">3</div>
                  <h3 className="font-semibold text-lg text-white">Select Garland Size & Target Deity</h3>
                </div>

                {/* Size options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {sizes.map((sz) => {
                    const isSelected = config.size === sz.size;
                    return (
                      <div
                        key={sz.size}
                        onClick={() => calculateTotal({ size: sz.size })}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400'
                            : 'bg-white/5 border-white/10 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black text-white">{sz.size}</span>
                          <span className="text-xs font-semibold text-amber-300">
                            {sz.extra > 0 ? `+₹${sz.extra}` : 'Included'}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-amber-200/90 mt-1">{sz.name}</h5>
                        <p className="text-[10px] text-gray-400 mt-0.5">{sz.recommendedFor}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Target Deity Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                    Auspicious Deity For Blessing:
                  </label>
                  <select
                    value={config.deityTarget}
                    onChange={(e) => calculateTotal({ deityTarget: e.target.value })}
                    className="w-full p-3 rounded-xl bg-black/60 border border-amber-500/40 text-sm text-amber-100 focus:outline-none focus:border-amber-400"
                  >
                    {deities.map((d) => (
                      <option key={d} value={d} className="bg-gray-900 text-white">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* STEP 4: FINISHING TOUCHES & ADD-ONS */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-[#E5C158] flex items-center justify-center text-xs font-bold">4</div>
                  <h3 className="font-semibold text-lg text-white">Sacred Finishing & Luxury Packaging</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {finishings.map((fin) => {
                    const isSelected = config.finishing === fin.id;
                    return (
                      <div
                        key={fin.id}
                        onClick={() => calculateTotal({ finishing: fin.id as any })}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-400 ring-1 ring-amber-400'
                            : 'bg-white/5 border-white/10 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-gray-100">{fin.name}</h4>
                          <span className="text-xs font-semibold text-amber-300">
                            {fin.extra > 0 ? `+₹${fin.extra}` : 'Included'}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{fin.desc}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Sacred Add-Ons Checkboxes */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.addHolyFragrance}
                      onChange={(e) => calculateTotal({ addHolyFragrance: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                    />
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-amber-200">Sacred Gangajal & Natural Rose Water Mist Spray</span>
                      <span className="text-[10px] text-gray-400 block">Sprinkled gently before vacuum sealing (+₹99)</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.addVelvetBox}
                      onChange={(e) => calculateTotal({ addVelvetBox: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 accent-amber-500"
                    />
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-amber-200">Imperial Wooden & Red Velvet Gift Box</span>
                      <span className="text-[10px] text-gray-400 block">Embossed with golden Om & Ganesha emblem (+₹199)</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Bottom Step Navigation Bar */}
            <div className="flex items-center justify-between pt-8 border-t border-white/10 mt-6">
              <button
                onClick={handlePrev}
                disabled={currentStep === 1}
                className="px-4 py-2.5 rounded-xl border border-white/15 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Step</span>
              </button>

              {currentStep < 4 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs tracking-wider uppercase shadow-md flex items-center gap-1.5 cursor-pointer hover:opacity-95"
                >
                  <span>Next Step</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleFinalOrder}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center gap-2 cursor-pointer hover:scale-105 transition-all"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add Custom Mala to Cart</span>
                </button>
              )}
            </div>
          </div>

          {/* RIGHT 5 COLS: Live Visualizer & Price Card */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            
            {/* Visualizer Card */}
            <div className="rounded-3xl bg-[#0e1424] border-2 border-[#D4AF37]/40 p-6 shadow-2xl relative overflow-hidden text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#E5C158] mb-1">
                Live Mala Visualizer Preview
              </div>
              <h4 className="font-cinzel text-lg font-bold text-white mb-4">
                {config.size} Custom Garland For {config.deityTarget.split(' ')[0]}
              </h4>

              {/* Dynamic SVG / Graphical Representation of the Garland */}
              <div className="relative w-48 h-56 mx-auto my-2 flex items-center justify-center">
                {/* Deity Shadow silhouette behind garland */}
                <div className="w-24 h-28 rounded-t-full bg-amber-500/10 border border-amber-500/20 absolute" />

                {/* SVG Loop Garland */}
                <svg className="w-full h-full" viewBox="0 0 200 240">
                  <defs>
                    <linearGradient id="garlandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={config.flowerType === 'rose' ? '#dc2626' : config.flowerType === 'mogra' ? '#fef08a' : config.flowerType === 'marigold' ? '#f97316' : '#a855f7'} />
                      <stop offset="50%" stopColor="#d4af37" />
                      <stop offset="100%" stopColor={config.flowerType === 'rose' ? '#b91c1c' : '#ea580c'} />
                    </linearGradient>
                  </defs>

                  {/* U-Shape Curve Garland Path */}
                  <path
                    d="M 50 40 C 40 120, 60 200, 100 200 C 140 200, 160 120, 150 40"
                    fill="none"
                    stroke="url(#garlandGrad)"
                    strokeWidth="24"
                    strokeLinecap="round"
                    strokeDasharray={config.pattern === 'dual' ? '12 8' : config.pattern === 'spiral' ? '6 6' : 'none'}
                  />

                  {/* Flower Beads nodes along curve */}
                  {[
                    { cx: 50, cy: 50 },
                    { cx: 45, cy: 90 },
                    { cx: 50, cy: 130 },
                    { cx: 70, cy: 175 },
                    { cx: 100, cy: 200 },
                    { cx: 130, cy: 175 },
                    { cx: 150, cy: 130 },
                    { cx: 155, cy: 90 },
                    { cx: 150, cy: 50 },
                  ].map((node, i) => (
                    <circle
                      key={i}
                      cx={node.cx}
                      cy={node.cy}
                      r="10"
                      fill={i % 2 === 0 ? (config.flowerType === 'rose' ? '#e11d48' : '#fbbf24') : '#fef9c3'}
                      stroke="#d4af37"
                      strokeWidth="2"
                    />
                  ))}

                  {/* Center Pendant */}
                  <circle cx="100" cy="205" r="14" fill="#d4af37" stroke="#fff" strokeWidth="1.5" />
                  <circle cx="100" cy="205" r="6" fill="#ef4444" />

                  {/* Tassels */}
                  <line x1="100" y1="219" x2="100" y2="238" stroke="#d4af37" strokeWidth="4" />
                  <line x1="94" y1="218" x2="90" y2="234" stroke="#d4af37" strokeWidth="3" />
                  <line x1="106" y1="218" x2="110" y2="234" stroke="#d4af37" strokeWidth="3" />
                </svg>
              </div>

              {/* Real-time Summary Specs */}
              <div className="bg-black/50 rounded-2xl p-4 border border-white/10 text-left text-xs space-y-2 mt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Flower Selection:</span>
                  <span className="font-bold text-amber-200 capitalize">{config.flowerType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Pattern Weave:</span>
                  <span className="font-bold text-amber-200 capitalize">{config.pattern}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Garland Length:</span>
                  <span className="font-bold text-amber-200">{config.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sacred Finishing:</span>
                  <span className="font-bold text-amber-200 capitalize">{config.finishing.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 pt-2 text-sm">
                  <span className="font-bold text-white">Calculated Price:</span>
                  <span className="font-black text-[#F3E5AB]">₹{config.totalPrice}</span>
                </div>
              </div>

              {/* Instant Action */}
              <button
                onClick={handleFinalOrder}
                className="w-full mt-4 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(212,175,55,0.35)] hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Order Custom Mala (₹{config.totalPrice})</span>
              </button>
            </div>

            {/* Artisan Assurance Note */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 flex items-start gap-3">
              <Info className="w-5 h-5 text-[#E5C158] shrink-0 mt-0.5" />
              <p>
                <strong className="text-white">Master Karigar Promise:</strong> All custom garlands are crafted early morning on the day of dispatch. We take special muhurat care to align with your puja date.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
