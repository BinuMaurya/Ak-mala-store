import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { LazyImage } from './common/LazyImage';
import {
  Heart,
  Star,
  ShoppingBag,
  Eye,
  Sparkles,
  Clock,
  Check,
  CheckCircle2,
  Filter
} from 'lucide-react';

export const BestSellers: React.FC = () => {
  const {
    allProducts,
    selectedCategory,
    setSelectedCategory,
    addToCart,
    isInWishlist,
    toggleWishlist,
    setSelectedProductForDetail,
    t
  } = useApp();

  const [activeSizeMap, setActiveSizeMap] = useState<Record<string, '16"' | '22"' | '28"' | '36"'>>({});
  const [addedItemAnimation, setAddedItemAnimation] = useState<string | null>(null);

  const filterTabs = [
    { id: 'all', label: 'All Divine Malas' },
    { id: 'festive', label: 'Ganpati Special' },
    { id: 'rose', label: 'Dutch Red Rose' },
    { id: 'mogra', label: 'Madurai Mogra' },
    { id: 'marigold', label: 'Yellow Genda' },
    { id: 'temple', label: 'Grand Temple (36")' },
    { id: 'wedding', label: 'Varmala Wedding Pairs' },
  ];

  const filteredProducts =
    selectedCategory === 'all'
      ? allProducts
      : allProducts.filter((p) => p.category === selectedCategory || p.tags.some(tag => tag.toLowerCase().includes(selectedCategory.toLowerCase())));

  const handleSizeSelect = (productId: string, size: '16"' | '22"' | '28"' | '36"') => {
    setActiveSizeMap((prev) => ({ ...prev, [productId]: size }));
  };

  const handleAddToCart = (product: Product) => {
    const chosenSize = activeSizeMap[product.id] || product.availableSizes[0]?.size || '22"';
    addToCart(product, chosenSize);
    setAddedItemAnimation(product.id);
    setTimeout(() => setAddedItemAnimation(null), 1800);
  };

  return (
    <section id="bestsellers-section" className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title & Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#E5C158] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sacred Flower Garlands</span>
            </div>
            <h2 className="font-cinzel text-3xl sm:text-4xl font-black text-white">
              Best Sellers & Festive Specials
            </h2>
            <p className="font-playfair italic text-xs sm:text-sm text-amber-200/80 mt-1">
              Woven fresh upon receipt of every sacred order. 100% cold-chain pan-India express dispatch.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {filterTabs.map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    active
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black shadow-md'
                      : 'bg-white/5 border border-amber-500/20 text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const chosenSize = activeSizeMap[product.id] || product.availableSizes[0]?.size || '22"';
            const sizeObj = product.availableSizes.find((s) => s.size === chosenSize);
            const calculatedPrice = product.price + (sizeObj?.extraPrice || 0);
            const calculatedOriginal = product.originalPrice + (sizeObj?.extraPrice || 0);
            const isWish = isInWishlist(product.id);
            const isJustAdded = addedItemAnimation === product.id;

            return (
              <div
                key={product.id}
                className="group relative rounded-3xl bg-[#0a0f1d] border border-[#D4AF37]/25 hover:border-[#E5C158]/70 transition-all duration-300 hover:-translate-y-1.5 shadow-xl hover:shadow-[0_15px_35px_rgba(212,175,55,0.2)] flex flex-col overflow-hidden"
              >
                {/* Top Image & Overlays */}
                <div className="relative h-64 overflow-hidden bg-black/40">
                  <LazyImage
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1d] via-transparent to-black/30" />

                  {/* Badges Left */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {product.tags.slice(0, 2).map((tag, idx) => (
                      <span
                        key={idx}
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-md backdrop-blur-md ${
                          tag === 'Best Seller'
                            ? 'bg-amber-500 text-black'
                            : tag === 'Ganpati Special'
                            ? 'bg-red-600 text-white'
                            : 'bg-black/70 text-amber-300 border border-amber-400/30'
                        }`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Wishlist Heart Toggle */}
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    title={isWish ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all cursor-pointer ${
                      isWish
                        ? 'bg-red-600 border-red-500 text-white shadow-lg scale-110'
                        : 'bg-black/50 border-white/20 text-gray-300 hover:text-red-400 hover:border-red-400'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isWish ? 'fill-current' : ''}`} />
                  </button>

                  {/* Quick View Button on Hover */}
                  <button
                    onClick={() => setSelectedProductForDetail(product)}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black border border-[#D4AF37]/50 text-amber-200 text-xs font-semibold backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-lg"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{t('quickView')}</span>
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  {/* Rating & Reviews */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span className="font-bold">{product.rating}</span>
                      <span className="text-gray-400 text-[11px]">({product.reviewsCount})</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                      <Clock className="w-3 h-3" />
                      <span>{product.freshnessHours}h Freshness</span>
                    </div>
                  </div>

                  {/* Title & Flora Subtitle */}
                  <div>
                    <h3
                      onClick={() => setSelectedProductForDetail(product)}
                      className="font-semibold text-sm text-gray-100 group-hover:text-amber-300 transition-colors line-clamp-1 cursor-pointer"
                    >
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-amber-400/70 font-devanagari line-clamp-1">
                      {product.hindiName}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">
                      🌸 {product.flowers.join(' • ')}
                    </p>
                  </div>

                  {/* Size Selector Chips */}
                  <div>
                    <div className="text-[10px] text-gray-400 mb-1 flex items-center justify-between">
                      <span>Select Garland Size:</span>
                      <span className="text-amber-300 font-medium">{chosenSize}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {product.availableSizes.map((s) => (
                        <button
                          key={s.size}
                          onClick={() => handleSizeSelect(product.id, s.size)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            chosenSize === s.size
                              ? 'bg-amber-500/30 text-amber-200 border-[#D4AF37] shadow-sm'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-200'
                          }`}
                        >
                          {s.size}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Price Row & Add to Cart Button */}
                  <div className="pt-2 border-t border-white/10">
                    <div className="flex items-baseline justify-between mb-2">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-[#F3E5AB]">
                          ₹{calculatedPrice}
                        </span>
                        <span className="text-xs text-gray-500 line-through">
                          ₹{calculatedOriginal}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {product.discountPercent}% OFF
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        isJustAdded
                          ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                          : 'bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B8860B] text-black hover:opacity-95 shadow-[0_4px_15px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.5)]'
                      }`}
                    >
                      {isJustAdded ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>ADDED TO BASKET!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" />
                          <span>{t('addToCart')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
