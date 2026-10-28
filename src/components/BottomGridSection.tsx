import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LazyImage } from './common/LazyImage';
import {
  Play,
  Star,
  ShieldCheck,
  Flower2,
  Users,
  CreditCard,
  Truck,
  Headphones,
  ArrowRight,
  Flame,
  CheckCircle2,
  X
} from 'lucide-react';

export const BottomGridSection: React.FC = () => {
  const { setSelectedCategory, setIsReviewOpen, videosList, siteAssets, setIsGalleryOpen } = useApp();
  const [activeVideo, setActiveVideo] = useState(videosList[0] || null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const displayVideos = videosList.length > 0 ? videosList : [];
  const currentVideo = activeVideo || displayVideos[0];

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          
          {/* CARD 1: MALA VIDEOS (Dynamic from CMS) */}
          <div className="rounded-3xl bg-[#0a0f1d] border border-[#D4AF37]/30 p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider">
                  Mala Videos
                </h3>
                <button
                  onClick={() => setIsGalleryOpen(true)}
                  className="text-xs text-[#E5C158] hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              {/* Main Video Viewport */}
              {currentVideo && (
                <div
                  onClick={() => setIsPlaying(true)}
                  className="relative h-44 rounded-2xl overflow-hidden border border-amber-500/30 group cursor-pointer mb-3"
                >
                  <LazyImage
                    src={currentVideo.image}
                    alt={currentVideo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                  <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 px-2 py-0.5 rounded text-amber-200 backdrop-blur-xs truncate max-w-[200px]">
                    {currentVideo.title}
                  </span>
                </div>
              )}

              {/* Video Thumbnails Below */}
              <div className="grid grid-cols-3 gap-2">
                {displayVideos.slice(0, 3).map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      setActiveVideo(v);
                      setIsPlaying(true);
                    }}
                    className={`relative rounded-xl overflow-hidden border cursor-pointer h-16 group ${
                      currentVideo?.id === v.id ? 'border-amber-400 ring-1 ring-amber-400' : 'border-white/10 hover:border-amber-400/50'
                    }`}
                  >
                    <LazyImage src={v.image} alt={v.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CARD 2: CUSTOMER REVIEWS */}
          <div className="rounded-3xl bg-[#0a0f1d] border border-[#D4AF37]/30 p-5 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider">
                  Customer Reviews
                </h3>
                <button
                  onClick={() => setIsReviewOpen(true)}
                  className="text-xs text-[#E5C158] hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              {/* Review 1 */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 mb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 text-[#E5C158] font-bold text-xs flex items-center justify-center">
                    PS
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Priya Sharma</h5>
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-gray-300 leading-snug">
                  "The mala is so beautiful and fresh. Perfect for our Ganpati decoration."
                </p>

                {/* Photo strip */}
                <div className="flex items-center gap-1.5 mt-2">
                  {[
                    'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=100&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=100&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=100&auto=format&fit=crop&q=80',
                  ].map((img, i) => (
                    <div key={i} className="w-8 h-8 rounded-lg overflow-hidden border border-amber-500/30">
                      <LazyImage src={img} alt="review" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Review 2 */}
              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center">
                    RV
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">Rahul Verma</h5>
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-gray-300 leading-snug">
                  "Excellent quality & on time delivery. Very premium packaging."
                </p>
              </div>
            </div>
          </div>

          {/* CARD 3: WHY CHOOSE AK MALA? */}
          <div className="rounded-3xl bg-[#0a0f1d] border border-[#D4AF37]/30 p-5 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="font-cinzel text-sm font-bold text-white uppercase tracking-wider mb-4">
                Why Choose AK Mala?
              </h3>

              <div className="space-y-3">
                {[
                  { title: 'Expertly Handcrafted Malas', icon: Flower2 },
                  { title: 'Premium Quality Flowers', icon: ShieldCheck },
                  { title: 'Trusted by 10,000+ Customers', icon: Users },
                  { title: 'Secure & Easy Payments', icon: CreditCard },
                  { title: 'Fast & Safe Delivery', icon: Truck },
                  { title: 'Dedicated Customer Support', icon: Headphones },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="flex items-center gap-2.5">
                      <div className="p-1 rounded-lg bg-amber-500/10 text-[#E5C158] shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs text-gray-200 font-medium">
                        {item.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* CARD 4: GANPATI FESTIVAL SPECIAL BANNER (Dynamic from CMS) */}
          <div className="rounded-3xl bg-gradient-to-br from-[#2c1a05] via-[#1a0f02] to-[#0d0701] border-2 border-[#D4AF37]/60 p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
            {/* Background Diya glow & Ganesha motif silhouette */}
            <div className="absolute top-2 right-2 text-6xl text-amber-500/15 pointer-events-none select-none font-devanagari">
              ॐ
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 block mb-1">
                Ganpati Festival Special
              </span>
              
              <div className="my-2">
                <span className="text-xs uppercase text-amber-300 font-medium block">FLAT</span>
                <span className="font-cinzel text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFF6D6] via-[#E5C158] to-[#D4AF37]">
                  {siteAssets.offerDiscountPercent}% OFF
                </span>
                <span className="text-xs text-gray-300 block">ON ALL ORDERS</span>
              </div>
            </div>

            {/* Diya Graphic & SHOP NOW Button */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2 text-amber-300">
                <Flame className="w-5 h-5 text-amber-400 animate-diya" />
                <span className="text-xs font-mono font-bold bg-black/60 px-2 py-0.5 rounded border border-amber-500/40">
                  CODE: {siteAssets.offerCode}
                </span>
              </div>

              <button
                onClick={() => {
                  setSelectedCategory('festive');
                  const el = document.getElementById('bestsellers-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>SHOP NOW</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Video Player Modal */}
      {isPlaying && currentVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-[#090e1c] border-2 border-[#D4AF37] rounded-3xl overflow-hidden shadow-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <h3 className="font-bold text-white text-sm truncate max-w-md">{currentVideo.title}</h3>
              <button onClick={() => setIsPlaying(false)} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <img src={currentVideo.image} alt={currentVideo.title} className="w-full h-full object-cover opacity-60" />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black flex items-center justify-center shadow-2xl mb-2 animate-bounce">
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
                <span className="font-cinzel text-base font-bold text-white">{currentVideo.title}</span>
                <span className="text-xs text-amber-300 font-mono mt-1">Duration: {currentVideo.duration} • Live Aarti Simulation</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
