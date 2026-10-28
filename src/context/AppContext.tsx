import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  Language,
  Order,
  CustomMalaConfig,
  MediaItem,
  VideoItem,
  SiteAssetsConfig
} from '../types';
import { products } from '../data/products';
import { translations } from '../data/translations';
import { initialGalleryItems, generate1000GalleryItems } from '../data/gallerySeed';
import { trackEvent } from '../services/analytics';
import { supabase } from '../services/supabase';
import type { Session } from '@supabase/supabase-js';

const defaultSiteAssets: SiteAssetsConfig = {
  heroGaneshaImage: '/ganpati_murti.png',
  heroHeadline: 'Divine Malas For',
  heroHeadlineHighlight: 'Every Blessing',
  heroSubtitle: 'Handcrafted devotional flower garlands woven with pure fresh Dutch roses, fragrant Madurai mogra, and auspicious marigolds adorned with royal gold zari.',
  offerBannerText: 'GANPATI FESTIVAL SPECIAL - FLAT 15% OFF ON ALL ORDERS',
  offerCode: 'FEST15',
  offerDiscountPercent: 15,
  freeDeliveryThreshold: 999,
  customThaliImage: '/ganpati_darshan.jpg',
  brandTagline: 'Pure Devotion. Premium Quality.'
};

const defaultVideos: VideoItem[] = [
  {
    id: 'unboxing-1',
    title: 'Ganpati Bappa Sthapana Aarti & Garland Darshan',
    duration: '1:42',
    image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'Aarti'
  },
  {
    id: 'unboxing-2',
    title: 'Madurai Mogra Garland Weaving by Master Artisan',
    duration: '2:15',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'Handcraft'
  },
  {
    id: 'unboxing-3',
    title: 'Zero Wilting Cold-Chain Unboxing Test',
    duration: '0:58',
    image: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=400&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    category: 'Unboxing'
  }
];

interface AppContextType {
  // Products & filters (Dynamic & Admin Editable)
  allProducts: Product[];
  addProduct: (newProd: Product) => void;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Site Assets & CMS Config (Admin Editable)
  siteAssets: SiteAssetsConfig;
  updateSiteAssets: (updated: Partial<SiteAssetsConfig>) => void;

  // 1000+ Gallery System (Dynamic & Admin Editable)
  galleryItems: MediaItem[];
  addGalleryItem: (item: Omit<MediaItem, 'id' | 'likes' | 'date'>) => void;
  updateGalleryItem: (id: string, updated: Partial<MediaItem>) => void;
  deleteGalleryItem: (id: string) => void;
  bulkSeed1000Items: () => void;
  clearGallery: () => void;

  // Videos List (Admin Editable)
  videosList: VideoItem[];
  addVideoItem: (v: VideoItem) => void;
  updateVideoItem: (id: string, updated: Partial<VideoItem>) => void;
  deleteVideoItem: (id: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, size?: '16"' | '22"' | '28"' | '36"', customNotes?: string) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  subtotal: number;
  discount: number;
  appliedCoupon: string | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  deliveryCharge: number;
  finalTotal: number;

  // Wishlist
  wishlistIds: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;

  // Language & Theme
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Modals & UI Views
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  selectedProductForDetail: Product | null;
  setSelectedProductForDetail: (p: Product | null) => void;
  isCustomBuilderOpen: boolean;
  setIsCustomBuilderOpen: (open: boolean) => void;
  isTrackerOpen: boolean;
  setIsTrackerOpen: (open: boolean) => void;
  isDashboardOpen: boolean;
  setIsDashboardOpen: (open: boolean) => void;
  isAuthOpen: boolean;
  setIsAuthOpen: (open: boolean) => void;
  isReviewOpen: boolean;
  setIsReviewOpen: (open: boolean) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  isGalleryOpen: boolean;
  setIsGalleryOpen: (open: boolean) => void;

  // User & Orders
  user: { name: string; phone: string; email?: string } | null;
  setUser: (u: { name: string; phone: string; email?: string } | null) => void;
  orders: Order[];
  placeOrder: (orderDetails: Omit<Order, 'id' | 'createdAt' | 'trackingNumber'>, orderId?: string) => Order;
  activeTrackingId: string;
  setActiveTrackingId: (id: string) => void;

