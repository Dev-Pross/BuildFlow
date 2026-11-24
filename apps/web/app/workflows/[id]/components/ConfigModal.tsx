"use client";
import { getNodeConfig } from "@/app/lib/nodeConfigs";
import { useEffect, useState, useRef, useCallback } from "react";
import { HOOKS_URL, BACKEND_URL } from "@repo/common/zod";
import { useWorkflowEvents } from "@/app/hooks/useWorkflowEvents";
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
import { Group, Panel, Separator, usePanelRef } from "react-resizable-panels";
import { NodeIcon } from "@/app/components/ui/NodeIcon";
import {
  ChevronLeft,
  ChevronRight,
  X,
  FlaskConical,
  Database,
  Plus,
  Trash2,
  Settings,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  FileSpreadsheet,
  Layers,
} from "lucide-react";

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
  const [activeCaretOffset, setActiveCaretOffset] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [isLoadingHeaders, setIsLoadingHeaders] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState<Record<string, boolean>>({});
  const [customRowKeys, setCustomRowKeys] = useState<Record<string, boolean>>({});

  // Webhook Listening State
  const [isListeningWebhook, setIsListeningWebhook] = useState(false);
  const [webhookCountdown, setWebhookCountdown] = useState(0);
  const webhookListenStartTime = useRef<number>(0);

  // Responsive layout state
  const [isDesktop, setIsDesktop] = useState(true);
  const [mobileTab, setMobileTab] = useState<"variables" | "config" | "test">("config");

  // Collapsible panels state & imperative handles
  const variablePanelRef = usePanelRef();
  const testPanelRef = usePanelRef();
  const [isVariableCollapsed, setIsVariableCollapsed] = useState(false);
  const [isTestCollapsed, setIsTestCollapsed] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // Google Sheets Create Document / Tab state
  const [createSheetModal, setCreateSheetModal] = useState<{
    open: boolean;
    type: "document" | "tab";
    title: string;
    tabName: string;
    headers: string;
    isSubmitting: boolean;
  }>({
    open: false,
    type: "document",
    title: "",
    tabName: "",
    headers: "",
    isSubmitting: false,
  });

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

  // Initialize test result from Redux if available for this node
  useEffect(() => {
    if (selectedNode?.id && nodeTestOutput?.data !== undefined && nodeTestOutput?.data !== null) {
      setTestResult(nodeTestOutput.data);
    } else {
      setTestResult(null);
    }
  }, [selectedNode?.id, nodeTestOutput?.data]);

  const fetchOptionsMap: Record<string, (params: any) => Promise<any>> = {
    "google.getDocuments": async ({ credentialId }) => {
      if (!credentialId) return [];
      try {
        const docs = await api.google.getDocuments(credentialId);
        return [
          { id: "__create_new__", name: "+ Create New Spreadsheet..." },
          ...(docs || [])
        ];
      } catch (err) {
        return [{ id: "__create_new__", name: "+ Create New Spreadsheet..." }];
      }
    },
    "google.getSheets": async ({ spreadsheetId, credentialId }) => {
      if (!spreadsheetId || !credentialId || spreadsheetId === "__create_new__") return [];
      try {
        const sheets = await api.google.getSheets(spreadsheetId, credentialId);
        return [
          { id: "__create_new_tab__", name: "+ Create New Tab..." },
          ...(sheets || [])
        ];
      } catch (err) {
        return [{ id: "__create_new_tab__", name: "+ Create New Tab..." }];
      }
    }
  };

  const dispatchConfig = (newConfig: Record<string, any>) => {
    if (!selectedNode) return;
    const isTrigger = reduxWorkflow.trigger?.TriggerId === selectedNode.id;
    if (isTrigger) {
      dispatch(workflowActions.updateTriggerConfig({ config: newConfig }));
    } else {
      dispatch(workflowActions.updateNodeConfig({ nodeId: selectedNode.id, config: newConfig }));
    }
  };

  const handleCreateSheetSubmit = async () => {
    if (!config.credentialId) {
      toast.error("Please select a Google Account first");
      return;
    }
    setCreateSheetModal(prev => ({ ...prev, isSubmitting: true }));
    try {
      const headersList = createSheetModal.headers
        ? createSheetModal.headers.split(",").map(h => h.trim()).filter(Boolean)
        : undefined;

      if (createSheetModal.type === "document") {
        const res = await api.google.createDocument({
          credentialId: config.credentialId,
          title: createSheetModal.title.trim(),
          tabName: createSheetModal.tabName.trim() || undefined,
          headers: headersList
        });

        const docs = await api.google.getDocuments(config.credentialId);
        const docOptions = [
          { id: "__create_new__", name: "+ Create New Spreadsheet..." },
          ...(docs || [])
        ];
        setDynamicOptions(prev => ({ ...prev, spreadsheetId: docOptions }));

        const targetTab = res?.tabName || createSheetModal.tabName.trim() || "Sheet1";
        const newSpreadsheetId = res?.spreadsheetId;
        const updatedConfig = {
          ...config,
          spreadsheetId: newSpreadsheetId,
          sheetName: targetTab,
          operation: "append_rows",
          _isNewSheet: true,
        };
        setConfig(updatedConfig);
        dispatchConfig(updatedConfig);

        if (newSpreadsheetId) {
          const tabs = await api.google.getSheets(newSpreadsheetId, config.credentialId);
          setDynamicOptions(prev => ({
            ...prev,
            sheetName: [
              { id: "__create_new_tab__", name: "+ Create New Tab..." },
              ...(tabs || [])
            ]
          }));
        }

        if (headersList && headersList.length > 0) {
          setSheetHeaders(headersList);
        }

        toast.success(`Spreadsheet "${createSheetModal.title}" created successfully!`);
      } else {
        const res = await api.google.createTab({
          credentialId: config.credentialId,
          spreadsheetId: config.spreadsheetId,
          tabName: createSheetModal.tabName.trim(),
          headers: headersList
        });

        const tabs = await api.google.getSheets(config.spreadsheetId, config.credentialId);
        setDynamicOptions(prev => ({
          ...prev,
          sheetName: [
            { id: "__create_new_tab__", name: "+ Create New Tab..." },
            ...(tabs || [])
          ]
        }));

        const updatedConfig = {
          ...config,
          sheetName: res?.tabName || createSheetModal.tabName.trim(),
          operation: "append_rows",
          _isNewSheet: true,
        };
        setConfig(updatedConfig);
        dispatchConfig(updatedConfig);

        if (headersList && headersList.length > 0) {
          setSheetHeaders(headersList);
        }

        toast.success(`Sheet tab "${createSheetModal.tabName}" created successfully!`);
      }

      setCreateSheetModal({ open: false, type: "document", title: "", tabName: "", headers: "", isSubmitting: false });
    } catch (e: any) {
      console.error("Failed to create sheet/tab:", e);
      toast.error(e?.response?.data?.message || e.message || "Failed to create sheet");
      setCreateSheetModal(prev => ({ ...prev, isSubmitting: false }));
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

  // Real-time Webhook payload received via SSE stream
  const handleRealtimeWebhook = useCallback((payload: any) => {
    if (!isListeningWebhook || !payload) return;

    // Instant receipt: cancel countdown, stop listening, display toast
    setIsListeningWebhook(false);
    setWebhookCountdown(0);
    toast.success("Webhook payload received in real time!");

    const outputData = [payload];
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
  }, [isListeningWebhook, selectedNode, dispatch]);

  // Hook into the live events stream when listening
  useWorkflowEvents({
    workflowId: isListeningWebhook ? workflowId : null,
    onTestWebhook: handleRealtimeWebhook,
  });

  // Countdown timeout effect (pure 1s timer, zero polling conflicts)
  useEffect(() => {
    if (!isListeningWebhook || webhookCountdown <= 0) return;

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

    return () => clearInterval(countdownInterval);
  }, [isListeningWebhook, webhookCountdown]);

  const handleListenWebhook = () => {
    setTestResult(null);
    webhookListenStartTime.current = Date.now();
    setIsListeningWebhook(true);
    setWebhookCountdown(60); // Listen for 60 seconds
  };

  const isFieldVisible = (field: ConfigField, formData: any) => {
    const currentOps = formData.operation || formData.method || "read_rows";

    // 1. Operation check: if field specifies showForOperation, check against active operation / method
    if (field.showForOperation && !field.showForOperation.includes(currentOps)) {
      return false;
    }

    // 2. HTTP method dependency check (e.g. body depends on method)
    if (field.dependsOn === "method" && field.showForOperation && !field.showForOperation.includes(formData.method ?? "GET")) {
      return false;
    }

    // 3. Mapping mode switches for Google Sheets
    if (field.name === 'mappedColumns') {
      return (formData.mappingMode ?? 'visual') === 'visual';
    }

    if (field.name === 'bulkValues') {
      return formData.mappingMode === 'bulk';
    }

    // 4. Custom range visibility
    if (field.name === 'range') {
      if (currentOps === 'read_rows' && (formData.fetchEntireTable ?? true))
        return false;
      if (currentOps === 'clear_rows' && (formData.clearEntireTable ?? true))
        return false;
      if (currentOps === 'write_rows')
        return true;
    }

    // 5. Clear header row checkbox visibility
    if (field.name === 'includeHeaderRow') {
      if (currentOps === 'clear_rows' && !(formData.clearEntireTable ?? true))
        return false;
    }

    return true;
  };

  const isFieldRequired = (field: ConfigField, formData: any, targetNodeConfig?: any): boolean => {
    if (field.required) return true;

    const nodeType = targetNodeConfig?.id || selectedNode?.actionType;
    const currentOps = formData?.operation || formData?.method;

    // Google Sheets: Range is required for write_rows
    if (nodeType === "google_sheet" && field.name === "range" && currentOps === "write_rows") {
      return true;
    }

    // Filter node: Operation-dependent required fields
    if (nodeType === "filter") {
      const op = currentOps || "unique_rows";
      if (op === "new_data_only" || op === "existing_data_only") {
        if (field.name === "referenceData" || field.name === "sourceKey" || field.name === "referenceKey") {
          return true;
        }
      }
      if (op === "group_by") {
        if (field.name === "sourceKey") {
          return true;
        }
      }
    }

    return false;
  };

  // Test the current node and store output in Redux
  const handleTestNode = async () => {
    if (!selectedNode) return;

    // Validate visible required fields before executing test
    const targetNodeConfig = getNodeConfig(selectedNode.name || selectedNode.actionType);
    if (targetNodeConfig?.fields) {
      const visibleFields = targetNodeConfig.fields.filter((f) => isFieldVisible(f, config));
      for (const field of visibleFields) {
        if (isFieldRequired(field, config, targetNodeConfig)) {
          const val = config[field.name];
          const isEmpty = val === undefined || val === null || (typeof val === 'string' && val.trim() === "");
          if (isEmpty) {
            toast.error(`Please provide required field: "${field.label}"`);
            return;
          }
        }
      }
    }

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

      if (itemsToPass.length > 0) {
        if (selectedNode?.name?.toLowerCase() === "gmail" || selectedNode.type === "http_request") {
          itemsToPass = [itemsToPass[0]]
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
    } finally {
      dispatch(setNodeLoading({ nodeId: selectedNode.id, loading: false }));
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

      if (itemsToPass.length > 0) {
        if (targetNodeType.toLowerCase() === 'gmail' || targetNodeType === "http_request") {
          itemsToPass = itemsToPass.slice(0, 1)
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
    } finally {
      dispatch(setNodeLoading({ nodeId, loading: false }));
    }
  };

  const handleVariableInsert = (variableSyntax: string) => {
    if (!activeField) return;

    const insertAtOffset = (currentVal: string, syntax: string): string => {
      if (
        activeCaretOffset === null ||
        activeCaretOffset === undefined ||
        activeCaretOffset < 0 ||
        activeCaretOffset > currentVal.length
      ) {
        return currentVal ? `${currentVal} ${syntax}` : syntax;
      }
      const before = currentVal.slice(0, activeCaretOffset);
      const after = currentVal.slice(activeCaretOffset);
      return before + syntax + after;
    };

    if (activeField === "mappedColumns" && activeSubField) {
      const currentMapped = config.mappedColumns || {};
      const currentVal = currentMapped[activeSubField] || "";
      const updatedMapped = { ...currentMapped, [activeSubField]: insertAtOffset(currentVal, variableSyntax) };

      const newConfig = { ...config, mappedColumns: updatedMapped };
      setConfig(newConfig);
      dispatchConfig(newConfig);
      setActiveCaretOffset((prev) => (prev !== null ? prev + variableSyntax.length : null));
      return;
    }

    if (activeSubField?.startsWith("row-") && Array.isArray(config[activeField])) {
      const index = parseInt(activeSubField.replace("row-", ""), 10);
      if (!isNaN(index) && config[activeField][index]) {
        const rows = [...config[activeField]];
        rows[index] = { ...rows[index], value: insertAtOffset(rows[index].value || "", variableSyntax) };
        const newConfig = { ...config, [activeField]: rows };
        setConfig(newConfig);
        dispatchConfig(newConfig);
        setActiveCaretOffset((prev) => (prev !== null ? prev + variableSyntax.length : null));
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
                  rI === ruleIdx ? { ...r, [operandKey]: insertAtOffset(currentVal, variableSyntax) } : r
                )
              }
              : grp
          );

          const newConfig = { ...config, [activeField]: updatedGroups };
          setConfig(newConfig);
          dispatchConfig(newConfig);
          setActiveCaretOffset((prev) => (prev !== null ? prev + variableSyntax.length : null));
          return;
        }
      }
    }

    const currentValue = config[activeField] || "";
    const newConfig = { ...config, [activeField]: insertAtOffset(currentValue, variableSyntax) };
    setConfig(newConfig);
    dispatchConfig(newConfig);
    setActiveCaretOffset((prev) => (prev !== null ? prev + variableSyntax.length : null));
  };


  const handleFieldChange = async (fieldName: string, value: string, nodeConfig: any) => {
    // Intercept Google Sheets creation actions
    if (fieldName === "spreadsheetId" && value === "__create_new__") {
      setCreateSheetModal({
        open: true,
        type: "document",
        title: "",
        tabName: "Sheet1",
        headers: "",
        isSubmitting: false,
      });
      return;
    }

    if (fieldName === "sheetName" && value === "__create_new_tab__") {
      setCreateSheetModal({
        open: true,
        type: "tab",
        title: "",
        tabName: "",
        headers: "",
        isSubmitting: false,
      });
      return;
    }

    // Update config with new value
    const updatedConfig = { ...config, [fieldName]: value };
    if (fieldName === "spreadsheetId" || fieldName === "sheetName" || fieldName === "operation") {
      delete updatedConfig._isNewSheet;
    }

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
    setConfig(updatedConfig);
    dispatchConfig(updatedConfig);
    console.log(config, "from handle field fun - 2")
    console.log({ ...config, [fieldName]: value }, "what we're setting")
    // Find fields that depend on this field
    const dependentFields = nodeConfig.fields.filter((f: any) => f.dependsOn === fieldName);

    for (const depField of dependentFields) {
      const fetchFn = depField.fetchOptions ? fetchOptionsMap[depField.fetchOptions] : undefined;
      if (fetchFn) {
        setIsLoadingOptions((prev) => ({ ...prev, [depField.name]: true }));
        try {
          const options = await fetchFn(updatedConfig);
          setDynamicOptions((prev) => ({ ...prev, [depField.name]: options }));
        } catch (err) {
          console.error(`Failed to fetch options for ${depField.name}`, err);
        } finally {
          setIsLoadingOptions((prev) => ({ ...prev, [depField.name]: false }));
        }
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
  const { cred: credentials = [], authUrl, isLoading: isLoadingCredentials } = useCredentials(credType ?? "", workflowId);

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
    delete finalConfig._isNewSheet;

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
    const isRequired = isFieldRequired(field, config, nodeConfig);

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
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 dark:text-chassis-foreground">
            {field.label}
            {isRequired && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
          <select
            value={fieldValue}
            onFocus={() => setActiveField(field.name)}
            onChange={(e) => {
              const newConfig = { ...config, [field.name]: e.target.value };
              setConfig(newConfig);
              dispatchConfig(newConfig);
            }}
            className="w-full p-2.5 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all outline-none text-sm dark:bg-white/5 dark:border-white/10 dark:text-white"
            required={isRequired}
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
      // Use the values from useCredentials: credentials, authUrl, and isLoading
      return (
        <div key={field.name} className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider dark:text-chassis-foreground">
              {field.label}
              {isRequired && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {isLoadingCredentials && (
              <span className="text-[10px] text-primary font-medium flex items-center gap-1.5 animate-pulse lowercase font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                loading accounts...
              </span>
            )}
          </div>

          {isLoadingCredentials ? (
            <div className="w-full p-2.5 border border-input bg-muted/40 rounded-lg flex items-center justify-center gap-2.5 text-xs text-muted-foreground animate-pulse dark:bg-white/5 dark:border-white/10">
              <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Loading Google accounts...</span>
            </div>
          ) : (Array.isArray(credentials) && credentials.length > 0) ? (
            <>
              <select
                value={fieldValue}
                onFocus={() => setActiveField(field.name)}
                onChange={async (e) => {
                  await handleFieldChange(field.name, e.target.value, nodeConfig);
                  console.log(field.name, nodeConfig, e.target.value)
                }}
                className="w-full p-2.5 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all outline-none text-sm dark:bg-white/5 dark:border-white/10 dark:text-white"
                required={isRequired}
              >
                <option value="">Select Google Account</option>
                {credentials.map((cred: any) => (
                  <option key={cred.id} value={cred.id}>
                    {cred.config?.email || cred.name || "Google Account"}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2 mt-2">
                {credentials.map((cred: any) => (
                  <span
                    key={cred.id}
                    className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs rounded-full border border-emerald-500/20 font-medium"
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
                    className="w-full p-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                    type="button"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Connect Google Account</span>
                  </button>
                  <p className="text-xs text-muted-foreground mt-2 text-center dark:text-chassis-foreground/60">
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
      let options = dynamicOptions[field.name] || field.options || [];
      const isFieldLoading = Boolean(isLoadingOptions[field.name]);

      // For Google Sheets: Display badge when a new blank sheet/tab was just created
      const isSheetNode = selectedNode?.actionType === "google_sheet" || selectedNode?.name?.toLowerCase().includes("sheet");

      return (
        <div key={field.name} className="form-group">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider dark:text-chassis-foreground flex items-center gap-2">
              <span>{field.label}</span>
              {isRequired && <span className="text-rose-500 ml-0.5">*</span>}
              {isFieldLoading && (
                <span className="text-[10px] text-primary font-medium flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Loading...
                </span>
              )}
            </label>
            {isSheetNode && field.name === "operation" && config._isNewSheet && (
              <span className="text-[11px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-medium">
                Blank sheet tab
              </span>
            )}
          </div>
          <select
            value={fieldValue}
            disabled={isFieldLoading}
            onFocus={() => setActiveField(field.name)}
            onChange={async (e) => {
              console.log("log for options: ", fieldValue)
              await handleFieldChange(field.name, e.target.value, nodeConfig);
            }}
            className="w-full p-2.5 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all outline-none text-sm disabled:opacity-50 dark:bg-white/5 dark:border-white/10 dark:text-white"
            required={isRequired}
          >
            {isFieldLoading ? (
              <option value="">Loading options from engine...</option>
            ) : (
              <option value="">Select {field.label.toLowerCase()}</option>
            )}
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
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 dark:text-chassis-foreground">
            {field.label}
            {isRequired && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
          <RichVariableInput
            value={fieldValue || ''}
            placeholder={field.placeholder}
            onFocus={() => setActiveField(field.name)}
            onCaretChange={setActiveCaretOffset}
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
        <div key={field.name} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border border-border dark:bg-white/5 dark:border-white/10">
          <input
            type="checkbox"
            id={field.name}
            checked={isChecked}
            onChange={(e) => {
              const newConfig = { ...config, [field.name]: e.target.checked };
              setConfig(newConfig);
              dispatchConfig(newConfig);
            }}
            className="w-4 h-4 text-primary bg-background border-input rounded focus:ring-primary"
          />
          <label htmlFor={field.name} className="text-sm font-medium text-foreground cursor-pointer dark:text-chassis-foreground">
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
        <div key={field.name} className="flex flex-col gap-3 p-4 bg-muted/30 rounded-xl border border-border dark:bg-white/5 dark:border-white/10">
          <label className="text-xs font-semibold uppercase tracking-wider text-foreground dark:text-chassis-foreground">{field.label}</label>

          {isLoadingHeaders ? (
            <div className="text-sm text-muted-foreground dark:text-chassis-foreground/60">Loading columns from Google Sheets...</div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                {mappedKeys.map((header) => (
                  <div key={header} className="flex items-center gap-2">
                    <div className="w-1/3 text-sm text-muted-foreground truncate dark:text-chassis-foreground/70" title={header}>
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
                        onCaretChange={setActiveCaretOffset}
                        placeholder="Enter value..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newMapped = { ...mappedValues };
                        delete newMapped[header];
                        const newConfig = { ...config, [field.name]: newMapped };
                        setConfig(newConfig);
                        dispatchConfig(newConfig);
                      }}
                      className="p-2 text-muted-foreground hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                      title="Delete mapped column"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {availableHeaders.length > 0 && (
                <div className="mt-2">
                  <select
                    className="w-full p-2 bg-background border border-input rounded-lg text-sm text-foreground outline-none cursor-pointer hover:border-primary transition-colors dark:bg-white/5 dark:border-white/10 dark:text-white"
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

              {sheetHeaders.length === 0 && !isLoadingHeaders && (
                <div className="text-xs text-gray-500 italic py-1">
                  No columns detected in Row 1. Make sure your Google Sheet has header titles in row 1.
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
        <div key={field.name} className="space-y-2 p-3.5 bg-muted/30 rounded-xl border border-border dark:bg-white/5 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider dark:text-chassis-foreground">
                {field.label}
                {isRequired && <span className="text-rose-500 ml-0.5">*</span>}
              </label>
              {field.description && (
                <p className="text-[11px] text-muted-foreground mt-0.5 dark:text-chassis-foreground/70">{field.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddRow}
              className="px-2.5 py-1 text-xs font-medium text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary border border-primary/20 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" /> Add {field.label.replace(/s$/, '') || "Row"}
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
            <div className="py-3 px-3 text-center rounded-lg border border-dashed border-border dark:border-white/15 text-xs text-muted-foreground dark:text-chassis-foreground/60">
              No {field.label.toLowerCase()} added. Click{" "}
              <button
                type="button"
                className="text-primary hover:underline font-medium cursor-pointer"
                onClick={handleAddRow}
              >
                + Add
              </button>{" "}
              to create one.
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              <div className="grid grid-cols-[1fr_1.5fr_32px] gap-2 px-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider dark:text-chassis-foreground/60">
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
                            className="w-full p-2 bg-background border border-input text-xs text-foreground rounded-lg outline-none focus:border-primary transition-colors font-mono dark:bg-white/5 dark:border-white/10 dark:text-white"
                          />
                          <button
                            type="button"
                            title="Switch back to header dropdown"
                            onClick={() => {
                              setCustomRowKeys((prev) => ({ ...prev, [pairId]: false }));
                              handleKeyChange(index, "");
                            }}
                            className="p-2 text-muted-foreground hover:text-foreground text-xs bg-muted border border-border rounded-lg dark:bg-white/10 dark:border-white/10 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
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
                          className="w-full p-2 bg-background border border-input text-xs text-foreground rounded-lg outline-none focus:border-primary transition-colors cursor-pointer dark:bg-white/5 dark:border-white/10 dark:text-white"
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
                        className="w-full p-2 bg-background border border-input text-xs text-foreground rounded-lg outline-none focus:border-primary transition-colors dark:bg-white/5 dark:border-white/10 dark:text-white"
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
                      onCaretChange={setActiveCaretOffset}
                      availableNodes={availableNodes}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteRow(index)}
                      className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors text-xs cursor-pointer"
                      title="Delete row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
        <div key={field.name} className="space-y-2 p-3.5 bg-muted/30 rounded-xl border border-border dark:bg-white/5 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider dark:text-chassis-foreground">
                {field.label}
                {isRequired && <span className="text-rose-500 ml-0.5">*</span>}
              </label>
              {rawJson.trim() ? (
                isValidJson ? (
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Valid JSON
                  </span>
                ) : (
                  <span
                    className="px-2 py-0.5 text-[10px] font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full flex items-center gap-1 cursor-help"
                    title={jsonError || "Invalid JSON"}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Invalid JSON
                  </span>
                )
              ) : (
                <span className="text-[10px] text-muted-foreground dark:text-chassis-foreground/60">Optional</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleFormatJson}
              className="px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border rounded transition-colors dark:hover:bg-white/10 cursor-pointer"
              title="Format JSON indentation"
            >
              Prettify
            </button>
          </div>

          {field.description && (
            <p className="text-[11px] text-muted-foreground dark:text-chassis-foreground/70">{field.description}</p>
          )}

          {jsonError && rawJson.trim() && (
            <p className="text-[11px] text-rose-500 font-mono bg-rose-500/10 p-2 rounded border border-rose-500/20 flex items-center gap-1.5" title={jsonError}>
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{jsonError}</span>
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
              className="w-full p-3 bg-background border border-input text-xs font-mono text-emerald-600 dark:text-emerald-300 dark:bg-black/40 dark:border-white/10 rounded-lg outline-none focus:border-primary transition-colors resize-y leading-relaxed"
              spellCheck={false}
            />
          </div>
          <div className="text-[10px] text-muted-foreground dark:text-chassis-foreground/60 flex items-center justify-between">
            <span>Supports <kbd className="text-foreground dark:text-white font-mono bg-muted dark:bg-white/10 px-1 rounded border border-border dark:border-white/10">Tab</kbd> indentation &amp; variable drops</span>
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
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1 dark:text-chassis-foreground">
              {field.label}
            </label>
            {field.description && (
              <p className="text-xs text-muted-foreground leading-relaxed font-medium dark:text-chassis-foreground/70">
                {field.description}
              </p>
            )}
          </div>

          <div className="space-y-5 p-5 bg-muted/20 dark:bg-white/[0.03] rounded-2xl border border-border dark:border-white/10 relative overflow-hidden">
            {/* Top Level: Node Combinator Control */}
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border dark:border-white/10 z-10">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-primary/10 rounded-md border border-primary/20 shadow-xs">
                    <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                  </div>
                  <span className="text-[13px] font-bold text-foreground uppercase tracking-wide dark:text-chassis-foreground">
                    Global Strategy
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1.5 font-medium ml-9 dark:text-chassis-foreground/70">
                  {nodeCombinator === "OR"
                    ? "Passes if ANY condition group matches"
                    : "Passes only if ALL condition groups match"}
                </p>
              </div>

              <div className="flex items-center bg-muted dark:bg-black/40 p-1 rounded-xl border border-border dark:border-white/10">
                <button
                  type="button"
                  onClick={() => updateBuilderState(conditionGroups, "OR")}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${nodeCombinator === "OR"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
                    }`}
                >
                  ANY (OR)
                </button>
                <button
                  type="button"
                  onClick={() => updateBuilderState(conditionGroups, "AND")}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${nodeCombinator === "AND"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10"
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
                        <div className="flex-1 border-t border-dashed border-border dark:border-white/15" />
                        <span className="px-3 py-1 bg-card text-foreground border border-border dark:bg-chassis dark:text-chassis-foreground dark:border-white/15 text-[10px] font-bold uppercase rounded-lg tracking-widest shadow-xs">
                          {nodeCombinator}
                        </span>
                        <div className="flex-1 border-t border-dashed border-border dark:border-white/15" />
                      </div>
                    )}

                    {/* Group Card */}
                    <div className="group/card bg-card dark:bg-white/[0.04] border border-border dark:border-white/10 rounded-2xl p-4 space-y-4 shadow-xs transition-all duration-200">
                      {/* Group Header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border dark:border-white/10 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-black flex items-center justify-center shadow-xs">
                            {groupIndex + 1}
                          </span>
                          <span className="text-[13px] font-bold text-foreground dark:text-chassis-foreground">
                            Condition Group
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Group Combinator Toggle */}
                          <div className="flex items-center bg-muted dark:bg-black/40 p-0.5 rounded-lg border border-border dark:border-white/10">
                            <button
                              type="button"
                              onClick={() => handleGroupCombinatorChange(groupIndex, "AND")}
                              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${isGroupAnd
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                              AND
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGroupCombinatorChange(groupIndex, "OR")}
                              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${!isGroupAnd
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
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
                              className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20 cursor-pointer"
                              title="Delete this group"
                            >
                              <X className="w-3.5 h-3.5" />
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
                              className="flex flex-col gap-3 bg-muted/40 dark:bg-black/30 p-3 rounded-xl border border-border dark:border-white/10 transition-colors"
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
                                  onCaretChange={setActiveCaretOffset}
                                  availableNodes={availableNodes}
                                />
                              </div>

                              {/* Operator Selector */}
                              <div className="relative w-full">
                                <select
                                  value={rule.operator}
                                  onChange={(e) => handleRuleChange(groupIndex, ruleIndex, { operator: e.target.value })}
                                  className="w-full p-2.5 bg-background dark:bg-white/5 border border-input dark:border-white/10 text-[11px] font-bold tracking-wide text-foreground dark:text-white uppercase rounded-lg outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer appearance-none shadow-xs"
                                >
                                  {IF_ELSE_OPERATORS.map((op) => (
                                    <option key={op.id} value={op.id} className="bg-card text-card-foreground dark:bg-chassis dark:text-chassis-foreground normal-case">
                                      {op.label}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 w-full">
                                {/* Operand 2 (Right Value) or Unary Placeholder */}
                                <div className="relative flex-1">
                                  {isUnary ? (
                                    <div className="h-[38px] px-3 flex items-center bg-muted/50 border border-dashed border-border dark:border-white/15 rounded-lg text-[11px] text-muted-foreground italic font-medium select-none">
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
                                      onCaretChange={setActiveCaretOffset}
                                      availableNodes={availableNodes}
                                    />
                                  )}
                                </div>

                                {/* Delete Rule Button */}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRule(groupIndex, ruleIndex)}
                                  disabled={group.conditions.length <= 1}
                                  className="w-[38px] h-[38px] flex-shrink-0 flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors text-xs disabled:opacity-20 disabled:cursor-not-allowed border border-transparent hover:border-rose-500/20 cursor-pointer"
                                  title="Delete condition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Add Condition inside Group */}
                      <div className="pt-2 border-t border-border dark:border-white/10 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleAddRule(groupIndex)}
                          className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary border border-primary/20 rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
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
                className="w-full py-3.5 px-4 bg-muted/30 hover:bg-muted/60 dark:bg-white/[0.02] dark:hover:bg-white/5 border border-dashed border-border dark:border-white/20 rounded-xl text-xs font-bold text-foreground dark:text-chassis-foreground transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
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
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 dark:text-chassis-foreground">
            {field.label}
            {isRequired && <span className="text-rose-500 ml-0.5">*</span>}
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
            className="w-full p-2.5 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all outline-none text-sm dark:bg-white/5 dark:border-white/10 dark:text-white"
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
        <div key={field.name} className="form-group mb-4 p-4 bg-muted/30 rounded-xl border border-border dark:bg-white/5 dark:border-white/10">
          <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1 dark:text-chassis-foreground">
            {field.label}
          </label>
          {field.description && (
            <p className="text-xs text-muted-foreground mb-3 dark:text-chassis-foreground/70">{field.description}</p>
          )}
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={url}
              className="w-full p-2.5 border border-input bg-background text-foreground font-mono text-[11px] sm:text-xs rounded-lg outline-none dark:bg-black/30 dark:border-white/10 dark:text-chassis-foreground"
            />
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(url);
                toast.success("Copied to clipboard!");
              }}
              className="px-3.5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold rounded-lg transition-colors flex-shrink-0 cursor-pointer"
            >
              Copy
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={field.name} className="form-group">
        <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1.5 dark:text-chassis-foreground">
          {field.label}
          {isRequired && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
        <RichVariableInput
          value={String(fieldValue ?? "")}
          placeholder={field.placeholder}
          onFocus={() => setActiveField(field.name)}
          onCaretChange={setActiveCaretOffset}
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

  const renderVariablePanel = () => (
    <div className="w-full h-full min-h-0 rounded-2xl overflow-hidden border border-border bg-card text-card-foreground shadow-sm dark:border-white/10 dark:bg-chassis dark:text-chassis-foreground flex flex-col">
      <div className="px-3 py-2.5 border-b border-border dark:border-white/10 flex items-center justify-between flex-shrink-0 bg-muted/30 dark:bg-white/5">
        <span className="text-xs font-semibold text-foreground dark:text-chassis-foreground flex items-center gap-1.5">
          <Database className="w-4 h-4 text-primary" />
          <span>Previous Nodes</span>
        </span>
        <button
          type="button"
          onClick={() => variablePanelRef.current?.collapse()}
          title="Collapse Variables"
          className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <VariablePanel
          previousNodes={previousNodes}
          onInsert={handleVariableInsert}
          activeField={activeField}
          onTestNode={handleTestPreviousNode}
        />
      </div>
    </div>
  );

  const renderTestPanel = () => {
    const activeTestResult = testResult ?? nodeTestOutput?.data ?? null;
    return (
      <div className="w-full h-full min-h-0 rounded-2xl overflow-hidden border border-border bg-card text-card-foreground shadow-sm dark:border-white/10 dark:bg-chassis dark:text-chassis-foreground flex flex-col">
        <div className="px-3 py-2.5 border-b border-border dark:border-white/10 flex items-center justify-between flex-shrink-0 bg-muted/30 dark:bg-white/5">
          <span className="text-xs font-semibold text-foreground dark:text-chassis-foreground flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4 text-primary" />
            <span>Test Output</span>
          </span>
          <button
            type="button"
            onClick={() => testPanelRef.current?.collapse()}
            title="Collapse Test Output"
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-hidden">
          <TestPanel
            testResult={activeTestResult}
            metadata={nodeTestOutput?.metadata}
            nodeName={selectedNode?.name}
            nodeIcon={selectedNode?.icon}
            isLoading={isTestingNode}
          />
        </div>
      </div>
    );
  };

  const renderFormPanel = () => (
    <div className="rounded-2xl w-full h-full min-h-0 max-h-full overflow-hidden flex flex-col bg-card border border-border text-card-foreground shadow-sm dark:bg-chassis dark:border-white/10 dark:text-chassis-foreground">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card dark:border-white/10 dark:bg-chassis flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <NodeIcon icon={selectedNode.icon} name={selectedNode.name} size="md" />
          <h2 className="text-base font-semibold text-foreground dark:text-chassis-foreground">
            {selectedNode.name}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {isVariableCollapsed && (
            <button
              type="button"
              onClick={() => variablePanelRef.current?.expand()}
              className="text-xs px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground dark:bg-white/10 dark:hover:bg-white/15 dark:text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Expand Variables Panel"
            >
              <Database className="w-3.5 h-3.5 text-primary" />
              <span>Variables</span>
            </button>
          )}
          {isTestCollapsed && (
            <button
              type="button"
              onClick={() => testPanelRef.current?.expand()}
              className="text-xs px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-foreground dark:bg-white/10 dark:hover:bg-white/15 dark:text-white font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Expand Test Output Panel"
            >
              <FlaskConical className="w-3.5 h-3.5 text-primary" />
              <span>Test Output</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/10 transition-colors cursor-pointer"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-5 flex-1 min-h-0 overflow-y-auto no-scrollbar">
        {/* Node info */}
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border dark:bg-white/5 dark:border-white/10">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">ID</span>
              <span className="text-foreground dark:text-white/90 font-mono bg-background border border-border dark:bg-white/10 dark:border-white/10 px-2 py-0.5 rounded text-xs">{selectedNode.id}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Type</span>
              <span className="text-primary font-medium bg-primary/10 border border-primary/20 px-2 py-0.5 rounded text-xs">{selectedNode.type ?? "Trigger"}</span>
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
              <p className="text-rose-500 font-medium">
                No config found for {selectedNode.name}
              </p>
            );
          }
          if ((nodeConfig.fields || []).length === 0) {
            return (
              <div className="text-center py-8 text-foreground dark:text-chassis-foreground">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <p className="text-base font-semibold text-foreground dark:text-white">
                  {nodeConfig.label}
                </p>
                <p className="mt-1 text-sm text-muted-foreground dark:text-chassis-foreground/70">{nodeConfig.description}</p>
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
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border dark:border-white/10 flex justify-between items-center gap-3 bg-card dark:bg-chassis flex-shrink-0">
        {selectedNode.name.toLowerCase().includes("webhook") ? (
          <button
            onClick={handleListenWebhook}
            disabled={isListeningWebhook || loading}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl disabled:opacity-40 flex items-center gap-2 text-sm font-medium transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
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
            className="px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl disabled:opacity-40 flex items-center gap-2 text-sm font-medium transition-all shadow-sm cursor-pointer disabled:cursor-not-allowed"
            type="button"
          >
            {isTestingNode ? (
              <>
                <span className="w-4 h-4 border-2 border-t-transparent border-primary-foreground/60 rounded-full animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <FlaskConical className="w-4 h-4" />
                Test Node
              </>
            )}
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => onClose()}
            disabled={loading}
            className="px-6 py-2.5 bg-muted hover:bg-muted/80 text-foreground dark:bg-white/10 dark:hover:bg-white/20 dark:text-white rounded-xl disabled:opacity-50 text-xs font-semibold transition-all border border-border dark:border-white/15 cursor-pointer shadow-xs"
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-40">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Main container: full screen on mobile, floating on larger screens */}
      <div className="fixed inset-0 sm:m-3 p-1 sm:p-2 sm:rounded-3xl z-50 bg-background/95 border border-border shadow-2xl backdrop-blur-md overflow-hidden flex flex-col dark:bg-chassis dark:border-white/10">
        {/* Mobile / Tablet Tab Switcher */}
        {!isDesktop && (
          <div className="flex items-center gap-1.5 p-2 bg-muted/30 border-b border-border dark:border-white/10 dark:bg-chassis flex-shrink-0">
            <button
              type="button"
              onClick={() => setMobileTab("variables")}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${mobileTab === "variables"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/5"
                }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>Variables</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("config")}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${mobileTab === "config"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/5"
                }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configure</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("test")}
              className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${mobileTab === "test"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted dark:hover:bg-white/5"
                }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Test Output</span>
            </button>
          </div>
        )}

        {isDesktop ? (
          <div className="w-full h-full flex items-stretch min-h-0 overflow-hidden">
            {/* Left rail when Variables panel is collapsed */}
            {isVariableCollapsed && (
              <button
                type="button"
                onClick={() => variablePanelRef.current?.expand()}
                title="Expand Variables Panel"
                className="w-9 h-full flex flex-col items-center justify-center gap-2 border-r border-border dark:border-white/10 bg-card hover:bg-muted dark:bg-chassis dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer flex-shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
                <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-bold tracking-wider uppercase">Variables</span>
              </button>
            )}

            <Group orientation="horizontal" id="buildflow-node-config-panels" className="flex-1 h-full flex items-stretch gap-0 min-w-0">
              {/* Left Panel: Variable / Data Mapping */}
              <Panel
                panelRef={variablePanelRef}
                id="variable-panel"
                defaultSize="30%"
                minSize="18%"
                maxSize="45%"
                collapsible={true}
                collapsedSize={0}
                onResize={(size) => {
                  setIsVariableCollapsed(size.asPercentage === 0);
                }}
                className="h-full min-h-0 min-w-0 flex flex-col p-1.5"
              >
                {renderVariablePanel()}
              </Panel>

              {/* Drag Handle 1 */}
              {!isVariableCollapsed && (
                <Separator className="w-2.5 relative flex items-center justify-center cursor-col-resize group px-0.5 z-20 transition-all select-none">
                  <div className="w-1 h-12 rounded-full bg-border group-hover:bg-primary group-hover:h-24 dark:bg-white/20 dark:group-hover:bg-primary transition-all duration-200 shadow-xs" />
                </Separator>
              )}

              {/* Center Panel: Node Configuration Form */}
              <Panel id="form-panel" defaultSize="38%" minSize="25%" maxSize="100%" className="h-full min-h-0 min-w-0 flex flex-col p-1.5">
                {renderFormPanel()}
              </Panel>

              {/* Drag Handle 2 */}
              {!isTestCollapsed && (
                <Separator className="w-2.5 relative flex items-center justify-center cursor-col-resize group px-0.5 z-20 transition-all select-none">
                  <div className="w-1 h-12 rounded-full bg-border group-hover:bg-primary group-hover:h-24 dark:bg-white/20 dark:group-hover:bg-primary transition-all duration-200 shadow-xs" />
                </Separator>
              )}

              {/* Right Panel: Test Output */}
              <Panel
                panelRef={testPanelRef}
                id="test-panel"
                defaultSize="32%"
                minSize="18%"
                maxSize="65%"
                collapsible={true}
                collapsedSize={0}
                onResize={(size) => {
                  setIsTestCollapsed(size.asPercentage === 0);
                }}
                className="h-full min-h-0 min-w-0 flex flex-col p-1.5"
              >
                {renderTestPanel()}
              </Panel>
            </Group>

            {/* Right rail when Test Output panel is collapsed */}
            {isTestCollapsed && (
              <button
                type="button"
                onClick={() => testPanelRef.current?.expand()}
                title="Expand Test Output Panel"
                className="w-9 h-full flex flex-col items-center justify-center gap-2 border-l border-border dark:border-white/10 bg-card hover:bg-muted dark:bg-chassis dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all cursor-pointer flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-bold tracking-wider uppercase">Test Output</span>
              </button>
            )}
          </div>
        ) : (
          <div className="w-full flex-1 min-h-0 p-1 sm:p-2 overflow-hidden flex flex-col">
            {mobileTab === "variables" && renderVariablePanel()}
            {mobileTab === "config" && renderFormPanel()}
            {mobileTab === "test" && renderTestPanel()}
          </div>
        )}
      </div>

      {/* Google Sheets Create Document / Tab Modal */}
      {createSheetModal.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 flex flex-col gap-4 text-card-foreground dark:bg-chassis dark:border-white/10 dark:text-chassis-foreground">
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-white/10">
              <h3 className="text-base font-semibold flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <span>{createSheetModal.type === "document" ? "Create New Spreadsheet" : "Create New Sheet Tab"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setCreateSheetModal(prev => ({ ...prev, open: false }))}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createSheetModal.type === "document" && (
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1 dark:text-chassis-foreground">Spreadsheet Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Marketing Leads"
                  value={createSheetModal.title}
                  onChange={(e) => setCreateSheetModal(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2.5 border border-input bg-background text-foreground rounded-lg text-sm outline-none focus:border-primary dark:bg-white/5 dark:border-white/10 dark:text-white"
                  autoFocus
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1 dark:text-chassis-foreground">
                {createSheetModal.type === "document" ? "Initial Tab Name (Optional, defaults to Sheet1)" : "Tab Name *"}
              </label>
              <input
                type="text"
                placeholder="e.g. Leads"
                value={createSheetModal.tabName}
                onChange={(e) => setCreateSheetModal(prev => ({ ...prev, tabName: e.target.value }))}
                className="w-full p-2.5 border border-input bg-background text-foreground rounded-lg text-sm outline-none focus:border-primary dark:bg-white/5 dark:border-white/10 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1 dark:text-chassis-foreground">Initial Column Headers (Optional, comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. Name, Email, Phone, Company"
                value={createSheetModal.headers}
                onChange={(e) => setCreateSheetModal(prev => ({ ...prev, headers: e.target.value }))}
                className="w-full p-2.5 border border-input bg-background text-foreground rounded-lg text-sm outline-none focus:border-primary dark:bg-white/5 dark:border-white/10 dark:text-white"
              />
              <p className="text-[11px] text-muted-foreground mt-1 dark:text-chassis-foreground/60">These will be written to Row 1 (A1:...) so you can immediately map columns.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border dark:border-white/10">
              <button
                type="button"
                onClick={() => setCreateSheetModal(prev => ({ ...prev, open: false }))}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  createSheetModal.isSubmitting ||
                  (createSheetModal.type === "document"
                    ? !createSheetModal.title.trim()
                    : !createSheetModal.tabName.trim())
                }
                onClick={handleCreateSheetSubmit}
                className="px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs"
              >
                {createSheetModal.isSubmitting ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
