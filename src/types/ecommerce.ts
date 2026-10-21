export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  itemCount: number;
  featured?: boolean;
  iconName?: string;
}

export interface ProductReview {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
}

export interface ProductSpecification {
  group: string;
  attributes: { name: string; value: string }[];
}

export interface ProductVariant {
  id: string;
  productId: string;
  title: string;
  sku: string;
  price: number;
  compareAtPrice?: number | null;
  stockQuantity: number;
  attributes: Record<string, string>;
  isActive?: boolean;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  brand: string;
  category: string;
  categorySlug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice: number;
  discountPercent: number;
  rating: number;
  reviewCount: number;
  stockQuantity: number;
  isAvailable: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isDealOfTheDay?: boolean;
  dealEndsAt?: string;
  sku: string;
  images: string[];
  thumbnail: string;
  tags: string[];
  features: string[];
  specifications: ProductSpecification[];
  reviews?: ProductReview[];
  variants?: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  variantTitle?: string;
  variantAttributes?: Record<string, string>;
  product: Product;
  quantity: number;
  unitPrice: number;
  compareAtPrice?: number;
  maxStock: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface OrderSummary {
  subtotal: number;
  discount: number;
  shipping: number;
  estimatedTax: number;
  total: number;
  savings: number;
}

export interface CartValidationResult {
  isValid: boolean;
  hasChanges: boolean;
  warnings: string[];
  items: CartItem[];
  summary: OrderSummary;
}

export interface WishlistItem {
  productId: string;
  product: Product;
  addedAt: string;
}

export interface Address {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  type?: 'Home' | 'Work' | 'Other';
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'unpaid' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cod' | 'razorpay' | 'card' | 'upi' | 'netbanking';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  title: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  thumbnail?: string;
  variantTitle?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  customerEmail?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  subtotal: number;
  discount: number;
  couponCode?: string;
  shippingFee: number;
  totalAmount: number;
  shippingAddress: Address;
  billingAddress?: Address;
  items: OrderItem[];
  trackingNumber?: string;
  notes?: string;
  cancellationReason?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  userId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
  paymentMethod: PaymentMethod;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  errorCode?: string;
  errorDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RazorpayOrderResponse {
  success: boolean;
  razorpayOrderId?: string;
  amount?: number; // in paise
  currency?: string;
  keyId?: string;
  orderId?: string;
  orderNumber?: string;
  error?: string;
}

export interface RazorpayVerificationPayload {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface CouponValidation {
  valid: boolean;
  code: string;
  discount: number;
  message: string;
  minOrder?: number;
}

export type ProductSortOption =
  | 'featured'
  | 'price-low'
  | 'price-high'
  | 'rating'
  | 'discount'
  | 'newest'
  | 'popularity';

export interface FilterState {
  category: string;
  brand?: string;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  inStockOnly: boolean;
  dealsOnly?: boolean;
  sortBy: ProductSortOption;
  searchQuery: string;
  page: number;
  limit: number;
}

export interface SearchSuggestionItem {
  id: string;
  title: string;
  slug: string;
  brand: string;
  category: string;
  price: number;
  thumbnail: string;
  rating: number;
}

export interface SearchSuggestionResult {
  products: SearchSuggestionItem[];
  categories: { id: string; name: string; slug: string }[];
  query: string;
}

export interface ReviewEligibility {
  eligible: boolean;
  hasReviewed: boolean;
  existingReview?: ReviewRecord;
  reason?: string;
  orderNumber?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// -----------------------------------------------------------------------------
// PHASE 7: ADMIN PANEL & ROLE-BASED ACCESS TYPES
// -----------------------------------------------------------------------------

export interface AdminDashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingOrdersCount: number;
  deliveredOrdersCount: number;
  averageOrderValue: number;
  recentOrders: Order[];
  lowStockProducts: Product[];
  salesByCategory: { category: string; sales: number; count: number }[];
  salesByPaymentMethod: { method: string; total: number; count: number }[];
  salesByStatus: Record<string, number>;
}

export interface CouponRecord {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  startsAt: string;
  expiresAt?: string;
  createdAt: string;
}

export interface CreateCouponInput {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  isActive?: boolean;
  expiresAt?: string;
}

export interface CustomerSummary {
  id: string;
  fullName: string;
  email: string;
  maskedEmail: string;
  phone?: string;
  role: 'customer' | 'admin';
  ordersCount: number;
  totalSpent: number;
  lastOrderDate?: string;
  createdAt: string;
  status?: 'active' | 'suspended' | 'pending';
  isVerified?: boolean;
}

export interface AdminUserMetrics {
  totalCustomers: number;
  newToday: number;
  newLast7Days: number;
  verifiedCount: number;
  unverifiedCount: number;
  activeCount: number;
  suspendedCount: number;
}

export interface ReviewRecord {
  id: string;
  productId: string;
  productTitle: string;
  userId: string;
  authorName: string;
  rating: number;
  title: string;
  comment: string;
  isVerifiedPurchase: boolean;
  status: 'approved' | 'pending' | 'rejected';
  createdAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface CreateProductInput {
  title: string;
  brand: string;
  category: string;
  categorySlug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  discountPercent?: number;
  sku: string;
  stockQuantity: number;
  images: string[];
  thumbnail?: string;
  tags?: string[];
  features?: string[];
  isAvailable?: boolean;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isDealOfTheDay?: boolean;
}

export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  displayOrder?: number;
  isActive?: boolean;
}

