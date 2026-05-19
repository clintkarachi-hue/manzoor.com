import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import { MOCK_PRODUCTS } from '../data/mockData';

const PRODUCTS_COLLECTION = 'products';

export const productService = {
  async getProducts(): Promise<Product[]> {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  },

  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...product,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  async updateProduct(id: string, product: Partial<Product>) {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await updateDoc(docRef, {
      ...product,
      updatedAt: serverTimestamp(),
    });
  },

  async deleteProduct(id: string) {
    const docRef = doc(db, PRODUCTS_COLLECTION, id);
    await deleteDoc(docRef);
  },

  async seedProducts() {
    const existing = await this.getProducts();
    if (existing.length === 0) {
      for (const product of MOCK_PRODUCTS) {
        const { id, ...data } = product;
        await addDoc(collection(db, PRODUCTS_COLLECTION), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  }
};
