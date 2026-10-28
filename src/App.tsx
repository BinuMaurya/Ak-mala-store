import React, { useState, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AnnouncementBar } from './components/AnnouncementBar';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Smartphone, Monitor, Sparkles, BarChart3, Layers } from 'lucide-react';
import { AnalyticsConsentNotice } from './components/AnalyticsConsentNotice';
import { StoreAssistant } from './components/StoreAssistant';

// Lazy loading all major homepage sections & heavy components
const Hero = lazy(() =>
  import('./components/Hero').then((module) => ({ default: module.Hero }))
);
const CategoryExplorer = lazy(() =>
  import('./components/CategoryExplorer').then((module) => ({ default: module.CategoryExplorer }))
);
const BestSellers = lazy(() =>
  import('./components/BestSellers').then((module) => ({ default: module.BestSellers }))
);
const TrustBadges = lazy(() =>
  import('./components/TrustBadges').then((module) => ({ default: module.TrustBadges }))
);
const CustomMalaBanner = lazy(() =>
  import('./components/CustomMalaBanner').then((module) => ({ default: module.CustomMalaBanner }))
);
const BottomGridSection = lazy(() =>
  import('./components/BottomGridSection').then((module) => ({ default: module.BottomGridSection }))
);
const CustomMalaBuilder = lazy(() =>
  import('./components/CustomMalaBuilder').then((module) => ({ default: module.CustomMalaBuilder }))
);
const EasyShoppingExperience = lazy(() =>
  import('./components/EasyShoppingExperience').then((module) => ({ default: module.EasyShoppingExperience }))
);
const GallerySection = lazy(() =>
  import('./components/GallerySection').then((module) => ({ default: module.GallerySection }))
);
const MobileAppView = lazy(() =>
  import('./components/MobileAppView').then((module) => ({ default: module.MobileAppView }))
);

// Lazy loading all heavy modal dialogs
const AdminPanelModal = lazy(() =>
  import('./components/Admin/AdminPanelModal').then((module) => ({ default: module.AdminPanelModal }))
);
const ProductDetailModal = lazy(() =>
  import('./components/Modals/ProductDetailModal').then((module) => ({ default: module.ProductDetailModal }))
);
const CartDrawer = lazy(() =>
  import('./components/Modals/CartDrawer').then((module) => ({ default: module.CartDrawer }))
);
const CheckoutModal = lazy(() =>
  import('./components/Modals/CheckoutModal').then((module) => ({ default: module.CheckoutModal }))
);
const OrderTrackerModal = lazy(() =>
  import('./components/Modals/OrderTrackerModal').then((module) => ({ default: module.OrderTrackerModal }))
);
const OrderHistoryModal = lazy(() =>
  import('./components/Modals/OrderHistoryModal').then((module) => ({ default: module.OrderHistoryModal }))
);
const AuthOtpModal = lazy(() =>
  import('./components/Modals/AuthOtpModal').then((module) => ({ default: module.AuthOtpModal }))
);
const AdminDashboardModal = lazy(() =>
  import('./components/Modals/AdminDashboardModal').then((module) => ({ default: module.AdminDashboardModal }))
);
const ReviewModal = lazy(() =>
  import('./components/Modals/ReviewModal').then((module) => ({ default: module.ReviewModal }))
);

// Devotional Loading Fallback
const DevotionalFallback: React.FC<{ label?: string }> = ({ label = 'Loading Sacred Section...' }) => (
  <div className="w-full py-16 flex flex-col items-center justify-center text-center p-6 gap-3">
    <div className="w-10 h-10 border-3 border-[#D4AF37]/25 border-t-[#D4AF37] rounded-full animate-spin" />
    <span className="font-cinzel text-xs text-[#E5C158] tracking-widest uppercase">
      {label}
    </span>
  </div>
);

