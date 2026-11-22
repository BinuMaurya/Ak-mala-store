import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import express, { type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { products } from './src/data/products.js';
import type { StoreContent } from './src/types/index.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';
const ADMIN_ACCESS_CODE = String(process.env.ADMIN_ACCESS_CODE || '').trim();
const freeDeliveryThreshold = 999;
const deliveryFee = 99;
const festivalCouponCode = 'FEST15';
const festivalDiscountPercent = 15;
const maxCartItems = 50;

class GatewayError extends Error {}
class ReviewVerificationError extends Error {}
class CustomerAuthError extends Error {}

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
  line2?: string;
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
  customer_user_id: string | null;
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
  delivery_otp_hash: string | null;
  delivery_otp_expires_at: string | null;
  delivery_otp_attempts: number;
  created_at: string;
}

interface StoredReview {
  id: string;
  product_id: string;
  author: string;
  city: string;
  rating: number;
  title: string;
  comment: string;
  photo_url: string | null;
  verified_purchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface StoredReviewSummary {
  product_id: string;
  average_rating: number;
  review_count: number;
}

interface OfferConfig {
  enabled: boolean;
  code: string;
  discountPercent: number;
  minOrder: number;
  startDate: string;
  endDate: string;
  freeDeliveryThreshold: number;
}

app.use(express.json({ limit: '4mb' }));

const trackingAttempts = new Map<string, { count: number; resetAt: number }>();
const trackingAttemptLimit = 10;
const trackingAttemptWindowMs = 15 * 60 * 1000;
const reviewAttempts = new Map<string, { count: number; resetAt: number }>();

// ==================== SYSTEM STATUS ====================
app.get('/api/plugins/status', (_request: Request, response: Response) => {
  response.json({
    gemini: Boolean(process.env.GEMINI_API_KEY),
    supabase: Boolean(
      process.env.SUPABASE_URL &&
      (process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY) &&
      (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
    ),
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  });
});

// ==================== SUPABASE HELPERS ====================
function getSupabaseCredentials() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error('Supabase is not configured.');
  }
  return { url: url.replace(/\/$/, ''), anonKey, serviceRoleKey };
}

async function supabaseRequest<T>(
  tablePath: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
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
    throw new GatewayError('Could not reach the database. Please try again.');
  }

  if (!result.ok) {
    const details = await result.text();
    console.error('Supabase request failed:', result.status, details);
    throw new GatewayError('Database operation failed.');
  }
  const responseText = await result.text();
  if (!responseText) return undefined as T;
  try {
    return JSON.parse(responseText) as T;
  } catch {
    return undefined as T;
  }
}

// ==================== ADMIN AUTH ====================
async function requireAdmin(request: Request): Promise<void> {
  const authorization = request.headers.authorization;
  const providedCode = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';
  if (ADMIN_ACCESS_CODE && providedCode === ADMIN_ACCESS_CODE) return;

  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Please sign in with the authorized owner account.');
  }
  const { url, anonKey } = getSupabaseCredentials();
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    throw new Error('Owner access is not configured.');
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


async function getCustomerUserId(request: Request, optional = false): Promise<string | null> {
  const authorization = request.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    if (optional) return null;
    throw new CustomerAuthError('Sign in to access your customer account.');
  }
  const { url, anonKey } = getSupabaseCredentials();
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: authorization }
  });
  if (!response.ok) throw new CustomerAuthError('Your customer sign-in has expired. Please sign in again.');
  const authenticatedUser = (await response.json()) as { id?: string };
  if (!authenticatedUser.id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(authenticatedUser.id)) {
    throw new CustomerAuthError('The signed-in customer account is invalid.');
  }
  return authenticatedUser.id;
}

// ==================== RAZORPAY HELPERS ====================
function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error('Payment gateway is not configured.');
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
    throw new GatewayError('Could not reach Razorpay.');
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as { error?: { description?: string } };
    throw new GatewayError(errorBody.error?.description || 'Razorpay request failed.');
  }
  return (await response.json()) as T;
}

// ==================== VALIDATION & PARSING HELPERS ====================
function getRequestBody(request: Request): Record<string, unknown> {
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) {
    throw new Error('Invalid request body.');
  }
  return request.body as Record<string, unknown>;
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
  const line2 = shippingAddress.line2;
  const city = shippingAddress.city;
  const state = shippingAddress.state;
  const pincode = shippingAddress.pincode;
  if (
    typeof name !== 'string' || !name.trim() || name.length > 120 ||
    typeof phone !== 'string' || !/^\+?\d[\d\s()-]{8,}\d$/.test(phone) ||
    typeof line1 !== 'string' || !line1.trim() || line1.length > 300 ||
    (line2 !== undefined && (typeof line2 !== 'string' || line2.length > 200)) ||
    typeof city !== 'string' || !city.trim() || city.length > 100 ||
    typeof state !== 'string' || !state.trim() || state.length > 100 ||
    typeof pincode !== 'string' || !/^\d{6}$/.test(pincode)
  ) {
    throw new Error('Please provide a valid name, phone number, and delivery address.');
  }
  return {
    name: name.trim(),
    phone: phone.trim(),
    email: typeof email === 'string' ? email.trim() : null,
    address: {
      line1: line1.trim(),
      ...(typeof line2 === 'string' && line2.trim() ? { line2: line2.trim() } : {}),
      city: city.trim(),
      state: state.trim(),
      pincode
    }
  };
}

