"use client";

import { getNodeConfig } from "@/app/lib/nodeConfigs";
import { useState } from "react";
import { HOOKS_URL } from "@repo/common/zod";
import { userAction } from "@/store/slices/userSlice";
interface ConfigModalProps {
  isOpen: boolean;
  selectedNode: any | null;
  onClose: () => void;
  onSave: (config: any, userId: string) => Promise<void>;
}

export default function ConfigModal({
  isOpen,
  selectedNode,
  onClose,
  onSave,
}: ConfigModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !selectedNode) return null;
  const userId =userAction.setUserId as unknown as string;
  console.log("we are getting this userId from ConfigModal" , userId)
  const handleSave = async () => {
    setLoading(true);
    try {
      // For now, just save empty config
      await onSave({ HOOKS_URL }, userId);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        background: "linear-gradient(135deg, #000 80%, #333 100%)",
      }}
    >
      <div
        className="rounded-lg shadow-xl max-w-md w-full max-h-[80vh]"
        style={{
          background: "linear-gradient(160deg, #131313 70%, #191919 100%)",
          color: "white",
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-900 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">
            Configure {selectedNode.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            style={{ fontWeight: "bold", fontSize: "20px" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Show node info */}
          <div
            className="mb-6 p-4 rounded-lg"
            style={{ background: "rgba(30,30,30,0.96)" }}
          >
            <p>
              <strong>ID:</strong>{" "}
              <span className="text-white">{selectedNode.id}</span>
            </p>
            <p>
              <strong>Type:</strong>{" "}
              <span className="text-white">{selectedNode.type}</span>
            </p>
          </div>

          {/* DYNAMIC FORM from registry */}
          {(() => {
            const nodeConfig = getNodeConfig(
              selectedNode.name || selectedNode.actionType
            );

            if (!nodeConfig) {
              return (
                <p className="text-red-400">
                  No config found for {selectedNode.name}
                </p>
              );
            }

            if (nodeConfig.fields.length === 0) {
              return (
                <div className="text-center py-8 text-gray-200">
                  <div className="text-4xl mb-4">✅</div>
                  <p className="text-lg font-medium text-white">
                    {nodeConfig.label}
                  </p>
                  <p className="mt-2 text-gray-300">{nodeConfig.description}</p>
                  {nodeConfig.id === "webhook" && (
                    <div
                      className="mt-6 p-4 rounded-lg"
                      style={{ background: "#111827" }}
                    >
                      <p className="font-medium mb-2 text-white">
                        Webhook URL:
                      </p>
                      <code className="block bg-black p-2 rounded border font-mono text-sm break-all text-green-300 border-gray-700">
                        {`${typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/${selectedNode.id}`}
                      </code>
                      <p className="text-xs text-gray-400 mt-1">
                        Copy this URL to trigger the workflow
                      </p>
                    </div>
                  )}
                </div>
              );
            }

            // Render fields dynamically (B&W)
            return (
              <div className="space-y-4">
                {nodeConfig.fields.map((field) => (
                  <div key={field.name} className="form-group">
                    <label className="block text-sm font-medium text-white mb-1">
                      {field.label}{" "}
                      {field.required && (
                        <span className="text-red-400">*</span>
                      )}
                    </label>
                    {/* Render field based on type - only basic input for now */}
                    <input
                      type="text"
                      placeholder={field.placeholder}
                      className="w-full p-3 border border-gray-900 bg-black text-white rounded-md focus:ring-2 focus:ring-white focus:border-white placeholder-gray-400"
                    />
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div
          className="p-6 border-t border-gray-900 flex justify-end gap-3"
          style={{ background: "#181818" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-white hover:bg-gray-700 rounded border border-gray-900"
            style={{ background: "#111" }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-white to-gray-400 text-black rounded hover:from-gray-300 hover:to-gray-600 disabled:opacity-50"
            style={{ fontWeight: 600 }}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
