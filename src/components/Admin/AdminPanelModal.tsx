import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, MediaItem, VideoItem } from '../../types';
import { MediaGalleryPickerModal } from './MediaGalleryPickerModal';
import { MediaStudioSection } from './MediaStudioSection';
import {
  X,
  Settings,
  Image,
  ShoppingBag,
  Tag,
  Video,
  Layers,
  Save,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Upload,
  Link,
  Flame,
  Camera,
  FolderPlus,
  ExternalLink,
  Film,
  RefreshCw
} from 'lucide-react';

export const AdminPanelModal: React.FC = () => {
  const {
    isAdminOpen,
    setIsAdminOpen,
    siteAssets,
    updateSiteAssets,
    allProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    galleryItems,
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    bulkSeed1000Items,
    clearGallery,
    videosList,
    addVideoItem,
    updateVideoItem,
    deleteVideoItem,
    resetToDefaults,
    showNotification
  } = useApp();

  const [activeTab, setActiveTab] = useState<'media_studio' | 'murti' | 'products' | 'offers' | 'videos' | 'gallery'>('media_studio');

  // Universal local file upload reader helper
  const handleLocalFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      onComplete(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Media Gallery Picker Modal state
  const [pickerConfig, setPickerConfig] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    allowedType: 'all' | 'image' | 'video';
    currentUrl: string;
    onSelect: (url: string, item?: MediaItem) => void;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    allowedType: 'all',
    currentUrl: '',
    onSelect: () => {}
  });

  const openGalleryPicker = (options: {
    title: string;
    subtitle?: string;
    allowedType?: 'all' | 'image' | 'video';
    currentUrl?: string;
    onSelect: (url: string, item?: MediaItem) => void;
  }) => {
    setPickerConfig({
      isOpen: true,
      title: options.title,
      subtitle: options.subtitle || 'Choose from 1,000+ sacred photos and videos in gallery',
      allowedType: options.allowedType || 'all',
      currentUrl: options.currentUrl || '',
      onSelect: options.onSelect
    });
  };

  // Form states for Murti & Hero
  const [murtiUrl, setMurtiUrl] = useState(siteAssets.heroGaneshaImage);
  const [headline, setHeadline] = useState(siteAssets.heroHeadline);
  const [headlineHighlight, setHeadlineHighlight] = useState(siteAssets.heroHeadlineHighlight);
  const [subtitle, setSubtitle] = useState(siteAssets.heroSubtitle);
  const [thaliUrl, setThaliUrl] = useState(siteAssets.customThaliImage);

  // Form states for Offers
  const [offerText, setOfferText] = useState(siteAssets.offerBannerText);
  const [couponCode, setCouponCode] = useState(siteAssets.offerCode);
  const [discountPct, setDiscountPct] = useState(siteAssets.offerDiscountPercent);
  const [freeShipThreshold, setFreeShipThreshold] = useState(siteAssets.freeDeliveryThreshold);

  // New Product Form
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProd, setNewProd] = useState<Partial<Product>>({
    name: 'Ashtavinayak Swarna Mala',
    hindiName: 'अष्टविनायक स्वर्ण माला',
    category: 'festive',
    price: 699,
    originalPrice: 999,
    discountPercent: 30,
    rating: 4.9,
    reviewsCount: 42,
    image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80',
    galleryImages: [],
    tags: ['Best Seller', 'New Arrival'],
    flowers: ['Dutch Red Rose', 'Madurai Mogra'],
    description: 'Fresh divine garland woven with morning dawn plucked blooms and gold zari finish.',
    hindiDescription: 'सुबह के ताजे फूलों और स्वर्ण जरी से निर्मित दिव्य हार।',
    availableSizes: [
      { size: '16"', name: 'Small (16 inch)', extraPrice: 0 },
      { size: '22"', name: 'Medium (22 inch)', extraPrice: 120 },
      { size: '28"', name: 'Large (28 inch)', extraPrice: 250 },
      { size: '36"', name: 'XL (36 inch)', extraPrice: 450 }
    ],
    freshnessHours: 72,
    inStock: true,
    fragranceLevel: 'Divine Sacred',
    bestForDeity: 'Ganpati Bappa'
  });

  // New Gallery Item Form
  const [showAddGallery, setShowAddGallery] = useState(false);
  const [newGalleryItem, setNewGalleryItem] = useState({
    title: 'Ganpati Sthapana Aarti Darshan',
    type: 'image' as 'image' | 'video',
    url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=400&auto=format&fit=crop&q=80',
    category: 'ganpati_darshan' as MediaItem['category'],
    tags: ['Ganesha', 'Aarti', 'Darshan'],
    location: 'Mumbai Pandal',
    videoDuration: '2:15'
  });

  // New Video Item Form
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [newVideo, setNewVideo] = useState<VideoItem>({
    id: `video-${Date.now()}`,
    title: 'Divine Temple Aarti Live Darshan',
    duration: '2:10',
    image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'Aarti'
  });

  if (!isAdminOpen) return null;

  // Preset Murti Presets
  const murtiPresets = [
    {
      name: 'Red & Mogra Golden Ganpati',
      url: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Sacred Jasmine Crowned Idol',
      url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Vibrant Kesariya Genda Murti',
      url: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?w=800&auto=format&fit=crop&q=80'
    },
    {
      name: 'Royal Velvet Red Rose Idol',
      url: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&auto=format&fit=crop&q=80'
    }
  ];

  const handleSaveMurti = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteAssets({
      heroGaneshaImage: murtiUrl,
      heroHeadline: headline,
      heroHeadlineHighlight: headlineHighlight,
      heroSubtitle: subtitle,
      customThaliImage: thaliUrl
    });
  };

  const handleSaveOffers = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteAssets({
      offerBannerText: offerText,
      offerCode: couponCode,
      offerDiscountPercent: Number(discountPct),
      freeDeliveryThreshold: Number(freeShipThreshold)
    });
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price) return;
    const finalProduct: Product = {
      ...newProd,
      id: `mala-${Date.now()}`
    } as Product;
    addProduct(finalProduct);
    setShowAddProduct(false);
  };

  const handleCreateGalleryItem = (e: React.FormEvent) => {
    e.preventDefault();
    addGalleryItem({
      title: newGalleryItem.title,
      type: newGalleryItem.type,
      url: newGalleryItem.url,
      thumbnailUrl: newGalleryItem.thumbnailUrl || newGalleryItem.url,
      category: newGalleryItem.category,
      tags: newGalleryItem.tags,
      location: newGalleryItem.location,
      videoDuration: newGalleryItem.type === 'video' ? newGalleryItem.videoDuration : undefined
    });
    setShowAddGallery(false);
  };

  const handleCreateVideo = (e: React.FormEvent) => {
    e.preventDefault();
    addVideoItem(newVideo);
    setShowAddVideo(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl bg-[#080d19] border-2 border-[#D4AF37] rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#060a14]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2a1d06] to-[#120d02] border border-[#D4AF37] flex items-center justify-center text-[#E5C158] shadow-md">
              <Settings className="w-5 h-5 animate-spin" style={{ animationDuration: '15s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cinzel text-base sm:text-lg font-black text-white">
                  AK MALA Master CMS & Media Studio
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/40">
                  Site Owner Panel
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Change Ganpati Murti, Hero Images, Products, Banners, Videos & 1,000+ Gallery Media
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (window.confirm('Reset all website images, videos, and offers back to original defaults?')) {
                  resetToDefaults();
                }
              }}
              title="Reset to defaults"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/10 border border-red-500/30 text-red-300 text-xs font-semibold hover:bg-red-600/20"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              onClick={() => setIsAdminOpen(false)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center gap-2 px-4 py-2.5 overflow-x-auto border-b border-white/10 bg-black/40 scrollbar-none text-xs">
          {[
            { id: 'media_studio', label: '⚡ Upload, Replace & Delete Studio', icon: Upload },
            { id: 'murti', label: '1. Murti & 3D Hero', icon: Image },
            { id: 'products', label: `2. Products (${allProducts.length})`, icon: ShoppingBag },
            { id: 'offers', label: '3. Offers & Coupons', icon: Tag },
            { id: 'videos', label: `4. Videos (${videosList.length})`, icon: Video },
            { id: 'gallery', label: `5. 1,000+ Gallery (${galleryItems.length})`, icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black shadow-md'
                    : 'text-gray-400 hover:text-white bg-white/5 border border-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          
          {/* PREMIER TAB: MEDIA STUDIO (UPLOAD • REPLACE • DELETE) */}
          {activeTab === 'media_studio' && (
            <MediaStudioSection
              onOpenGalleryPicker={openGalleryPicker}
              onSwitchTab={setActiveTab}
            />
          )}

          {/* TAB 1: MURTI & HERO ASSETS */}
          {activeTab === 'murti' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-cinzel text-base font-bold text-white mb-1">
                  Lord Ganesha Murti & Altar Assets
                </h4>
                <p className="text-xs text-gray-400">
                  Update the primary Ganpati murti photograph, hero headlines, and sacred puja thali visuals in real-time.
                </p>
              </div>

              <form onSubmit={handleSaveMurti} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left 7 cols: Inputs */}
                <div className="lg:col-span-7 space-y-4 text-xs">
                  
                  {/* Murti URL with Gallery Picker */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-gray-200 block">
                        Ganpati Murti Image URL:
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          openGalleryPicker({
                            title: 'Choose Ganpati Murti from Sacred Gallery',
                            subtitle: 'Select any divine Lord Ganesha idol photo from 1,000+ archive',
                            allowedType: 'image',
                            currentUrl: murtiUrl,
                            onSelect: (url) => setMurtiUrl(url)
                          })
                        }
                        className="text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/30 px-2.5 py-0.5 rounded-lg border border-amber-400/40 transition-all cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>✨ गैलरी से चुनें (Pick from Gallery)</span>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        required
                        value={murtiUrl}
                        onChange={(e) => setMurtiUrl(e.target.value)}
                        placeholder="https://..."
                        className="flex-1 p-2.5 rounded-xl bg-black/60 border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                      />
                      <label className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/20 to-emerald-600/30 border border-emerald-400 text-emerald-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-sm">
                        <Upload className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleLocalFileUpload(e, (dataUrl) => {
                              setMurtiUrl(dataUrl);
                              updateSiteAssets({ heroGaneshaImage: dataUrl });
                              showNotification('Uploaded & Live in 3D Hero Ganpati Murti!');
                            })
                          }
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          openGalleryPicker({
                            title: 'Choose Ganpati Murti from Sacred Gallery',
                            subtitle: 'Select any divine Lord Ganesha idol photo from 1,000+ archive',
                            allowedType: 'image',
                            currentUrl: murtiUrl,
                            onSelect: (url) => setMurtiUrl(url)
                          })
                        }
                        className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs uppercase flex items-center gap-1.5 shadow-md whitespace-nowrap cursor-pointer hover:scale-102 transition-transform"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Gallery Pick</span>
                      </button>
                    </div>
                  </div>

                  {/* Sacred Presets Picker */}
                  <div>
                    <span className="text-[11px] font-bold text-amber-300 block mb-1.5">
                      Or Choose From Auspicious Sacred Presets:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {murtiPresets.map((p, idx) => (
                        <button
                          type="button"
                          key={idx}
                          onClick={() => setMurtiUrl(p.url)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            murtiUrl === p.url
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                              : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                          }`}
                        >
                          <img src={p.url} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                          <span className="text-[11px] font-medium leading-tight truncate">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Headline & Highlight */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-gray-200 block mb-1">Hero Title Prefix:</label>
                      <input
                        type="text"
                        value={headline}
                        onChange={(e) => setHeadline(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-200 block mb-1">Highlight Word (Gold):</label>
                      <input
                        type="text"
                        value={headlineHighlight}
                        onChange={(e) => setHeadlineHighlight(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-amber-300 text-xs font-bold"
                      />
                    </div>
                  </div>

                  {/* Subtitle */}
                  <div>
                    <label className="font-bold text-gray-200 block mb-1">Hero Devotional Subtitle:</label>
                    <textarea
                      rows={2}
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs"
                    />
                  </div>

                  {/* Custom Thali image with Gallery Picker */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-gray-200 block">Custom Mala Thali Arrangement Image:</label>
                      <button
                        type="button"
                        onClick={() =>
                          openGalleryPicker({
                            title: 'Choose Puja Thali Image from Gallery',
                            subtitle: 'Select sacred thali floral arrangement photo from 1,000+ archive',
                            allowedType: 'image',
                            currentUrl: thaliUrl,
                            onSelect: (url) => setThaliUrl(url)
                          })
                        }
                        className="text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/30 px-2 py-0.5 rounded-lg border border-amber-400/40 transition-all cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>गैलरी से चुनें</span>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={thaliUrl}
                        onChange={(e) => setThaliUrl(e.target.value)}
                        className="flex-1 p-2.5 rounded-xl bg-black/60 border border-white/20 text-white font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          openGalleryPicker({
                            title: 'Choose Puja Thali Image from Gallery',
                            subtitle: 'Select sacred thali floral arrangement photo from 1,000+ archive',
                            allowedType: 'image',
                            currentUrl: thaliUrl,
                            onSelect: (url) => setThaliUrl(url)
                          })
                        }
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold flex items-center gap-1"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Gallery</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-black text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                  >
                    <Save className="w-4 h-4" />
                    <span>Apply Murti & Asset Changes</span>
                  </button>

                </div>

                {/* Right 5 cols: Live Preview */}
                <div className="lg:col-span-5 p-4 rounded-3xl bg-black/60 border border-amber-500/30 text-center space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    Live Murti Preview
                  </span>
                  <div className="relative h-64 rounded-2xl overflow-hidden border border-amber-500/40">
                    <img src={murtiUrl} alt="Ganpati Murti Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 text-xs font-bold text-white">
                      {headline} {headlineHighlight}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    This image is rendered in the Hero mobile view, product modals, and shared across WhatsApp / social shares.
                  </p>
                </div>

              </form>
            </div>
          )}

          {/* TAB 2: PRODUCTS MANAGER */}
          {activeTab === 'products' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-cinzel text-base font-bold text-white">
                    Products & Divine Garlands Catalog ({allProducts.length})
                  </h4>
                  <p className="text-xs text-gray-400">
                    Add new products, change flower photos, adjust pricing, and toggle in-stock statuses.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs uppercase flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddProduct ? 'Cancel' : 'Add New Mala'}</span>
                </button>
              </div>

              {/* Add Product Drawer / Form */}
              {showAddProduct && (
                <form onSubmit={handleCreateProduct} className="p-5 rounded-2xl bg-[#0c1222] border border-amber-500/40 space-y-4 text-xs animate-in fade-in">
                  <div className="font-bold text-amber-300 text-sm">Add New Garland to Catalog</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Mala Name:</label>
                      <input
                        type="text"
                        required
                        value={newProd.name}
                        onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Hindi Name:</label>
                      <input
                        type="text"
                        value={newProd.hindiName}
                        onChange={(e) => setNewProd({ ...newProd, hindiName: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Selling Price (₹):</label>
                      <input
                        type="number"
                        required
                        value={newProd.price}
                        onChange={(e) => setNewProd({ ...newProd, price: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Original Price (₹):</label>
                      <input
                        type="number"
                        value={newProd.originalPrice}
                        onChange={(e) => setNewProd({ ...newProd, originalPrice: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Category:</label>
                      <select
                        value={newProd.category}
                        onChange={(e) => setNewProd({ ...newProd, category: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white"
                      >
                        <option value="rose">Dutch Red Rose</option>
                        <option value="mogra">Madurai Mogra</option>
                        <option value="marigold">Yellow Genda</option>
                        <option value="festive">Ganpati Special</option>
                        <option value="temple">Grand Temple (36")</option>
                        <option value="wedding">Varmala Pair</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-300 font-bold block">Mala Image URL:</label>
                      <button
                        type="button"
                        onClick={() =>
                          openGalleryPicker({
                            title: 'Choose Garland Photo from Gallery',
                            subtitle: 'Select divine mala photo from 1,000+ sacred collection',
                            allowedType: 'image',
                            currentUrl: newProd.image,
                            onSelect: (url) => setNewProd({ ...newProd, image: url })
                          })
                        }
                        className="text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1 bg-amber-500/15 hover:bg-amber-500/30 px-2.5 py-0.5 rounded-lg border border-amber-400/40 transition-all cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>✨ गैलरी से चुनें (From Gallery)</span>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        required
                        value={newProd.image}
                        onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
                        className="flex-1 p-2.5 rounded-xl bg-black/60 border border-white/20 text-white font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          openGalleryPicker({
                            title: 'Choose Garland Photo from Gallery',
                            subtitle: 'Select divine mala photo from 1,000+ sacred collection',
                            allowedType: 'image',
                            currentUrl: newProd.image,
                            onSelect: (url) => setNewProd({ ...newProd, image: url })
                          })
                        }
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs uppercase flex items-center gap-1.5 shadow whitespace-nowrap cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Gallery Pick</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs uppercase shadow"
                  >
                    Save & Publish Product
                  </button>
                </form>
              )}

              {/* Products Table */}
              <div className="space-y-2">
                {allProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-amber-500/30 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-amber-500/30 shrink-0" />
                      <div className="min-w-0">
                        <h5 className="font-bold text-white truncate">{p.name}</h5>
                        <p className="text-[10px] text-amber-300/80 font-devanagari">{p.hindiName}</p>
                        <span className="text-[10px] text-gray-400 capitalize">{p.category} mala</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-black text-[#F3E5AB]">₹{p.price}</span>
                        <span className="text-[10px] text-gray-500 line-through block">₹{p.originalPrice}</span>
                      </div>

                      {/* Quick Edit Price button */}
                      <button
                        onClick={() => {
                          const newPrice = prompt(`Enter new price for "${p.name}" (current: ₹${p.price}):`, String(p.price));
                          if (newPrice && !isNaN(Number(newPrice))) {
                            updateProduct(p.id, { price: Number(newPrice) });
                          }
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300"
                        title="Edit Price"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Pick Image from Sacred Gallery button */}
                      <button
                        onClick={() =>
                          openGalleryPicker({
                            title: `Select Gallery Photo for "${p.name}"`,
                            subtitle: 'Pick any divine garland photo from 1,000+ sacred collection',
                            allowedType: 'image',
                            currentUrl: p.image,
                            onSelect: (url) => {
                              updateProduct(p.id, { image: url });
                              showNotification(`Photo updated for "${p.name}" from gallery!`);
                            }
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 flex items-center gap-1 cursor-pointer transition-all"
                        title="Choose photo from 1,000+ Gallery (गैलरी से फोटो चुनें)"
                      >
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] font-bold">गैलरी से फोटो</span>
                      </button>

                      {/* Upload / Replace Photo from Device */}
                      <label
                        className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 flex items-center gap-1 cursor-pointer"
                        title="Upload Replacement Photo from Device"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) =>
                            handleLocalFileUpload(e, (dataUrl) => {
                              updateProduct(p.id, { image: dataUrl, galleryImages: [dataUrl] });
                              showNotification(`Photo replaced for "${p.name}"!`);
                            })
                          }
                        />
                      </label>

                      {/* Direct URL edit button */}
                      <button
                        onClick={() => {
                          const newImg = prompt(`Paste new Image URL for "${p.name}":`, p.image);
                          if (newImg) {
                            updateProduct(p.id, { image: newImg });
                          }
                        }}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white"
                        title="Paste custom image URL"
                      >
                        <Link className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${p.name}" from catalog?`)) {
                            deleteProduct(p.id);
                          }
                        }}
                        className="p-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: OFFERS & COUPONS */}
          {activeTab === 'offers' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-cinzel text-base font-bold text-white mb-1">
                  Festive Offers & Coupon Management
                </h4>
                <p className="text-xs text-gray-400">
                  Update the top announcement bar text, discount code, percentage, and free delivery requirements.
                </p>
              </div>

              <form onSubmit={handleSaveOffers} className="max-w-xl space-y-4 text-xs">
                <div>
                  <label className="font-bold text-gray-200 block mb-1">
                    Top Announcement Bar Promo Text:
                  </label>
                  <input
                    type="text"
                    required
                    value={offerText}
                    onChange={(e) => setOfferText(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-gray-200 block mb-1">Coupon Promo Code:</label>
                    <input
                      type="text"
                      required
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full p-2.5 rounded-xl bg-black/60 border border-amber-400 text-amber-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-gray-200 block mb-1">Discount Percentage (%):</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={90}
                      value={discountPct}
                      onChange={(e) => setDiscountPct(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-200 block mb-1">Free Delivery Minimum Cart Total (₹):</label>
                  <input
                    type="number"
                    required
                    value={freeShipThreshold}
                    onChange={(e) => setFreeShipThreshold(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs uppercase tracking-wider shadow-lg hover:opacity-95 cursor-pointer flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Festival Offers</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: VIDEOS MANAGER */}
          {activeTab === 'videos' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-cinzel text-base font-bold text-white">
                    Devotional & Unboxing Videos ({videosList.length})
                  </h4>
                  <p className="text-xs text-gray-400">
                    Add temple aarti videos, unboxing clips, and customer darshan reels.
                  </p>
                </div>

                <button
                  onClick={() => setShowAddVideo(!showAddVideo)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs uppercase flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showAddVideo ? 'Cancel' : 'Add New Video'}</span>
                </button>
              </div>

              {showAddVideo && (
                <form onSubmit={handleCreateVideo} className="p-5 rounded-2xl bg-[#0c1222] border border-amber-500/40 space-y-3 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-amber-300 text-sm">Add New Video</div>
                    <button
                      type="button"
                      onClick={() =>
                        openGalleryPicker({
                          title: 'Choose Devotional Video from Gallery',
                          subtitle: 'Select any sacred Aarti, Pandal darshan or unboxing clip from 1,000+ archive',
                          allowedType: 'video',
                          onSelect: (url, item) => {
                            setNewVideo({
                              ...newVideo,
                              videoUrl: url,
                              image: item?.thumbnailUrl || item?.url || newVideo.image,
                              title: item?.title || newVideo.title,
                              duration: item?.videoDuration || newVideo.duration,
                              category: item?.category ? item.category.replace('_', ' ') : newVideo.category
                            });
                          }
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/30 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-500/30 cursor-pointer"
                    >
                      <Film className="w-3.5 h-3.5" />
                      <span>✨ गैलरी से वीडियो ऑटो-फिल करें (Pick from Gallery)</span>
                    </button>
                  </div>

                  <div>
                    <label className="text-gray-300 font-bold block mb-1">Video Title:</label>
                    <input
                      type="text"
                      required
                      value={newVideo.title}
                      onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                      className="w-full p-2 rounded-xl bg-black/60 border border-white/20 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Duration (e.g. 1:45):</label>
                      <input
                        type="text"
                        value={newVideo.duration}
                        onChange={(e) => setNewVideo({ ...newVideo, duration: e.target.value })}
                        className="w-full p-2 rounded-xl bg-black/60 border border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Category:</label>
                      <input
                        type="text"
                        value={newVideo.category}
                        onChange={(e) => setNewVideo({ ...newVideo, category: e.target.value })}
                        className="w-full p-2 rounded-xl bg-black/60 border border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-300 font-bold block">Thumbnail Image URL:</label>
                      <button
                        type="button"
                        onClick={() =>
                          openGalleryPicker({
                            title: 'Choose Video Thumbnail from Gallery',
                            subtitle: 'Select cover photo for this video',
                            allowedType: 'image',
                            currentUrl: newVideo.image,
                            onSelect: (url) => setNewVideo({ ...newVideo, image: url })
                          })
                        }
                        className="text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1 bg-amber-500/15 px-2.5 py-0.5 rounded-lg border border-amber-400/40 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-amber-400" />
                        <span>गैलरी से थंबनेल चुनें</span>
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        required
                        value={newVideo.image}
                        onChange={(e) => setNewVideo({ ...newVideo, image: e.target.value })}
                        className="flex-1 p-2 rounded-xl bg-black/60 border border-white/20 text-white font-mono text-xs"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          openGalleryPicker({
                            title: 'Choose Video Thumbnail from Gallery',
                            subtitle: 'Select cover photo for this video',
                            allowedType: 'image',
                            currentUrl: newVideo.image,
                            onSelect: (url) => setNewVideo({ ...newVideo, image: url })
                          })
                        }
                        className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Gallery Pick</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs uppercase"
                  >
                    Save Video
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {videosList.map((v) => (
                  <div key={v.id} className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <img src={v.image} alt={v.title} className="w-14 h-14 rounded-xl object-cover border border-amber-500/30 shrink-0" />
                      <div>
                        <h5 className="font-bold text-white line-clamp-1">{v.title}</h5>
                        <span className="text-[10px] text-amber-300 font-mono">Duration: {v.duration}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Replace Video Thumbnail / File */}
                      <label
                        className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        title="Upload Replacement Video / Thumbnail from Device"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Replace</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(e) =>
                            handleLocalFileUpload(e, (dataUrl) => {
                              updateVideoItem(v.id, { image: dataUrl, videoUrl: dataUrl });
                              showNotification(`Replaced video media for "${v.title}"!`);
                            })
                          }
                        />
                      </label>

                      <button
                        onClick={() => deleteVideoItem(v.id)}
                        className="p-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400"
                        title="Delete Video"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: 1000+ GALLERY MANAGER */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-cinzel text-base font-bold text-white">
                    1,000+ Media Gallery Manager (Currently {galleryItems.length} items)
                  </h4>
                  <p className="text-xs text-gray-400">
                    Store and organize up to 1,000 sacred photos & videos of Ganpati darshan, temple pujas, and customers.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      openGalleryPicker({
                        title: 'Browse Sacred Media Gallery',
                        subtitle: 'Visual browser for 1,000+ devotional photos and videos',
                        allowedType: 'all',
                        onSelect: (url) => {
                          showNotification('Selected media URL copied to use anywhere!');
                        }
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-500/25 cursor-pointer"
                  >
                    <Layers className="w-4 h-4" />
                    <span>Visual Picker Grid</span>
                  </button>

                  <button
                    onClick={bulkSeed1000Items}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-700/20 border border-amber-400/50 text-amber-300 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generate 1,000 Items</span>
                  </button>

                  <button
                    onClick={() => setShowAddGallery(!showAddGallery)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs uppercase flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Photo/Video</span>
                  </button>
                </div>
              </div>

              {/* Add Media Form */}
              {showAddGallery && (
                <form onSubmit={handleCreateGalleryItem} className="p-5 rounded-2xl bg-[#0c1222] border border-amber-500/40 space-y-3 text-xs animate-in fade-in">
                  <div className="font-bold text-amber-300 text-sm">Add New Item into Gallery</div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Title:</label>
                      <input
                        type="text"
                        required
                        value={newGalleryItem.title}
                        onChange={(e) => setNewGalleryItem({ ...newGalleryItem, title: e.target.value })}
                        className="w-full p-2 rounded-xl bg-black/60 border border-white/20 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Location / Temple:</label>
                      <input
                        type="text"
                        value={newGalleryItem.location}
                        onChange={(e) => setNewGalleryItem({ ...newGalleryItem, location: e.target.value })}
                        className="w-full p-2 rounded-xl bg-black/60 border border-white/20 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Media Type:</label>
                      <select
                        value={newGalleryItem.type}
                        onChange={(e) => setNewGalleryItem({ ...newGalleryItem, type: e.target.value as any })}
                        className="w-full p-2 rounded-xl bg-black/60 border border-white/20 text-white"
                      >
                        <option value="image">Photo / Darshan Image</option>
                        <option value="video">Aarti / Reel Video</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-gray-300 font-bold block mb-1">Category:</label>
                      <select
                        value={newGalleryItem.category}
                        onChange={(e) => setNewGalleryItem({ ...newGalleryItem, category: e.target.value as any })}
                        className="w-full p-2 rounded-xl bg-black/60 border border-white/20 text-white"
                      >
                        <option value="ganpati_darshan">Ganpati Bappa Darshan</option>
                        <option value="customer_photos">Customer Temple Photos</option>
                        <option value="temple_events">Grand Temple Celebrations</option>
                        <option value="artisan_handcraft">Artisan Garland Weaving</option>
                        <option value="varmala_wedding">Royal Wedding Varmala</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-gray-300 font-bold block">Media Image/Video URL or File:</label>
                      <label className="text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1 bg-amber-500/15 px-2.5 py-0.5 rounded-lg border border-amber-400/40 cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-amber-400" />
                        <span>📁 Upload from Device</span>
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="hidden"
                          onChange={(e) =>
                            handleLocalFileUpload(e, (dataUrl) => {
                              setNewGalleryItem({
                                ...newGalleryItem,
                                url: dataUrl,
                                thumbnailUrl: dataUrl
                              });
                              showNotification('Local media file loaded!');
                            })
                          }
                        />
                      </label>
                    </div>
                    <input
                      type="url"
                      required
                      value={newGalleryItem.url}
                      onChange={(e) => setNewGalleryItem({ ...newGalleryItem, url: e.target.value })}
                      className="w-full p-2 rounded-xl bg-black/60 border border-white/20 text-white font-mono"
                      placeholder="Paste URL or use button above to upload file"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs uppercase"
                  >
                    Add to Sacred Gallery
                  </button>
                </form>
              )}

              {/* Sample list of items with Quick Action Buttons */}
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
                  <span>
                    Showing top {Math.min(galleryItems.length, 30)} of {galleryItems.length} media items:
                  </span>
                  <span className="text-amber-300">
                    Use one-click buttons to set as Murti, Product, or Video!
                  </span>
                </div>
                {galleryItems.slice(0, 30).map((g) => (
                  <div key={g.id} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-amber-500/30 flex items-center justify-between text-xs gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={g.thumbnailUrl || g.url} alt={g.title} className="w-12 h-12 rounded-lg object-cover border border-amber-500/30 shrink-0" />
                      <div className="min-w-0">
                        <h6 className="font-bold text-white truncate max-w-xs">{g.title}</h6>
                        <span className="text-[10px] text-amber-300/80 capitalize">{g.type} • {g.category.replace('_', ' ')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* One-click Set Murti */}
                      {g.type === 'image' && (
                        <button
                          type="button"
                          onClick={() => {
                            updateSiteAssets({ heroGaneshaImage: g.url });
                            setMurtiUrl(g.url);
                            showNotification(`🕉️ Lord Ganesha Murti set to "${g.title}"!`);
                          }}
                          className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 border border-amber-400/30 text-amber-300 text-[10px] font-bold whitespace-nowrap cursor-pointer"
                          title="Set as Ganpati Murti on Website"
                        >
                          🕉️ Set Murti
                        </button>
                      )}

                      {/* One-click Make Product */}
                      {g.type === 'image' && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewProd((prev) => ({
                              ...prev,
                              name: g.title,
                              hindiName: `${g.title} माला`,
                              image: g.url
                            }));
                            setShowAddProduct(true);
                            setActiveTab('products');
                            showNotification(`Switched to Add Product with photo "${g.title}"!`);
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold whitespace-nowrap cursor-pointer"
                          title="Create new Product from this photo"
                        >
                          🌺 Make Product
                        </button>
                      )}

                      {/* One-click Add to Videos */}
                      {g.type === 'video' && (
                        <button
                          type="button"
                          onClick={() => {
                            addVideoItem({
                              id: `video-${Date.now()}`,
                              title: g.title,
                              duration: g.videoDuration || '2:30',
                              image: g.thumbnailUrl || g.url,
                              videoUrl: g.url,
                              category: g.category.replace('_', ' ')
                            });
                            showNotification(`🎬 Added "${g.title}" to Videos tab!`);
                          }}
                          className="px-2 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/25 border border-blue-400/30 text-blue-300 text-[10px] font-bold whitespace-nowrap cursor-pointer"
                          title="Add to Videos tab"
                        >
                          🎬 Add to Videos
                        </button>
                      )}

                      {/* Direct Replace File from Device */}
                      <label
                        className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-amber-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                        title="Upload Replacement File from Device"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Replace</span>
                        <input
                          type="file"
                          accept={g.type === 'video' ? 'video/*' : 'image/*'}
                          className="hidden"
                          onChange={(e) =>
                            handleLocalFileUpload(e, (dataUrl) => {
                              updateGalleryItem(g.id, { url: dataUrl, thumbnailUrl: dataUrl });
                              showNotification(`Replaced media for "${g.title}"!`);
                            })
                          }
                        />
                      </label>

                      {/* Delete */}
                      <button
                        onClick={() => deleteGalleryItem(g.id)}
                        className="p-1.5 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20"
                        title="Delete from Gallery"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* Global Media Gallery Picker Modal */}
        <MediaGalleryPickerModal
          isOpen={pickerConfig.isOpen}
          onClose={() => setPickerConfig((prev) => ({ ...prev, isOpen: false }))}
          onSelect={pickerConfig.onSelect}
          title={pickerConfig.title}
          subtitle={pickerConfig.subtitle}
          allowedType={pickerConfig.allowedType}
          currentSelectedUrl={pickerConfig.currentUrl}
        />

      </div>
    </div>
  );
};
