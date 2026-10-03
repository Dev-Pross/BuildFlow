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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-100 p-6 flex flex-col gap-4 text-left transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
          title="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              Replace Workflow Trigger?
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              You are about to replace <span className="font-medium text-gray-700">&quot;{triggerName}&quot;</span>.
            </p>
          </div>
        </div>

        {/* Impact Warning Notice */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3.5 space-y-2 text-xs text-amber-900">
          <p className="font-medium text-amber-950">
            Replacing the trigger will impact how this workflow executes:
          </p>
          <ul className="list-disc list-inside space-y-1 text-amber-800/90 pl-1">
            <li>
              Existing webhook URLs, schedules, or listeners will be reset.
            </li>
            <li>
              Downstream actions referencing payload variables from this trigger may need to be updated.
            </li>
            <li>
              Existing downstream connections will be reconnected to the new trigger.
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Keep Current Trigger
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-3.5 py-2 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Proceed to Replace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
