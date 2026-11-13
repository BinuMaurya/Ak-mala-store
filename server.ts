import 'dotenv/config';
import crypto from 'node:crypto';
import path from 'node:path';
import express, { type Request, type Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { products } from './src/data/products.js';

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
  delivery_otp_hash: string | null;
  delivery_otp_expires_at: string | null;
  delivery_otp_attempts: number;
  created_at: string;
}

app.use(express.json({ limit: '32kb' }));

const trackingAttempts = new Map<string, { count: number; resetAt: number }>();
const trackingAttemptLimit = 10;
const trackingAttemptWindowMs = 15 * 60 * 1000;

app.get('/api/plugins/status', (_request: Request, response: Response) => {
  response.json({
    gemini: Boolean(process.env.GEMINI_API_KEY),
    supabase: Boolean(
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_ANON_KEY &&
      (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
    ),
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
  });
});

const productSuggestionIntent =
  /\b(image|images|photo|photos|picture|pictures|show|display|recommend|suggest|product|products|mala|malas|garland|garlands|flowers?|dikhao|dikhaiye|dikhaye|tasveer|tasveerein|chahiye)\b|फोटो|तस्वीर|माला|हार|दिखाओ|दिखाइए|चाहिए/i;

const productSearchStopWords = new Set([
  'a', 'an', 'and', 'are', 'can', 'for', 'have', 'i', 'in', 'is', 'it', 'me', 'of', 'please',
  'show', 'some', 'the', 'to', 'want', 'with', 'image', 'images', 'photo', 'photos', 'picture',
  'pictures', 'product', 'products', 'mala', 'malas', 'garland', 'garlands', 'flower', 'flowers',
  'color', 'colors', 'colour', 'colours',
  'dikhao', 'dikhaiye', 'dikhaye', 'dikhana', 'chahiye', 'mujhe', 'koi', 'ki', 'ka', 'ke', 'hai',
  'hain', 'ek', 'tasveer', 'tasveerein', 'dikha', 'करो', 'दिखाओ', 'दिखाइए', 'फोटो', 'तस्वीर',
  'माला', 'हार', 'चाहिए', 'मुझे', 'कोई'
]);

const productColorAliases = [
  ['red', 'लाल'],
  ['pink', 'गुलाबी'],
  ['white', 'सफेद', 'श्वेत'],
  ['yellow', 'पीला', 'पीली'],
  ['orange', 'नारंगी'],
  ['purple', 'violet', 'बैंगनी', 'जामुनी'],
  ['blue', 'नीला', 'नीली'],
  ['green', 'हरा', 'हरी'],
  ['black', 'काला', 'काली']
];

function getSuggestedProducts(query: string) {
  const normalizedQuery = query.toLocaleLowerCase();
  const tokenize = (value: string) =>
    value.toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const colorPreferences = productColorAliases.filter((aliases) =>
    aliases.some((alias) => tokenize(normalizedQuery).includes(alias))
  );
  const searchableProducts = products
    .filter((product) => product.inStock)
    .map((product) => ({
      product,
      searchableTerms: new Set(tokenize([
        product.name,
        product.hindiName,
        product.marathiName,
        product.category,
        ...product.tags,
        ...product.flowers,
        product.description,
        product.bestForDeity
      ].join(' ')))
    }));

  const ranked = searchableProducts
    .map(({ product, searchableTerms }) => {
      const matchesColors = colorPreferences.every((aliases) =>
        aliases.some((alias) => searchableTerms.has(alias))
      );
      if (!matchesColors) return { product, score: -1 };

      const terms = tokenize(normalizedQuery)
        .filter((term) => term.length > 1 && !productSearchStopWords.has(term));
      const score = terms.reduce(
        (total, term) => total + (searchableTerms.has(term) ? 1 : 0),
        0
      );
      return { product, score };
    })
    .filter(({ score }) => score >= 0)
    .sort((left, right) =>
      right.score - left.score ||
      Number(right.product.tags.includes('Best Seller')) - Number(left.product.tags.includes('Best Seller'))
    );

  const hasSpecificSearch = ranked.some(({ score }) => score > 0) || colorPreferences.length > 0;
  const suggestions = (hasSpecificSearch
    ? ranked.filter(({ score }) => score > 0)
    : ranked).slice(0, 3);

  return suggestions.map(({ product }) => ({
    id: product.id,
    name: product.name,
    image: product.image,
    price: product.price,
    category: product.category
  }));
}

app.post('/api/assistant/chat', async (request: Request, response: Response) => {
  const body = request.body as { messages?: unknown; context?: unknown };
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

  const latestMessage = body.messages[body.messages.length - 1] as { text: string };
  const suggestsProducts = productSuggestionIntent.test(latestMessage.text);
  const suggestedProducts = suggestsProducts ? getSuggestedProducts(latestMessage.text) : [];
  if (suggestsProducts) {
    const isHindi = /[\u0900-\u097F]/.test(latestMessage.text) ||
      /\b(mujhe|dikhao|dikhaiye|chahiye|kaisa|kaisi)\b/i.test(latestMessage.text);
    const reply = suggestedProducts.length
      ? isHindi
        ? 'आपकी पसंद से मेल खाने वाली उपलब्ध मालाएँ नीचे हैं:'
        : 'Here are the in-stock malas matching your request:'
      : isHindi
        ? 'इस रंग या फूल के लिए अभी कोई मेल खाता उपलब्ध उत्पाद नहीं मिला। कृपया कोई दूसरा रंग या फूल आज़माएँ।'
        : 'I could not find an in-stock match for that request. Try another flower or color, such as a red rose, white mogra, or yellow marigold mala.';
    response.json({
      reply,
      products: suggestedProducts
    });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    response.status(503).json({ error: 'The store assistant is not configured yet. Please contact the store owner.' });
    return;
  }

  const context = body.context && typeof body.context === 'object' && !Array.isArray(body.context)
    ? body.context as Record<string, unknown>
    : {};
  const currentProduct = typeof context.currentProductId === 'string'
    ? products.find((product) => product.id === context.currentProductId)
    : undefined;
  const cartContext = Array.isArray(context.cart)
    ? context.cart.slice(0, 20).flatMap((line) => {
      if (!line || typeof line !== 'object' || Array.isArray(line)) return [];
      const item = line as Record<string, unknown>;
      if (
        typeof item.productId !== 'string' ||
        typeof item.selectedSize !== 'string' ||
        typeof item.quantity !== 'number' ||
        !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > maxCartItems
      ) return [];

      const product = products.find((candidate) => candidate.id === item.productId);
      const size = product?.availableSizes.find((option) => option.size === item.selectedSize);
      return product && size
        ? [{ name: product.name, size: size.size, quantity: item.quantity }]
        : [];
    })
    : [];
  const shoppingContext = {
    currentProduct: currentProduct ? { name: currentProduct.name, category: currentProduct.category } : null,
    cart: cartContext
  };

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
    'Use the provided shopping context only to make relevant suggestions. Never claim access to other browsing activity, and never pressure customers to order.',
    'Reply in the same language as the customer, including English, Hindi, Marathi, or Gujarati.',
    'Keep answers warm, concise, and useful. If a fact is not in the catalogue or store information, say so clearly.',
    ...(suggestsProducts
      ? [`Matching in-stock products for the latest request: ${JSON.stringify(suggestedProducts)}. Mention only these products as matches; image cards for them will be shown separately.`]
      : []),
    `Product catalogue: ${JSON.stringify(catalogue)}`,
    `Current shopping context: ${JSON.stringify(shoppingContext)}`
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
    response.json({ reply, ...(suggestsProducts ? { products: suggestedProducts } : {}) });
  } catch (error) {
    console.error('Store assistant request failed:', error);
    response.status(502).json({ error: 'The assistant is temporarily unavailable. Please try again shortly.' });
  }
});

