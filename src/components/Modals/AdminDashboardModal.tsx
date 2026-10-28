import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../services/supabase';
import {
  Activity,
  Download,
  LockKeyhole,
  LogOut,
  Package,
  Printer,
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

function escapeCsv(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export const AdminDashboardModal: React.FC = () => {
  const { isDashboardOpen, setIsDashboardOpen, showNotification, allProducts } = useApp();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [waitingForOtp, setWaitingForOtp] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<DashboardOrder | null>(null);

  useEffect(() => {
    if (!printingOrder) return;
    const timer = window.setTimeout(() => {
      window.print();
      setPrintingOrder(null);
    }, 50);
    return () => window.clearTimeout(timer);
  }, [printingOrder]);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data: sessionData }) => {
      setAccessToken(sessionData.session?.access_token || null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAccessToken(session?.access_token || null);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isDashboardOpen || !accessToken) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    void fetch('/api/admin/data', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then(async (response) => {
        const result = await response.json() as DashboardData & { error?: string };
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
    return () => { cancelled = true; };
  }, [isDashboardOpen, accessToken]);

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
      galleryLikes: events.filter((event) => event.event_type === 'gallery_like').length -
        events.filter((event) => event.event_type === 'gallery_unlike').length,
      paidOrders: paidOrders.length,
      revenue: paidOrders.reduce((total, order) => total + order.total, 0),
      productActivity: [...productActivity.entries()]
        .map(([id, activity]) => ({ id, name: productNames.get(id) || id, ...activity }))
        .sort((left, right) => right.netWishlist - left.netWishlist || right.views - left.views)
    };
  }, [data, allProducts]);

  if (!isDashboardOpen) return null;

  const sendOwnerCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      setError('Owner sign-in is not configured. Add the VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY settings.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false }
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    setWaitingForOtp(true);
    showNotification('A one-time owner sign-in code was sent to your email.');
  };

  const verifyOwnerCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setLoading(true);
    setError('');
    const { data: authData, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: 'email'
    });
    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
      return;
    }
    setAccessToken(authData.session?.access_token || null);
  };

  const updateStatus = async (order: DashboardOrder, orderStatus: string) => {
    if (!accessToken) return;
    try {
      const response = await fetch(`/api/admin/orders/${encodeURIComponent(order.id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ orderStatus })
      });
      const result = await response.json() as { order?: DashboardOrder; error?: string };
      if (!response.ok || !result.order) throw new Error(result.error || 'Order status could not be updated.');
      setData((current) => current && ({
        ...current,
        orders: current.orders.map((item) => item.id === order.id ? result.order! : item)
      }));
    } catch (statusError) {
      showNotification(statusError instanceof Error ? statusError.message : 'Order status could not be updated.');
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
        <header className="flex items-center justify-between border-b border-white/10 bg-[#060a14] p-4 sm:p-5">
          <div>
            <h3 className="font-cinzel text-base font-bold text-white">Owner Dashboard</h3>
            <p className="mt-1 text-[11px] text-gray-400">Real consented analytics and saved store orders</p>
          </div>
          <div className="flex items-center gap-2">
            {accessToken && (
              <button
                onClick={() => void supabase?.auth.signOut()}
                className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-2 text-xs text-gray-300"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            )}
            <button onClick={() => setIsDashboardOpen(false)} className="rounded-lg bg-white/5 p-1.5 text-gray-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {!accessToken ? (
          <div className="m-auto w-full max-w-sm space-y-4 p-6">
            <LockKeyhole className="mx-auto h-9 w-9 text-amber-300" />
            <p className="text-center text-xs text-gray-300">
              Sign in with the verified owner email configured in the server's <code>ADMIN_EMAILS</code> allowlist.
            </p>
            {!waitingForOtp ? (
              <form onSubmit={sendOwnerCode} className="space-y-3">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Owner email"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/20 bg-black/50 p-3 text-sm text-white"
                />
                <button disabled={loading} className="w-full rounded-xl bg-amber-400 p-3 text-sm font-bold text-black disabled:opacity-50">
                  {loading ? 'Sending code…' : 'Send sign-in code'}
                </button>
              </form>
            ) : (
              <form onSubmit={verifyOwnerCode} className="space-y-3">
                <input
                  inputMode="numeric"
                  required
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  placeholder="Email verification code"
                  className="w-full rounded-xl border border-white/20 bg-black/50 p-3 text-sm text-white"
                />
                <button disabled={loading} className="w-full rounded-xl bg-amber-400 p-3 text-sm font-bold text-black disabled:opacity-50">
                  {loading ? 'Verifying…' : 'Verify owner code'}
                </button>
              </form>
            )}
            {error && <p role="alert" className="text-center text-xs text-red-300">{error}</p>}
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
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-300">Product activity (consenting visitors)</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-gray-400"><tr><th className="py-2">Product</th><th>Views</th><th>Wishlist adds (net)</th></tr></thead>
                  <tbody className="divide-y divide-white/5">
                    {metrics.productActivity.map((product) => (
                      <tr key={product.id}><td className="py-2 text-gray-200">{product.name}</td><td>{product.views}</td><td>{Math.max(0, product.netWishlist)}</td></tr>
                    ))}
                    {metrics.productActivity.length === 0 && <tr><td colSpan={3} className="py-4 text-gray-500">No consented product activity recorded yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">Orders and shipping</h4>
                <button onClick={exportOrders} className="flex items-center gap-1 rounded-lg border border-white/10 px-2.5 py-2 text-xs text-amber-200">
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
              </div>
              <div className="space-y-3">
                {(data?.orders || []).map((order) => (
                  <article key={order.id} className="rounded-xl border border-white/10 bg-black/30 p-3 text-xs">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-white">{order.order_number} · {order.customer_name}</p>
                        <p className="mt-1 text-gray-300">{order.phone}{order.email ? ` · ${order.email}` : ''}</p>
                        <p className="mt-1 text-gray-400">
                          {order.shipping_address.line1}, {order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.pincode}
                        </p>
                        <p className="mt-2 text-gray-300">
                          {order.items.map((item) => `${item.productName} (${item.selectedSize}) × ${item.quantity}`).join(' · ')}
                        </p>
                        <p className="mt-1 font-bold text-amber-200">
                          ₹{order.total.toLocaleString('en-IN')} · {order.payment_method.toUpperCase()} / {order.payment_status.toUpperCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          aria-label={`Status for ${order.order_number}`}
                          value={order.order_status}
                          onChange={(event) => void updateStatus(order, event.target.value)}
                          className="rounded-lg border border-white/20 bg-[#101827] p-2 text-xs text-white"
                        >
                          {orderStatuses.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}
                        </select>
                        <button onClick={() => setPrintingOrder(order)} className="flex items-center gap-1 rounded-lg bg-amber-400 px-2.5 py-2 font-bold text-black">
                          <Printer className="h-3.5 w-3.5" /> Slip
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
                {!data?.orders.length && <p className="py-4 text-center text-xs text-gray-500">No orders have been saved yet.</p>}
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-amber-300">Recent consented visitor activity</h4>
              <div className="space-y-2">
                {(data?.events || []).slice(0, 30).map((event) => (
                  <div key={event.id} className="flex flex-wrap justify-between gap-2 border-b border-white/5 py-2 text-xs">
                    <span className="text-gray-200">
                      {event.event_type.replaceAll('_', ' ')}{event.product_id ? ` · ${event.product_id}` : ` · ${event.page_path}`}
                    </span>
                    <span className="font-mono text-gray-500">{event.visitor_id.slice(0, 8)}… · {new Date(event.created_at).toLocaleString()}</span>
                  </div>
                ))}
                {!data?.events.length && <p className="text-xs text-gray-500">No visitors have accepted analytics consent yet.</p>}
              </div>
            </section>
          </div>
        )}

        {printingOrder && (
          <div id="shipping-slip" className="hidden bg-white p-8 text-black">
            <h1 className="text-2xl font-bold">AK MALA · SHIPPING SLIP</h1>
            <p className="mt-4"><strong>Order:</strong> {printingOrder.order_number}</p>
            <p><strong>Date:</strong> {new Date(printingOrder.created_at).toLocaleDateString()}</p>
            <h2 className="mt-6 font-bold">SHIP TO</h2>
            <p className="text-lg font-semibold">{printingOrder.customer_name}</p>
            <p>{printingOrder.shipping_address.line1}</p>
            <p>{printingOrder.shipping_address.city}, {printingOrder.shipping_address.state} - {printingOrder.shipping_address.pincode}</p>
            <p>Phone: {printingOrder.phone}</p>
            <h2 className="mt-6 font-bold">ITEMS</h2>
            {printingOrder.items.map((item, index) => (
              <p key={`${item.productId}-${index}`}>{item.productName} · {item.selectedSize} · Qty {item.quantity}</p>
            ))}
            <p className="mt-4 font-bold">Total: ₹{printingOrder.total.toLocaleString('en-IN')} · {printingOrder.payment_method.toUpperCase()} ({printingOrder.payment_status})</p>
          </div>
        )}
      </div>
    </div>
  );
};
