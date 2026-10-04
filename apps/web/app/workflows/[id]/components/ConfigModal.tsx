"use client";
import { getNodeConfig } from "@/app/lib/nodeConfigs";
import { useEffect, useState, useRef } from "react";
import { HOOKS_URL } from "@repo/common/zod";
import { extractVariablesFromOutput, resolveConfigVariables, InterpolationContext } from "@repo/common/zod";
import { useAppSelector, useAppDispatch } from "@/app/hooks/redux";
import { toast } from "sonner";
import { useCredentials } from "@/app/hooks/useCredential";
import { api } from "@/app/lib/api";
import { ConfigField, NodeConfig, PreviousNodeOutput, VariableDefinition } from "@/app/lib/types/node.types";
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
import { RichVariableInput } from "@/app/components/ui/RichVariableInput";
import { Group, Panel, Separator } from "react-resizable-panels";
import { NodeIcon } from "@/app/components/ui/NodeIcon";

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
  const [activeSubField, setActiveSubField] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [isLoadingHeaders, setIsLoadingHeaders] = useState(false);
  const [customRowKeys, setCustomRowKeys] = useState<Record<string, boolean>>({});

  // Reset test result when switching to a different node
  useEffect(() => {
    setTestResult(null);
  }, [selectedNode?.id]);

  // Add a ref to track which sheet's headers are currently loaded
  const loadedSheetRef = useRef<string>("");


  const dispatch = useAppDispatch();
  const userId = useAppSelector((state) => state.user.userId) as string;
  const reduxWorkflow = useAppSelector((state) => state.workflow.data);

  // Get all tested outputs from Redux (for variable resolution)
  const allTestedOutputs = useAppSelector(selectAllOutputs);

  const availableNodes = Object.entries(allTestedOutputs).map(([id, output]) => ({
    id,
    name: output.nodeName || 'Node'
  }));

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
    const nameCounts: Record<string, number> = {};
    console.log('[buildTestContext] All tested outputs:', allTestedOutputs);

    for (const [nodeId, testOutput] of Object.entries(allTestedOutputs)) {
      console.log(`[buildTestContext] Processing node ${nodeId}:`, {
        nodeName: testOutput.nodeName,
        success: testOutput.success,
        hasData: !!testOutput.data
      });

      if (testOutput.success && testOutput.data) {
        // Normalize node name: "Google Sheet" -> "google_sheet"
        const baseName = testOutput.nodeName
          .replace(/ Output$/i, '')
          .replace(/ Node$/i, '')
          .toLowerCase()
          .replace(/\s+/g, '_');
        console.log(`[buildTestContext] Normalized "${testOutput.nodeName}" -> "${baseName}"`);

        context[nodeId] = testOutput.data;

        if (!nameCounts[baseName]) {
          nameCounts[baseName] = 1;
          context[baseName] = testOutput.data; // e.g. "google_sheet"
        } else {
          nameCounts[baseName]++;
          const uniqueKey = `${baseName}_${nameCounts[baseName]}`; // e.g. "google_sheet_2"
          context[uniqueKey] = testOutput.data;
        }
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

      // api.execute.node now returns full executionResult
      const outputData = response.output;
      const metadata = response.metadata;
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
        metadata: metadata,
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
      const outputData = response.output;
      const metadata = response.metadata;

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
        metadata: metadata,
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

    if (activeField === "mappedColumns" && activeSubField) {
      const currentMapped = config.mappedColumns || {};
      const currentVal = currentMapped[activeSubField] || "";
      const updatedMapped = { ...currentMapped, [activeSubField]: currentVal + variableSyntax };

      const newConfig = { ...config, mappedColumns: updatedMapped };
      setConfig(newConfig);
      dispatchConfig(newConfig);
      return;
    }

    if (activeSubField?.startsWith("row-") && Array.isArray(config[activeField])) {
      const index = parseInt(activeSubField.replace("row-", ""), 10);
      if (!isNaN(index) && config[activeField][index]) {
        const rows = [...config[activeField]];
        rows[index] = { ...rows[index], value: (rows[index].value || "") + variableSyntax };
        const newConfig = { ...config, [activeField]: rows };
        setConfig(newConfig);
        dispatchConfig(newConfig);
        return;
      }
    }

    const currentValue = config[activeField] || "";
    const newConfig = { ...config, [activeField]: currentValue + variableSyntax };
    setConfig(newConfig);
    dispatchConfig(newConfig);
  };


  const handleFieldChange = async (fieldName: string, value: string, nodeConfig: any) => {
    // Update config with new value
    const updatedConfig = ({ ...config, [fieldName]: value })

    if (fieldName === "operation") {
      const fieldDef = nodeConfig.fields?.find((f: any) => f.name === fieldName);
      if (fieldDef && fieldDef.options) {
        const selectedOption = fieldDef.options.find((opt: any) => (opt.id || opt.value) === value);
        if (selectedOption && selectedOption.outputs) {
          updatedConfig.outputs = selectedOption.outputs; // Inject the outputs!
        }
      }
    }

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

    if ((fieldName === 'sheetName' || fieldName === 'spreadsheetId' || fieldName === "operation") && updatedConfig.sheetName) {
      const { credentialId, spreadsheetId, sheetName, operation } = updatedConfig;

      if (credentialId && spreadsheetId && sheetName && ["append_rows", "write_rows"].includes(operation)) {
        setIsLoadingHeaders(true);
        try {
          const headers = await api.google.getHeaders(credentialId, spreadsheetId, sheetName);
          setSheetHeaders(headers || []);
        } catch (e) {
          console.error("Failed to load sheet headers", e);
        } finally {
          setIsLoadingHeaders(false);
        }
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
    let finalConfig = { ...loadedConfig };

    if (nodeConfig?.fields) {
      for (const field of nodeConfig.fields) {
        if (field.defaultValue !== undefined && finalConfig[field.name] === undefined) {
          finalConfig[field.name] = field.defaultValue;
        }
      }
    }
    setConfig(finalConfig);

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

      if (loadedConfig.credentialId && loadedConfig.spreadsheetId && loadedConfig.sheetName && ["append_rows", "write_rows"].includes(loadedConfig.operation)) {
        setIsLoadingHeaders(true)
        api.google.getHeaders(loadedConfig.credentialId, loadedConfig.spreadsheetId, loadedConfig.sheetName)
          .then((headers) => setSheetHeaders(headers || []))
          .catch((e) => console.error("Failed to load sheet headers", e))
          .finally(() => setIsLoadingHeaders(false));
      }
    }
  }, [selectedNode?.id]);

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

  const isFieldVisible = (field: ConfigField, formData: any) => {
    // 1. Explicit field-level dependency check (e.g. body depends on method !== 'GET')
    if (field.dependsOn && field.showForOperation) {
      const parentVal = formData[field.dependsOn] ?? (field.dependsOn === "method" ? "GET" : undefined);
      if (!parentVal || !field.showForOperation.includes(parentVal)) {
        return false;
      }
    }

    const currentOps = formData.operation || "read_rows";

    // 2. Fall back to operation check only if field does not have a custom dependsOn
    if (!field.dependsOn && field.showForOperation && (!field.showForOperation.includes(currentOps)))
      return false;

    if (field.name === 'range') {
      if (currentOps === 'read_rows' && (formData.fetchEntireTable ?? true))
        return false
      if (currentOps === 'clear_rows' && (formData.clearEntireTable ?? true))
        return false
      if (currentOps === 'write_rows')
        return true
    }

    if (field.name === 'includeHeaderRow') {
      if (currentOps === 'clear_rows' && !(formData.clearEntireTable ?? true))
        return false
    }

    if (field.name === 'mappedColumns')
      return (config.mappingMode ?? 'visual') === 'visual'

    if (field.name === 'bulkValues')
      return config.mappingMode === 'bulk'
    return true
  }

  const extractSchemaKeys = (data: any): string[] => {
    if (!Array.isArray(data)) return ["Invalid Data (Expected an Array)"];
    if (data.length === 0) return ["(Array is Empty - No Keys Found)"];
    if (typeof data[0] !== 'object' || data[0] === null) return ["(Value Itself)"];
    if (Array.isArray(data[0])) {
      return data[0].map((h: any) => String(h));
    }

    const keys: string[] = [];
    const extractKeysRecursive = (obj: any, prefix = "") => {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const newKey = prefix ? `${prefix}.${key}` : key;
          const value = obj[key];
          if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            extractKeysRecursive(value, newKey);
          } else {
            keys.push(newKey);
          }
        }
      }
    };

    const itemToInspect = (data[0] && typeof data[0] === 'object' && 'json' in data[0]) ? data[0].json : data[0];
    extractKeysRecursive(itemToInspect);
    return Array.from(new Set(keys));
  };

  const renderField = (field: ConfigField, nodeConfig: any) => {
    const fieldValue = config[field.name] ?? field.defaultValue ?? "";
    const isRequired = field.required || (field.name === "range" && config.operation === "write_rows");

    if (field.type === "dynamic_schema_dropdown") {
      let options: string[] = ["(No Data Mapped)"];

      const dependentFieldName = field.name === "sourceKey" ? "sourceData" : "referenceData";
      const dependentFieldValue = config[dependentFieldName];

      if (dependentFieldValue && typeof dependentFieldValue === 'string') {
        const interpolationContext = buildTestContext();
        const resolvedConfig = resolveConfigVariables({ temp: dependentFieldValue }, interpolationContext);
        const resolvedData = resolvedConfig.temp;

        if (resolvedData !== dependentFieldValue) {
          options = extractSchemaKeys(resolvedData);
        } else {
          options = ["(Test Node to Load Options)"];
        }
      }

      return (
        <div key={field.name} className="form-group">
          <label className="block text-sm font-medium text-white mb-1">
            {field.label}
            {field.required && <span className="text-red-400">*</span>}
          </label>
          <select
            value={fieldValue}
            onFocus={() => setActiveField(field.name)}
            onChange={(e) => {
              const newConfig = { ...config, [field.name]: e.target.value };
              setConfig(newConfig);
              dispatchConfig(newConfig);
            }}
            className="w-full p-2.5 border border-[#1e293b] bg-[#0a0e17] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none text-sm"
            required={field.required}
          >
            <option value="">Select {field.label.toLowerCase()}</option>
            {options.map((opt) => {
              let val = opt;
              if (opt === "(Value Itself)") val = "__value__";
              else if (opt.startsWith("(")) val = "";

              return (
                <option key={opt} value={val} disabled={opt.startsWith("(") && opt !== "(Value Itself)"}>
                  {opt}
                </option>
              );
            })}
          </select>
        </div>
      );
    }

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
                    {cred.config.email || cred.name || "Google Account"}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2 mt-2">
                {credentials.map((cred: any) => (
                  <span
                    key={cred.id}
                    className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 text-xs rounded-full border border-emerald-500/20 font-medium"
                  >
                    {cred.config?.email || cred.name}
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
            {/* {console.log(options)} */}
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
          {/* <textarea
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
          /> */}
          <RichVariableInput
            value={fieldValue || ''}
            placeholder={field.placeholder}
            onFocus={() => setActiveField(field.name)}
            onChange={(newValue) => {
              const newConfig = { ...config, [field.name]: newValue };
              setConfig(newConfig);
              dispatchConfig(newConfig);
            }}
            availableNodes={availableNodes}
          />

        </div>
      );
    }

    if (field.type === 'checkbox') {
      const isChecked = Boolean(fieldValue ?? field.defaultValue ?? true)

      return (
        <div key={field.name} className="flex items-center gap-3 p-2 bg-[#0a0e17] rounded-lg border border-[#1e293b]">
          <input
            type="checkbox"
            id={field.name}
            checked={isChecked}
            onChange={(e) => {
              const newConfig = { ...config, [field.name]: e.target.checked };
              setConfig(newConfig);
              dispatchConfig(newConfig);
            }}
            className="w-4 h-4 text-indigo-600 bg-gray-900 border-gray-700 rounded focus:ring-indigo-500"
          />
          <label htmlFor={field.name} className="text-sm font-medium text-gray-200 cursor-pointer">
            {field.label}
          </label>
        </div>
      )
    }

    if (field.type === 'column_mapper') {
      const mappedValues = config[field.name] || {};
      const mappedKeys = Object.keys(mappedValues);

      // Filter out headers that are already mapped
      const availableHeaders = sheetHeaders.filter(h => !mappedKeys.includes(h));

      return (
        <div key={field.name} className="flex flex-col gap-3 p-4 bg-[#0f141f] rounded-lg border border-[#1e293b]">
          <label className="text-sm font-medium text-gray-200">{field.label}</label>

          {isLoadingHeaders ? (
            <div className="text-sm text-gray-400">Loading columns from Google Sheets...</div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {mappedKeys.map((header) => (
                  <div key={header} className="flex items-center gap-2">
                    <div className="w-1/3 text-sm text-gray-400 truncate" title={header}>
                      {header}
                    </div>
                    <div className="flex-1">
                      <RichVariableInput
                        value={mappedValues[header] || ""}
                        onChange={(val) => {
                          const newMapped = { ...mappedValues, [header]: val };
                          const newConfig = { ...config, [field.name]: newMapped };
                          setConfig(newConfig);
                          dispatchConfig(newConfig);
                        }}
                        availableNodes={previousNodes.map(n => ({ id: n.nodeId, name: n.nodeName }))}
                        onFocus={() => {
                          setActiveField(field.name);
                          setActiveSubField(header);
                        }}
                        placeholder="Enter value..."
                      />
                    </div>
                    <button
                      onClick={() => {
                        const newMapped = { ...mappedValues };
                        delete newMapped[header];
                        const newConfig = { ...config, [field.name]: newMapped };
                        setConfig(newConfig);
                        dispatchConfig(newConfig);
                      }}
                      className="p-2 text-gray-500 hover:text-red-400"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              {availableHeaders.length > 0 && (
                <div className="mt-2">
                  <select
                    className="w-full p-2 bg-[#0a0e17] border border-gray-700 rounded-md text-sm text-gray-400 outline-none cursor-pointer hover:border-gray-600"
                    value=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const newMapped = { ...mappedValues, [e.target.value]: "" };
                      const newConfig = { ...config, [field.name]: newMapped };
                      setConfig(newConfig);
                      dispatchConfig(newConfig);
                    }}
                  >
                    <option value="">+ Add Column to Map</option>
                    {availableHeaders.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
        </div>
      );
    }

    if (field.type === "key_value_pairs") {
      const rawValue = config[field.name];
      let pairs: Array<{ id: string; key: string; value: string }> = [];

      if (Array.isArray(rawValue)) {
        pairs = rawValue.map((item, idx) => ({
          id: item.id || `pair-${idx}`,
          key: item.key || "",
          value: item.value || ""
        }));
      } else if (rawValue && typeof rawValue === "object") {
        pairs = Object.entries(rawValue).map(([k, v], idx) => ({
          id: `pair-${idx}`,
          key: k,
          value: String(v ?? "")
        }));
      }

      // Normalize common keys: supports string[] or CommonKeyPreset[]
      const presets: Array<{ key: string; label: string; description?: string; defaultValue?: string }> =
        (field.commonKeys || []).map((k: any) =>
          typeof k === "string"
            ? { key: k, label: k, description: "", defaultValue: "" }
            : {
                key: k.key,
                label: k.label || k.key,
                description: k.description || "",
                defaultValue: k.defaultValue || ""
              }
        );
      const hasPresets = presets.length > 0;

      const updatePairs = (newPairs: Array<{ id: string; key: string; value: string }>) => {
        const newConfig = { ...config, [field.name]: newPairs };
        setConfig(newConfig);
        dispatchConfig(newConfig);
      };

      const handleAddRow = () => {
        updatePairs([...pairs, { id: `pair-${Date.now()}`, key: "", value: "" }]);
      };

      const handleDeleteRow = (index: number) => {
        const updated = pairs.filter((_, i) => i !== index);
        updatePairs(updated);
      };

      const handleKeyChange = (index: number, newKey: string) => {
        const updated = pairs.map((pair, i) =>
          i === index ? { ...pair, key: newKey } : pair
        );
        updatePairs(updated);
      };

      const handleValChange = (index: number, newVal: string) => {
        const updated = pairs.map((pair, i) =>
          i === index ? { ...pair, value: newVal } : pair
        );
        updatePairs(updated);
      };

      return (
        <div key={field.name} className="space-y-2 p-3.5 bg-[#0c1017] rounded-xl border border-[#1e293b]/70">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-semibold text-gray-200 uppercase tracking-wider">
                {field.label}
                {field.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              {field.description && (
                <p className="text-[11px] text-gray-400 mt-0.5">{field.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddRow}
              className="px-2.5 py-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-lg transition-colors flex items-center gap-1"
            >
              <span>+</span> Add {field.label.replace(/s$/, '') || "Row"}
            </button>
          </div>

          {!hasPresets && field.commonKeys && field.commonKeys.length > 0 && (
            <datalist id={`datalist-${field.name}`}>
              {field.commonKeys.map((k: any) => (
                <option key={typeof k === "string" ? k : k.key} value={typeof k === "string" ? k : k.key} />
              ))}
            </datalist>
          )}

          {pairs.length === 0 ? (
            <div className="py-3 px-3 text-center rounded-lg border border-dashed border-gray-800 text-xs text-gray-500">
              No {field.label.toLowerCase()} added. Click{" "}
              <button
                type="button"
                className="text-indigo-400 hover:underline font-medium"
                onClick={handleAddRow}
              >
                + Add
              </button>{" "}
              to create one.
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              <div className="grid grid-cols-[1fr_1.5fr_32px] gap-2 px-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                <span>Key</span>
                <span>Value</span>
                <span></span>
              </div>
              {pairs.map((pair, index) => {
                const pairId = pair.id || `pair-${index}`;
                const isKnownPreset = presets.some((p) => p.key === pair.key);
                const isCustomMode = customRowKeys[pairId] || (!isKnownPreset && pair.key !== "");

                return (
                  <div key={pairId} className="grid grid-cols-[1fr_1.5fr_32px] gap-2 items-center">
                    {hasPresets ? (
                      isCustomMode ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={pair.key}
                            placeholder="Custom header name..."
                            onChange={(e) => handleKeyChange(index, e.target.value)}
                            className="w-full p-2.5 bg-[#06090e] border border-[#1e293b] text-xs text-gray-200 rounded-lg outline-none focus:border-indigo-500/50 transition-colors font-mono"
                          />
                          <button
                            type="button"
                            title="Switch back to header dropdown"
                            onClick={() => {
                              setCustomRowKeys((prev) => ({ ...prev, [pairId]: false }));
                              handleKeyChange(index, "");
                            }}
                            className="p-2 text-gray-400 hover:text-indigo-400 text-xs bg-[#0a0e17] border border-[#1e293b] rounded-lg"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <select
                          value={isKnownPreset ? pair.key : ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "__custom__") {
                              setCustomRowKeys((prev) => ({ ...prev, [pairId]: true }));
                              handleKeyChange(index, "");
                            } else {
                              const selectedPreset = presets.find((p) => p.key === val);
                              handleKeyChange(index, val);
                              if (selectedPreset && selectedPreset.defaultValue && !pair.value) {
                                handleValChange(index, selectedPreset.defaultValue);
                              }
                            }
                          }}
                          className="w-full p-2.5 bg-[#06090e] border border-[#1e293b] text-xs text-gray-200 rounded-lg outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
                        >
                          <option value="">Select header...</option>
                          {presets.map((p) => (
                            <option key={p.key} value={p.key}>
                              {p.label} {p.description ? `— ${p.description}` : ""}
                            </option>
                          ))}
                          <option value="__custom__">+ Custom Header... (enter custom key)</option>
                        </select>
                      )
                    ) : (
                      <input
                        type="text"
                        list={field.commonKeys ? `datalist-${field.name}` : undefined}
                        value={pair.key}
                        placeholder="Key"
                        onChange={(e) => handleKeyChange(index, e.target.value)}
                        className="w-full p-2.5 bg-[#06090e] border border-[#1e293b] text-xs text-gray-200 rounded-lg outline-none focus:border-indigo-500/50 transition-colors"
                      />
                    )}
                    <RichVariableInput
                      value={pair.value}
                      placeholder="Value (or {{variable}})..."
                      onChange={(val) => handleValChange(index, val)}
                      onFocus={() => {
                        setActiveField(field.name);
                        setActiveSubField(`row-${index}`);
                      }}
                      availableNodes={availableNodes}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(index)}
                      className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-xs"
                      title="Delete row"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    if (field.type === "json") {
      const rawJson = String(fieldValue ?? "");
      let isValidJson = true;
      let jsonError: string | null = null;

      if (rawJson.trim()) {
        try {
          // Mask {{variable}} tags with a safe string literal to avoid false syntax errors
          const masked = rawJson.replace(/\{\{[^}]+\}\}/g, '"__BF_VAR__"');
          JSON.parse(masked);
        } catch (err: any) {
          isValidJson = false;
          jsonError = err.message || "Invalid JSON syntax";
        }
      }

      const handleFormatJson = () => {
        if (!rawJson.trim()) return;
        try {
          const parsed = JSON.parse(rawJson);
          const formatted = JSON.stringify(parsed, null, 2);
          const newConfig = { ...config, [field.name]: formatted };
          setConfig(newConfig);
          dispatchConfig(newConfig);
          toast.success("JSON formatted");
        } catch {
          toast.error("Cannot auto-format: please check JSON syntax first");
        }
      };

      const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Tab") {
          e.preventDefault();
          const target = e.currentTarget;
          const start = target.selectionStart;
          const end = target.selectionEnd;
          const current = target.value;
          const updated = current.substring(0, start) + "  " + current.substring(end);
          const newConfig = { ...config, [field.name]: updated };
          setConfig(newConfig);
          dispatchConfig(newConfig);

          setTimeout(() => {
            target.selectionStart = target.selectionEnd = start + 2;
          }, 0);
        }
      };

      return (
        <div key={field.name} className="space-y-2 p-3.5 bg-[#0c1017] rounded-xl border border-[#1e293b]/70">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="block text-xs font-semibold text-gray-200 uppercase tracking-wider">
                {field.label}
                {isRequired && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              {rawJson.trim() ? (
                isValidJson ? (
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Valid JSON
                  </span>
                ) : (
                  <span
                    className="px-2 py-0.5 text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30 rounded-full flex items-center gap-1 cursor-help"
                    title={jsonError || "Invalid JSON"}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Invalid JSON
                  </span>
                )
              ) : (
                <span className="text-[10px] text-gray-500">Optional</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleFormatJson}
              className="px-2.5 py-0.5 text-[11px] font-medium text-gray-400 hover:text-indigo-300 hover:bg-indigo-500/10 border border-gray-700 hover:border-indigo-500/30 rounded transition-colors"
              title="Format JSON indentation"
            >
              Prettify
            </button>
          </div>

          {field.description && (
            <p className="text-[11px] text-gray-400">{field.description}</p>
          )}

          {jsonError && rawJson.trim() && (
            <p className="text-[11px] text-rose-400 font-mono bg-rose-500/10 p-2 rounded border border-rose-500/20 truncate" title={jsonError}>
              ⚠️ {jsonError}
            </p>
          )}

          <div className="relative">
            <textarea
              value={rawJson}
              placeholder={field.placeholder || '{\n  "key": "value"\n}'}
              rows={6}
              onFocus={() => {
                setActiveField(field.name);
                setActiveSubField(null);
              }}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                const newConfig = { ...config, [field.name]: e.target.value };
                setConfig(newConfig);
                dispatchConfig(newConfig);
              }}
              className="w-full p-3 bg-[#06090e] border border-[#1e293b] text-xs font-mono text-emerald-300 rounded-lg outline-none focus:border-indigo-500/50 transition-colors resize-y leading-relaxed placeholder-gray-600"
              spellCheck={false}
            />
          </div>
          <div className="text-[10px] text-gray-500 flex items-center justify-between">
            <span>Supports <kbd className="text-gray-400 font-mono bg-gray-800 px-1 rounded">Tab</kbd> indentation &amp; variable drops</span>
            <span>Lines: {rawJson ? rawJson.split('\n').length : 0}</span>
          </div>
        </div>
      );
    }

    if (field.type === "number") {
      return (
        <div key={field.name} className="form-group">
          <label className="block text-sm font-medium text-white mb-1">
            {field.label}
            {isRequired && <span className="text-red-400 ml-0.5">*</span>}
          </label>
          <input
            type="number"
            value={fieldValue ?? field.defaultValue ?? ""}
            placeholder={field.placeholder}
            onFocus={() => setActiveField(field.name)}
            onChange={(e) => {
              const numVal = e.target.value === "" ? "" : Number(e.target.value);
              const newConfig = { ...config, [field.name]: numVal };
              setConfig(newConfig);
              dispatchConfig(newConfig);
            }}
            className="w-full p-2.5 border border-[#1e293b] bg-[#0a0e17] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none text-sm"
          />
        </div>
      );
    }

    return (
      <div key={field.name} className="form-group">
        <label className="block text-sm font-medium text-white mb-1">
          {field.label}
          {isRequired && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        <RichVariableInput
          value={String(fieldValue ?? "")}
          placeholder={field.placeholder}
          onFocus={() => setActiveField(field.name)}
          onChange={(newValue) => {
            const newConfig = { ...config, [field.name]: newValue };
            setConfig(newConfig);
            dispatchConfig(newConfig);
          }}
          availableNodes={availableNodes}
        />
      </div>
    );

    // return (
    //   <div key={field.name} className="form-group">
    //     <label className="block text-sm font-medium text-white mb-1">
    //       {field.label}
    //       {field.required && <span className="text-red-400">*</span>}
    //     </label>
    //     <input
    //       type={field.type}
    //       value={fieldValue}
    //       onFocus={() => setActiveField(field.name)}
    //       placeholder={field.placeholder}
    //       onChange={(e) => {
    //         const newConfig = { ...config, [field.name]: e.target.value };
    //         setConfig(newConfig)
    //         dispatchConfig(newConfig)
    //       }
    //       }
    //       className="w-full p-2.5 border border-[#1e293b] bg-[#0a0e17] text-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all outline-none text-sm placeholder-gray-600"
    //       required={field.required}
    //     />
    //   </div>
    // );
  };

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Main container */}
      <div className="fixed inset-0 m-3 p-2 rounded-2xl z-50 bg-gradient-to-br from-[#0a0e17] via-[#0d1219] to-[#0a0e17] border border-[#1e293b]/60 shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
        <Group orientation="horizontal" id="buildflow-node-config-panels" className="w-full h-full flex items-stretch gap-0">
          {/* Left Panel: Variable / Data Mapping */}
          <Panel id="variable-panel" defaultSize="30%" minSize="20%" maxSize="45%" className="h-full min-h-0 min-w-0 flex flex-col p-1.5">
            <div className="w-full h-full min-h-0 rounded-xl overflow-hidden border border-[#1e293b]/60 shadow-xl bg-[#0d1117] flex flex-col">
              <VariablePanel
                previousNodes={previousNodes}
                onInsert={handleVariableInsert}
                activeField={activeField}
                onTestNode={handleTestPreviousNode}
              />
            </div>
          </Panel>

          {/* Drag Handle 1 */}
          <Separator className="w-3 relative flex items-center justify-center cursor-col-resize group px-0.5 z-20 transition-all select-none">
            <div className="w-1 h-12 rounded-full bg-gray-700/50 group-hover:bg-indigo-500 group-hover:h-24 group-active:bg-indigo-400 group-active:h-28 transition-all duration-200 shadow-sm" />
          </Separator>

          {/* Center Panel: Node Configuration Form */}
          <Panel id="form-panel" defaultSize="35%" minSize="25%" maxSize="50%" className="h-full min-h-0 min-w-0 flex flex-col p-1.5">
            <div className="rounded-xl w-full h-full min-h-0 max-h-full overflow-hidden flex flex-col bg-[#0f1420]/95 border border-[#1e293b]/60 shadow-xl">
              {/* Header */}
              <div className="p-4 border-b border-[#1e293b]/60 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-[#0f1420] to-[#141c2b]">
                <h2 className="text-base font-semibold flex items-center gap-3 text-gray-100">
                  <NodeIcon icon={selectedNode.icon} name={selectedNode.name} size="md" />
                  <span>{selectedNode.name}</span>
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
              <div className="p-5 space-y-5 flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
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
                      {nodeConfig.fields
                        .filter((field) => isFieldVisible(field, config))
                        .map((field) => renderField(field, nodeConfig))}
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
          </Panel>

          {/* Drag Handle 2 */}
          <Separator className="w-3 relative flex items-center justify-center cursor-col-resize group px-0.5 z-20 transition-all select-none">
            <div className="w-1 h-12 rounded-full bg-gray-700/50 group-hover:bg-indigo-500 group-hover:h-24 group-active:bg-indigo-400 group-active:h-28 transition-all duration-200 shadow-sm" />
          </Separator>

          {/* Right Panel: Test Output */}
          <Panel id="test-panel" defaultSize="35%" minSize="20%" maxSize="65%" className="h-full min-h-0 min-w-0 flex flex-col p-1.5">
            <div className="w-full h-full min-h-0 rounded-xl overflow-hidden border border-[#1e293b]/60 shadow-xl bg-[#0d1117] flex flex-col">
              <TestPanel testResult={testResult} metadata={nodeTestOutput?.metadata} nodeName={selectedNode?.name} nodeIcon={selectedNode?.icon} />
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  );
}
