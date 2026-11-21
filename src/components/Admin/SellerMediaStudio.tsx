import React, { useState } from 'react';
import { Film, Image, Link, Upload } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { uploadStoreMediaWithAdminToken } from '../../services/mediaStorage';

interface SellerMediaStudioProps {
  adminToken: string;
}

const supportedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const supportedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];

export const SellerMediaStudio: React.FC<SellerMediaStudioProps> = ({ adminToken }) => {
  const { addGalleryItem, addVideoItem, galleryItems, videosList, siteAssets } = useApp();
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [title, setTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const allowedTypes = mediaType === 'image' ? supportedImageTypes : supportedVideoTypes;
    if (!allowedTypes.includes(file.type)) {
      setError(`Choose a supported ${mediaType} file.`);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be 50 MB or less.');
      return;
    }

    setUploading(true);
    setError('');
    setFileName(file.name);
    try {
      const uploadedUrl = await uploadStoreMediaWithAdminToken(file, adminToken);
      setMediaUrl(uploadedUrl);
    } catch (uploadError) {
      setMediaUrl('');
      setFileName('');
      setError(uploadError instanceof Error ? uploadError.message : 'Media upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const saveMedia = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanUrl = mediaUrl.trim();
    if (!cleanTitle || !cleanUrl) {
      setError('Title aur uploaded file ya URL dono zaroori hain.');
      return;
    }
    try {
      const parsedUrl = new URL(cleanUrl);
      if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
        throw new Error('Invalid URL protocol.');
      }
    } catch {
      setError('Valid http/https media URL daalein ya file upload karein.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      if (mediaType === 'image') {
        addGalleryItem({
          title: cleanTitle,
          type: 'image',
          url: cleanUrl,
          thumbnailUrl: cleanUrl,
          category: 'ganpati_darshan',
          tags: ['New Upload', 'Sacred', 'Darshan'],
          location: 'India'
        });
      } else {
        addVideoItem({
          id: `video-${Date.now()}`,
          title: cleanTitle,
          duration: '0:00',
          image: siteAssets.heroGaneshaImage,
          videoUrl: cleanUrl,
          category: 'Aarti & Unboxing'
        });
      }
      setTitle('');
      setMediaUrl('');
      setFileName('');
    } finally {
      setSaving(false);
    }
  };

  const savedMedia = [
    ...galleryItems.slice(0, 6).map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      url: item.url,
      thumbnailUrl: item.thumbnailUrl
    })),
    ...videosList.slice(0, 6).map((item) => ({
      id: item.id,
      title: item.title,
      type: 'video' as const,
      url: item.videoUrl || item.image,
      thumbnailUrl: item.image
    }))
  ].slice(0, 12);

  return (
    <div className="space-y-5">
      <form onSubmit={saveMedia} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
        <div>
          <h4 className="text-sm font-bold uppercase tracking-wider text-amber-300">Add Image / Video</h4>
          <p className="mt-1 text-xs text-gray-400">Upload media, phir use gallery ya store videos mein save karein.</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {([
            { type: 'image', label: 'Image', Icon: Image },
            { type: 'video', label: 'Video', Icon: Film }
          ] as const).map(({ type, label, Icon }) => (
            <button
              key={type}
              type="button"
              disabled={uploading || saving}
              onClick={() => {
                setMediaType(type);
                setMediaUrl('');
                setFileName('');
                setError('');
              }}
              aria-pressed={mediaType === type}
              className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-sm font-semibold ${
                mediaType === type
                  ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                  : 'border-white/10 bg-black/20 text-gray-400'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        <label className="block space-y-1.5 text-xs text-gray-300">
          Title
          <input
            required
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            placeholder="Media ka title"
            className="w-full rounded-xl border border-white/15 bg-black/40 p-3 text-sm text-white"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-amber-500/40 bg-black/20 p-4 text-center text-xs text-gray-300">
            <Upload className="h-5 w-5 text-amber-300" />
            {uploading ? 'Uploading…' : `Step 1 — Upload ${mediaType}`}
            <span className="text-[10px] text-gray-500">
              {mediaType === 'image' ? 'JPG, PNG, WEBP, GIF' : 'MP4, WEBM, MOV'} · Max 50 MB
            </span>
            <input
              type="file"
              accept={mediaType === 'image' ? 'image/jpeg,image/png,image/webp,image/gif' : 'video/mp4,video/webm,video/quicktime'}
              onChange={(event) => void handleFileSelected(event)}
              disabled={uploading}
              className="sr-only"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs text-gray-300">
            <span className="flex items-center gap-1"><Link className="h-3.5 w-3.5" /> Or paste a media URL</span>
            <input
              type="url"
              value={mediaUrl}
              onChange={(event) => {
                setMediaUrl(event.target.value);
                setFileName('');
              }}
              placeholder="https://..."
              className="w-full rounded-xl border border-white/15 bg-black/40 p-3 text-xs text-white"
            />
            {fileName && <span className="truncate text-[10px] text-amber-200">{fileName}</span>}
          </label>
        </div>

        {mediaUrl && (
          <div className="max-w-sm overflow-hidden rounded-xl border border-white/10 bg-black/30">
            {mediaType === 'video' ? (
              <video src={mediaUrl} controls className="max-h-56 w-full object-contain" />
            ) : (
              <img src={mediaUrl} alt={title || 'Media preview'} className="max-h-56 w-full object-contain" />
            )}
          </div>
        )}

        {error && <p role="alert" className="text-xs text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={uploading || saving || !mediaUrl}
          className="w-full rounded-xl bg-amber-400 p-3 text-sm font-bold text-black disabled:opacity-50"
        >
          {saving ? 'Saving…' : `Step 2 — Save to ${mediaType === 'image' ? 'Gallery' : 'Store Videos'}`}
        </button>
      </form>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">Saved Media Preview</h4>
          <span className="text-[10px] text-gray-500">{galleryItems.length} gallery · {videosList.length} videos</span>
        </div>
        {savedMedia.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {savedMedia.map((item) => (
              <article key={`${item.type}-${item.id}`} className="overflow-hidden rounded-xl border border-white/10 bg-black/30">
                <img src={item.thumbnailUrl} alt={item.title} className="h-28 w-full object-cover" />
                <p className="truncate p-2 text-[11px] text-gray-200">{item.title}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-gray-500">Abhi koi media save nahi hua.</p>
        )}
      </section>
    </div>
  );
};
