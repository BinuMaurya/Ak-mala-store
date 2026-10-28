import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Smartphone,
  Monitor,
  Sparkles,
  Search,
  SlidersHorizontal,
  ShoppingBag,
  Heart,
  User,
  Home,
  LayoutGrid,
  ChevronLeft,
  ArrowRight,
  Star,
  CheckCircle2,
  MapPin,
  Clock,
  Rotate3D,
  Flame,
  Truck,
  Copy,
  ChevronDown,
  Trash2,
  Plus,
  Minus,
  Check,
  Zap,
  Lock,
  QrCode,
  CreditCard,
  Building,
  Wallet,
  Banknote,
  Share2,
  Flower2,
  Award
} from 'lucide-react';

export const MobileAppView: React.FC = () => {
  const {
    allProducts,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    cartCount,
    wishlistIds,
    toggleWishlist,
    subtotal,
    discount,
    deliveryCharge,
    finalTotal,
    setIsCheckoutOpen,
    showNotification
  } = useApp();

  // Active Mobile Screen:
  // 'home' | 'collections' | 'pdp' | 'cart' | 'checkout' | 'tracking' | 'orders'
  const [mobileScreen, setMobileScreen] = useState<'home' | 'collections' | 'pdp' | 'cart' | 'checkout' | 'tracking' | 'orders'>('home');
  const [activeCollectionFilter, setActiveCollectionFilter] = useState<string>('All');
  const [selectedMobileProduct, setSelectedMobileProduct] = useState(allProducts[0]);
  const [selectedSize, setSelectedSize] = useState<'16"' | '22"' | '28"' | '36"'>('22"');
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [ordersTab, setOrdersTab] = useState<'All' | 'Processing' | 'Shipped' | 'Delivered'>('All');
  const [payMethod, setPayMethod] = useState<'upi' | 'card' | 'netbanking' | 'wallets' | 'cod'>('upi');

  const collectionPills = ['All', 'White', 'Red', 'Yellow', 'Rose', 'Mixed'];

  const filteredCollectionProducts = activeCollectionFilter === 'All'
    ? allProducts
    : allProducts.filter(p => {
        if (activeCollectionFilter === 'White') return p.category === 'mogra';
        if (activeCollectionFilter === 'Red') return p.category === 'rose';
        if (activeCollectionFilter === 'Yellow') return p.category === 'marigold';
        if (activeCollectionFilter === 'Rose') return p.category === 'rose';
        if (activeCollectionFilter === 'Mixed') return p.category === 'festive' || p.category === 'orchid';
        return true;
      });

  const handleOpenPdp = (prod: typeof allProducts[0]) => {
    setSelectedMobileProduct(prod);
    setMobileScreen('pdp');
  };

  return (
    <div className="w-full flex flex-col items-center justify-center py-6 px-2 sm:px-4">
      
      {/* Top screen switcher bar matching the 7 mobile screenshots in user image */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-black/80 border border-[#D4AF37]/40 mb-6 overflow-x-auto max-w-full backdrop-blur-md">
        {[
          { id: 'home', label: '1. Home' },
          { id: 'collections', label: '2. All Collections' },
          { id: 'pdp', label: '3. Product Detail (PDP)' },
          { id: 'cart', label: `4. Cart (${cartCount})` },
          { id: 'checkout', label: '5. Checkout' },
          { id: 'tracking', label: '6. Order Tracking' },
          { id: 'orders', label: '7. My Orders' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileScreen(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              mobileScreen === tab.id
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black shadow-md'
                : 'text-gray-300 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Realistic Mobile Frame Container */}
      <div className="w-full max-w-[390px] h-[810px] rounded-[44px] bg-[#030712] border-[8px] border-[#1c1d24] shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_25px_rgba(212,175,55,0.3)] relative overflow-hidden flex flex-col select-none">
        
        {/* Status Bar */}
        <div className="h-10 pt-2 px-6 flex items-center justify-between text-[11px] font-bold text-white bg-black/60 z-30 shrink-0">
          <span>9:41</span>
          <div className="w-24 h-4 rounded-full bg-black mx-auto" />
          <div className="flex items-center gap-1.5 text-[10px]">
            <span>5G</span>
            <div className="w-5 h-2.5 rounded-sm border border-white p-0.5 flex items-center">
              <div className="w-full h-full bg-white rounded-xs" />
            </div>
          </div>
        </div>

        {/* SCREEN 1: MOBILE HOME SCREEN */}
        {mobileScreen === 'home' && (
          <div className="flex-1 overflow-y-auto pb-16 scrollbar-none">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
              <span className="text-amber-200 text-lg">☰</span>
              <div className="text-center">
                <span className="font-cinzel text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFF4D0] to-[#E5C158]">
                  AK MALA
                </span>
                <span className="block text-[8px] text-amber-300/80 uppercase">
                  Divine • Premium • Handcrafted
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-amber-200">
                <Search className="w-4 h-4 cursor-pointer" onClick={() => setMobileScreen('collections')} />
                <Heart className="w-4 h-4 cursor-pointer" />
                <div className="relative cursor-pointer" onClick={() => setMobileScreen('cart')}>
                  <ShoppingBag className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Hero Banner */}
            <div className="p-4 space-y-2">
              <h2 className="font-cinzel text-2xl font-bold text-white leading-tight">
                Divine Malas<br />
                For Every <span className="text-[#E5C158]">Blessing</span>
              </h2>
              <p className="text-[11px] text-gray-400">
                Handcrafted with devotion, made for Ganpati Bappa & your special moments.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setMobileScreen('collections')}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold text-xs flex items-center gap-1 shadow-md"
                >
                  <span>SHOP COLLECTION</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleOpenPdp(allProducts[0])}
                  className="px-3 py-2 rounded-xl bg-white/5 border border-amber-500/30 text-amber-200 text-xs font-semibold"
                >
                  ▶ WATCH VIDEO
                </button>
              </div>

              {/* Murti Preview */}
              <div className="relative h-64 rounded-3xl overflow-hidden mt-3 border border-amber-500/30">
                <img
                  src="https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=600&auto=format&fit=crop&q=80"
                  alt="Murti"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/70 border border-[#D4AF37] text-[10px] text-amber-200 font-bold backdrop-blur-xs flex items-center gap-1">
                  <Rotate3D className="w-3 h-3 text-[#E5C158]" /> 360° VIEW
                </span>
              </div>
            </div>

            {/* 4 Mini Trust Icons */}
            <div className="grid grid-cols-4 gap-2 px-4 py-2 text-center text-[9px] text-gray-300">
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <Truck className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <span>Free Delivery Above ₹999</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <Lock className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <span>Secure Payment</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <Clock className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <span>Easy Returns 7 Days</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 mx-auto mb-1" />
                <span>Quality Assured</span>
              </div>
            </div>

            {/* EXPLORE BY CATEGORY */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  EXPLORE BY CATEGORY
                </span>
                <button
                  onClick={() => setMobileScreen('collections')}
                  className="text-xs text-[#E5C158] font-semibold"
                >
                  View All &gt;
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { name: 'White Malas', img: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=200&auto=format&fit=crop&q=80' },
                  { name: 'Red Malas', img: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=200&auto=format&fit=crop&q=80' },
                  { name: 'Yellow Malas', img: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=200&auto=format&fit=crop&q=80' },
                  { name: 'Mixed Malas', img: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=200&auto=format&fit=crop&q=80' },
                ].map((cat, i) => (
                  <div key={i} onClick={() => setMobileScreen('collections')} className="flex flex-col items-center cursor-pointer">
                    <div className="w-14 h-14 rounded-full p-0.5 bg-gradient-to-tr from-[#D4AF37] to-amber-500 overflow-hidden mb-1">
                      <img src={cat.img} alt={cat.name} className="w-full h-full object-cover rounded-full" />
                    </div>
                    <span className="text-[10px] text-gray-300 text-center leading-tight">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* BEST SELLERS GRID (2 COLUMNS) */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  BEST SELLERS
                </span>
                <button onClick={() => setMobileScreen('collections')} className="text-xs text-[#E5C158] font-semibold">
                  View All &gt;
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {allProducts.slice(0, 4).map((p) => (
                  <div
                    key={p.id}
                    className="rounded-2xl bg-[#0a0f1d] border border-white/10 p-2.5 flex flex-col justify-between"
                  >
                    <div className="relative h-32 rounded-xl overflow-hidden mb-2" onClick={() => handleOpenPdp(p)}>
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      <span className="absolute top-1.5 left-1.5 text-[8px] font-bold bg-amber-500 text-black px-1.5 py-0.2 rounded shadow">
                        BEST SELLER
                      </span>
                    </div>

                    <div>
                      <h4 className="text-[11px] font-bold text-white truncate">{p.name}</h4>
                      <div className="flex items-center gap-1 text-[10px] text-amber-400 my-0.5">
                        <Star className="w-2.5 h-2.5 fill-amber-400" />
                        <span>{p.rating} ({p.reviewsCount})</span>
                      </div>
                      <div className="flex items-baseline gap-1 my-1">
                        <span className="text-xs font-bold text-[#F3E5AB]">₹{p.price}</span>
                        <span className="text-[9px] text-gray-500 line-through">₹{p.originalPrice}</span>
                      </div>

                      <button
                        onClick={() => addToCart(p, '22"')}
                        className="w-full py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold text-[10px] uppercase shadow-sm"
                      >
                        ADD TO CART
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ganpati Festival Special Card */}
            <div className="mx-4 p-4 rounded-2xl bg-gradient-to-br from-[#2a1705] to-[#120a02] border border-[#D4AF37]/50 text-center space-y-2">
              <span className="text-xs font-bold text-amber-300 uppercase block">Ganpati Festival Special</span>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 block">
                Flat 15% OFF
              </span>
              <span className="text-[10px] text-gray-400 block">on all orders</span>
              <button
                onClick={() => setMobileScreen('collections')}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold text-xs uppercase"
              >
                SHOP NOW
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 2: ALL COLLECTIONS SCREEN (matching screenshot 2) */}
        {mobileScreen === 'collections' && (
          <div className="flex-1 overflow-y-auto pb-16 scrollbar-none">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 sticky top-0 bg-[#030712] z-20">
              <div className="flex items-center gap-3">
                <ChevronLeft className="w-5 h-5 cursor-pointer text-amber-200" onClick={() => setMobileScreen('home')} />
                <h3 className="font-cinzel text-sm font-bold text-white">All Collections</h3>
              </div>
              <div className="flex items-center gap-3 text-amber-200">
                <Search className="w-4 h-4" />
                <SlidersHorizontal className="w-4 h-4" />
                <div className="relative cursor-pointer" onClick={() => setMobileScreen('cart')}>
                  <ShoppingBag className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Filter Pills: All, White, Red, Yellow, Rose, Mixed */}
            <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto scrollbar-none border-b border-white/5">
              {collectionPills.map((pill) => (
                <button
                  key={pill}
                  onClick={() => setActiveCollectionFilter(pill)}
                  className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    activeCollectionFilter === pill
                      ? 'bg-[#E5C158] text-black font-bold shadow'
                      : 'bg-white/5 border border-white/10 text-gray-300'
                  }`}
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Sub-header: 50 Results Found + Sort dropdown */}
            <div className="px-4 py-2 flex items-center justify-between text-[11px] text-gray-400">
              <span>50 Results Found</span>
              <span className="text-amber-200 font-medium flex items-center gap-1 cursor-pointer">
                Sort ⌵
              </span>
            </div>

            {/* 2-Column Product Grid */}
            <div className="grid grid-cols-2 gap-3 p-4">
              {filteredCollectionProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="rounded-2xl bg-[#0a0f1d] border border-white/10 p-2.5 flex flex-col justify-between"
                >
                  <div className="relative h-36 rounded-xl overflow-hidden mb-2 cursor-pointer" onClick={() => handleOpenPdp(prod)}>
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(prod.id);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white"
                    >
                      <Heart className={`w-3.5 h-3.5 ${wishlistIds.includes(prod.id) ? 'fill-red-500 text-red-500' : ''}`} />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white truncate cursor-pointer" onClick={() => handleOpenPdp(prod)}>
                      {prod.name}
                    </h4>
                    <div className="flex items-center gap-1 text-[10px] text-amber-400 my-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-400" />
                      <span>{prod.rating} ({prod.reviewsCount})</span>
                    </div>

                    <div className="flex items-baseline gap-1.5 my-1">
                      <span className="text-xs font-extrabold text-[#F3E5AB]">₹{prod.price}</span>
                      <span className="text-[10px] text-gray-500 line-through">₹{prod.originalPrice}</span>
                    </div>

                    <button
                      onClick={() => addToCart(prod, '22"')}
                      className="w-full py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold text-[10px] uppercase shadow-sm cursor-pointer"
                    >
                      ADD TO CART
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SCREEN 3: PRODUCT DETAIL (PDP) SCREEN (matching screenshot 3) */}
        {mobileScreen === 'pdp' && (
          <div className="flex-1 overflow-y-auto pb-20 scrollbar-none">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 sticky top-0 bg-[#030712] z-20">
              <ChevronLeft className="w-5 h-5 cursor-pointer text-amber-200" onClick={() => setMobileScreen('collections')} />
              <h3 className="font-cinzel text-xs font-bold text-white truncate max-w-[200px]">
                {selectedMobileProduct.name}
              </h3>
              <div className="flex items-center gap-2.5 text-amber-200">
                <Heart className="w-4 h-4 cursor-pointer" />
                <Share2 className="w-4 h-4 cursor-pointer" />
              </div>
            </div>

            {/* Main Picture with 360° badge */}
            <div className="relative h-64 bg-black">
              <img
                src={selectedMobileProduct.image}
                alt={selectedMobileProduct.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-3 right-3 px-2 py-0.5 rounded-full bg-black/70 border border-[#D4AF37] text-[10px] text-amber-200 font-bold backdrop-blur-xs flex items-center gap-1">
                360°
              </span>
            </div>

            {/* Thumbnails row */}
            <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
              {[selectedMobileProduct.image, ...selectedMobileProduct.galleryImages].map((img, i) => (
                <div key={i} className="w-12 h-12 rounded-lg overflow-hidden border border-amber-500/40 shrink-0">
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {/* Title & Reviews */}
            <div className="px-4 py-2 space-y-1">
              <h2 className="font-cinzel text-base font-bold text-white">
                {selectedMobileProduct.name}
              </h2>
              <div className="flex items-center gap-2 text-xs">
                <div className="flex items-center gap-0.5 text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <span className="font-bold">{selectedMobileProduct.rating} (125 Reviews)</span>
                </div>
                <span className="text-gray-500">|</span>
                <span className="text-emerald-400 text-[11px]">200+ Sold</span>
              </div>

              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-xl font-black text-[#F3E5AB]">₹{selectedMobileProduct.price}</span>
                <span className="text-xs text-gray-500 line-through">₹{selectedMobileProduct.originalPrice}</span>
                <span className="text-xs font-bold text-emerald-400">29% OFF</span>
              </div>
            </div>

            {/* 4 Feature Badges */}
            <div className="grid grid-cols-4 gap-1.5 px-4 py-2 text-center text-[9px] text-gray-300">
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <Heart className="w-3 h-3 text-[#E5C158] mx-auto mb-1" />
                <span>Handcrafted with Love</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <Flower2 className="w-3 h-3 text-[#E5C158] mx-auto mb-1" />
                <span>Premium Quality Flowers</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <Sparkles className="w-3 h-3 text-[#E5C158] mx-auto mb-1" />
                <span>Perfect for Every Occasion</span>
              </div>
              <div className="p-2 rounded-xl bg-white/[0.03] border border-white/5">
                <Award className="w-3 h-3 text-[#E5C158] mx-auto mb-1" />
                <span>Made with Devotion</span>
              </div>
            </div>

            {/* SELECT SIZE */}
            <div className="px-4 py-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase text-gray-300">SELECT SIZE</span>
                <span className="text-[#E5C158] text-[10px] underline">Size guide</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                {[
                  { s: '16"', l: 'Small (16 inch)' },
                  { s: '22"', l: 'Medium (22 inch)' },
                  { s: '28"', l: 'Large (28 inch)' },
                  { s: '36"', l: 'XL (36 inch)' },
                ].map((sz) => (
                  <button
                    key={sz.s}
                    onClick={() => setSelectedSize(sz.s as any)}
                    className={`p-2 rounded-xl border text-[10px] ${
                      selectedSize === sz.s
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold'
                        : 'bg-white/5 border-white/10 text-gray-400'
                    }`}
                  >
                    <div>{sz.l.split(' ')[0]}</div>
                    <div className="text-[8px] text-gray-500">({sz.s})</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Collapsible PRODUCT DETAILS */}
            <div className="px-4 py-2 space-y-1 text-xs text-gray-300">
              <h4 className="font-bold uppercase text-gray-200">PRODUCT DETAILS</h4>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Handcrafted with premium quality flowers, this mala is perfect for Ganpati Bappa, temple decoration, gifting & festive occasions.
              </p>
            </div>

            {/* OFFERS & COUPONS */}
            <div className="mx-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-amber-400 text-black px-1.5 py-0.2 rounded">
                    FEST15
                  </span>
                  <span className="text-xs text-white">Flat 15% OFF on all orders</span>
                </div>
                <p className="text-[10px] text-amber-200/70 mt-0.5">+ 2 More offers available</p>
              </div>
              <button
                onClick={() => {
                  setCopiedCoupon(true);
                  setTimeout(() => setCopiedCoupon(false), 2000);
                }}
                className="text-xs text-[#E5C158] font-bold uppercase"
              >
                {copiedCoupon ? 'COPIED' : 'COPY'}
              </button>
            </div>

            {/* DELIVERY PINCODE */}
            <div className="px-4 py-3 text-xs space-y-1">
              <span className="font-bold text-gray-300 uppercase block">DELIVERY</span>
              <div className="flex items-center justify-between text-gray-300">
                <span>Deliver to Ahmedabad, Gujarat - 380001</span>
                <span className="text-[#E5C158] font-bold">Change</span>
              </div>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" />
                <span>Get it by 20 May - 22 May • Free Delivery</span>
              </p>
            </div>

            {/* Sticky Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-black/95 border-t border-white/10 grid grid-cols-2 gap-2 z-30">
              <button
                onClick={() => {
                  addToCart(selectedMobileProduct, selectedSize);
                  setMobileScreen('cart');
                }}
                className="py-2.5 rounded-xl bg-white/10 border border-[#D4AF37] text-amber-200 font-bold text-xs flex items-center justify-center gap-1"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>ADD TO CART</span>
              </button>

              <button
                onClick={() => {
                  addToCart(selectedMobileProduct, selectedSize);
                  setMobileScreen('checkout');
                }}
                className="py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs flex items-center justify-center gap-1"
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>BUY NOW</span>
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 4: CART SCREEN (matching screenshot 4) */}
        {mobileScreen === 'cart' && (
          <div className="flex-1 overflow-y-auto pb-20 scrollbar-none">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 sticky top-0 bg-[#030712] z-20">
              <div className="flex items-center gap-3">
                <ChevronLeft className="w-5 h-5 cursor-pointer text-amber-200" onClick={() => setMobileScreen('home')} />
                <h3 className="font-cinzel text-sm font-bold text-white">Cart ({cartCount})</h3>
              </div>
              <span className="text-xs text-[#E5C158]">Edit</span>
            </div>

            {/* Cart Items List */}
            <div className="p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.id} className="p-3 rounded-2xl bg-[#0a0f1d] border border-white/10 flex items-start gap-3">
                  <img src={item.product.image} alt={item.product.name} className="w-16 h-16 rounded-xl object-cover" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{item.product.name}</h4>
                    <p className="text-[10px] text-gray-400">Medium (22 inch)</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-bold text-[#F3E5AB]">₹{item.pricePerUnit}</span>
                        <span className="text-[9px] text-gray-500 line-through">₹{item.product.originalPrice}</span>
                      </div>

                      <div className="flex items-center gap-2 bg-black/60 px-2 py-0.5 rounded border border-white/10 text-xs">
                        <button onClick={() => updateCartQuantity(item.id, -1)} className="text-gray-300">-</button>
                        <span className="text-amber-200 font-bold">{item.quantity}</span>
                        <button onClick={() => updateCartQuantity(item.id, 1)} className="text-gray-300">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* PRICE DETAILS */}
            <div className="p-4 space-y-2 text-xs border-t border-white/10">
              <span className="font-bold text-gray-300 uppercase block">PRICE DETAILS</span>
              <div className="flex justify-between text-gray-400">
                <span>Total MRP</span>
                <span>₹{subtotal + discount}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Discount on MRP</span>
                <span>- ₹{discount}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Delivery Charges</span>
                <span className="text-emerald-400 font-bold">{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                <span>Total Amount</span>
                <span className="text-[#F3E5AB] font-black">₹{finalTotal}</span>
              </div>
            </div>

            {/* Sticky Bottom Proceed to Checkout */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-black/95 border-t border-white/10 z-30">
              <button
                onClick={() => setMobileScreen('checkout')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs uppercase shadow-lg"
              >
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 5: CHECKOUT SCREEN (matching screenshot 5) */}
        {mobileScreen === 'checkout' && (
          <div className="flex-1 overflow-y-auto pb-20 scrollbar-none">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 sticky top-0 bg-[#030712] z-20">
              <div className="flex items-center gap-3">
                <ChevronLeft className="w-5 h-5 cursor-pointer text-amber-200" onClick={() => setMobileScreen('cart')} />
                <h3 className="font-cinzel text-sm font-bold text-white">Checkout</h3>
              </div>
            </div>

            {/* Step indicator: 1 Address -> 2 Payment -> 3 Confirm */}
            <div className="px-4 py-2.5 bg-black/40 flex items-center justify-between text-[10px] border-b border-white/5">
              <span className="text-emerald-400 font-bold">1 Address ✓</span>
              <span className="text-white/20">——</span>
              <span className="text-amber-300 font-bold">2 Payment</span>
              <span className="text-white/20">——</span>
              <span className="text-gray-500">3 Confirm</span>
            </div>

            {/* DELIVERY ADDRESS */}
            <div className="p-4 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-300 uppercase">DELIVERY ADDRESS</span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded">Home</span>
              </div>
              <p className="font-bold text-white pt-1">Priya Sharma</p>
              <p className="text-gray-400 text-[11px] leading-tight">
                32, Shree Ganesh Society, Near Swaminarayan Mandir, Ahmedabad, Gujarat - 380001
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-amber-200/80 font-mono text-[10px]">+91 98765 43210</span>
                <span className="text-[#E5C158] font-bold text-[11px]">Change</span>
              </div>
            </div>

            {/* PAYMENT METHODS */}
            <div className="px-4 py-2 space-y-2">
              <span className="font-bold text-gray-300 text-xs uppercase block">PAYMENT METHODS</span>

              {[
                { id: 'upi', name: 'UPI', desc: 'Pay using any UPI App', icon: QrCode },
                { id: 'card', name: 'Credit / Debit Card', desc: 'Visa, Mastercard, Rupay', icon: CreditCard },
                { id: 'netbanking', name: 'Net Banking', desc: 'All major banks', icon: Building },
                { id: 'wallets', name: 'Wallets', desc: 'PhonePe, Paytm, Amazon Pay', icon: Wallet },
                { id: 'cod', name: 'Cash on Delivery', desc: 'Pay when you receive', icon: Banknote },
              ].map((p) => {
                const Icon = p.icon;
                return (
                  <label
                    key={p.id}
                    onClick={() => setPayMethod(p.id as any)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer ${
                      payMethod === p.id
                        ? 'bg-amber-500/15 border-amber-400'
                        : 'bg-white/[0.02] border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-amber-400" />
                      <div>
                        <h5 className="text-xs font-bold text-white">{p.name}</h5>
                        <p className="text-[9px] text-gray-400">{p.desc}</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="mPay"
                      checked={payMethod === p.id}
                      onChange={() => setPayMethod(p.id as any)}
                      className="accent-amber-500"
                    />
                  </label>
                );
              })}
            </div>

            {/* Sticky Bottom Proceed to Pay */}
            <div className="fixed bottom-0 left-0 right-0 p-3 bg-black/95 border-t border-white/10 z-30">
              <button
                onClick={() => setIsCheckoutOpen(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs uppercase shadow-lg cursor-pointer"
              >
                CONTINUE TO SECURE CHECKOUT ₹{finalTotal}
              </button>
            </div>
          </div>
        )}

        {/* SCREEN 6: ORDER TRACKING SCREEN (matching screenshot 6) */}
        {mobileScreen === 'tracking' && (
          <div className="flex-1 overflow-y-auto pb-16 scrollbar-none p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <ChevronLeft className="w-5 h-5 cursor-pointer text-amber-200" onClick={() => setMobileScreen('orders')} />
              <h3 className="font-cinzel text-sm font-bold text-white">Order Tracking</h3>
              <span className="w-5" />
            </div>

            {/* Order ID Box */}
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-amber-500/20">
              <span className="text-[9px] text-gray-400 uppercase">ORDER ID</span>
              <h4 className="font-mono text-sm font-black text-amber-300">AKMALA123456</h4>
              <p className="text-[10px] text-gray-400">Placed on 18 May 2024</p>
            </div>

            {/* Vertical timeline */}
            <div className="space-y-4 pl-2 text-xs">
              {[
                { title: 'Order Confirmed', time: '18 May, 11:30 AM', done: true },
                { title: 'Packed', time: '18 May, 04:15 PM', done: true },
                { title: 'Shipped', time: '19 May, 09:20 AM', done: true },
                { title: 'Out for Delivery', time: '20 May, 09:15 AM', active: true },
                { title: 'Delivered', time: 'Expected on 20 May', upcoming: true },
              ].map((s, idx) => (
                <div key={idx} className="flex items-start gap-3 relative">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      s.done ? 'bg-emerald-500 text-black font-bold' : s.active ? 'bg-amber-400 text-black font-bold ring-2 ring-amber-400/30' : 'bg-white/10 text-gray-500'
                    }`}
                  >
                    {s.done ? '✓' : '•'}
                  </div>
                  <div>
                    <h5 className={`font-bold ${s.active ? 'text-amber-300' : s.done ? 'text-white' : 'text-gray-500'}`}>
                      {s.title}
                    </h5>
                    <p className="text-[10px] text-gray-400">{s.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => showNotification('Live GPS satellite track enabled: 1.2 km away')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold text-xs uppercase flex items-center justify-center gap-1.5 shadow-md mt-6 cursor-pointer"
            >
              <MapPin className="w-4 h-4" />
              <span>TRACK ON MAP</span>
            </button>

            <p className="text-center text-[10px] text-gray-400">
              Need Help? <span className="text-[#E5C158] font-bold">Contact Support</span>
            </p>
          </div>
        )}

        {/* SCREEN 7: MY ORDERS HISTORY SCREEN (matching screenshot 7) */}
        {mobileScreen === 'orders' && (
          <div className="flex-1 overflow-y-auto pb-16 scrollbar-none">
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 sticky top-0 bg-[#030712] z-20">
              <ChevronLeft className="w-5 h-5 cursor-pointer text-amber-200" onClick={() => setMobileScreen('home')} />
              <h3 className="font-cinzel text-sm font-bold text-white">My Orders</h3>
              <span className="w-5" />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 px-4 py-2 overflow-x-auto text-[10px] border-b border-white/5">
              {['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((t) => (
                <button
                  key={t}
                  onClick={() => setOrdersTab(t as any)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap ${
                    ordersTab === t ? 'bg-[#E5C158] text-black font-bold' : 'bg-white/5 text-gray-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Orders Cards */}
            <div className="p-4 space-y-3 text-xs">
              {[
                { id: 'AKMALA123456', status: 'Out for Delivery', date: '18 May 2024', price: 1547, eta: 'Delivery by 20 May' },
                { id: 'AKMALA112233', status: 'Delivered', date: '10 May 2024', price: 988, eta: 'Delivered on 13 May' },
                { id: 'AKMALA998877', status: 'Delivered', date: '02 May 2024', price: 499, eta: 'Delivered on 05 May' },
              ].map((o) => (
                <div key={o.id} className="p-3 rounded-2xl bg-[#0a0f1d] border border-white/10 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-mono text-xs font-bold text-amber-200">{o.id}</h4>
                      <p className="text-[10px] text-gray-400">{o.date}</p>
                    </div>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {o.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 py-1">
                    {[
                      'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=100&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=100&auto=format&fit=crop&q=80',
                    ].map((img, i) => (
                      <img key={i} src={img} alt="item" className="w-10 h-10 rounded-lg object-cover" />
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
                    <span className="font-bold text-[#F3E5AB]">₹{o.price}</span>
                    <button
                      onClick={() => setMobileScreen('tracking')}
                      className="text-[#E5C158] font-bold text-xs underline"
                    >
                      {o.status === 'Out for Delivery' ? 'TRACK ORDER' : 'ORDER DETAILS'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Persistent Bottom Bar for Mobile (matching screenshot 1) */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-[#060a14]/95 border-t border-white/10 px-4 flex items-center justify-around z-40 text-gray-400">
          <button onClick={() => setMobileScreen('home')} className={`flex flex-col items-center text-[9px] ${mobileScreen === 'home' ? 'text-[#E5C158] font-bold' : ''}`}>
            <Home className="w-4 h-4" />
            <span>Home</span>
          </button>
          <button onClick={() => setMobileScreen('collections')} className={`flex flex-col items-center text-[9px] ${mobileScreen === 'collections' ? 'text-[#E5C158] font-bold' : ''}`}>
            <LayoutGrid className="w-4 h-4" />
            <span>Categories</span>
          </button>
          <button onClick={() => showNotification('Wishlist contains 2 saved malas')} className="flex flex-col items-center text-[9px]">
            <Heart className="w-4 h-4" />
            <span>Wishlist</span>
          </button>
          <button onClick={() => setMobileScreen('cart')} className={`relative flex flex-col items-center text-[9px] ${mobileScreen === 'cart' ? 'text-[#E5C158] font-bold' : ''}`}>
            <ShoppingBag className="w-4 h-4" />
            <span className="absolute -top-1 right-1 w-3 h-3 rounded-full bg-amber-500 text-black text-[8px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
            <span>Cart</span>
          </button>
          <button onClick={() => setMobileScreen('orders')} className={`flex flex-col items-center text-[9px] ${mobileScreen === 'orders' ? 'text-[#E5C158] font-bold' : ''}`}>
            <User className="w-4 h-4" />
            <span>Account</span>
          </button>
        </div>

      </div>

    </div>
  );
};
