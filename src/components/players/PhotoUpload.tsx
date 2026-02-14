"use client";

import { useRef, useState } from "react";
import Image from "next/image";

interface PhotoUploadProps {
  playerId: string;
  currentPhoto?: string;
  onPhotoUpdate?: (photoUrl: string) => void;
}

export default function PhotoUpload({ playerId, currentPhoto, onPhotoUpdate }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(currentPhoto);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Wybierz plik obrazu");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Plik jest za duży (maks. 5MB)");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);

    // Upload file
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/players/${playerId}/photo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();
      setPreview(data.photo);
      onPhotoUpdate?.(data.photo);
    } catch (err) {
      setError("Nie udało się wgrać zdjęcia");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-4">📸 Zdjęcie zawodnika</h3>

      <div className="flex flex-col gap-4">
        {/* Photo Preview */}
        <div className="flex justify-center">
          <div className="relative w-40 h-40 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 overflow-hidden">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                <div className="text-4xl mb-2">📷</div>
                <div className="text-xs">Brak zdjęcia</div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white hover:shadow-lg transition-all disabled:opacity-50"
        >
          {uploading ? "Wgrywanie..." : "📤 Wgraj zdjęcie"}
        </button>

        {/* Error Message */}
        {error && <div className="text-sm text-red-600 text-center">{error}</div>}

        {/* Info */}
        <div className="text-xs text-slate-500 text-center">
          JPG, PNG, GIF (maks. 5MB)
        </div>
      </div>
    </div>
  );
}
