import React, { useRef, useState, useEffect } from 'react';
import { PenTool, RotateCcw, Trash2, Check, X, Palette } from 'lucide-react';
import { uploadFile } from '../services/api';

const COLORS = [
  { name: 'Royal Ink Blue', value: '#0f2b5c' },
  { name: 'Deep Black', value: '#0f172a' },
  { name: 'Official Maroon', value: '#7f1d1d' },
  { name: 'Forest Green', value: '#064e3b' }
];

const STROKE_WIDTHS = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 3.5 },
  { label: 'Bold', value: 5 }
];

export default function SignaturePadModal({
  isOpen,
  onClose,
  onSave,
  title = "Draw Digital Signature",
  signerName = ""
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(COLORS[0].value);
  const [strokeWidth, setStrokeWidth] = useState(3.5);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [history, setHistory] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    if (!isOpen) return;

    // Wait for modal transition/mount
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Clear state
      setHistory([]);
      setHasDrawn(false);
      saveState();
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), snapshot]); // keep up to 10 states
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = strokeWidth;

    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveState();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setHistory([]);
    saveState();
  };

  const handleUndo = () => {
    if (history.length <= 1) {
      handleClear();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const nextHistory = [...history];
    nextHistory.pop(); // Remove current
    const prevState = nextHistory[nextHistory.length - 1];

    ctx.putImageData(prevState, 0, 0);
    setHistory(nextHistory);
    if (nextHistory.length <= 1) {
      setHasDrawn(false);
    }
  };

  // Helper to trim transparent pixels around signature for clean bounds
  const getTrimmedDataUrl = (canvas) => {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const l = pixels.data.length;
    let bound = {
      top: null,
      left: null,
      right: null,
      bottom: null
    };

    for (let i = 0; i < l; i += 4) {
      if (pixels.data[i + 3] > 0) { // non-transparent
        const x = (i / 4) % canvas.width;
        const y = Math.floor((i / 4) / canvas.width);

        if (bound.top === null || y < bound.top) bound.top = y;
        if (bound.left === null || x < bound.left) bound.left = x;
        if (bound.right === null || x > bound.right) bound.right = x;
        if (bound.bottom === null || y > bound.bottom) bound.bottom = y;
      }
    }

    if (bound.top === null) return canvas.toDataURL('image/png'); // Empty

    // Add padding (20px scaled)
    const pad = 24 * dpr;
    const trimX = Math.max(0, bound.left - pad);
    const trimY = Math.max(0, bound.top - pad);
    const trimWidth = Math.min(canvas.width - trimX, (bound.right - bound.left) + pad * 2);
    const trimHeight = Math.min(canvas.height - trimY, (bound.bottom - bound.top) + pad * 2);

    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = trimWidth;
    trimmedCanvas.height = trimHeight;
    const trimmedCtx = trimmedCanvas.getContext('2d');
    trimmedCtx.drawImage(
      canvas,
      trimX, trimY, trimWidth, trimHeight,
      0, 0, trimWidth, trimHeight
    );

    return trimmedCanvas.toDataURL('image/png');
  };

  const handleSave = async () => {
    if (!hasDrawn) {
      alert("Please draw your signature before applying.");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    try {
      const dataUrl = getTrimmedDataUrl(canvas);
      
      // Instantly apply the drawn signature so UI updates immediately
      onSave(dataUrl);
      onClose();

      // Background upload to persist on server
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], `signature-${Date.now()}.png`, { type: 'image/png' });
        await uploadFile(file, 'signature');
      } catch (uploadErr) {
        console.warn("Background upload error (ignorable):", uploadErr);
      }
    } catch (err) {
      console.error("Failed to export signature:", err);
      alert("Could not process signature image.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shadow-sm">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">{title}</h3>
              {signerName && (
                <p className="text-[11px] text-slate-500">Signing as: <span className="font-semibold text-slate-700">{signerName}</span></p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="px-5 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          {/* Ink Color Picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Ink:</span>
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCurrentColor(c.value)}
                title={c.name}
                style={{ backgroundColor: c.value }}
                className={`w-6 h-6 rounded-full transition-transform flex items-center justify-center ${
                  currentColor === c.value ? 'ring-2 ring-offset-1 ring-amber-500 scale-110 shadow-sm' : 'hover:scale-105'
                }`}
              >
                {currentColor === c.value && <Check className="w-3 h-3 text-white stroke-[3]" />}
              </button>
            ))}
          </div>

          {/* Stroke Width Selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            {STROKE_WIDTHS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStrokeWidth(s.value)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-md transition ${
                  strokeWidth === s.value ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Canvas Actions */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length <= 1}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Undo stroke"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={!hasDrawn}
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:pointer-events-none transition"
              title="Clear all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="p-5 bg-slate-50/50">
          <div className="relative border-2 border-dashed border-slate-300 hover:border-slate-400 bg-white rounded-xl shadow-inner overflow-hidden">
            <canvas
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              style={{ touchAction: 'none' }}
              className="w-full h-48 cursor-crosshair block"
            />

            {/* Signature Baseline Guide Line */}
            <div className="absolute inset-x-8 bottom-10 border-b border-slate-200 pointer-events-none flex justify-between items-end pb-1">
              <span className="text-[10px] text-slate-300 uppercase tracking-widest font-mono">Sign on the line</span>
              <span className="text-[10px] text-slate-300 font-mono">✕</span>
            </div>

            {!hasDrawn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-300 gap-1.5">
                <PenTool className="w-6 h-6 stroke-[1.5]" />
                <span className="text-xs font-medium">Use your mouse, finger, or stylus to draw signature</span>
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 text-center">
            Signatures are automatically trimmed and saved with a transparent background.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasDrawn || isSaving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:pointer-events-none transition"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isSaving ? "Applying..." : "Apply Signature"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
