import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  Language,
  Order,
  CustomMalaConfig,
  MediaItem,
  VideoItem,
  SiteAssetsConfig,
  StoreContent,
  Review,
  ProductReviewSummary,
  CustomerAddress,
  CustomerOrder,
  CustomerUser
} from '../types';
import { products } from '../data/products';
import { translations } from '../data/translations';
import { initialGalleryItems } from '../data/gallerySeed';
import { trackEvent } from '../services/analytics';
import { supabase } from '../services/supabase';
import { isOfferActive } from '../utils/offers';
import type { Session } from '@supabase/supabase-js';

type MalaSize = '4"' | '8"' | '12"' | '16"' | '22"' | '28"' | '36"';

const defaultSiteAssets: SiteAssetsConfig = {
  heroGaneshaImage: '/ganpati_murti.png',
  heroHeadline: 'Divine Malas For',
  heroHeadlineHighlight: 'Every Blessing',
  heroSubtitle: 'Explore devotional garlands in a variety of colors and designs. Check each product page for available sizes, prices, and product details.',
  offerBannerText: '',
  offerCode: '',
  offerDiscountPercent: 0,
  offerEnabled: false,
  offerStartDate: '',
  offerEndDate: '',
  offerMinOrder: 0,
  freeDeliveryThreshold: 999,
  customThaliImage: '/ganpati_darshan.jpg',
  brandTagline: 'Pure Devotion. Premium Quality.'
};

