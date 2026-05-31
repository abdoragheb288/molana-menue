/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Order, CartItem } from '../types';

const ORDERS_PATH = 'orders';

/**
 * Places a customer order.
 * Triggers document validation and creates a real-time tracking receipt ID.
 */
export async function placeOrder(orderData: {
  customerName: string;
  phone: string;
  address?: string;
  items: CartItem[];
  orderType: 'Takeaway' | 'Delivery';
  totalAmount: number;
}): Promise<string> {
  try {
    const colRef = collection(db, ORDERS_PATH);
    const docRef = await addDoc(colRef, {
      customerName: orderData.customerName,
      phone: orderData.phone,
      address: orderData.orderType === 'Delivery' ? (orderData.address || '') : '',
      items: orderData.items,
      orderType: orderData.orderType,
      status: 'pending',
      totalAmount: Number(orderData.totalAmount),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, ORDERS_PATH);
    throw error;
  }
}

/**
 * Updates an order status (Admin operation).
 */
export async function updateOrderStatus(id: string, status: Order['status']): Promise<void> {
  const path = `${ORDERS_PATH}/${id}`;
  try {
    const docRef = doc(db, ORDERS_PATH, id);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Deletes an order (Admin operation).
 */
export async function deleteOrder(id: string): Promise<void> {
  const path = `${ORDERS_PATH}/${id}`;
  try {
    const docRef = doc(db, ORDERS_PATH, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

/**
 * Subscribes to the live orders collection in real-time.
 * Strictly checks permissions and uses handleFirestoreError callback on error.
 */
export function subscribeToOrders(
  onUpdate: (orders: Order[]) => void,
  onError: (error: any) => void
): () => void {
  const colRef = collection(db, ORDERS_PATH);
  const q = query(colRef, orderBy('createdAt', 'desc'));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const orders: Order[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        orders.push({
          id: docSnap.id,
          customerName: data.customerName || '',
          phone: data.phone || '',
          address: data.address || '',
          items: data.items || [],
          orderType: data.orderType || 'Takeaway',
          status: data.status || 'pending',
          totalAmount: Number(data.totalAmount || 0),
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
      });
      onUpdate(orders);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, ORDERS_PATH);
      onError(error);
    }
  );

  return unsubscribe;
}
