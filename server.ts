import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import express, { type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { products } from './src/data/products';
import type { Product } from './src/types';

const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const freeDeliveryThreshold = 999;
const deliveryFee = 99;
const festivalCouponCode = 'FEST15';
const festivalDiscountPercent = 15;
const maxCartItems = 50;

class GatewayError extends Error {}

interface CartLineInput {
  productId: string;
  selectedSize: string;
  quantity: number;
}

interface PaymentQuote {
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  total: number;
}

interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  notes: Record<string, string>;
}

interface RazorpayPayment {
  id: string;
  order_id: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  method: 'upi' | 'card' | 'netbanking' | 'wallet';
}

interface ShippingAddress {
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

interface CheckoutCustomer {
  name: string;
  phone: string;
  email: string | null;
  address: ShippingAddress;
}

interface StoredOrder {
  id: string;
  order_number: string;
  razorpay_order_id: string | null;
  visitor_id: string | null;
  customer_name: string;
  phone: string;
  email: string | null;
  shipping_address: ShippingAddress;
  items: Array<{
    productId: string;
    productName: string;
    selectedSize: string;
    quantity: number;
    pricePerUnit: number;
  }>;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
}

app.use(express.json({ limit: '14mb' }));

app.get('/api/plugins/status', (_request: Request, response: Response) => {
  response.json({
    gemini: Boolean(process.env.GEMINI_API_KEY),
    supabase: Boolean(
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  });
});

app.post('/api/assistant/chat', async (request: Request, response: Response) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    response.status(503).json({ error: 'The store assistant is not configured yet. Please contact the store owner.' });
    return;
  }

  const body = request.body as { messages?: unknown };
  if (
    !Array.isArray(body?.messages) ||
    body.messages.length < 1 ||
    body.messages.length > 10 ||
    body.messages.some((message) =>
      !message ||
      typeof message !== 'object' ||
      !('role' in message) ||
      !('text' in message) ||
      ((message as { role: unknown }).role !== 'user' && (message as { role: unknown }).role !== 'assistant') ||
      typeof (message as { text: unknown }).text !== 'string' ||
      !(message as { text: string }).text.trim() ||
      (message as { text: string }).text.length > 1000
    ) ||
    (body.messages[body.messages.length - 1] as { role?: unknown }).role !== 'user'
  ) {
    response.status(400).json({ error: 'Please send a valid message of up to 1,000 characters.' });
    return;
  }

  const catalogue = products.map((product) => ({
    name: product.name,
    category: product.category,
    priceINR: product.price,
    sizes: product.availableSizes.map((size) => ({
      size: size.size,
      additionalPriceINR: size.extraPrice
    })),
    flowers: product.flowers,
    description: product.description,
    inStock: product.inStock,
    bestFor: product.bestForDeity
  }));
  const systemInstruction = [
    'You are the helpful AK MALA online store assistant.',
    'Answer product questions using only this product catalogue; do not invent products, prices, sizes, stock, or delivery promises.',
    'For shipping and order-specific information, explain that delivery timing depends on the destination and direct customers to Track Order or store support when needed.',
    'Never ask customers to provide payment credentials, OTPs, or sensitive personal information in chat.',
    'Reply in the same language as the customer, including English, Hindi, Marathi, or Gujarati.',
    'Keep answers warm, concise, and useful. If a fact is not in the catalogue or store information, say so clearly.',
    `Product catalogue: ${JSON.stringify(catalogue)}`
  ].join('\n');

  try {
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: body.messages.map((message) => {
        const chatMessage = message as { role: 'user' | 'assistant'; text: string };
        return {
          role: chatMessage.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: chatMessage.text.trim() }]
        };
      }),
      config: { systemInstruction }
    });
    const reply = result.text?.trim();
    if (!reply) throw new Error('Gemini returned an empty assistant response.');
    response.json({ reply });
  } catch (error) {
    console.error('Store assistant request failed:', error);
    response.status(502).json({ error: 'The assistant is temporarily unavailable. Please try again shortly.' });
  }
});

function getSupabaseCredentials() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error('Supabase is not configured. Add the server-side Supabase variables before accepting orders.');
  }
  return { url: url.replace(/\/$/, ''), anonKey, serviceRoleKey };
}