function getSupabaseCredentials() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error('Supabase is not configured. Add the server-side Supabase secret key before accepting orders.');
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
  const responseText = await result.text();
  if (!responseText) return undefined as T;
  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new GatewayError('The order database returned an invalid response. Please try again.');
  }
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

function createStoredOrderFields(
  cartLines: CartLineInput[],
  customer: CheckoutCustomer,
  couponCode: unknown,
  visitorId: string | null
) {
  const quote = createPaymentQuote(cartLines, couponCode);
  const items = cartLines.map((line) => {
    const product = products.find((candidate) => candidate.id === line.productId);
    const size = product?.availableSizes.find((option) => option.size === line.selectedSize);
    if (!product || !size) throw new Error('A cart item is unavailable. Refresh your cart and try again.');
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

function hashDeliveryOtp(orderId: string, otp: string): string {
  const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error('Supabase is not configured.');
  return crypto.createHmac('sha256', secret).update(`${orderId}:${otp}`).digest('hex');
}

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
    throw new Error('Delivery SMS is not configured. Add the Twilio credentials to the server environment.');
  }
  return { accountSid, authToken, fromNumber };
}

async function sendDeliveryOtp(phone: string, orderNumber: string, otp: string): Promise<void> {
  const { accountSid, authToken, fromNumber } = getTwilioCredentials();
  const body = new URLSearchParams({
    To: normalizePhoneNumber(phone),
    From: fromNumber,
    Body: `Your AK MALA delivery verification code for order ${orderNumber} is ${otp}. It expires in 10 minutes. Do not share it except with your delivery agent.`
  });
  let result: globalThis.Response;
  try {
    result = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    });
  } catch {
    throw new GatewayError('Could not reach Twilio to send the delivery code. Please try again.');
  }
  if (!result.ok) {
    const error = await result.json().catch(() => ({})) as { code?: number };
    console.error('Twilio delivery SMS request failed:', result.status, error.code || 'Unknown error');
    throw new GatewayError('Twilio could not send the delivery code. Check the SMS provider account and try again.');
  }
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

  try {
    await sendDeliveryOtp(order.phone, order.order_number, otp);
  } catch (error) {
    try {
      await supabaseRequest<StoredOrder[]>(
        `orders?id=eq.${encodeURIComponent(order.id)}&select=*`,
        'PATCH',
        {
          order_status: order.order_status,
          delivery_otp_hash: null,
          delivery_otp_expires_at: null,
          delivery_otp_attempts: 0
        },
        'return=representation'
      );
    } catch (rollbackError) {
      console.error('Could not roll back order after delivery SMS failed:', rollbackError);
    }
    throw error;
  }
  return updated[0];
}

