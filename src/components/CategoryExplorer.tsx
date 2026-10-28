import React from 'react';
import { useApp } from '../context/AppContext';
import { LazyImage } from './common/LazyImage';
import { Sparkles, LayoutGrid } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  hindiName: string;
  image: string;
  flowerType: string;
  tag: string;
}

export const CategoryExplorer: React.FC = () => {
  const { selectedCategory, setSelectedCategory, t } = useApp();

  const categories: CategoryItem[] = [
    {
      id: 'rose',
      name: 'Red Rose Malas',
      hindiName: 'लाल गुलाब माला',
      image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=400&auto=format&fit=crop&q=80',
      flowerType: 'Dutch Roses',
      tag: 'Royal'
    },
    {
      id: 'mogra',
      name: 'White Mogra Malas',
      hindiName: 'श्वेत मोगरा माला',
      image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&auto=format&fit=crop&q=80',
      flowerType: 'Madurai Jasmine',
      tag: 'Aromatic'
    },
    {
      id: 'marigold',
      name: 'Yellow Genda Malas',
      hindiName: 'पीली गेंदा माला',
      image: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=400&auto=format&fit=crop&q=80',
      flowerType: 'Kesariya & Yellow',
      tag: 'Auspicious'
    },
    {
      id: 'orchid',
      name: 'Mixed Orchid Malas',
      hindiName: 'शाही आर्किड माला',
      image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=400&auto=format&fit=crop&q=80',
      flowerType: 'Thai Orchids',
      tag: 'Exotic'
    },
    {
      id: 'tulsi',
      name: 'Sacred Tulsi Malas',
      hindiName: 'पवित्र तुलसी माला',
      image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&auto=format&fit=crop&q=80',
      flowerType: 'Vrindavan Tulsi',
      tag: 'Divine'
    },
    {
      id: 'temple',
      name: 'Grand Temple Har (36")',
      hindiName: 'भव्य मंदिर हार',
      image: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=400&auto=format&fit=crop&q=80',
      flowerType: 'Multi-tiered',
      tag: '36 Inch'
    },
    {
      id: 'wedding',
      name: 'Varmala Wedding Pairs',
      hindiName: 'शाही वरमाला जोड़ा',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&auto=format&fit=crop&q=80',
      flowerType: 'Couple Sets',
      tag: 'Wedding'
    },
    {
      id: 'festive',
      name: 'Ganpati Special Har',
      hindiName: 'गणपति बाप्पा विशेष',
      image: 'https://images.unsplash.com/photo-1602615509930-4e365022839b?w=400&auto=format&fit=crop&q=80',
      flowerType: 'Durva & Lotus',
      tag: 'Festive'
    },
  ];

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    const el = document.getElementById('bestsellers-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-12 border-y border-[#D4AF37]/15 bg-[#050811]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#E5C158] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sacred Flora Heritage</span>
            </div>
            <h2 className="font-cinzel text-2xl sm:text-3xl font-extrabold text-white">
              Explore By Floral Category
            </h2>
            <p className="font-playfair italic text-xs text-amber-200/70">
              Each bloom is ethically sourced, cleaned in holy water, and strung with devotion.
            </p>
          </div>

          {/* View All Button */}
          <button
            onClick={() => handleSelectCategory('all')}
            className={`self-start md:self-auto px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold border-[#E5C158]'
                : 'bg-white/5 border-amber-500/30 text-amber-200 hover:bg-white/10'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>View All Collections</span>
          </button>
        </div>

        {/* Circular Thumbnails Row with Hover Effects */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 sm:gap-6">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <div
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className="group flex flex-col items-center cursor-pointer select-none"
              >
                {/* Circular Image Container with Gold Ring Halo */}
                <div className="relative mb-3">
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 transition-all duration-300 ${
                      isSelected
                        ? 'bg-gradient-to-tr from-[#D4AF37] via-[#FFF6D6] to-[#AA771C] ring-4 ring-[#D4AF37]/40 scale-105 shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                        : 'bg-white/10 group-hover:bg-gradient-to-tr group-hover:from-[#D4AF37] group-hover:to-amber-500 group-hover:scale-105'
                    }`}
                  >
                    <div className="w-full h-full rounded-full overflow-hidden relative">
                      <LazyImage
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                    </div>
                  </div>

                  {/* Badge */}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded-full bg-black/80 text-amber-300 border border-amber-500/40 whitespace-nowrap shadow-sm">
                    {cat.tag}
                  </span>
                </div>

                {/* Category Titles */}
                <h3
                  className={`text-xs font-semibold text-center leading-tight transition-colors ${
                    isSelected ? 'text-[#E5C158] font-bold' : 'text-gray-200 group-hover:text-amber-200'
                  }`}
                >
                  {cat.name}
                </h3>
                <span className="text-[10px] text-gray-400 group-hover:text-amber-300/80 text-center">
                  {cat.flowerType}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