function parseVisitorId(input: unknown): string | null {
  if (input === null || input === undefined || input === '') return null;
  if (typeof input !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input)) {
    throw new Error('Invalid visitor identifier.');
  }
  return input;
}

async function getOfferConfig(): Promise<OfferConfig> {
  const rows = await supabaseRequest<Array<{ content: StoreContent }>>(
    'store_content?id=eq.main&select=content',
    'GET'
  );
  const assets = rows[0]?.content?.siteAssets;
  const configuredDiscount = assets?.offerDiscountPercent;
  const configuredMinimum = assets?.offerMinOrder;
  const configuredDeliveryMinimum = assets?.freeDeliveryThreshold;
  return {
    enabled: assets?.offerEnabled === undefined || assets.offerEnabled === true,
    code: typeof assets?.offerCode === 'string' && assets.offerCode.trim() ? assets.offerCode.trim() : festivalCouponCode,
    discountPercent: typeof configuredDiscount === 'number' && Number.isFinite(configuredDiscount) && configuredDiscount >= 1 && configuredDiscount <= 90
      ? configuredDiscount
      : festivalDiscountPercent,
    minOrder: typeof configuredMinimum === 'number' && Number.isSafeInteger(configuredMinimum) && configuredMinimum >= 0
      ? configuredMinimum
      : 0,
    startDate: typeof assets?.offerStartDate === 'string' ? assets.offerStartDate : '',
    endDate: typeof assets?.offerEndDate === 'string' ? assets.offerEndDate : '',
    freeDeliveryThreshold: typeof configuredDeliveryMinimum === 'number' && Number.isSafeInteger(configuredDeliveryMinimum) && configuredDeliveryMinimum >= 0
      ? configuredDeliveryMinimum
      : freeDeliveryThreshold
  };
}

function isOfferConfigActive(offer: OfferConfig): boolean {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  return offer.enabled && (!offer.startDate || today >= offer.startDate) && (!offer.endDate || today <= offer.endDate);
}

async function getProductCatalog(): Promise<StoreContent['products']> {
  const rows = await supabaseRequest<Array<{ content: StoreContent }>>(
    'store_content?id=eq.main&select=content',
    'GET'
  );
  const storedProducts = rows[0]?.content?.products;
  return Array.isArray(storedProducts) ? storedProducts : products;
}

async function createPaymentQuote(
  cartLines: CartLineInput[],
  couponCode: unknown,
  catalog: StoreContent['products']
): Promise<PaymentQuote> {
  const requestedQuantity = new Map<string, number>();
  for (const line of cartLines) {
    requestedQuantity.set(line.productId, (requestedQuantity.get(line.productId) || 0) + line.quantity);
  }
  for (const [productId, quantity] of requestedQuantity) {
    const product = catalog.find((candidate) => candidate.id === productId);
    if (!product || !product.inStock || (typeof product.stockQuantity === 'number' && quantity > product.stockQuantity)) {
      throw new Error('A cart item is unavailable or the requested quantity exceeds current stock.');
    }
  }

  const subtotal = cartLines.reduce((total, line) => {
    const product = catalog.find((candidate) => candidate.id === line.productId);
    if (!product || !product.inStock) {
      throw new Error('A cart item is unavailable for payment.');
    }
    const size = product.availableSizes.find((option) => option.size === line.selectedSize);
    if (!size) throw new Error('A selected product size is invalid.');
    return total + (product.price + size.extraPrice) * line.quantity;
  }, 0);

  const offer = await getOfferConfig();
  const normalizedCode = typeof couponCode === 'string' ? couponCode.trim().toUpperCase() : '';
  const couponApplied = Boolean(normalizedCode);
  if (couponApplied && (
    !isOfferConfigActive(offer) ||
    normalizedCode !== offer.code.toUpperCase() ||
    subtotal < offer.minOrder
  )) {
    throw new Error('This coupon is invalid, inactive, or the minimum order is not met.');
  }

  const discount = couponApplied ? Math.round(subtotal * (offer.discountPercent / 100)) : 0;
  const deliveryCharge = subtotal >= offer.freeDeliveryThreshold ? 0 : deliveryFee;
  const total = Math.max(0, subtotal - discount + deliveryCharge);
  if (!Number.isSafeInteger(total) || total < 1) throw new Error('The payment amount is invalid.');
  return { subtotal, discount, deliveryCharge, total };
}

async function createStoredOrderFields(
  cartLines: CartLineInput[],
  customer: CheckoutCustomer,
  couponCode: unknown,
  visitorId: string | null,
  customerUserId: string | null
): Promise<{
  customer_user_id: string | null;
  visitor_id: string | null;
  customer_name: string;
  phone: string;
  email: string | null;
  shipping_address: ShippingAddress;
  items: Array<{ productId: string; productName: string; selectedSize: string; quantity: number; pricePerUnit: number }>;
  subtotal: number;
  discount: number;
  delivery_charge: number;
  total: number;
}> {
  const catalog = await getProductCatalog();
  const quote = await createPaymentQuote(cartLines, couponCode, catalog);
  const items = cartLines.map((line) => {
    const product = catalog.find((candidate) => candidate.id === line.productId);
    const size = product?.availableSizes.find((option) => option.size === line.selectedSize);
    if (!product || !size) throw new Error('A cart item is unavailable.');
    return {
      productId: product.id,
      productName: product.name,
      selectedSize: size.size,
      quantity: line.quantity,
      pricePerUnit: product.price + size.extraPrice
    };
  });
  return {
    customer_user_id: customerUserId,
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

// ==================== TWILIO & DELIVERY OTP ====================
function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const international = digits.length === 10 ? `91${digits}` : digits;
  if (international.length < 11 || international.length > 15) {
    throw new Error('Enter a valid phone number.');
  }
  return `+${international}`;
}

function getTwilioCredentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Delivery SMS is not configured.');
  }
  return { accountSid, authToken, fromNumber };
}

