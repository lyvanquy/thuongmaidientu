'use client';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Truck, Package, Warehouse, CheckCircle, Loader2, MapPin, Clock } from 'lucide-react';

interface ShipmentTimelineProps {
  orderId: string;
  shipment?: any;
}

const SHIPMENT_STEPS = [
  { key: 'PENDING',    label: 'Chờ lấy hàng',    desc: 'Đơn hàng đang chờ đơn vị vận chuyển',  icon: Package },
  { key: 'PICKED_UP', label: 'Đã lấy hàng',     desc: 'Hàng đã được lấy từ kho',               icon: Warehouse },
  { key: 'IN_TRANSIT',label: 'Đang vận chuyển',  desc: 'Hàng đang trên đường tới bạn',          icon: Truck },
  { key: 'DELIVERED', label: 'Đã giao hàng',     desc: 'Giao hàng thành công',                  icon: CheckCircle },
];

export function ShipmentTimeline({ orderId, shipment }: ShipmentTimelineProps) {
  if (!shipment) return null;

  const currentIdx = SHIPMENT_STEPS.findIndex(s => s.key === shipment.status);

  return (
    <div className="p-5 border-b border-slate-100 bg-gradient-to-b from-cyan-50 to-white">
      <div className="flex items-center gap-2 mb-4">
        <Truck size={18} className="text-cyan-600" />
        <h3 className="text-sm font-bold text-slate-800">Theo dõi vận chuyển</h3>
        <span className="ml-auto text-xs text-slate-500 flex items-center gap-1.5 font-mono bg-slate-100 px-2 py-1 rounded-full">
          <MapPin size={10}/> {shipment.trackingCode}
        </span>
      </div>

      {shipment.carrier && (
        <div className="text-xs text-slate-500 mb-4">
          Vận chuyển bởi: <span className="font-semibold text-slate-700">{shipment.carrier}</span>
          {shipment.estimatedAt && (
            <span className="ml-3 text-slate-400">
              <Clock size={10} className="inline mr-1"/>
              Dự kiến: {new Date(shipment.estimatedAt).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>
      )}

      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200" />
        
        <div className="space-y-6">
          {SHIPMENT_STEPS.map((step, idx) => {
            const done = idx <= currentIdx;
            const active = idx === currentIdx;
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex gap-4 relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 relative z-10 border-2 transition-all duration-300 ${
                  done
                    ? 'bg-cyan-500 border-cyan-500 text-white shadow-md shadow-cyan-100'
                    : 'bg-white border-slate-200 text-slate-300'
                } ${active ? 'ring-4 ring-cyan-100 scale-110' : ''}`}>
                  <Icon size={15} />
                </div>
                <div className={`pt-0.5 ${done ? '' : 'opacity-40'}`}>
                  <p className={`text-sm font-bold ${done ? 'text-slate-900' : 'text-slate-400'}`}>
                    {step.label}
                    {active && <span className="ml-2 text-xs font-medium text-cyan-600 animate-pulse">● Hiện tại</span>}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {shipment.deliveredAt && (
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl p-3">
          <CheckCircle size={16}/>
          <span className="font-semibold">Giao thành công lúc {new Date(shipment.deliveredAt).toLocaleString('vi-VN')}</span>
        </div>
      )}
    </div>
  );
}
