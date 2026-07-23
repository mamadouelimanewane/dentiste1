"use client";

import React, { useState } from "react";
import { Image as ImageIcon, Camera, Upload, ZoomIn, Search, FileImage, LayoutGrid, X, Check } from "lucide-react";
import { usePatient } from "@/lib/context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ImageRecord {
  id: string;
  url: string;
  type: "Panoramique" | "Intra-orale" | "Esthétique" | "Céphalométrique";
  date: string;
  notes: string;
}

const MOCK_IMAGES: ImageRecord[] = [
  { id: "1", url: "https://images.unsplash.com/photo-1606265752439-1f18756aa5fc?auto=format&fit=crop&q=80&w=800", type: "Panoramique", date: "2023-10-15", notes: "Radio panoramique de contrôle" },
  { id: "2", url: "https://images.unsplash.com/photo-1598256989800-fea5f142277c?auto=format&fit=crop&q=80&w=800", type: "Intra-orale", date: "2023-09-02", notes: "Carie sur 46" },
  { id: "3", url: "https://images.unsplash.com/photo-1536302522772-766a506180a5?auto=format&fit=crop&q=80&w=800", type: "Esthétique", date: "2023-08-10", notes: "Avant blanchiment" }
];

export function PatientImaging() {
  const { currentPatient } = usePatient();
  const [images, setImages] = useState<ImageRecord[]>(MOCK_IMAGES);
  const [filter, setFilter] = useState<string>("Toutes");
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);

  if (!currentPatient) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px]">
        <Camera className="h-12 w-12 text-blue-200 mb-4" />
        <h2 className="text-lg font-black text-slate-800">Galerie d'Imagerie</h2>
        <p className="text-sm text-slate-500 mt-2">Veuillez sélectionner un patient pour voir ses radiographies.</p>
      </div>
    );
  }

  const filters = ["Toutes", "Panoramique", "Intra-orale", "Esthétique"];
  const filteredImages = filter === "Toutes" ? images : images.filter(img => img.type === filter);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-sm p-4 flex flex-col md:flex-row items-center justify-between shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center shadow-inner">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Imagerie & Photos</h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Dossier de {currentPatient.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
            <Camera className="h-4 w-4" /> Capturer
          </button>
          <button className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors shadow-lg shadow-indigo-900/20">
            <Upload className="h-4 w-4" /> Importer
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-2 p-2 bg-slate-100/50 rounded-lg overflow-x-auto no-scrollbar">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all whitespace-nowrap",
              filter === f ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* GALLERY GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredImages.map(img => (
          <div 
            key={img.id} 
            className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer"
            onClick={() => setSelectedImage(img)}
          >
            <div className="relative h-48 overflow-hidden bg-slate-900">
              <img src={img.url} alt={img.notes} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-4">
                <span className="text-white text-xs font-bold"><ZoomIn className="inline h-4 w-4 mr-1"/> Zoom</span>
              </div>
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-indigo-900 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm">
                {img.type}
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm font-bold text-slate-800 line-clamp-1">{img.notes}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Le {new Date(img.date).toLocaleDateString('fr-FR')}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FULLSCREEN VIEWER MODAL */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
          >
            <div className="flex justify-between items-center p-4 text-white">
              <div className="flex items-center gap-3">
                <FileImage className="h-5 w-5 text-indigo-400" />
                <div>
                  <p className="text-sm font-bold">{selectedImage.notes}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">{selectedImage.type} - {new Date(selectedImage.date).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedImage(null)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              <motion.img 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                src={selectedImage.url} 
                alt={selectedImage.notes} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
