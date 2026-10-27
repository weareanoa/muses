export interface OrderItem {
  name: string;
  variant: string;
  image: string;
  quantity?: number;
  price: number;
}

export interface StepperItem {
  label: string;
  completed: boolean;
}

export interface OrderTransaction {
  id: string;
  date: string;
  status: 'unpaid' | 'processing' | 'completed' | 'cancelled';
  statusLabel: string;
  eventTag?: string;
  items: OrderItem[];
  deliveryInfo: string;
  totalPrice: number;
  actionType: 'unpaid' | 'pickup' | 'shipping' | 'completed';
  initialCountdownSeconds?: number;
  pickupLocation?: string;
  pickupDate?: string;
  pickupCode?: string;
  shippingCourier?: string;
  trackingNumber?: string;
  estimatedArrival?: string;
  stepper?: StepperItem[];
  isStepperExpanded?: boolean;
}

export const INITIAL_ORDERS: OrderTransaction[] = [
  {
    id: 'MSE-261022-031',
    date: '22 Okt 2026, 19.42',
    status: 'unpaid',
    statusLabel: 'Menunggu pembayaran',
    eventTag: 'EVENT • ITASHA DOMEI',
    items: [
      {
        name: 'Faril',
        variant: 'Cheki Two Shoot',
        image: '/images/members/faril.webp',
        quantity: 2,
        price: 40000,
      },
    ],
    deliveryInfo: 'Diambil saat event • 2 Cheki',
    totalPrice: 80000,
    actionType: 'unpaid',
    initialCountdownSeconds: 178,
  },
  {
    id: 'MSE-261022-031',
    date: '22 Okt 2026, 19.42',
    status: 'processing',
    statusLabel: 'Diambil di event',
    eventTag: 'EVENT • ITASHA DOMEI',
    items: [
      {
        name: 'Faril',
        variant: 'Cheki Two Shoot',
        image: '/images/members/faril.webp',
        price: 40000,
      },
    ],
    deliveryInfo: 'Diambil saat event • 2 Cheki',
    totalPrice: 80000,
    actionType: 'pickup',
    pickupLocation: 'Ambil cheki di Itasha Domei, Bandung',
    pickupDate: 'Sabtu, 24 Oktober 2026. Tunjukkan kode ini ke staff management.',
    pickupCode: 'MSE-7K4Q',
    stepper: [
      { label: 'Dibayar', completed: true },
      { label: 'Disiapkan Management', completed: true },
      { label: 'Siap diambil di event', completed: true },
      { label: 'Selesai', completed: false },
    ],
    isStepperExpanded: true,
  },
  {
    id: 'MSE-261022-031',
    date: '22 Okt 2026, 19.42',
    status: 'processing',
    statusLabel: 'Dikirim',
    eventTag: 'EVENT • ITASHA DOMEI',
    items: [
      {
        name: 'Faril',
        variant: 'Cheki Two Shoot',
        image: '/images/members/faril.webp',
        price: 40000,
      },
      {
        name: 'Mine',
        variant: 'Cheki Two Shoot',
        image: '/images/members/mine.webp',
        price: 40000,
      },
    ],
    deliveryInfo: 'Diambil saat event • 2 Cheki',
    totalPrice: 80000,
    actionType: 'shipping',
    shippingCourier: 'JNE Regular',
    trackingNumber: 'JNE8829104829',
    estimatedArrival: '25 - 26 Oktober 2026',
    stepper: [
      { label: 'Dibayar', completed: true },
      { label: 'Disiapkan Management', completed: true },
      { label: 'Dalam Pengiriman (JNE)', completed: true },
      { label: 'Selesai', completed: false },
    ],
    isStepperExpanded: false,
  },
  {
    id: 'MSE-261015-014',
    date: '15 Okt 2026, 16.30',
    status: 'completed',
    statusLabel: 'Selesai',
    eventTag: 'EVENT • ITASHA DOMEI',
    items: [
      {
        name: 'Faril',
        variant: 'Cheki Two Shoot & Special Photocard',
        image: '/images/members/faril.webp',
        quantity: 1,
        price: 50000,
      },
    ],
    deliveryInfo: 'Diambil saat event • 1 Cheki',
    totalPrice: 50000,
    actionType: 'completed',
    stepper: [
      { label: 'Dibayar', completed: true },
      { label: 'Disiapkan Management', completed: true },
      { label: 'Siap diambil di event', completed: true },
      { label: 'Selesai', completed: true },
    ],
    isStepperExpanded: false,
  },
];

export const ORDER_FILTER_TABS = [
  { id: 'all', label: 'Semua' },
  { id: 'unpaid', label: 'Belum Bayar' },
  { id: 'processing', label: 'Sedang diproses' },
  { id: 'completed', label: 'Selesai' },
] as const;

