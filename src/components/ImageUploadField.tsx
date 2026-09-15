import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Link as LinkIcon, X, CheckCircle, AlertCircle, Sparkles, Camera } from 'lucide-react';
import { compressImageFile } from '../utils/imageCompressor';

interface ImageUploadFieldProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  label?: string;
  helperText?: string;
  isLight?: boolean;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  value,
  onChange,
  label = 'Foto do Negócio / Fachada / Logo',
  helperText = 'Anúncios com foto recebem até 3x mais contatos no WhatsApp!',
  isLight = false,
}) => {
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileProcess = async (file: File) => {
    setErrorMsg(null);
    const isImageMime = file.type && file.type.startsWith('image/');
    const isImageExt = file.name && /\.(jpe?g|png|webp|gif|bmp|heic|heif|svg|avif)$/i.test(file.name);

    if (!isImageMime && !isImageExt && file.type !== '') {
      setErrorMsg('Por favor selecione um arquivo de imagem (JPG, PNG, WebP).');
      return;
    }

    setIsCompressing(true);
    try {
      // Compress to optimal web dimensions (720px max, quality 0.8) for fast loading and low storage footprint
      const compressed = await compressImageFile(file, 720, 0.8);
      onChange(compressed);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Falha ao processar a foto.');
    } finally {
      setIsCompressing(false);
      // Reset input value so re-selecting the same file will trigger onChange
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const triggerFilePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    setUrlInput('');
  };

  return (
    <div className="space-y-2">
      {/* Hidden file input ALWAYS present in the DOM for reliable programmatic click on mobile and desktop */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,image/*"
        className="hidden"
        onChange={handleFileInputChange}
      />

      <div className="flex items-center justify-between">
        <label className={`block text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>
          {label}
        </label>
        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => setInputMode('upload')}
            className={`px-2 py-0.5 rounded transition ${
              inputMode === 'upload'
                ? isLight
                  ? 'bg-[#00E5FF]/20 text-[#0097A7] font-bold'
                  : 'bg-[#00E5FF]/20 text-[#00E5FF] font-bold'
                : isLight
                ? 'text-slate-500 hover:text-slate-900'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Enviar Arquivo
          </button>
          <span className={isLight ? 'text-slate-300' : 'text-gray-600'}>|</span>
          <button
            type="button"
            onClick={() => setInputMode('url')}
            className={`px-2 py-0.5 rounded transition ${
              inputMode === 'url'
                ? isLight
                  ? 'bg-[#00E5FF]/20 text-[#0097A7] font-bold'
                  : 'bg-[#00E5FF]/20 text-[#00E5FF] font-bold'
                : isLight
                ? 'text-slate-500 hover:text-slate-900'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Colar Link (URL)
          </button>
        </div>
      </div>

      {/* Preview if image is present */}
      {value ? (
        <div
          className={`relative rounded-xl overflow-hidden border p-2.5 flex items-center gap-3.5 transition ${
            isLight ? 'bg-slate-50 border-slate-200 shadow-sm' : 'bg-white/5 border-white/15'
          }`}
        >
          {/* Clickable thumbnail with camera badge */}
          <button
            type="button"
            onClick={triggerFilePicker}
            className="group/thumb relative w-20 h-20 rounded-lg overflow-hidden shrink-0 border border-white/20 bg-black/40 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00E5FF]"
            title="Clique para escolher outra foto"
          >
            <img
              src={value}
              alt="Foto do anunciante"
              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-bold transition-opacity">
              <Camera className="w-4 h-4 text-[#00E5FF] mb-0.5" />
              <span>Trocar</span>
            </div>
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className={isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400 font-bold'}>
                Foto vinculada com sucesso!
              </span>
            </div>
            <p className={`text-[11px] truncate mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-300'}`}>
              Pronta para visualização nos cartões e buscas locais.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={triggerFilePicker}
                disabled={isCompressing}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#00E5FF] text-[#0B132B] hover:brightness-110 active:scale-95 transition flex items-center gap-1.5 shadow-sm"
              >
                {isCompressing ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>Trocar Foto</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-500/20 border border-transparent hover:border-red-500/30 transition flex items-center gap-1"
                title="Remover foto atual"
              >
                <X className="w-3 h-3" />
                <span>Remover</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Upload / URL Input Box */
        <div>
          {inputMode === 'upload' ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFilePicker}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                dragActive
                  ? 'border-[#00E5FF] bg-[#00E5FF]/10'
                  : isLight
                  ? 'border-slate-300 hover:border-[#00E5FF] bg-slate-50 hover:bg-slate-100/80'
                  : 'border-white/15 hover:border-[#00E5FF]/50 bg-white/[0.02] hover:bg-white/[0.05]'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-[#00E5FF]/15 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF]">
                {isCompressing ? (
                  <Sparkles className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>
              <div>
                <p className={`text-xs font-semibold ${isLight ? 'text-slate-800' : 'text-gray-200'}`}>
                  {isCompressing ? 'Otimizando foto...' : 'Clique para escolher ou arraste a foto aqui'}
                </p>
                <p className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
                  Suporta JPG, PNG ou WebP direto da galeria ou câmera
                </p>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                  isLight ? 'text-slate-400' : 'text-gray-400'
                }`} />
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://exemplo.com/foto-do-meu-negocio.jpg"
                  className={`w-full rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-[#00E5FF] ${
                    isLight
                      ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400'
                      : 'bg-white/5 border border-white/20 text-white placeholder-gray-500'
                  }`}
                />
              </div>
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3.5 py-2 rounded-xl bg-[#00E5FF] text-[#0B132B] font-bold text-xs hover:bg-[#00E5FF]/90 transition"
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-xs text-red-400 pt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {helperText && !value && (
        <p className={`text-[10px] flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-gray-400'}`}>
          <Sparkles className="w-3 h-3 text-[#FF6B00]" />
          <span>{helperText}</span>
        </p>
      )}
    </div>
  );
};
