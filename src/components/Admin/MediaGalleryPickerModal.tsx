import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MediaItem } from '../../types';
import {
  X,
  Search,
  Camera,
  Video,
  Check,
  CheckCircle2,
  Sparkles,
  Layers,
  Filter,
  ExternalLink,
  Plus,
  Play
} from 'lucide-react';

interface MediaGalleryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selectedUrl: string, item?: MediaItem) => void;
  title?: string;
  subtitle?: string;
  allowedType?: 'all' | 'image' | 'video';
  currentSelectedUrl?: string;
}

export const MediaGalleryPickerModal: React.FC<MediaGalleryPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Media from Sacred Gallery',
  subtitle = 'Choose from 1,000+ high-definition photos and devotional videos',
  allowedType = 'all',
  currentSelectedUrl = ''
}) => {
  const { galleryItems, bulkSeed1000Items, showNotification } = useApp();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [mediaType, setMediaType] = useState<'all' | 'image' | 'video'>(allowedType);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [showCustomTab, setShowCustomTab] = useState(false);

  // Sync initial type filter if constrained
  React.useEffect(() => {
    if (allowedType !== 'all') {
      setMediaType(allowedType);
    }
  }, [allowedType]);

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'ganpati_darshan', label: 'Ganpati Bappa Darshan' },
    { id: 'customer_photos', label: 'Devotee Temple Photos' },
    { id: 'temple_events', label: 'Grand Temple Celebrations' },
    { id: 'artisan_handcraft', label: 'Artisan Garland Weaving' },
    { id: 'varmala_wedding', label: 'Royal Wedding Varmala' }
  ];

  const filteredItems = useMemo(() => {
    return galleryItems.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesType = mediaType === 'all' || item.type === mediaType;
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesType && matchesSearch;
    });
  }, [galleryItems, activeCategory, mediaType, searchQuery]);

  if (!isOpen) return null;

  const handleConfirmSelect = (item: MediaItem) => {
    onSelect(item.url, item);
    showNotification(`Selected: "${item.title}"`);
    onClose();
  };

  const handleConfirmCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    onSelect(customUrlInput.trim());
    showNotification('Custom media URL applied!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#090d18] border-2 border-[#D4AF37] rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#060a14]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2a1d06] to-[#120d02] border border-[#D4AF37] flex items-center justify-center text-[#E5C158] shadow-md">
              <Layers className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-cinzel text-base sm:text-lg font-black text-white">
                  {title}
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded border border-amber-500/40">
                  {filteredItems.length} Available
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {galleryItems.length < 500 && (
              <button
                onClick={bulkSeed1000Items}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/20"
                title="Populate 1000 gallery media items"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Load 1,000+ Items</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 sm:p-4 bg-black/40 border-b border-white/10 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gallery by deity, temple, title..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/60 border border-white/15 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-amber-400"
              />
              <Search className="w-4 h-4 text-amber-400 absolute left-3 top-2.5" />
            </div>

            {/* Type Filter Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center gap-1 p-1 rounded-xl bg-black/50 border border-white/10 text-xs">
                {allowedType === 'all' && (
                  <button
                    onClick={() => setMediaType('all')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs ${
                      mediaType === 'all'
                        ? 'bg-[#E5C158] text-black shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    All Media
                  </button>
                )}
                {(allowedType === 'all' || allowedType === 'image') && (
                  <button
                    onClick={() => setMediaType('image')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-xs ${
                      mediaType === 'image'
                        ? 'bg-[#E5C158] text-black shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Photos</span>
                  </button>
                )}
                {(allowedType === 'all' || allowedType === 'video') && (
                  <button
                    onClick={() => setMediaType('video')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-xs ${
                      mediaType === 'video'
                        ? 'bg-[#E5C158] text-black shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Videos</span>
                  </button>
                )}
              </div>

              {/* Custom URL tab toggle */}
              <button
                onClick={() => setShowCustomTab(!showCustomTab)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  showCustomTab
                    ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                Custom URL
              </button>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-all font-medium cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold shadow-sm'
                    : 'bg-white/5 border border-white/10 text-gray-300 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Custom URL Input Box (Collapsible) */}
          {showCustomTab && (
            <div className="p-3 rounded-xl bg-black/60 border border-amber-500/40 flex items-center gap-2 animate-in fade-in">
              <input
                type="url"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="Or paste any custom image/video URL: https://..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-black border border-white/20 text-xs text-white font-mono"
              />
              <button
                onClick={handleConfirmCustomUrl}
                disabled={!customUrlInput.trim()}
                className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold text-xs uppercase disabled:opacity-50"
              >
                Use URL
              </button>
            </div>
          )}
        </div>

        {/* Media Grid View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center text-gray-400 space-y-3">
              <Layers className="w-10 h-10 text-amber-500/50 mx-auto" />
              <p className="text-sm font-semibold text-gray-200">No media items found</p>
              <p className="text-xs">Try selecting another category or click "Load 1,000+ Items".</p>
              <button
                onClick={bulkSeed1000Items}
                className="mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-bold text-xs uppercase"
              >
                Populate 1,000 Items
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {filteredItems.slice(0, 120).map((item) => {
                const isSelected = selectedItem?.id === item.id || currentSelectedUrl === item.url;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`group relative rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col bg-[#060a14] ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                        : 'border-white/10 hover:border-amber-400/50'
                    }`}
                  >
                    {/* Media Thumbnail */}
                    <div className="relative h-32 sm:h-36 overflow-hidden bg-black/60">
                      <img
                        src={item.thumbnailUrl || item.url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      {/* Type Badge */}
                      <div className="absolute top-2 left-2">
                        {item.type === 'video' ? (
                          <span className="flex items-center gap-1 text-[9px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded shadow">
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>{item.videoDuration || 'Video'}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-bold bg-black/70 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40">
                            <Camera className="w-2.5 h-2.5" />
                            <span>HD</span>
                          </span>
                        )}
                      </div>

                      {/* Selected Checkmark overlay */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg font-bold">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}

                      {/* Quick Select Hover Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmSelect(item);
                        }}
                        className="absolute bottom-2 inset-x-2 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold text-[10px] uppercase opacity-0 group-hover:opacity-100 transition-opacity shadow-md flex items-center justify-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Choose This</span>
                      </button>
                    </div>

                    {/* Metadata Card */}
                    <div className="p-2 space-y-0.5">
                      <h5 className="font-bold text-[11px] text-gray-200 truncate">
                        {item.title}
                      </h5>
                      <div className="flex items-center justify-between text-[9px] text-gray-400">
                        <span className="capitalize truncate">{item.category.replace('_', ' ')}</span>
                        {item.location && <span className="truncate">{item.location}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="p-3 sm:p-4 bg-[#060a14] border-t border-white/10 flex items-center justify-between gap-3 text-xs">
          <div className="truncate">
            {selectedItem ? (
              <span className="text-amber-300 font-semibold truncate block">
                Selected: <span className="text-white">{selectedItem.title}</span>
              </span>
            ) : (
              <span className="text-gray-400">
                Click any image or video above to select it for your website.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium"
            >
              Cancel
            </button>

            <button
              disabled={!selectedItem}
              onClick={() => selectedItem && handleConfirmSelect(selectedItem)}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black font-extrabold uppercase shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Apply Selection</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
