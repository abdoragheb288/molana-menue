/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { MobileApp } from './components/MobileApp';
import { AdminDashboard } from './components/AdminDashboard';
import { ThermalReceipt } from './components/ThermalReceipt';
import { Order } from './types';
import { Smartphone, LayoutDashboard, Sparkles, Receipt, Volume2, Printer, X, Copy, Check, ExternalLink, AlertTriangle } from 'lucide-react';

export default function App() {
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  
  // URL only mode detectors
  const [isCustomerUrlOnly, setIsCustomerUrlOnly] = useState<boolean>(false);
  const [isAdminUrlOnly, setIsAdminUrlOnly] = useState<boolean>(false);
  const [copiedCustomerLink, setCopiedCustomerLink] = useState<boolean>(false);
  const [copiedAdminLink, setCopiedAdminLink] = useState<boolean>(false);
  
  // Responsive mode split or single layout for small viewports
  const [viewMode, setViewMode] = useState<'both' | 'customer' | 'admin'>('both');

  // Alarm Chime Token (triggers audio beep on Admin component when new orders arrive)
  const [chimeToken, setChimeToken] = useState<number>(0);

  // Adjust viewMode based on viewport size or URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    
    if (viewParam === 'customer') {
      setIsCustomerUrlOnly(true);
      setViewMode('customer');
    } else if (viewParam === 'admin') {
      setIsAdminUrlOnly(true);
      setViewMode('admin');
    } else {
      const handleResize = () => {
        if (window.innerWidth < 1280) {
          setViewMode('customer');
        } else {
          setViewMode('both');
        }
      };
      window.addEventListener('resize', handleResize);
      handleResize(); // trigger on mount
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Frame print pipeline triggers
  const handlePrintRequest = (order: Order) => {
    setSelectedPrintOrder(order);
    setCopied(false);
  };

  const executeSystemPrint = () => {
    try {
      window.print();
    } catch (e) {
      console.warn("Direct Printing error", e);
    }
  };

  const copyPlaintextReceipt = (order: Order) => {
    const dateStr = order.createdAt 
      ? (order.createdAt.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString('ar-EG') : new Date(order.createdAt).toLocaleString('ar-EG'))
      : new Date().toLocaleString('ar-EG');
      
    const lines = [
      "========================================\n",
      "               مطعم مولانا\n",
      "      المذاق الأصيل والجودة العالية\n",
      "        هاتف: +1 (555) 019-2453\n",
      "========================================\n",
      `*** ${order.orderType === 'Delivery' ? 'طلب توصيل للمنزل' : 'طلب سفري / استلام'} ***\n`,
      "----------------------------------------\n",
      `رقم الطلب: ${order.id?.substring(0, 8).toUpperCase() || 'جديد'}\n`,
      `التاريخ:   ${dateStr}\n`,
      `العميل:    ${order.customerName}\n`,
      `الهاتف:    ${order.phone}\n`,
    ];
    
    if (order.orderType === 'Delivery' && order.address) {
      lines.push(`العنوان:   ${order.address}\n`);
    }
    
    lines.push(
      "----------------------------------------\n",
      "الكمية   اسم الصنف                    السعر\n",
      "----------------------------------------\n"
    );
    
    order.items.forEach(item => {
      const itemTotal = (item.price * item.quantity).toFixed(2);
      const qtyStr = `${item.quantity}x `.padEnd(6);
      const nameStr = item.name.substring(0, 22).padEnd(23);
      const priceStr = `$${itemTotal}`.padStart(11);
      lines.push(`${qtyStr}${nameStr}${priceStr}\n`);
      if (item.notes) {
        lines.push(`     * ملاحظة: ${item.notes}\n`);
      }
    });
    
    lines.push(
      "----------------------------------------\n",
      `المجموع الفرعي:             $${order.totalAmount.toFixed(2).padStart(13)}\n`,
      "الضريبة (0%):                     $0.00\n",
      "----------------------------------------\n",
      `المبلغ المطلوب:             $${order.totalAmount.toFixed(2).padStart(13)}\n`,
      "----------------------------------------\n",
      "       *** شكراً لزيارتكم وطلبكم ***\n",
      "========================================\n"
    );
    
    const text = lines.join("");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  const handleManualCustomerPlaced = () => {
    // Increment chimeToken immediately for instant feedback
    setChimeToken((t) => t + 1);
  };

  if (isCustomerUrlOnly) {
    return (
      <div className="min-h-screen bg-[#F9F7F2] antialiased text-[#1A1A1A] flex flex-col" dir="rtl">
        <MobileApp onOrderPlacedAlert={handleManualCustomerPlaced} isFullScreenMode={true} />
      </div>
    );
  }

  if (isAdminUrlOnly) {
    return (
      <div className="min-h-screen bg-[#F9F7F2] antialiased text-[#1A1A1A] flex flex-col" dir="rtl">
        <main className="flex-1 flex overflow-hidden p-0 bg-white">
          <AdminDashboard
            onPrintRequest={handlePrintRequest}
            shouldPlayChimeToken={chimeToken}
          />
        </main>
        
        {/* Dynamic Print Zone (Shown ONLY on print, invisible on screen) */}
        <ThermalReceipt order={selectedPrintOrder} />

        {/* Screen Interactive Receipt Preview Modal */}
        {selectedPrintOrder && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden animate-fade-in" dir="rtl">
            <div className="bg-[#141414] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
              {/* Header */}
              <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center bg-[#1F1F1F]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-white text-xs uppercase font-extrabold font-mono text-right">معاينة الإيصال الحراري للفاتورة</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedPrintOrder(null)}
                  className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1"
                  title="إغلاق المعاينة"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Simulated Receipt Slot Container */}
              <div className="p-6 flex-1 overflow-y-auto max-h-[420px] bg-[#1C1C1E] flex flex-col items-center">
                {/* Receipt Slot Gap Graphic */}
                <div className="w-[280px] h-3 bg-black/40 rounded-t-lg border-b border-[#2C2C2E] shadow-inner mb-4 flex items-center justify-center">
                  <div className="w-[260px] h-0.5 bg-zinc-800" />
                </div>

                {/* The Paper Strip */}
                <div className="w-[280px] bg-white text-black p-5 shadow-lg select-text font-mono text-[10px] space-y-3 leading-relaxed relative border-b-4 border-dashed border-zinc-300">
                  <div className="text-center bg-white">
                    <h4 className="text-base font-bold tracking-widest uppercase">مطعم مولانا</h4>
                    <p className="text-[9px] text-zinc-500 mt-1">المذاق الأصيل والجودة العالية</p>
                    <p className="text-[8px] text-zinc-500 font-sans">هاتف: +1 (555) 019-2453</p>
                  </div>

                  <div className="border-t border-b border-dashed border-zinc-400 py-1.5 text-[9px] space-y-0.5">
                    <p className="font-extrabold text-[#D97706] text-center text-xs">
                      *** {selectedPrintOrder.orderType === 'Delivery' ? 'طلب توصيل للمنزل' : 'طلب سفري / استلام'} ***
                    </p>
                    <div className="border-t border-zinc-200 my-1"></div>
                    <p><strong>رقم الطلب:</strong> {selectedPrintOrder.id?.substring(0, 8).toUpperCase() || 'جديد'}</p>
                    <p><strong>التاريخ:</strong> {selectedPrintOrder.createdAt ? (selectedPrintOrder.createdAt.seconds ? new Date(selectedPrintOrder.createdAt.seconds * 1000).toLocaleString('ar-EG') : new Date(selectedPrintOrder.createdAt).toLocaleString('ar-EG')) : new Date().toLocaleString('ar-EG')}</p>
                    <p><strong>العميل:</strong> {selectedPrintOrder.customerName}</p>
                    <p><strong>الهاتف:</strong> {selectedPrintOrder.phone}</p>
                    {selectedPrintOrder.orderType === 'Delivery' && selectedPrintOrder.address && (
                      <p><strong>العنوان:</strong> {selectedPrintOrder.address}</p>
                    )}
                  </div>

                  {/* Items list */}
                  <table className="w-full text-right text-[9px]">
                    <thead>
                      <tr className="border-b border-zinc-300">
                        <th className="pb-1 text-right">الصنف</th>
                        <th className="pb-1 text-center font-sans">الكمية</th>
                        <th className="pb-1 text-left">السعر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPrintOrder.items.map((it, idx) => (
                        <tr key={idx} className="border-b border-zinc-100 last:border-0">
                          <td className="py-1">
                            <div>{it.name}</div>
                            {it.notes && <div className="text-[8px] text-zinc-500 italic">* ملاحظة: {it.notes}</div>}
                          </td>
                          <td className="py-1 text-center font-sans">{it.quantity}x</td>
                          <td className="py-1 text-left font-sans">${(it.price * it.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="border-t border-zinc-300 pt-2 text-[9px] space-y-1">
                    <div className="flex justify-between">
                      <span>المجموع الفرعي:</span>
                      <span className="font-sans">${selectedPrintOrder.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>الضريبة (0%):</span>
                      <span className="font-sans">$0.00</span>
                    </div>
                    <div className="flex justify-between text-xs font-extrabold border-t border-dashed border-zinc-300 pt-1">
                      <span>المبلغ الإجمالي المطلـوب:</span>
                      <span className="font-sans text-[#D97706]">${selectedPrintOrder.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-center text-[8px] text-zinc-500 pt-2 border-t border-zinc-200">
                    شكراً لطلبكم من مطعم مولانا الأصيل!
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-[#1F1F1F] border-t border-white/10 flex flex-col xs:flex-row gap-2">
                <button
                  type="button"
                  onClick={executeSystemPrint}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white font-extrabold py-3 border border-amber-600 rounded-xl text-xs transition-all cursor-pointer"
                >
                  <Printer size={14} />
                  <span>بدء طباعة الآن 🖨️</span>
                </button>
                <button
                  type="button"
                  onClick={() => copyPlaintextReceipt(selectedPrintOrder)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-750 text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copied ? "تم نسخ النص!" : "نسخ نص الإيصال 📋"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F2] flex flex-col antialiased select-none print:bg-white print:min-h-0 text-[#1A1A1A]" dir="rtl">
      
      {/* Visual Workspace Bar (Ignored during print) */}
      <nav className="bg-[#141414] border-b border-[#141414] px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0 print:hidden shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#D97706] rounded-lg flex items-center justify-center text-white">
            <Sparkles size={16} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif italic text-xl text-white tracking-tight">شبكة مطعم مولانا المزامنة</span>
              <span className="text-[8px] bg-[#D97706]/25 border border-[#D97706]/40 text-gray-200 font-extrabold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider animate-pulse">
                ● مزامنة فورية
              </span>
            </div>
            <p className="text-[10px] text-gray-405 leading-none text-right">محاكاة متزامنة حية لتطبيق العميل ولوحة إدارة المطبخ والطلبات</p>
          </div>
        </div>

        {/* Workspace Display View Toggles */}
        <div className="flex items-center gap-3">
          {/* Extremely prominent Open in New Tab Button */}
          <a
            href={window.location.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-white font-extrabold px-3.5 py-2 rounded-xl text-xs transition-all shadow-lg hover:shadow-emerald-900/40 border border-emerald-500/30 tracking-tight animate-bounce"
            title="افتح التطبيق في صفحة كاملة ومستقلة لتفعيل خيار الطباعة وتخطي قيود حماية المتصفح"
          >
            <ExternalLink size={14} className="-scale-x-100" />
            <span>فتح نافذة الطباعة الكاملة ↗</span>
          </a>

          {/* Quick instructions indicator */}
          <div className="hidden xl:flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] text-gray-300 font-medium">
            <Volume2 size={12} className="text-[#D97706]" />
            <span>تحديث فوري: قم بإجراء طلب من محاكي الهاتف وسينعكس في لوحة المطبخ فوراً!</span>
          </div>

          <div className="xl:hidden flex bg-[#1A1A1A] border border-[#F9F7F2]/10 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('customer')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all ${
                viewMode === 'customer'
                  ? 'bg-[#D97706] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Smartphone size={13} /> تطبيق الزبون
            </button>
            <button
              onClick={() => setViewMode('admin')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all ${
                viewMode === 'admin'
                  ? 'bg-[#D97706] text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutDashboard size={13} /> إدارة المطبخ
            </button>
          </div>
        </div>
      </nav>

      {/* Quick standalone share links section */}
      <div className="bg-[#1F1F1F] text-gray-300 border-b border-[#2C2C2E] px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs shrink-0 print:hidden font-sans">
        <div className="flex items-center gap-1.5 text-[#D97706] font-bold">
          <Smartphone size={13} />
          <span>روابط الوصول المباشر للأجهزة والأجهزة اللوحية (للزبائن والمطبخ):</span>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center justify-end">
          <div className="flex items-center gap-1.5 bg-black/30 border border-white/5 py-1 px-2.5 rounded-lg">
            <span className="text-[10px] text-gray-400">رابط الزبون (المطبّق على الجوال):</span>
            <button
              type="button"
              onClick={() => {
                const linkStr = window.location.origin + "/?view=customer";
                navigator.clipboard.writeText(linkStr);
                setCopiedCustomerLink(true);
                setTimeout(() => setCopiedCustomerLink(false), 2000);
              }}
              className="flex items-center gap-1 text-[10px] text-[#D97706] font-bold hover:underline cursor-pointer bg-transparent border-0"
            >
              {copiedCustomerLink ? "تم نسخ الرابط!" : "نسخ الرابط 📋"}
            </button>
            <a
              href="/?view=customer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white"
              title="عرض تجربة الزبون المستقلة الكاملة"
            >
              <ExternalLink size={11} />
            </a>
          </div>

          <div className="flex items-center gap-1.5 bg-black/30 border border-white/5 py-1 px-2.5 rounded-lg">
            <span className="text-[10px] text-gray-400">شاشة المطبخ (للتابلت والمطعم):</span>
            <button
              type="button"
              onClick={() => {
                const linkStr = window.location.origin + "/?view=admin";
                navigator.clipboard.writeText(linkStr);
                setCopiedAdminLink(true);
                setTimeout(() => setCopiedAdminLink(false), 2000);
              }}
              className="flex items-center gap-1 text-[10px] text-[#D97706] font-bold hover:underline cursor-pointer bg-transparent border-0"
            >
              {copiedAdminLink ? "تم نسخ الرابط!" : "نسخ الرابط 📋"}
            </button>
            <a
              href="/?view=admin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white"
              title="عرض شاشة المطبخ الكاملة للتابلت"
            >
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>

      {/* Main Dual-Column Canvas container (Ignored during print) */}
      <main className="flex-1 flex overflow-hidden p-4 sm:p-6 print:hidden print:p-0">
        <div className="w-full max-w-7.5xl mx-auto flex flex-col xl:flex-row-reverse gap-6 h-full items-stretch">
          
          {/* Column A: Interactive Smartphone Simulator Viewport */}
          {(viewMode === 'both' || viewMode === 'customer') && (
            <div className="flex-1 xl:w-[410px] xl:max-w-[410px] flex flex-col justify-center items-center bg-white/20 p-4 border border-[#141414]/10 rounded-[44px] shrink-0">
              <div className="text-center mb-3">
                <span className="text-[10px] text-[#D97706] font-bold uppercase tracking-[0.15em] font-sans">محاكي الزبون</span>
                <h3 className="text-sm font-serif italic text-[#1A1A1A] leading-tight">تطبيق ويب للهواتف الذكية</h3>
              </div>
              <MobileApp onOrderPlacedAlert={handleManualCustomerPlaced} />
            </div>
          )}

          {/* Column B: Full Desktop Operations Admin Dashboard */}
          {(viewMode === 'both' || viewMode === 'admin') && (
            <div className="flex-1 flex flex-col border border-[#141414]/10 rounded-[32px] overflow-hidden bg-white shadow-sm min-w-0">
              <AdminDashboard
                onPrintRequest={handlePrintRequest}
                shouldPlayChimeToken={chimeToken}
              />
            </div>
          )}

        </div>
      </main>

      {/* Dynamic Print Zone (Shown ONLY on print, invisible on screen) */}
      <ThermalReceipt order={selectedPrintOrder} />

      {/* Screen Interactive Receipt Preview Modal */}
      {selectedPrintOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden animate-fade-in" dir="rtl">
          <div className="bg-[#141414] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center bg-[#1F1F1F]">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-white text-xs uppercase font-extrabold font-mono text-right">معاينة الإيصال الحراري للفاتورة</span>
              </div>
              <button 
                onClick={() => setSelectedPrintOrder(null)}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer p-1"
                title="إغلاق المعاينة"
              >
                <X size={16} />
              </button>
            </div>

            {/* Simulated Receipt Slot Container */}
            <div className="p-6 flex-1 overflow-y-auto max-h-[420px] bg-[#1C1C1E] flex flex-col items-center">
              {/* Receipt Slot Gap Graphic */}
              <div className="w-[280px] h-3 bg-black/40 rounded-t-lg border-b border-[#2C2C2E] shadow-inner mb-4 flex items-center justify-center">
                <div className="w-[260px] h-0.5 bg-zinc-800" />
              </div>

              {/* The Paper Strip */}
              <div className="w-[280px] bg-white text-black p-5 shadow-lg select-text font-mono text-[10px] space-y-3 leading-relaxed relative border-b-4 border-dashed border-zinc-300">
                <div className="text-center">
                  <h4 className="text-base font-bold tracking-widest uppercase">مطعم مولانا</h4>
                  <p className="text-[8px] opacity-75 mt-0.5">المذاق الأصيل والجودة العالية</p>
                  <p className="text-[8px] opacity-75">هاتف: +1 (555) 019-2453</p>
                  <div className="my-2 border-t border-dashed border-black" />
                  <h5 className="text-[10px] font-bold">
                    *** {selectedPrintOrder.orderType === 'Delivery' ? 'طلب توصيل للمنزل' : 'استلام من الفرع'} ***
                  </h5>
                  <div className="my-2 border-t border-dashed border-black" />
                </div>

                <div className="space-y-0.5 text-right text-[8px]" dir="rtl">
                  <div><strong>رقم الطلب:</strong> {selectedPrintOrder.id?.substring(0, 8).toUpperCase() || 'جديد'}</div>
                  <div><strong>التاريخ:</strong> {selectedPrintOrder.createdAt ? (selectedPrintOrder.createdAt.seconds ? new Date(selectedPrintOrder.createdAt.seconds * 1000).toLocaleString('ar-EG') : new Date(selectedPrintOrder.createdAt).toLocaleString('ar-EG')) : new Date().toLocaleString('ar-EG')}</div>
                  <div><strong>العميل:</strong> {selectedPrintOrder.customerName}</div>
                  <div><strong>الهاتف:</strong> {selectedPrintOrder.phone}</div>
                  {selectedPrintOrder.orderType === 'Delivery' && selectedPrintOrder.address && (
                    <div className="mt-1">
                      <strong>عنوان التوصيل:</strong> {selectedPrintOrder.address}
                    </div>
                  )}
                </div>

                <div className="my-2 border-t border-dashed border-black" />

                {/* Items grid */}
                <div className="space-y-1.5 text-[8px]">
                  <div className="flex font-bold pb-0.5">
                    <span className="w-10 text-right">الكمية</span>
                    <span className="flex-1 text-right">المنتج</span>
                    <span className="w-16 text-left">السعر</span>
                  </div>
                  {selectedPrintOrder.items.map((item, idx) => (
                    <div key={idx} className="flex leading-tight text-right">
                      <span className="w-10 text-right">{item.quantity}x</span>
                      <span className="flex-1 text-right">{item.name}</span>
                      <span className="w-16 text-left">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="my-2 border-t border-dashed border-black" />

                <div className="space-y-0.5 text-[8px] text-left">
                  <div className="flex justify-between direction-rtl" dir="rtl">
                    <span>المجموع الفرعي:</span>
                    <span>${selectedPrintOrder.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold direction-rtl" dir="rtl">
                    <span>المبلغ المطلوب:</span>
                    <span>${selectedPrintOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="my-2 border-t border-dashed border-black" />
                <div className="text-center text-[8px] space-y-0.5 opacity-85">
                  <p className="font-bold">*** شكراً لزيارتكم وطلبكم ***</p>
                  <p>استمتعوا بالوجبات اللذيذة والأصيلة من مطعم مولانا.</p>
                </div>
              </div>
            </div>

            {/* Interaction Layer */}
            <div className="p-5 bg-[#1C1C1E] border-t border-white/10 space-y-3 shrink-0 text-right">
              <div className="flex gap-2">
                <button
                  onClick={executeSystemPrint}
                  className="flex-1 bg-[#D97706] hover:bg-[#F59E0B] text-white py-2.5 px-4 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer size={13} />
                  <span>طباعة الفاتورة</span>
                </button>

                <button
                  onClick={() => copyPlaintextReceipt(selectedPrintOrder)}
                  className="bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 py-2.5 px-4 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="نسخ نص الإيصال منسقاً مفرداً إلى الحافظة"
                >
                  {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span>{copied ? 'تم النسخ!' : 'نسخ النص'}</span>
                </button>
              </div>

              {/* Helpful sandbox warning notice */}
              <div className="bg-[#1F1F1F] border border-[#D97706]/30 p-4 rounded-xl text-[10px] text-gray-300 space-y-3.5 text-right">
                <div className="flex items-center gap-2 text-yellow-500 font-extrabold">
                  <AlertTriangle size={15} className="text-[#D97706] shrink-0 animate-pulse" />
                  <span>حل مشكلة تعطل الطباعة الافتراضية بمتصفحك:</span>
                </div>
                
                <p className="leading-relaxed text-gray-300">
                  تحظر متصفحات كروم وسفاري الطباعة المباشرة من داخل نوافذ المعاينة المصغرة للبرمجة (iframe).
                  ولحل هذه المشكلة بنجاح والبدء بطباعة الفواتير على جهازك:
                </p>

                <div className="p-1">
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#10B981] hover:bg-[#059669] text-white font-black py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all border border-emerald-500/40 shadow-xl shadow-emerald-950/50 hover:scale-[1.02]"
                  >
                    <ExternalLink size={14} className="-scale-x-100" />
                    <span>اضغط هنا لفتح التطبيق في صفحة كاملة والطباعة فوراً ↗</span>
                  </a>
                </div>

                <p className="text-[9px] text-[#A1A1AA] leading-relaxed italic">
                  * سيتم فتح التطبيق بصفحة كاملة مطابقة تماماً، يمكنك تصفح طلبات المطبخ والضغط على طباعة لتشغيل الطابعة والورق الحراري بنجاح!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
