import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Review } from '../../types';
import { speakProductHindi } from '../VoiceShoppingGuide';
import {
  X,
  Star,
  Heart,
  Share2,
  Rotate3D,
  Sparkles,
  ShoppingBag,
  Zap,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  Truck,
  MapPin,
  ShieldCheck,
  Flower2,
  HeartHandshake,
  Award,
  Volume2
} from 'lucide-react';
import { isOfferActive } from '../../utils/offers';

export const ProductDetailModal: React.FC = () => {
  const {
    selectedProductForDetail,
    setSelectedProductForDetail,
    addToCart,
    isInWishlist,
    toggleWishlist,
    setIsCartOpen,
    setIsCheckoutOpen,
    applyCoupon,
    showNotification,
    siteAssets,
    reviews,
    reviewSummaries,
    setReviewProductId,
    setIsReviewOpen
  } = useApp();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState<'16"' | '22"' | '28"' | '36"'>('22"');
  const [pincode, setPincode] = useState('380001');
  const [pincodeStatus, setPincodeStatus] = useState<string | null>('Delivery available: Get it by 20 May - 22 May (Free Delivery)');
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [view360Active, setView360Active] = useState(false);
  const [productReviews, setProductReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!selectedProductForDetail) {
      setProductReviews([]);
      return;
    }

    let active = true;
    const fallbackReviews = reviews.filter((review) => review.productId === selectedProductForDetail.id);
    void fetch(`/api/reviews?productId=${encodeURIComponent(selectedProductForDetail.id)}`)
      .then(async (response) => {
        const result = (await response.json()) as { reviews?: Review[]; error?: string };
        if (!response.ok || !Array.isArray(result.reviews)) {
          throw new Error(result.error || 'Product reviews could not be loaded.');
        }
        if (active) setProductReviews(result.reviews);
      })
      .catch((error: unknown) => {
        console.error('Could not load product reviews:', error);
        if (active) setProductReviews(fallbackReviews);
      });

    return () => {
      active = false;
    };
  }, [selectedProductForDetail?.id, reviews]);

  if (!selectedProductForDetail) return null;
  const product = selectedProductForDetail;
  const images = product.galleryImages && product.galleryImages.length > 0 ? product.galleryImages : [product.image];
  const sizeObj = product.availableSizes.find((s) => s.size === selectedSize);
  const calculatedPrice = product.price + (sizeObj?.extraPrice || 0);
  const calculatedOriginal = product.originalPrice + (sizeObj?.extraPrice || 0);
  const isWish = isInWishlist(product.id);
  const reviewSummary = reviewSummaries.find((summary) => summary.productId === product.id);
  const averageRating = reviewSummary?.reviewCount ? reviewSummary.averageRating.toFixed(1) : null;
  const isProductAvailable = product.inStock && (product.stockQuantity === undefined || product.stockQuantity > 0);
  const productVideoUrl = (() => {
    try {
      const parsed = new URL(product.videoUrl || '');
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : '';
    } catch {
      return '';
    }
  })();

  const handleCopyCoupon = () => {
    const applied = applyCoupon(siteAssets.offerCode);
    if (!applied) return;
    setCopiedCoupon(true);
    showNotification(`Coupon ${siteAssets.offerCode} applied!`);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (pincode.length === 6) {
      setPincodeStatus(`Get it by 20 May - 22 May | Cold-chain dispatch verified!`);
    } else {
      setPincodeStatus('Please enter a valid 6-digit Indian PIN code');
    }
  };

  const handleInstantBuy = () => {
    if (!isProductAvailable) {
      showNotification('This product is currently out of stock.');
      return;
    }
    addToCart(product, selectedSize);
    setSelectedProductForDetail(null);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#080d1a] border-2 border-[#D4AF37]/50 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#060a14]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-cinzel font-bold text-[#E5C158] uppercase">
              Devotional Details
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-xs text-gray-300 font-medium truncate max-w-[200px] sm:max-w-xs">
              {product.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleWishlist(product.id)}
              className={`p-2 rounded-xl border transition-all ${
                isWish ? 'bg-red-600/20 border-red-500 text-red-400' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWish ? 'fill-current' : ''}`} />
            </button>

            <button
              onClick={() => setSelectedProductForDetail(null)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Two Columns */}
        <div className="overflow-y-auto p-5 sm:p-7 grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Left: Gallery & 360 View */}
          <div className="space-y-4">
            <div className="relative h-80 sm:h-96 rounded-2xl overflow-hidden bg-black/50 border border-amber-500/30">
              <img
                src={images[activeImageIdx] || product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* 360° Badge */}
              <button
                onClick={() => setView360Active(!view360Active)}
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/70 border border-[#D4AF37] text-amber-200 text-xs font-semibold backdrop-blur-md flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Rotate3D className="w-4 h-4 text-[#E5C158]" />
                <span>360° View</span>
              </button>

              <span className="absolute top-3 left-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-red-600 text-white shadow-md">
                {product.discountPercent}% OFF
              </span>
            </div>

            {/* Thumbnails row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIdx(i)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    activeImageIdx === i ? 'border-[#E5C158] ring-2 ring-amber-400/40' : 'border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {productVideoUrl && (
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                {/\.(mp4|webm|ogg)(\?|#|$)/i.test(productVideoUrl) ? (
                  <video src={productVideoUrl} controls preload="metadata" className="max-h-72 w-full" aria-label={`${product.name} product video`} />
                ) : (
                  <a href={productVideoUrl} target="_blank" rel="noreferrer" className="block p-3 text-center text-xs font-bold text-amber-200 hover:bg-white/5">
                    Watch product video
                  </a>
                )}
              </div>
            )}

            {/* 4 Feature Badges */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {[
                { title: 'Handcrafted with Love', icon: HeartHandshake },
                { title: 'Premium Quality Flowers', icon: Flower2 },
                { title: 'Perfect for Every Occasion', icon: Sparkles },
                { title: 'Made with Devotion', icon: Award },
              ].map((b, idx) => {
                const Icon = b.icon;
                return (
                  <div key={idx} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
                    <Icon className="w-4 h-4 text-[#E5C158] shrink-0" />
                    <span className="text-[11px] text-gray-200 font-medium leading-tight">{b.title}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Product Details, Size Selector, Coupons, Pincode & Actions */}
          <div className="space-y-5">
            
            {/* Title & Ratings */}
            <div>
              <h2 className="font-cinzel text-xl sm:text-2xl font-bold text-white leading-tight">
                {product.name}
              </h2>
              <p className="text-xs text-amber-400 font-devanagari mt-0.5">
                {product.hindiName}
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-bold">{averageRating || '—'}</span>
                  <span className="text-gray-400">({reviewSummary?.reviewCount || 0} verified reviews)</span>
                </span>
                <button
                  onClick={() => {
                    setReviewProductId(product.id);
                    setIsReviewOpen(true);
                  }}
                  className="text-[#E5C158] hover:underline"
                >
                  Read or write a review
                </button>
              </div>
              <p className={`mt-2 text-xs font-semibold ${isProductAvailable ? 'text-emerald-300' : 'text-red-300'}`}>
                {isProductAvailable
                  ? product.stockQuantity === undefined
                    ? 'In stock'
                    : `${product.stockQuantity} available`
                  : 'Currently out of stock'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => speakProductHindi(product.name, product.hindiDescription || product.description, calculatedPrice)}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-400/20 transition-colors cursor-pointer"
            >
              <Volume2 className="w-4 h-4" />
              सुनिए इस माला के बारे में
            </button>

            {productReviews.slice(0, 2).map((review) => (
              <article key={review.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-white">{review.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{review.author}{review.city ? ` · ${review.city}` : ''}</p>
                  </div>
                  {review.verifiedDevotee === true && <span className="text-[9px] text-emerald-300 whitespace-nowrap">Verified purchase</span>}
                </div>
                <p className="text-xs text-gray-300 mt-2">{review.comment}</p>
                {review.photoUrl && (
                  <img src={review.photoUrl} alt={`Photo shared by ${review.author}`} className="mt-2 max-h-32 rounded-lg object-cover" />
                )}
              </article>
            ))}

            {/* Price Box */}
            <div className="flex items-baseline gap-3 p-3.5 rounded-2xl bg-white/[0.03] border border-[#D4AF37]/30">
              <span className="text-3xl font-black text-[#F3E5AB]">
                ₹{calculatedPrice}
              </span>
              <span className="text-sm text-gray-400 line-through">
                ₹{calculatedOriginal}
              </span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {product.discountPercent}% OFF
              </span>
            </div>

            {/* SELECT SIZE */}
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold uppercase tracking-wider text-gray-300">SELECT SIZE</span>
                <button
                  onClick={() => showNotification('Size Guide: 16" (Home Pooja), 22" (Ganpati Idol), 28" (Big Murti), 36" (Grand Temple)')}
                  className="text-xs text-[#E5C158] hover:underline"
                >
                  Size guide
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {product.availableSizes.map((sz) => (
                  <button
                    key={sz.size}
                    onClick={() => setSelectedSize(sz.size)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedSize === sz.size
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold shadow-md'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{sz.name.split(' ')[0]}</div>
                    <div className="text-[10px] text-gray-400">({sz.size})</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Accordion: PRODUCT DETAILS */}
            <div className="border border-white/10 rounded-2xl overflow-hidden">
              <button
                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                className="w-full p-3.5 bg-white/[0.02] flex items-center justify-between text-xs font-bold text-gray-200 hover:text-white cursor-pointer"
              >
                <span>PRODUCT DETAILS</span>
                {isDetailsOpen ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-amber-400" />}
              </button>

              {isDetailsOpen && (
                <div className="p-3.5 space-y-2 text-xs text-gray-300 bg-black/20 border-t border-white/5">
                  <p>{product.description}</p>
                  <ul className="space-y-1 text-[11px] text-amber-200/90 pt-1">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Fresh & Premium Quality Flowers
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Handcrafted by Expert Artisans
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Perfect for Puja, Gifting & Decoration
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Long Lasting & Fragrant (72h Guarantee)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* OFFERS & COUPONS */}
            {isOfferActive(siteAssets) && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-amber-400 text-black px-2 py-0.5 rounded">
                    {siteAssets.offerCode}
                  </span>
                  <span className="text-xs text-white font-semibold">Flat {siteAssets.offerDiscountPercent}% OFF</span>
                </div>
                <p className="text-[10px] text-amber-200/70 mt-1">
                  {siteAssets.offerMinOrder > 0 ? `Minimum order ₹${siteAssets.offerMinOrder}` : siteAssets.offerBannerText}
                </p>
              </div>

              <button
                onClick={handleCopyCoupon}
                disabled={!isOfferActive(siteAssets)}
                className="px-3 py-1.5 rounded-lg bg-black/50 border border-amber-400 text-amber-300 text-xs font-bold hover:bg-black transition-all flex items-center gap-1 cursor-pointer"
              >
                {copiedCoupon ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCoupon ? 'APPLIED' : isOfferActive(siteAssets) ? 'APPLY' : 'INACTIVE'}</span>
              </button>
            </div>
            )}

            {/* DELIVERY PINCODE CHECKER */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                DELIVERY AVAILABILITY
              </label>
              <form onSubmit={handleCheckPincode} className="flex gap-2">
                <div className="relative flex-1">
                  <MapPin className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="Enter 6-digit Pincode"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-white/20 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-amber-200 transition-all cursor-pointer"
                >
                  Change
                </button>
              </form>
              {pincodeStatus && (
                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  <span>{pincodeStatus}</span>
                </p>
              )}
            </div>

            {/* Sticky Dual Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  if (!isProductAvailable) {
                    showNotification('This product is currently out of stock.');
                    return;
                  }
                  addToCart(product, selectedSize);
                  setIsCartOpen(true);
                }}
                disabled={!isProductAvailable}
                className="py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-[#D4AF37]/50 text-[#F3E5AB] font-extrabold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>ADD TO CART</span>
              </button>

              <button
                onClick={handleInstantBuy}
                disabled={!isProductAvailable}
                className="py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-black text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-black" />
                <span>BUY NOW</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};