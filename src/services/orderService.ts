import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order } from '../types';

const ORDERS_COLLECTION = 'orders';

export const orderService = {
  async getOrders(): Promise<Order[]> {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  },

  async createOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateOrderStatus(id: string, status: Order['status']) {
    const docRef = doc(db, ORDERS_COLLECTION, id);
    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  }
};
