export interface Product {
  id: string;
  name: string;
  hindiName: string;
  marathiName: string;
  category: 'rose' | 'mogra' | 'marigold' | 'orchid' | 'tulsi' | 'temple' | 'wedding' | 'festive';
  price: number;
  originalPrice: number;
  discountPercent: number;
  rating: number;
  reviewsCount: number;
  image: string;
  galleryImages: string[];
  tags: string[];
  flowers: string[];
  description: string;
  hindiDescription: string;
  availableSizes: {
    size: '16"' | '22"' | '28"' | '36"';
    name: string;
    extraPrice: number;
  }[];
  freshnessHours: number;
  inStock: boolean;
  fragranceLevel: 'Subtle' | 'High' | 'Divine Sacred';
  bestForDeity: string;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  selectedSize: '16"' | '22"' | '28"' | '36"';
  quantity: number;
  customNotes?: string;
  pricePerUnit: number;
}

export interface WishlistItem {
  productId: string;
  addedAt: number;
}

export interface CustomMalaConfig {
  flowerType: 'mogra' | 'rose' | 'marigold' | 'orchid' | 'lotus';
  pattern: 'single' | 'dual' | 'tricolor' | 'spiral';
  secondaryColor?: string;
  size: '16"' | '22"' | '28"' | '36"';
  deityTarget: string;
  finishing: 'zari_tassels' | 'pearls' | 'kundan' | 'simple';
  addHolyFragrance: boolean;
  addVelvetBox: boolean;
  customNotes: string;
  totalPrice: number;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  city: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verifiedDevotee: boolean;
  deityPurchasedFor: string;
  helpfulCount: number;
  userVotedHelpful?: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  email: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'wallet' | 'cod';
  paymentStatus: 'paid' | 'pending';
  orderStatus: 'confirmed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered';
  createdAt: string;
  estimatedDelivery: string;
  trackingNumber: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
  category: 'ganpati_darshan' | 'customer_photos' | 'temple_events' | 'artisan_handcraft' | 'varmala_wedding';
  tags: string[];
  date: string;
  likes: number;
  location?: string;
  videoDuration?: string;
}

export interface VideoItem {
  id: string;
  title: string;
  duration: string;
  image: string;
  videoUrl?: string;
  category?: string;
}

export interface SiteAssetsConfig {
  heroGaneshaImage: string;
  heroHeadline: string;
  heroHeadlineHighlight: string;
  heroSubtitle: string;
  offerBannerText: string;
  offerCode: string;
  offerDiscountPercent: number;
  freeDeliveryThreshold: number;
  customThaliImage: string;
  brandTagline: string;
}

export type Language = 'en' | 'hi' | 'mr' | 'gu';