async function sendDeliveryOtp(phone: string, orderNumber: string, otp: string): Promise<void> {
  const { accountSid, authToken, fromNumber } = getTwilioCredentials();
  const body = new URLSearchParams({
    To: normalizePhoneNumber(phone),
    From: fromNumber,
    Body: `Your AK MALA delivery verification code for order ${orderNumber} is ${otp}. It expires in 10 minutes.`
  });
  const result = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });
  if (!result.ok) {
    throw new GatewayError('Twilio could not send the delivery code.');
  }
}

function hashDeliveryOtp(orderId: string, otp: string): string {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'secret';
  return crypto.createHmac('sha256', secret).update(`${orderId}:${otp}`).digest('hex');
}

async function sendAndStoreDeliveryOtp(order: StoredOrder): Promise<StoredOrder> {
  const otp = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const updated = await supabaseRequest<StoredOrder[]>(
    `orders?id=eq.${encodeURIComponent(order.id)}&select=*`,
    'PATCH',
    {
      order_status: 'out_for_delivery',
      delivery_otp_hash: hashDeliveryOtp(order.id, otp),
      delivery_otp_expires_at: expiresAt,
      delivery_otp_attempts: 0
    },
    'return=representation'
  );
  if (updated.length === 0) throw new Error('Order not found.');
  await sendDeliveryOtp(order.phone, order.order_number, otp);
  return updated[0];
}

function isDeliveryOtpValid(orderId: string, otp: string, expectedHash: string): boolean {
  const submittedHash = Buffer.from(hashDeliveryOtp(orderId, otp), 'hex');
  const storedHash = Buffer.from(expectedHash, 'hex');
  return submittedHash.length === storedHash.length && crypto.timingSafeEqual(submittedHash, storedHash);
}

function withoutDeliveryOtp(order: StoredOrder) {
  const { delivery_otp_hash: _h, delivery_otp_expires_at: _e, delivery_otp_attempts: _a, ...safe } = order;
  return safe;
}

// ==================== GEMINI ASSISTANT ====================
const productSuggestionIntent = /\b(image|images|photo|photos|picture|pictures|show|display|recommend|suggest|product|products|mala|malas|garland|garlands|flowers?|dikhao|dikhaiye|dikhaye|tasveer|tasveerein|chahiye)\b|फोटो|तस्वीर|माला|हार|दिखाओ|दिखाइए|चाहिए/i;

function getSuggestedProducts(query: string) {
  return products.filter(p => p.inStock).slice(0, 3).map(p => ({
    id: p.id, name: p.name, image: p.image, price: p.price, category: p.category
  }));
}

app.post('/api/assistant/chat', async (request: Request, response: Response) => {
  try {
    const body = request.body as { messages?: any[]; context?: any };
    if (!Array.isArray(body?.messages) || body.messages.length === 0) {
      response.status(400).json({ error: 'Invalid message.' });
      return;
    }
    const latestMessage = body.messages[body.messages.length - 1];
    const suggestsProducts = productSuggestionIntent.test(latestMessage.text);
    if (suggestsProducts) {
      response.json({ reply: 'Here are the matching malas:', products: getSuggestedProducts(latestMessage.text) });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      response.status(503).json({ error: 'Store assistant is not configured.' });
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: body.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text.trim() }]
      })),
      config: { systemInstruction: 'You are the helpful AK MALA online store assistant.' }
    });
    response.json({ reply: result.text?.trim() || 'Hello! How can I help you?' });
  } catch (error) {
    response.status(502).json({ error: 'Assistant is temporarily unavailable.' });
  }
});

// ==================== SHARED STORE CONTENT (CMS) ====================
app.get('/api/store/content', async (_request: Request, response: Response) => {
  try {
    const rows = await supabaseRequest<Array<{ content: StoreContent }>>(
      'store_content?id=eq.main&select=content',
      'GET'
    );
    response.json({ content: rows[0]?.content || null });
  } catch (error) {
    response.status(502).json({ error: 'Shared store content could not be loaded.' });
  }
});

app.put('/api/admin/content', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    const body = getRequestBody(request);
    const content = body.content as Partial<StoreContent> | undefined;
    if (!content || !Array.isArray(content.products) || !content.siteAssets || !Array.isArray(content.galleryItems) || !Array.isArray(content.videosList)) {
      response.status(400).json({ error: 'Invalid store content format.' });
      return;
    }
    await supabaseRequest(
      'store_content',
      'POST',
      [{ id: 'main', content, updated_at: new Date().toISOString() }],
      'resolution=merge-duplicates,return=minimal'
    );
    response.json({ saved: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save store content.';
    response.status(400).json({ error: message });
  }
});

function consumeReviewLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const current = reviewAttempts.get(key);
  if (!current || current.resetAt <= now) {
    reviewAttempts.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}

