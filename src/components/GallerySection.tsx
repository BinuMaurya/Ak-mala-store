import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { LazyImage } from './common/LazyImage';
import { MediaItem } from '../types';
import { trackEvent } from '../services/analytics';
import {
  Sparkles,
  Camera,
  Video,
  Search,
  Filter,
  Heart,
  Eye,
  Play,
  X,
  Share2,
  PlusCircle,
  Layers,
  MapPin,
  Calendar,
  Download,
  Flame,
  Trash2,
  RefreshCw
} from 'lucide-react';

export const GallerySection: React.FC = () => {
  const {
    galleryItems,
    deleteGalleryItem,
    bulkSeed1000Items,
    setIsAdminOpen,
    showNotification,
    updateSiteAssets,
    setIsCustomBuilderOpen
  } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [displayCount, setDisplayCount] = useState(24);
  const [activeLightboxItem, setActiveLightboxItem] = useState<MediaItem | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('ak_mala_gallery_likes');
      return saved ? JSON.parse(saved) as Record<string, boolean> : {};
    } catch {
      return {};
    }
  });

  const categories = [
    { id: 'all', label: 'All Devotional Media' },
    { id: 'ganpati_darshan', label: 'Ganpati Bappa Darshan' },
    { id: 'customer_photos', label: 'Devotee Temple Photos' },
    { id: 'temple_events', label: 'Grand Temple Celebrations' },
    { id: 'artisan_handcraft', label: 'Artisan Garland Weaving' },
    { id: 'varmala_wedding', label: 'Royal Wedding Varmala' },
  ];

  // Fast memoized filtering
  const filteredItems = useMemo(() => {
    return galleryItems.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesType = mediaTypeFilter === 'all' || item.type === mediaTypeFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesType && matchesSearch;
    });
  }, [galleryItems, activeCategory, mediaTypeFilter, searchQuery]);

  const visibleItems = filteredItems.slice(0, displayCount);

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const isRemovingLike = Boolean(likedMap[id]);
    const nextLikes = { ...likedMap, [id]: !isRemovingLike };
    setLikedMap(nextLikes);
    localStorage.setItem('ak_mala_gallery_likes', JSON.stringify(nextLikes));
    trackEvent(isRemovingLike ? 'gallery_unlike' : 'gallery_like', id);
    showNotification(isRemovingLike ? 'Removed like' : 'Blessed with your devotional like! ❤️');
  };

  return (
    <section id="devotional-gallery" className="py-16 bg-[#040711] border-t border-[#D4AF37]/20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Stats Banner */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#E5C158]" />
              <span>Sacred Darshan & UGC Archive</span>
            </div>
            <h2 className="font-cinzel text-3xl sm:text-4xl font-extrabold text-white">
              Devotional Gallery & Darshan Archive
            </h2>
            <p className="font-playfair italic text-xs sm:text-sm text-amber-200/80 mt-1 max-w-2xl">
              Explore over 1,000+ divine garland darshans, unboxings, temple rituals, and handcrafted artisan stories from devotees across India.
            </p>
          </div>

          {/* Quick Actions (Admin Add & 1000+ Generator) */}
          <div className="flex flex-wrap items-center gap-2">
            {galleryItems.length < 500 && (
              <button
                onClick={bulkSeed1000Items}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-700/20 border border-amber-400/40 text-amber-300 text-xs font-bold hover:bg-amber-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Load 1,000+ Sacred Media</span>
              </button>
            )}

            <button
              onClick={() => setIsAdminOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black text-xs font-black uppercase tracking-wider shadow-md hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Admin: Add Photo/Video</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-2xl bg-[#090e1c] border border-white/10 mb-8 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by temple, city, flower, or deity..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-amber-400"
              />
              <Search className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
            </div>

            {/* Media Type Filter (Photos / Videos / All) */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/50 border border-white/10 text-xs">
              <button
                onClick={() => setMediaTypeFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  mediaTypeFilter === 'all'
                    ? 'bg-[#E5C158] text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All ({galleryItems.length})
              </button>
              <button
                onClick={() => setMediaTypeFilter('image')}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  mediaTypeFilter === 'image'
                    ? 'bg-[#E5C158] text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Photos</span>
              </button>
              <button
                onClick={() => setMediaTypeFilter('video')}
                className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  mediaTypeFilter === 'video'
                    ? 'bg-[#E5C158] text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Videos</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold shadow-md'
                    : 'bg-white/5 border border-white/10 text-gray-300 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid (Responsive 4-column with IntersectionObserver Lazy Loading) */}
        {visibleItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400 space-y-2">
            <Camera className="w-10 h-10 text-amber-500/50 mx-auto" />
            <p className="text-sm font-semibold text-gray-200">No media found matching your filter</p>
            <p className="text-xs">Try selecting a different category or clear search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {visibleItems.map((item) => {
              const isLiked = likedMap[item.id];
              return (
                <div
                  key={item.id}
                  onClick={() => setActiveLightboxItem(item)}
                  className="group relative rounded-2xl bg-[#090d18] border border-[#D4AF37]/25 hover:border-[#E5C158] overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                >
                  {/* Media Thumbnail with LazyImage */}
                  <div className="relative h-56 overflow-hidden bg-black/40">
                    <LazyImage
                      src={item.thumbnailUrl || item.url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#090d18] via-transparent to-black/30" />

                    {/* Type Badge: Video or Photo */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                      {item.type === 'video' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-red-600/90 text-white px-2 py-0.5 rounded-full shadow-md backdrop-blur-xs">
                          <Play className="w-2.5 h-2.5 fill-current" />
                          <span>{item.videoDuration || 'Video'}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-black/70 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full shadow-md backdrop-blur-xs">
                          <Camera className="w-2.5 h-2.5" />
                          <span>HD Darshan</span>
                        </span>
                      )}
                    </div>

                    {/* Like Heart Button */}
                    <button
                      onClick={(e) => handleLike(item.id, e)}
                      className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md border transition-all ${
                        isLiked
                          ? 'bg-red-600 text-white border-red-500 shadow-md'
                          : 'bg-black/50 text-gray-300 border-white/20 hover:text-red-400'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                    </button>

                    {/* Center Play Button for Videos */}
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info Card Body */}
                  <div className="p-3.5 space-y-1.5">
                    <h4 className="text-xs font-bold text-gray-100 group-hover:text-amber-300 line-clamp-1 transition-colors">
                      {item.title}
                    </h4>

                    {item.location && (
                      <p className="text-[10px] text-gray-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-gray-500">
                      <span>{item.date}</span>
                      <span className="text-amber-400 font-medium">Devotee Blessings</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button for Infinite 1000 items browsing */}
        {displayCount < filteredItems.length && (
          <div className="mt-10 text-center">
            <button
              onClick={() => setDisplayCount((prev) => Math.min(prev + 24, filteredItems.length))}
              className="px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-[#D4AF37]/40 text-amber-200 font-bold text-xs uppercase tracking-wider hover:border-[#E5C158] transition-all shadow-md cursor-pointer"
            >
              Load More Sacred Darshans ({filteredItems.length - displayCount} Remaining)
            </button>
          </div>
        )}

      </div>

      {/* Lightbox / Video Player Modal */}
      {activeLightboxItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-3xl bg-[#090d18] border-2 border-[#D4AF37] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            
            {/* Lightbox Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#060a14]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#E5C158] uppercase">
                  {activeLightboxItem.type === 'video' ? '🎬 Sacred Video Darshan' : '📷 Divine Photo Darshan'}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-xs text-gray-300 font-medium truncate max-w-xs">
                  {activeLightboxItem.title}
                </span>
              </div>

              <button
                onClick={() => setActiveLightboxItem(null)}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Content */}
            <div className="flex-1 bg-black flex items-center justify-center overflow-hidden max-h-[60vh]">
              {activeLightboxItem.type === 'video' ? (
                <div className="w-full h-full relative aspect-video flex items-center justify-center bg-gray-900">
                  <img
                    src={activeLightboxItem.url}
                    alt={activeLightboxItem.title}
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black flex items-center justify-center shadow-2xl mb-3 animate-pulse">
                      <Play className="w-8 h-8 fill-current ml-1" />
                    </div>
                    <span className="font-cinzel text-base font-bold text-white drop-shadow">
                      {activeLightboxItem.title}
                    </span>
                    <span className="text-xs text-amber-300 font-mono mt-1">
                      HD Aarti & Sthapana Video Streaming
                    </span>
                  </div>
                </div>
              ) : (
                <img
                  src={activeLightboxItem.url}
                  alt={activeLightboxItem.title}
                  className="max-w-full max-h-[60vh] object-contain"
                />
              )}
            </div>

            {/* Lightbox Footer Details */}
            <div className="p-4 sm:p-5 bg-[#060a14] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div>
                <h3 className="font-bold text-white text-sm">{activeLightboxItem.title}</h3>
                <p className="text-gray-400 mt-0.5">
                  {activeLightboxItem.location || 'India'} • {activeLightboxItem.date}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {activeLightboxItem.type === 'image' && (
                  <button
                    onClick={() => {
                      updateSiteAssets({ heroGaneshaImage: activeLightboxItem.url });
                      showNotification(`🕉️ Lord Ganesha Murti updated with "${activeLightboxItem.title}"!`);
                      setActiveLightboxItem(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer"
                    title="Set this image as primary Ganpati Murti on website"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>🕉️ Make Ganpati Murti</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsCustomBuilderOpen(true);
                    setActiveLightboxItem(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 flex items-center gap-1.5 cursor-pointer"
                  title="Design custom mala inspired by this"
                >
                  <span>🌺 Custom Mala</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(activeLightboxItem.url);
                    showNotification('Media link copied to clipboard!');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>

                <button
                  onClick={() => {
                    setIsAdminOpen(true);
                    setActiveLightboxItem(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-amber-300 flex items-center gap-1.5 cursor-pointer"
                  title="Replace or edit in Admin Media Studio"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Admin Studio</span>
                </button>

                <button
                  onClick={() => {
                    if (window.confirm(`Permanently delete "${activeLightboxItem.title}" from Gallery?`)) {
                      deleteGalleryItem(activeLightboxItem.id);
                      setActiveLightboxItem(null);
                      showNotification('Media deleted from gallery successfully.');
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/40 text-red-300 flex items-center gap-1.5 cursor-pointer"
                  title="Delete this media item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>

                <button
                  onClick={() => showNotification('Devotional image download started!')}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download High-Res</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </section>
  );
};
