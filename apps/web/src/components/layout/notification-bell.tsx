'use client';
import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, Package, FileText, MessageCircle, Info, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';

const TYPE_ICON: Record<string, any> = {
  ORDER:     { icon: Package,      color: 'text-blue-500',   bg: 'bg-blue-50' },
  CONTRACT:  { icon: FileText,     color: 'text-indigo-500', bg: 'bg-indigo-50' },
  CHAT:      { icon: MessageCircle,color: 'text-green-500',  bg: 'bg-green-50' },
  RFQ:       { icon: FileText,     color: 'text-amber-500',  bg: 'bg-amber-50' },
  INFO:      { icon: Info,         color: 'text-slate-500',  bg: 'bg-slate-50' },
};

export function NotificationBell() {
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/notifications', { params: { limit: 15 } });
      setNotifications(res.data.items || []);
      setUnread(res.data.unreadCount || 0);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000); // Poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(n => n.map(x => ({ ...x, isRead: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x));
      setUnread(u => Math.max(0, u - 1));
    } catch { /* silent */ }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}
        className="btn-ghost relative p-2 rounded-xl hover:bg-slate-100"
      >
        <Bell size={20} className={unread > 0 ? 'text-primary-700' : 'text-slate-600'} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 animate-pulse">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="font-bold text-slate-800 text-sm">
              Thông báo {unread > 0 && <span className="text-red-500">({unread} mới)</span>}
            </h3>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary-600 hover:underline font-semibold flex items-center gap-1">
                <CheckCheck size={13} /> Đọc tất cả
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center"><Loader2 className="animate-spin inline text-slate-400" /></div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Bell size={32} className="mx-auto mb-2 text-slate-200" />
                <p className="text-sm">Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map(n => {
                const typeConfig = TYPE_ICON[n.type] || TYPE_ICON.INFO;
                const IconComp = typeConfig.icon;
                return (
                  <div
                    key={n.id}
                    onClick={() => { markRead(n.id); if (n.link) setOpen(false); }}
                    className={`flex gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors ${!n.isRead ? 'bg-primary-50/50' : ''}`}
                  >
                    <div className={`w-9 h-9 rounded-xl ${typeConfig.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <IconComp size={16} className={typeConfig.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        {n.link ? (
                          <Link href={n.link} className="text-sm font-semibold text-slate-800 hover:text-primary-700 leading-tight">
                            {n.title}
                          </Link>
                        ) : (
                          <p className="text-sm font-semibold text-slate-800 leading-tight">{n.title}</p>
                        )}
                        {!n.isRead && <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0 mt-1" />}
                      </div>
                      {n.body && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>}
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-100 p-2">
              <Link href="/notifications" onClick={() => setOpen(false)} className="block w-full text-center text-xs text-primary-600 font-semibold py-1.5 hover:bg-primary-50 rounded-lg transition-colors">
                Xem tất cả thông báo →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
