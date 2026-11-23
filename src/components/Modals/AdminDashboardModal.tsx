import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../services/supabase';
import type { MediaItem, StoreContent, VideoItem } from '../../types';
import {
  Activity,
  Download,
  Film,
  ImagePlus,
  KeyRound,
  LogOut,
  MessageCircle,
  Package,
  Printer,
  Save,
  ShoppingBag,
  Users,
  X
} from 'lucide-react';

interface DashboardOrder {
  id: string;
  order_number: string;
  visitor_id: string | null;
  customer_name: string;
  phone: string;
  email: string | null;
  shipping_address: { line1: string; city: string; state: string; pincode: string };
  items: Array<{ productId: string; productName: string; selectedSize: string; quantity: number; pricePerUnit: number }>;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
}

interface DashboardEvent {
  id: number;
  visitor_id: string;
  event_type: 'page_view' | 'product_view' | 'wishlist_add' | 'wishlist_remove' | 'gallery_like' | 'gallery_unlike';
  product_id: string | null;
  page_path: string;
  created_at: string;
}

interface DashboardData {
  orders: DashboardOrder[];
  events: DashboardEvent[];
}

const orderStatuses = ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'] as const;
const galleryCategories: MediaItem['category'][] = [
  'ganpati_darshan',
  'customer_photos',
  'temple_events',
  'artisan_handcraft',
  'varmala_wedding'
];
const ADMIN_SESSION_STORAGE_KEY = 'ak_mala_admin_token';
const ADMIN_CODE = ((import.meta.env as Record<string, string | undefined>).ADMIN_CODE ?? '').trim();

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function formatWhatsAppPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

function buildWhatsAppMessage(order: DashboardOrder, stage: 'confirm' | 'shipped' | 'delivered'): string {
  const itemsText = order.items
    .map((item) => `${item.productName} (${item.selectedSize}) x${item.quantity}`)
    .join(', ');

  if (stage === 'shipped') {
    return [
      `Namaste ${order.customer_name},`,
      `Aapka *AK MALA* order *#${order.order_number}* ship ho gaya hai.`,
      `Items: ${itemsText}`,
      `Total: ₹${order.total.toLocaleString('en-IN')} (${order.payment_status.toUpperCase()})`,
      `Address: ${order.shipping_address.line1}, ${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.pincode}`
    ].join('\n');
  }

  if (stage === 'delivered') {
    return [
      `Namaste ${order.customer_name},`,
      `Aapka *AK MALA* order *#${order.order_number}* deliver ho chuka hai.`,
      `Hamare saath shopping karne ke liye dhanyawad! Koi bhi sahayata ho toh isi WhatsApp par message karein.`
    ].join('\n');
  }

  return [
    `Namaste ${order.customer_name},`,
    `Aapka *AK MALA* order *#${order.order_number}* confirm ho gaya hai.`,
    `Items: ${itemsText}`,
    `Total Amount: ₹${order.total.toLocaleString('en-IN')} (${order.payment_method.toUpperCase()} · ${order.payment_status.toUpperCase()})`,
    `Delivery Address: ${order.shipping_address.line1}, ${order.shipping_address.city}, ${order.shipping_address.state} - ${order.shipping_address.pincode}`
  ].join('\n');
}

