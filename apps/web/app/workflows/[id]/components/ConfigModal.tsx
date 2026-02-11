"use client";
import { getNodeConfig } from "@/app/lib/nodeConfigs";
import { useEffect, useState } from "react";
import { HOOKS_URL } from "@repo/common/zod";
import { extractVariablesFromOutput, resolveConfigVariables, InterpolationContext } from "@repo/common/zod";
import { useAppSelector, useAppDispatch } from "@/app/hooks/redux";
import { toast } from "sonner";
import { useCredentials } from "@/app/hooks/useCredential";
import { api } from "@/app/lib/api";
import { PreviousNodeOutput, VariableDefinition } from "@/app/lib/types/node.types";
import { VariablePanel } from "@/app/components/ui/variable-panel";
import { 
  setNodeOutput, 
  setNodeLoading, 
  selectNodeOutput, 
  selectNodeLoading,
  selectAllOutputs,
  NodeTestOutput 
} from "@/store/slices/nodeOutputSlice";

interface ConfigModalProps {
  isOpen: boolean;
  selectedNode: any | null;
  onClose: () => void;
  onSave: (selectedNode: string, config: any, userId: string) => Promise<void>;
  workflowId?: string;
  previousNodes: PreviousNodeOutput[];
}

export default function ConfigModal({
  isOpen,
  selectedNode,
  onClose,
  onSave,
  workflowId,
  previousNodes
}: ConfigModalProps) {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  
  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.user.userId) as string;
  
  // Get all tested outputs from Redux (for variable resolution)
  const allTestedOutputs = useAppSelector(selectAllOutputs);
  
  // Get test output from Redux for this node
  const nodeTestOutput = useAppSelector((state) => 
    selectedNode ? selectNodeOutput(state, selectedNode.id) : undefined
  );
  const isTestingNode = useAppSelector((state) => 
    selectedNode ? selectNodeLoading(state, selectedNode.id) : false
  );

  const fetchOptionsMap: Record<string, (params: any) => Promise<any>> = {
    "google.getDocuments" : ({credentialId}) => api.google.getDocuments(credentialId),
    "google.getSheets" : ({spreadsheetId, credentialId}) => api.google.getSheets(spreadsheetId, credentialId)
  }
  
  // Build interpolation context from all previously tested nodes
  const buildTestContext = (): InterpolationContext => {
    const context: InterpolationContext = {};
    console.log('[buildTestContext] All tested outputs:', allTestedOutputs);
    
    for (const [nodeId, testOutput] of Object.entries(allTestedOutputs)) {
      console.log(`[buildTestContext] Processing node ${nodeId}:`, {
        nodeName: testOutput.nodeName,
        success: testOutput.success,
        hasData: !!testOutput.data
      });
      
      if (testOutput.success && testOutput.data) {
        // Normalize node name: "Google Sheet" -> "google_sheet"
        const normalizedName = testOutput.nodeName.toLowerCase().replace(/\s+/g, '_');
        console.log(`[buildTestContext] Normalized "${testOutput.nodeName}" -> "${normalizedName}"`);
        context[normalizedName] = testOutput.data;
      }
    }
    
    console.log('[buildTestContext] Final context:', context);
    return context;
  };

  // Test the current node and store output in Redux
  const handleTestNode = async () => {
    if (!selectedNode) return;
    
    console.log('[ConfigModal] Testing node:', selectedNode.id, selectedNode.name);
    dispatch(setNodeLoading({ nodeId: selectedNode.id, loading: true }));
    
    try {
      // Build context from previously tested nodes for variable resolution
      const interpolationContext = buildTestContext();
      console.log('[ConfigModal] Interpolation context:', interpolationContext);
      
      // Resolve any {{variable}} in the config before testing
      const resolvedConfig = resolveConfigVariables(config, interpolationContext);
      console.log('[ConfigModal] Original config:', config);
      console.log('[ConfigModal] Resolved config:', resolvedConfig);
      
      // Check if any variables couldn't be resolved
      const unresolvedVars = Object.entries(resolvedConfig)
        .filter(([_, value]) => typeof value === 'string' && value.includes('{{'))
        .map(([key, value]) => `${key}: ${value}`);
      
      if (unresolvedVars.length > 0) {
        toast.warning(`Some variables couldn't be resolved. Test the previous nodes first.\n${unresolvedVars.join('\n')}`);
      }
      
      const response = await api.execute.node(selectedNode.id, resolvedConfig);
      console.log('[ConfigModal] API response (already extracted output):', response);
      
      // api.execute.node already returns res.data.data.output directly
      const outputData = response;
      console.log('[ConfigModal] Output data for extraction:', outputData);
      
      // Extract variables from the output for the variable panel
      const extractedVariables = extractVariablesFromOutput(outputData);
      console.log('[ConfigModal] Extracted variables:', extractedVariables);
      
      // Convert to VariableDefinition format
      const variables: VariableDefinition[] = extractedVariables.map(v => ({
        name: v.name,
        path: v.path,
        type: v.type as any,
        sampleValue: v.sampleValue
      }));
      
      // Store in Redux
      const testOutput: NodeTestOutput = {
        nodeId: selectedNode.id,
        nodeName: selectedNode.name || selectedNode.data?.label || 'Node',
        nodeType: selectedNode.type || '',
        data: outputData,
        variables,
        testedAt: Date.now(),
        success: true
      };
      
      dispatch(setNodeOutput(testOutput));
      setTestResult(outputData);
      toast.success("Node test successful!");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Test failed";
      
      dispatch(setNodeOutput({
        nodeId: selectedNode.id,
        nodeName: selectedNode.name || 'Node',
        nodeType: selectedNode.type || '',
        data: null,
        variables: [],
        testedAt: Date.now(),
        success: false,
        error: errorMessage
      }));
      
      toast.error(`Test failed: ${errorMessage}`);
    }
  };

  const handleVariableInsert = (variableSyntax: string)=>  {
    if(!activeField) return;

    const currentValue = config[activeField] || "";
    setConfig({...config, [activeField]: currentValue + variableSyntax})
  }

  const handleFieldChange = async (fieldName: string, value: string, nodeConfig: any) => {
    // Update config with new value
    const updatedConfig = ({ ...config, [fieldName]: value })
    console.log(fieldName, " ", value, " ", nodeConfig)
    console.log(config, "from handle field function - 1")
    setConfig((prev) => ({ ...prev, [fieldName]: value }));
    console.log(config, "from handle field fun - 2")
    console.log({ ...config, [fieldName]: value }, "what we're setting")
    // Find fields that depend on this field
    const dependentFields = nodeConfig.fields.filter((f:any) => f.dependsOn === fieldName);
    
    for (const depField of dependentFields) {
      const fetchFn = depField.fetchOptions ? fetchOptionsMap[depField.fetchOptions] : undefined;
      console.log(fetchFn, "fecth FN")
      if (fetchFn) {
        const options = await fetchFn(updatedConfig);
        // console.log(({ ...config, [depField.name]: options }), "optiops setting")
        setDynamicOptions((prev) => ({ ...prev, [depField.name]: options }));
      }
    }
  };
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

  const renderField = (field: any, nodeConfig: any) => {
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
                onFocus={()=> setActiveField(field.name)}
                onChange={async(e) => {
                  await handleFieldChange(field.name, e.target.value, nodeConfig);
                  console.log(field.name, nodeConfig, e.target.value)
                }}
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
      // Use dynamicOptions if available, otherwise fall back to field.options
      const options = dynamicOptions[field.name] || field.options || [];
      return (
        <div key={field.name} className="form-group">
          <label className="block text-sm font-medium text-white mb-1">
            {field.label}
            {field.required && <span className="text-red-400">*</span>}
          </label>
          <select
            value={fieldValue}
            onFocus={()=> setActiveField(field.name)}
            onChange={async(e) => {
              console.log("log for options: ",fieldValue)
              await handleFieldChange(field.name, e.target.value, nodeConfig);
            }}
            className="w-full p-3 border border-gray-900 bg-black text-white rounded-md"
            required={field.required}
          >
            {console.log(options)}
            <option value="">Select {field.label.toLowerCase()}</option>
            {options.map((opt: any) => (
              <option key={opt.value || opt.id || opt} value={opt.value || opt.id !== undefined ? opt.id : opt }>
                {opt.label || opt.name || opt}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (field.type === "text") {
      return (
        <div key={field.name} className="form-group">
          <label className="block text-sm font-medium text-white mb-1">
            {field.label}
            {field.required && <span className="text-red-400">*</span>}
          </label>
          <textarea
            value={fieldValue}
            placeholder={field.placeholder}
            onFocus={()=> setActiveField(field.name)}
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
          onFocus={()=> setActiveField(field.name)}
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
      <VariablePanel
        previousNodes={previousNodes}
        onInsert={handleVariableInsert}
        activeField={activeField}
        />
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
                {nodeConfig.fields.map((field) => renderField(field, nodeConfig))}
              </div>
            );
          })()}
          
          {/* Test Result Display */}
          {testResult && (
            <div className="mt-4 p-3 rounded-lg bg-green-900/30 border border-green-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-400">✅ Test Output</span>
                <button 
                  onClick={() => setTestResult(null)}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  Clear
                </button>
              </div>
              <pre className="text-xs text-gray-300 overflow-auto max-h-32">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
          
          {/* Test Error Display */}
          {nodeTestOutput?.error && (
            <div className="mt-4 p-3 rounded-lg bg-red-900/30 border border-red-700">
              <span className="text-sm font-medium text-red-400">❌ Test Failed</span>
              <p className="text-xs text-gray-300 mt-1">{nodeTestOutput.error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="p-6 border-t border-gray-900 flex justify-between gap-3"
          style={{ background: "#181818" }}
        >
          <button
            onClick={handleTestNode}
            disabled={isTestingNode || loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50 flex items-center gap-2"
            type="button"
          >
            {isTestingNode ? (
              <>
                <span className="animate-spin">⏳</span>
                Testing...
              </>
            ) : (
              <>
                🧪 Test Node
              </>
            )}
          </button>
          
          <div className="flex gap-3">
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
    </div>
  );
}
