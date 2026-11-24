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
      const create = await api.workflows.create(name.trim(), [], description.trim() || undefined);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 transition-all"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary border border-border text-primary flex items-center justify-center shadow-xs">
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground">New Automation Flow</h2>
              <p className="text-xs text-muted-foreground">Configure a blank visual workspace</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            aria-label="Close Modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Workflow Name <span className="text-primary">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Stripe Payment to Google Sheets"
              required
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Description <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the trigger and actions handled by this automation..."
              disabled={loading}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all resize-none font-medium"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold transition-all disabled:opacity-50 shadow-card cursor-pointer"
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
