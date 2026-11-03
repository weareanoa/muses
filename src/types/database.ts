export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UserAddressDTO {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  district?: string;
  postalCode: string;
  detail?: string;
  isDefault: boolean;
}

export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  role?: 'user' | 'admin';
  phone?: string;
  username?: string;
  authProvider?: 'google' | 'email' | 'credentials';
  avatar?: string;
  bias?: string;
  biasEmoji?: string;
  membershipTier?: string;
  membershipNumber?: string;
  joinedAt?: string;
  addresses?: UserAddressDTO[];
  selectedAddressId?: string;
}

export interface ScheduleDTO {
  id: string;
  tourName: string;
  title?: string;
  day: string;
  dayName: string;
  month: string;
  year: string;
  city: string;
  country: string;
  venue: string;
  status: 'Available' | 'Selling Fast' | 'Sold Out' | 'Coming Soon' | string;
  doorOpen?: string;
  showTime: string;
  ticketUrl: string;
  posterImage: string;
  targetDate?: string;
}

export interface ProductDTO {
  id: string;
  name: string;
  tagline?: string;
  category: string;
  price: number;
  currency: string;
  rating?: number;
  reviewCount?: number;
  image: string;
  gallery?: string[];
  description: string;
  isFeatured: boolean;
  stock: number;
  sku?: string;
  releaseDate?: string;
  manufacturer?: string;
  origin?: string;
  colors?: string[];
  sizes?: string[];
  details?: string[];
  features?: string[];
  packageContents?: string[];
  specifications?: Record<string, any>;
}

export interface CatalogItemDTO {
  id: string;
  name: string;
  category: 'CHEKI' | 'MERCHANDISE' | 'VIDEOCALL';
  subtitle: string;
  color?: string;
  image: string;
  options: string[];
  price: number;
  stock: number;
}

export interface TransactionItemDTO {
  id?: string;
  name: string;
  variant: string;
  image: string;
  quantity?: number;
  price: number;
}

export interface StepperItemDTO {
  label: string;
  completed: boolean;
}

export type TransactionStatus =
  | 'unpaid'
  | 'awaiting_verification'
  | 'processing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'expired';

export interface TransactionDTO {
  id: string;
  orderCode?: string;
  date: string;
  status: TransactionStatus;
  statusLabel: string;
  eventTag?: string;
  items: TransactionItemDTO[];
  deliveryInfo: string;
  subtotal?: number;
  shippingFee?: number;
  platformFee?: number;
  totalPrice: number;
  payableAmount?: number;
  uniqueCode?: number;
  paymentDeadline?: string;
  rejectReason?: string;
  actionType: 'unpaid' | 'pickup' | 'shipping' | 'completed' | 'none';
  fulfillmentMethod?: 'delivery' | 'pickup';
  pickupLocation?: string;
  pickupDate?: string;
  pickupCode?: string;
  pickupContactName?: string;
  pickupContactPhone?: string;
  trackingNumber?: string;
  stepper?: StepperItemDTO[];
  isStepperExpanded?: boolean;
}

export interface FulfillmentPayload {
  method: 'delivery' | 'pickup';
  pickupEventId?: string;
  pickupEventTitle?: string;
  pickupDate?: string;
  pickupLocation?: string;
  pickupContactName?: string;
  pickupContactPhone?: string;
  pickupCode?: string;
}

export interface CreateTransactionPayload {
  items: { id: string; quantity: number }[];
  notes?: string;
  address?: UserAddressDTO;
  fulfillment: FulfillmentPayload;
}

export interface PaymentSettings {
  qrisImageUrl: string;
  gatewayEnabled: boolean;
}
