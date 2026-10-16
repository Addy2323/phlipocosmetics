import React, { useState, useEffect } from "react";
import { X, AlertTriangle, HelpCircle, Check, DollarSign } from "lucide-react";
import { formatTSh } from "@/data/shop";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#0B1326] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
              destructive
                ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                : "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
            }`}
          >
            {destructive ? (
              <AlertTriangle className="size-5" />
            ) : (
              <HelpCircle className="size-5" />
            )}
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#15213B]">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition ${
              destructive
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface PromptDialogProps {
  open: boolean;
  title: string;
  description?: string;
  defaultValue?: string;
  placeholder?: string;
  submitLabel?: string;
  cancelLabel?: string;
  multiline?: boolean;
  required?: boolean;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

export function PromptDialog({
  open,
  title,
  description,
  defaultValue = "",
  placeholder = "",
  submitLabel = "Submit",
  cancelLabel = "Cancel",
  multiline = false,
  required = true,
  onSubmit,
  onCancel,
}: PromptDialogProps) {
  const [val, setVal] = useState(defaultValue);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setVal(defaultValue);
      setError("");
    }
  }, [open, defaultValue]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (required && !val.trim()) {
      setError("This field cannot be empty.");
      return;
    }
    onSubmit(val.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#0B1326] border border-slate-200 dark:border-[#1E293B] rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">{title}</h3>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {description && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {multiline ? (
            <textarea
              autoFocus
              value={val}
              onChange={(e) => {
                setVal(e.target.value);
                setError("");
              }}
              placeholder={placeholder}
              rows={3}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50/70 dark:bg-[#0E1726] p-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <input
              type="text"
              autoFocus
              value={val}
              onChange={(e) => {
                setVal(e.target.value);
                setError("");
              }}
              placeholder={placeholder}
              className="w-full text-xs rounded-xl border border-slate-200 dark:border-[#1B273F] bg-slate-50/70 dark:bg-[#0E1726] px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}

          {error && <p className="text-xs text-rose-500">{error}</p>}

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-[#15213B]">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 transition shadow-sm"
            >
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface EditPriceModalProps {
  open: boolean;
  productName: string;
  currentPrice: number;
  onSave: (newPrice: number) => Promise<void> | void;
  onClose: () => void;
}

export function EditPriceModal({
  open,
  productName,
  currentPrice,
  onSave,
  onClose,
}: EditPriceModalProps) {
  const [price, setPrice] = useState<string>(String(currentPrice));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPrice(String(currentPrice));
      setError("");
      setLoading(false);
    }
  }, [open, currentPrice]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(price);
    if (!price || isNaN(num) || num <= 0) {
      setError("Please enter a valid price greater than TZS 0.");
      return;
    }

    try {
      setLoading(true);
      await onSave(num);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update price.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#0B1326] border border-slate-200 dark:border-[#1E293B] rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#15213B] pb-3">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
              Pricing Management
            </span>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Update Product Price
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0E1726] border border-slate-100 dark:border-[#1B273F] space-y-1">
          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
            {productName}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Current Price: <span className="font-bold text-slate-700 dark:text-slate-200">{formatTSh(currentPrice)}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              New Price (TZS)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                TZS
              </span>
              <input
                type="number"
                min={1}
                step={500}
                autoFocus
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  setError("");
                }}
                placeholder="e.g. 54000"
                className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1B273F] bg-white dark:bg-[#0E1726] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && <p className="text-xs text-rose-500">{error}</p>}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-[#15213B]">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#0F172A] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save New Price"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