function isDeliveryOtpValid(orderId: string, otp: string, expectedHash: string): boolean {
  const submittedHash = Buffer.from(hashDeliveryOtp(orderId, otp), 'hex');
  const storedHash = Buffer.from(expectedHash, 'hex');
  return submittedHash.length === storedHash.length && crypto.timingSafeEqual(submittedHash, storedHash);
}

function withoutDeliveryOtp(order: StoredOrder) {
  const {
    delivery_otp_hash: _hash,
    delivery_otp_expires_at: _expiresAt,
    delivery_otp_attempts: _attempts,
    ...safeOrder
  } = order;
  return safeOrder;
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

function createPaymentQuote(cartLines: CartLineInput[], couponCode: unknown): PaymentQuote {
  if (couponCode !== null && couponCode !== undefined && couponCode !== festivalCouponCode) {
    throw new Error('This coupon is not available for online checkout.');
  }

  const subtotal = cartLines.reduce((total, line) => {
    const product = products.find((candidate) => candidate.id === line.productId);
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
    const orderFields = createStoredOrderFields(cartLines, customer, body.couponCode, visitorId);
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
    const orderFields = createStoredOrderFields(cartLines, customer, body.couponCode, visitorId);
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

app.post('/api/orders/track', async (request: Request, response: Response) => {
  const now = Date.now();
  const key = request.ip || request.socket.remoteAddress || 'unknown';
  const attempt = trackingAttempts.get(key);
  if (attempt && attempt.resetAt > now && attempt.count >= trackingAttemptLimit) {
    response.status(429).json({ error: 'Too many tracking attempts. Please try again in 15 minutes.' });
    return;
  }
  trackingAttempts.set(key, {
    count: attempt && attempt.resetAt > now ? attempt.count + 1 : 1,
    resetAt: attempt && attempt.resetAt > now ? attempt.resetAt : now + trackingAttemptWindowMs
  });
  if (trackingAttempts.size > 5000) {
    for (const [attemptKey, value] of trackingAttempts) {
      if (value.resetAt <= now) trackingAttempts.delete(attemptKey);
    }
  }

  try {
    const body = getRequestBody(request);
    const orderNumber = typeof body.orderNumber === 'string' ? body.orderNumber.trim().toUpperCase() : '';
    const phone = typeof body.phone === 'string' ? body.phone.replace(/\D/g, '') : '';
    if (!/^AKM-[0-9A-F]{8}$/.test(orderNumber) || phone.length < 10 || phone.length > 15) {
      response.status(404).json({ error: 'Order not found. Check the order number and checkout phone number.' });
      return;
    }
    const orders = await supabaseRequest<StoredOrder[]>(
      `orders?order_number=eq.${encodeURIComponent(orderNumber)}&select=id,order_number,phone,created_at,total,payment_status,order_status&limit=1`,
      'GET'
    );
    const order = orders[0];
    if (!order || order.phone.replace(/\D/g, '') !== phone) {
      response.status(404).json({ error: 'Order not found. Check the order number and checkout phone number.' });
      return;
    }
    trackingAttempts.delete(key);
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
    const message = error instanceof Error ? error.message : 'Unable to look up this order.';
    const status = message.startsWith('Supabase is not configured') ? 503 : error instanceof GatewayError ? 502 : 400;
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
    const status = message.startsWith('Supabase is not configured')
      ? 503
      : error instanceof GatewayError
        ? 502
        : 400;
    if (status !== 400) console.error(message);
    response.status(status).json({ error: message });
  }
});

app.get('/api/admin/access', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    response.json({ authorized: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to verify owner access.';
    const status = message.startsWith('Supabase is not configured')
      ? 503
      : message.includes('expired') || message.startsWith('Please sign in')
        ? 401
        : 403;
    response.status(status).json({ error: message });
  }
});

app.get('/api/admin/data', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    const [orders, events] = await Promise.all([
      supabaseRequest<StoredOrder[]>(
        'orders?select=id,order_number,visitor_id,customer_name,phone,email,shipping_address,items,subtotal,discount,delivery_charge,total,payment_method,payment_status,order_status,created_at&order=created_at.desc&limit=500',
        'GET'
      ),
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
    const currentOrders = await supabaseRequest<StoredOrder[]>(
      `orders?id=eq.${encodeURIComponent(orderId)}&select=*`,
      'GET'
    );
    const currentOrder = currentOrders[0];
    if (!currentOrder) {
      response.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (currentOrder.order_status === 'delivered' && body.orderStatus !== 'delivered') {
      response.status(400).json({ error: 'A completed order cannot be moved back to an earlier status.' });
      return;
    }
    if (body.orderStatus === 'delivered') {
      response.status(400).json({ error: 'Verify the delivery OTP before marking this order delivered.' });
      return;
    }

    if (body.orderStatus === 'out_for_delivery') {
      const order = await sendAndStoreDeliveryOtp(currentOrder);
      response.json({ order: withoutDeliveryOtp(order), message: 'Delivery OTP sent to the customer.' });
      return;
    }

    const orders = await supabaseRequest<StoredOrder[]>(
      `orders?id=eq.${encodeURIComponent(orderId)}&select=*`,
      'PATCH',
      {
        order_status: body.orderStatus,
        delivery_otp_hash: null,
        delivery_otp_expires_at: null,
        delivery_otp_attempts: 0
      },
      'return=representation'
    );
    response.json({ order: withoutDeliveryOtp(orders[0]) });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to update the order.';
    const status = message.startsWith('Supabase is not configured') ||
      message.startsWith('Delivery SMS is not configured')
      ? 503
      : error instanceof GatewayError || message.includes('database')
        ? 502
        : message.startsWith('Please sign in') || message.startsWith('This account') || message.startsWith('Owner access')
          ? 403
          : 400;
    response.status(status).json({ error: message });
  }
});

app.post('/api/admin/orders/:id/delivery-otp', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    const orderId = request.params.id;
    if (!/^[0-9a-f-]{36}$/i.test(orderId)) {
      response.status(400).json({ error: 'Invalid order identifier.' });
      return;
    }
    const orders = await supabaseRequest<StoredOrder[]>(
      `orders?id=eq.${encodeURIComponent(orderId)}&select=*`,
      'GET'
    );
    const order = orders[0];
    if (!order) {
      response.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (order.order_status !== 'out_for_delivery') {
      response.status(400).json({ error: 'A delivery OTP can only be sent for an out-for-delivery order.' });
      return;
    }
    const updated = await sendAndStoreDeliveryOtp(order);
    response.json({ order: withoutDeliveryOtp(updated), message: 'A new delivery OTP was sent to the customer.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to send the delivery OTP.';
    const status = message.startsWith('Supabase is not configured') ||
      message.startsWith('Delivery SMS is not configured')
      ? 503
      : error instanceof GatewayError
        ? 502
        : 403;
    response.status(status).json({ error: message });
  }
});

app.post('/api/admin/orders/:id/deliver', async (request: Request, response: Response) => {
  try {
    await requireAdmin(request);
    const orderId = request.params.id;
    const body = getRequestBody(request);
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!/^[0-9]{6}$/.test(code) || !/^[0-9a-f-]{36}$/i.test(orderId)) {
      response.status(400).json({ error: 'Enter the six-digit delivery OTP.' });
      return;
    }
    const orders = await supabaseRequest<StoredOrder[]>(
      `orders?id=eq.${encodeURIComponent(orderId)}&select=*`,
      'GET'
    );
    const order = orders[0];
    if (!order) {
      response.status(404).json({ error: 'Order not found.' });
      return;
    }
    if (order.order_status !== 'out_for_delivery' || !order.delivery_otp_hash || !order.delivery_otp_expires_at) {
      response.status(400).json({ error: 'This order does not have an active delivery OTP.' });
      return;
    }
    if (new Date(order.delivery_otp_expires_at).getTime() <= Date.now()) {
      response.status(400).json({ error: 'The delivery OTP has expired. Send a new OTP before confirming delivery.' });
      return;
    }
    if (order.delivery_otp_attempts >= 5) {
      response.status(429).json({ error: 'Too many incorrect OTP attempts. Send a new OTP before trying again.' });
      return;
    }
    if (!isDeliveryOtpValid(order.id, code, order.delivery_otp_hash)) {
      await supabaseRequest<StoredOrder[]>(
        `orders?id=eq.${encodeURIComponent(order.id)}&select=*`,
        'PATCH',
        { delivery_otp_attempts: order.delivery_otp_attempts + 1 },
        'return=representation'
      );
      response.status(400).json({ error: 'Incorrect delivery OTP.' });
      return;
    }
    const updated = await supabaseRequest<StoredOrder[]>(
      `orders?id=eq.${encodeURIComponent(order.id)}&select=*`,
      'PATCH',
      {
        order_status: 'delivered',
        delivery_otp_hash: null,
        delivery_otp_expires_at: null,
        delivery_otp_attempts: 0
      },
      'return=representation'
    );
    response.json({ order: withoutDeliveryOtp(updated[0]), message: 'Delivery confirmed.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to confirm delivery.';
    const status = message.startsWith('Supabase is not configured')
      ? 503
      : error instanceof GatewayError || message.includes('database')
        ? 502
        : 403;
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
}

export default app;
