import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MediaItem, Product, VideoItem } from '../../types';
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
  const [uploadLocation, setUploadLocation] = useState('Mumbai Temple Pandal');
  const [uploadDuration, setUploadDuration] = useState('2:15');
  const [uploadPrice, setUploadPrice] = useState(599);
  const [fileName, setFileName] = useState('');

  // 2. Replace Form States
  const [replaceTargetType, setReplaceTargetType] = useState<'murti' | 'gallery' | 'product' | 'video'>('murti');
  const [selectedReplaceId, setSelectedReplaceId] = useState<string>('');
  const [replaceNewUrl, setReplaceNewUrl] = useState('');
  const [replaceSearchQuery, setReplaceSearchQuery] = useState('');

  // 3. Delete Form States
  const [deleteFilter, setDeleteFilter] = useState<'all' | 'gallery' | 'product' | 'video'>('all');
  const [deleteSearchQuery, setDeleteSearchQuery] = useState('');

  // Universal File Reader Helper (handles local files -> base64 data URIs)
  const handleLocalFileInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (dataUrl: string, file: File) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const isVid = file.type.startsWith('video');
    if (isVid) {
      setUploadMediaKind('video');
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onComplete(result, file);
    };
    reader.readAsDataURL(file);
  };

  // Execute Upload
  const handleExecuteUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl.trim()) {
      showNotification('Please upload a file or enter an image/video URL first!');
      return;
    }

    if (uploadTarget === 'murti') {
      updateSiteAssets({
        heroGaneshaImage: uploadUrl,
        heroHeadline: uploadTitle ? uploadTitle : siteAssets.heroHeadline
      });
      showNotification('🕉️ Uploaded & dynamically synced with 3D Hero Ganpati Murti!');
    } else if (uploadTarget === 'gallery') {
      addGalleryItem({
        title: uploadTitle.trim() || 'Sacred Devotional Darshan',
        type: uploadMediaKind,
        url: uploadUrl,
        thumbnailUrl: uploadUrl,
        category: (uploadCategory as any) || 'ganpati_darshan',
        tags: ['New Upload', 'Sacred', 'Darshan'],
        location: uploadLocation || 'India',
        videoDuration: uploadMediaKind === 'video' ? uploadDuration : undefined
      });
      showNotification(`📷 Added "${uploadTitle || 'Media'}" to 1,000+ Gallery!`);
    } else if (uploadTarget === 'product') {
      const prodName = uploadTitle.trim() || 'Divine Swarna Mala';
      addProduct({
        id: `mala-${Date.now()}`,
        name: prodName,
        hindiName: `${prodName} माला`,
        marathiName: `${prodName} माळ`,
        category: (uploadCategory as any) || 'festive',
        price: uploadPrice || 599,
        originalPrice: Math.round((uploadPrice || 599) * 1.35),
        discountPercent: 25,
        rating: 4.9,
        reviewsCount: 1,
        image: uploadUrl,
        galleryImages: [uploadUrl],
        tags: ['New Arrival', 'Handcrafted'],
        flowers: ['Fresh Morning Blooms'],
        description: 'Pristine divine garland lovingly handwoven for worship.',
        hindiDescription: 'विशेष पूजा हेतु प्रातःकाल के ताजे पवित्र पुष्पों से निर्मित माला।',
        availableSizes: [
          { size: '16"', name: 'Small (16")', extraPrice: 0 },
          { size: '22"', name: 'Medium (22")', extraPrice: 120 },
          { size: '28"', name: 'Large (28")', extraPrice: 250 },
          { size: '36"', name: 'XL (36")', extraPrice: 450 }
        ],
        freshnessHours: 72,
        inStock: true,
        fragranceLevel: 'Divine Sacred',
        bestForDeity: 'Ganpati Bappa'
      });
      showNotification(`🌺 Created new product: "${prodName}"!`);
    } else if (uploadTarget === 'video') {
      const vidTitle = uploadTitle.trim() || 'Temple Aarti Darshan Video';
      addVideoItem({
        id: `video-${Date.now()}`,
        title: vidTitle,
        duration: uploadDuration || '2:15',
        image: uploadUrl,
        videoUrl: uploadUrl,
        category: 'Aarti & Unboxing'
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
                    <span>Browse Local Files</span>
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
                    <option value="varmala_wedding">Royal Wedding Varmala</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Location / Temple:</label>
                  <input
                    type="text"
                    value={uploadLocation}
                    onChange={(e) => setUploadLocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs"
                  />
                </div>
              </div>
            )}

            {uploadTarget === 'product' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Selling Price (₹):</label>
                  <input
                    type="number"
                    value={uploadPrice}
                    onChange={(e) => setUploadPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-300 block mb-1">Flower Category:</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs"
                  >
                    <option value="rose">Dutch Red Rose</option>
                    <option value="mogra">Madurai Mogra</option>
                    <option value="marigold">Yellow Genda</option>
                    <option value="festive">Ganpati Special</option>
                    <option value="temple">Grand Temple (36")</option>
                  </select>
                </div>
              </div>
            )}

            {uploadTarget === 'video' && (
              <div>
                <label className="font-bold text-gray-300 block mb-1">Video Duration (e.g. 2:15):</label>
                <input
                  type="text"
                  value={uploadDuration}
                  onChange={(e) => setUploadDuration(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs"
                />
              </div>
            )}

            {/* Publish Button */}
            <button
              type="submit"
              disabled={!uploadUrl}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-black text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              <Upload className="w-4 h-4 stroke-[2.5]" />
              <span>Upload & Publish to {uploadTarget.toUpperCase()}</span>
            </button>
          </div>

          {/* Right Column: Live Upload Preview (5 cols) */}
          <div className="lg:col-span-5 p-4 rounded-3xl bg-black/60 border border-amber-500/30 text-center space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              Live Upload Preview
            </span>

            <div className="relative h-64 rounded-2xl overflow-hidden border border-amber-500/40 bg-black flex items-center justify-center">
              {uploadUrl ? (
                uploadMediaKind === 'video' && uploadUrl.startsWith('data:video') ? (
                  <video src={uploadUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={uploadUrl} alt="Upload preview" className="w-full h-full object-cover" />
                )
              ) : (
                <div className="text-gray-500 space-y-2 p-4">
                  <Camera className="w-10 h-10 mx-auto text-amber-500/40" />
                  <p className="text-xs">No media uploaded yet.</p>
                  <p className="text-[11px] text-gray-500">
                    Select a local file or paste a URL on the left to see instant preview.
                  </p>
                </div>
              )}

              {uploadUrl && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 text-left">
                  <span className="text-[10px] bg-amber-400 text-black font-extrabold px-1.5 py-0.5 rounded uppercase">
                    Target: {uploadTarget}
                  </span>
                  <p className="text-xs font-bold text-white mt-1 truncate">
                    {uploadTitle || 'Ready to Publish'}
                  </p>
                </div>
              )}
            </div>

            {uploadTarget === 'murti' && (
              <p className="text-[11px] text-amber-300/80 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 text-left">
                ✨ <strong>Instant 3D Hero Sync:</strong> Publishing here immediately binds this texture to the 3D rotating Ganesha shrine on the homepage!
              </p>
            )}
          </div>

        </form>
      )}

      {/* =========================================
          SUB-TAB 2: REPLACE MEDIA WIZARD
         ========================================= */}
      {activeSubTab === 'replace' && (
        <div className="space-y-6 text-xs">
          
          {/* Step 1: Select Target Type */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <label className="font-bold text-gray-200 block">
              Step 1: What would you like to replace?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'murti', label: '🕉️ 3D Hero Ganpati Murti', desc: 'Main deity idol' },
                { id: 'gallery', label: '📷 Gallery Photo/Video', desc: 'From 1,000+ items' },
                { id: 'product', label: '🌺 Product Garland Photo', desc: 'From catalog' },
                { id: 'video', label: '🎬 Video Reel / Clip', desc: 'Temple & Darshan' },
              ].map((t) => {
                const isSelected = replaceTargetType === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => {
                      setReplaceTargetType(t.id as any);
                      setSelectedReplaceId('');
                      setReplaceNewUrl('');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <span className="font-bold text-xs block text-white">{t.label}</span>
                    <span className="text-[10px] text-gray-400">{t.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Choose which specific item to replace (if not Murti) */}
          {replaceTargetType !== 'murti' && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-gray-200">
                  Step 2: Select the specific {replaceTargetType} to replace:
                </label>
                <div className="relative w-60">
                  <input
                    type="text"
                    value={replaceSearchQuery}
                    onChange={(e) => setReplaceSearchQuery(e.target.value)}
                    placeholder="Search by title..."
                    className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-black border border-white/20 text-xs text-white"
                  />
                  <Search className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-2" />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {(replaceTargetType === 'gallery' ? galleryItems : replaceTargetType === 'product' ? allProducts : videosList)
                  .filter((item: any) =>
                    !replaceSearchQuery.trim() ||
                    (item.title || item.name).toLowerCase().includes(replaceSearchQuery.toLowerCase())
                  )
                  .slice(0, 30)
                  .map((item: any) => {
                    const isSelected = selectedReplaceId === item.id;
                    const img = item.thumbnailUrl || item.url || item.image;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedReplaceId(item.id)}
                        className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/80 text-white'
                            : 'bg-white/5 border-white/10 hover:border-white/25 text-gray-400'
                        }`}
                      >
                        <img src={img} alt={item.title || item.name} className="w-full h-16 object-cover rounded-lg mb-1" />
                        <span className="text-[10px] font-bold line-clamp-1 text-white block">
                          {item.title || item.name}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Step 3: Provide New Image/Video (Local file upload, URL, or Gallery Pick) */}
          <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <label className="font-bold text-gray-200 block">
              Step 3: Provide the New Replacement Photo or Video:
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Local File Selector */}
              <label className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/30 border border-amber-400/60 text-amber-200 font-bold text-xs flex items-center gap-2 cursor-pointer hover:bg-amber-500/30 whitespace-nowrap shadow-sm">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Upload New File from Device</span>
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => handleLocalFileInput(e, (dataUrl) => setReplaceNewUrl(dataUrl))}
                />
              </label>

              <span className="text-gray-500 font-bold text-xs">OR</span>

              {/* URL Input */}
              <input
                type="url"
                value={replaceNewUrl}
                onChange={(e) => setReplaceNewUrl(e.target.value)}
                placeholder="Paste new Image / Video URL..."
                className="flex-1 p-2.5 rounded-xl bg-black border border-white/20 text-white font-mono text-xs"
              />

              {/* Gallery Pick button */}
              <button
                type="button"
                onClick={() =>
                  onOpenGalleryPicker({
                    title: 'Pick Replacement from Sacred Gallery',
                    onSelect: (url) => setReplaceNewUrl(url)
                  })
                }
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold text-xs whitespace-nowrap cursor-pointer"
              >
                Pick from Gallery
              </button>
            </div>
          </div>

          {/* Step 4: Before & After Live Comparison Box */}
          <div className="p-5 rounded-2xl bg-[#060a14] border border-amber-500/40 space-y-4">
            <h5 className="font-cinzel text-xs font-bold text-amber-300 uppercase tracking-wider text-center">
              Before & After Replacement Comparison
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Current Asset */}
              <div className="p-3 rounded-xl bg-black/60 border border-white/10 text-center">
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1.5">
                  Current Image ({replaceTargetType})
                </span>
                <div className="h-44 rounded-lg overflow-hidden border border-white/10 bg-black flex items-center justify-center">
                  {getOldPreviewUrl() ? (
                    <img src={getOldPreviewUrl()} alt="Current asset" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-gray-500 text-xs">Select an item above to view current image</span>
                  )}
                </div>
              </div>

              {/* New Replacement Asset */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/40 text-center">
                <span className="text-[10px] text-amber-300 uppercase font-bold block mb-1.5">
                  New Replacement Image
                </span>
                <div className="h-44 rounded-lg overflow-hidden border border-amber-500/40 bg-black flex items-center justify-center">
                  {replaceNewUrl ? (
                    <img src={replaceNewUrl} alt="Replacement asset" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-amber-400/60 text-xs">Upload new file or paste URL to preview</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={!replaceNewUrl || (replaceTargetType !== 'murti' && !selectedReplaceId)}
              onClick={handleExecuteReplace}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4 stroke-[2.5]" />
              <span>Confirm & Apply Replacement</span>
            </button>
          </div>

        </div>
      )}

      {/* =========================================
          SUB-TAB 3: DELETE MEDIA MANAGER
         ========================================= */}
      {activeSubTab === 'delete' && (
        <div className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-black/40 border border-white/10">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={deleteSearchQuery}
                onChange={(e) => setDeleteSearchQuery(e.target.value)}
                placeholder="Search media by title or name..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-black border border-white/20 text-xs text-white"
              />
              <Search className="w-3.5 h-3.5 text-amber-400 absolute left-2.5 top-2" />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/60 border border-white/10 text-xs">
              {(['all', 'gallery', 'product', 'video'] as const).map((filterId) => (
                <button
                  type="button"
                  key={filterId}
                  onClick={() => setDeleteFilter(filterId)}
                  className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all ${
                    deleteFilter === filterId
                      ? 'bg-amber-400 text-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {filterId}
                </button>
              ))}
            </div>
          </div>

          {/* Media Items Table */}
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            <span className="text-[11px] text-gray-400 block mb-1">
              Found {combinedMediaForDelete.length} media items. Click Delete to remove from website:
            </span>

            {combinedMediaForDelete.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No media items found.</div>
            ) : (
              combinedMediaForDelete.slice(0, 50).map((item) => (
                <div
                  key={`${item.source}-${item.id}`}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/10 hover:border-red-500/30 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img src={item.url} alt={item.title} className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0" />
                    <div className="min-w-0">
                      <h6 className="font-bold text-white truncate max-w-sm">{item.title}</h6>
                      <span className="text-[10px] text-amber-300 font-mono capitalize">
                        {item.badge}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Quick Replace Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        setReplaceTargetType(item.source as any);
                        setSelectedReplaceId(item.id);
                        setActiveSubTab('replace');
                        showNotification(`Ready to replace "${item.title}"`);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-400/30 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Replace</span>
                    </button>

                    {/* Delete Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to permanently delete "${item.title}"?`)) {
                          if (item.source === 'gallery') {
                            deleteGalleryItem(item.id);
                          } else if (item.source === 'product') {
                            deleteProduct(item.id);
                          } else if (item.source === 'video') {
                            deleteVideoItem(item.id);
                          }
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/25 text-red-400 border border-red-500/30 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
};
