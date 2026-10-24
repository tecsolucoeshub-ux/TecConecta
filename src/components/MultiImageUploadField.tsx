import React, { useState, useRef } from 'react';
import { Upload, X, Sparkles, Camera, Plus, Star, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';

interface MultiImageUploadFieldProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  label?: string;
  helperText?: string;
  isLight?: boolean;
}

export const MultiImageUploadField: React.FC<MultiImageUploadFieldProps> = ({
  photos = [],
  onChange,
  maxPhotos = 5,
  label = 'Fotos do Negócio / Vitrine (Até 5 fotos)',
  helperText = 'A primeira foto será usada como capa no banner do topo. Você pode adicionar até 5 fotos para o cliente ver na página completa.',
  isLight = false,
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputValue, setUrlInputValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    if (photos.length >= maxPhotos) {
      setErrorMsg(`Você já atingiu o limite de ${maxPhotos} fotos.`);
      return;
    }

    setErrorMsg(null);
    const isImageMime = file.type && file.type.startsWith('image/');
    const isImageExt = file.name && /\.(jpe?g|png|webp|gif|bmp|heic|heif|svg|avif)$/i.test(file.name);

    if (!isImageMime && !isImageExt && file.type !== '') {
      setErrorMsg('Por favor selecione um arquivo de imagem válido (JPG, PNG ou WebP).');
      return;
    }

    setIsCompressing(true);
    try {
      // Compress to optimal web dimensions (800px max, quality 0.8)
      const compressed = await compressImageFile(file, 800, 0.8);
      onChange([...photos, compressed]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Falha ao processar a foto.');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleAddUrl = () => {
    if (!urlInputValue.trim()) return;
    if (photos.length >= maxPhotos) {
      setErrorMsg(`Você já atingiu o limite de ${maxPhotos} fotos.`);
      return;
    }
    onChange([...photos, urlInputValue.trim()]);
    setUrlInputValue('');
    setShowUrlInput(false);
    setErrorMsg(null);
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    onChange(photos.filter((_, idx) => idx !== indexToRemove));
    setErrorMsg(null);
  };

  const handleSetCoverPhoto = (indexToPromote: number) => {
    if (indexToPromote === 0) return;
    const item = photos[indexToPromote];
    const rest = photos.filter((_, idx) => idx !== indexToPromote);
    onChange([item, ...rest]);
  };

  const triggerPicker = () => {
    if (photos.length >= maxPhotos) {
      setErrorMsg(`Limite de ${maxPhotos} fotos atingido.`);
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Label and Count */}
      <div className="flex items-center justify-between">
        <label className={`block text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>
          {label}
        </label>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-[#00E5FF] font-bold">
          {photos.length} de {maxPhotos} fotos
        </span>
      </div>

      {/* Photo Grid Preview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {photos.map((photo, index) => (
          <div
            key={index}
            className={`group relative aspect-video sm:aspect-square rounded-xl overflow-hidden border-2 bg-black/40 transition-all ${
              index === 0
                ? 'border-[#FF6B00] shadow-[0_0_12px_rgba(255,107,0,0.3)]'
                : 'border-white/20 hover:border-[#00E5FF]/60'
            }`}
          >
            <img
              src={photo}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />

            {/* Top Badge: Capa or Index */}
            <div className="absolute top-1 left-1 pointer-events-none">
              {index === 0 ? (
                <span className="px-1.5 py-0.5 rounded bg-[#FF6B00] text-white text-[8px] font-extrabold uppercase flex items-center gap-0.5 shadow-sm">
                  <Star className="w-2.5 h-2.5 fill-white" />
                  <span>Capa</span>
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-gray-200 text-[8.5px] font-bold">
                  #{index + 1}
                </span>
              )}
            </div>

            {/* Remove Action Button */}
            <button
              type="button"
              onClick={() => handleRemovePhoto(index)}
              className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 hover:bg-red-700 text-white shadow-md transition"
              title="Remover esta foto"
            >
              <X className="w-3 h-3" />
            </button>

            {/* Bottom Actions on Hover/Touch */}
            {index > 0 && (
              <div className="absolute inset-x-0 bottom-0 p-1 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => handleSetCoverPhoto(index)}
                  className="text-[9px] font-bold text-[#FF6B00] hover:underline flex items-center gap-1"
                  title="Definir esta foto como capa do banner"
                >
                  <Star className="w-2.5 h-2.5" />
                  <span>Tornar Capa</span>
                </button>
              </div>
            )}
          </div>
        ))}

        {/* Add Photo Button (if under limit) */}
        {photos.length < maxPhotos && (
          <div
            onClick={triggerPicker}
            className={`aspect-video sm:aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center p-2 cursor-pointer transition ${
              isCompressing
                ? 'border-[#00E5FF] bg-[#00E5FF]/10 pointer-events-none'
                : isLight
                ? 'border-slate-300 hover:border-[#00E5FF] bg-slate-50 hover:bg-slate-100'
                : 'border-white/20 hover:border-[#00E5FF]/60 bg-white/[0.02] hover:bg-white/[0.06]'
            }`}
          >
            {isCompressing ? (
              <>
                <Sparkles className="w-5 h-5 text-[#00E5FF] animate-spin mb-1" />
                <span className="text-[10px] text-[#00E5FF] font-bold">Processando...</span>
              </>
            ) : (
              <>
                <div className="w-7 h-7 rounded-full bg-[#00E5FF]/15 text-[#00E5FF] flex items-center justify-center mb-1">
                  <Plus className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-bold text-gray-200">+ Adicionar Foto</span>
                <span className="text-[9px] text-gray-400 mt-0.5">({photos.length}/{maxPhotos})</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Alternative URL adder toggle */}
      {photos.length < maxPhotos && (
        <div className="pt-0.5">
          {showUrlInput ? (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="url"
                  value={urlInputValue}
                  onChange={(e) => setUrlInputValue(e.target.value)}
                  placeholder="https://exemplo.com/foto-do-estabelecimento.jpg"
                  className="w-full rounded-xl pl-8 pr-3 py-2 text-xs bg-white/5 border border-white/20 text-white focus:outline-none focus:border-[#00E5FF]"
                />
              </div>
              <button
                type="button"
                onClick={handleAddUrl}
                className="px-3 py-2 rounded-xl bg-[#00E5FF] text-[#0B132B] font-bold text-xs hover:bg-[#00E5FF]/90 transition"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUrlInput(false);
                  setUrlInputValue('');
                }}
                className="px-2.5 py-2 rounded-xl bg-white/10 text-gray-300 text-xs hover:bg-white/15"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="text-[11px] text-[#00E5FF] hover:underline flex items-center gap-1"
            >
              <LinkIcon className="w-3 h-3" />
              <span>Ou colar link de imagem da internet</span>
            </button>
          )}
        </div>
      )}

      {/* Helper text */}
      {helperText && (
        <p className={`text-[10px] leading-tight ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
          <Sparkles className="w-3 h-3 text-[#FF6B00] inline-block mr-1" />
          <span>{helperText}</span>
        </p>
      )}

      {/* Error message */}
      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 pt-0.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