function presentReview(review: StoredReview) {
  return {
    id: review.id,
    productId: review.product_id,
    author: review.author,
    city: review.city,
    rating: review.rating,
    title: review.title,
    comment: review.comment,
    photoUrl: review.photo_url || undefined,
    verifiedDevotee: review.verified_purchase,
    status: review.status,
    date: review.created_at
  };
}

async function verifyReviewPurchase(orderNumber: string, phone: string, productId: string) {
  const orders = await supabaseRequest<Array<Pick<
    StoredOrder,
    'id' | 'order_number' | 'phone' | 'email' | 'customer_name' | 'shipping_address' | 'items' | 'payment_method' | 'payment_status'
  >>>(
    `orders?order_number=eq.${encodeURIComponent(orderNumber)}&select=id,order_number,phone,email,customer_name,shipping_address,items,payment_method,payment_status&limit=1`,
    'GET'
  );
  const order = orders[0];
  if (!order || order.phone.replace(/\D/g, '') !== phone) {
    throw new ReviewVerificationError('Order number and phone do not match a purchase.');
  }
  if (order.payment_status !== 'paid' && order.payment_method !== 'cod') {
    throw new ReviewVerificationError('Only confirmed purchases can be reviewed.');
  }
  if (!order.items.some((item) => item.productId === productId)) {
    throw new ReviewVerificationError('This product is not on the verified order.');
  }
  return order;
}

app.get('/api/reviews', async (request: Request, response: Response) => {
  try {
    const productId = typeof request.query.productId === 'string' ? request.query.productId.trim() : '';
    const filter = productId ? `&product_id=eq.${encodeURIComponent(productId)}` : '';
    const [rows, summaries] = await Promise.all([
      supabaseRequest<StoredReview[]>(
        `product_reviews?status=eq.approved${filter}&select=id,product_id,author,city,rating,title,comment,photo_url,verified_purchase,status,created_at&order=created_at.desc&limit=100`,
        'GET'
      ),
      supabaseRequest<StoredReviewSummary[]>('product_review_summaries?select=product_id,average_rating,review_count', 'GET')
    ]);
    response.json({
      reviews: rows.map(presentReview),
      summaries: summaries.map((summary) => ({
        productId: summary.product_id,
        averageRating: summary.average_rating,
        reviewCount: summary.review_count
      }))
    });
  } catch {
    response.status(502).json({ error: 'Customer reviews could not be loaded.' });
  }
});

app.post('/api/reviews/photo-upload-url', async (request: Request, response: Response) => {
  try {
    const body = getRequestBody(request);
    const orderNumber = typeof body.orderNumber === 'string' ? body.orderNumber.trim().toUpperCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
    const productId = typeof body.productId === 'string' ? body.productId.trim() : '';
    const contentType = body.contentType;
    const size = body.size;
    const extensionByType: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp'
    };
    if (
      typeof contentType !== 'string' ||
      !extensionByType[contentType] ||
      typeof size !== 'number' ||
      size < 1 ||
      size > 5 * 1024 * 1024
    ) {
      response.status(400).json({ error: 'Choose a JPEG, PNG, or WebP photo smaller than 5 MB.' });
      return;
    }
    if (!/^AKM-[A-Z0-9]{5,12}$/.test(orderNumber) || phone.length < 10 || phone.length > 15 || !productId || productId.length > 120) {
      response.status(400).json({ error: 'Enter valid order details before uploading a review photo.' });
      return;
    }
    if (!consumeReviewLimit(`photo:${request.ip}`, 10, 15 * 60 * 1000)) {
      response.status(429).json({ error: 'Too many photo uploads. Please try again later.' });
      return;
    }

    await verifyReviewPurchase(orderNumber, phone, productId);
    const { url, serviceRoleKey } = getSupabaseCredentials();
    const objectPath = `reviews/${crypto.randomUUID()}${extensionByType[contentType]}`;
    const storageResponse = await fetch(`${url}/storage/v1/object/upload/sign/ak-mala-media/${objectPath}`, {
      method: 'POST',
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ upsert: false })
    });
    const storageResult = await storageResponse.json() as { url?: string; signedUrl?: string };
    if (!storageResponse.ok || !(storageResult.url || storageResult.signedUrl)) {
      response.status(502).json({ error: 'Photo storage could not prepare the upload.' });
      return;
    }

    const signedPath = storageResult.url || storageResult.signedUrl!;
    const uploadUrl = signedPath.startsWith('http') ? signedPath : `${url}/storage/v1${signedPath.startsWith('/') ? signedPath : `/${signedPath}`}`;
    response.json({
      uploadUrl,
      publicUrl: `${url}/storage/v1/object/public/ak-mala-media/${objectPath}`
    });
  } catch (error) {
    response.status(error instanceof ReviewVerificationError ? 403 : 502).json({
      error: error instanceof Error ? error.message : 'Unable to prepare review photo upload.'
    });
  }
});

