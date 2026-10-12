// src/types/index.ts
export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  oldPrice?: number;
  saveAmount?: number;
  images: string[];
  colors?: string[];
  qualities?: string[];
  brand?: Brand;
  category?: Category;
  stock: number;
  description?: string;
  specifications?: Specification[];
  quality?: string;
  guarantee?: string;
  frame?: string;
  type?: string;
  service?: string;
  createdAt?: string;
  popularity?: number;
  keyBenefits?: string[];
}

export interface Specification {
  key: string;
  value: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  price: number;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  items: OrderItem[];
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  paymentMethod: 'BKASH' | 'SSLCOMMERZ' | 'COD';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  shippingAddress: Address;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface Address {
  id: string;
  customerId: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  isDefault?: boolean;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  author: string;
  coverImage?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface Ticket {
  id: string;
  customerId: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
}
