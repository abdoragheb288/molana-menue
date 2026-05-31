/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShoppingBag, ArrowLeft, Phone, MapPin, Check, Plus, Minus, Send, Trash2, Smartphone, Download, Share2, Info, X, ExternalLink } from 'lucide-react';
import { MenuItem, CartItem } from '../types';
import { fetchMenuItems, seedMenuIfNeeded } from '../lib/menuService';
import { placeOrder } from '../lib/orderService';

interface MobileAppProps {
  onOrderPlacedAlert?: () => void;
  isFullScreenMode?: boolean;
}

export function MobileApp({ onOrderPlacedAlert, isFullScreenMode = false }: MobileAppProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Platters');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCart, setShowCart] = useState<boolean>(false);
  const [checkoutStep, setCheckoutStep] = useState<'browse' | 'checkout' | 'success'>('browse');

  // Checkout Form State
  const [customerName, setCustomerName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [orderType, setOrderType] = useState<'Takeaway' | 'Delivery'>('Takeaway');
  const [recentOrderId, setRecentOrderId] = useState<string>('');
  const [orderSubmitting, setOrderSubmitting] = useState<boolean>(false);
  const [notes, setNotes] = useState<{ [itemId: string]: string }>({});
  
  // Install and Link Sharing states
  const [showInstallModal, setShowInstallModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleNativeInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      setDeferredPrompt(null);
    }
  };

  const categories = ['Platters', 'Sandwiches', 'Drinks'];

  const categoryLabels: { [key: string]: string } = {
    'Platters': 'الأطباق الرئيسية',
    'Sandwiches': 'الساندوتشات واللفائف',
    'Drinks': 'المشروبات المنعشة'
  };

  // Load menu
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await seedMenuIfNeeded();
        setMenuItems(data);
      } catch (err) {
        console.error('Failed to load menu items:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Add item to cart
  const addToCart = (item: MenuItem) => {
    if (!item.id) return;
    setCart((prevCart) => {
      const existing = prevCart.find((c) => c.id === item.id);
      if (existing) {
        return prevCart.map((c) => (c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [
        ...prevCart,
        {
          id: item.id!,
          name: item.name,
          price: item.price,
          quantity: 1,
          notes: notes[item.id!] || '',
        },
      ];
    });
  };

  // Adjust item quantity
  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prevCart) => {
      const items = prevCart
        .map((c) => {
          if (c.id === itemId) {
            const newQty = c.quantity + delta;
            return { ...c, quantity: newQty };
          }
          return c;
        })
        .filter((c) => c.quantity > 0);
      return items;
    });
  };

  const removeItem = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((c) => c.id !== itemId));
  };

  // Calculate cart metrics
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Submit checkout
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !phone.trim() || cart.length === 0) return;
    if (orderType === 'Delivery' && !address.trim()) return;

    try {
      setOrderSubmitting(true);
      const orderedItems = cart.map(item => ({
        ...item,
        notes: notes[item.id] || ''
      }));

      const newId = await placeOrder({
        customerName,
        phone,
        address: orderType === 'Delivery' ? address : '',
        items: orderedItems,
        orderType,
        totalAmount,
      });

      setRecentOrderId(newId);
      setCart([]);
      setNotes({});
      setCheckoutStep('success');
      if (onOrderPlacedAlert) {
        onOrderPlacedAlert();
      }
    } catch (err) {
      console.error('Error placing order:', err);
      alert('خطأ أثناء إرسال الطلب. يرجى مراجعة لوحة التحكم أو الاتصال بمسؤول النظام.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const displayMenuItems = menuItems.filter((item) => item.category === selectedCategory);

  return (
    <div 
      id="moulana-mobile-viewport-phone" 
      className={
        isFullScreenMode 
          ? "w-full min-h-screen bg-[#F9F7F2] overflow-hidden flex flex-col font-sans relative" 
          : "relative w-full max-w-sm mx-auto h-[680px] bg-[#F9F7F2] border-[8px] border-black rounded-[40px] shadow-2xl overflow-hidden flex flex-col font-sans"
      }
      dir="rtl"
    >
      {/* Phone Notch/Speaker Header - Hide in true fullscreen mode */}
      {!isFullScreenMode && (
        <div className="absolute top-0 inset-x-0 h-5 bg-black flex justify-center items-center z-50 pointer-events-none">
          <div className="w-24 h-3 bg-black rounded-b-lg flex justify-around px-2 items-center text-[8px] text-gray-500">
            <span>9:41</span>
            <div className="w-1.5 h-1.5 bg-zinc-805 rounded-full"></div>
            <div className="flex space-x-0.5" dir="ltr">
              <span className="w-1.5 h-1 bg-zinc-600 rounded-sm"></span>
              <span className="w-1.5 h-1 bg-zinc-600 rounded-sm"></span>
            </div>
          </div>
        </div>
      )}

      {/* Main App Canvas */}
      <div className={`flex-1 flex flex-col overflow-hidden relative ${isFullScreenMode ? 'mt-0' : 'mt-5'}`}>
        {checkoutStep === 'browse' && (
          <>
            {/* Header */}
            <header className="bg-[#141414] text-[#F9F7F2] px-4 py-4 flex justify-between items-center shadow-sm">
              <div className="text-right">
                <h1 className="text-2xl font-serif italic tracking-tight">
                  مطعم مولانا
                </h1>
                <p className="text-[9px] uppercase tracking-widest text-[#D97706] font-bold">المشويات والمأكولات الأصيلة</p>
              </div>
              
              {/* Action buttons: PWA/APK download + Cart */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowInstallModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-[#D97706] font-bold rounded-lg border border-white/5 transition-all cursor-pointer"
                  title="تنزيل تطبيق الجوال للعملاء كـ APK أو PWA مجاناً"
                >
                  <Smartphone size={13} className="text-[#D97706] animate-pulse" />
                  <span className="text-[10px] text-gray-100 hidden xs:inline">تنزيل التطبيق 📲</span>
                  <span className="text-[10px] text-gray-100 xs:hidden">تثبيت 📲</span>
                </button>

                <button
                  id="mobile-view-cart-button"
                  onClick={() => setShowCart(true)}
                  className="relative p-2 bg-[#D97706] text-white rounded-full hover:bg-[#D97706]/80 active:scale-95 transition-all shrink-0"
                >
                  <ShoppingBag size={15} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-black text-[9px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                      {totalItems}
                    </span>
                  )}
                </button>
              </div>
            </header>

            {/* Categories Navigation */}
            <div className="bg-white border-b border-gray-100 py-1.5 px-3 flex space-x-2 overflow-x-auto scrollbar-none shadow-xs shrink-0 justify-around">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 text-[10px] font-bold transition-all border-b-2 ${
                    selectedCategory === cat
                      ? 'border-[#D97706] text-[#D97706]'
                      : 'border-transparent text-gray-400 hover:text-black'
                  }`}
                >
                  {categoryLabels[cat] || cat}
                </button>
              ))}
            </div>

            {/* Menu List */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-48 space-y-2">
                  <div className="w-8 h-8 border-4 border-[#D97706] border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-xs text-slate-500 font-mono">جاري تحميل أطباق مولانا الشهية...</span>
                </div>
              ) : displayMenuItems.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-serif italic">
                  لا توجد أطباق متوفرة في هذا القسم حالياً.
                </div>
              ) : (
                displayMenuItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-sm p-3.5 border border-black/5 shadow-xs flex gap-3.5 hover:border-[#141414] transition-all group"
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-sm bg-gray-50 border border-slate-100 flex-shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="flex-1 flex flex-col justify-between min-w-0 text-right">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h3 className="font-bold text-slate-950 text-sm truncate group-hover:text-[#D97706] transition-colors">
                            {item.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-50">
                        <span className="font-serif italic font-extrabold text-[#D97706] text-sm font-mono">
                          ${item.price.toFixed(2)}
                        </span>
                        
                        {item.availability !== false ? (
                          <button
                            onClick={() => addToCart(item)}
                            className="text-[9px] bg-[#141414] text-white font-bold py-1 px-3 rounded-none flex items-center gap-1 hover:bg-[#D97706] transition-colors cursor-pointer"
                          >
                            <Plus size={10} />
                            إضافة للسلة
                          </button>
                        ) : (
                          <span className="text-[9px] text-gray-400 font-bold uppercase bg-gray-100 px-2 py-0.5 rounded-none">
                            نفذت الكمية
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Cart bar */}
            {totalItems > 0 && (
              <div className="p-3.5 bg-white border-t border-slate-100 shadow-md flex justify-between items-center shrink-0">
                <div className="text-right">
                  <div className="text-[10px] text-slate-500">تم اختيار {totalItems} صنفًا</div>
                  <div className="text-lg font-black text-[#141414] font-mono">${totalAmount.toFixed(2)}</div>
                </div>
                <button
                  onClick={() => setCheckoutStep('checkout')}
                  className="bg-[#D97706] text-[#F9F7F2] px-5 py-2.5 rounded-none text-[10px] font-bold uppercase transition-colors flex items-center gap-1.5"
                >
                  الدفع والطلب <Send size={11} className="-scale-x-100" />
                </button>
              </div>
            )}
          </>
        )}

        {checkoutStep === 'checkout' && (
          <div className="flex-1 flex flex-col bg-white overflow-hidden text-right">
            {/* Checkout Header */}
            <div className="px-4 py-4.5 border-b border-gray-100 flex items-center gap-3 bg-[#F9F7F2]/50">
              <button
                onClick={() => setCheckoutStep('browse')}
                className="p-1.5 hover:bg-gray-200 transition-colors text-slate-800"
              >
                <ArrowLeft size={16} className="-scale-x-100" />
              </button>
              <div>
                <h2 className="font-bold text-[#141414] text-base leading-tight">إتمام الطلب</h2>
                <p className="text-[9px] uppercase tracking-widest text-[#D97706] font-bold">مطبخ وشواية مولانا الأصيلة</p>
              </div>
            </div>

            {/* Checkout Scrollable Content */}
            <form onSubmit={handleCheckoutSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Order Settings Mode */}
              <div className="bg-[#F9F7F2] p-1 border border-black/10 flex">
                <button
                  type="button"
                  onClick={() => setOrderType('Takeaway')}
                  className={`flex-1 py-1.5 rounded-none text-[10px] font-bold transition-all ${
                    orderType === 'Takeaway'
                      ? 'bg-[#141414] text-[#F9F7F2]'
                      : 'text-gray-500 hover:bg-slate-200/50'
                  }`}
                >
                  سفري / استلام
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType('Delivery')}
                  className={`flex-1 py-1.5 rounded-none text-[10px] font-bold transition-all ${
                    orderType === 'Delivery'
                      ? 'bg-[#141414] text-[#F9F7F2]'
                      : 'text-gray-500 hover:bg-slate-200/50'
                  }`}
                >
                  توصيل للمنزل
                </button>
              </div>

              {/* Contacts Input fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">
                    اسم العميل *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="اكتب اسمك الثلاثي الكامل هنا"
                    className="w-full text-xs border border-black/15 rounded-none px-3 py-2.5 focus:border-[#D97706] focus:outline-none bg-[#F9F7F2]/20 font-sans text-right"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 mb-1">
                    رقم الهاتف والاتصال *
                  </label>
                  <div className="relative">
                    <Phone size={12} className="absolute right-3 top-3.5 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="مثال: 05xxxxxxx"
                      className="w-full text-xs border border-black/15 rounded-none pr-9 pl-3 py-2.5 focus:border-[#D97706] focus:outline-none bg-[#F9F7F2]/20 font-sans text-right"
                    />
                  </div>
                </div>

                {orderType === 'Delivery' && (
                  <div>
                    <label className="block text-[9px] font-bold text-slate-500 mb-1">
                      عنوان التوصيل بالتفصيل *
                    </label>
                    <div className="relative">
                      <MapPin size={12} className="absolute right-3 top-3.5 text-slate-400" />
                      <textarea
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="اسم الحي والشارع، رقم العمارة والشقة للمندوب"
                        rows={2}
                        className="w-full text-xs border border-black/15 rounded-none pr-9 pl-3 py-2.5 focus:border-[#D97706] focus:outline-none bg-[#F9F7F2]/20 font-sans text-right"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Items Summary list */}
              <div className="bg-[#F9F7F2] rounded-none p-3.5 border border-black/10">
                <h3 className="text-[10px] font-bold text-slate-800 mb-2 border-b border-dashed border-black/20 pb-1.5 flex justify-between">
                  <span>الأطباق المطلوبة</span>
                  <span className="text-[#D97706] font-extrabold">{cart.length}</span>
                </h3>

                <div className="space-y-2 max-h-40 overflow-y-auto pl-1">
                  {cart.map((item) => (
                    <div key={item.id} className="text-xs flex flex-col pt-1 pb-1">
                      <div className="flex justify-between font-medium text-slate-900">
                        <span>
                          {item.quantity}x {item.name}
                        </span>
                        <span className="font-mono text-[11px]">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      
                      {/* Interactive item notes */}
                      <input
                        type="text"
                        placeholder="أضف أي تعديل خاص (مثلا: بدون بصل، صوص خارجي)"
                        value={notes[item.id] || ''}
                        onChange={(e) => setNotes({ ...notes, [item.id]: e.target.value })}
                        className="text-[10px] mt-1 border-b border-gray-100 italic focus:outline-none focus:border-[#D97706] text-slate-500 bg-transparent py-0.5"
                      />
                    </div>
                  ))}
                </div>

                <div className="border-t border-dashed border-black/20 mt-2.5 pt-2.5 text-xs flex justify-between font-bold text-slate-950">
                  <span>المبلغ الإجمالي المطلـوب:</span>
                  <span className="text-[#D97706] text-sm font-extrabold font-mono">${totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={orderSubmitting}
                className="w-full bg-[#141414] hover:bg-[#D97706] text-white font-bold py-3 px-4 rounded-none text-[10px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-gray-300"
              >
                {orderSubmitting ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    جاري إرسال الطلب للمطبخ...
                  </>
                ) : (
                  <>
                    تأكيد وإرسال الطلب المباشر (${totalAmount.toFixed(2)}) <Check size={12} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {checkoutStep === 'success' && (
          <div className="flex-1 bg-white p-6 flex flex-col justify-center items-center text-center">
            <div className="w-16 h-16 bg-[#F9F7F2] text-[#D97706] rounded-full flex items-center justify-center mb-5 border border-[#D97706] animate-pulse">
              <Check size={32} />
            </div>
            
            <h2 className="text-xl font-bold text-slate-950">تم استلام طلبك بنجاح!</h2>
            <p className="text-xs text-slate-500 mt-1.5 max-w-[240px] leading-relaxed">
              لقد وصل طلبك إلى مطبخ مولانا مباشرة، وسنباشر طهيه وإعداده بأعلى جودة. يرجى إبقاء هاتفك قريباً!
            </p>

            <div className="bg-[#F9F7F2] border border-black/10 rounded-none p-4 my-5 w-full">
              <div className="text-[9px] text-slate-400 font-bold">كود تتبع الطلب الخاص بك</div>
              <div className="text-sm font-semibold text-[#141414] font-mono select-all mt-0.5">
                {recentOrderId.substring(0, 10).toUpperCase()}
              </div>
              <div className="my-1.5 border-t border-black/5 text-[9px] text-[#D97706] font-bold pt-1.5">
                طريقة الاستلام: <span className="text-slate-800 font-bold">{orderType === 'Delivery' ? 'توصيل للمنزل' : 'سفري / استلام من الفرع'}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setCheckoutStep('browse');
                setShowCart(false);
              }}
              className="px-6 py-3 bg-[#141414] hover:bg-[#D97706] text-white rounded-none text-[10px] font-bold transition-colors cursor-pointer"
            >
              طلب مأكولات أخرى
            </button>
          </div>
        )}

        {/* Sliding Cart Panel Screen (Browse Overlay Modal) */}
        {showCart && checkoutStep === 'browse' && (
          <div className="absolute inset-0 bg-[#141414]/50 z-50 flex flex-col justify-end transition-all duration-300">
            <div className="bg-white max-h-[85%] rounded-t-lg flex flex-col overflow-hidden animate-slide-up">
              <div className="px-4 py-3.5 border-b border-black/5 flex justify-between items-center bg-[#F9F7F2]">
                <div className="flex items-center gap-1.5">
                  <ShoppingBag size={14} className="text-[#D97706]" />
                  <span className="font-bold text-[#141414] text-sm">أطباقك المختارة في السلة ({totalItems})</span>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-[10px] font-bold text-slate-400 hover:text-black cursor-pointer"
                >
                  إغلاق
                </button>
              </div>

              {/* Cart List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[150px] text-right">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs font-serif italic">حقيبة المشتريات فارغة!</div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between border-b border-slate-100 pb-2.5 gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 text-xs truncate">{item.name}</div>
                        <div className="text-[10px] text-[#D97706] font-semibold mt-0.5 font-mono">
                          ${item.price.toFixed(2)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2" dir="ltr">
                        <div className="flex items-center border border-black/10 rounded-none overflow-hidden bg-slate-50">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="p-1 text-slate-600 hover:bg-[#F9F7F2] transition-colors cursor-pointer"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="text-xs font-bold text-slate-900 px-2 min-w-[16px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => {
                              const menuObj = menuItems.find((m) => m.id === item.id);
                              if (menuObj) addToCart(menuObj);
                            }}
                            className="p-1 text-slate-600 hover:bg-[#F9F7F2] transition-colors cursor-pointer"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 bg-red-50 text-red-500 rounded-none hover:bg-red-100 hover:text-red-600 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Cart actions block */}
              {cart.length > 0 && (
                <div className="bg-[#F9F7F2] p-4 border-t border-black/5 space-y-3 shrink-0 text-right">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 text-[10px]">المجموع الفرعي:</span>
                    <span className="text-slate-900 font-black text-sm font-mono">${totalAmount.toFixed(2)}</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowCart(false);
                      setCheckoutStep('checkout');
                    }}
                    className="w-full py-3 bg-[#141414] hover:bg-[#D97706] text-white font-bold rounded-none text-[10px] tracking-widest transition-colors cursor-pointer"
                  >
                    متابعة لتحديد خيارات التوصيل
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Install APK/PWA Info Modal (Arabic) */}
      {showInstallModal && (
        <div className="absolute inset-0 bg-black/75 z-55 flex items-center justify-center p-4 animate-fade-in" dir="rtl">
          <div className="bg-white border border-slate-200 w-full max-w-xs rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[95%] text-right font-sans">
            <div className="px-4 py-3 bg-[#111111] text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-1.5">
                <Smartphone size={15} className="text-[#D97706]" />
                <span className="text-xs font-bold font-sans">تثبيت تطبيق مولانا على جوالك</span>
              </div>
              <button 
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-800 leading-relaxed scrollbar-none">
              {/* Native Prompt Installer Trigger if event fired */}
              {deferredPrompt ? (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-center space-y-2">
                  <p className="font-bold text-emerald-900 text-[10.5px]">📲 متاح للتثبيت المباشر بنقرة واحدة!</p>
                  <p className="text-[9.5px] text-emerald-800 leading-normal">
                    بشرى سارة! جهازك يدعم التثبيت المباشر للموقع كأيقونة تطبيق كامل بدون الحاجة لملفات مجهولة المصدر.
                  </p>
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-[11px] rounded-lg tracking-wide shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                  >
                    <Download size={13} />
                    <span>تحميل وتثبيت التطبيق الآن 📲</span>
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 text-amber-950 p-3 rounded-lg text-[10px] space-y-1">
                  <p className="font-bold">💡 تنبيه هام لعملائك وللتجربة:</p>
                  <p>
                    بسبب قيود المتصفحات المدمجة (كالواتساب أو تيليجرام أو داخل المعاينة)، قد لا يظهر زر التثبيت التلقائي باللون الأخضر. للنجاح الكامل، يرجى دائماً فتح الرابط التالي يدوياً في متصفح خارجي (مثل Chrome للاندرويد أو Safari للآيفون) لتنزيل وتثبيت التطبيق بدون معوقات!
                  </p>
                </div>
              )}

              {/* Copy Links first */}
              <div className="bg-[#F9F7F2] p-3 border border-black/10 rounded-lg">
                <p className="font-bold text-[10px] text-slate-500 mb-1">📋رابط النسخة المخصصة لزبائنك:</p>
                <div className="flex gap-1.5 items-center bg-white p-1.5 border border-black/5 rounded">
                  <span className="flex-1 truncate text-[9px] font-mono text-slate-600 select-all" dir="ltr">
                    {window.location.origin}/?view=customer
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin + "/?view=customer");
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="px-2.5 py-1.5 bg-[#D97706] text-white font-extrabold text-[9px] rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    {copiedLink ? "تم النسخ!" : "نسخ الرابط"}
                  </button>
                </div>
              </div>

              {/* Install PWA Option */}
              <div className="space-y-1">
                <h4 className="font-bold text-slate-950 flex items-center gap-1 text-[11px] text-[#D97706]">
                  <span className="w-1.5 h-1.5 bg-[#D97706] rounded-full"></span>
                  الطريقة الموصى بها: التثبيت الفوري كآب (PWA)
                </h4>
                <p className="text-[10.5px] text-slate-600 leading-normal">
                  تتميز تطبيقات الويب التقدمية (PWA) بأنها تمنحك نفس أيقونة وأداء وكفاءة تطبيقات الـ APK تماماً دون الحاجة لتنزيل ملفات خارجية ضخمة أو مواجهة مخاطر أمنية.
                </p>
                <div className="bg-[#F9F7F2] p-3 rounded-lg text-[10px] border border-black/5 space-y-2">
                  <div>
                    <span className="bg-[#D97706]/10 text-[#D97706] px-1.5 py-0.5 rounded text-[9px] font-bold ml-1">أجهزة الآيفون (iOS):</span>
                    افتح الرابط عبر متصفح <strong>Safari</strong>، ثم اضغط على زر المشاركة السفلي <span className="font-extrabold">📤</span> ثم اختر <strong>"إضافة إلى الشاشة الرئيسية (Add to Home Screen)"</strong>.
                  </div>
                  <div className="border-t border-slate-200/60 pt-2">
                    <span className="bg-emerald-100 text-[#059669] px-1.5 py-0.5 rounded text-[9px] font-bold ml-1">أجهزة الأندرويد:</span>
                    افتح الرابط عبر متصفح <strong>Google Chrome</strong>، وستظهر لك لافتة فورية منبثقة بالأسفل تطلب منك تثبيت التطبيق بضغطة واحدة! أو اضغط على النقاط الثلاث بالأعلى واختر <strong>"تثبيت التطبيق"</strong>.
                  </div>
                </div>
              </div>

              {/* Build APK Option */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-950 flex items-center gap-1 text-[11px] text-[#059669]">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  تحويل الرابط إلى ملف APK رسمي للتثبيت المباشر:
                </h4>
                <p className="text-[10.5px] text-slate-600">
                  للحصول على ملف <strong>APK</strong> صلب ونشره على متجر Google Play أو مشاركته يدوياً مع عملائك:
                </p>
                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-500/10 space-y-2 text-[10px] text-slate-700">
                  <p>
                    1. اضغط على الزر بالأعلى لنسخ رابط زبائنك لـ "مطعم مولانا".
                  </p>
                  <p>
                    2. قم بزيارة موقع التحويل الرسمي <a href="https://www.pwabuilder.com" target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline font-extrabold font-mono hover:text-[#D97706]">PWABuilder.com</a> (قم بنسخ الرابط وفتحه يدوياً على المتصفح إن تعذر النقر المباشر بسبب الخصوصية).
                  </p>
                  <p>
                    3. ضع رابط موقعك المنسوخ في خانة البحث بالموقع واضغط على زر البدء <strong>"Start"</strong> لتحميل حزمة الأندرويد <strong>APK</strong> الجاهزة مجاناً وخلال ثوانٍ معدودة!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-150 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-md text-[10px] font-bold cursor-pointer hover:bg-[#D97706] transition-colors"
                id="close-install-modal-btn"
              >
                حسناً، فهمت
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
