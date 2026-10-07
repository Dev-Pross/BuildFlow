"use client";

import React from "react";
import { AlertTriangle, ArrowRight, X } from "lucide-react";

interface TriggerReplaceModalProps {
  isOpen: boolean;
  triggerName?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export default function TriggerReplaceModal({
  isOpen,
  triggerName = "Trigger",
  onConfirm,
  onClose,
}: TriggerReplaceModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#18191c] rounded-3xl shadow-2xl border border-[#27282d] p-6 flex flex-col gap-4 text-left transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-xl hover:bg-[#222429] transition-colors"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Replace Workflow Trigger?
            </h3>
            <p className="text-xs text-[#9ca3af] mt-0.5">
              You are about to replace <span className="font-semibold text-amber-300">&quot;{triggerName}&quot;</span>.
            </p>
          </div>
        </div>

        {/* Impact Warning Notice */}
        <div className="bg-amber-950/20 border border-amber-800/40 rounded-2xl p-4 space-y-2 text-xs text-amber-200/90">
          <p className="font-semibold text-amber-300">
            Replacing the trigger will impact how this workflow executes:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-amber-200/80 pl-1">
            <li>Existing webhook URLs, schedules, or listeners will be reset.</li>
            <li>Downstream actions referencing payload variables may need updates.</li>
            <li>Existing downstream wires will be automatically reconnected.</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#27282d] mt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[#9ca3af] hover:text-white hover:bg-[#222429] rounded-xl transition-colors cursor-pointer"
          >
            Keep Current
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Proceed to Replace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
