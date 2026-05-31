/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Order } from '../types';

interface ThermalReceiptProps {
  order: Order | null;
}

export function ThermalReceipt({ order }: ThermalReceiptProps) {
  if (!order) return null;

  // Format date helper
  const formatOrderDate = (timestamp: any) => {
    if (!timestamp) return new Date().toLocaleString('ar-EG');
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleString('ar-EG');
  };

  return (
    <div id="thermal-receipt-print-zone" className="hidden print:block" dir="rtl">
      <div className="text-center font-mono">
        <h1 className="text-xl font-bold tracking-widest">مطعم مولانا</h1>
        <p className="text-[10px] mt-0.5">المذاق الأصيل والجودة العالية</p>
        <p className="text-[9px]">هاتف: +1 (555) 019-2453</p>
        
        <div className="my-2 border-t border-dashed border-black"></div>
        
        <h2 className="text-xs font-bold tracking-wide">
          *** {order.orderType === 'Delivery' ? 'طلب توصيل للمنزل' : 'طلب سفري / استلام'} ***
        </h2>
        
        <div className="my-2 border-t border-dashed border-black"></div>
        
        <div className="text-right text-[9px] space-y-0.5">
          <div><strong className="font-bold">رقم الطلب:</strong> {order.id?.substring(0, 8).toUpperCase() || 'جديد'}</div>
          <div><strong className="font-bold">التاريخ:</strong> {formatOrderDate(order.createdAt)}</div>
          <div><strong className="font-bold">العميل:</strong> {order.customerName}</div>
          <div><strong className="font-bold">الهاتف:</strong> {order.phone}</div>
          {order.orderType === 'Delivery' && (
            <div className="mt-1 leading-tight text-right">
              <strong className="font-bold">عنوان التوصيل:</strong>
              <div className="pr-2 mt-0.5 italic">{order.address}</div>
            </div>
          )}
        </div>
        
        <div className="my-2 border-t border-dashed border-black"></div>
        
        {/* Table Header */}
        <div className="flex font-bold text-[9px] text-right pb-1">
          <span className="w-12">الكمية</span>
          <span className="flex-1 text-right">المنتج</span>
          <span className="w-20 text-left">السعر</span>
        </div>
        
        <div className="border-b border-dashed border-black mb-1"></div>
        
        {/* Items */}
        <div className="space-y-1.5 text-[9px]">
          {order.items.map((item, idx) => (
            <div key={idx}>
              <div className="flex text-right items-start">
                <span className="w-12">{item.quantity}x</span>
                <span className="flex-1 text-right font-medium">{item.name}</span>
                <span className="w-20 text-left">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
              {item.notes && (
                <div className="text-right text-[8px] pr-12 text-gray-700 italic">
                  * ملاحظة: {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="my-2 border-t border-dashed border-black flex flex-col pt-1 space-y-0.5 text-left font-medium text-[9px]">
          <div className="flex justify-between direction-rtl" dir="rtl">
            <span>المجموع الفرعي:</span>
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between direction-rtl" dir="rtl">
            <span>الضريبة (0%):</span>
            <span>$0.00</span>
          </div>
          <div className="flex justify-between text-xs font-extrabold border-t border-dashed border-black pt-1 mt-1 direction-rtl" dir="rtl">
            <span>المبلغ المطلوب:</span>
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div className="my-3 border-t border-dashed border-black"></div>
        
        <div className="text-center text-[10px] space-y-1">
          <p className="font-extrabold">*** شكراً لزيارتكم وطاب يومكم ***</p>
          <p className="text-[8px]">استمتع بوجباتك الشهية والأصيلة من مطعم مولانا.</p>
          <p className="text-[8px]">يسعدنا دائماً خدمتكم وطلبكم في المرة القادمة!</p>
        </div>
      </div>
    </div>
  );
}
