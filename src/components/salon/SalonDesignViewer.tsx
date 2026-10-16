import React, { useState, useEffect } from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Check,
  Clock,
  ShieldCheck,
  Eye,
  Scissors,
} from "lucide-react";

export interface HairstyleDesignItem {
  id: string;
  name: string;
  categoryName: string;
  categoryId: string;
  image: string;
  price: number;
  duration?: string;
  description: string;
  features?: string[];
}

interface SalonImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDesign: HairstyleDesignItem | null;
  allDesigns: HairstyleDesignItem[];
  onSelectDesign?: (design: HairstyleDesignItem) => void;
}

/**
 * Fullscreen HD Lightbox Modal for clear, high-resolution viewing of hairstyle designs.
 */
export function SalonImageLightboxModal({
  isOpen,
  onClose,
  activeDesign,
  allDesigns,
  onSelectDesign,
}: SalonImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<1 | 1.5 | 2>(1);

  // Sync index when activeDesign changes
  useEffect(() => {
    if (activeDesign && allDesigns.length > 0) {
      const idx = allDesigns.findIndex((d) => d.id === activeDesign.id);
      if (idx !== -1) {
        setCurrentIndex(idx);
      }
    }
    setZoomLevel(1);
  }, [activeDesign, allDesigns]);

  // Keyboard navigation (ESC to close, left/right arrows to browse)
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, allDesigns.length]);

  if (!isOpen || !activeDesign || allDesigns.length === 0) return null;

  const current = allDesigns[currentIndex] || activeDesign;

  const handlePrev = () => {
    setZoomLevel(1);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : allDesigns.length - 1));
  };

  const handleNext = () => {
    setZoomLevel(1);
    setCurrentIndex((prev) => (prev < allDesigns.length - 1 ? prev + 1 : 0));
  };

  const toggleZoom = () => {
    setZoomLevel((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Clear full view of ${current.name}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl rounded-3xl bg-[#0F172A] border border-white/10 text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-white/10 bg-[#0B1326]">
          <div className="flex items-center gap-2.5">
            <span className="rounded-full bg-[#EC008C] text-white px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
              {current.categoryName}
            </span>
            <span className="text-xs text-white/60 hidden sm:inline">
              Design {currentIndex + 1} of {allDesigns.length}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleZoom}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold transition"
              title="Toggle Zoom Level"
            >
              {zoomLevel === 1 ? <ZoomIn className="size-3.5" /> : <ZoomOut className="size-3.5" />}
              <span className="hidden sm:inline">{zoomLevel === 1 ? "Zoom In" : `${zoomLevel}x`}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="grid size-8 place-items-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95"
              aria-label="Close full view"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Main Image Showcase Stage */}
        <div className="relative flex-1 bg-black/40 overflow-hidden flex items-center justify-center min-h-[320px] sm:min-h-[460px] p-2 sm:p-4 select-none">
          <img
            src={current.image}
            alt={current.name}
            className={`max-h-[60vh] max-w-full rounded-2xl object-contain transition-transform duration-300 shadow-2xl ${
              zoomLevel === 1.5 ? "scale-150 cursor-grab" : zoomLevel === 2 ? "scale-200 cursor-grab" : "scale-100"
            }`}
          />

          {/* Previous Arrow */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 grid size-10 place-items-center rounded-full bg-black/60 hover:bg-[#EC008C] text-white border border-white/20 shadow-lg transition active:scale-90"
            aria-label="Previous design"
          >
            <ChevronLeft className="size-6" />
          </button>

          {/* Next Arrow */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 grid size-10 place-items-center rounded-full bg-black/60 hover:bg-[#EC008C] text-white border border-white/20 shadow-lg transition active:scale-90"
            aria-label="Next design"
          >
            <ChevronRight className="size-6" />
          </button>

          {/* Clarity Watermark Badge */}
          <div className="absolute bottom-3 left-4 rounded-lg bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-white/80 border border-white/10 flex items-center gap-1.5 pointer-events-none">
            <Sparkles className="size-3 text-[#EC008C]" />
            <span>Philipo Salon HD Artistry</span>
          </div>
        </div>

        {/* Bottom Details & Selector Bar */}
        <div className="p-4 sm:p-6 bg-[#0B1326] border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg sm:text-2xl font-bold text-white tracking-tight">
                  {current.name}
                </h3>
                {current.duration && (
                  <span className="flex items-center gap-1 text-xs text-white/60 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                    <Clock className="size-3" /> {current.duration}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs sm:text-sm text-white/70 max-w-xl">
                {current.description}
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="block text-[10px] text-white/50 uppercase font-bold tracking-wider">
                  Service Rate
                </span>
                <span className="font-bold text-base sm:text-lg text-[#EC008C]">
                  TZS {current.price.toLocaleString()}
                </span>
              </div>

              {onSelectDesign && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectDesign(current);
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#EC008C] px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-[#EC008C]/30 hover:bg-[#d0007b] transition active:scale-95"
                >
                  <Check className="size-4" />
                  <span>Select This Style</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick thumbnail strip */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {allDesigns.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setZoomLevel(1);
                  setCurrentIndex(idx);
                }}
                className={`relative shrink-0 size-12 sm:size-14 rounded-xl overflow-hidden border-2 transition-all ${
                  idx === currentIndex
                    ? "border-[#EC008C] scale-105 shadow-md ring-2 ring-[#EC008C]/30"
                    : "border-white/20 opacity-60 hover:opacity-100"
                }`}
              >
                <img src={item.image} alt={item.name} className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SalonDesignShowcaseProps {
  title?: string;
  subtitle?: string;
  activeDesign: HairstyleDesignItem;
  allDesigns: HairstyleDesignItem[];
  onOpenLightbox: (design: HairstyleDesignItem) => void;
  onSelectDesign?: (design: HairstyleDesignItem) => void;
  badgeLabel?: string;
}

/**
 * Dedicated Clear Hairstyle Design Lookbook & Showcase Section.
 * Renders a prominent, high-definition preview card with angle details, clarity zoom,
 * and a quick thumbnail switcher so clients can inspect hairstyle artistry in full clarity!
 */
export function SalonDesignShowcase({
  title = "Hairstyle Design & Clear Lookbook",
  subtitle = "Inspect hairstyle artistry, braid precision, and texture in full clarity before booking.",
  activeDesign,
  allDesigns,
  onOpenLightbox,
  onSelectDesign,
  badgeLabel = "Active Design Preview",
}: SalonDesignShowcaseProps) {
  return (
    <div className="mt-8 rounded-3xl border border-[#EAE6DF] bg-gradient-to-br from-white via-[#FFFBFD] to-[#FCEAF2]/30 p-5 sm:p-7 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#F0ECE6] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-[#EC008C]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#EC008C]">
              {badgeLabel}
            </span>
          </div>
          <h3 className="mt-0.5 font-serif text-xl sm:text-2xl font-bold text-[#0F372E]">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>

        <button
          type="button"
          onClick={() => onOpenLightbox(activeDesign)}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-[#EC008C]/30 bg-white px-3.5 py-2 text-xs font-semibold text-[#EC008C] hover:bg-[#FCEAF2] transition active:scale-95 shadow-xs"
        >
          <Maximize2 className="size-3.5" />
          <span>View Fullscreen HD</span>
        </button>
      </div>

      {/* Main 2-Column Showcase */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Large Clear Photo Display */}
        <div className="md:col-span-6 relative group">
          <div
            onClick={() => onOpenLightbox(activeDesign)}
            className="relative cursor-pointer overflow-hidden rounded-2xl aspect-[4/3] bg-[#F7F4F0] border border-[#EAE6DF] shadow-md group-hover:border-[#EC008C]/40 transition-all duration-300"
          >
            <img
              src={activeDesign.image}
              alt={activeDesign.name}
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Gradient Overlay with Interactive Zoom Cue */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity" />

            {/* Top Badge */}
            <div className="absolute top-3 left-3">
              <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white border border-white/20 shadow-xs">
                {activeDesign.categoryName}
              </span>
            </div>

            {/* Center Hover Magnifier Callout */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="flex items-center gap-2 rounded-full bg-[#EC008C] px-4 py-2 text-xs font-bold text-white shadow-xl scale-95 group-hover:scale-100 transition-transform">
                <Eye className="size-4" />
                <span>Click to View Full Clear Image</span>
              </div>
            </div>

            {/* Bottom Photo Caption */}
            <div className="absolute bottom-3 inset-x-3 flex items-center justify-between text-white text-xs">
              <span className="font-semibold drop-shadow-md truncate">{activeDesign.name}</span>
              <span className="rounded-lg bg-white/20 backdrop-blur-sm px-2 py-0.5 text-[10px] font-mono">
                High-Definition
              </span>
            </div>
          </div>
        </div>

        {/* Design Details & Perks */}
        <div className="md:col-span-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#EC008C] uppercase tracking-wider">
                Salon Lookbook Specifications
              </span>
              <span className="text-sm font-bold text-[#0F372E]">
                From {activeDesign.price.toLocaleString()} TZS
              </span>
            </div>

            <h4 className="mt-1 font-serif text-2xl font-bold text-[#0F372E]">
              {activeDesign.name}
            </h4>

            <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {activeDesign.description}
            </p>
          </div>

          {/* Included Features & Standards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <div className="flex items-center gap-2 text-xs text-[#25232B] font-medium bg-white p-2.5 rounded-xl border border-[#EAE6DF]/70">
              <Scissors className="size-3.5 text-[#EC008C] shrink-0" />
              <span>Precision Parting & Styling</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#25232B] font-medium bg-white p-2.5 rounded-xl border border-[#EAE6DF]/70">
              <Sparkles className="size-3.5 text-[#C9A45C] shrink-0" />
              <span>Scalp Detox & Steam Included</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#25232B] font-medium bg-white p-2.5 rounded-xl border border-[#EAE6DF]/70">
              <ShieldCheck className="size-3.5 text-emerald-600 shrink-0" />
              <span>Tension-Free Comfortable Wear</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#25232B] font-medium bg-white p-2.5 rounded-xl border border-[#EAE6DF]/70">
              <Clock className="size-3.5 text-[#EC008C] shrink-0" />
              <span>{activeDesign.duration || "Approx. 2 hours"}</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenLightbox(activeDesign)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-[#EC008C] px-4 py-2.5 text-xs font-semibold text-[#EC008C] hover:bg-[#FCEAF2] transition active:scale-95 shadow-xs"
            >
              <Maximize2 className="size-3.5" />
              <span>Inspect Full Clarity Image</span>
            </button>

            {onSelectDesign && (
              <button
                type="button"
                onClick={() => onSelectDesign(activeDesign)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white px-5 py-2.5 text-xs font-semibold shadow-xs transition active:scale-95"
              >
                <Check className="size-3.5" />
                <span>Select Style</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Strip to Flip Between Designs */}
      <div className="mt-6 pt-5 border-t border-[#F0ECE6]">
        <p className="text-xs font-bold text-[#0F372E] mb-3 flex items-center justify-between">
          <span>Click any hairstyle design to preview in clear view:</span>
          <span className="text-[11px] text-muted-foreground font-normal">
            {allDesigns.length} styles available
          </span>
        </p>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
          {allDesigns.map((design) => {
            const isCurrent = design.id === activeDesign.id;
            return (
              <div
                key={design.id}
                onClick={() => onSelectDesign?.(design)}
                className={`group relative shrink-0 cursor-pointer rounded-2xl p-2.5 bg-white border transition-all duration-200 flex items-center gap-3 w-56 sm:w-64 ${
                  isCurrent
                    ? "border-2 border-[#EC008C] shadow-md ring-1 ring-[#EC008C]/20"
                    : "border-[#EAE6DF] hover:border-[#EC008C]/40 hover:shadow-xs"
                }`}
              >
                <div className="relative size-14 rounded-xl overflow-hidden shrink-0 border border-black/5">
                  <img src={design.image} alt={design.name} className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenLightbox(design);
                    }}
                    title="View clear image"
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                  >
                    <Maximize2 className="size-3.5" />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-[#0F372E] truncate">{design.name}</p>
                  <p className="text-[11px] font-semibold text-[#EC008C] mt-0.5">
                    TZS {design.price.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{design.categoryName}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
