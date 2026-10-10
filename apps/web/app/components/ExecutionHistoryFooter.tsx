'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSidebar } from "@workspace/ui/components/sidebar";
import {
  Activity,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  X,
} from 'lucide-react';
import { WorkflowExecutionLog, NodeExecutionLog } from '@/app/types/execution.types';
import {
  formatDate,
  formatDuration,
  getStatusIcon,
} from '@/app/lib/formatters';

interface ExecutionHistoryFooterProps {
  workflowId: string;
  onExecutionFetch?: (executions: WorkflowExecutionLog[]) => void;
  isLoading?: boolean;
  refreshTrigger?: number;
}

// ─── Status Badge ───
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    Completed: 'background:rgba(16,185,129,0.15);color:#34d399;border:1px solid rgba(16,185,129,0.3);',
    Failed: 'background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);',
    InProgress: 'background:rgba(99,102,241,0.15);color:#818cf8;border:1px solid rgba(99,102,241,0.3);',
    Pending: 'background:rgba(245,158,11,0.15);color:#fbbf24;border:1px solid rgba(245,158,11,0.3);',
    Start: 'background:rgba(148,163,184,0.15);color:#cbd5e1;border:1px solid rgba(148,163,184,0.3);',
    ReConnecting: 'background:rgba(249,115,22,0.15);color:#fb923c;border:1px solid rgba(249,115,22,0.3);',
  };
  return (
    <span
      style={{
        ...Object.fromEntries((styles[status] || styles.Start)!.split(';').filter(Boolean).map(s => {
          const [k, v] = s.split(':');
          return [k!.trim().replace(/-([a-z])/g, (_, l) => l.toUpperCase()), v!.trim()];
        })),
        padding: '3px 10px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.3px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {getStatusIcon(status)} {status}
    </span>
  );
};

// ─── Test Badge ───
const TestBadge: React.FC<{ isTest: boolean }> = ({ isTest }) => {
  if (!isTest) return <span style={{ color: '#6b7280', fontSize: '11px' }}>—</span>;
  return (
    <span style={{
      background: 'rgba(99,102,241,0.2)',
      color: '#a5b4fc',
      border: '1px solid rgba(99,102,241,0.3)',
      padding: '2px 8px',
      borderRadius: '6px',
      fontSize: '10px',
      fontWeight: 700,
      letterSpacing: '0.5px',
      textTransform: 'uppercase' as const,
    }}>
      TEST
    </span>
  );
};

// ─── Collapsible JSON Viewer ───
const JsonViewer: React.FC<{ data: any; label: string; accent: string }> = ({ data, label, accent }) => {
  const [open, setOpen] = useState(false);
  if (data === null || data === undefined) return null;
  
  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  return (
    <div style={{ marginTop: '6px' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: `1px solid ${accent}33`,
          color: accent,
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.15s ease',
        }}
      >
        {open ? '▾' : '▸'} {label}
      </button>
      {open && (
        <pre style={{
          marginTop: '6px',
          padding: '12px',
          background: '#141518',
          border: '1px solid #222429',
          borderRadius: '8px',
          fontSize: '11px',
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          color: '#e2e8f0',
          overflowX: 'auto',
          maxHeight: '240px',
          overflowY: 'auto',
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {jsonStr}
        </pre>
      )}
    </div>
  );
};

// ─── Node Execution Detail Row ───
const NodeExecutionRow: React.FC<{ nodeExec: NodeExecutionLog }> = ({ nodeExec }) => {
  const [expanded, setExpanded] = useState(false);
  const nodeName = nodeExec.node?.name || 'Unknown Node';

  return (
    <>
      <tr
        onClick={() => setExpanded(!expanded)}
        style={{
          cursor: 'pointer',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = '#141b2d')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <td style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 500, color: '#e2e8f0' }}>
          <span style={{ marginRight: '6px', color: '#64748b', fontSize: '10px' }}>
            {expanded ? '▾' : '▸'}
          </span>
          {nodeName}
        </td>
        <td style={{ padding: '8px 12px' }}>
          <StatusBadge status={nodeExec.status} />
        </td>
        <td style={{ padding: '8px 12px' }}>
          <TestBadge isTest={nodeExec.isTest} />
        </td>
        <td style={{ padding: '8px 12px', fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
          {formatDate(nodeExec.startedAt)}
        </td>
        <td style={{ padding: '8px 12px', fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
          {nodeExec.completedAt ? formatDate(nodeExec.completedAt) : '—'}
        </td>
        <td style={{ padding: '8px 12px', fontSize: '11px', color: '#cbd5e1', fontWeight: 500 }}>
          {formatDuration(nodeExec.startedAt, nodeExec.completedAt || undefined)}
        </td>
        <td style={{ padding: '8px 12px', fontSize: '11px', color: nodeExec.error ? '#fca5a5' : '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
          {nodeExec.error ? nodeExec.error.substring(0, 60) + (nodeExec.error.length > 60 ? '...' : '') : '—'}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} style={{ padding: '0 12px 12px 36px', background: '#0a0e1a' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <JsonViewer data={nodeExec.inputData} label="Input Data" accent="#3b82f6" />
              <JsonViewer data={nodeExec.outputData} label="Output Data" accent="#10b981" />
            </div>
            {nodeExec.error && (
              <div style={{
                marginTop: '8px',
                padding: '10px 14px',
                background: '#1c0a0a',
                border: '1px solid #7f1d1d',
                borderRadius: '8px',
                color: '#fca5a5',
                fontSize: '12px',
                lineHeight: 1.5,
              }}>
                <strong style={{ color: '#f87171' }}>Error: </strong>{nodeExec.error}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
};

// ─── Main Component ───
export default function ExecutionHistoryFooter({
  workflowId,
  onExecutionFetch,
  isLoading = false,
  refreshTrigger,
}: ExecutionHistoryFooterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [executions, setExecutions] = useState<WorkflowExecutionLog[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecutionLog | null>(null);
  const [footerLoading, setFooterLoading] = useState(false);
  const onExecutionFetchRef = useRef(onExecutionFetch);

  useEffect(() => {
    onExecutionFetchRef.current = onExecutionFetch;
  }, [onExecutionFetch]);

  // Detect sidebar state reactively via useSidebar
  const { state: sidebarState } = useSidebar();
  const sidebarWidth = sidebarState === 'collapsed' ? 48 : 256;

  // Drawer height state for vertical resizing
  const [drawerHeight, setDrawerHeight] = useState<number>(450);
  const isDraggingRef = useRef(false);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const startY = e.clientY;
    const startH = drawerHeight;

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaY = startY - moveEvent.clientY;
      const maxHeight = typeof window !== 'undefined' ? window.innerHeight - 80 : 800;
      const newH = Math.min(Math.max(startH + deltaY, 200), maxHeight);
      setDrawerHeight(newH);
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const fetchExecutionLogs = useCallback(async () => {
    if (!workflowId) return;
    try {
      setFooterLoading(true);
      const { api } = await import('@/app/lib/api');
      const logs = await api.executions.getWorkflowLogs(workflowId, 0, 20);
      const executionsList = Array.isArray(logs) ? logs : [];
      setExecutions(executionsList);
      onExecutionFetchRef.current?.(executionsList);
    } catch (error) {
      console.error('Failed to fetch execution logs:', error);
    } finally {
      setFooterLoading(false);
    }
  }, [workflowId]);

  // Load initial execution history
  useEffect(() => {
    fetchExecutionLogs();
    
    const savedExpandedState = localStorage.getItem('executionFooterExpanded');
    if (savedExpandedState !== null) {
      setIsExpanded(JSON.parse(savedExpandedState));
    }
  }, [fetchExecutionLogs]);

  // Persist expanded state
  useEffect(() => {
    localStorage.setItem('executionFooterExpanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  // Immediately refresh execution logs when an SSE event fires
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchExecutionLogs();
    }
  }, [refreshTrigger, fetchExecutionLogs]);

  const hasAnyTest = (exec: WorkflowExecutionLog) => {
    return exec.nodeExecutions?.some(ne => ne.isTest) || false;
  };

  const lastExecution = executions[0];
  const lastStatus = lastExecution?.status || 'No executions';

  return (
    <>
      {/* ── Sticky Footer Bar ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: sidebarWidth,
          right: 0,
          height: '48px',
          background: 'rgba(15, 16, 18, 0.95)',
          borderTop: '1px solid #27282d',
          zIndex: 9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 64px 0 16px',
          transition: 'left 0.2s ease',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <Activity style={{ width: '15px', height: '15px', color: '#818cf8', flexShrink: 0 }} />
            <span>Executions</span>
          </span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Last: <StatusBadge status={lastStatus} />
          </span>
          <span style={{ fontSize: '11px', color: '#475569' }}>
            {executions.length} runs
          </span>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={fetchExecutionLogs}
            disabled={footerLoading}
            style={{
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 600,
              background: footerLoading ? '#18191c' : '#ffffff',
              color: footerLoading ? '#9ca3af' : '#000000',
              border: 'none',
              borderRadius: '6px',
              cursor: footerLoading ? 'wait' : 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw
              style={{
                width: '12px',
                height: '12px',
                animation: footerLoading ? 'spin 1s linear infinite' : 'none',
              }}
            />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
              if (!isExpanded) setSelectedExecution(null);
            }}
            style={{
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: 600,
              background: isExpanded ? '#18191c' : '#ffffff',
              color: isExpanded ? '#9ca3af' : '#000000',
              border: isExpanded ? '1px solid #27282d' : 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            {isExpanded ? (
              <>
                <ChevronDown style={{ width: '13px', height: '13px' }} />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <ChevronUp style={{ width: '13px', height: '13px' }} />
                <span>Expand</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Expanded Panel ── */}
      {isExpanded && (
        <div
          style={{
            position: 'fixed',
            bottom: '48px',
            left: sidebarWidth,
            right: 0,
            height: `${drawerHeight}px`,
            background: '#0f1012',
            borderTop: '1px solid #27282d',
            zIndex: 8,
            display: 'flex',
            flexDirection: 'column',
            transition: 'left 0.2s ease',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Top Resizable Drag Handle */}
          <div
            onMouseDown={handleResizeMouseDown}
            style={{
              height: '8px',
              cursor: 'row-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              userSelect: 'none',
              width: '100%',
              background: 'transparent',
              position: 'relative',
              zIndex: 10,
            }}
            className="group hover:bg-white/5 transition-colors"
          >
            <div
              style={{
                width: '48px',
                height: '3px',
                borderRadius: '9999px',
                backgroundColor: '#37383e',
                transition: 'all 0.2s ease',
              }}
              className="group-hover:bg-indigo-400 group-hover:w-20"
            />
          </div>
          {/* Panel Header */}
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid #222429',
            background: '#141518',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedExecution ? (
                <>
                  <button
                    onClick={() => setSelectedExecution(null)}
                    style={{
                      background: 'none',
                      border: '1px solid #27282d',
                      color: '#9ca3af',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <ArrowLeft style={{ width: '12px', height: '12px' }} />
                    <span>Back</span>
                  </button>
                  <span>Node Executions</span>
                  <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                    {selectedExecution.id.substring(0, 8)}…
                  </span>
                </>
              ) : (
                'Workflow Executions'
              )}
            </h2>
            <button
              onClick={() => setIsExpanded(false)}
              style={{
                background: 'none',
                border: '1px solid #334155',
                color: '#64748b',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#6366f1'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#334155'; }}
            >
              <X style={{ width: '14px', height: '14px' }} />
            </button>
          </div>

          {/* Panel Body */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
            {footerLoading && executions.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: '32px', height: '32px', border: '3px solid #3b82f6', borderTopColor: 'transparent',
                    borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 8px',
                  }} />
                  <p style={{ fontSize: '13px', color: '#64748b' }}>Loading executions…</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              </div>
            ) : !selectedExecution ? (
              /* ─── Level 1: Workflow Executions Table ─── */
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{
                    background: '#141518',
                    borderBottom: '1px solid #222429',
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                  }}>
                    {['#', 'Execution ID', 'Status', 'Test', 'Started', 'Completed', 'Duration', 'Nodes', 'Error'].map(h => (
                      <th key={h} style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {executions.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                        No executions found. Execute your workflow to see results here.
                      </td>
                    </tr>
                  ) : (
                    executions.map((exec, idx) => (
                      <tr
                        key={exec.id}
                        onClick={() => setSelectedExecution(exec)}
                        style={{
                          cursor: 'pointer',
                          borderBottom: '1px solid #111827',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#141b2d')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '10px 12px', fontSize: '11px', color: '#475569', fontWeight: 500 }}>
                          {executions.length - idx}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '11px', color: '#818cf8', fontFamily: "'JetBrains Mono', monospace" }}>
                          {exec.id.substring(0, 8)}…
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <StatusBadge status={exec.status} />
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <TestBadge isTest={hasAnyTest(exec)} />
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                          {formatDate(exec.startAt)}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                          {exec.completedAt ? formatDate(exec.completedAt) : '—'}
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>
                          {formatDuration(exec.startAt, exec.completedAt || undefined)}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            background: '#1e293b',
                            color: '#94a3b8',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                          }}>
                            {exec.nodeExecutions?.length || 0}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: '11px', color: exec.error ? '#fca5a5' : '#475569', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {exec.error ? exec.error.substring(0, 50) + (exec.error.length > 50 ? '…' : '') : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              /* ─── Level 2: Node Executions Table ─── */
              <div>
                {/* Execution Summary Bar */}
                <div style={{
                  padding: '12px 20px',
                  background: '#0c1019',
                  borderBottom: '1px solid #1e293b',
                  display: 'flex',
                  gap: '24px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}>
                  <div style={{ fontSize: '11px' }}>
                    <span style={{ color: '#64748b' }}>Status: </span>
                    <StatusBadge status={selectedExecution.status} />
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    <span style={{ color: '#64748b' }}>Started: </span>
                    {formatDate(selectedExecution.startAt)}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    <span style={{ color: '#64748b' }}>Duration: </span>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>
                      {formatDuration(selectedExecution.startAt, selectedExecution.completedAt || undefined)}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    <span style={{ color: '#64748b' }}>Nodes: </span>
                    {selectedExecution.nodeExecutions?.length || 0}
                  </div>
                </div>

                {/* Error Banner */}
                {selectedExecution.error && (
                  <div style={{
                    margin: '12px 20px 0',
                    padding: '10px 14px',
                    background: 'linear-gradient(135deg, #1c0a0a, #1a0505)',
                    border: '1px solid #7f1d1d',
                    borderRadius: '8px',
                    color: '#fca5a5',
                    fontSize: '12px',
                    lineHeight: 1.5,
                  }}>
                    <strong style={{ color: '#f87171' }}>Workflow Error: </strong>{selectedExecution.error}
                  </div>
                )}

                {/* Node Executions Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '4px' }}>
                  <thead>
                    <tr style={{
                      background: '#0c1019',
                      borderBottom: '1px solid #1e293b',
                      position: 'sticky',
                      top: 0,
                      zIndex: 2,
                    }}>
                      {['Node Name', 'Status', 'Test', 'Started', 'Completed', 'Duration', 'Error'].map(h => (
                        <th key={h} style={{
                          padding: '10px 12px',
                          textAlign: 'left',
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#64748b',
                          textTransform: 'uppercase',
                          letterSpacing: '0.8px',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(!selectedExecution.nodeExecutions || selectedExecution.nodeExecutions.length === 0) ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                          No node executions recorded.
                        </td>
                      </tr>
                    ) : (
                      selectedExecution.nodeExecutions.map(ne => (
                        <NodeExecutionRow key={ne.id} nodeExec={ne} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
