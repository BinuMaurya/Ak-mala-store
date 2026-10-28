import type { CartItem, Order } from '../types';

type RazorpayMethod = 'upi' | 'card' | 'netbanking' | 'wallet';
type RazorpayPaymentMethod = Exclude<Order['paymentMethod'], 'cod'>;

interface PaymentQuote {
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
}

interface RazorpayCheckoutResult {
  quote: PaymentQuote;
  paymentMethod: RazorpayPaymentMethod;
  orderNumber: string;
}

interface RazorpayCheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; contact: string; email: string };
  method: Record<RazorpayMethod, boolean>;
  theme: { color: string };
  handler: (response: RazorpayCheckoutResponse) => void;
  modal: { ondismiss: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface StartRazorpayCheckoutOptions {
  cart: CartItem[];
  couponCode: string | null;
  expectedTotal: number;
  method: RazorpayMethod;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: { line1: string; city: string; state: string; pincode: string };
  };
  visitorId: string | null;
}

function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );
    const script = existingScript ?? document.createElement('script');
    const handleLoad = () => {
      if (window.Razorpay) resolve();
      else reject(new Error('Razorpay checkout could not be loaded. Please try again.'));
    };
    const handleError = () => reject(new Error('Could not load Razorpay checkout. Check your internet connection.'));

    script.addEventListener('load', handleLoad, { once: true });
    script.addEventListener('error', handleError, { once: true });
    if (!existingScript) {
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  });
}

async function postJson<T>(url: string, data: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(result.error || 'Payment could not be started. Please try again.');
  }
  return result;
}

export async function startRazorpayCheckout({
  cart,
  couponCode,
  expectedTotal,
  method,
  customer,
  visitorId
}: StartRazorpayCheckoutOptions): Promise<RazorpayCheckoutResult> {
  const order = await postJson<{
    keyId: string;
    order: { id: string; amount: number; currency: string };
    quote: PaymentQuote;
    storeOrderId: string;
    orderNumber: string;
  }>('/api/payments/create-order', {
    cart: cart.map(({ productId, selectedSize, quantity }) => ({
      productId,
      selectedSize,
      quantity
    })),
    couponCode,
    customer,
    visitorId,
    paymentMethod: method
  });

  if (order.quote.total !== expectedTotal) {
    throw new Error(
      `The cart total was updated to ₹${order.quote.total}. Please review the total and try again.`
    );
  }

  await loadRazorpayScript();
  if (!window.Razorpay) {
    throw new Error('Razorpay checkout is unavailable. Please try again.');
  }
  const RazorpayCheckout = window.Razorpay;

  return new Promise((resolve, reject) => {
    let settled = false;
    const checkout = new RazorpayCheckout({
      key: order.keyId,
      amount: order.order.amount,
      currency: order.order.currency,
      name: 'AK MALA',
      description: 'Sacred garland order',
      order_id: order.order.id,
      prefill: {
        name: customer.name,
        contact: customer.phone.replace(/\D/g, '').slice(-10),
        email: customer.email
      },
      method: {
        upi: method === 'upi',
        card: method === 'card',
        netbanking: method === 'netbanking',
        wallet: method === 'wallet'
      },
      theme: { color: '#D4AF37' },
      handler: async (response) => {
        try {
          const verified = await postJson<{
            verified: boolean;
            paymentMethod: RazorpayPaymentMethod;
            orderNumber: string;
          }>('/api/payments/verify', response);
          if (!verified.verified) {
            throw new Error('Payment verification failed. Your order has not been confirmed.');
          }
          settled = true;
          resolve({
            quote: order.quote,
            paymentMethod: verified.paymentMethod,
            orderNumber: verified.orderNumber
          });
        } catch (error) {
          settled = true;
          reject(error);
        }
      },
      modal: {
        ondismiss: () => {
          if (!settled) {
            settled = true;
            reject(new Error('Payment window closed. No order was confirmed.'));
          }
        }
      }
    });

    checkout.open();
  });
}
