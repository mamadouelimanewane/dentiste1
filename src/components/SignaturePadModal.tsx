"use client";

import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { X, Check, RotateCcw, PenTool } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (base64Signature: string) => void;
  title?: string;
  subtitle?: string;
}

export function SignaturePadModal({ isOpen, onClose, onSave, title = "Signature Électronique", subtitle = "Veuillez signer ci-dessous pour validation." }: SignaturePadModalProps) {
  const padRef = useRef<SignatureCanvas>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClear = () => {
    padRef.current?.clear();
    setError(null);
  };

  const handleSave = () => {
    if (padRef.current?.isEmpty()) {
      setError("Veuillez apposer votre signature avant de valider.");
      return;
    }
    const dataUrl = padRef.current?.getTrimmedCanvas().toDataURL("image/png");
    if (dataUrl) {
      onSave(dataUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
        >
          <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                <PenTool className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{title}</h3>
                <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 bg-slate-50/50">
            <div className="bg-white border-2 border-dashed border-slate-300 rounded-xl overflow-hidden relative shadow-inner">
              <SignatureCanvas
                ref={padRef}
                canvasProps={{
                  className: "w-full h-64 cursor-crosshair touch-none",
                }}
                backgroundColor="#FFFFFF"
                penColor="#1E3A8A"
              />
              <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none opacity-20">
                <p className="text-xl font-bold uppercase tracking-widest text-slate-900">Signez ici</p>
              </div>
            </div>
            {error && (
              <p className="text-red-500 text-xs font-medium mt-2 text-center animate-pulse">{error}</p>
            )}
          </div>

          <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-white">
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Effacer
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all"
              >
                <Check className="h-4 w-4" />
                Valider la Signature
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
