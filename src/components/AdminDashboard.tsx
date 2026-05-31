/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  Printer,
  Edit2,
  Trash2,
  Plus,
  Compass,
  AlertTriangle,
  LogOut,
  Clock,
  CheckCircle,
  Truck,
  RotateCcw,
  UtensilsCrossed,
  Layers,
  Search,
  Check,
  X,
  PlusCircle
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { MenuItem, Order } from '../types';
import {
  fetchMenuItems,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  seedMenuIfNeeded
} from '../lib/menuService';
import {
  subscribeToOrders,
  updateOrderStatus,
  deleteOrder
} from '../lib/orderService';

interface AdminDashboardProps {
  onPrintRequest: (order: Order) => void;
  shouldPlayChimeToken: number;
}

export function AdminDashboard({ onPrintRequest, shouldPlayChimeToken }: AdminDashboardProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'orders' | 'menu'>('orders');

  // Loaders
  const [menuLoading, setMenuLoading] = useState<boolean>(false);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);

  // Authentication alerts/warnings
  const [authError, setAuthError] = useState<string>('');

  // Audio Alerts and Sound Notification
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Search inside collections
  const [orderFilter, setOrderFilter] = useState<string>('');
  const [menuSearch, setMenuSearch] = useState<string>('');

  // Menu CRUD dialog states
  const [showItemModal, setShowItemModal] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItemId, setEditingItemId] = useState<string>('');
  
  // Menu Item Form Fields State
  const [itemName, setItemName] = useState<string>('');
  const [itemPrice, setItemPrice] = useState<string>('');
  const [itemCategory, setItemCategory] = useState<string>('Platters');
  const [itemDescription, setItemDescription] = useState<string>('');
  const [itemImageUrl, setItemImageUrl] = useState<string>('');
  const [itemAvailable, setItemAvailable] = useState<boolean>(true);

  const categoryLabels: { [key: string]: string } = {
    'Platters': 'الأطباق الرئيسية',
    'Sandwiches': 'الساندوتشات واللفائف',
    'Drinks': 'المشروبات'
  };

  // Play audio chime for incoming orders
  useEffect(() => {
    if (shouldPlayChimeToken > 0 && soundEnabled) {
      playNewOrderChime();
    }
  }, [shouldPlayChimeToken]);

  const playNewOrderChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5 note
      osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5 note
      osc1.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.3); // G5 note

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(261.63, audioCtx.currentTime); // C4

      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.6);
      osc2.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.warn('Audio synthesis browser context is delayed until user-click interaction: ', e);
    }
  };

  // Auth setup listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // Verify if current user is the bootstrapped admin
  const isUserAdmin = currentUser?.email === 'abdoragheb288@gmail.com';
  const prevOrdersCountRef = useRef<number>(-1);

  // Sync / Load and subscribe the database records
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initializeDashboard() {
      try {
        setMenuLoading(true);
        const data = await seedMenuIfNeeded(isUserAdmin);
        setMenuItems(data);
      } catch (err) {
        console.error('Failed to load/seed menu list: ', err);
      } finally {
        setMenuLoading(false);
      }

      if (isUserAdmin) {
        setOrdersLoading(true);
        unsubscribe = subscribeToOrders(
          (data) => {
            setOrders((prevOrders) => {
              if (prevOrdersCountRef.current >= 0 && data.length > prevOrdersCountRef.current) {
                if (soundEnabled) {
                  playNewOrderChime();
                }
              }
              prevOrdersCountRef.current = data.length;
              return data;
            });
            setOrdersLoading(false);
          },
          (error) => {
            console.error('Permission failure checking orders: ', error);
            setOrdersLoading(false);
          }
        );
      } else {
        setOrders([]);
        setOrdersLoading(false);
        prevOrdersCountRef.current = -1;
      }
    }

    initializeDashboard();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [currentUser, isUserAdmin, soundEnabled]);

  // Auth operations
  const handleGoogleLogin = async () => {
    setAuthError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Login failed.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  // Order state workflow triggers
  const executeStatusUpdate = async (orderId: string, status: Order['status']) => {
    try {
      await updateOrderStatus(orderId, status);
    } catch (err: any) {
      console.error(err);
      alert('تم رفض الإذن من جدار الحماية! فقط المدير abdoragheb288@gmail.com يملك صلاحية تعديل حالة الطلبات.');
    }
  };

  const executeOrderDelete = async (orderId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الطلب نهائياً من قاعدة البيانات والسجلات؟')) return;
    try {
      await deleteOrder(orderId);
    } catch (err: any) {
      console.error(err);
      alert('تم رفض الإذن! فقط المشرف abdoragheb288@gmail.com يستطيع مسح السجل الدائم للطلبات.');
    }
  };

  // Menu CRUD execution tasks
  const openMenuItemModal = (mode: 'create' | 'edit', item?: MenuItem) => {
    setModalMode(mode);
    setAuthError('');
    if (mode === 'edit' && item) {
      setEditingItemId(item.id || '');
      setItemName(item.name);
      setItemPrice(item.price.toString());
      setItemCategory(item.category);
      setItemDescription(item.description);
      setItemImageUrl(item.imageUrl || '');
      setItemAvailable(item.availability !== false);
    } else {
      setEditingItemId('');
      setItemName('');
      setItemPrice('');
      setItemCategory('Platters');
      setItemDescription('');
      setItemImageUrl('');
      setItemAvailable(true);
    }
    setShowItemModal(true);
  };

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemPrice || !itemCategory || !itemDescription) return;

    const priceNum = parseFloat(itemPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      alert('يجب إدخال سعر صحيح وأكبر من الصفر');
      return;
    }

    const payload = {
      name: itemName,
      price: priceNum,
      category: itemCategory,
      description: itemDescription,
      imageUrl: itemImageUrl || undefined,
      availability: itemAvailable,
    };

    try {
      if (modalMode === 'create') {
        await addMenuItem(payload);
      } else {
        await updateMenuItem(editingItemId, payload);
      }
      setShowItemModal(false);
      const updatedMenu = await fetchMenuItems();
      setMenuItems(updatedMenu);
    } catch (err: any) {
      console.error(err);
      alert('مرفوض! فقط المدير المسؤول (abdoragheb288@gmail.com) يملك صلاحيات تعديل أو إضافة منتجات في كتالوج السيرفر.');
    }
  };

  const executeMenuDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الصنف نهائياً من قائمة الطعام؟')) return;
    try {
      await deleteMenuItem(id);
      const updatedMenu = await fetchMenuItems();
      setMenuItems(updatedMenu);
    } catch (err: any) {
      console.error(err);
      alert('مرفوض! فقط الحساب الرئيسي abdoragheb288@gmail.com يمكنه حذف منتجات من كتالوج السيرفر.');
    }
  };

  // Statistics summaries
  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const processingCount = orders.filter(o => o.status === 'processing').length;
  const deliveryCount = orders.filter(o => o.status === 'processing' && o.orderType === 'Delivery').length;
  const totalReceivedSales = orders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Filters
  const filteredOrders = orders.filter(order => {
    if (!orderFilter) return true;
    return order.status === orderFilter;
  });

  const searchedMenuItems = menuItems.filter(item => {
    if (!menuSearch) return true;
    return item.name.toLowerCase().includes(menuSearch.toLowerCase()) || 
           item.category.toLowerCase().includes(menuSearch.toLowerCase()) ||
           (categoryLabels[item.category] || '').includes(menuSearch);
  });

  const statusBadgeTexts = {
    pending: 'قيد انتظار الموافقة',
    processing: 'تحت التحضير والطهي',
    completed: 'مكتمل / تم التسليم',
    cancelled: 'ملغي'
  };

  return (
    <div className="flex-1 bg-[#F9F7F2] text-[#1A1A1A] flex flex-col overflow-hidden font-sans" dir="rtl">
      {/* Top Admin Utility Header */}
      <header className="bg-[#141414] border-b border-[#141414] px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D97706] text-white flex items-center justify-center font-serif italic text-2xl font-black rounded-lg">
            م
          </div>
          <div className="text-right">
            <span className="text-[9px] text-[#D97706] font-bold uppercase tracking-widest block font-sans">غرفة الإدارة والمطبخ</span>
            <h1 className="text-xl font-serif italic text-white tracking-tight">لوحة تحكم مطعم مولانا الأصيل</h1>
          </div>
        </div>

        {/* Auth Module Controller */}
        <div className="flex items-center gap-3 flex-wrap">
          {currentUser ? (
            <div className="flex items-center gap-2.5 bg-[#1A1A1A] border border-white/10 px-3.5 py-2 text-[#F9F7F2]">
              <div className="text-right">
                <div className="text-xs font-bold text-white max-w-[145px] truncate">{currentUser.displayName || 'مشرف معتمد'}</div>
                <div className="text-[9px] text-gray-400 max-w-[145px] dir-ltr text-right truncate">{currentUser.email}</div>
              </div>
              
              {isUserAdmin ? (
                <span className="text-[9px] bg-[#D97706]/20 border border-[#D97706]/30 text-[#D97706] font-bold px-1.5 py-0.5 uppercase tracking-wider font-mono">
                  المدير العام
                </span>
              ) : (
                <span className="text-[9px] bg-white/5 border border-white/10 text-slate-300 font-bold px-1.5 py-0.5">
                  مساهم خارجي
                </span>
              )}

              <button
                onClick={handleSignOut}
                title="تسجيل الخروج"
                className="p-1 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer mr-2"
              >
                <LogOut size={13} className="scale-x-[-1]" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className="bg-[#D97706] hover:bg-[#141414] text-white text-[10px] uppercase tracking-widest font-bold py-2.5 px-5 transition-colors cursor-pointer"
            >
              تسجيل الدخول كمدير من Google
            </button>
          )}

          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2 text-[10px] uppercase font-bold flex items-center gap-1 transition-all border cursor-pointer ${
              soundEnabled
                ? 'bg-[#1A1A1A] border-white/10 text-[#D97706]'
                : 'bg-black border-transparent text-[#F9F7F2]/40'
            }`}
          >
            {soundEnabled ? '🔈 جرس التنبيه: مفعّل' : '🔇 جرس التنبيه: صامت'}
          </button>
        </div>
      </header>

      {/* Security alert context */}
      {currentUser && !isUserAdmin && (
        <div className="mx-6 mt-4 bg-[#FFF9E6] border border-[#F59E0B]/30 text-[#B45309] p-3.5 flex items-start gap-2.5 text-xs text-right">
          <AlertTriangle size={15} className="shrink-0 mt-0.5 text-[#D97706]" />
          <div>
            <span className="font-bold">تنبيه: صلاحيات حساب العرض فقط </span>
            لقد قمت بتسجيل الدخول بحساب <span className="font-mono text-black font-semibold">{currentUser.email}</span>.
            نظراً لقواعد الأمان الصارمة <span className="font-semibold text-black">(Zero-Trust)</span> لقاعدة بياناتنا، فإن تعديل قائمة الطعام أو اتخاذ إجراءات على الطلبات يتطلب تسجيل الدخول ببريد المدير المسؤول المعتمد: <span className="font-mono text-black underline font-bold">abdoragheb288@gmail.com</span>.
          </div>
        </div>
      )}

      {/* Dashboard Submenu layout */}
      <div className="px-6 py-4 flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center bg-white border-b border-black/5 shrink-0">
        <div className="flex border border-black/10 bg-[#F9F7F2] p-0.5 self-start">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-5 py-2 text-[10px] font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#141414] text-[#F9F7F2]'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <Clock size={12} /> الطلبات الحالية والواردة
          </button>
          
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-5 py-2 text-[10px] font-bold tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-[#141414] text-[#F9F7F2]'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            <Layers size={12} /> أطباق قائمة المأكولات
          </button>
        </div>

        {/* Micro KPI Widgets */}
        {activeTab === 'orders' && (
          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="bg-white border border-black/10 px-3.5 py-1.5 flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#D97706] animate-ping"></span>
              <span className="text-[9px] text-slate-500 font-bold">بانتظار الموافقة:</span>
              <span className="text-xs font-bold font-mono text-[#D97706]">{pendingCount}</span>
            </div>

            <div className="bg-white border border-black/10 px-3.5 py-1.5 flex items-center gap-2 shadow-xs">
              <Truck size={12} className="text-[#141414]" />
              <span className="text-[9px] text-slate-500 font-bold">طلبات التوصيل:</span>
              <span className="text-xs font-bold font-mono text-[#141414]">{deliveryCount}</span>
            </div>

            <div className="bg-white border border-black/10 px-3.5 py-1.5 flex items-center gap-2 shadow-xs">
              <CheckCircle size={12} className="text-[#D97706]" />
              <span className="text-[9px] text-slate-500 font-bold">المبيعات المكتملة:</span>
              <span className="text-xs font-bold font-mono text-[#141414]">${totalReceivedSales.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Panel Content Scroll Canvas */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'orders' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Orders Filter Utilities */}
            <div className="p-6 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0 text-right">
              <div>
                <h2 className="text-base font-bold text-slate-900">البث المباشر للطلبات الواردة ({orders.length})</h2>
                <p className="text-xs text-slate-500 leading-tight">مزامنة تلقائية حية من مخدم Firestore الرئيسي للمطعم</p>
              </div>

              <div className="flex bg-white border border-black/10 rounded-none p-1 overflow-x-auto self-start">
                {[
                  { value: '', label: 'الكل' },
                  { value: 'pending', label: 'قيد الانتظار' },
                  { value: 'processing', label: 'تحت الإعداد' },
                  { value: 'completed', label: 'المكتملة' },
                  { value: 'cancelled', label: 'الملغاة' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setOrderFilter(option.value)}
                    className={`text-[9px] font-bold px-3 py-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      orderFilter === option.value
                        ? 'bg-[#141414] text-white'
                        : 'text-slate-500 hover:text-black'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders viewport card list */}
            <div className="flex-1 overflow-y-auto p-6 pt-2">
              {ordersLoading ? (
                <div className="h-44 flex flex-col justify-center items-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-500 font-serif italic text-right">جاري الاتصال بقاعدة بيانات المطبخ المباشرة...</span>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="h-44 flex flex-col justify-center items-center bg-white border border-black/10 rounded-none p-6 text-center">
                  <Compass size={24} className="text-[#D97706] mb-2" />
                  <div className="text-xs font-bold text-[#141414]">لا يوجد طلبات تحت هذا التصنيف حالياً</div>
                  <p className="text-xs text-slate-500 max-w-[280px] leading-relaxed mt-1">
                    يرجى إرسال طلب محاكاة جديد عبر هاتف العميل على اليمين لتتم مزامنته هنا في لوحة التحكم بشكل لحظي!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredOrders.map((order) => {
                    const orderDate = order.createdAt?.seconds 
                      ? new Date(order.createdAt.seconds * 1000).toLocaleTimeString('ar-EG') 
                      : new Date().toLocaleTimeString('ar-EG');

                    const statusCardStyle = {
                      pending: 'border-r-4 border-[#D97706] bg-white',
                      processing: 'border-r-4 border-amber-500 bg-white shadow-xs',
                      completed: 'border-r-4 border-[#141414] bg-[#F9F7F2]',
                      cancelled: 'border-r-4 border-red-800 bg-white opacity-60'
                    };

                    const statusBadgeColors = {
                      pending: 'bg-[#FFF9E6] text-[#B45309] border border-[#F59E0B]/10',
                      processing: 'bg-indigo-55 text-indigo-700 border border-indigo-100',
                      completed: 'bg-[#141414] text-white border border-black',
                      cancelled: 'bg-red-50 text-red-700 border border-red-100'
                    };

                    return (
                      <div
                        key={order.id}
                        className={`border border-black/10 overflow-hidden flex flex-col transition-all group ${statusCardStyle[order.status]}`}
                      >
                        {/* Order Header banner */}
                        <div className="p-4 border-b border-black/5 flex justify-between items-center bg-[#F9F7F2]/40 text-right">
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-slate-900 select-all uppercase">
                                #{order.id?.substring(0, 6).toUpperCase()}
                              </span>
                              <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-none border leading-none ${statusBadgeColors[order.status]}`}>
                                {statusBadgeTexts[order.status]}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{orderDate}</span>
                          </div>

                          <div className="text-left">
                            <span className="text-[9px] font-bold block text-[#D97706]">مطلوب إجمالاً</span>
                            <span className="text-xs font-serif font-extrabold text-[#141414] font-mono">${order.totalAmount.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Order Info block */}
                        <div className="p-4 flex-1 space-y-3.5 text-xs text-right">
                          {/* customer section */}
                          <div className="space-y-1">
                            <div className="text-[9px] text-[#D97706] font-bold">بيانات العميل المستلم</div>
                            <div className="font-serif font-black text-slate-950 text-sm leading-tight">{order.customerName}</div>
                            <div className="text-slate-600 flex items-center gap-1 font-mono text-[11px] justify-start">
                              <span>الهاتف: {order.phone}</span>
                            </div>
                            
                            {/* Type badge */}
                            <div className="pt-1 flex gap-2 justify-start">
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 border ${
                                order.orderType === 'Delivery' 
                                  ? 'bg-[#141414] text-[#F9F7F2]' 
                                  : 'bg-white text-slate-700 border-black/20'
                              }`}>
                                {order.orderType === 'Delivery' ? '🚗 توصيل للمنزل' : '🥡 استلام من الفرع'}
                              </span>
                            </div>

                            {order.orderType === 'Delivery' && (
                              <div className="mt-2 pr-2 border-r border-[#D97706] py-0.5 text-slate-600 italic leading-snug">
                                <span className="text-[9px] font-bold block text-slate-400 not-italic">العنوان:</span>
                                {order.address}
                              </div>
                            )}
                          </div>

                          {/* items section */}
                          <div className="space-y-1.5 border-t border-black/5 pt-3">
                            <div className="text-[9px] text-slate-400 font-bold">الأطباق والطلبات المطبوخة ({order.items.length})</div>
                            <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                              {order.items.map((it, i) => (
                                <div key={i} className="flex justify-between items-start gap-1 p-1 bg-[#F9F7F2]/50 border border-black/5">
                                  <span>
                                    <strong className="text-[#D97706] font-bold">{it.quantity}x</strong> <span className="text-[11px] font-medium">{it.name}</span>
                                    {it.notes && <span className="block text-[9px] text-gray-500 italic">ملاحظة: {it.notes}</span>}
                                  </span>
                                  <span className="text-slate-505 font-mono text-[11px]">${(it.price * it.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Order Action Footer tools */}
                        <div className="p-4 border-t border-black/5 bg-[#F9F7F2]/30 flex flex-wrap gap-2 items-center justify-between">
                          {/* Printer Trigger */}
                          <button
                            id={`print-receipt-btn-${order.id}`}
                            onClick={() => onPrintRequest(order)}
                            className="bg-white hover:bg-[#F9F7F2] text-slate-800 border border-black/15 px-3 py-1.5 rounded-none text-[9px] font-bold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                            title="طباعة إيصال المطعم الحراري 80 مم"
                          >
                            <Printer size={11} />
                            <span>طباعة الفاتورة</span>
                          </button>

                          {/* Status workflow triggers */}
                          {isUserAdmin && (
                            <div className="flex items-center gap-1">
                              {order.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => executeStatusUpdate(order.id!, 'processing')}
                                    className="bg-[#D97706] hover:bg-[#141414] text-white font-bold px-3 py-1.5 rounded-none text-[9px] transition-colors cursor-pointer"
                                  >
                                    قبول الطلب
                                  </button>
                                  <button
                                    onClick={() => executeStatusUpdate(order.id!, 'cancelled')}
                                    className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-none text-[9px] transition-colors cursor-pointer mr-1"
                                  >
                                    إلغاء الطلب
                                  </button>
                                </>
                              )}

                              {order.status === 'processing' && (
                                <>
                                  <button
                                    onClick={() => executeStatusUpdate(order.id!, 'completed')}
                                    className="bg-slate-950 hover:bg-[#D97706] text-white font-bold px-3 py-1.5 rounded-none text-[9px] transition-colors cursor-pointer"
                                  >
                                    تم التجهيز والتسليم
                                  </button>
                                  <button
                                    onClick={() => executeStatusUpdate(order.id!, 'cancelled')}
                                    className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-none text-[9px] transition-colors cursor-pointer mr-1"
                                  >
                                    إلغاء
                                  </button>
                                </>
                              )}

                              {(order.status === 'completed' || order.status === 'cancelled') && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => executeStatusUpdate(order.id!, 'pending')}
                                    className="p-1 px-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-black/10 rounded-none text-[9px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                    title="إعادة فتح الطلب"
                                  >
                                    <RotateCcw size={10} className="text-[#D97706]" /> إعادة فتح
                                  </button>
                                  
                                  <button
                                    onClick={() => executeOrderDelete(order.id!)}
                                    className="p-1.5 bg-red-50 text-red-600 border border-red-200 rounded-none hover:bg-red-700 hover:text-white transition-colors cursor-pointer mr-1"
                                    title="حذف الطلب نهائياً"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Filter / CRUD tool controllers */}
            <div className="p-6 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 text-right">
              <div>
                <h2 className="text-base font-bold text-slate-900">قائمة الطعام المطروحة</h2>
                <p className="text-xs text-slate-500 leading-tight">إضافة، تعديل أو حذف الأطباق والمأكولات في المطعم</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search size={14} className="absolute right-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="البحث في الأصناف، الأطباق..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="w-full bg-white border border-black/10 rounded-none pr-9 pl-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#D97706] font-sans"
                  />
                </div>

                {isUserAdmin && (
                  <button
                    onClick={() => openMenuItemModal('create')}
                    className="bg-[#141414] hover:bg-[#D97706] text-white text-[10px] font-bold py-2.5 px-5 rounded-none flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <PlusCircle size={13} /> إضافة طبق جديد
                  </button>
                )}
              </div>
            </div>

            {/* Menu catalogue scroll list */}
            <div className="flex-1 overflow-y-auto p-6 pt-2">
              {menuLoading ? (
                <div className="h-44 flex flex-col justify-center items-center gap-3">
                  <div className="w-8 h-8 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-500 font-serif italic text-right">جاري تحميل قائمة الأطباق النشطة من السيرفر...</span>
                </div>
              ) : searchedMenuItems.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs font-serif italic p-6 border border-dashed border-black/15 bg-white">
                  لا توجد أطباق متطابقة في قاعدة بيانات مولانا لمطابقتها حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {searchedMenuItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-black/10 rounded-none p-4.5 flex gap-3.5 shadow-xs hover:-translate-y-0.5 transition-all group text-right"
                    >
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-20 h-20 object-cover rounded-none border border-black/10 flex-shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex justify-between items-start gap-1">
                            <h3 className="font-serif font-black text-slate-950 text-xs tracking-tight truncate group-hover:text-[#D97706] transition-colors leading-tight">
                              {item.name}
                            </h3>
                            <span className="text-[8px] bg-[#F9F7F2] border border-black/5 text-[#D97706] px-1.5 py-0.5 rounded-none font-bold uppercase shrink-0">
                              {categoryLabels[item.category] || item.category}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-500 leading-snug mt-1.5 line-clamp-2 italic">
                            {item.description}
                          </p>
                        </div>

                        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-dashed border-black/10">
                          <span className="font-mono font-black text-[#D97706] text-xs">
                            ${item.price.toFixed(2)}
                          </span>

                          {isUserAdmin && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => openMenuItemModal('edit', item)}
                                className="p-1 px-2.5 bg-white border border-black/10 hover:bg-[#F9F7F2] text-[9px] font-bold text-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                                title="تعديل تفاصيل الصنف"
                              >
                                <Edit2 size={10} className="text-slate-500" /> تعديل
                              </button>
                              
                              <button
                                onClick={() => executeMenuDelete(item.id!)}
                                className="p-1.5 bg-red-50 text-red-500 border border-red-100 rounded-none hover:bg-red-700 hover:text-white transition-colors cursor-pointer mr-1"
                                title="حذف الصنف من القائمة"
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Item Create / Edit dialog popup */}
      {showItemModal && (
        <div id="moulana-menu-crud-modal" className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-black/15 shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up text-right">
            <header className="px-6 py-4 border-b border-black/10 flex justify-between items-center bg-[#141414] text-[#F9F7F2]">
              <h3 className="font-serif italic font-bold text-base text-right">
                {modalMode === 'create' ? 'إضافة طبق جديد للكتالوج المباشر' : 'تحديث بيانات الصنف'}
              </h3>
              <button
                onClick={() => setShowItemModal(false)}
                className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer mr-auto"
              >
                <X size={16} />
              </button>
            </header>

            <form onSubmit={handleMenuSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">اسم الطبق المكتوب *</label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="مثال: طبق مشويات مشكل مولانا"
                    className="w-full bg-[#F9F7F2]/25 border border-black/15 rounded-none px-3 py-2 text-xs text-[#141414] focus:outline-none focus:border-[#D97706] font-sans text-right"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">السعر ($) *</label>
                  <input
                    type="text"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="مثال: 19.99"
                    className="w-full bg-[#F9F7F2]/25 border border-black/15 rounded-none px-3 py-2 text-xs text-[#141414] focus:outline-none focus:border-[#D97706] font-mono text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">تصنيف الطبق *</label>
                  <select
                    value={itemCategory}
                    onChange={(e) => setItemCategory(e.target.value)}
                    className="w-full bg-[#F9F7F2]/25 border border-black/15 rounded-none px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-[#D97706] cursor-pointer font-sans"
                  >
                    <option value="Platters">الأطباق الرئيسية</option>
                    <option value="Sandwiches">الساندوتشات واللفائف</option>
                    <option value="Drinks">المشروبات</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">رابط الصورة (اختياري)</label>
                  <input
                    type="url"
                    value={itemImageUrl}
                    onChange={(e) => setItemImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-[#F9F7F2]/25 border border-black/15 rounded-none px-3 py-2 text-xs text-[#141414] focus:outline-none focus:border-[#D97706] font-sans text-left direction-ltr"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 mb-1">تفاصيل ومكونات الطبق بالتفصيل *</label>
                <textarea
                  required
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="صِف المكونات ونوع التتبيل وطريقة الطهي والمقبلات الجانبية للعميل..."
                  rows={3}
                  className="w-full bg-[#F9F7F2]/25 border border-black/15 rounded-none px-3 py-2 text-xs text-[#141414] focus:outline-none focus:border-[#D97706] font-sans text-right"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="availability-check"
                  checked={itemAvailable}
                  onChange={(e) => setItemAvailable(e.target.checked)}
                  className="w-4 h-4 text-[#D97706] border-black/15 rounded-none focus:ring-0 cursor-pointer ml-2"
                />
                <label htmlFor="availability-check" className="text-xs text-slate-600 select-none cursor-pointer font-sans">
                  متاح للطلب المباشر من قبل الزبائن
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-black/5 mt-4 bg-white">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 border border-black/10 rounded-none text-[9px] font-bold text-slate-400 hover:text-black transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#141414] hover:bg-[#D97706] text-white text-[9px] font-bold rounded-none shadow-xs transition-colors cursor-pointer mr-2"
                >
                  {modalMode === 'create' ? 'نشر الصنف الآن' : 'حفظ التعديلات والتثبيت'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