const MainContent: React.FC = () => {
  const { notification, setIsDashboardOpen } = useApp();
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile_simulator'>('desktop');
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#030712] text-gray-100 flex flex-col font-sans selection:bg-[#D4AF37]/30 selection:text-[#E5C158] relative">
      
      {/* Floating Device Mode Switcher Dock */}
      <div className="fixed bottom-20 lg:bottom-6 right-4 z-40 flex items-center p-1.5 rounded-2xl bg-black/85 border-2 border-[#D4AF37]/60 shadow-[0_0_25px_rgba(212,175,55,0.4)] backdrop-blur-xl gap-1">
        <button
          onClick={() => setViewMode('desktop')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'desktop'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black shadow-md'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Desktop Store</span>
        </button>

        <button
          onClick={() => setViewMode('mobile_simulator')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            viewMode === 'mobile_simulator'
              ? 'bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-black shadow-md'
              : 'text-gray-300 hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Mobile App (7 Screens)</span>
        </button>

        {/* Owner Analytics Dashboard */}
        <button
          onClick={() => setIsDashboardOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#E5C158] hover:bg-white/10 transition-all border border-amber-500/30 cursor-pointer"
          title="Sign in to view store orders and consented analytics"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Owner Dashboard</span>
        </button>
      </div>

      {/* Global Toast Notification */}
      {notification && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#0b1222] border border-[#D4AF37] text-amber-200 text-xs font-semibold shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_20px_rgba(212,175,55,0.3)] backdrop-blur-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-300">
          <Sparkles className="w-4 h-4 text-[#E5C158]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Announcement Bar */}
      <AnnouncementBar />

      {/* Global Header & Nav */}
      <Navbar />
      <AnalyticsConsentNotice />

      {/* Main Viewport switcher */}
      {viewMode === 'desktop' ? (
        <main className="flex-1">
          {/* Hero Section with 3D Ganesha Viewport */}
          <Suspense fallback={<DevotionalFallback label="Preparing 3D Divine Darshan..." />}>
            <Hero />
          </Suspense>

          {/* Explore By Category */}
          <Suspense fallback={<DevotionalFallback label="Loading Sacred Categories..." />}>
            <CategoryExplorer />
          </Suspense>

          {/* Best Sellers Grid & Product Cards */}
          <Suspense fallback={<DevotionalFallback label="Loading Best Sellers..." />}>
            <BestSellers />
          </Suspense>

          {/* 4-Column Trust Badges Bar */}
          <Suspense fallback={<DevotionalFallback label="Loading Trust Standards..." />}>
            <TrustBadges />
          </Suspense>

          {/* Create Your Own Custom Mala Banner */}
          <Suspense fallback={<DevotionalFallback label="Loading Custom Mala Studio..." />}>
            <CustomMalaBanner />
          </Suspense>

          {/* 4 Bottom Cards: Mala Videos, Customer Reviews, Why Choose AK Mala, Ganpati Special */}
          <Suspense fallback={<DevotionalFallback label="Loading Community Darshans & Videos..." />}>
            <BottomGridSection />
          </Suspense>

          {/* Interactive Custom Mala Studio */}
          <Suspense fallback={<DevotionalFallback label="Loading Custom Studio Wizard..." />}>
            <CustomMalaBuilder />
          </Suspense>

          {/* 1,000+ Media Gallery Section */}
          <Suspense fallback={<DevotionalFallback label="Loading 1,000+ Devotional Gallery..." />}>
            <GallerySection />
          </Suspense>

          {/* Easy Shopping Experience 6 Steps & Sub-Trust Bar */}
          <Suspense fallback={<DevotionalFallback label="Loading Shopping Guide..." />}>
            <EasyShoppingExperience />
          </Suspense>
        </main>
      ) : (
        <main className="flex-1 py-4">
          <div className="text-center mb-2">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">
              Live Mobile Screens Interactive Preview (7 Screens)
            </span>
          </div>
          <Suspense fallback={<DevotionalFallback label="Loading Mobile Simulator..." />}>
            <MobileAppView />
          </Suspense>
        </main>
      )}

      {/* Global Luxury Footer */}
      <Footer />

      {/* Persistent Mobile Bottom Bar */}
      <MobileBottomNav onOpenOrders={() => setOrderHistoryOpen(true)} />
      <StoreAssistant />

      {/* Interactive Global Modals with Suspense */}
      <Suspense fallback={null}>
        <AdminPanelModal />
        <ProductDetailModal />
        <CartDrawer />
        <CheckoutModal />
        <OrderTrackerModal />
        <OrderHistoryModal isOpen={orderHistoryOpen} onClose={() => setOrderHistoryOpen(false)} />
        <AuthOtpModal />
        <AdminDashboardModal />
        <ReviewModal />
      </Suspense>

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
