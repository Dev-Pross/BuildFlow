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
import { workflowActions } from "@/store/slices/workflowSlice";
import { TestPanel } from "@/app/components/ui/TestPanel";

interface ConfigModalProps {
  isOpen: boolean;
  selectedNode: any | null;
  onClose: () => void;
  workflowId?: string;
  previousNodes: PreviousNodeOutput[];
}

export default function ConfigModal({
  isOpen,
  selectedNode,
  onClose,
  workflowId,
  previousNodes,
}: ConfigModalProps) {
  const [config, setConfig] = useState<Record<string, any>>({});
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  // Reset test result when switching to a different node
  useEffect(() => {
    setTestResult(null);
  }, [selectedNode?.id]);

  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.user.userId) as string;
  const reduxWorkflow = useAppSelector((state) => state.workflow.data);

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
    "google.getDocuments": ({ credentialId }) => api.google.getDocuments(credentialId),
    "google.getSheets": ({ spreadsheetId, credentialId }) => api.google.getSheets(spreadsheetId, credentialId)
  }

  const dispatchConfig = (newConfig: Record<string, any>) => {
    if (!selectedNode) return;
    const isTrigger = reduxWorkflow.trigger?.TriggerId === selectedNode.id;
    if (isTrigger) {
      dispatch(workflowActions.updateTriggerConfig({ config: newConfig }));
    } else {
      dispatch(workflowActions.updateNodeConfig({ nodeId: selectedNode.id, config: newConfig }));
    }
  };

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

  // Test any previous node on the fly from the Variable Panel
  const handleTestPreviousNode = async (nodeId: string) => {
    console.log('[ConfigModal] Testing previous node:', nodeId);
    dispatch(setNodeLoading({ nodeId, loading: true }));

    try {
      // Find the previous node config
      let targetNodeConfig: any = null;
      let targetNodeType = "";
      let targetNodeName = "";

      const isTriggerNode = reduxWorkflow.trigger?.TriggerId === nodeId;
      if (isTriggerNode) {
        targetNodeConfig = reduxWorkflow.trigger?.Config || {};
        targetNodeType = reduxWorkflow.trigger?.type || "webhook";
        targetNodeName = reduxWorkflow.trigger?.name || "Webhook";
      } else {
        const foundNode = reduxWorkflow.nodes.find(n => n.NodeId === nodeId);
        if (foundNode) {
          targetNodeConfig = foundNode.Config || {};
          targetNodeType = foundNode.type || "";
          targetNodeName = foundNode.name || foundNode.name || 'Node';
        }
      }

      if (!targetNodeConfig) {
        throw new Error("Node configuration not found");
      }

      // Build context from previously tested nodes for variable resolution
      const interpolationContext = buildTestContext();

      // Resolve any {{variable}} in the config before testing
      const resolvedConfig = resolveConfigVariables(targetNodeConfig, interpolationContext);

      const response = await api.execute.node(nodeId, resolvedConfig);
      const outputData = response;

      // Extract variables from the output for the variable panel
      const extractedVariables = extractVariablesFromOutput(outputData);

      // Convert to VariableDefinition format
      const variables: VariableDefinition[] = extractedVariables.map(v => ({
        name: v.name,
        path: v.path,
        type: v.type as any,
        sampleValue: v.sampleValue
      }));

      // Store in Redux
      const testOutput: NodeTestOutput = {
        nodeId,
        nodeName: targetNodeName,
        nodeType: targetNodeType,
        data: outputData,
        variables,
        testedAt: Date.now(),
        success: true
      };

      dispatch(setNodeOutput(testOutput));
      toast.success(`${targetNodeName} test successful!`);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || "Test failed";

      dispatch(setNodeOutput({
        nodeId,
        nodeName: 'Node',
        nodeType: '',
        data: null,
        variables: [],
        testedAt: Date.now(),
        success: false,
        error: errorMessage
      }));

      toast.error(`Test failed for previous node: ${errorMessage}`);
    }
  };

  const handleVariableInsert = (variableSyntax: string) => {
    if (!activeField) return;

    const currentValue = config[activeField] || "";
    const newConfig = { ...config, [activeField]: currentValue + variableSyntax };
    setConfig(newConfig)
    dispatchConfig(newConfig)
  }

  const handleFieldChange = async (fieldName: string, value: string, nodeConfig: any) => {
    // Update config with new value
    const updatedConfig = ({ ...config, [fieldName]: value })
    console.log(fieldName, " ", value, " ", nodeConfig)
    console.log(config, "from handle field function - 1")
    setConfig((prev) => ({ ...prev, [fieldName]: value }));
    dispatchConfig(updatedConfig);
    console.log(config, "from handle field fun - 2")
    console.log({ ...config, [fieldName]: value }, "what we're setting")
    // Find fields that depend on this field
    const dependentFields = nodeConfig.fields.filter((f: any) => f.dependsOn === fieldName);

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
    if (!selectedNode) {
      setConfig({});
      return;
    }
    // Load existing saved config from Redux instead of starting empty
    const isTrigger = reduxWorkflow.trigger?.TriggerId === selectedNode.id;
    const loadedConfig = isTrigger ? (reduxWorkflow.trigger?.Config || {}) : (reduxWorkflow.nodes.find(n => n.NodeId === selectedNode.id)?.Config || {})

    setConfig(loadedConfig)

    const nodeConfig = getNodeConfig(selectedNode.name || selectedNode.actionType);
    if (nodeConfig?.fields) {
      for (const field of nodeConfig.fields) {
        if (field.fetchOptions && field.dependsOn && loadedConfig[field.dependsOn]) {
          const fetchFn = fetchOptionsMap[field.fetchOptions];
          if (fetchFn) {
            fetchFn(loadedConfig)
              .then((option: any[]) => setDynamicOptions(prev => ({ ...prev, [field.name]: option })))
              .catch(() => { })
          }
        }
      }
    }
  }, [selectedNode]);

  if (!isOpen || !selectedNode) return null;

  // const handleSave = async () => {
  //   setLoading(true);
  //   try {
  //     await onSave(selectedNode.id, config, userId);
  //     toast.success("Configured Successfully");
  //   } catch {
  //     toast.error("Failed to save config");
  //   } finally {
  //     setLoading(false);
  //     onClose();
  //   }
  // };

  const renderField = (field: any, nodeConfig: any) => {
    const fieldValue = config[field.name] || "";

    if (field.type === "dropdown" && field.name === "credentialId") {
      // Use the values from useCredentials: credentials and authUrl
      return (
        <div key={field.name} className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-300 uppercase tracking-wider">
            {field.label}
            {field.required && <span className="text-rose-400 ml-0.5">*</span>}
          </label>
          {(Array.isArray(credentials) && credentials.length > 0) ? (
            <>
              <select
                value={fieldValue}
                onFocus={() => setActiveField(field.name)}
                onChange={async (e) => {
                  await handleFieldChange(field.name, e.target.value, nodeConfig);
                  console.log(field.name, nodeConfig, e.target.value)
                }}
                className="w-full p-2.5 border border-[#1e293b] bg-[#0a0e17] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none text-sm"
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
                    className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 text-xs rounded-full border border-emerald-500/20 font-medium"
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
                    className="w-full p-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
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
            onFocus={() => setActiveField(field.name)}
            onChange={async (e) => {
              console.log("log for options: ", fieldValue)
              await handleFieldChange(field.name, e.target.value, nodeConfig);
            }}
            className="w-full p-2.5 border border-[#1e293b] bg-[#0a0e17] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none text-sm"
            required={field.required}
          >
            {console.log(options)}
            <option value="">Select {field.label.toLowerCase()}</option>
            {options.map((opt: any) => (
              <option key={opt.value || opt.id || opt} value={opt.value || opt.id !== undefined ? opt.id : opt}>
                {opt.label || opt.name || opt}
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
            onFocus={() => setActiveField(field.name)}
            onChange={(e) => {
              const newConfig = { ...config, [field.name]: e.target.value };
              setConfig(newConfig)
              dispatchConfig(newConfig)
            }
            }
            className="w-full p-2.5 border border-[#1e293b] bg-[#0a0e17] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none text-sm placeholder-gray-600 resize-none"
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
          onFocus={() => setActiveField(field.name)}
          placeholder={field.placeholder}
          onChange={(e) => {
            const newConfig = { ...config, [field.name]: e.target.value };
            setConfig(newConfig)
            dispatchConfig(newConfig)
          }
          }
          className="w-full p-2.5 border border-[#1e293b] bg-[#0a0e17] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none text-sm placeholder-gray-600"
          required={field.required}
        />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Main container */}
      <div className="fixed inset-0 flex gap-0 items-center m-3 p-1.5 rounded-2xl justify-between z-50 bg-gradient-to-br from-[#0a0e17] via-[#0d1219] to-[#0a0e17] border border-[#1e293b]/60 shadow-2xl shadow-black/50">
        <VariablePanel
          previousNodes={previousNodes}
          onInsert={handleVariableInsert}
          activeField={activeField}
          onTestNode={handleTestPreviousNode}
        />
        <div className="rounded-xl max-w-md w-full h-[92%] overflow-y-auto py-1 flex flex-col bg-[#0f1420]/90 border border-[#1e293b]/40 shadow-inner">
          {/* Header */}
          <div className="p-5 border-b border-[#1e293b]/60 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-[#0f1420] to-[#141c2b]">
            <h2 className="text-lg font-semibold flex items-center gap-3 text-gray-100">
              {selectedNode.icon && <img src={selectedNode.icon} className="w-10 h-8 rounded-lg bg-white/10 p-1 border border-white/5" />}
              {selectedNode.name}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-200 hover:bg-white/5 transition-colors"
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5">
            {/* Node info */}
            <div className="p-3.5 rounded-xl bg-[#141c2b]/80 border border-[#1e293b]/40">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">ID</span>
                  <span className="text-gray-400 font-mono bg-[#0a0e17] px-2 py-0.5 rounded">{selectedNode.id}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">Type</span>
                  <span className="text-indigo-400 font-medium bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">{selectedNode.type ?? "Trigger"}</span>
                </div>
              </div>
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
            {/* {testResult && (
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
            )} */}

            {/* Test Error Display */}
            {/* {nodeTestOutput?.error && (
              <div className="mt-4 p-3 rounded-lg bg-red-900/30 border border-red-700">
                <span className="text-sm font-medium text-red-400">❌ Test Failed</span>
                <p className="text-xs text-gray-300 mt-1">{nodeTestOutput.error}</p>
              </div>
            )} */}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#1e293b]/60 flex justify-between items-center gap-3 bg-gradient-to-r from-[#0f1420] to-[#141c2b] flex-shrink-0">
            {!selectedNode.name.includes("webhook") &&
              <button
                onClick={handleTestNode}
                disabled={isTestingNode || loading}
                className="px-4 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl disabled:opacity-40 flex items-center gap-2 text-sm font-medium transition-all shadow-lg shadow-purple-500/20 disabled:shadow-none"
                type="button"
              >
                {isTestingNode ? (
                  <>
                    <span className="w-4 h-4 border-2 border-t-transparent border-white/60 rounded-full animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    Test Node
                  </>
                )}
              </button>
            }
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => onClose()}
                disabled={loading}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-gray-200 rounded-xl disabled:opacity-50 text-sm font-medium transition-all border border-white/10 hover:border-white/20"
                type="button"
              >
                Done
              </button>
            </div>
          </div>
        </div>
        <TestPanel testResult={testResult} nodeName={selectedNode?.name} nodeIcon={selectedNode?.icon} />
      </div>
    </div>
  );
}
