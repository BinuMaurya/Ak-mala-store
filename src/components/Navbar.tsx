import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Crown,
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  X,
  ChevronDown,
  Sparkles,
  Flame,
  BarChart3,
  Sliders,
  CheckCircle2,
  Layers,
  Settings
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    t,
    cartCount,
    wishlistIds,
    setIsCartOpen,
    setIsCustomBuilderOpen,
    setIsDashboardOpen,
    setIsAuthOpen,
    setIsAdminOpen,
    setIsGalleryOpen,
    siteAssets,
    user,
    allProducts,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    setSelectedProductForDetail
  } = useApp();

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collectionsDropdownOpen, setCollectionsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = searchQuery.trim()
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.hindiName.includes(searchQuery) ||
          p.flowers.some((f) => f.toLowerCase().includes(searchQuery.toLowerCase())) ||
          p.bestForDeity.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const quickSearchTags = ['Dutch Rose', 'Mogra', 'Marigold', 'Ganpati Special', 'Varmala', 'Lotus'];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#070b14]/90 backdrop-blur-xl border-b border-[#D4AF37]/20 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3 lg:gap-6">
          {/* 1. Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-amber-200 hover:text-white hover:bg-white/5 border border-amber-500/20"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* 2. Brand Logo & Tagline */}
          <div
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setSelectedCategory('all');
            }}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2a1b05] via-[#4a320a] to-[#1a1103] border-2 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.35)] group-hover:scale-105 transition-transform duration-300">
              <Crown className="w-6 h-6 text-[#E5C158] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-black flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping" />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-cinzel text-xl sm:text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#FFF4D0] via-[#E5C158] to-[#D4AF37]">
                  AK MALA
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-gradient-to-r from-amber-500/30 to-amber-700/30 text-amber-300 border border-amber-500/40 tracking-tighter">
                  ESTD 1994
                </span>
              </div>
              <span className="font-playfair italic text-[10px] sm:text-xs text-amber-300/80 tracking-wide">
                Pure Devotion. Premium Quality.
              </span>
            </div>
          </div>

          {/* 3. Centered Search Bar with Dropdown Suggestions */}
          <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-lg relative">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 pr-10 py-2.5 rounded-full bg-black/40 border border-[#D4AF37]/35 text-xs text-gray-100 placeholder-gray-400 focus:outline-none focus:border-[#E5C158] focus:ring-2 focus:ring-[#D4AF37]/25 transition-all backdrop-blur-md shadow-inner"
              />
              <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-3" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-2.5 text-gray-400 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Live Autocomplete Dropdown */}
            {isSearchFocused && (
              <div className="absolute top-12 left-0 right-0 z-50 rounded-2xl bg-[#0b101d] border border-[#D4AF37]/40 shadow-2xl p-4 backdrop-blur-2xl">
                {searchQuery ? (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 mb-2">
                      Matching Sacred Malas ({searchResults.length})
                    </div>
                    {searchResults.length > 0 ? (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {searchResults.slice(0, 5).map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setSelectedProductForDetail(p);
                              setIsSearchFocused(false);
                            }}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer border border-transparent hover:border-amber-500/20 transition-all"
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover border border-amber-500/30"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-semibold text-gray-100 truncate">{p.name}</h4>
                              <p className="text-[10px] text-amber-300/80">{p.flowers.join(' • ')}</p>
                            </div>
                            <span className="text-xs font-bold text-[#E5C158]">₹{p.price}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-gray-400">
                        No garlands found for "{searchQuery}". Try "Rose", "Mogra", or "Ganpati".
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 mb-2">
                      Popular Sacred Searches
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {quickSearchTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            setSearchQuery(tag);
                          }}
                          className="px-2.5 py-1 rounded-full text-xs bg-amber-500/10 text-amber-200 border border-amber-500/20 hover:bg-amber-500/25 transition-all"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. Action Icons: Wishlist, Cart, User Login */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Wishlist Button */}
            <button
              onClick={() => {
                const el = document.getElementById('bestsellers-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              title="Sacred Wishlist"
              className="relative p-2.5 rounded-2xl bg-black/30 border border-[#D4AF37]/25 text-amber-200 hover:text-white hover:border-[#D4AF37] transition-all cursor-pointer"
            >
              <Heart className="w-5 h-5" />
              {wishlistIds.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-r from-red-600 to-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                  {wishlistIds.length}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              title="Sacred Basket"
              className="relative flex items-center gap-2 px-3 py-2 rounded-2xl bg-gradient-to-r from-[#211603] to-[#3a2606] border border-[#D4AF37]/50 text-amber-200 hover:border-[#E5C158] transition-all shadow-[0_0_15px_rgba(212,175,55,0.15)] cursor-pointer"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-[#E5C158]" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 w-5 h-5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[11px] font-black flex items-center justify-center shadow-md animate-bounce">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline text-xs font-bold text-[#F3E5AB]">
                {t('cart')}
              </span>
            </button>

            {/* User Profile / Devotee Login */}
            <button
              onClick={() => setIsAuthOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 text-gray-200 text-xs font-medium hover:text-amber-200 transition-all cursor-pointer"
            >
              <User className="w-4 h-4 text-[#E5C158]" />
              <span className="hidden md:inline">
                {user ? user.name.split(' ')[0] : t('login')}
              </span>
            </button>
          </div>
        </div>

        {/* 5. Desktop Secondary Navigation Strip */}
        <nav className="hidden lg:flex items-center justify-between border-t border-[#D4AF37]/15 py-2.5 text-xs font-medium text-gray-300">
          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setSelectedCategory('all');
              }}
              className="hover:text-[#E5C158] transition-colors cursor-pointer flex items-center gap-1 text-[#F3E5AB]"
            >
              <span>{t('navHome')}</span>
            </button>

            {/* All Collections Dropdown */}
            <div className="relative group">
              <button
                onMouseEnter={() => setCollectionsDropdownOpen(true)}
                className="hover:text-[#E5C158] transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>{t('navCollections')}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {collectionsDropdownOpen && (
                <div
                  onMouseEnter={() => setCollectionsDropdownOpen(true)}
                  onMouseLeave={() => setCollectionsDropdownOpen(false)}
                  className="absolute top-6 left-0 w-64 rounded-2xl bg-[#090d18] border border-[#D4AF37]/40 shadow-2xl p-3 z-50 space-y-1 backdrop-blur-xl"
                >
                  {[
                    { id: 'rose', name: 'Dutch Red Rose Malas', tag: 'Royal' },
                    { id: 'mogra', name: 'Madurai Fragrant Mogra', tag: 'Pure' },
                    { id: 'marigold', name: 'Kesariya Genda Malas', tag: 'Auspicious' },
                    { id: 'orchid', name: 'Royal Orchid & Velvet', tag: 'Luxury' },
                    { id: 'tulsi', name: 'Vrindavan Sacred Tulsi', tag: 'Divine' },
                    { id: 'temple', name: 'Grand Temple Har (36")', tag: 'Masterpiece' },
                    { id: 'wedding', name: 'Rajwada Varmala Sets', tag: 'Imperial' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setCollectionsDropdownOpen(false);
                        const el = document.getElementById('bestsellers-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl text-xs hover:bg-white/5 text-gray-300 hover:text-amber-200 transition-all"
                    >
                      <span>{cat.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-[#E5C158] border border-amber-500/20">
                        {cat.tag}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                const el = document.getElementById('bestsellers-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#E5C158] transition-colors cursor-pointer"
            >
              {t('navBestSellers')}
            </button>

            <button
              onClick={() => {
                setSelectedCategory('festive');
                const el = document.getElementById('bestsellers-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#E5C158] transition-colors cursor-pointer flex items-center gap-1 text-amber-300 font-semibold"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{t('navFestive')}</span>
            </button>

            {/* Custom Mala Studio Button */}
            <button
              onClick={() => setIsCustomBuilderOpen(true)}
              className="hover:text-[#E5C158] transition-colors cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-amber-700/10 border border-amber-500/30 text-amber-200"
            >
              <Sliders className="w-3.5 h-3.5 text-[#E5C158]" />
              <span className="font-semibold">{t('navCustomMala')}</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('reviews-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#E5C158] transition-colors cursor-pointer"
            >
              {t('reviews')}
            </button>

            {/* 1000+ Gallery Link */}
            <button
              onClick={() => {
                const el = document.getElementById('devotional-gallery');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-[#E5C158] transition-colors cursor-pointer flex items-center gap-1.5 text-amber-200"
            >
              <Layers className="w-3.5 h-3.5 text-[#E5C158]" />
              <span>1,000+ Gallery</span>
            </button>

            {/* Live Analytics Dashboard */}
            <button
              onClick={() => setIsDashboardOpen(true)}
              className="hover:text-[#E5C158] transition-colors cursor-pointer flex items-center gap-1 text-emerald-400"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{t('navDashboard')}</span>
            </button>

            {/* Admin CMS Studio Button */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-400/50 hover:bg-amber-500/25 text-[#E5C158] font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Open Site CMS to change murti, photos, videos, and offers"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin Studio</span>
            </button>
          </div>

          {/* Right festive banner button */}
          <button
            onClick={() => {
              setSelectedCategory('festive');
              const el = document.getElementById('bestsellers-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold text-xs tracking-wide shadow-md hover:scale-105 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>GANPATI OFFERS ({siteAssets.offerDiscountPercent}% OFF)</span>
          </button>
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#070b14] border-b border-[#D4AF37]/30 px-5 py-4 space-y-3">
          <div className="relative w-full mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-white"
            />
            <Search className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-left text-gray-200"
            >
              🌸 {t('navCollections')}
            </button>
            <button
              onClick={() => {
                setSelectedCategory('festive');
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-left text-amber-300 font-semibold"
            >
              🪔 {t('navFestive')}
            </button>
            <button
              onClick={() => {
                setIsCustomBuilderOpen(true);
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-left text-gray-200"
            >
              ✨ {t('navCustomMala')}
            </button>
            <button
              onClick={() => {
                setIsDashboardOpen(true);
                setMobileMenuOpen(false);
              }}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-left text-emerald-400"
            >
              📊 {t('navDashboard')}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
