'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/lib/api';
import { Send, Loader2, FileText, Search, User as UserIcon, CheckCircle2, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const { user } = useAuthStore();
  const { socket, isConnected } = useSocket('/chat');
  const router = useRouter();
  
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Danh sách phòng Chat
  useEffect(() => {
    if (!user) return;
    const fetchChats = async () => {
      try {
        const res = await api.get('/chat/my');
        setChats(res.data);
      } catch (e) {
        console.error('Failed to load chats', e);
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, [user]);

  // Handle Socket Events
  useEffect(() => {
    if (!socket || !user) return;

    socket.on('receive_message', (message: any) => {
      // Nếu đang mở khung chat hiện tại
      if (activeChat && message.chatId === activeChat.id) {
        setMessages((prev) => [...prev, message]);
        scrollToBottom();
      }
      
      // Update List
      setChats((prevChats) => {
        const newChats = [...prevChats];
        const chatIndex = newChats.findIndex(c => c.id === message.chatId);
        if (chatIndex > -1) {
          const chat = newChats.splice(chatIndex, 1)[0];
          chat.updatedAt = message.createdAt;
          if (!chat.messages) chat.messages = [];
          chat.messages[0] = message;
          newChats.unshift(chat); // Bring to top
        }
        return newChats;
      });
    });

    return () => {
      socket.off('receive_message');
    };
  }, [socket, activeChat, user]);

  // Load tin nhắn khi chọn Chat room
  useEffect(() => {
    if (activeChat && socket) {
      socket.emit('join_chat', { chatId: activeChat.id });
      
      api.get(`/chat/${activeChat.id}/messages`)
        .then(res => {
          setMessages(res.data.items || []);
          scrollToBottom();
        });
    }
  }, [activeChat, socket]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !user || !socket) return;
    
    socket.emit('send_message', { 
      chatId: activeChat.id, 
      senderId: user.id, 
      content: newMessage 
    });
    setNewMessage('');
  };

  const handleCreateContract = async () => {
    if (!activeChat) return;
    const partner = activeChat.participants?.find((p: any) => p.userId !== user.id)?.user;
    if (!partner?.companyId) {
      alert('Nhà cung cấp chưa có hồ sơ doanh nghiệp hợp lệ để tạo hợp đồng!');
      return;
    }

    if (confirm('Bản điện tử của Hợp đồng sẽ được sinh ra dựa trên RFQ và Cuộc gọi này. Xác nhận tiếp tục?')) {
      try {
        const res = await api.post('/contracts', {
          title: `Hợp đồng thương mại điện tử với ${partner.name}`,
          supplierId: partner.companyId,
          value: 0, // Giá trị rỗng để Supplier vào điền
          currency: 'VND',
        });
        alert('Tạo nháp hợp đồng thành công! Đang chuyển hướng...');
        router.push(`/contracts/${res.data.id}`);
      } catch (error: any) {
        alert(error.response?.data?.message || 'Có lỗi khi tạo hợp đồng.');
      }
    }
  };

  if (!user) return <div className="p-10 text-center">Vui lòng đăng nhập!</div>;

  return (
    <div className="bg-slate-100 h-[calc(100vh-64px)] flex text-sm">
      
      {/* Cột trái: Danh sách Chats */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            Đàm phán <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} title={isConnected ? 'Trực tuyến' : 'Mất kết nối'}></span>
          </h2>
        </div>
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Tìm kiếm đối tác..." className="w-full bg-slate-50 pl-9 pr-4 py-2 rounded-lg outline-none focus:ring-2 focus:ring-primary-500/20 transition-all border border-slate-200" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="p-6 text-center text-slate-400"><Loader2 size={24} className="animate-spin inline" /></div>
          ) : chats.length === 0 ? (
            <div className="p-6 text-center text-slate-400">Bạn chưa có cuộc đàm phán nào.</div>
          ) : (
            chats.map(chat => {
              // Lấy tên đối tác (người khác mình)
              const partner = chat.participants?.find((p: any) => p.userId !== user.id)?.user;
              const lastMessage = chat.messages?.[0];
              const isActive = activeChat?.id === chat.id;

              return (
                <div 
                  key={chat.id} 
                  onClick={() => setActiveChat(chat)}
                  className={`p-4 border-b border-slate-50 flex items-start gap-3 cursor-pointer hover:bg-slate-50 transition ${isActive ? 'bg-primary-50' : ''}`}
                >
                  <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-400">
                    {partner?.avatar ? <img src={partner.avatar} className="w-full h-full rounded-full object-cover" /> : <UserIcon size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-semibold text-slate-800 truncate">{partner?.name || 'Vô danh'}</h4>
                      {lastMessage && <span className="text-[10px] text-slate-400 flex-shrink-0">{new Date(lastMessage.createdAt).HHmm()}</span>}
                    </div>
                    {chat.rfqId && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded leading-none mr-1">RFQ</span>}
                    <p className={`text-xs truncate ${isActive ? 'text-slate-600' : 'text-slate-500'}`}>
                      {lastMessage ? `${lastMessage.senderId === user.id ? 'Bạn: ' : ''}${lastMessage.content}` : 'Bắt đầu cuộc trò chuyện'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Cột phải: Khung Chat */}
      <div className="flex-1 flex flex-col bg-[#f0f2f5] h-full relative">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                  <UserIcon size={20} className="text-slate-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">
                    {activeChat.participants?.find((p: any) => p.userId !== user.id)?.user?.name || 'Chat Room'}
                  </h3>
                  <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full border border-white"></span>
                    Đang hoạt động
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {user.role === 'BUYER' && (
                  <button onClick={handleCreateContract} className="btn-accent !py-2 !px-4 text-xs shadow-none">
                    <FileText size={16} /> Chốt Hợp Đồng
                  </button>
                )}
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeChat.rfqId && (
                <div className="mx-auto bg-amber-50 border border-amber-200 text-amber-800 text-xs py-2 px-4 rounded-lg w-fit text-center">
                  Phòng chat này được tạo từ một Yêu cầu Báo giá (RFQ).
                </div>
              )}
              {messages.map((msg: any) => {
                const isMe = msg.senderId === user.id;
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div 
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm text-sm break-words
                      ${isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-100'}
                    `}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isMe && <CheckCircle2 size={10} className="text-primary-400" />}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="bg-white p-4 border-t border-slate-200 shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2 max-w-4xl mx-auto">
                <textarea 
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="Nhập tin nhắn đàm phán... (Shift + Enter để xuống dòng)"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-1 focus:ring-primary-500 transition-all resize-none max-h-32 min-h-[48px]"
                  rows={1}
                />
                <button type="submit" disabled={!newMessage.trim()} className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl h-[48px] w-[48px] flex flex-shrink-0 items-center justify-center transition disabled:opacity-50">
                  <Send size={20} className="translate-x-[-1px] translate-y-[1px]" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 h-full">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
              <MessageSquare size={40} className="text-slate-300" />
            </div>
            <p>Chọn một cuộc trò chuyện để bắt đầu đàm phán</p>
          </div>
        )}
      </div>

    </div>
  );
}

// Support extension
declare global {
  interface Date {
    HHmm(): string;
  }
}
Date.prototype.HHmm = function() {
  return this.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
