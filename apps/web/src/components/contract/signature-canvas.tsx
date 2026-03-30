'use client';
import { useRef, useEffect, useState } from 'react';
import { Trash2, Check } from 'lucide-react';

interface SignatureCanvasProps {
  onConfirm: (signatureBase64: string) => void;
  onCancel: () => void;
  signerName: string;
}

export function SignatureCanvas({ onConfirm, onCancel, signerName }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    setHasDrawn(true);
    setLastPos(getPos(e));
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setLastPos(pos);
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current!;
    const dataUrl = canvas.toDataURL('image/png');
    onConfirm(dataUrl);
  };

  return (
    <div className="space-y-4">
      <div className="text-center text-sm text-slate-600">
        Xin chào <strong>{signerName}</strong>, vui lòng ký tên vào khung bên dưới
      </div>

      <div className="border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-slate-50 relative hover:border-primary-400 transition-colors">
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-sm select-none">
            ✍️ Ký tên vào đây...
          </div>
        )}
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          className="w-full cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      <div className="border-t border-slate-100 pt-3">
        <p className="text-xs text-slate-500 text-center italic mb-3">
          Bằng cách ký tên, bạn đồng ý với toàn bộ điều khoản được nêu trong hợp đồng và cam kết thực hiện nghĩa vụ theo pháp luật.
        </p>
      </div>

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 btn-ghost border border-slate-200">
          Hủy bỏ
        </button>
        <button onClick={clearCanvas} className="btn-ghost border border-slate-200 px-4" title="Xóa và vẽ lại">
          <Trash2 size={16} />
        </button>
        <button
          onClick={handleConfirm}
          disabled={!hasDrawn}
          className="flex-1 btn-primary disabled:opacity-40 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
        >
          <Check size={16} /> Xác nhận chữ ký
        </button>
      </div>
    </div>
  );
}