async function supabaseRequest<T>(
  tablePath: string,
  method: 'GET' | 'POST' | 'PATCH',
  body?: unknown,
  prefer?: string
): Promise<T> {
  const { url, serviceRoleKey } = getSupabaseCredentials();
  let result: globalThis.Response;
  try {
    result = await fetch(`${url}/rest/v1/${tablePath}`, {
      method,
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(prefer ? { Prefer: prefer } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  } catch {
    throw new GatewayError('Could not reach the order database. Please try again.');
  }

  if (!result.ok) {
    const details = await result.text();
    console.error('Supabase database request failed:', result.status, details);
    throw new GatewayError('The order could not be saved. Please contact the store before retrying payment.');
  }
  if (result.status === 204) return undefined as T;
  return (await result.json()) as T;
}

function parseCheckoutCustomer(input: unknown): CheckoutCustomer {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Please provide your delivery details.');
  }
  const customer = input as Record<string, unknown>;
  const address = customer.address;
  if (!address || typeof address !== 'object' || Array.isArray(address)) {
    throw new Error('Please provide your complete delivery address.');
  }
  const shippingAddress = address as Record<string, unknown>;
  const name = customer.name;
  const phone = customer.phone;
  const email = customer.email;
  const line1 = shippingAddress.line1;
  const city = shippingAddress.city;
  const state = shippingAddress.state;
  const pincode = shippingAddress.pincode;
  if (
    typeof name !== 'string' || !name.trim() || name.length > 120 ||
    typeof phone !== 'string' || !/^\+?\d[\d\s()-]{8,}\d$/.test(phone) ||
    (email !== null && email !== undefined &&
      (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) ||
    typeof line1 !== 'string' || !line1.trim() || line1.length > 300 ||
    typeof city !== 'string' || !city.trim() || city.length > 100 ||
    typeof state !== 'string' || !state.trim() || state.length > 100 ||
    typeof pincode !== 'string' || !/^\d{6}$/.test(pincode)
  ) {
    throw new Error('Please provide a valid name, phone number, email (if provided), and delivery address.');
  }
  return {
    name: name.trim(),
    phone: phone.trim(),
    email: typeof email === 'string' ? email.trim() : null,
    address: { line1: line1.trim(), city: city.trim(), state: state.trim(), pincode }
  };
}

function parseVisitorId(input: unknown): string | null {
  if (input === null || input === undefined || input === '') return null;
  if (typeof input !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input)) {
    throw new Error('Invalid visitor consent identifier.');
  }
  return input;
}

async function loadCatalogProducts(): Promise<Product[]> {
  const rows = await supabaseRequest<Array<{ id: string; data: Product; is_active: boolean }>>(
    'store_products?select=id,data,is_active',
    'GET'
  );
  const overrides = new Map(rows.map((row) => [row.id, row]));
  const merged = products.flatMap((baseProduct) => {
    const row = overrides.get(baseProduct.id);
    if (!row) return [baseProduct];
    return row.is_active ? [row.data] : [];
  });
  for (const row of rows) {
    if (row.is_active && !products.some((baseProduct) => baseProduct.id === row.id)) {
      merged.push(row.data);
    }
  }
  return merged;
}

function parseProduct(input: unknown): Product {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid product details.');
  }
  const product = input as Record<string, unknown>;
  const allowedCategories = ['rose', 'mogra', 'marigold', 'orchid', 'tulsi', 'temple', 'wedding', 'festive'];
  const allowedSizes = ['16"', '22"', '28"', '36"'];
  const safeMediaUrl = (value: unknown) =>
    typeof value === 'string' && value.length <= 2048 &&
    (value.startsWith('https://') || (value.startsWith('/') && !value.startsWith('//')));
  const stringArray = (value: unknown, max: number) =>
    Array.isArray(value) && value.length <= max &&
    value.every((entry) => typeof entry === 'string' && entry.length <= 160);
  if (
    typeof product.id !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(product.id) ||
    typeof product.name !== 'string' || !product.name.trim() || product.name.length > 160 ||
    typeof product.hindiName !== 'string' || product.hindiName.length > 160 ||
    typeof product.marathiName !== 'string' || product.marathiName.length > 160 ||
    typeof product.description !== 'string' || product.description.length > 3000 ||
    typeof product.hindiDescription !== 'string' || product.hindiDescription.length > 3000 ||
    typeof product.bestForDeity !== 'string' || product.bestForDeity.length > 300 ||
    typeof product.price !== 'number' || !Number.isSafeInteger(product.price) || product.price < 1 || product.price > 10000000 ||
    typeof product.originalPrice !== 'number' || !Number.isSafeInteger(product.originalPrice) || product.originalPrice < 1 || product.originalPrice > 10000000 ||
    typeof product.discountPercent !== 'number' || !Number.isFinite(product.discountPercent) || product.discountPercent < 0 || product.discountPercent > 100 ||
    typeof product.rating !== 'number' || !Number.isFinite(product.rating) || product.rating < 0 || product.rating > 5 ||
    typeof product.reviewsCount !== 'number' || !Number.isSafeInteger(product.reviewsCount) || product.reviewsCount < 0 ||
    typeof product.freshnessHours !== 'number' || !Number.isSafeInteger(product.freshnessHours) || product.freshnessHours < 1 || product.freshnessHours > 10000 ||
    typeof product.fragranceLevel !== 'string' || !['Subtle', 'High', 'Divine Sacred'].includes(product.fragranceLevel) ||
    !safeMediaUrl(product.image) ||
    typeof product.inStock !== 'boolean' ||
    typeof product.category !== 'string' || !allowedCategories.includes(product.category) ||
    !Array.isArray(product.availableSizes) || product.availableSizes.length < 1 || product.availableSizes.length > 4 ||
    !Array.isArray(product.galleryImages) || product.galleryImages.length > 12 || !product.galleryImages.every(safeMediaUrl) ||
    !stringArray(product.tags, 30) || !stringArray(product.flowers, 30)
  ) {
    throw new Error('Product details are incomplete or invalid.');
  }
  for (const size of product.availableSizes) {
    if (!size || typeof size !== 'object') {
      throw new Error('One or more product sizes are invalid.');
    }
    const sizeRecord = size as Record<string, unknown>;
    if (
      typeof sizeRecord.size !== 'string' || !allowedSizes.includes(sizeRecord.size) ||
      typeof sizeRecord.name !== 'string' ||
      typeof sizeRecord.extraPrice !== 'number' ||
      !Number.isSafeInteger(sizeRecord.extraPrice) ||
      sizeRecord.extraPrice < 0
    ) {
      throw new Error('One or more product sizes are invalid.');
    }
  }
  if (JSON.stringify(product).length > 64000) throw new Error('Product details are too large.');
  return product as unknown as Product;
}

async function createStoredOrderFields(
  cartLines: CartLineInput[],
  customer: CheckoutCustomer,
  couponCode: unknown,
  visitorId: string | null
) {
  const catalogue = await loadCatalogProducts();
  const quote = createPaymentQuote(cartLines, couponCode, catalogue);
  const items = cartLines.map((line) => {
    const product = catalogue.find((candidate) => candidate.id === line.productId);
    const size = product?.availableSizes.find((option) => option.size === line.selectedSize);
    if (!product || !product.inStock || !size) throw new Error('A cart item is unavailable. Refresh your cart and try again.');
    return {
      productId: product.id,
      productName: product.name,
      selectedSize: size.size,
      quantity: line.quantity,
      pricePerUnit: product.price + size.extraPrice
    };
  });
  return {
    visitor_id: visitorId,
    customer_name: customer.name,
    phone: customer.phone,
    email: customer.email,
    shipping_address: customer.address,
    items,
    subtotal: quote.subtotal,
    discount: quote.discount,
    delivery_charge: quote.deliveryCharge,
    total: quote.total
  };
}

function createOrderNumber(): string {
  return `AKM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function requireAdmin(request: Request): Promise<void> {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Please sign in with the authorized owner account.');
  }
  const { url, anonKey } = getSupabaseCredentials();
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length === 0) {
    throw new Error('Owner access is not configured. Add ADMIN_EMAILS to the server environment.');
  }

  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: authorization }
  });
  if (!response.ok) throw new Error('Your owner sign-in has expired. Please sign in again.');
  const authenticatedUser = (await response.json()) as { email?: string };
  if (!authenticatedUser.email || !adminEmails.includes(authenticatedUser.email.toLowerCase())) {
    throw new Error('This account is not authorized to access owner data.');
  }
}

function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Payment gateway is not configured. Add Razorpay API keys to the server environment.');
  }
  return { keyId, keySecret };
}

async function razorpayRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST',
  body?: Record<string, unknown>
): Promise<T> {
  const { keyId, keySecret } = getRazorpayCredentials();
  let response: globalThis.Response;
  try {
    response = await fetch(`https://api.razorpay.com/v1${endpoint}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
  } catch {
    throw new GatewayError('Could not reach Razorpay. Check the server connection and try again.');
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as {
      error?: { description?: string };
    };
    console.error('Razorpay API request failed:', response.status, errorBody.error?.description || 'Unknown gateway error');
    throw new GatewayError('Razorpay could not process this request. Check the merchant account and try again.');
  }

  return (await response.json()) as T;
}

