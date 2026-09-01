"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Image as ImageIcon, Camera, Upload, ZoomIn, FileImage, X, Trash2 } from "lucide-react";
import { usePatient } from "@/lib/context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ImageRecord {
  id: string;
  blob_url: string;
  type: string;
  notes: string | null;
  created_at: string;
}

const TYPES = ["Panoramique", "Intra-orale", "Esthétique", "Céphalométrique"];

export function PatientImaging() {
  const { currentPatient } = usePatient();
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string>("Toutes");
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadType, setUploadType] = useState(TYPES[1]);
  const [uploadNotes, setUploadNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback((patientId: string) => {
    setLoading(true);
    fetch(`/api/patient-images?patientId=${patientId}`)
      .then((res) => res.json())
      .then((data) => setImages(data.images || []))
      .catch(() => setError("Impossible de charger les clichés."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (currentPatient) load(currentPatient.id);
    else setImages([]);
  }, [currentPatient, load]);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentPatient) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("patientId", currentPatient.id);
      formData.append("type", uploadType);
      formData.append("notes", uploadNotes);

      const res = await fetch("/api/patient-images", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'import.");

      setUploadNotes("");
      load(currentPatient.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentPatient) return;
    setError(null);
    try {
      const res = await fetch(`/api/patient-images?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de la suppression.");
      setSelectedImage(null);
      load(currentPatient.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    }
  };

  if (!currentPatient) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center min-h-[400px]">
        <Camera className="h-12 w-12 text-blue-200 mb-4" />
        <h2 className="text-lg font-black text-slate-800">Galerie d&apos;Imagerie</h2>
        <p className="text-sm text-slate-500 mt-2">Veuillez sélectionner un patient pour voir ses radiographies.</p>
      </div>
    );
  }

  const filters = ["Toutes", ...TYPES];
  const filteredImages = filter === "Toutes" ? images : images.filter((img) => img.type === filter);

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
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              Dossier de {currentPatient.name} · {images.length} cliché(s)
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value)}
            className="h-10 px-3 bg-white border border-slate-200 rounded text-[10px] font-bold uppercase tracking-widest outline-none focus:border-indigo-400"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <input
            type="text"
            value={uploadNotes}
            onChange={(e) => setUploadNotes(e.target.value)}
            placeholder="Légende (optionnel)"
            className="h-10 px-3 bg-white border border-slate-200 rounded text-xs outline-none focus:border-indigo-400 w-40"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelected}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-colors shadow-lg shadow-indigo-900/20"
          >
            <Upload className="h-4 w-4" /> {uploading ? "Import..." : "Importer"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm p-3">{error}</div>
      )}

      {/* FILTERS */}
      <div className="flex gap-2 p-2 bg-slate-100/50 rounded-lg overflow-x-auto no-scrollbar">
        {filters.map((f) => (
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
      {loading && <p className="text-xs text-slate-400 text-center py-8">Chargement...</p>}
      {!loading && filteredImages.length === 0 && (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-12 text-center">
          <FileImage className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">Aucun cliché pour ce patient</p>
          <p className="text-xs text-slate-400 mt-1">
            Utilisez « Importer » pour ajouter une radiographie ou une photo.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredImages.map((img) => (
          <div
            key={img.id}
            className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer"
            onClick={() => setSelectedImage(img)}
          >
            <div className="relative h-48 overflow-hidden bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.blob_url}
                alt={img.notes || img.type}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                <span className="text-white text-xs font-bold">
                  <ZoomIn className="inline h-4 w-4 mr-1" /> Zoom
                </span>
              </div>
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-indigo-900 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm">
                {img.type}
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm font-bold text-slate-800 line-clamp-1">{img.notes || "Sans légende"}</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Le {new Date(img.created_at).toLocaleDateString("fr-FR")}
              </p>
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
              <div className="flex items-center gap-3 min-w-0">
                <FileImage className="h-5 w-5 text-indigo-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">{selectedImage.notes || "Sans légende"}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                    {selectedImage.type} · {new Date(selectedImage.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDelete(selectedImage.id)}
                  title="Supprimer ce cliché"
                  className="p-2 bg-white/10 hover:bg-rose-600 rounded-lg transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <motion.img
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                src={selectedImage.blob_url}
                alt={selectedImage.notes || selectedImage.type}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
