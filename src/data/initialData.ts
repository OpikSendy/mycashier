export interface MenuItem {
  id: string;
  name: string;
  nameEn?: string;
  category: 'food' | 'drinks' | 'dessert' | 'snack';
  subCategory?: string;
  variantPreset?: 'drinks' | 'food' | 'snack' | 'dessert' | 'none';
  price: number;
  description: string;
  descriptionEn?: string;
  image: string;
  isAvailable: boolean;
  isPopular?: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  notes?: string;
}

export type OrderStatus = 'PENDING' | 'COOKING' | 'READY' | 'SERVED' | 'COMPLETED';
export type PaymentMethod = 'CASH' | 'QRIS' | 'DEBIT';

export interface Order {
  id: string;
  tableNumber: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: 'UNPAID' | 'PAID';
  paymentMethod: PaymentMethod;
  createdAt: string;
}

export const INITIAL_MENU: MenuItem[] = [
  {
    id: 'prod-1',
    name: 'Kopi Susu Gula Aren Premium',
    nameEn: 'Premium Aren Palm Sugar Milk Coffee',
    category: 'drinks',
    subCategory: 'Coffee',
    variantPreset: 'drinks',
    price: 22000,
    description: 'Espresso ganda diseduh dengan susu segar murni dan gula aren organik khas Nusantara.',
    descriptionEn: 'Double shot espresso brewed with pure fresh milk and authentic organic palm sugar.',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    isPopular: true,
  },
  {
    id: 'prod-2',
    name: 'Nasi Goreng Wagyu Special',
    nameEn: 'Special Wagyu Beef Fried Rice',
    category: 'food',
    subCategory: 'Rice Bowl & Nasi',
    variantPreset: 'food',
    price: 45000,
    description: 'Nasi goreng bumbu rempah spesial dipadu dengan potongan daging Wagyu lembut dan telur mata sapi.',
    descriptionEn: 'Special spiced fried rice topped with tender Wagyu beef chunks and a sunny-side-up egg.',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    isPopular: true,
  },
  {
    id: 'prod-3',
    name: 'Matcha Cream Latté',
    nameEn: 'Uji Matcha Cream Latte',
    category: 'drinks',
    subCategory: 'Non-Coffee',
    variantPreset: 'drinks',
    price: 28000,
    description: 'Matcha Uji Jepang kelas tinggi dipadu susu oat gurih dan foam krim lembut.',
    descriptionEn: 'High-grade Japanese Uji matcha paired with creamy oat milk and smooth foam.',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    id: 'prod-4',
    name: 'Beef Teriyaki Rice Bowl',
    nameEn: 'Imported Beef Teriyaki Rice Bowl',
    category: 'food',
    subCategory: 'Rice Bowl & Nasi',
    variantPreset: 'food',
    price: 38000,
    description: 'Irisan daging sapi impor ditumis dengan saus Teriyaki otentik di atas nasi hangat pulen.',
    descriptionEn: 'Sliced imported beef sautéed in authentic Teriyaki sauce served over warm fluffy rice.',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    isPopular: true,
  },
  {
    id: 'prod-5',
    name: 'Croissant Butter Truffle',
    nameEn: 'Truffle Butter French Croissant',
    category: 'snack',
    subCategory: 'Pastry & Bakery',
    variantPreset: 'snack',
    price: 25000,
    description: 'Pastry khas Prancis berlapis mentega panggang renyah di luar, lembut berlapis di dalam.',
    descriptionEn: 'Classic French butter croissant baked crispy on the outside, flaky and soft inside.',
    image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    id: 'prod-6',
    name: 'Biscoff Lotus Cheese Cake',
    nameEn: 'Lotus Biscoff Baked Cheesecake',
    category: 'dessert',
    subCategory: 'Cakes & Sweets',
    variantPreset: 'dessert',
    price: 32000,
    description: 'Kue keju panggang lezat ditaburi remahan biskuit Lotus Biscoff dan lelehan caramel.',
    descriptionEn: 'Delicious baked cheesecake topped with crunchy Lotus Biscoff crumbs and caramel drizzle.',
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
    isPopular: true,
  },
  {
    id: 'prod-7',
    name: 'Iced Lemon Tea Sparkle',
    nameEn: 'Sparkling Iced Lemon Tea',
    category: 'drinks',
    subCategory: 'Tea & Sparkle',
    variantPreset: 'drinks',
    price: 18000,
    description: 'Teh lemon segar disajikan dingin dengan es dan sentuhan soda menyegarkan.',
    descriptionEn: 'Fresh brewed lemon tea served ice-cold with a splash of refreshing sparkling soda.',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
  {
    id: 'prod-8',
    name: 'French Fries Truffle Oil',
    nameEn: 'Truffle Oil & Parmesan French Fries',
    category: 'snack',
    subCategory: 'Finger Food',
    variantPreset: 'snack',
    price: 24000,
    description: 'Kentang goreng renyah ditaburi garam laut, keju parmesan, dan aroma truffle.',
    descriptionEn: 'Crispy golden french fries tossed with sea salt, parmesan cheese, and truffle aroma.',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80',
    isAvailable: true,
  },
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-8801',
    tableNumber: 'Meja 04',
    customerName: 'Sendy',
    items: [
      { id: 'item-1', productId: 'prod-2', productName: 'Nasi Goreng Wagyu Special', price: 45000, quantity: 1, notes: 'Telur setengah matang, Pedas Sedang' },
      { id: 'item-2', productId: 'prod-1', productName: 'Kopi Susu Gula Aren Premium', price: 22000, quantity: 1, notes: 'Less Sugar (50%), Normal Ice' },
    ],
    totalAmount: 67000,
    status: 'COOKING',
    paymentStatus: 'PAID',
    paymentMethod: 'QRIS',
    createdAt: '19:42:10',
  },
  {
    id: 'ORD-8802',
    tableNumber: 'Meja 02',
    customerName: 'Andi',
    items: [
      { id: 'item-3', productId: 'prod-4', productName: 'Beef Teriyaki Rice Bowl', price: 38000, quantity: 2, notes: 'Extra Saus' },
      { id: 'item-4', productId: 'prod-7', productName: 'Iced Lemon Tea Sparkle', price: 18000, quantity: 2 },
    ],
    totalAmount: 112000,
    status: 'PENDING',
    paymentStatus: 'UNPAID',
    paymentMethod: 'CASH',
    createdAt: '19:45:00',
  },
  {
    id: 'ORD-8803',
    tableNumber: 'Meja 08',
    customerName: 'Budi Kurniawan',
    items: [
      { id: 'item-5', productId: 'prod-6', productName: 'Biscoff Lotus Cheese Cake', price: 32000, quantity: 1 },
      { id: 'item-6', productId: 'prod-3', productName: 'Matcha Cream Latté', price: 28000, quantity: 1 },
    ],
    totalAmount: 60000,
    status: 'READY',
    paymentStatus: 'PAID',
    paymentMethod: 'QRIS',
    createdAt: '19:30:15',
  },
];
