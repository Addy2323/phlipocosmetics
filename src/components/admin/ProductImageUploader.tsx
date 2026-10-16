import React, { useState, useRef, useEffect } from "react";
import {
  UploadCloud,
  Link as LinkIcon,
  X,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { products as sampleProducts } from "@/data/shop";

interface ProductImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  maxSizeBytes?: number; // Default 10MB
}

// 10 MB default limit as requested by user
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

export function ProductImageUploader({
  value,
  onChange,
  label = "Product Image",
  maxSizeBytes = DEFAULT_MAX_SIZE,
}: ProductImageUploaderProps) {
  const [activeTab, setActiveTab] = useState<"file" | "url" | "presets">("file");
  const [urlInput, setUrlInput] = useState(value && !value.startsWith("data:") ? value : "");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageError(false);
    if (value && !value.startsWith("data:")) {
      setUrlInput(value);
    }
  }, [value]);

  // Client-side compression to ensure data URL fits safely into localStorage without sacrificing clarity
  const processImageFile = (file: File) => {
    // 1. Validate file size up to 10MB
    if (file.size > maxSizeBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      const limitMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
      toast.error("Image file is too large", {
        description: `Selected file is ${sizeMB} MB. Maximum allowed limit is ${limitMB} MB.`,
      });
      return;
    }

    // 2. Validate MIME type
    if (!file.type.startsWith("image/")) {
      toast.error("Invalid file format", {
        description: "Please select a valid image file (JPG, PNG, WEBP, or GIF).",
      });
      return;
    }

    setIsProcessing(true);
    setFileDetails({
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        setIsProcessing(false);
        return;
      }

      // Optimize large images to prevent browser localStorage quota exhaustion
      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedUrl = canvas.toDataURL("image/jpeg", 0.9);
            onChange(optimizedUrl);
          } else {
            onChange(rawDataUrl);
          }

          toast.success("Image Uploaded", {
            description: `${file.name} (${(file.size / 1024).toFixed(0)} KB) ready.`,
          });
        } catch {
          onChange(rawDataUrl);
        } finally {
          setIsProcessing(false);
        }
      };

      img.onerror = () => {
        setIsProcessing(false);
        toast.error("Failed to process image file");
      };

      img.src = rawDataUrl;
    };

    reader.onerror = () => {
      setIsProcessing(false);
      toast.error("Failed to read file");
    };

    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      toast.error("Please enter a valid image URL");
      return;
    }
    onChange(urlInput.trim());
    toast.success("Image URL applied");
  };

  const handleClearImage = () => {
    onChange("");
    setUrlInput("");
    setFileDetails(null);
    setImageError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block font-semibold text-xs text-slate-700 dark:text-slate-300">
          {label}
        </label>
        <span className="text-[10px] text-slate-400">Max size: 10 MB</span>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#0E1726] rounded-xl text-[11px] font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab("file")}
          className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "file"
              ? "bg-white dark:bg-[#172459] text-[#173488] dark:text-white shadow-xs font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <UploadCloud className="size-3.5 text-[#E6007A]" />
          <span>Upload File</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("url")}
          className={`flex-1 py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "url"
              ? "bg-white dark:bg-[#172459] text-[#173488] dark:text-white shadow-xs font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <LinkIcon className="size-3.5 text-[#173488] dark:text-blue-400" />
          <span>Image URL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("presets")}
          className={`py-1.5 px-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "presets"
              ? "bg-white dark:bg-[#172459] text-[#173488] dark:text-white shadow-xs font-bold"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
          }`}
        >
          <Sparkles className="size-3.5 text-[#C9A45C]" />
          <span>Presets</span>
        </button>
      </div>

      {/* Tab 1: Local File Upload */}
      {activeTab === "file" && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-[#E6007A] bg-[#FFF5F8] dark:bg-[#1A1028]"
              : "border-slate-200 dark:border-[#1E293B] hover:border-[#173488] bg-slate-50/50 dark:bg-[#0B1326] hover:bg-white"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
            <div className="size-9 rounded-full bg-[#FFF5F8] dark:bg-[#172459] flex items-center justify-center text-[#E6007A]">
              {isProcessing ? (
                <RefreshCw className="size-4 animate-spin text-[#173488]" />
              ) : (
                <UploadCloud className="size-4.5" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-white">
                {isProcessing
                  ? "Processing high-res image..."
                  : "Click to browse or drag and drop image here"}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                PNG, JPG, WEBP, or GIF (up to 10 MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Image URL Input */}
      {activeTab === "url" && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://example.com/product-image.jpg"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 p-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50 dark:bg-[#0E1726] text-xs text-slate-900 dark:text-white"
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="px-3.5 py-2 rounded-xl bg-[#173488] hover:bg-[#122A6E] text-white text-xs font-semibold transition"
            >
              Apply
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Paste any direct image link or asset path.
          </p>
        </div>
      )}

      {/* Tab 3: Presets Catalog */}
      {activeTab === "presets" && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-slate-400">
            Select an authentic Philipo product image preset:
          </p>
          <div className="grid grid-cols-4 gap-2">
            {sampleProducts.slice(0, 8).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  onChange(p.image);
                  toast.success(`Preset applied: ${p.name}`);
                }}
                className={`group relative rounded-xl overflow-hidden border p-1 text-left transition hover:scale-105 ${
                  value === p.image
                    ? "border-[#E6007A] ring-2 ring-[#E6007A]/20"
                    : "border-slate-200 dark:border-[#1E293B]"
                }`}
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-full h-12 object-cover rounded-lg bg-slate-100"
                />
                <span className="block text-[9px] font-medium text-slate-700 dark:text-slate-300 truncate mt-1">
                  {p.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Preview Card */}
      {value && (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFF5F8] dark:bg-[#121B30] border border-[#FCEAF2] dark:border-[#1A2644]">
          <div className="relative size-14 rounded-xl overflow-hidden border border-white dark:border-[#223358] shadow-xs shrink-0 bg-white">
            {imageError ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-rose-50 text-rose-500 text-[9px] text-center p-1">
                <AlertTriangle className="size-4" />
                <span>Error</span>
              </div>
            ) : (
              <img
                src={value}
                alt="Product Preview"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-[#173488] dark:text-white truncate">
                {fileDetails?.name || (value.startsWith("data:") ? "Uploaded Local Image" : "Linked Image URL")}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
              {fileDetails?.size || (value.startsWith("data:") ? "Optimized local storage" : value)}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearImage}
            title="Remove image"
            className="p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-rose-600 transition"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
