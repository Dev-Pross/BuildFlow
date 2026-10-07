"use client";

import { useState } from "react";
import { api } from "@/app/lib/api";
import { useRouter } from "next/navigation";
import { Workflow, X, ArrowRight } from "lucide-react";

interface CardDemoProps {
  onClose?: () => void;
}

export function CardDemo({ onClose }: CardDemoProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Workflow name is required");
      return;
    }

    setError("");
    try {
      setLoading(true);
      const create = await api.workflows.create(name.trim(), []);
      const id = create.data.Data.id;

      if (onClose) onClose();
      router.push(`/workflows/${id}`);
    } catch (err: any) {
      setLoading(false);
      const msg = err?.response?.data?.message || err?.message || "Failed to create workflow.";
      setError(msg);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 transition-all"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-3xl bg-[#18191c] border border-[#27282d] shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-sm">
              <Workflow className="h-5 w-5 text-black" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">New Automation Flow</h2>
              <p className="text-xs text-[#9ca3af]">Configure a blank visual workspace</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#9ca3af] hover:text-white hover:bg-[#222429] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Workflow Name <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Stripe Payment to Google Sheets"
              required
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1e2025] border border-[#2a2c33] text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Description <span className="text-[#6b7280] font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the trigger and actions handled by this automation..."
              disabled={loading}
              className="w-full px-4 py-2.5 rounded-xl bg-[#1e2025] border border-[#2a2c33] text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27282d] mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9ca3af] hover:text-white hover:bg-[#222429] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-white text-black text-xs font-bold hover:bg-gray-100 transition-all disabled:opacity-50 shadow-md cursor-pointer"
            >
              {loading ? (
                "Creating Canvas..."
              ) : (
                <>
                  <span>Create Workflow</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CardDemo;