function parseCartLines(input: unknown): CartLineInput[] {
  if (!Array.isArray(input) || input.length === 0 || input.length > maxCartItems) {
    throw new Error('Your cart is empty or contains too many items.');
  }

  return input.map((line: unknown) => {
    if (!line || typeof line !== 'object') throw new Error('Invalid cart item.');
    const item = line as Record<string, unknown>;
    const { productId, selectedSize, quantity } = item;
    if (
      typeof productId !== 'string' ||
      typeof selectedSize !== 'string' ||
      !Number.isInteger(quantity) ||
      (quantity as number) < 1 ||
      (quantity as number) > 50
    ) {
      throw new Error('Invalid cart item details.');
    }
    return { productId, selectedSize, quantity: quantity as number };
  });
}

function createPaymentQuote(cartLines: CartLineInput[], couponCode: unknown, catalogue: Product[]): PaymentQuote {
  if (couponCode !== null && couponCode !== undefined && couponCode !== festivalCouponCode) {
    throw new Error('This coupon is not available for online checkout.');
  }

  const subtotal = cartLines.reduce((total, line) => {
    const product = catalogue.find((candidate) => candidate.id === line.productId);
    if (!product || !product.inStock) {
      throw new Error('A cart item is unavailable for online payment. Refresh your cart and try again.');
    }
    const size = product.availableSizes.find((option) => option.size === line.selectedSize);
    if (!size) throw new Error('A selected product size is invalid. Refresh your cart and try again.');
    return total + (product.price + size.extraPrice) * line.quantity;
  }, 0);

  const discount =
    couponCode === festivalCouponCode
      ? Math.round(subtotal * (festivalDiscountPercent / 100))
      : 0;
  const deliveryCharge = subtotal > freeDeliveryThreshold ? 0 : deliveryFee;
  const total = Math.max(0, subtotal - discount + deliveryCharge);

  if (!Number.isSafeInteger(total) || total < 1) {
    throw new Error('The payment amount is invalid.');
  }
  return { subtotal, discount, deliveryCharge, total };
}