  // Custom Mala Add
  addCustomMalaToCart: (config: CustomMalaConfig) => void;
  notification: string | null;
  showNotification: (msg: string) => void;
  resetToDefaults: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Dynamic Products with localStorage persistence
  const [allProducts, setAllProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('ak_mala_products');
      return saved ? JSON.parse(saved) : products;
    } catch {
      return products;
    }
  });

  // 2. Site Assets & CMS Config (Ganpati Murti, Hero Headlines, Offers, Thali photo)
  const [siteAssets, setSiteAssets] = useState<SiteAssetsConfig>(() => {
    try {
      const saved = localStorage.getItem('ak_mala_site_assets');
      if (!saved) return defaultSiteAssets;

      const savedAssets = JSON.parse(saved) as Partial<SiteAssetsConfig>;
      const migratedAssets =
        savedAssets.heroGaneshaImage === '/ganpati_darshan.jpg'
          ? { ...savedAssets, heroGaneshaImage: defaultSiteAssets.heroGaneshaImage }
          : savedAssets;

      return { ...defaultSiteAssets, ...migratedAssets };
    } catch {
      return defaultSiteAssets;
    }
  });

  // 3. 1000+ Gallery Items with localStorage persistence
  const [galleryItems, setGalleryItems] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem('ak_mala_gallery');
      return saved ? JSON.parse(saved) : initialGalleryItems;
    } catch {
      return initialGalleryItems;
    }
  });

  // 4. Videos List with localStorage persistence
  const [videosList, setVideosList] = useState<VideoItem[]>(() => {
    try {
      const saved = localStorage.getItem('ak_mala_videos');
      return saved ? JSON.parse(saved) : defaultVideos;
    } catch {
      return defaultVideos;
    }
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart state persisted in localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('ak_mala_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Wishlist state persisted in localStorage
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ak_mala_wishlist');
      if (saved === JSON.stringify(['mala-01', 'mala-02'])) return [];
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Language
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('ak_mala_lang');
      return (saved as Language) || 'en';
    } catch {
      return 'en';
    }
  });

  // Theme
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Coupon
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(siteAssets.offerCode || 'FEST15');

  // Modals & Panels
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [isCustomBuilderOpen, setIsCustomBuilderOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // User & Orders
  const [user, setUser] = useState<{ name: string; phone: string; email?: string } | null>(() => {
    try {
      const saved = localStorage.getItem('ak_mala_user');
      const storedUser = saved ? JSON.parse(saved) as { email?: string } : null;
      if (storedUser?.email?.endsWith('@example.com')) {
        localStorage.removeItem('ak_mala_user');
        return null;
      }
      return storedUser as { name: string; phone: string; email?: string } | null;
    } catch {
      return null;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('ak_mala_orders');
      const storedOrders = saved ? JSON.parse(saved) as Order[] : [];
      return storedOrders.filter((order) => order.id !== 'AKM-92841');
    } catch {
      return [];
    }
  });

  const [activeTrackingId, setActiveTrackingId] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ak_mala_products', JSON.stringify(allProducts));
  }, [allProducts]);

  useEffect(() => {
    localStorage.setItem('ak_mala_site_assets', JSON.stringify(siteAssets));
  }, [siteAssets]);

  useEffect(() => {
    // Only cache if under a reasonable storage size
    try {
      if (galleryItems.length <= 150) {
        localStorage.setItem('ak_mala_gallery', JSON.stringify(galleryItems));
      }
    } catch (e) {
      console.warn('Gallery storage overflow, caching in memory', e);
    }
  }, [galleryItems]);

  useEffect(() => {
    localStorage.setItem('ak_mala_videos', JSON.stringify(videosList));
  }, [videosList]);

  useEffect(() => {
    localStorage.setItem('ak_mala_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('ak_mala_wishlist', JSON.stringify(wishlistIds));
  }, [wishlistIds]);

  useEffect(() => {
    localStorage.setItem('ak_mala_lang', language);
  }, [language]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('ak_mala_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('ak_mala_user');
    }
  }, [user]);

  useEffect(() => {
    if (!supabase) return;
    let isActive = true;
    const syncUser = (session: Session | null) => {
      if (!isActive) return;
      setUser(session?.user ? {
        name: session.user.user_metadata.full_name || session.user.email || 'AK MALA Customer',
        phone: '',
        email: session.user.email
      } : null);
    };
    void supabase.auth.getSession().then(({ data }) => syncUser(data.session));
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => syncUser(session));
    return () => {
      isActive = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('ak_mala_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    trackEvent('page_view');
  }, []);

  useEffect(() => {
    if (selectedProductForDetail) {
      trackEvent('product_view', selectedProductForDetail.id);
    }
  }, [selectedProductForDetail]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3800);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  // CMS Functions
  const updateSiteAssets = (updated: Partial<SiteAssetsConfig>) => {
    setSiteAssets((prev) => ({ ...prev, ...updated }));
    showNotification('Site assets & branding updated successfully!');
  };

  const addProduct = (newProd: Product) => {
    setAllProducts((prev) => [newProd, ...prev]);
    showNotification(`Added new product: ${newProd.name}`);
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setAllProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updated } : p))
    );
    showNotification(`Updated product: ${id}`);
  };

  const deleteProduct = (id: string) => {
    setAllProducts((prev) => prev.filter((p) => p.id !== id));
    showNotification(`Product ${id} removed.`);
  };

  const addGalleryItem = (item: Omit<MediaItem, 'id' | 'likes' | 'date'>) => {
    const newItem: MediaItem = {
      ...item,
      id: `gal-custom-${Date.now()}`,
      likes: 1,
      date: 'Today'
    };
    setGalleryItems((prev) => [newItem, ...prev]);
    showNotification(`Added to Devotional Gallery: ${item.title}`);
  };

  const deleteGalleryItem = (id: string) => {
    setGalleryItems((prev) => prev.filter((item) => item.id !== id));
    showNotification('Gallery item removed.');
  };

  const updateGalleryItem = (id: string, updated: Partial<MediaItem>) => {
    setGalleryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
    showNotification('Gallery item updated successfully!');
  };

  const bulkSeed1000Items = () => {
    const items = generate1000GalleryItems();
    setGalleryItems(items);
    showNotification('Generated 1,000+ Sacred Devotional Photos & Videos in Gallery!');
  };

  const clearGallery = () => {
    setGalleryItems(initialGalleryItems);
    showNotification('Gallery reset to initial collection.');
  };

  const addVideoItem = (v: VideoItem) => {
    setVideosList((prev) => [v, ...prev]);
    showNotification(`Added video: ${v.title}`);
  };

  const updateVideoItem = (id: string, updated: Partial<VideoItem>) => {
    setVideosList((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updated } : v))
    );
    showNotification(`Video updated.`);
  };

  const deleteVideoItem = (id: string) => {
    setVideosList((prev) => prev.filter((v) => v.id !== id));
    showNotification(`Video removed.`);
  };

  const resetToDefaults = () => {
    localStorage.removeItem('ak_mala_products');
    localStorage.removeItem('ak_mala_site_assets');
    localStorage.removeItem('ak_mala_gallery');
    localStorage.removeItem('ak_mala_videos');
    setAllProducts(products);
    setSiteAssets(defaultSiteAssets);
    setGalleryItems(initialGalleryItems);
    setVideosList(defaultVideos);
    showNotification('All site media and products restored to default state.');
  };

  // Cart operations
  const addToCart = (product: Product, size: '16"' | '22"' | '28"' | '36"' = '22"', customNotes?: string) => {
    const sizeConfig = product.availableSizes.find((s) => s.size === size);
    const unitPrice = product.price + (sizeConfig ? sizeConfig.extraPrice : 0);
    const cartItemId = `${product.id}-${size}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [
          ...prev,
          {
            id: cartItemId,
            productId: product.id,
            product,
            selectedSize: size,
            quantity: 1,
            pricePerUnit: unitPrice,
            customNotes
          }
        ];
      }
    });

    showNotification(`Added "${product.name}" (${size}) to your sacred basket!`);
  };

  const addCustomMalaToCart = (config: CustomMalaConfig) => {
    const customProduct: Product = {
      id: `custom-${Date.now()}`,
      name: `Custom Devotional Mala (${config.flowerType.toUpperCase()})`,
      hindiName: `विशेष कस्टम पवित्र माला (${config.flowerType})`,
      marathiName: `खास सानुकूल हार (${config.flowerType})`,
      category: 'festive',
      price: config.totalPrice,
      originalPrice: Math.round(config.totalPrice * 1.25),
      discountPercent: 20,
      rating: 5.0,
      reviewsCount: 1,
      image: siteAssets.customThaliImage,
      galleryImages: [],
      tags: ['Custom Created', 'Artisan Handcrafted', config.deityTarget],
      flowers: [config.flowerType, config.pattern],
      description: `Personalized ${config.size} divine garland handcrafted with ${config.flowerType} flowers, ${config.pattern} pattern, and ${config.finishing} finish. Designed with love for ${config.deityTarget}.`,
      hindiDescription: `विशेष रूप से आपके आराध्य ${config.deityTarget} के लिए बनाई गई हस्तनिर्मित पवित्र माला।`,
      availableSizes: [{ size: config.size, name: `${config.size} Custom`, extraPrice: 0 }],
      freshnessHours: 72,
      inStock: true,
      fragranceLevel: 'Divine Sacred',
      bestForDeity: config.deityTarget
    };

    addToCart(customProduct, config.size, config.customNotes);
    setIsCustomBuilderOpen(false);
    setIsCartOpen(true);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + item.pricePerUnit * item.quantity, 0);

  const applyCoupon = (code: string): boolean => {
    if (code.toUpperCase().trim() === siteAssets.offerCode.toUpperCase().trim()) {
      setAppliedCoupon(siteAssets.offerCode);
      showNotification(`Coupon ${siteAssets.offerCode} applied! ${siteAssets.offerDiscountPercent}% discount granted.`);
      return true;
    }
    showNotification(`Invalid coupon code. Try ${siteAssets.offerCode}!`);
    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const discount =
    appliedCoupon === siteAssets.offerCode
      ? Math.round(subtotal * (siteAssets.offerDiscountPercent / 100))
      : 0;
  const deliveryCharge = subtotal > siteAssets.freeDeliveryThreshold || subtotal === 0 ? 0 : 99;
  const finalTotal = Math.max(0, subtotal - discount + deliveryCharge);

  // Wishlist
  const toggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        trackEvent('wishlist_remove', productId);
        showNotification('Removed from sacred wishlist');
        return prev.filter((id) => id !== productId);
      } else {
        trackEvent('wishlist_add', productId);
        showNotification('Added to sacred wishlist');
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlistIds.includes(productId);

  // Place order
  const placeOrder = (
    orderDetails: Omit<Order, 'id' | 'createdAt' | 'trackingNumber'>,
    orderId?: string
  ): Order => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const newOrder: Order = {
      ...orderDetails,
      id: orderId || `AKM-${randomNum}`,
      createdAt: new Date().toISOString(),
      trackingNumber: orderId || `DELHIVERY-COLD-${randomNum}`
    };

    setOrders((prev) => [newOrder, ...prev]);
    setActiveTrackingId(newOrder.id);
    clearCart();
    return newOrder;
  };

  return (
    <AppContext.Provider
      value={{
        allProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        siteAssets,
        updateSiteAssets,
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
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        subtotal,
        discount,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        deliveryCharge,
        finalTotal,
        wishlistIds,
        toggleWishlist,
        isInWishlist,
        language,
        setLanguage,
        t,
        theme,
        toggleTheme,
        isCartOpen,
        setIsCartOpen,
        isCheckoutOpen,
        setIsCheckoutOpen,
        selectedProductForDetail,
        setSelectedProductForDetail,
        isCustomBuilderOpen,
        setIsCustomBuilderOpen,
        isTrackerOpen,
        setIsTrackerOpen,
        isDashboardOpen,
        setIsDashboardOpen,
        isAuthOpen,
        setIsAuthOpen,
        isReviewOpen,
        setIsReviewOpen,
        isAdminOpen,
        setIsAdminOpen,
        isGalleryOpen,
        setIsGalleryOpen,
        user,
        setUser,
        orders,
        placeOrder,
        activeTrackingId,
        setActiveTrackingId,
        addCustomMalaToCart,
        notification,
        showNotification,
        resetToDefaults
      }}
    >
      <div className={theme === 'dark' ? 'dark' : ''}>{children}</div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
