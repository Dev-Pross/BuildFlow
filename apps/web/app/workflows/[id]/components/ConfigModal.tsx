"use client";
import { getNodeConfig } from "@/app/lib/nodeConfigs";
import { useEffect, useState, useRef } from "react";
import { HOOKS_URL, BACKEND_URL } from "@repo/common/zod";
import axios from "axios";
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

const IF_ELSE_OPERATORS = [
  { id: "equals", label: "Equals" },
  { id: "not_equals", label: "Does not equal" },
  { id: "contains", label: "Contains" },
  { id: "not_contains", label: "Does not contain" },
  { id: "starts_with", label: "Starts with" },
  { id: "ends_with", label: "Ends with" },
  { id: "greater_than", label: "Greater than (>)" },
  { id: "less_than", label: "Less than (<)" },
  { id: "greater_than_or_equal", label: "Greater or equal (>=)" },
  { id: "less_than_or_equal", label: "Less or equal (<=)" },
  { id: "is_any_of", label: "Is any of (comma-separated)" },
  { id: "is_not_any_of", label: "Is not any of" },
  { id: "is_empty", label: "Is empty", unary: true },
  { id: "is_not_empty", label: "Is not empty", unary: true },
  { id: "is_true", label: "Is true", unary: true },
  { id: "is_false", label: "Is false", unary: true },
  { id: "regex_match", label: "Matches regex" },
];

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
  
  // Webhook Listening State
  const [isListeningWebhook, setIsListeningWebhook] = useState(false);
  const [webhookCountdown, setWebhookCountdown] = useState(0);
  const webhookListenStartTime = useRef<number>(0);

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

  // Build interpolation context and mock sourceRefs from all previously tested nodes
  const buildTestContextAndRefs = () => {
    const context: InterpolationContext = {};
    const sourceRefs: Record<string, { wireIndex: number, rowIndex: number }> = {};
    const nameCounts: Record<string, number> = {};

    // 1. Trace edges backward to find wireIndex for ancestors
    const mapping: Record<string, number> = {};
    if (selectedNode) {
      const queue = [selectedNode.id];
      const visited = new Set<string>();

      while (queue.length > 0) {
        const current = queue.shift()!;
        const incomingEdges = reduxWorkflow.edges.filter(e => e.target === current);
        
        for (const edge of incomingEdges) {
          if (!visited.has(edge.source)) {
            visited.add(edge.source);
            queue.push(edge.source);
            
            const match = edge.sourceHandle ? String(edge.sourceHandle).match(/\d+$/) : null;
            const wireIndex = match ? parseInt(match[0], 10) : 0;
            mapping[edge.source] = wireIndex;
          }
        }
      }
    }

    for (const [nodeId, testOutput] of Object.entries(allTestedOutputs)) {
      if (testOutput.success && testOutput.data) {
        const baseName = testOutput.nodeName
          .replace(/ Output$/i, '')
          .replace(/ Node$/i, '')
          .toLowerCase()
          .replace(/\s+/g, '_');

        const wireIndex = mapping[nodeId] ?? 0;

        context[nodeId] = testOutput.data;
        sourceRefs[nodeId] = { wireIndex, rowIndex: 0 };

        if (!nameCounts[baseName]) {
          nameCounts[baseName] = 1;
          context[baseName] = testOutput.data;
          sourceRefs[baseName] = { wireIndex, rowIndex: 0 };
        } else {
          nameCounts[baseName]++;
          const uniqueKey = `${baseName}_${nameCounts[baseName]}`;
          context[uniqueKey] = testOutput.data;
          sourceRefs[uniqueKey] = { wireIndex, rowIndex: 0 };
        }
      }
    }

    return { context, sourceRefs };
  };

  // Webhook polling effect
  useEffect(() => {
    if (!isListeningWebhook || !workflowId || webhookCountdown <= 0) return;

    const pollInterval = setInterval(async () => {
      try {
        const since = new Date(webhookListenStartTime.current).toISOString();
        const res = await axios.get(`${BACKEND_URL}/user/workflow/latest-webhook/${workflowId}?since=${since}`, {
          withCredentials: true,
          headers: { "Content-Type": "application/json" }
        });
        
        if (res.data?.success && res.data?.metadata) {
          // Found a webhook!
          setIsListeningWebhook(false);
          setWebhookCountdown(0);
          toast.success("Webhook payload received!");
          
          const outputData = [res.data.metadata]; // Assuming an array structure for webhook payloads
          const extractedVariables = extractVariablesFromOutput(outputData);
          
          const mapToVariableDefinition = (v: any): VariableDefinition => ({
            name: v.name,
            path: v.path,
            type: v.type as any,
            sampleValue: v.sampleValue,
            children: v.children ? v.children.map(mapToVariableDefinition) : undefined
          });

          const variables: VariableDefinition[] = extractedVariables.map(mapToVariableDefinition);

          const testOutput: NodeTestOutput = {
            nodeId: selectedNode.id,
            nodeName: selectedNode.name || 'Webhook',
            nodeType: selectedNode.type || '',
            data: outputData,
            metadata: {},
            variables,
            testedAt: Date.now(),
            success: true
          };

          dispatch(setNodeOutput(testOutput));
          setTestResult(outputData);
        }
      } catch (e) {
        // Ignore polling errors
      }
    }, 3000);

    const countdownInterval = setInterval(() => {
      setWebhookCountdown(prev => {
        if (prev <= 1) {
          setIsListeningWebhook(false);
          toast.info("Stopped listening for webhook (timeout).");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(countdownInterval);
    };
  }, [isListeningWebhook, workflowId, webhookCountdown, selectedNode]);

  const handleListenWebhook = () => {
    setTestResult(null);
    webhookListenStartTime.current = Date.now();
    setIsListeningWebhook(true);
    setWebhookCountdown(60); // Listen for 60 seconds
  };

  // Test the current node and store output in Redux
  const handleTestNode = async () => {
    if (!selectedNode) return;

    console.log('[ConfigModal] Testing node:', selectedNode.id, selectedNode.name);
    dispatch(setNodeLoading({ nodeId: selectedNode.id, loading: true }));

    try {
      // Build context from previously tested nodes for variable resolution
      const { context: interpolationContext, sourceRefs } = buildTestContextAndRefs();
      console.log('[ConfigModal] Interpolation context:', interpolationContext);
      console.log('[ConfigModal] Mock sourceRefs:', sourceRefs);

      // Resolve any {{variable}} in the config before testing
      const resolvedConfig = resolveConfigVariables(config, interpolationContext, sourceRefs);
      // Do not resolve conditionGroups for if_else, the backend evaluates them per-item
      if (selectedNode.type === "if_else" || selectedNode.type === "action") {
        resolvedConfig.conditionGroups = config.conditionGroups;
      }

      console.log('[ConfigModal] Original config:', config);
      console.log('[ConfigModal] Resolved config:', resolvedConfig);

      // Check if any variables couldn't be resolved
      const unresolvedVars = Object.entries(resolvedConfig)
        .filter(([_, value]) => typeof value === 'string' && value.includes('{{'))
        .map(([key, value]) => `${key}: ${value}`);

      if (unresolvedVars.length > 0) {
        toast.warning(`Some variables couldn't be resolved. Test the previous nodes first.\n${unresolvedVars.join('\n')}`);
      }

      // Collect items from incoming edges
      let itemsToPass: any[] = [];
      const incomingEdges = reduxWorkflow.edges.filter((e: any) => e.target === selectedNode.id);
      for (const edge of incomingEdges) {
        const sourceOutput = allTestedOutputs[edge.source];
        if (sourceOutput && sourceOutput.data) {
          const sourceData = Array.isArray(sourceOutput.data) ? sourceOutput.data : [sourceOutput.data];
          const flatData = sourceData.flat(Infinity);
          itemsToPass.push(...flatData);
        }
      }

      const response = await api.execute.node(selectedNode.id, resolvedConfig, itemsToPass);
      console.log('[ConfigModal] API response (already extracted output):', response);

      // api.execute.node now returns full executionResult
      const outputData = response.output;
      const metadata = response.metadata;
      console.log('[ConfigModal] Output data for extraction:', outputData);

      // Extract variables from the output for the variable panel
      const extractedVariables = extractVariablesFromOutput(outputData);
      console.log('[ConfigModal] Extracted variables:', extractedVariables);

      const mapToVariableDefinition = (v: any): VariableDefinition => ({
        name: v.name,
        path: v.path,
        type: v.type as any,
        sampleValue: v.sampleValue,
        children: v.children ? v.children.map(mapToVariableDefinition) : undefined
      });

      // Convert to VariableDefinition format
      const variables: VariableDefinition[] = extractedVariables.map(mapToVariableDefinition);

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
      const { context: interpolationContext, sourceRefs } = buildTestContextAndRefs();

      // Resolve any {{variable}} in the config before testing
      const resolvedConfig = resolveConfigVariables(targetNodeConfig, interpolationContext, sourceRefs);

      // Do not resolve conditionGroups for if_else, the backend evaluates them per-item
      if (targetNodeType === "if_else" || targetNodeType === "action") {
        resolvedConfig.conditionGroups = targetNodeConfig.conditionGroups;
      }

      // Collect items from incoming edges for this previous node
      let itemsToPass: any[] = [];
      const incomingEdges = reduxWorkflow.edges.filter((e: any) => e.target === nodeId);
      for (const edge of incomingEdges) {
        const sourceOutput = allTestedOutputs[edge.source];
        if (sourceOutput && sourceOutput.data) {
          const sourceData = Array.isArray(sourceOutput.data) ? sourceOutput.data : [sourceOutput.data];
          itemsToPass.push(...sourceData);
        }
      }

      const response = await api.execute.node(nodeId, resolvedConfig, itemsToPass);
      const outputData = response.output;
      const metadata = response.metadata;

      // Extract variables from the output for the variable panel
      const extractedVariables = extractVariablesFromOutput(outputData);

      const mapToVariableDefinition = (v: any): VariableDefinition => ({
        name: v.name,
        path: v.path,
        type: v.type as any,
        sampleValue: v.sampleValue,
        children: v.children ? v.children.map(mapToVariableDefinition) : undefined
      });

      // Convert to VariableDefinition format
      const variables: VariableDefinition[] = extractedVariables.map(mapToVariableDefinition);

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

    if (activeSubField?.match(/^g\d+-r\d+-op[12]$/)) {
      const match = activeSubField.match(/^g(\d+)-r(\d+)-(op[12])$/);
      if (match) {
        const groupIdx = parseInt(match[1]!, 10);
        const ruleIdx = parseInt(match[2]!, 10);
        const operand = match[3] as "op1" | "op2";
        const operandKey = operand === "op1" ? "operand1" : "operand2";

        const groups = Array.isArray(config[activeField]) ? [...config[activeField]] : [];
        if (groups[groupIdx] && groups[groupIdx].conditions && groups[groupIdx].conditions[ruleIdx]) {
          const rule = groups[groupIdx].conditions[ruleIdx];
          const currentVal = rule[operandKey] || "";
          
          const updatedGroups = groups.map((grp, gI) => 
            gI === groupIdx 
              ? {
                  ...grp,
                  conditions: grp.conditions.map((r: any, rI: number) => 
                    rI === ruleIdx ? { ...r, [operandKey]: currentVal + variableSyntax } : r
                  )
                }
              : grp
          );

          const newConfig = { ...config, [activeField]: updatedGroups };
          setConfig(newConfig);
          dispatchConfig(newConfig);
          return;
        }
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
        const { context: interpolationContext, sourceRefs } = buildTestContextAndRefs();
        const resolvedConfig = resolveConfigVariables({ temp: dependentFieldValue }, interpolationContext, sourceRefs);
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

    if (field.type === "condition_builder") {
      const conditionGroups: Array<{
        id?: string;
        combinator?: "AND" | "OR";
        conditions: Array<{
          id?: string;
          operand1: string;
          operator: string;
          operand2?: any;
        }>;
      }> = (Array.isArray(config.conditionGroups) && config.conditionGroups.length > 0)
        ? config.conditionGroups
        : [
            {
              id: "group-1",
              combinator: "AND",
              conditions: [
                { id: "rule-1", operand1: "", operator: "equals", operand2: "" }
              ]
            }
          ];

      const nodeCombinator: "AND" | "OR" = config.combinator || "OR";

      const updateBuilderState = (newGroups: any[], newCombinator = nodeCombinator) => {
        const newConfig = {
          ...config,
          combinator: newCombinator,
          conditionGroups: newGroups
        };
        setConfig(newConfig);
        dispatchConfig(newConfig);
      };

      const handleAddGroup = () => {
        const newGroup = {
          id: `group-${Date.now()}`,
          combinator: "AND" as const,
          conditions: [
            { id: `rule-${Date.now()}`, operand1: "", operator: "equals", operand2: "" }
          ]
        };
        updateBuilderState([...conditionGroups, newGroup]);
      };

      const handleDeleteGroup = (groupIndex: number) => {
        const updated = conditionGroups.filter((_, idx) => idx !== groupIndex);
        updateBuilderState(updated);
      };

      const handleGroupCombinatorChange = (groupIndex: number, newComb: "AND" | "OR") => {
        const updated = conditionGroups.map((grp, idx) =>
          idx === groupIndex ? { ...grp, combinator: newComb } : grp
        );
        updateBuilderState(updated);
      };

      const handleAddRule = (groupIndex: number) => {
        const newRule = {
          id: `rule-${Date.now()}`,
          operand1: "",
          operator: "equals",
          operand2: ""
        };
        const updated = conditionGroups.map((grp, idx) =>
          idx === groupIndex
            ? { ...grp, conditions: [...(grp.conditions || []), newRule] }
            : grp
        );
        updateBuilderState(updated);
      };

      const handleDeleteRule = (groupIndex: number, ruleIndex: number) => {
        const updated = conditionGroups.map((grp, gIdx) =>
          gIdx === groupIndex
            ? { ...grp, conditions: grp.conditions.filter((_, rIdx) => rIdx !== ruleIndex) }
            : grp
        );
        updateBuilderState(updated);
      };

      const handleRuleChange = (groupIndex: number, ruleIndex: number, patch: Record<string, any>) => {
        const updated = conditionGroups.map((grp, gIdx) =>
          gIdx === groupIndex
            ? {
                ...grp,
                conditions: grp.conditions.map((rule, rIdx) =>
                  rIdx === ruleIndex ? { ...rule, ...patch } : rule
                )
              }
            : grp
        );
        updateBuilderState(updated);
      };

      return (
        <div key={field.name} className="space-y-3">
          <div>
            <label className="block text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 uppercase tracking-widest mb-1 shadow-sm">
              {field.label}
            </label>
            {field.description && (
              <p className="text-xs text-gray-400/90 leading-relaxed font-medium">
                {field.description}
              </p>
            )}
          </div>
          
          <div className="space-y-5 p-5 bg-gradient-to-b from-[#0e131f] to-[#0c1017] rounded-2xl border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.03)] backdrop-blur-xl relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Level: Node Combinator Control */}
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-500/10 z-10">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-indigo-500/10 rounded-md border border-indigo-500/20 shadow-sm">
                    <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </div>
                  <span className="text-[13px] font-bold text-gray-200 uppercase tracking-wide">
                    Global Strategy
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 mt-1.5 font-medium ml-9">
                  {nodeCombinator === "OR"
                    ? "Passes if ANY condition group matches"
                    : "Passes only if ALL condition groups match"}
                </p>
              </div>

              <div className="flex items-center bg-[#06090e]/80 p-1 rounded-xl border border-[#1e293b]/80 shadow-inner">
                <button
                  type="button"
                  onClick={() => updateBuilderState(conditionGroups, "OR")}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                    nodeCombinator === "OR"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-900/40"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  }`}
                >
                  ANY (OR)
                </button>
                <button
                  type="button"
                  onClick={() => updateBuilderState(conditionGroups, "AND")}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
                    nodeCombinator === "AND"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-900/40"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  }`}
                >
                  ALL (AND)
                </button>
              </div>
            </div>

            {/* Condition Groups List */}
            <div className="space-y-4 relative z-10">
              {conditionGroups.map((group, groupIndex) => {
                const isGroupAnd = (group.combinator || "AND") === "AND";
                return (
                  <div key={group.id || `group-${groupIndex}`} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Between-Group Divider */}
                    {groupIndex > 0 && (
                      <div className="flex items-center gap-3 my-4 opacity-80">
                        <div className="flex-1 border-t border-dashed border-indigo-500/20" />
                        <span className="px-3 py-1 bg-[#0c1017] text-indigo-400 border border-indigo-500/30 text-[10px] font-black uppercase rounded-lg tracking-widest shadow-sm">
                          {nodeCombinator}
                        </span>
                        <div className="flex-1 border-t border-dashed border-indigo-500/20" />
                      </div>
                    )}

                    {/* Group Card */}
                    <div className="group/card bg-[#111827]/80 backdrop-blur-md border border-gray-800/60 hover:border-indigo-500/40 rounded-2xl p-4 space-y-4 shadow-lg transition-all duration-300">
                      {/* Group Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800/60 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black flex items-center justify-center shadow-sm">
                            {groupIndex + 1}
                          </span>
                          <span className="text-[13px] font-bold text-gray-200">
                            Condition Group
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Group Combinator Toggle */}
                          <div className="flex items-center bg-[#06090e] p-0.5 rounded-lg border border-[#1e293b] shadow-inner">
                            <button
                              type="button"
                              onClick={() => handleGroupCombinatorChange(groupIndex, "AND")}
                              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${
                                isGroupAnd
                                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                                  : "text-gray-500 hover:text-gray-300 border border-transparent"
                              }`}
                            >
                              AND
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGroupCombinatorChange(groupIndex, "OR")}
                              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${
                                !isGroupAnd
                                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shadow-sm"
                                  : "text-gray-500 hover:text-gray-300 border border-transparent"
                              }`}
                            >
                              OR
                            </button>
                          </div>

                          {/* Delete Group Button */}
                          {conditionGroups.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteGroup(groupIndex)}
                              className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
                              title="Delete this group"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Condition Rules inside Group */}
                      <div className="space-y-2.5">
                        {group.conditions.map((rule, ruleIndex) => {
                          const operatorDef = IF_ELSE_OPERATORS.find((op) => op.id === rule.operator);
                          const isUnary = Boolean(operatorDef?.unary);

                          return (
                            <div
                              key={rule.id || `rule-${ruleIndex}`}
                              className="flex flex-col gap-3 bg-[#0a0e17]/80 p-3 rounded-xl border border-gray-800/40 group-hover/card:border-gray-700/50 transition-colors"
                            >
                              {/* Operand 1 (Left Field) */}
                              <div className="relative w-full">
                                <RichVariableInput
                                  value={rule.operand1 || ""}
                                  placeholder="Field (e.g. {{status}})..."
                                  onChange={(val) => handleRuleChange(groupIndex, ruleIndex, { operand1: val })}
                                  onFocus={() => {
                                    setActiveField(field.name);
                                    setActiveSubField(`g${groupIndex}-r${ruleIndex}-op1`);
                                  }}
                                  availableNodes={availableNodes}
                                />
                              </div>

                              {/* Operator Selector */}
                              <div className="relative w-full">
                                <select
                                  value={rule.operator}
                                  onChange={(e) => handleRuleChange(groupIndex, ruleIndex, { operator: e.target.value })}
                                  className="w-full p-2.5 bg-[#06090e] border border-[#1e293b] text-[11px] font-bold tracking-wide text-indigo-300 uppercase rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/50 transition-all cursor-pointer appearance-none shadow-inner"
                                >
                                  {IF_ELSE_OPERATORS.map((op) => (
                                    <option key={op.id} value={op.id} className="bg-[#0f1420] text-gray-200 normal-case">
                                      {op.label}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500/70">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 w-full">
                                {/* Operand 2 (Right Value) or Unary Placeholder */}
                                <div className="relative flex-1">
                                  {isUnary ? (
                                    <div className="h-[38px] px-3 flex items-center bg-gray-900/40 border border-dashed border-gray-700 rounded-lg text-[11px] text-gray-500 italic font-medium select-none">
                                      No value required
                                    </div>
                                  ) : (
                                    <RichVariableInput
                                      value={rule.operand2 ?? ""}
                                      placeholder="Value..."
                                      onChange={(val) => handleRuleChange(groupIndex, ruleIndex, { operand2: val })}
                                      onFocus={() => {
                                        setActiveField(field.name);
                                        setActiveSubField(`g${groupIndex}-r${ruleIndex}-op2`);
                                      }}
                                      availableNodes={availableNodes}
                                    />
                                  )}
                                </div>

                                {/* Delete Rule Button */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRule(groupIndex, ruleIndex)}
                                  disabled={group.conditions.length <= 1}
                                  className="w-[38px] h-[38px] flex-shrink-0 flex items-center justify-center text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-xs disabled:opacity-20 disabled:cursor-not-allowed border border-transparent hover:border-rose-500/20"
                                  title="Delete condition"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Condition inside Group */}
                      <div className="pt-2 border-t border-gray-800/40 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleAddRule(groupIndex)}
                          className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 hover:border-indigo-500/40 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                          Add Condition
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Alternative Group Button */}
            <div className="pt-3 relative z-10">
              <button
                type="button"
                onClick={handleAddGroup}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 hover:from-indigo-500/10 hover:to-purple-500/10 border border-dashed border-indigo-500/30 hover:border-indigo-500/60 rounded-xl text-xs font-bold text-indigo-300 hover:text-indigo-200 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm group"
              >
                <div className="p-1 rounded bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                </div>
                <span>Add Alternative Condition Group ({nodeCombinator})</span>
              </button>
            </div>
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

    if (field.type === "readonly_copy") {
      let url = "";
      if (workflowId && selectedNode) {
        url = `${HOOKS_URL}/hooks/catch/${userId}/${workflowId}/${selectedNode.id}`;
      }
      
      return (
        <div key={field.name} className="form-group mb-4 p-4 bg-[#0a0e17] rounded-xl border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
          <label className="block text-sm font-semibold text-gray-200 mb-2">
            {field.label}
          </label>
          {field.description && (
            <p className="text-xs text-gray-400 mb-3">{field.description}</p>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={url}
              className="w-full p-2.5 border border-[#1e293b] bg-[#06090e] text-indigo-300 font-mono text-[11px] sm:text-xs rounded-lg outline-none"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(url);
                toast.success("Copied to clipboard!");
              }}
              className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
            >
              Copy
            </button>
          </div>
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
      <div className="fixed inset-0 m-3 p-2 rounded-3xl z-50 bg-[#0f1012] border border-[#27282d] shadow-2xl shadow-black/80 overflow-hidden flex flex-col">
        <Group orientation="horizontal" id="buildflow-node-config-panels" className="w-full h-full flex items-stretch gap-0">
          {/* Left Panel: Variable / Data Mapping */}
          <Panel id="variable-panel" defaultSize="30%" minSize="20%" maxSize="45%" className="h-full min-h-0 min-w-0 flex flex-col p-1.5">
            <div className="w-full h-full min-h-0 rounded-2xl overflow-hidden border border-[#27282d] shadow-xl bg-[#18191c] flex flex-col">
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
            <div className="rounded-xl w-full h-full min-h-0 max-h-full overflow-hidden flex flex-col bg-[#141518] border border-[#222429] shadow-xl">
              {/* Header */}
              <div className="p-4 border-b border-[#222429] flex items-center justify-between flex-shrink-0 bg-[#18191c]">
                <h2 className="text-base font-semibold flex items-center gap-3 text-[#f0f0e8]">
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
                {selectedNode.name.toLowerCase().includes("webhook") ? (
                  <button
                    onClick={handleListenWebhook}
                    disabled={isListeningWebhook || loading}
                    className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl disabled:opacity-40 flex items-center gap-2 text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none"
                    type="button"
                  >
                    {isListeningWebhook ? (
                      <>
                        <span className="w-4 h-4 border-2 border-t-transparent border-white/60 rounded-full animate-spin" />
                        Listening... {webhookCountdown}s
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Listen for Test Event
                      </>
                    )}
                  </button>
                ) : (
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
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => onClose()}
                    disabled={loading}
                    className="px-6 py-2.5 bg-white text-black hover:bg-gray-100 rounded-xl disabled:opacity-50 text-xs font-bold transition-all shadow-sm cursor-pointer"
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
            <div className="w-full h-full min-h-0 rounded-xl overflow-hidden border border-[#222429] shadow-xl bg-[#141518] flex flex-col">
              <TestPanel testResult={testResult} metadata={nodeTestOutput?.metadata} nodeName={selectedNode?.name} nodeIcon={selectedNode?.icon} />
            </div>
          </Panel>
        </Group>
      </div>
    </div>
  );
}