const defaultVideos: VideoItem[] = [];


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
  clearGallery: () => void;

  // Videos List (Admin Editable)
  videosList: VideoItem[];
  addVideoItem: (v: VideoItem) => void;
  updateVideoItem: (id: string, updated: Partial<VideoItem>) => void;
  deleteVideoItem: (id: string) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, size?: MalaSize, customNotes?: string) => void;
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
  reviewProductId: string | null;
  setReviewProductId: (productId: string | null) => void;
  reviews: Review[];
  reviewSummaries: ProductReviewSummary[];
  refreshReviews: () => Promise<void>;
  customerAddresses: CustomerAddress[];
  customerOrders: CustomerOrder[];
  isCustomerAccountLoading: boolean;
  refreshCustomerAccount: () => Promise<void>;
  saveCustomerAddress: (address: Omit<CustomerAddress, 'id'> & { id?: string }) => Promise<void>;
  deleteCustomerAddress: (id: string) => Promise<void>;
  isAdminOpen: boolean;
  setIsAdminOpen: (open: boolean) => void;
  isOwner: boolean;
  isOwnerChecking: boolean;
  adminAccessToken: string | null;
  setAdminAccessToken: (token: string | null) => void;
  isGalleryOpen: boolean;
  setIsGalleryOpen: (open: boolean) => void;

  // User & Orders
  user: CustomerUser | null;
  setUser: (u: CustomerUser | null) => void;
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
  const [allProducts, setAllProducts] = useState<Product[]>(products);
  const [siteAssets, setSiteAssets] = useState<SiteAssetsConfig>(defaultSiteAssets);
  const [galleryItems, setGalleryItems] = useState<MediaItem[]>(initialGalleryItems);
  const [videosList, setVideosList] = useState<VideoItem[]>(defaultVideos);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewSummaries, setReviewSummaries] = useState<ProductReviewSummary[]>([]);
  const [storeContentReady, setStoreContentReady] = useState(false);
  const storeContentSaveQueue = React.useRef<Promise<void>>(Promise.resolve());

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
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  // Modals & Panels
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [isCustomBuilderOpen, setIsCustomBuilderOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState<string | null>(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isOwnerChecking, setIsOwnerChecking] = useState(false);
  const [adminAccessToken, setAdminAccessToken] = useState<string | null>(() => {
    try {
      return window.sessionStorage.getItem('ak_mala_admin_token');
    } catch {
      return null;
    }
  });
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // User & Orders
  const [user, setUser] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem('ak_mala_user');
      const storedUser = saved ? (JSON.parse(saved) as Partial<CustomerUser>) : null;
      if (storedUser?.email?.endsWith('@example.com')) {
        localStorage.removeItem('ak_mala_user');
        return null;
      }
      return storedUser && typeof storedUser.id === 'string' && typeof storedUser.name === 'string'
        ? {
            id: storedUser.id,
            name: storedUser.name,
            phone: typeof storedUser.phone === 'string' ? storedUser.phone : '',
            email: storedUser.email
          }
        : null;
    } catch {
      return null;
    }
  });
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [isCustomerAccountLoading, setIsCustomerAccountLoading] = useState(false);

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('ak_mala_orders');
      const storedOrders = saved ? (JSON.parse(saved) as Order[]) : [];
      return storedOrders.filter((order) => order.id !== 'AKM-92841');
    } catch {
      return [];
    }
  });

  const [activeTrackingId, setActiveTrackingId] = useState<string>('');
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = React.useCallback((msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3800);
  }, []);

  const refreshReviews = React.useCallback(async () => {
    const response = await fetch('/api/reviews');
    const result = await response.json() as {
      reviews?: Review[];
      summaries?: ProductReviewSummary[];
      error?: string;
    };
    if (!response.ok || !Array.isArray(result.reviews) || !Array.isArray(result.summaries)) {
      throw new Error(result.error || 'Customer reviews could not be loaded.');
    }
    setReviews(result.reviews);
    setReviewSummaries(result.summaries);
  }, []);

  const refreshCustomerAccount = React.useCallback(async () => {
    if (!supabase) throw new Error('Customer account sign-in is not configured.');
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const accessToken = data.session?.access_token;
    if (!accessToken) {
      setCustomerAddresses([]);
      setCustomerOrders([]);
      return;
    }

    setIsCustomerAccountLoading(true);
    try {
      const response = await fetch('/api/customer/account', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const result = await response.json() as {
        addresses?: CustomerAddress[];
        orders?: CustomerOrder[];
        error?: string;
      };
      if (!response.ok || !Array.isArray(result.addresses) || !Array.isArray(result.orders)) {
        throw new Error(result.error || 'Customer account details could not be loaded.');
      }
      setCustomerAddresses(result.addresses);
      setCustomerOrders(result.orders);
    } finally {
      setIsCustomerAccountLoading(false);
    }
  }, []);

  const saveCustomerAddress = React.useCallback(async (
    address: Omit<CustomerAddress, 'id'> & { id?: string }
  ) => {
    if (!supabase) throw new Error('Customer account sign-in is not configured.');
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const accessToken = data.session?.access_token;
    if (!accessToken) throw new Error('Sign in to save a delivery address.');

    const response = await fetch('/api/customer/addresses', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(address)
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) throw new Error(result.error || 'Delivery address could not be saved.');
    await refreshCustomerAccount();
  }, [refreshCustomerAccount]);

  const deleteCustomerAddress = React.useCallback(async (id: string) => {
    if (!supabase) throw new Error('Customer account sign-in is not configured.');
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const accessToken = data.session?.access_token;
    if (!accessToken) throw new Error('Sign in to remove a delivery address.');

    const response = await fetch(`/api/customer/addresses/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) throw new Error(result.error || 'Delivery address could not be removed.');
    await refreshCustomerAccount();
  }, [refreshCustomerAccount]);

  useEffect(() => {
    void refreshReviews().catch((error: unknown) => {
      console.error('Could not load customer reviews:', error);
    });
  }, [refreshReviews]);

  useEffect(() => {
    if (!user?.id) {
      setCustomerAddresses([]);
      setCustomerOrders([]);
      setIsCustomerAccountLoading(false);
      return;
    }
    void refreshCustomerAccount().catch((error: unknown) => {
      console.error('Could not load customer account:', error);
    });
  }, [user?.id, refreshCustomerAccount]);

  useEffect(() => {
    if (storeContentReady) return;
    let active = true;
    void fetch('/api/store/content')
      .then(async (response) => {
        const result = (await response.json()) as { content?: StoreContent | null; error?: string };
        if (!response.ok) throw new Error(result.error || 'Shared store content could not be loaded.');
        if (result.content) {
          const content = result.content;
          if (
            !Array.isArray(content.products) ||
            !content.siteAssets ||
            !Array.isArray(content.galleryItems) ||
            !Array.isArray(content.videosList)
          ) {
            throw new Error('Shared store content has an invalid format.');
          }
          if (active) {
            setAllProducts(content.products);
            setSiteAssets({ ...defaultSiteAssets, ...content.siteAssets });
            setGalleryItems(content.galleryItems);
            setVideosList(content.videosList);
          }
        }
        if (active) setStoreContentReady(true);
      })
      .catch((error: unknown) => {
        if (!active) return;
        console.error('Could not load shared store content:', error);
        if (isOwner) {
          showNotification('Shared catalog is unavailable. Run the Supabase migration before publishing changes.');
        }
      });

    return () => {
      active = false;
    };
  }, [storeContentReady, isOwner, showNotification]);

  useEffect(() => {
    if (!storeContentReady || (!isOwner && !adminAccessToken)) return;
    const content: StoreContent = { products: allProducts, siteAssets, galleryItems, videosList };
    const timeout = window.setTimeout(() => {
      storeContentSaveQueue.current = storeContentSaveQueue.current
        .catch(() => undefined)
        .then(async () => {
          let accessToken = adminAccessToken;
          if (!accessToken && isOwner) {
            if (!supabase) throw new Error('Supabase owner sign-in is not configured.');
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError) throw sessionError;
            accessToken = sessionData.session?.access_token || null;
          }
          if (!accessToken) throw new Error('Admin access expired. Unlock again to publish changes.');

          const response = await fetch('/api/admin/content', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify({ content })
          });
          const result = (await response.json()) as { error?: string };
          if (!response.ok) throw new Error(result.error || 'Shared store changes could not be saved.');
          showNotification('Store changes are saved and live for all visitors.');
        })
        .catch((error: unknown) => {
          console.error('Could not save shared store content:', error);
          showNotification(error instanceof Error ? error.message : 'Shared store changes could not be saved.');
        });
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [storeContentReady, isOwner, adminAccessToken, allProducts, siteAssets, galleryItems, videosList, showNotification]);

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
    let verificationSequence = 0;

    const syncSession = async (session: Session | null) => {
      const currentSequence = ++verificationSequence;
      if (!session?.user) {
        setUser(null);
        setIsOwner(false);
        setIsOwnerChecking(false);
        return;
      }

      setUser({
        id: session.user.id,
        name: session.user.user_metadata?.full_name || session.user.email || 'AK MALA Customer',
        phone: session.user.phone || '',
        email: session.user.email
      });
      setIsOwner(false);
      setIsOwnerChecking(true);

      try {
        const response = await fetch('/api/admin/access', {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const accessResult = (await response.json().catch(() => ({}))) as {
          authorized?: boolean;
          error?: string;
        };
        if (!isActive || currentSequence !== verificationSequence) return;

        const authorized = response.ok && accessResult.authorized === true;
        setIsOwner(authorized);
        setIsOwnerChecking(false);

        if (!authorized) {
          setIsAdminOpen(false);
          setIsDashboardOpen(false);
          if (!response.ok) {
            console.error('Owner access verification failed:', accessResult.error || response.status);
          }
        }
      } catch (error) {
        if (!isActive || currentSequence !== verificationSequence) return;
        setIsOwner(false);
        setIsOwnerChecking(false);
        setIsAdminOpen(false);
        setIsDashboardOpen(false);
        console.error('Owner access verification could not reach the server:', error);
      }
    };

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          console.error('Could not restore the signed-in user:', error);
          setIsOwnerChecking(false);
          return;
        }
        void syncSession(data.session);
      })
      .catch((error: unknown) => {
        console.error('Could not restore the signed-in user:', error);
        setIsOwnerChecking(false);
      });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSession(session);
    });

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

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  // CMS Functions
  const updateSiteAssets = (updated: Partial<SiteAssetsConfig>) => {
    setSiteAssets((prev) => ({ ...prev, ...updated }));
    if (
      'offerCode' in updated ||
      'offerEnabled' in updated ||
      'offerStartDate' in updated ||
      'offerEndDate' in updated ||
      'offerMinOrder' in updated ||
      'offerDiscountPercent' in updated
    ) {
      setAppliedCoupon(null);
    }
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

  const clearGallery = () => {
    setGalleryItems([]);
    showNotification('All gallery photos and videos removed.');
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
  const addToCart = (
    product: Product,
    size: MalaSize = '8"',
    customNotes?: string
  ) => {
    const sizeConfig = product.availableSizes.find((s) => s.size === size);
    const unitPrice = product.price + (sizeConfig ? sizeConfig.extraPrice : 0);
    const cartItemId = `${product.id}-${size}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartItemId);
      if (existing) {
        return prev.map((item) =>
          item.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      const nextItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        product,
        selectedSize: size as CartItem['selectedSize'],
        quantity: 1,
        pricePerUnit: unitPrice,
        customNotes
      };
      return [...prev, nextItem];
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
      availableSizes: [
        {
          size: config.size as Product['availableSizes'][number]['size'],
          name: `${config.size} Custom`,
          extraPrice: 0
        }
      ],
      freshnessHours: 72,
      inStock: true,
      fragranceLevel: 'Divine Sacred',
      bestForDeity: config.deityTarget
    };

    addToCart(customProduct, config.size as MalaSize, config.customNotes);
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
    if (
      isOfferActive(siteAssets) &&
      code.toUpperCase().trim() === siteAssets.offerCode.toUpperCase().trim() &&
      subtotal >= (siteAssets.offerMinOrder || 0)
    ) {
      setAppliedCoupon(siteAssets.offerCode);
      showNotification(`Coupon ${siteAssets.offerCode} applied! ${siteAssets.offerDiscountPercent}% discount granted.`);
      return true;
    }
    if (code.toUpperCase().trim() === siteAssets.offerCode.toUpperCase().trim() && isOfferActive(siteAssets) && subtotal < (siteAssets.offerMinOrder || 0)) {
      showNotification(`Add items worth ₹${(siteAssets.offerMinOrder || 0) - subtotal} more to use this coupon.`);
    } else {
      showNotification('This coupon is invalid or no longer active.');
    }
    return false;
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const discount =
    isOfferActive(siteAssets) &&
    subtotal >= (siteAssets.offerMinOrder || 0) &&
    appliedCoupon?.toUpperCase() === siteAssets.offerCode.toUpperCase()
      ? Math.round(subtotal * (siteAssets.offerDiscountPercent / 100))
      : 0;
  const deliveryCharge = subtotal >= (siteAssets.freeDeliveryThreshold ?? 999) || subtotal === 0 ? 0 : 99;
  const finalTotal = Math.max(0, subtotal - discount + deliveryCharge);

  // Wishlist
  const toggleWishlist = (productId: string) => {
    setWishlistIds((prev) => {
      const exists = prev.includes(productId);
      if (exists) {
        trackEvent('wishlist_remove', productId);
        showNotification('Removed from sacred wishlist');
        return prev.filter((id) => id !== productId);
      }
      trackEvent('wishlist_add', productId);
      showNotification('Added to sacred wishlist');
      return [...prev, productId];
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
        reviewProductId,
        setReviewProductId,
        reviews,
        reviewSummaries,
        refreshReviews,
        customerAddresses,
        customerOrders,
        isCustomerAccountLoading,
        refreshCustomerAccount,
        saveCustomerAddress,
        deleteCustomerAddress,
        isAdminOpen,
        setIsAdminOpen,
        isOwner,
        isOwnerChecking,
        adminAccessToken,
        setAdminAccessToken,
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