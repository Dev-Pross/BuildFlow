"use client";
import { getNodeConfig } from "@/app/lib/nodeConfigs";
import { useEffect, useState } from "react";
import { HOOKS_URL } from "@repo/common/zod";
import { useAppSelector } from "@/app/hooks/redux";
import { toast } from "sonner";
import { useCredentials } from "@/app/hooks/useCredential";
import { api } from "@/app/lib/api";

interface ConfigModalProps {
  isOpen: boolean;
  selectedNode: any | null;
  onClose: () => void;
  onSave: (selectedNode: string, config: any, userId: string) => Promise<void>;
  workflowId?: string;
}

export default function ConfigModal({
  isOpen,
  selectedNode,
  onClose,
  onSave,
  workflowId,
}: ConfigModalProps) {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const userId = useAppSelector((state) => state.user.userId) as string;
  // console.log("This is the credential Data from config from backend" , config);
  // Fetch credentials with hook based on node config (google, etc) if appropriate
  let credType: string | null = null;
  if (selectedNode) {
    const nodeConfig = getNodeConfig(selectedNode.name || selectedNode.actionType);
    if (nodeConfig && nodeConfig.credentials) credType = nodeConfig.credentials;
  }
  const { cred: credentials = [], authUrl } = useCredentials(credType ?? "", workflowId);

  useEffect(() => {
    setConfig({});
    // We no longer set local credentials here; handled by useCredentials!
  }, [selectedNode]);

  if (!isOpen || !selectedNode) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave(selectedNode.id, config, userId);
      toast.success("Configured Successfully");
    } catch {
      toast.error("Failed to save config");
    } finally {
      setLoading(false);
      onClose();
    }
  };
  const handleExecute = async () => {
    setLoading(true);
    try {
      // await api.workflows.po
    }
    catch (error: any) {
      toast.error("Failed to save config");

    }
    finally {
      setLoading(false);
      onClose();
    }
  }

  const renderField = (field: any) => {
    const fieldValue = config[field.name] || "";

    if (field.type === "dropdown" && field.name === "credentialId") {
      // Use the values from useCredentials: credentials and authUrl
      return (
        <div key={field.name} className="form-group">
          <label className="block text-sm font-medium text-white mb-1">
            {field.label}
            {field.required && <span className="text-red-400">*</span>}
          </label>
          {(Array.isArray(credentials) && credentials.length > 0) ? (
            <>
              <select
                value={fieldValue}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    [field.name]: e.target.value,
                  })
                }
                className="w-full p-3 border border-gray-900 bg-black text-white rounded-md"
                required={field.required}
              >
                <option value="">Select Google Account</option>
                {credentials.map((cred: any) => (
                  <option key={cred.id} value={cred.id}>
                    {cred.email || cred.name || "Google Account"}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2 mt-2">
                {credentials.map((cred: any) => (
                  <span
                    key={cred.id}
                    className="px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full"
                  >
                    {cred.email || cred.name}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <>
              {authUrl ? (
                <>
                  <button
                    onClick={() => {
                      if (authUrl) {
                        window.location.href = authUrl;
                      }
                    }}
                    className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium flex items-center justify-center gap-2 transition-colors"
                    type="button"
                  >
                    🔗 Connect Google Account
                  </button>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Connect your Google account to use Gmail &amp; Sheets
                  </p>
                </>
              ) : (
                <p className="text-xs text-gray-400 mt-2 text-center">
                  No credentials or connection option available.
                </p>
              )}
            </>
          )}
        </div>
      );
    }

    if (field.type === "dropdown") {
      return (
        <div key={field.name} className="form-group">
          <label className="block text-sm font-medium text-white mb-1">
            {field.label}
            {field.required && <span className="text-red-400">*</span>}
          </label>
          <select
            value={fieldValue}
            onChange={(e) =>
              setConfig({
                ...config,
                [field.name]: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-900 bg-black text-white rounded-md"
            required={field.required}
          >
            <option value="">Select {field.label.toLowerCase()}</option>
            {(field.options || []).map((opt: any) => (
              <option key={opt.value || opt} value={opt.value || opt}>
                {opt.label || opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === "textarea") {
      return (
        <div key={field.name} className="form-group">
          <label className="block text-sm font-medium text-white mb-1">
            {field.label}
            {field.required && <span className="text-red-400">*</span>}
          </label>
          <textarea
            value={fieldValue}
            placeholder={field.placeholder}
            onChange={(e) =>
              setConfig({
                ...config,
                [field.name]: e.target.value,
              })
            }
            className="w-full p-3 border border-gray-900 bg-black text-white rounded-md focus:ring-2 focus:ring-white focus:border-white placeholder-gray-400"
            required={field.required}
            rows={4}
          />
        </div>
      );
    }

    return (
      <div key={field.name} className="form-group">
        <label className="block text-sm font-medium text-white mb-1">
          {field.label}
          {field.required && <span className="text-red-400">*</span>}
        </label>
        <input
          type={field.type}
          value={fieldValue}
          placeholder={field.placeholder}
          onChange={(e) =>
            setConfig({
              ...config,
              [field.name]: e.target.value,
            })
          }
          className="w-full p-3 border border-gray-900 bg-black text-white rounded-md focus:ring-2 focus:ring-white focus:border-white placeholder-gray-400"
          required={field.required}
        />
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{
        background: "linear-gradient(135deg, #000 80%, #333 100%)",
        overflowY: "auto",
      }}
    >
      <div
        className="rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col"
        style={{
          background: "linear-gradient(160deg, #131313 70%, #191919 100%)",
          color: "white",
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-900 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-semibold text-white">
            Configure {selectedNode.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            style={{ fontWeight: "bold", fontSize: "20px" }}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Node info */}
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
          {/* Dynamic Form Block */}
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
            if ((nodeConfig.fields || []).length === 0) {
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
                      <div className="flex items-center gap-2">
                        <code className="block bg-black p-2 rounded border font-mono text-sm break-all text-green-300 border-gray-700">
                          {`${HOOKS_URL}/${userId}/${selectedNode.id}`}
                        </code>
                        <button
                          type="button"
                          aria-label="Copy webhook url"
                          className="p-1 rounded hover:bg-gray-800"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              `${HOOKS_URL}/${userId}/${selectedNode.id}`
                            );
                            toast.success("Webhook url copied");
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4 text-gray-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <rect
                              x="9"
                              y="9"
                              width="13"
                              height="13"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                            <rect
                              x="3"
                              y="3"
                              width="13"
                              height="13"
                              rx="2"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                            />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Copy this URL to trigger the workflow
                      </p>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <div className="space-y-4">
                {nodeConfig.fields.map(renderField)}
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
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              await handleSave();
              setConfig({});
            }}
            disabled={loading}
            className="px-6 py-2 bg-gradient-to-r from-white to-gray-400 text-black rounded hover:from-gray-300 hover:to-gray-600 disabled:opacity-50"
            style={{ fontWeight: 600 }}
            type="button"
          >
            {loading ? "Saving..." : "Save"}
          </button>



        </div>
      </div>
    </div>
  );
}
