/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MenuItem {
  id?: string;
  name: string;
  price: number;
  category: string;
  description: string;
  imageUrl?: string;
  availability?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface CartItem {
  id: string; // matches menu id
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export interface Order {
  id?: string;
  customerName: string;
  phone: string;
  address?: string;
  items: CartItem[];
  orderType: 'Takeaway' | 'Delivery';
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  totalAmount: number;
  createdAt: any;
  updatedAt: any;
}
