/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocsFromServer
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { MenuItem } from '../types';

const MENU_PATH = 'menu';

// Sample Seed Data for Moulana Restaurant
const SEED_MENU: MenuItem[] = [
  {
    id: "moulana-special-platter",
    name: "طبق مولانا الخاص",
    price: 24.99,
    category: "Platters",
    description: "مشكل كباب مشوي على اللهب، شيش طاووق، وريش لحم غنم طرية تقدم مع أرز بسمتي بالزعفران المنفوش، حمص، وصلصة ثوم خاصة.",
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop",
    availability: true,
    createdAt: null,
    updatedAt: null
  },
  {
    id: "royal-shawarma-platter",
    name: "طبق الشاورما الملكي",
    price: 18.99,
    category: "Platters",
    description: "شاورما دجاج ولحم بقري فوق طبقة من الأرز، مخلل لفت، صلصة الثوم والطحينة المميزة لدينا، مع خبز بيتا مخبوز طازجاً.",
    imageUrl: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500&auto=format&fit=crop",
    availability: true,
    createdAt: null,
    updatedAt: null
  },
  {
    id: "golden-falafel-platter",
    name: "طبق الفلافل الذهبي الممتاز",
    price: 14.50,
    category: "Platters",
    description: "حبات فلافل حمص مقرمشة وذهبية تقدم مع سلطة خضراء طازجة، صلصة طحينة للتغميس، حمص كريمي غني، وخبز بيتا دافئ.",
    imageUrl: "https://images.unsplash.com/photo-1547058886-af77810b584e?w=500&auto=format&fit=crop",
    availability: true,
    createdAt: null,
    updatedAt: null
  },
  {
    id: "spicy-shish-tawook-sandwich",
    name: "ساندوتش شيش طاووق حار",
    price: 8.99,
    category: "Sandwiches",
    description: "شيش صدور دجاج متبل ومشوي على الفحم ملفوف في كريب دافئ مع كريم الثوم، بطاطس مقرمشة، ومخلل هالبينو حار.",
    imageUrl: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=500&auto=format&fit=crop",
    availability: true,
    createdAt: null,
    updatedAt: null
  },
  {
    id: "traditional-beef-doner-sandwich",
    name: "ساندوتش دونر لحم تقليدي",
    price: 9.50,
    category: "Sandwiches",
    description: "شرائح دونر لحم بقري متبلة وطرية، طماطم طازجة، بصل بالسماق المقرمش، خس مبشور، وصلصة الثوم والأعشاب داخل خبز تركي دافئ.",
    imageUrl: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop",
    availability: true,
    createdAt: null,
    updatedAt: null
  },
  {
    id: "crispy-halloumi-mint-wrap",
    name: "لفافة جبن الحلوم والنعناع",
    price: 8.50,
    category: "Sandwiches",
    description: "جبنة حلوم مشوحة بالزبدة مع أوراق النعناع الطازج، خيار مقرمش، جرجير بري، طماطم، وزيتون كالاماتا في خبز تورتيلا رقيق.",
    imageUrl: "https://images.unsplash.com/photo-1626700051175-6518c4793f4f?w=500&auto=format&fit=crop",
    availability: true,
    createdAt: null,
    updatedAt: null
  },
  {
    id: "fresh-lemon-mint-cooler",
    name: "ليمون بالنعناع منعش",
    price: 4.50,
    category: "Drinks",
    description: "عصير ليمون طازج ممزوج مع أوراق النعناع العضوي والثلج والشراب المحلى البارد بشكل مثالي للانتعاش.",
    imageUrl: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop",
    availability: true,
    createdAt: null,
    updatedAt: null
  },
  {
    id: "mango-lassi",
    name: "مانجو لاسي كريمي",
    price: 3.99,
    category: "Drinks",
    description: "شراب زبادي بارد وغني بالكريمة ممزوج بنكهة مانجو ألفونسو الممتازة ومزين برشة ناعمة من الهيل المطحون.",
    imageUrl: "https://images.unsplash.com/photo-1571006682855-3971e98d9e6e?w=500&auto=format&fit=crop",
    availability: true,
    createdAt: null,
    updatedAt: null
  },
  {
    id: "turkish-coffee",
    name: "قهوة تركية فاخرة",
    price: 3.50,
    category: "Drinks",
    description: "قهوة سوداء تقليدية ثقيلة ومعدة ببطء في ركوة نحاسية تقليدية ومعطرة ببهار الهيل الأصيل.",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop",
    availability: true,
    createdAt: null,
    updatedAt: null
  }
];

export async function fetchMenuItems(): Promise<MenuItem[]> {
  try {
    const colRef = collection(db, MENU_PATH);
    const querySnapshot = await getDocs(colRef);
    const items: MenuItem[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      items.push({
        id: docSnap.id,
        name: data.name,
        price: Number(data.price),
        category: data.category,
        description: data.description,
        imageUrl: data.imageUrl,
        availability: data.availability !== false,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    });
    return items;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, MENU_PATH);
    return [];
  }
}

export async function addMenuItem(item: Omit<MenuItem, 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const colRef = collection(db, MENU_PATH);
    const docData: any = {
      name: item.name,
      price: Number(item.price),
      category: item.category,
      description: item.description,
      availability: item.availability !== false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (item.imageUrl !== undefined) {
      docData.imageUrl = item.imageUrl;
    }
    const docRef = await addDoc(colRef, docData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, MENU_PATH);
    throw error;
  }
}

export async function updateMenuItem(id: string, item: Partial<MenuItem>): Promise<void> {
  const path = `${MENU_PATH}/${id}`;
  try {
    const docRef = doc(db, MENU_PATH, id);
    const cleanUpdateFields: Record<string, any> = {};
    if (item.name !== undefined) cleanUpdateFields.name = item.name;
    if (item.price !== undefined) cleanUpdateFields.price = Number(item.price);
    if (item.category !== undefined) cleanUpdateFields.category = item.category;
    if (item.description !== undefined) cleanUpdateFields.description = item.description;
    if (item.imageUrl !== undefined) cleanUpdateFields.imageUrl = item.imageUrl;
    if (item.availability !== undefined) cleanUpdateFields.availability = item.availability;
    cleanUpdateFields.updatedAt = serverTimestamp();

    await updateDoc(docRef, cleanUpdateFields);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function deleteMenuItem(id: string): Promise<void> {
  const path = `${MENU_PATH}/${id}`;
  try {
    const docRef = doc(db, MENU_PATH, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
}

export async function seedMenuIfNeeded(isAdminUser?: boolean): Promise<MenuItem[]> {
  try {
    const colRef = collection(db, MENU_PATH);
    // Use getDocsFromServer to ensure we bypass client caches when verifying database footprint
    const snap = await getDocsFromServer(colRef);
    if (snap.empty) {
      if (isAdminUser && auth.currentUser && auth.currentUser.email === 'abdoragheb288@gmail.com') {
        console.log('Menu is empty. Seeding dishes as Admin...');
        for (const item of SEED_MENU) {
          await addMenuItem(item);
        }
        return await fetchMenuItems();
      } else {
        console.log('Menu is empty, but user is not admin or auth is not initialized. Skipping write attempt, using client-side SEED_MENU fallback.');
        return SEED_MENU;
      }
    }
    const remoteItems = await fetchMenuItems();
    return remoteItems.length > 0 ? remoteItems : SEED_MENU;
  } catch (error) {
    console.error('Error seeding menu: ', error);
    try {
      const remoteItems = await fetchMenuItems();
      return remoteItems.length > 0 ? remoteItems : SEED_MENU;
    } catch {
      return SEED_MENU;
    }
  }
}