app.post('/api/reviews', async (request: Request, response: Response) => {
  try {
    if (!consumeReviewLimit(`review:${request.ip}`, 5, 60 * 60 * 1000)) {
      response.status(429).json({ error: 'Too many review submissions. Please try again later.' });
      return;
    }

    const body = getRequestBody(request);
    const orderNumber = typeof body.orderNumber === 'string' ? body.orderNumber.trim().toUpperCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
    const productId = typeof body.productId === 'string' ? body.productId.trim() : '';
    const rating = body.rating;
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const comment = typeof body.comment === 'string' ? body.comment.trim() : '';
    const photoUrl = typeof body.photoUrl === 'string' ? body.photoUrl.trim() : '';
    if (
      !/^AKM-[A-Z0-9]{5,12}$/.test(orderNumber) ||
      phone.length < 10 ||
      phone.length > 15 ||
      !productId ||
      productId.length > 120 ||
      typeof rating !== 'number' ||
      !Number.isInteger(rating) ||
      rating < 1 ||
      rating > 5 ||
      !title ||
      title.length > 120 ||
      !comment ||
      comment.length > 2000
    ) {
      response.status(400).json({ error: 'Enter valid order details and a rating, title, and review.' });
      return;
    }

    const order = await verifyReviewPurchase(orderNumber, phone, productId);

    const { url } = getSupabaseCredentials();
    if (photoUrl && !photoUrl.startsWith(`${url.replace(/\/$/, '')}/storage/v1/object/public/ak-mala-media/reviews/`)) {
      response.status(400).json({ error: 'Use a photo uploaded with this review.' });
      return;
    }
    const priorReviews = await supabaseRequest<StoredReview[]>(
      `product_reviews?order_id=eq.${encodeURIComponent(order.id)}&product_id=eq.${encodeURIComponent(productId)}&select=id&limit=1`,
      'GET'
    );
    if (priorReviews.length) {
      response.status(409).json({ error: 'A review has already been submitted for this product and order.' });
      return;
    }

    const [savedReview] = await supabaseRequest<StoredReview[]>(
      'product_reviews',
      'POST',
      [{
        order_id: order.id,
        product_id: productId,
        author: order.customer_name,
        city: order.shipping_address.city,
        rating,
        title,
        comment,
        photo_url: photoUrl || null,
        verified_purchase: true,
        status: 'pending'
      }],
      'return=representation'
    );
    response.status(201).json({ review: presentReview(savedReview), pendingApproval: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Review could not be submitted.';
    response.status(error instanceof ReviewVerificationError ? 403 : 502).json({ error: message });
  }
});

app.get('/api/admin/reviews', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    const status = request.query.status === 'pending' ? '&status=eq.pending' : '';
    const rows = await supabaseRequest<StoredReview[]>(
      `product_reviews?select=id,product_id,author,city,rating,title,comment,photo_url,verified_purchase,status,created_at&order=created_at.desc&limit=200${status}`,
      'GET'
    );
    response.json({ reviews: rows.map(presentReview) });
  } catch (error) {
    response.status(403).json({ error: error instanceof Error ? error.message : 'Unable to load reviews.' });
  }
});

app.patch('/api/admin/reviews/:id', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    const id = request.params.id;
    const status = getRequestBody(request).status;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) || !['approved', 'rejected'].includes(status as string)) {
      response.status(400).json({ error: 'Choose approve or reject for a valid review.' });
      return;
    }
    const [review] = await supabaseRequest<StoredReview[]>(
      `product_reviews?id=eq.${encodeURIComponent(id)}&select=id,product_id,author,city,rating,title,comment,photo_url,verified_purchase,status,created_at`,
      'PATCH',
      { status },
      'return=representation'
    );
    if (!review) {
      response.status(404).json({ error: 'Review not found.' });
      return;
    }
    response.json({ review: presentReview(review) });
  } catch (error) {
    response.status(403).json({ error: error instanceof Error ? error.message : 'Review moderation failed.' });
  }
});

// ==================== MEDIA UPLOAD (CMS) ====================
app.post('/api/admin/media/upload-url', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    const body = getRequestBody(request);
    const contentType = body.contentType;
    const size = body.size;
    const extensionByType: Record<string, string> = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
      'video/mp4': '.mp4', 'video/webm': '.webm', 'video/quicktime': '.mov'
    };
    if (typeof contentType !== 'string' || !extensionByType[contentType] || typeof size !== 'number' || size < 1 || size > 50 * 1024 * 1024) {
      response.status(400).json({ error: 'Choose a supported image or video smaller than 50 MB.' });
      return;
    }

    const { url, serviceRoleKey } = getSupabaseCredentials();
    const objectPath = `uploads/${crypto.randomUUID()}${extensionByType[contentType]}`;
    const storageResponse = await fetch(`${url}/storage/v1/object/upload/sign/ak-mala-media/${objectPath}`, {
      method: 'POST',
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ upsert: false })
    });
    const storageResult = await storageResponse.json() as { url?: string; signedUrl?: string };
    if (!storageResponse.ok || !(storageResult.url || storageResult.signedUrl)) {
      response.status(502).json({ error: 'Supabase Storage could not prepare upload.' });
      return;
    }

    const signedPath = storageResult.url || storageResult.signedUrl!;
    const uploadUrl = signedPath.startsWith('http') ? signedPath : `${url}/storage/v1${signedPath.startsWith('/') ? signedPath : `/${signedPath}`}`;
    response.json({
      uploadUrl,
      publicUrl: `${url}/storage/v1/object/public/ak-mala-media/${objectPath}`
    });
  } catch (error) {
    response.status(502).json({ error: 'Unable to prepare media upload.' });
  }
});