export const AdminDashboardModal: React.FC = () => {
  const appContext = useApp();
  const {
    isDashboardOpen,
    setIsDashboardOpen,
    showNotification,
    allProducts,
    siteAssets,
    galleryItems,
    videosList
  } = appContext;

  const setStoreContentFn = (
    appContext as unknown as { updateStoreContent?: (next: StoreContent) => void }
  ).updateStoreContent;

  const [activeTab, setActiveTab] = useState<'orders' | 'media'>('orders');
  const [adminCode, setAdminCode] = useState('');
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return window.sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<DashboardOrder | null>(null);
  const [deliveryCodes, setDeliveryCodes] = useState<Record<string, string>>({});
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Seller Media Studio states (aligned with MediaItem & VideoItem)
  const [targetCollection, setTargetCollection] = useState<'gallery' | 'video'>('gallery');
  const [mediaKind, setMediaKind] = useState<'image' | 'video'>('image');
  const [mediaCategory, setMediaCategory] = useState<MediaItem['category']>('artisan_handcraft');
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaTagsText, setMediaTagsText] = useState('mala, handmade, ak mala');
  const [videoDuration, setVideoDuration] = useState('0:30');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [savingContent, setSavingContent] = useState(false);

  const isUnlocked = Boolean(adminToken);

  useEffect(() => {
    if (!printingOrder) return;
    const timer = window.setTimeout(() => {
      window.print();
      setPrintingOrder(null);
    }, 50);
    return () => window.clearTimeout(timer);
  }, [printingOrder]);

  useEffect(() => {
    if (!isDashboardOpen || !adminToken) return;
    let cancelled = false;
    setLoading(true);
    setError('');

    void fetch('/api/admin/data', {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'x-admin-code': adminToken
      }
    })
      .then(async (response) => {
        const result = (await response.json()) as DashboardData & { error?: string };
        if (!response.ok) throw new Error(result.error || 'Owner data could not be loaded.');
        if (!cancelled) setData(result);
      })
      .catch((requestError: unknown) => {
        if (!cancelled) {
          setData(null);
          setError(requestError instanceof Error ? requestError.message : 'Owner data could not be loaded.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isDashboardOpen, adminToken]);

  const metrics = useMemo(() => {
    const events = data?.events || [];
    const orders = data?.orders || [];
    const productNames = new Map(allProducts.map((product) => [product.id, product.name]));
    const productActivity = new Map<string, { views: number; netWishlist: number }>();

    events.forEach((event) => {
      if (!event.product_id || !['product_view', 'wishlist_add', 'wishlist_remove'].includes(event.event_type)) return;
      const current = productActivity.get(event.product_id) || { views: 0, netWishlist: 0 };
      if (event.event_type === 'product_view') current.views += 1;
      if (event.event_type === 'wishlist_add') current.netWishlist += 1;
      if (event.event_type === 'wishlist_remove') current.netWishlist -= 1;
      productActivity.set(event.product_id, current);
    });

    orders.forEach((order) => order.items.forEach((item) => productNames.set(item.productId, item.productName)));
    const paidOrders = orders.filter((order) => order.payment_status === 'paid');

    return {
      visitors: new Set(events.map((event) => event.visitor_id)).size,
      pageViews: events.filter((event) => event.event_type === 'page_view').length,
      productViews: events.filter((event) => event.event_type === 'product_view').length,
      wishlistAdds: events.filter((event) => event.event_type === 'wishlist_add').length,
      galleryLikes:
        events.filter((event) => event.event_type === 'gallery_like').length -
        events.filter((event) => event.event_type === 'gallery_unlike').length,
      paidOrders: paidOrders.length,
      revenue: paidOrders.reduce((total, order) => total + order.total, 0),
      productActivity: [...productActivity.entries()]
        .map(([id, activity]) => ({ id, name: productNames.get(id) || id, ...activity }))
        .sort((left, right) => right.netWishlist - left.netWishlist || right.views - left.views)
    };
  }, [data, allProducts]);

  if (!isDashboardOpen) return null;

  const unlockAdminPanel = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanedCode = adminCode.trim();
    if (!cleanedCode) {
      setError('Admin code daalein.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: cleanedCode })
      });

      if (response.ok) {
        const result = (await response.json()) as { token?: string };
        const tokenValue = result.token || cleanedCode;
        try {
          window.sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, tokenValue);
        } catch {
          // ignore
        }
        setAdminToken(tokenValue);
        setAdminCode('');
        showNotification('Seller / Admin panel unlocked.');
        return;
      }

     if (ADMIN_CODE && cleanedCode === ADMIN_CODE) {
        try {
          window.sessionStorage.setItem(ADMIN_SESSION_STORAGE_KEY, cleanedCode);
        } catch {
          // ignore
        }
        setAdminToken(cleanedCode);
        setAdminCode('');
        showNotification('Seller / Admin panel unlocked.');
        return;
      }

      const errData = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(errData.error || 'Galat admin code.');
    } catch (unlockError) {
      setError(unlockError instanceof Error ? unlockError.message : 'Admin panel unlock nahi ho paya.');
    } finally {
      setLoading(false);
    }
  };

  const lockAdminPanel = () => {
    try {
      window.sessionStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
    setAdminToken(null);
    setData(null);
    setError('');
    void supabase?.auth.signOut();
  };

  const handleUploadMediaFile = async () => {
    if (!adminToken) return;
    if (!mediaFile) {
      showNotification('Pehle ek image ya video file chunein.');
      return;
    }

    setUploadingMedia(true);
    try {
      const signRes = await fetch('/api/admin/media/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'x-admin-code': adminToken
        },
        body: JSON.stringify({
          contentType: mediaFile.type,
          size: mediaFile.size
        })
      });
      const signData = (await signRes.json()) as { uploadUrl?: string; publicUrl?: string; error?: string };
      if (!signRes.ok || !signData.uploadUrl || !signData.publicUrl) {
        throw new Error(signData.error || 'Upload URL nahi mil paya.');
      }

      const putRes = await fetch(signData.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': mediaFile.type },
        body: mediaFile
      });
      if (!putRes.ok) {
        throw new Error('File storage par upload nahi ho payi.');
      }

      setUploadedUrl(signData.publicUrl);
      if (mediaFile.type.startsWith('image/') && !thumbnailUrl) {
        setThumbnailUrl(signData.publicUrl);
      }
      showNotification('Media upload ho gaya! Ab Save to Store par click karein.');
    } catch (uploadErr) {
      showNotification(uploadErr instanceof Error ? uploadErr.message : 'Upload failed.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSaveMediaToStore = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!adminToken) return;
    const finalUrl = uploadedUrl.trim();
    if (!finalUrl) {
      showNotification('Pehle file upload karein ya valid media URL daalein.');
      return;
    }

    setSavingContent(true);
    try {
      const nowIso = new Date().toISOString().slice(0, 10);
      const title = mediaTitle.trim() || (targetCollection === 'video' ? 'New Store Video' : 'New Gallery Item');
      const parsedTags = mediaTagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const poster = thumbnailUrl.trim() || siteAssets.heroGaneshaImage || finalUrl;

      let nextGallery: MediaItem[] = galleryItems || [];
      let nextVideos: VideoItem[] = videosList || [];

      if (targetCollection === 'video') {
        const newVideo: VideoItem = {
          id: `vid-${Date.now()}`,
          title,
          duration: videoDuration.trim() || '0:30',
          image: poster,
          videoUrl: finalUrl,
          category: mediaCategory
        };
        nextVideos = [newVideo, ...nextVideos];
      } else {
        const newGalleryItem: MediaItem = {
          id: `gal-${Date.now()}`,
          title,
          type: mediaKind,
          url: finalUrl,
          thumbnailUrl: poster,
          category: mediaCategory,
          tags: parsedTags.length ? parsedTags : ['ak mala'],
          date: nowIso,
          likes: 0
        };
        nextGallery = [newGalleryItem, ...nextGallery];
      }

      const nextContent: StoreContent = {
        products: allProducts,
        siteAssets,
        galleryItems: nextGallery,
        videosList: nextVideos
      };

      const saveRes = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'x-admin-code': adminToken
        },
        body: JSON.stringify({ content: nextContent })
      });
      const saveData = (await saveRes.json()) as { error?: string };
      if (!saveRes.ok) {
        throw new Error(saveData.error || 'Store content save nahi ho paya.');
      }

      setStoreContentFn?.(nextContent);
      setMediaTitle('');
      setMediaFile(null);
      setUploadedUrl('');
      showNotification(
        `${targetCollection === 'video' ? 'Video' : 'Gallery item'} save ho gaya! Store refresh karein.`
      );
    } catch (saveErr) {
      showNotification(saveErr instanceof Error ? saveErr.message : 'Save failed.');
    } finally {
      setSavingContent(false);
    }
  };

  const openOrderOnWhatsApp = (order: DashboardOrder, stage: 'confirm' | 'shipped' | 'delivered') => {
    const phone = formatWhatsAppPhone(order.phone);
    if (!phone) {
      showNotification('Customer ka valid phone number nahi mila.');
      return;
    }
    const text = encodeURIComponent(buildWhatsAppMessage(order, stage));
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const updateStatus = async (order: DashboardOrder, orderStatus: string) => {
    if (!adminToken) return;
    setUpdatingOrderId(order.id);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'x-admin-code': adminToken
        },
        body: JSON.stringify({ orderStatus })
      });
      const result = (await response.json()) as { order?: DashboardOrder; message?: string; error?: string };
      if (!response.ok || !result.order) throw new Error(result.error || 'Order status could not be updated.');
      setData((current) =>
        current && {
          ...current,
          orders: current.orders.map((item) => (item.id === order.id ? result.order! : item))
        }
      );
      if (result.message) showNotification(result.message);
    } catch (statusError) {
      showNotification(statusError instanceof Error ? statusError.message : 'Order status could not be updated.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const confirmDelivery = async (order: DashboardOrder) => {
    if (!adminToken) return;
    setUpdatingOrderId(order.id);
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}/deliver`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
          'x-admin-code': adminToken
        },
        body: JSON.stringify({ code: deliveryCodes[order.id] || '' })
      });
      const result = (await response.json()) as { order?: DashboardOrder; message?: string; error?: string };
      if (!response.ok || !result.order) throw new Error(result.error || 'Delivery could not be confirmed.');
      setData((current) =>
        current && {
          ...current,
          orders: current.orders.map((item) => (item.id === order.id ? result.order! : item))
        }
      );
      setDeliveryCodes((current) => ({ ...current, [order.id]: '' }));
      showNotification(result.message || 'Delivery confirmed.');
    } catch (deliveryError) {
      showNotification(deliveryError instanceof Error ? deliveryError.message : 'Delivery could not be confirmed.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const exportOrders = () => {
    const rows = [
      ['Order', 'Date', 'Customer', 'Phone', 'Email', 'Address', 'Items', 'Total', 'Payment', 'Status'],
      ...(data?.orders || []).map((order) => [
        order.order_number,
        order.created_at,
        order.customer_name,
        order.phone,
        order.email || '',
        `${order.shipping_address.line1}, ${order.shipping_address.city}, ${order.shipping_address.state} ${order.shipping_address.pincode}`,
        order.items.map((item) => `${item.productName} (${item.selectedSize}) x${item.quantity}`).join('; '),
        String(order.total),
        `${order.payment_method} / ${order.payment_status}`,
        order.order_status
      ])
    ];
    const csv = rows.map((row) => row.map((value) => escapeCsv(String(value))).join(',')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = 'ak-mala-orders.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
      <div className="relative my-auto flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border-2 border-[#D4AF37]/50 bg-[#080d19] shadow-2xl">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-[#060a14] p-4 sm:p-5">
          <div>
            <h3 className="font-cinzel text-base font-bold text-white">Seller & Owner Dashboard</h3>
            <p className="mt-1 text-[11px] text-gray-400">
              Admin code se unlock karein · Orders WhatsApp par manage karein · Images & Videos add karein
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isUnlocked && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('orders')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    activeTab === 'orders' ? 'bg-amber-400 text-black' : 'border border-white/10 text-gray-300'
                  }`}
                >
                  Orders & WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('media')}
                  className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                    activeTab === 'media' ? 'bg-amber-400 text-black' : 'border border-white/10 text-gray-300'
                  }`}
                >
                  <ImagePlus className="h-3.5 w-3.5" /> Add Image / Video
                </button>
                <button
                  type="button"
                  onClick={lockAdminPanel}
                  className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-gray-300 hover:bg-white/5 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" /> Lock
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setIsDashboardOpen(false)}
              className="rounded-lg bg-white/5 p-1.5 text-gray-400 hover:text-white cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {!isUnlocked ? (
          <div className="m-auto w-full max-w-sm space-y-4 p-6">
            <KeyRound className="mx-auto h-9 w-9 text-amber-300" />
            <p className="text-center text-xs text-gray-300">
              Apna secret <strong>Admin Code</strong> daal kar Seller Panel kholein.
            </p>
            <form onSubmit={unlockAdminPanel} className="space-y-3">
              <input
                type="password"
                required
                value={adminCode}
                onChange={(event) => setAdminCode(event.target.value)}
                placeholder="Enter Admin Code"
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/20 bg-black/50 p-3 text-sm text-white focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-amber-400 p-3 text-sm font-bold text-black disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Unlocking…' : 'Unlock Seller Panel'}
              </button>
            </form>
            {error && <p role="alert" className="text-center text-xs text-red-300">{error}</p>}
          </div>
        ) : activeTab === 'media' ? (
          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
            <form
              onSubmit={handleSaveMediaToStore}
              className="space-y-4 rounded-2xl border border-amber-500/25 bg-white/[0.03] p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Seller Media Studio (Add Image / Video)
                </h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetCollection('gallery');
                      setMediaKind('image');
                    }}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                      targetCollection === 'gallery' && mediaKind === 'image'
                        ? 'bg-amber-400 text-black'
                        : 'bg-white/5 text-gray-300'
                    }`}
                  >
                    <ImagePlus className="h-3.5 w-3.5" /> Gallery Image
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetCollection('gallery');
                      setMediaKind('video');
                    }}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                      targetCollection === 'gallery' && mediaKind === 'video'
                        ? 'bg-amber-400 text-black'
                        : 'bg-white/5 text-gray-300'
                    }`}
                  >
                    <Film className="h-3.5 w-3.5" /> Gallery Video
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetCollection('video');
                      setMediaKind('video');
                    }}
                    className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                      targetCollection === 'video' ? 'bg-amber-400 text-black' : 'bg-white/5 text-gray-300'
                    }`}
                  >
                    <Film className="h-3.5 w-3.5" /> Store Video
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  value={mediaTitle}
                  onChange={(e) => setMediaTitle(e.target.value)}
                  placeholder="Title (e.g. Royal Rose Mala)"
                  className="rounded-xl border border-white/15 bg-black/50 p-2.5 text-xs text-white"
                />
                <select
                  value={mediaCategory}
                  onChange={(e) => setMediaCategory(e.target.value as MediaItem['category'])}
                  className="rounded-xl border border-white/15 bg-[#101827] p-2.5 text-xs text-white"
                >
                  {galleryCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
                <input
                  type="file"
                  accept={mediaKind === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/jpeg,image/png,image/webp,image/gif'}
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  className="rounded-xl border border-white/15 bg-black/50 p-2 text-xs text-gray-300"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={mediaTagsText}
                  onChange={(e) => setMediaTagsText(e.target.value)}
                  placeholder="Tags (comma separated)"
                  className="rounded-xl border border-white/15 bg-black/50 p-2.5 text-xs text-white"
                />
                {targetCollection === 'video' ? (
                  <input
                    type="text"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(e.target.value)}
                    placeholder="Duration (e.g. 0:45)"
                    className="rounded-xl border border-white/15 bg-black/50 p-2.5 text-xs text-white"
                  />
                ) : (
                  <input
                    type="text"
                    value={thumbnailUrl}
                    onChange={(e) => setThumbnailUrl(e.target.value)}
                    placeholder="Thumbnail Image URL (optional)"
                    className="rounded-xl border border-white/15 bg-black/50 p-2.5 text-xs text-white"
                  />
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={uploadingMedia || !mediaFile}
                  onClick={() => void handleUploadMediaFile()}
                  className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-amber-200 hover:bg-white/15 disabled:opacity-40 cursor-pointer"
                >
                  {uploadingMedia ? 'Uploading…' : '1. Upload File to Storage'}
                </button>
                <input
                  type="text"
                  value={uploadedUrl}
                  onChange={(e) => setUploadedUrl(e.target.value)}
                  placeholder="Uploaded Media URL (ya direct URL paste karein)"
                  className="min-w-[240px] flex-1 rounded-xl border border-white/15 bg-black/50 p-2.5 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                disabled={savingContent}
                className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-black text-black disabled:opacity-50 cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{savingContent ? 'Saving…' : '2. Save to Store'}</span>
              </button>
            </form>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <h5 className="mb-2 text-xs font-bold text-amber-300">
                  Gallery Items ({galleryItems?.length || 0})
                </h5>
                <div className="space-y-1.5 text-xs text-gray-300">
                  {(galleryItems || []).slice(0, 8).map((g) => (
                    <p key={g.id} className="truncate">
                      • [{g.type}] {g.title} — <span className="text-gray-500">{g.url}</span>
                    </p>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <h5 className="mb-2 text-xs font-bold text-amber-300">
                  Store Videos ({videosList?.length || 0})
                </h5>
                <div className="space-y-1.5 text-xs text-gray-300">
                  {(videosList || []).slice(0, 8).map((v) => (
                    <p key={v.id} className="truncate">
                      • {v.title} ({v.duration}) — <span className="text-gray-500">{v.videoUrl || v.image}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : loading ? (
          <div className="p-10 text-center text-sm text-amber-200">Loading owner data…</div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-red-300">{error}</div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
            <p className="text-[10px] text-gray-500">Totals reflect up to the latest 2,000 consented events and 500 orders.</p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
              {[
                { title: 'Unique visitors', value: metrics.visitors, icon: Users },
                { title: 'Page views', value: metrics.pageViews, icon: Activity },
                { title: 'Product views', value: metrics.productViews, icon: ShoppingBag },
                { title: 'Wishlist adds', value: metrics.wishlistAdds, icon: Package },
                { title: 'Gallery likes (net)', value: Math.max(0, metrics.galleryLikes), icon: Package },
                { title: 'Paid orders', value: metrics.paidOrders, icon: ShoppingBag },
                { title: 'Paid revenue', value: `₹${metrics.revenue.toLocaleString('en-IN')}`, icon: Activity }
              ].map(({ title, value, icon: Icon }) => (
                <div key={title} className="rounded-2xl border border-amber-500/20 bg-white/[0.03] p-3">
                  <Icon className="mb-2 h-4 w-4 text-amber-300" />
                  <p className="text-[10px] text-gray-400">{title}</p>
                  <p className="mt-1 text-lg font-black text-white">{value}</p>
                </div>
              ))}
            </div>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Orders & WhatsApp Management
                </h4>
                <button
                  type="button"
                  onClick={exportOrders}
                  className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-2 text-xs text-amber-200 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
              </div>
              <div className="space-y-3">
                {(data?.orders || []).map((order) => (
                  <article key={order.id} className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-white">
                          {order.order_number} · {order.customer_name}
                        </p>
                        <p className="mt-1 text-gray-300">
                          {order.phone}
                          {order.email ? ` · ${order.email}` : ''}
                        </p>
                        <p className="mt-1 text-gray-400">
                          {order.shipping_address.line1}, {order.shipping_address.city}, {order.shipping_address.state} -{' '}
                          {order.shipping_address.pincode}
                        </p>
                        <p className="mt-2 text-gray-300">
                          {order.items.map((item) => `${item.productName} (${item.selectedSize}) × ${item.quantity}`).join(' · ')}
                        </p>
                        <p className="mt-1 font-bold text-amber-200">
                          ₹{order.total.toLocaleString('en-IN')} · {order.payment_method.toUpperCase()} /{' '}
                          {order.payment_status.toUpperCase()}
                        </p>

                        <div className="mt-2.5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openOrderOnWhatsApp(order, 'confirm')}
                            className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/30 cursor-pointer"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => openOrderOnWhatsApp(order, 'shipped')}
                            className="flex items-center gap-1 rounded-lg bg-blue-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-blue-300 hover:bg-blue-500/30 cursor-pointer"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Shipped
                          </button>
                          <button
                            type="button"
                            onClick={() => openOrderOnWhatsApp(order, 'delivered')}
                            className="flex items-center gap-1 rounded-lg bg-amber-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/30 cursor-pointer"
                          >
                            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp Delivered
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <select
                            aria-label={`Status for ${order.order_number}`}
                            value={order.order_status}
                            disabled={updatingOrderId === order.id}
                            onChange={(event) => void updateStatus(order, event.target.value)}
                            className="rounded-lg border border-white/20 bg-[#101827] p-2 text-xs text-white disabled:opacity-50"
                          >
                            {orderStatuses
                              .filter((status) => status !== 'delivered' || order.order_status === 'delivered')
                              .map((status) => (
                                <option key={status} value={status}>
                                  {status.replaceAll('_', ' ')}
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => setPrintingOrder(order)}
                            className="flex items-center gap-1 rounded-lg bg-amber-400 px-2.5 py-2 font-bold text-black cursor-pointer"
                          >
                            <Printer className="h-3.5 w-3.5" /> Slip
                          </button>
                        </div>
                        {order.order_status === 'out_for_delivery' && (
                          <div className="w-full max-w-xs space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
                            <p className="text-[10px] text-amber-200">
                              Enter the 6-digit delivery OTP shared by the customer/courier.
                            </p>
                            <div className="flex gap-2">
                              <input
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                aria-label={`Delivery OTP for ${order.order_number}`}
                                value={deliveryCodes[order.id] || ''}
                                onChange={(event) =>
                                  setDeliveryCodes((current) => ({
                                    ...current,
                                    [order.id]: event.target.value.replace(/\D/g, '').slice(0, 6)
                                  }))
                                }
                                className="min-w-0 flex-1 rounded-md border border-white/15 bg-[#101827] px-2 py-1.5 text-xs tracking-[0.3em] text-white"
                                placeholder="6-digit OTP"
                              />
                              <button
                                type="button"
                                onClick={() => void confirmDelivery(order)}
                                disabled={updatingOrderId === order.id || (deliveryCodes[order.id] || '').length !== 6}
                                className="rounded-md bg-emerald-500 px-2.5 py-1.5 text-[10px] font-bold text-black disabled:opacity-40 cursor-pointer"
                              >
                                Verify & deliver
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
                {!data?.orders.length && <p className="py-4 text-center text-xs text-gray-500">No orders have been saved yet.</p>}
              </div>
            </section>
          </div>
        )}

        {printingOrder && (
          <div id="shipping-slip" className="hidden bg-white p-8 text-black">
            <h1 className="text-2xl font-bold">AK MALA · SHIPPING SLIP</h1>
            <p className="mt-4">
              <strong>Order:</strong> {printingOrder.order_number}
            </p>
            <p>
              <strong>Date:</strong> {new Date(printingOrder.created_at).toLocaleDateString()}
            </p>
            <h2 className="mt-6 font-bold">SHIP TO</h2>
            <p className="text-lg font-semibold">{printingOrder.customer_name}</p>
            <p>{printingOrder.shipping_address.line1}</p>
            <p>
              {printingOrder.shipping_address.city}, {printingOrder.shipping_address.state} -{' '}
              {printingOrder.shipping_address.pincode}
            </p>
            <p>Phone: {printingOrder.phone}</p>
            <h2 className="mt-6 font-bold">ITEMS</h2>
            {printingOrder.items.map((item, index) => (
              <p key={`${item.productId}-${index}`}>
                {item.productName} · {item.selectedSize} · Qty {item.quantity}
              </p>
            ))}
            <p className="mt-4 font-bold">
              Total: ₹{printingOrder.total.toLocaleString('en-IN')} · {printingOrder.payment_method.toUpperCase()} (
              {printingOrder.payment_status})
            </p>
          </div>
        )}
      </div>
    </div>
  );
};