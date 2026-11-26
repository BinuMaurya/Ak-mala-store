import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MediaItem, Product, VideoItem } from '../../types';
import { uploadStoreMediaWithAdminToken } from '../../services/mediaStorage';
import { supabase } from '../../services/supabase';
import {
  Upload,
  RefreshCw,
  Trash2,
  Camera,
  Film,
  Check,
  CheckCircle2,
  Sparkles,
  Layers,
  Search,
  ArrowRight,
  ExternalLink,
  Plus,
  Sliders,
  Eye,
  ShoppingBag,
  Tag,
  AlertCircle
} from 'lucide-react';

interface MediaStudioSectionProps {
  onOpenGalleryPicker: (options: {
    title: string;
    subtitle?: string;
    allowedType?: 'all' | 'image' | 'video';
    currentUrl?: string;
    onSelect: (url: string, item?: MediaItem) => void;
  }) => void;
  onSwitchTab?: (tab: 'murti' | 'products' | 'offers' | 'videos' | 'gallery') => void;
}

export const MediaStudioSection: React.FC<MediaStudioSectionProps> = ({
  onOpenGalleryPicker,
  onSwitchTab
}) => {
  const {
    siteAssets,
    adminAccessToken,
    isOwner,
    updateSiteAssets,
    galleryItems,
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    allProducts,
    addProduct,
    updateProduct,
    deleteProduct,
    videosList,
    addVideoItem,
    updateVideoItem,
    deleteVideoItem,
    showNotification
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'upload' | 'replace' | 'delete'>('upload');

  // 1. Upload Form States
  const [uploadSourceType, setUploadSourceType] = useState<'file' | 'url'>('file');
  const [uploadTarget, setUploadTarget] = useState<'murti' | 'gallery' | 'product' | 'video'>('murti');
  const [uploadMediaKind, setUploadMediaKind] = useState<'image' | 'video'>('image');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<string>('ganpati_darshan');
  const [uploadLocation, setUploadLocation] = useState('');
  const [uploadDuration, setUploadDuration] = useState('2:15');
  const [uploadPrice, setUploadPrice] = useState(0);
  const [fileName, setFileName] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // 2. Replace Form States
  const [replaceTargetType, setReplaceTargetType] = useState<'murti' | 'gallery' | 'product' | 'video'>('murti');
  const [selectedReplaceId, setSelectedReplaceId] = useState<string>('');
  const [replaceNewUrl, setReplaceNewUrl] = useState('');
  const [replaceSearchQuery, setReplaceSearchQuery] = useState('');

  // 3. Delete Form States
  const [deleteFilter, setDeleteFilter] = useState<'all' | 'gallery' | 'product' | 'video'>('all');
  const [deleteSearchQuery, setDeleteSearchQuery] = useState('');

  // Upload selected media to shared storage before adding it to the catalog.
  const handleLocalFileInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (mediaUrl: string, file: File) => void
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'];
    const isVid = file.type === 'video/mp4' || file.type === 'video/webm';
    if (!allowedTypes.includes(file.type)) {
      showNotification('Choose JPG, PNG, WEBP, AVIF, MP4, or WEBM media.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showNotification('Media files must be 10 MB or smaller.');
      return;
    }
    if ((uploadTarget === 'murti' || uploadTarget === 'product') && isVid) {
      showNotification('Choose an image for a murti or product photo.');
      return;
    }
    if (uploadTarget === 'video' && !isVid) {
      showNotification('Choose an MP4 or WEBM file for a video clip.');
      return;
    }

    setFileName(file.name);
    if (isVid) setUploadMediaKind('video');
    else setUploadMediaKind('image');
    setIsUploadingMedia(true);
    void (async () => {
      let token = adminAccessToken;
      if (!token && isOwner && supabase) {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        token = data.session?.access_token || null;
      }
      if (!token) throw new Error('Owner session expired. Please unlock the admin panel again.');
      const mediaUrl = await uploadStoreMediaWithAdminToken(file, token);
      onComplete(mediaUrl, file);
    })()
      .catch((error: unknown) => {
        showNotification(error instanceof Error ? error.message : 'Media upload failed.');
      })
      .finally(() => setIsUploadingMedia(false));
  };

  // Execute Upload
  const handleExecuteUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl.trim()) {
      showNotification('Please upload a file or enter an image/video URL first!');
      return;
    }
    if (uploadTarget === 'product' && (!uploadTitle.trim() || !Number.isSafeInteger(uploadPrice) || uploadPrice < 1)) {
      showNotification('Enter the real product name and selling price before creating a product.');
      return;
    }

    if (uploadTarget === 'murti') {
      updateSiteAssets({
        heroGaneshaImage: uploadUrl,
        heroHeadline: uploadTitle ? uploadTitle : siteAssets.heroHeadline
      });
      showNotification('🕉️ Uploaded & dynamically synced with 3D Hero Ganpati Murti!');
    } else if (uploadTarget === 'gallery') {
      if (!uploadTitle.trim()) {
        showNotification('Add a clear title for this gallery upload before saving.');
        return;
      }
      addGalleryItem({
        title: uploadTitle.trim(),
        type: uploadMediaKind,
        url: uploadUrl,
        thumbnailUrl: uploadUrl,
        category: (uploadCategory as any) || 'ganpati_darshan',
        tags: ['Store Upload'],
        location: uploadLocation.trim() || undefined,
        videoDuration: uploadMediaKind === 'video' ? uploadDuration : undefined
      });
      showNotification(`📷 Added "${uploadTitle.trim()}" to Photo & Video Gallery!`);
    } else if (uploadTarget === 'product') {
      const prodName = uploadTitle.trim();
      addProduct({
        id: `mala-${Date.now()}`,
        name: prodName,
        hindiName: `${prodName} माला`,
        marathiName: `${prodName} माळ`,
        category: uploadCategory as Product['category'],
        price: uploadPrice,
        originalPrice: uploadPrice,
        discountPercent: 0,
        rating: 0,
        reviewsCount: 0,
        image: uploadUrl,
        galleryImages: [uploadUrl],
        tags: [],
        flowers: [],
        description: 'Product details must be completed by the store owner before the item is available.',
        hindiDescription: 'उत्पाद उपलब्ध होने से पहले स्टोर मालिक को सही विवरण जोड़ना होगा।',
        availableSizes: [{ size: '16"', name: 'Size to be confirmed', extraPrice: 0 }],
        freshnessHours: 0,
        inStock: false,
        stockQuantity: 0,
        fragranceLevel: 'Subtle',
        bestForDeity: 'Not specified'
      });
      showNotification(`🌺 Created new product: "${prodName}"!`);
    } else if (uploadTarget === 'video') {
      if (!uploadTitle.trim()) {
        showNotification('Add a clear title for this video before saving.');
        return;
      }
      const vidTitle = uploadTitle.trim();
      addVideoItem({
        id: `video-${Date.now()}`,
        title: vidTitle,
        duration: uploadDuration.trim(),
        image: uploadUrl,
        videoUrl: uploadUrl,
        category: 'Store Video'
      });
      showNotification(`🎬 Added new video: "${vidTitle}"!`);
    }

    // Reset upload state
    setUploadUrl('');
    setUploadTitle('');
    setFileName('');
  };

  // Selected item details for Replace view
  const currentMurtiImage = siteAssets.heroGaneshaImage;
  const currentGalleryItem = galleryItems.find((g) => g.id === selectedReplaceId);
  const currentProductItem = allProducts.find((p) => p.id === selectedReplaceId);
  const currentVideoItem = videosList.find((v) => v.id === selectedReplaceId);

  const getOldPreviewUrl = () => {
    if (replaceTargetType === 'murti') return currentMurtiImage;
    if (replaceTargetType === 'gallery') return currentGalleryItem?.url || '';
    if (replaceTargetType === 'product') return currentProductItem?.image || '';
    if (replaceTargetType === 'video') return currentVideoItem?.image || '';
    return '';
  };

  // Execute Replace
  const handleExecuteReplace = () => {
    if (!replaceNewUrl.trim()) {
      showNotification('Please provide a replacement file or URL!');
      return;
    }

    if (replaceTargetType === 'murti') {
      updateSiteAssets({ heroGaneshaImage: replaceNewUrl });
      showNotification('🕉️ 3D Hero Ganpati Murti successfully replaced and live in 3D canvas!');
      setReplaceNewUrl('');
    } else if (replaceTargetType === 'gallery') {
      if (!selectedReplaceId) {
        showNotification('Please select a gallery item to replace');
        return;
      }
      updateGalleryItem(selectedReplaceId, {
        url: replaceNewUrl,
        thumbnailUrl: replaceNewUrl
      });
      showNotification('📷 Gallery item replaced and dynamically updated!');
      setReplaceNewUrl('');
    } else if (replaceTargetType === 'product') {
      if (!selectedReplaceId) {
        showNotification('Please select a product to replace its photo');
        return;
      }
      updateProduct(selectedReplaceId, {
        image: replaceNewUrl,
        galleryImages: [replaceNewUrl]
      });
      showNotification('🌺 Product photo replaced across website and catalog!');
      setReplaceNewUrl('');
    } else if (replaceTargetType === 'video') {
      if (!selectedReplaceId) {
        showNotification('Please select a video to replace');
        return;
      }
      updateVideoItem(selectedReplaceId, {
        image: replaceNewUrl,
        videoUrl: replaceNewUrl
      });
      showNotification('🎬 Video clip/thumbnail replaced!');
      setReplaceNewUrl('');
    }
  };

  // Filtered Media for Delete Section
  const combinedMediaForDelete = [
    ...galleryItems.map((g) => ({
      id: g.id,
      title: g.title,
      type: g.type,
      url: g.thumbnailUrl || g.url,
      source: 'gallery' as const,
      badge: `Gallery • ${g.category.replace('_', ' ')}`
    })),
    ...videosList.map((v) => ({
      id: v.id,
      title: v.title,
      type: 'video' as const,
      url: v.image,
      source: 'video' as const,
      badge: 'Video List'
    })),
    ...allProducts.map((p) => ({
      id: p.id,
      title: p.name,
      type: 'image' as const,
      url: p.image,
      source: 'product' as const,
      badge: `Product • ₹${p.price}`
    }))
  ].filter((item) => {
    const matchesType = deleteFilter === 'all' || item.source === deleteFilter;
    const matchesSearch =
      !deleteSearchQuery.trim() ||
      item.title.toLowerCase().includes(deleteSearchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Studio Header Strip */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#D4AF37]/15 to-transparent border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base sm:text-lg">⚡</span>
            <h4 className="font-cinzel text-base sm:text-lg font-bold text-white">
              Universal Media Studio: Upload, Replace & Delete
            </h4>
            <span className="text-[10px] bg-amber-400 text-black font-extrabold px-2 py-0.5 rounded shadow">
              Live Real-Time Sync
            </span>
          </div>
          <p className="text-xs text-gray-300 max-w-2xl">
            Upload local images/videos from your device, replace existing assets with live 3D Ganpati Murti updates, or delete media across the entire website.
          </p>
        </div>

        {/* 3 Action Switchers */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10 text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('upload')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'upload'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>1. Upload Media</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('replace')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'replace'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>2. Replace Media</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('delete')}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSubTab === 'delete'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>3. Delete Media</span>
          </button>
        </div>
      </div>

      {/* =========================================
          SUB-TAB 1: UPLOAD MEDIA
         ========================================= */}
      {activeSubTab === 'upload' && (
        <form onSubmit={handleExecuteUpload} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Source & Details (7 cols) */}
          <div className="lg:col-span-7 space-y-4 text-xs">
            
            {/* Target Destination Selector */}
            <div>
              <label className="font-bold text-gray-200 block mb-1.5">
                Where do you want to upload this media?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'murti', label: '3D Hero Murti', icon: Sparkles, desc: 'Sets 3D idol' },
                  { id: 'gallery', label: '1,000+ Gallery', icon: Layers, desc: 'Public darshan' },
                  { id: 'product', label: 'Product Mala', icon: ShoppingBag, desc: 'New garland' },
                  { id: 'video', label: 'Video Clip', icon: Film, desc: 'Aarti/Reel' },
                ].map((target) => {
                  const Icon = target.icon;
                  const isSelected = uploadTarget === target.id;
                  return (
                    <button
                      type="button"
                      key={target.id}
                      onClick={() => {
                                        setUploadTarget(target.id as any);
                        if (target.id === 'product') setUploadCategory('festive');
                        else if (target.id === 'gallery') setUploadCategory('ganpati_darshan');
                        if (target.id === 'video') setUploadMediaKind('video');
                        else setUploadMediaKind('image');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className="w-4 h-4 text-amber-400" />
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />}
                      </div>
                      <span className="font-bold text-xs leading-tight block text-white">{target.label}</span>
                      <span className="text-[10px] text-gray-400">{target.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upload Method: Local File vs URL */}
            <div className="p-3.5 rounded-2xl bg-black/50 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-200">Media Source:</span>
                <div className="flex items-center gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setUploadSourceType('file')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      uploadSourceType === 'file'
                        ? 'bg-[#E5C158] text-black shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    📁 Upload from Device
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadSourceType('url')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      uploadSourceType === 'url'
                        ? 'bg-[#E5C158] text-black shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🔗 Web URL
                  </button>
                </div>
              </div>

              {/* File Dropzone / Input */}
              {uploadSourceType === 'file' ? (
                <div className="border-2 border-dashed border-amber-500/40 rounded-2xl p-5 text-center bg-amber-500/[0.02] hover:bg-amber-500/[0.05] transition-all relative">
                  <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2 animate-bounce" style={{ animationDuration: '3s' }} />
                  <p className="text-xs font-bold text-gray-200 mb-1">
                    Click to browse or drop photo / video file from your computer
                  </p>
                  <p className="text-[11px] text-gray-400 mb-3">
                    Supports JPG, PNG, WEBP, GIF, and MP4/WEBM videos
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs uppercase shadow cursor-pointer hover:scale-105 transition-transform">
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => handleLocalFileInput(e, (dataUrl) => setUploadUrl(dataUrl))}
                    />
                  </label>
                  {fileName && (
                    <div className="mt-2 text-xs font-mono text-amber-300 truncate">
                      Selected file: {fileName}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Enter Image or Video URL:</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={uploadUrl}
                      onChange={(e) => setUploadUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... or https://..."
                      className="flex-1 p-2.5 rounded-xl bg-black border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        onOpenGalleryPicker({
                          title: 'Select From Sacred Gallery',
                          allowedType: uploadMediaKind,
                          onSelect: (url) => setUploadUrl(url)
                        })
                      }
                      className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs whitespace-nowrap"
                    >
                      Pick Gallery
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Title / Name */}
            <div>
              <label className="font-bold text-gray-200 block mb-1">
                {uploadTarget === 'murti' ? 'Ganpati Murti Name / Title:' : uploadTarget === 'product' ? 'Product Garland Name:' : 'Title / Caption:'}
              </label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder={uploadTarget === 'murti' ? 'e.g. Siddhivinayak Golden Murti' : uploadTarget === 'product' ? 'e.g. Divine Red Rose & Zari Mala' : 'e.g. Temple Aarti Darshan'}
                className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs"
              />
            </div>

            {/* Target-specific optional details */}
            {uploadTarget === 'gallery' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Category:</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs"
                  >
                    <option value="ganpati_darshan">Ganpati Bappa Darshan</option>
                    <option value="customer_photos">Customer Temple Photos</option>
                    <option value="temple_events">Grand Temple Celebrations</option>
                    <option value="artisan_handcraft">Artisan Garland Weaving</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Location / Tag:</label>
                  <input
                    type="text"
                    value={uploadLocation}
                    onChange={(e) => setUploadLocation(e.target.value)}
                    placeholder="Mumbai Temple Pandal"
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs"
                  />
                </div>
              </div>
            )}

            {uploadTarget === 'product' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Price (₹):</label>
                  <input
                    type="number"
                    value={uploadPrice}
                    onChange={(e) => setUploadPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Category:</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs"
                  >
                    <option value="rose">Rose Mala</option>
                    <option value="mogra">Mogra Mala</option>
                    <option value="marigold">Marigold Mala</option>
                    <option value="orchid">Orchid Mala</option>
                    <option value="tulsi">Tulsi Mala</option>
                    <option value="temple">Temple Mala</option>
                    <option value="wedding">Wedding Mala</option>
                    <option value="festive">Festive Mala</option>
                  </select>
                </div>
              </div>
            )}

            {(uploadTarget === 'video' || (uploadTarget === 'gallery' && uploadMediaKind === 'video')) && (
              <div>
                <label className="font-bold text-gray-300 block mb-1">Video Duration:</label>
                <input
                  type="text"
                  value={uploadDuration}
                  onChange={(e) => setUploadDuration(e.target.value)}
                  placeholder="2:15"
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isUploadingMedia}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-amber-400 to-[#E5C158] text-black font-extrabold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isUploadingMedia ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Uploading Media to Secure Storage...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Execute Upload & Live Sync</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column: Live Preview (5 cols) */}
          <div className="lg:col-span-5 p-4 rounded-2xl bg-black/60 border border-amber-500/30 space-y-3 sticky top-4">
            <h5 className="font-bold text-amber-300 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <Eye className="w-4 h-4" />
              <span>Live Upload Preview</span>
            </h5>
            
            <div className="aspect-video rounded-xl bg-black border border-white/10 overflow-hidden relative flex items-center justify-center">
              {uploadUrl ? (
                uploadMediaKind === 'video' ? (
                  <video src={uploadUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={uploadUrl} alt="Upload Preview" className="w-full h-full object-cover" />
                )
              ) : (
                <div className="text-center p-4 text-gray-500">
                  <Camera className="w-8 h-8 mx-auto mb-1 opacity-40" />
                  <p className="text-[11px]">Upload a file or paste URL to preview</p>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-gray-300">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Target Destination:</span>
                <span className="font-bold text-amber-300 capitalize">{uploadTarget}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">Media Type:</span>
                <span className="font-bold uppercase text-white">{uploadMediaKind}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sync Status:</span>
                <span className="text-emerald-400 font-bold">Ready for Live Sync</span>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* =========================================
          SUB-TAB 2: REPLACE MEDIA
         ========================================= */}
      {activeSubTab === 'replace' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4 text-xs">
            <div>
              <label className="font-bold text-gray-200 block mb-1.5">
                Select Asset Category to Replace:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'murti', label: '3D Hero Murti', icon: Sparkles },
                  { id: 'gallery', label: 'Gallery Item', icon: Layers },
                  { id: 'product', label: 'Product Photo', icon: ShoppingBag },
                  { id: 'video', label: 'Video Item', icon: Film },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = replaceTargetType === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => {
                        setReplaceTargetType(item.id as any);
                        setSelectedReplaceId('');
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className="w-4 h-4 text-amber-400" />
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />}
                      </div>
                      <span className="font-bold text-xs text-white">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {replaceTargetType !== 'murti' && (
              <div className="space-y-2">
                <label className="font-bold text-gray-200 block">
                  Search & Select {replaceTargetType} to Replace:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={replaceSearchQuery}
                    onChange={(e) => setReplaceSearchQuery(e.target.value)}
                    placeholder="Search by title..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                  {(replaceTargetType === 'gallery'
                    ? galleryItems
                    : replaceTargetType === 'product'
                    ? allProducts
                    : videosList
                  )
                    .filter((item: any) =>
                      (item.title || item.name || '')
                        .toLowerCase()
                        .includes(replaceSearchQuery.toLowerCase())
                    )
                    .map((item: any) => {
                      const itemId = item.id;
                      const itemTitle = item.title || item.name;
                      const itemImg = item.url || item.image;
                      const isSelected = selectedReplaceId === itemId;
                      return (
                        <div
                          key={itemId}
                          onClick={() => setSelectedReplaceId(itemId)}
                          className={`p-2 rounded-xl flex items-center gap-3 cursor-pointer border transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-white'
                              : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          <img src={itemImg} alt="" className="w-10 h-10 rounded-lg object-cover" />
                          <div className="flex-1 truncate">
                            <div className="font-bold truncate">{itemTitle}</div>
                            <div className="text-[10px] text-gray-400 font-mono">ID: {itemId}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="font-bold text-gray-200 block">New Replacement Media URL or File:</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={replaceNewUrl}
                  onChange={(e) => setReplaceNewUrl(e.target.value)}
                  placeholder="https://..."
                  className="flex-1 p-2.5 rounded-xl bg-black/60 border border-white/20 text-white font-mono text-xs"
                />
                <label className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs cursor-pointer flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => handleLocalFileInput(e, (url) => setReplaceNewUrl(url))}
                  />
                </label>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExecuteReplace}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-xs uppercase tracking-wider shadow-lg hover:brightness-110 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Execute Live Replacement</span>
            </button>
          </div>

          <div className="lg:col-span-5 p-4 rounded-2xl bg-black/60 border border-amber-500/30 space-y-3">
            <h5 className="font-bold text-amber-300 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <RefreshCw className="w-4 h-4" />
              <span>Before & After Preview</span>
            </h5>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-gray-400 block mb-1 font-bold">CURRENT ASSET</span>
                <div className="aspect-square rounded-xl bg-black border border-white/10 overflow-hidden flex items-center justify-center">
                  {getOldPreviewUrl() ? (
                    <img src={getOldPreviewUrl()} alt="Old" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-gray-500">No selection</span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[10px] text-amber-300 block mb-1 font-bold">NEW REPLACEMENT</span>
                <div className="aspect-square rounded-xl bg-black border border-amber-400/40 overflow-hidden flex items-center justify-center">
                  {replaceNewUrl ? (
                    <img src={replaceNewUrl} alt="New" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-gray-500">Paste new URL</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          SUB-TAB 3: DELETE MEDIA
         ========================================= */}
      {activeSubTab === 'delete' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 text-xs w-full sm:w-auto">
              {(['all', 'gallery', 'product', 'video'] as const).map((filter) => (
                <button
                  type="button"
                  key={filter}
                  onClick={() => setDeleteFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl font-bold uppercase transition-all capitalize cursor-pointer ${
                    deleteFilter === filter
                      ? 'bg-red-600 text-white shadow'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={deleteSearchQuery}
                onChange={(e) => setDeleteSearchQuery(e.target.value)}
                placeholder="Search media to delete..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {combinedMediaForDelete.map((item) => (
              <div
                key={`${item.source}-${item.id}`}
                className="p-3 rounded-2xl bg-black/50 border border-white/10 flex items-center gap-3 group hover:border-red-500/50 transition-all"
              >
                <img src={item.url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded font-mono block w-max mb-1">
                    {item.badge}
                  </span>
                  <h6 className="font-bold text-white text-xs truncate">{item.title}</h6>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (item.source === 'gallery') {
                      deleteGalleryItem(item.id);
                      showNotification(`🗑️ Deleted gallery item: "${item.title}"`);
                    } else if (item.source === 'product') {
                      deleteProduct(item.id);
                      showNotification(`🗑️ Deleted product: "${item.title}"`);
                    } else if (item.source === 'video') {
                      deleteVideoItem(item.id);
                      showNotification(`🗑️ Deleted video: "${item.title}"`);
                    }
                  }}
                  className="p-2.5 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-600 hover:text-white transition-all cursor-pointer shrink-0"
                  title="Delete Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {combinedMediaForDelete.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 text-xs">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-red-400" />
                No media items found matching your filters.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};