// ==================== PAYMENTS & ORDERS ====================
app.get('/api/customer/account', async (request: Request, response: Response) => {
  try {
    const userId = await getCustomerUserId(request);
    if (!userId) throw new CustomerAuthError('Sign in to access your customer account.');
    const encodedUserId = encodeURIComponent(userId);
    const [addresses, orders] = await Promise.all([
      supabaseRequest<Array<{
        id: string;
        label: string;
        recipient_name: string;
        phone: string;
        line1: string;
        line2: string | null;
        city: string;
        state: string;
        pincode: string;
        is_default: boolean;
      }>>(
        `customer_addresses?user_id=eq.${encodedUserId}&select=id,label,recipient_name,phone,line1,line2,city,state,pincode,is_default&order=is_default.desc,created_at.desc`,
        'GET'
      ),
      supabaseRequest<StoredOrder[]>(
        `orders?customer_user_id=eq.${encodedUserId}&select=id,order_number,customer_name,phone,created_at,items,subtotal,discount,delivery_charge,total,payment_method,payment_status,order_status,shipping_address&order=created_at.desc&limit=100`,
        'GET'
      )
    ]);

    response.json({
      addresses: addresses.map((address) => ({
        id: address.id,
        label: address.label,
        recipientName: address.recipient_name,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2 || '',
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        isDefault: address.is_default
      })),
      orders: orders.map((order) => ({
        id: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        createdAt: order.created_at,
        items: order.items,
        subtotal: order.subtotal,
        discount: order.discount,
        deliveryCharge: order.delivery_charge,
        total: order.total,
        paymentMethod: order.payment_method,
        paymentStatus: order.payment_status,
        orderStatus: order.order_status,
        phone: order.phone,
        address: order.shipping_address
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Customer account could not be loaded.';
    response.status(error instanceof CustomerAuthError ? 401 : 502).json({ error: message });
  }
});

app.put('/api/customer/addresses', async (request: Request, response: Response) => {
  try {
    const userId = await getCustomerUserId(request);
    if (!userId) throw new CustomerAuthError('Sign in to save a delivery address.');
    const body = getRequestBody(request);
    const text = (value: unknown, maxLength: number): string =>
      typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
    const label = text(body.label, 32) || 'Home';
    const recipientName = text(body.recipientName, 100);
    const phone = text(body.phone, 24);
    const line1 = text(body.line1, 200);
    const line2 = text(body.line2, 200);
    const city = text(body.city, 100);
    const state = text(body.state, 100);
    const pincode = text(body.pincode, 6);
    const isDefault = body.isDefault === true;
    const id = body.id;
    if (
      !recipientName ||
      phone.replace(/\D/g, '').length < 10 ||
      !line1 ||
      !city ||
      !state ||
      !/^\d{6}$/.test(pincode) ||
      (id !== undefined && (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)))
    ) {
      response.status(400).json({ error: 'Enter a name, valid phone number, complete address, and 6-digit PIN code.' });
      return;
    }

    const encodedUserId = encodeURIComponent(userId);
    if (typeof id === 'string') {
      const ownedAddress = await supabaseRequest<Array<{ id: string }>>(
        `customer_addresses?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodedUserId}&select=id`,
        'GET'
      );
      if (!ownedAddress.length) {
        response.status(404).json({ error: 'Delivery address not found.' });
        return;
      }
    }
    if (isDefault) {
      await supabaseRequest(
        `customer_addresses?user_id=eq.${encodedUserId}&is_default=eq.true`,
        'PATCH',
        { is_default: false }
      );
    }
    const address = {
      user_id: userId,
      label,
      recipient_name: recipientName,
      phone,
      line1,
      line2: line2 || null,
      city,
      state,
      pincode,
      is_default: isDefault
    };

    if (typeof id === 'string') {
      const updated = await supabaseRequest<Array<{ id: string }>>(
        `customer_addresses?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodedUserId}&select=id`,
        'PATCH',
        address,
        'return=representation'
      );
      if (!updated.length) {
        response.status(404).json({ error: 'Delivery address not found.' });
        return;
      }
    } else {
      await supabaseRequest('customer_addresses', 'POST', [address]);
    }
    response.status(200).json({ saved: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delivery address could not be saved.';
    response.status(error instanceof CustomerAuthError ? 401 : 502).json({ error: message });
  }
});

app.delete('/api/customer/addresses/:id', async (request: Request, response: Response) => {
  try {
    const userId = await getCustomerUserId(request);
    if (!userId) throw new CustomerAuthError('Sign in to remove a delivery address.');
    const id = request.params.id;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      response.status(400).json({ error: 'Delivery address ID is invalid.' });
      return;
    }
    const removed = await supabaseRequest<Array<{ id: string }>>(
      `customer_addresses?id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(userId)}&select=id`,
      'DELETE',
      undefined,
      'return=representation'
    );
    if (!removed.length) {
      response.status(404).json({ error: 'Delivery address not found.' });
      return;
    }
    response.json({ removed: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Delivery address could not be removed.';
    response.status(error instanceof CustomerAuthError ? 401 : 502).json({ error: message });
  }
});

app.post('/api/payments/create-order', async (request: Request, response: Response) => {
  try {
    getSupabaseCredentials();
    const body = getRequestBody(request);
    const cartLines = parseCartLines(body.cart);
    const customer = parseCheckoutCustomer(body.customer);
    const visitorId = parseVisitorId(body.visitorId);
    const paymentMethod = body.paymentMethod;
    if (!['upi', 'card', 'netbanking', 'wallet'].includes(paymentMethod as string)) {
      throw new Error('Choose a supported payment method.');
    }
    const customerUserId = await getCustomerUserId(request, true);
    const orderFields = await createStoredOrderFields(cartLines, customer, body.couponCode, visitorId, customerUserId);
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
      quote: { subtotal: orderFields.subtotal, discount: orderFields.discount, deliveryCharge: orderFields.delivery_charge, total: orderFields.total },
      storeOrderId: storedOrder.id,
      orderNumber: storedOrder.order_number
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unable to start payment.';
    response.status(400).json({ error: msg });
  }
});

app.post('/api/payments/verify', async (request: Request, response: Response) => {
  try {
    const body = getRequestBody(request);
    const orderId = body.razorpay_order_id;
    const paymentId = body.razorpay_payment_id;
    const signature = body.razorpay_signature;
    if (typeof orderId !== 'string' || typeof paymentId !== 'string' || typeof signature !== 'string') {
      response.status(400).json({ error: 'Payment response is incomplete.' });
      return;
    }

    const { keySecret } = getRazorpayCredentials();
    const expectedSignature = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest();
    const providedSignature = Buffer.from(signature, 'hex');
    if (providedSignature.length !== expectedSignature.length || !crypto.timingSafeEqual(providedSignature, expectedSignature)) {
      response.status(400).json({ error: 'Payment verification failed.' });
      return;
    }

    const order = await razorpayRequest<RazorpayOrder & { amount_paid: number }>(`/orders/${encodeURIComponent(orderId)}`, 'GET');
    const payment = await razorpayRequest<RazorpayPayment>(`/payments/${encodeURIComponent(paymentId)}`, 'GET');
    if (payment.status !== 'captured') {
      response.status(400).json({ error: 'Payment is not complete.' });
      return;
    }

    const savedOrders = await supabaseRequest<StoredOrder[]>(
      `orders?razorpay_order_id=eq.${encodeURIComponent(orderId)}&select=*`,
      'PATCH',
      { payment_status: 'paid', razorpay_payment_id: payment.id },
      'return=representation'
    );
    response.json({ verified: true, orderNumber: savedOrders[0]?.order_number });
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

app.post('/api/orders/upi-qr', async (request: Request, response: Response) => {
  try {
    const body = getRequestBody(request);
    const cartLines = parseCartLines(body.cart);
    const customer = parseCheckoutCustomer(body.customer);
    const visitorId = parseVisitorId(body.visitorId);
    const utrNumber = typeof body.utrNumber === 'string' ? body.utrNumber.trim() : '';

    if (!/^[a-zA-Z0-9]{10,22}$/.test(utrNumber)) {
      response.status(400).json({ error: 'Please enter a valid 12-digit UPI UTR / Transaction ID.' });
      return;
    }

    const customerUserId = await getCustomerUserId(request, true);
    const orderFields = await createStoredOrderFields(cartLines, customer, body.couponCode, visitorId, customerUserId);
    const [order] = await supabaseRequest<StoredOrder[]>(
      'orders',
      'POST',
      [{
        ...orderFields,
        order_number: createOrderNumber(),
        payment_method: `upi_qr (UTR: ${utrNumber})`,
        payment_status: 'pending_verification',
        order_status: 'confirmed'
      }],
      'return=representation'
    );

    response.status(201).json({ order });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unable to save UPI order.';
    response.status(400).json({ error: msg });
  }
});

app.post('/api/orders/cod', async (request: Request, response: Response) => {
  try {
    const body = getRequestBody(request);
    const cartLines = parseCartLines(body.cart);
    const customer = parseCheckoutCustomer(body.customer);
    const visitorId = parseVisitorId(body.visitorId);
    const customerUserId = await getCustomerUserId(request, true);
    const orderFields = await createStoredOrderFields(cartLines, customer, body.couponCode, visitorId, customerUserId);
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
    const msg = error instanceof Error ? error.message : 'Unable to save order.';
    response.status(400).json({ error: msg });
  }
});

app.post('/api/orders/track', async (request: Request, response: Response) => {
  try {
    const body = getRequestBody(request);
    const orderNumber = typeof body.orderNumber === 'string' ? body.orderNumber.trim().toUpperCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
    if (!/^AKM-[0-9A-F]{8}$/.test(orderNumber) || phone.length < 10) {
      response.status(404).json({ error: 'Order not found.' });
      return;
    }
    const orders = await supabaseRequest<StoredOrder[]>(
      `orders?order_number=eq.${encodeURIComponent(orderNumber)}&select=id,order_number,phone,created_at,total,payment_status,order_status&limit=1`,
      'GET'
    );
    const order = orders[0];
    if (!order || order.phone.replace(/\D/g, '') !== phone) {
      response.status(404).json({ error: 'Order not found.' });
      return;
    }
    response.json({
      order: {
        orderNumber: order.order_number,
        createdAt: order.created_at,
        total: order.total,
        paymentStatus: order.payment_status,
        orderStatus: order.order_status
      }
    });
  } catch (error) {
    response.status(400).json({ error: 'Unable to track order.' });
  }
});

app.post('/api/analytics/events', async (request: Request, response: Response) => {
  try {
    const body = getRequestBody(request);
    const visitorId = parseVisitorId(body.visitorId);
    const eventType = body.eventType;
    if (!visitorId || typeof eventType !== 'string') {
      response.status(400).json({ error: 'Invalid analytics event.' });
      return;
    }
    await supabaseRequest('analytics_events', 'POST', [{ visitor_id: visitorId, event_type: eventType }], 'return=minimal');
    response.status(204).end();
  } catch (error) {
    response.status(400).json({ error: 'Unable to record analytics.' });
  }
});

// ==================== ADMIN DASHBOARD & ORDERS ====================
app.post('/api/admin/unlock', (request: Request, response: Response) => {
  const providedCode = String((request.body as { code?: string } | undefined)?.code || '').trim();
  if (!ADMIN_ACCESS_CODE) {
    response.status(500).json({ error: 'ADMIN_ACCESS_CODE server env mein set nahi hai.' });
    return;
  }
  if (!providedCode || providedCode !== ADMIN_ACCESS_CODE) {
    response.status(401).json({ error: 'Galat admin code.' });
    return;
  }
  response.json({ ok: true, token: ADMIN_ACCESS_CODE });
});

app.get('/api/admin/access', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    response.json({ authorized: true });
  } catch (error) {
    response.status(401).json({ error: 'Unauthorized.' });
  }
});

app.get('/api/admin/data', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    const [orders, events] = await Promise.all([
      supabaseRequest<StoredOrder[]>('orders?select=*&order=created_at.desc&limit=500', 'GET'),
      supabaseRequest<any[]>('analytics_events?select=*&order=created_at.desc&limit=2000', 'GET')
    ]);
    response.json({ orders, events });
  } catch (error) {
    response.status(403).json({ error: 'Unable to load owner data.' });
  }
});

app.patch('/api/admin/orders/:id/status', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    const body = getRequestBody(request);
    const orderId = request.params.id;
    const orderStatus = body.orderStatus;

    if (orderStatus === 'out_for_delivery') {
      const currentOrders = await supabaseRequest<StoredOrder[]>(`orders?id=eq.${encodeURIComponent(orderId)}&select=*`, 'GET');
      const order = await sendAndStoreDeliveryOtp(currentOrders[0]);
      response.json({ order: withoutDeliveryOtp(order), message: 'Delivery OTP sent.' });
      return;
    }
app.patch('/api/admin/orders/:id/verify-utr', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    const orderId = request.params.id;
    const orders = await supabaseRequest<StoredOrder[]>(
      `orders?id=eq.${encodeURIComponent(orderId)}&select=*`,
      'PATCH',
      { payment_status: 'paid' },
      'return=representation'
    );
    if (!orders.length) {
      response.status(404).json({ error: 'Order not found.' });
      return;
    }
    response.json({ order: withoutDeliveryOtp(orders[0]), message: 'UTR payment marked as paid.' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unable to verify UTR.';
    response.status(400).json({ error: msg });
  }
});
    const orders = await supabaseRequest<StoredOrder[]>(
      `orders?id=eq.${encodeURIComponent(orderId)}&select=*`,
      'PATCH',
      { order_status: orderStatus, delivery_otp_hash: null, delivery_otp_expires_at: null, delivery_otp_attempts: 0 },
      'return=representation'
    );
    response.json({ order: withoutDeliveryOtp(orders[0]) });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unable to update order.';
    response.status(400).json({ error: msg });
  }
});

app.post('/api/admin/orders/:id/deliver', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    const orderId = request.params.id;
    const body = getRequestBody(request);
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const orders = await supabaseRequest<StoredOrder[]>(`orders?id=eq.${encodeURIComponent(orderId)}&select=*`, 'GET');
    const order = orders[0];
    if (!order || !order.delivery_otp_hash) {
      response.status(400).json({ error: 'Active delivery OTP not found.' });
      return;
    }
    if (!isDeliveryOtpValid(order.id, code, order.delivery_otp_hash)) {
      response.status(400).json({ error: 'Incorrect delivery OTP.' });
      return;
    }
    const updated = await supabaseRequest<StoredOrder[]>(
      `orders?id=eq.${encodeURIComponent(order.id)}&select=*`,
      'PATCH',
      { order_status: 'delivered', delivery_otp_hash: null, delivery_otp_expires_at: null, delivery_otp_attempts: 0 },
      'return=representation'
    );
    response.json({ order: withoutDeliveryOtp(updated[0]), message: 'Delivery confirmed.' });
  } catch (error) {
    response.status(400).json({ error: 'Unable to confirm delivery.' });
  }
});

// ==================== SERVER START / VERCEL EXPORT ====================
if (process.env.VERCEL !== '1') {
  if (isProduction) {
    const distPath = path.resolve('dist');
    app.use(express.static(distPath));
    app.get('*', (_request: Request, response: Response) => {
      response.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const server = app.listen(port, '0.0.0.0');
  let activePort = port;
  const maxPortAttempts = 20;

  server.on('listening', () => {
    console.log(`AK MALA server listening on http://localhost:${activePort}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code !== 'EADDRINUSE' || isProduction || process.env.PORT) {
      console.error('Could not start the AK MALA server:', error);
      process.exitCode = 1;
      return;
    }

    if (activePort >= port + maxPortAttempts) {
      console.error(`Ports ${port}-${activePort} are already in use. Set PORT to an available port and retry.`);
      process.exitCode = 1;
      return;
    }

    activePort += 1;
    console.warn(`Port ${activePort - 1} is already in use; trying port ${activePort}.`);
    server.listen(activePort, '0.0.0.0');
  });
} else {
  const publicPath = path.resolve('public');
  app.use(express.static(publicPath));
  app.get('*', (_request: Request, response: Response) => {
    response.sendFile(path.join(publicPath, 'index.html'));
  });
}

export default app;