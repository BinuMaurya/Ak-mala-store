import React from 'react';
import { useApp } from '../context/AppContext';
import { Crown, Heart, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setSelectedCategory, setIsCustomBuilderOpen, setIsTrackerOpen } = useApp();

  return (
    <footer className="bg-[#04060d] border-t border-[#D4AF37]/25 text-xs text-gray-400 pt-12 pb-24 lg:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Links Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 pb-10 border-b border-white/10">
          
          {/* Col 1 & 2: Brand Info */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#2a1b05] via-[#4a320a] to-[#1a1103] border border-[#D4AF37]">
                <Crown className="w-5 h-5 text-[#E5C158]" />
              </div>
              <div>
                <span className="font-cinzel text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFF4D0] via-[#E5C158] to-[#D4AF37]">
                  AK MALA
                </span>
                <p className="font-playfair italic text-[10px] text-amber-300/80">
                  PURE DEVOTION. PREMIUM QUALITY.
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              India's premier artisan house for fresh divine floral garlands, puja malas, and temple adornments. Hand-crafted daily with sacred flowers and cold-chain pan-India delivery.
            </p>
          </div>

          {/* Col 3: Quick Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-200 uppercase tracking-wider text-[11px]">
              QUICK LINKS
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-amber-300 transition-colors">
                  Home
                </button>
              </li>
              <li>
                <button onClick={() => setSelectedCategory('all')} className="hover:text-amber-300 transition-colors">
                  All Collections
                </button>
              </li>
              <li>
                <button onClick={() => {
                  const el = document.getElementById('bestsellers-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }} className="hover:text-amber-300 transition-colors">
                  Best Sellers
                </button>
              </li>
              <li>
                <button onClick={() => setIsCustomBuilderOpen(true)} className="hover:text-amber-300 transition-colors">
                  Custom Mala
                </button>
              </li>
              <li>
                <a href="#contact" className="hover:text-amber-300 transition-colors">Contact Us</a>
              </li>
            </ul>
          </div>

          {/* Col 4: Customer Service */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-200 uppercase tracking-wider text-[11px]">
              CUSTOMER SERVICE
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => setIsTrackerOpen(true)} className="hover:text-amber-300 transition-colors">
                  Track Order
                </button>
              </li>
              <li><a href="#returns" className="hover:text-amber-300 transition-colors">Returns & Refunds</a></li>
              <li><a href="#shipping" className="hover:text-amber-300 transition-colors">Shipping Policy</a></li>
              <li><a href="#terms" className="hover:text-amber-300 transition-colors">Terms & Conditions</a></li>
              <li><a href="#privacy" className="hover:text-amber-300 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Col 5: Information */}
          <div className="space-y-2">
            <h4 className="font-bold text-gray-200 uppercase tracking-wider text-[11px]">
              INFORMATION
            </h4>
            <ul className="space-y-1.5 text-xs">
              <li><a href="#about" className="hover:text-amber-300 transition-colors">About Us</a></li>
              <li><a href="#story" className="hover:text-amber-300 transition-colors">Our Story</a></li>
              <li><a href="#care" className="hover:text-amber-300 transition-colors">Care Instructions</a></li>
              <li><a href="#blog" className="hover:text-amber-300 transition-colors">Pooja Muhurat Blog</a></li>
              <li><a href="#faq" className="hover:text-amber-300 transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Col 6: Follow & Payment Methods */}
          <div className="space-y-4">
            <div>
              <h4 className="font-bold text-gray-200 uppercase tracking-wider text-[11px] mb-2">
                FOLLOW US
              </h4>
              <div className="flex items-center gap-2">
                {['f', 'ig', 'yt', 'p'].map((net) => (
                  <span
                    key={net}
                    className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-amber-200 hover:border-amber-400 cursor-pointer"
                  >
                    {net}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-gray-200 uppercase tracking-wider text-[11px] mb-2">
                WE ACCEPT
              </h4>
              <div className="flex flex-wrap items-center gap-1.5">
                {['VISA', 'MC', 'RuPay', 'UPI', 'PhonePe', 'GPay', 'Paytm'].map((p) => (
                  <span
                    key={p}
                    className="px-2 py-0.5 rounded bg-black/60 border border-amber-500/20 text-[10px] font-mono text-gray-300 font-bold"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500 gap-2 text-center sm:text-left">
          <span>© 2026 AK MALA. Pure Devotion. Premium Quality. All Rights Reserved.</span>
          <span className="flex items-center gap-1 text-amber-400/80">
            Handcrafted with <Heart className="w-3 h-3 fill-red-500 text-red-500 inline" /> for Devotees Worldwide
          </span>
        </div>

      </div>
    </footer>
  );
};
