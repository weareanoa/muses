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

export interface TransactionDTO {
  id: string;
  orderCode?: string;
  date: string;
  status: 'unpaid' | 'processing' | 'completed' | 'cancelled';
  statusLabel: string;
  eventTag?: string;
  items: TransactionItemDTO[];
  deliveryInfo: string;
  subtotal?: number;
  shippingFee?: number;
  platformFee?: number;
  totalPrice: number;
  actionType: 'unpaid' | 'pickup' | 'shipping' | 'completed';
  initialCountdownSeconds?: number;
  pickupLocation?: string;
  pickupDate?: string;
  pickupCode?: string;
  shippingCourier?: string;
  trackingNumber?: string;
  estimatedArrival?: string;
  stepper?: StepperItemDTO[];
  isStepperExpanded?: boolean;
}

export interface CreateTransactionPayload {
  userId?: string;
  items: {
    id: string;
    name: string;
    subtitle: string;
    quantity: number;
    price: number;
    image: string;
  }[];
  subtotal: number;
  shippingFee: number;
  platformFee: number;
  total: number;
  notes?: string;
  address?: UserAddressDTO;
  paymentMethod?: string;
}

export interface PaymentOrderSummary {
  orderId: string;
  items: {
    id: string;
    name: string;
    subtitle: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  shippingFee: number;
  platformFee: number;
  total: number;
  deadline: string;
}

