import React, { useState, useRef } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useWhiteboard } from '@/hooks/useWhiteboard';
import { ImageElement } from '@/types/whiteboard';
import { Crop, Upload, Check } from 'lucide-react';

export interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({ isOpen, onClose }) => {
  const { addElement, scale, stagePos, setTool } = useWhiteboard();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [aspectMode, setAspectMode] = useState<'free' | '1:1' | '16:9' | '4:3'>('free');
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        setNaturalSize({ width: img.width, height: img.height });
        setImageSrc(src);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleInsert = () => {
    if (!imageSrc) return;

    let targetWidth = Math.min(380, naturalSize.width || 380);
    let targetHeight = (targetWidth / (naturalSize.width || 1)) * (naturalSize.height || 1);

    if (aspectMode === '1:1') {
      const side = Math.min(targetWidth, targetHeight);
      targetWidth = side;
      targetHeight = side;
    } else if (aspectMode === '16:9') {
      targetHeight = (targetWidth * 9) / 16;
    } else if (aspectMode === '4:3') {
      targetHeight = (targetWidth * 3) / 4;
    }

    const centerX = (window.innerWidth / 2 - stagePos.x) / scale - targetWidth / 2;
    const centerY = (window.innerHeight / 2 - stagePos.y) / scale - targetHeight / 2;

    const newImage: ImageElement = {
      id: 'img_' + Math.random().toString(36).substring(2, 9),
      type: 'image',
      src: imageSrc,
      x: Math.max(20, centerX),
      y: Math.max(20, centerY),
      width: targetWidth,
      height: targetHeight,
      naturalWidth: naturalSize.width,
      naturalHeight: naturalSize.height,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addElement(newImage);
    setTool('select');
    setImageSrc(null);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Image Insertion & Aspect Ratio Crop"
      description="Upload and frame diagrams, graphs, and textbook figures for the canvas."
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pt-1 text-slate-100">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {!imageSrc ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-[#0c1017] hover:border-lime-400 hover:bg-[#12161f] transition-all"
          >
            <div className="p-3 rounded-2xl bg-lime-500/10 border border-lime-500/20 text-lime-400 mb-2">
              <Upload className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold text-white">Choose Image File</p>
            <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, WEBP, SVG</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Image Preview Box */}
            <div className="h-48 w-full rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden p-2 relative">
              <img
                src={imageSrc}
                alt="Preview"
                className={`max-h-full max-w-full object-contain rounded-lg transition-all ${
                  aspectMode === '1:1' ? 'aspect-square' : aspectMode === '16:9' ? 'aspect-video' : ''
                }`}
              />
            </div>

            {/* Aspect Ratio Framing */}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
                <Crop className="h-3 w-3 text-lime-400" />
                <span>Framing Ratio</span>
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'free' as const, label: 'Natural' },
                  { id: '1:1' as const, label: '1:1 Square' },
                  { id: '16:9' as const, label: '16:9 Wide' },
                  { id: '4:3' as const, label: '4:3 Standard' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setAspectMode(m.id)}
                    className={`py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                      aspectMode === m.id
                        ? 'bg-lime-500/10 border-lime-400 text-lime-300'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleInsert}
              className="w-full text-xs bg-lime-500 text-slate-950 font-bold hover:bg-lime-400"
            >
              <Check className="mr-1.5 h-3.5 w-3.5" />
              Insert onto Whiteboard
            </Button>
          </div>
        )}

        <div className="pt-1 flex justify-end border-t border-slate-800">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
