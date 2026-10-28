import React from 'react';
import {
  Flower2,
  ShoppingBag,
  CreditCard,
  Truck,
  MapPin,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  Headphones,
  PackageCheck
} from 'lucide-react';

export const EasyShoppingExperience: React.FC = () => {
  const steps = [
    {
      num: 1,
      title: 'Choose Your Mala',
      desc: 'Browse our collection',
      icon: Flower2
    },
    {
      num: 2,
      title: 'Add to Cart',
      desc: 'Add your favorite mala',
      icon: ShoppingBag
    },
    {
      num: 3,
      title: 'Secure Payment',
      desc: 'Multiple payment options',
      icon: CreditCard
    },
    {
      num: 4,
      title: 'Fast Delivery',
      desc: 'We deliver at your doorstep',
      icon: Truck
    },
    {
      num: 5,
      title: 'Track Order',
      desc: 'Track your order easily',
      icon: MapPin
    },
    {
      num: 6,
      title: 'Enjoy & Celebrate',
      desc: 'Make your moments more divine',
      icon: Sparkles
    },
  ];

  const subTrustItems = [
    {
      icon: CreditCard,
      title: '100% Secure Payments',
      desc: 'Your payment information is safe with us'
    },
    {
      icon: RotateCcw,
      title: 'Easy Returns',
      desc: '7 days easy returns & refund policy'
    },
    {
      icon: Headphones,
      title: '24x7 Customer Support',
      desc: 'We are here to help you anytime'
    },
    {
      icon: PackageCheck,
      title: 'Best Quality Packaging',
      desc: 'Packed with care & devotion'
    }
  ];

  return (
    <section className="py-12 border-t border-[#D4AF37]/20 bg-[#060a14]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#E5C158]">
            EASY SHOPPING EXPERIENCE
          </span>
        </div>

        {/* Horizontal 6 Steps */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 relative">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={st.num}
                className="flex flex-col items-center text-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2a1d06] to-[#120d02] border border-[#D4AF37]/40 flex items-center justify-center text-[#E5C158] mb-2.5 shadow-md group-hover:scale-110 transition-transform">
                  <Icon className="w-5 h-5 text-amber-300" />
                </div>
                <h4 className="text-xs font-bold text-gray-100 group-hover:text-amber-200">
                  {st.title}
                </h4>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {st.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* 4-Column Sub-Trust Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 pt-8 border-t border-white/10">
          {subTrustItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]">
                <div className="p-2 rounded-xl bg-amber-500/10 text-[#E5C158] shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-200">{item.title}</h5>
                  <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
