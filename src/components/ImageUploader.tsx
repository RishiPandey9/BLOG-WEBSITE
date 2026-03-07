'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Upload, Link as LinkIcon, X, Loader2, ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  className?: string;
}

export function ImageUploader({
  value,
  onChange,
  folder = 'covers',
  label = 'Cover Image',
  className,
}: ImageUploaderProps) {
  const [tab, setTab] = useState<'url' | 'upload'>('url');
  const [urlInput, setUrlInput] = useState(value);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      onChange(data.url);
      setUrlInput(data.url);
      toast.success('Image uploaded!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleUrlApply() {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
  }

  function handleClear() {
    onChange('');
    setUrlInput('');
  }

  return (
    <div className={cn('space-y-3', className)}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>

      {/* Tab switcher */}
      <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            tab === 'url'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <LinkIcon className="w-3 h-3" />
          URL
        </button>
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            tab === 'upload'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          <Upload className="w-3 h-3" />
          Upload
        </button>
      </div>

      {tab === 'url' ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleUrlApply())}
            placeholder="https://images.unsplash.com/..."
            className="input-field flex-1 text-sm"
          />
          <button type="button" onClick={handleUrlApply} className="btn-secondary text-sm px-3">
            Apply
          </button>
        </div>
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-sky-400 hover:text-sky-500 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Click to upload (JPEG, PNG, WebP · max 5 MB)
              </>
            )}
          </button>
        </div>
      )}

      {/* Preview */}
      {value ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="relative w-full h-48">
            <Image
              src={value}
              alt="Cover preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 700px"
            />
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
            aria-label="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="text-center text-gray-400">
            <ImageIcon className="w-8 h-8 mx-auto mb-1" />
            <p className="text-xs">No image selected</p>
          </div>
        </div>
      )}
    </div>
  );
}