function getRequestBody(request: Request): Record<string, unknown> {
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
    throw new Error('Invalid payment request.');
  }
  return request.body as Record<string, unknown>;
}

app.post('/api/payments/create-order', async (request: Request, response: Response) => {
  try {
    getSupabaseCredentials();
    const body = getRequestBody(request);
    const cartLines = parseCartLines(body.cart);
    const customer = parseCheckoutCustomer(body.customer);
    const visitorId = parseVisitorId(body.visitorId);
    const paymentMethod = body.paymentMethod;
    if (paymentMethod !== 'upi' && paymentMethod !== 'card' && paymentMethod !== 'netbanking' && paymentMethod !== 'wallet') {
      throw new Error('Choose a supported payment method.');
    }
    const orderFields = await createStoredOrderFields(cartLines, customer, body.couponCode, visitorId);
    const order = await razorpayRequest<RazorpayOrder>('/orders', 'POST', {
      amount: orderFields.total * 100,
      currency: 'INR',
      receipt: `akm-${crypto.randomBytes(8).toString('hex')}`,
      notes: {
        store: 'AK MALA',
        subtotal: String(orderFields.subtotal),
        discount: String(orderFields.discount),
        deliveryCharge: String(orderFields.delivery_charge),
        total: String(orderFields.total)
      }
    });
    const [storedOrder] = await supabaseRequest<StoredOrder[]>(
      'orders',
      'POST',
      [{
        ...orderFields,
        order_number: createOrderNumber(),
        razorpay_order_id: order.id,
        payment_method: paymentMethod,
        payment_status: 'pending',
        order_status: 'confirmed'
      }],
      'return=representation'
    );

    response.json({
      keyId: getRazorpayCredentials().keyId,
      order: { id: order.id, amount: order.amount, currency: order.currency },
      quote: {
        subtotal: orderFields.subtotal,
        discount: orderFields.discount,
        deliveryCharge: orderFields.delivery_charge,
        total: orderFields.total
      },
      storeOrderId: storedOrder.id,
      orderNumber: storedOrder.order_number
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start payment.';
    const status = message.startsWith('Payment gateway is not configured') || message.startsWith('Supabase is not configured')
      ? 503
      : error instanceof GatewayError
        ? 502
        : 400;
    if (status !== 400) console.error(message);
    response.status(status).json({ error: message });
  }
});

app.post('/api/orders/cod', async (request: Request, response: Response) => {
  try {
    const body = getRequestBody(request);
    const cartLines = parseCartLines(body.cart);
    const customer = parseCheckoutCustomer(body.customer);
    const visitorId = parseVisitorId(body.visitorId);
    const orderFields = await createStoredOrderFields(cartLines, customer, body.couponCode, visitorId);
    const [order] = await supabaseRequest<StoredOrder[]>(
      'orders',
      'POST',
      [{
        ...orderFields,
        order_number: createOrderNumber(),
        payment_method: 'cod',
        payment_status: 'pending',
        order_status: 'confirmed'
      }],
      'return=representation'
    );
    response.status(201).json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save your order.';
    const status = message.startsWith('Supabase is not configured')
      ? 503
      : error instanceof GatewayError
        ? 502
        : 400;
    if (status !== 400) console.error(message);
    response.status(status).json({ error: message });
  }
});

app.post('/api/analytics/events', async (request: Request, response: Response) => {
  try {
    const body = getRequestBody(request);
    const visitorId = parseVisitorId(body.visitorId);
    const eventType = body.eventType;
    const allowedEvents = [
      'page_view', 'product_view', 'wishlist_add', 'wishlist_remove', 'gallery_like', 'gallery_unlike'
    ];
    const productId = body.productId;
    const pagePath = body.pagePath;
    if (
      !visitorId ||
      typeof eventType !== 'string' ||
      !allowedEvents.includes(eventType) ||
      (productId !== undefined && (typeof productId !== 'string' || productId.length > 100)) ||
      typeof pagePath !== 'string' || !pagePath.startsWith('/') || pagePath.length > 200
    ) {
      response.status(400).json({ error: 'Invalid analytics event.' });
      return;
    }
    await supabaseRequest<unknown>(
      'analytics_events',
      'POST',
      [{
        visitor_id: visitorId,
        event_type: eventType,
        product_id: typeof productId === 'string' ? productId : null,
        page_path: pagePath
      }],
      'return=minimal'
    );
    response.status(204).end();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to record the analytics event.';
    const status = message.startsWith('Supabase is not configured') ? 503 : 400;
    if (status !== 400) console.error(message);
    response.status(status).json({ error: message });
  }
});

app.post('/api/admin/media/upload', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    const body = getRequestBody(request);
    if (typeof body.contentType !== 'string' || typeof body.data !== 'string') {
      response.status(400).json({ error: 'Choose a supported image or video file.' });
      return;
    }
    const allowedTypes = new Set([
      'image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'
    ]);
    if (!allowedTypes.has(body.contentType)) {
      response.status(415).json({ error: 'Supported formats: JPG, PNG, WebP, AVIF, MP4 and WebM.' });
      return;
    }
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(body.data) || body.data.length > 14000000) {
      response.status(400).json({ error: 'The selected file is too large or invalid.' });
      return;
    }
    const fileBytes = Buffer.from(body.data, 'base64');
    const maxBytes = body.contentType.startsWith('image/') ? 4 * 1024 * 1024 : 10 * 1024 * 1024;
    if (!fileBytes.length || fileBytes.length > maxBytes) {
      response.status(413).json({ error: 'Images must be 4 MB or smaller; videos must be 10 MB or smaller.' });
      return;
    }
    const isJpeg = body.contentType === 'image/jpeg' && fileBytes[0] === 0xff && fileBytes[1] === 0xd8 && fileBytes[2] === 0xff;
    const isPng = body.contentType === 'image/png' && fileBytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isWebp = body.contentType === 'image/webp' && fileBytes.toString('ascii', 0, 4) === 'RIFF' && fileBytes.toString('ascii', 8, 12) === 'WEBP';
    const isAvif = body.contentType === 'image/avif' && fileBytes.toString('ascii', 4, 12).includes('ftypavif');
    const isMp4 = body.contentType === 'video/mp4' && fileBytes.toString('ascii', 4, 8) === 'ftyp';
    const isWebm = body.contentType === 'video/webm' && fileBytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    if (!(isJpeg || isPng || isWebp || isAvif || isMp4 || isWebm)) {
      response.status(415).json({ error: 'The file content does not match its selected format.' });
      return;
    }

    const { url, serviceRoleKey } = getSupabaseCredentials();
    const extensionByType: Record<string, string> = {
      'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif',
      'video/mp4': 'mp4', 'video/webm': 'webm'
    };
    const storagePath = `owner/${crypto.randomUUID()}.${extensionByType[body.contentType]}`;
    const upload = await fetch(`${url}/storage/v1/object/ak-mala-media/${storagePath}`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': body.contentType,
        'x-upsert': 'false'
      },
      body: fileBytes
    });
    if (!upload.ok) {
      console.error('Owner media upload failed:', upload.status);
      throw new GatewayError('The media could not be saved to storage.');
    }
    response.status(201).json({
      url: `${url}/storage/v1/object/public/ak-mala-media/${storagePath}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to upload media.';
    const status = message.startsWith('Supabase is not configured') ? 503 : error instanceof GatewayError ? 502 : 403;
    response.status(status).json({ error: status === 403 ? message : 'The media upload is temporarily unavailable.' });
  }
});

app.get('/api/products', async (_request: Request, response: Response) => {
  try {
    response.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    response.json({ products: await loadCatalogProducts() });
  } catch (error) {
    response.status(503).json({ error: 'The product catalogue is temporarily unavailable.' });
  }
});

app.post('/api/admin/products', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    const product = parseProduct(getRequestBody(request).product);
    const [saved] = await supabaseRequest<Array<{ id: string; data: Product; is_active: boolean }>>(
      'store_products?on_conflict=id',
      'POST',
      [{ id: product.id, data: product, is_active: true, updated_at: new Date().toISOString() }],
      'resolution=merge-duplicates,return=representation'
    );
    response.status(200).json({ product: saved.data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save product.';
    const status = message.startsWith('Supabase is not configured') ? 503 : error instanceof GatewayError ? 502 : /sign in|authorized|owner access|not authorized/i.test(message) ? 403 : 400;
    response.status(status).json({ error: status === 400 || status === 403 ? message : 'Unable to save this product right now.' });
  }
});

app.delete('/api/admin/products/:id', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    const productId = request.params.id;
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(productId)) {
      response.status(400).json({ error: 'Invalid product identifier.' });
      return;
    }
    const [saved] = await supabaseRequest<Array<{ id: string }>>(
      `store_products?id=eq.${encodeURIComponent(productId)}&select=id`,
      'PATCH',
      { is_active: false, updated_at: new Date().toISOString() },
      'return=representation'
    );
    if (!saved) {
      await supabaseRequest<unknown>(
        'store_products?on_conflict=id',
        'POST',
        [{ id: productId, data: { id: productId }, is_active: false, updated_at: new Date().toISOString() }],
        'resolution=merge-duplicates,return=minimal'
      );
    }
    response.json({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to remove product.';
    const status = message.startsWith('Supabase is not configured') ? 503 : error instanceof GatewayError ? 502 : 403;
    response.status(status).json({ error: status === 403 ? message : 'Unable to remove this product right now.' });
  }
});

app.get('/api/admin/data', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    const [orders, events] = await Promise.all([
      supabaseRequest<StoredOrder[]>('orders?select=*&order=created_at.desc&limit=500', 'GET'),
      supabaseRequest<Array<{
        id: number;
        visitor_id: string;
        event_type: string;
        product_id: string | null;
        page_path: string;
        created_at: string;
      }>>('analytics_events?select=*&order=created_at.desc&limit=2000', 'GET')
    ]);
    response.json({ orders, events });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load owner data.';
    const status = message.startsWith('Supabase is not configured') ? 503 : message.includes('database') ? 502 : 403;
    response.status(status).json({ error: message });
  }
});

app.patch('/api/admin/orders/:id/status', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    const body = getRequestBody(request);
    const allowedStatuses = ['confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    if (typeof body.orderStatus !== 'string' || !allowedStatuses.includes(body.orderStatus)) {
      response.status(400).json({ error: 'Invalid order status.' });
      return;
    }
    const orderId = request.params.id;
    if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
      response.status(400).json({ error: 'Invalid order identifier.' });
      return;
    }
    const orders = await supabaseRequest<StoredOrder[]>(
      `orders?id=eq.${encodeURIComponent(orderId)}&select=*`,
      'PATCH',
      { order_status: body.orderStatus },
      'return=representation'
    );
    if (orders.length === 0) {
      response.status(404).json({ error: 'Order not found.' });
      return;
    }
    response.json({ order: orders[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update the order.';
    const status = message.startsWith('Supabase is not configured') ? 503 : message.includes('database') ? 502 : 403;
    response.status(status).json({ error: message });
  }
});

app.post('/api/payments/verify', async (request: Request, response: Response) => {
  try {
    const body = getRequestBody(request);
    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;
    if (
      typeof orderId !== 'string' ||
      typeof paymentId !== 'string' ||
      typeof signature !== 'string'
    ) {
      response.status(400).json({ error: 'Payment response is incomplete.' });
      return;
    }

    const { keySecret } = getRazorpayCredentials();
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest();
    const providedSignature = Buffer.from(signature, 'hex');
    if (
      providedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(providedSignature, expectedSignature)
    ) {
      response.status(400).json({ error: 'Payment verification failed. Your order has not been confirmed.' });
      return;
    }

    const order = await razorpayRequest<RazorpayOrder & { amount_paid: number }>(
      `/orders/${encodeURIComponent(orderId)}`,
      'GET'
    );
    const quote: PaymentQuote = {
      subtotal: Number(order.notes.subtotal),
      discount: Number(order.notes.discount),
      deliveryCharge: Number(order.notes.deliveryCharge),
      total: Number(order.notes.total)
    };
    if (
      order.id !== orderId ||
      order.currency !== 'INR' ||
      !Object.values(quote).every(Number.isSafeInteger) ||
      quote.total < 1 ||
      order.amount !== quote.total * 100
    ) {
      response.status(400).json({ error: 'Payment amount could not be verified. Your order has not been confirmed.' });
      return;
    }

    let payment = await razorpayRequest<RazorpayPayment>(
      `/payments/${encodeURIComponent(paymentId)}`,
      'GET'
    );
    if (
      payment.order_id !== orderId ||
      payment.amount !== order.amount ||
      payment.currency !== 'INR'
    ) {
      response.status(400).json({ error: 'Payment amount could not be verified. Your order has not been confirmed.' });
      return;
    }

    if (payment.status === 'authorized') {
      payment = await razorpayRequest<RazorpayPayment>(
        `/payments/${encodeURIComponent(paymentId)}/capture`,
        'POST',
        { amount: order.amount, currency: 'INR' }
      );
    }
    if (payment.status !== 'captured') {
      response.status(400).json({ error: 'Payment is not complete. Your order has not been confirmed.' });
      return;
    }

    const savedOrders = await supabaseRequest<StoredOrder[]>(
      `orders?razorpay_order_id=eq.${encodeURIComponent(orderId)}&select=*`,
      'PATCH',
      { payment_status: 'paid', razorpay_payment_id: payment.id },
      'return=representation'
    );
    if (savedOrders.length !== 1) {
      throw new GatewayError('Payment was received, but the order record could not be confirmed. Contact the store with your Razorpay payment ID.');
    }
    response.json({
      verified: true,
      paymentMethod: payment.method,
      quote,
      orderNumber: savedOrders[0].order_number
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to verify payment.';
    console.error('Payment verification failed:', message);
    const status = message.startsWith('Payment gateway is not configured') || message.startsWith('Supabase is not configured')
      ? 503
      : error instanceof GatewayError
        ? 502
        : 400;
    response.status(status).json({ error: message });
  }
});

if (isProduction) {
  const distPath = path.resolve('dist');
  app.use(express.static(distPath));
  app.get('*', (_request: Request, response: Response) => {
    response.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa'
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`AK MALA server listening on http://localhost:${port}`);
});
