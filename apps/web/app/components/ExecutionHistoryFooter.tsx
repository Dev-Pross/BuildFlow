'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { WorkflowExecutionLog, NodeExecutionLog } from '@/app/types/execution.types';
import {
  formatDate,
  formatDuration,
  getStatusIcon,
} from '@/app/lib/formatters';

interface ExecutionHistoryFooterProps {
  workflowId: string;
  onExecutionFetch: (executions: WorkflowExecutionLog[]) => void;
  isLoading?: boolean;
  autoRefreshInterval?: number;
}

// ─── Status Badge ───
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    Completed: 'background:linear-gradient(135deg,#059669,#10b981);color:#ecfdf5;',
    Failed: 'background:linear-gradient(135deg,#dc2626,#ef4444);color:#fef2f2;',
    InProgress: 'background:linear-gradient(135deg,#2563eb,#3b82f6);color:#eff6ff;',
    Pending: 'background:linear-gradient(135deg,#d97706,#f59e0b);color:#fffbeb;',
    Start: 'background:linear-gradient(135deg,#6b7280,#9ca3af);color:#f9fafb;',
    ReConnecting: 'background:linear-gradient(135deg,#ea580c,#f97316);color:#fff7ed;',
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
      background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
      color: '#f5f3ff',
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
          background: '#0c0f1a',
          border: '1px solid #1e293b',
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
  autoRefreshInterval = 5000,
}: ExecutionHistoryFooterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [executions, setExecutions] = useState<WorkflowExecutionLog[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecutionLog | null>(null);
  const [footerLoading, setFooterLoading] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchRef = useRef<number>(0);

  // Detect sidebar state via CSS custom property / DOM attribute
  const [sidebarWidth, setSidebarWidth] = useState(256); // 16rem default

  useEffect(() => {
    const observeSidebar = () => {
      const wrapper = document.querySelector('[data-slot="sidebar-wrapper"]');
      if (!wrapper) return;
      
      const observer = new MutationObserver(() => {
        const sidebarEl = document.querySelector('[data-slot="sidebar"]');
        if (sidebarEl) {
          const state = sidebarEl.getAttribute('data-state');
          setSidebarWidth(state === 'collapsed' ? 48 : 256);
        }
      });
      
      observer.observe(wrapper, { attributes: true, subtree: true, attributeFilter: ['data-state'] });
      
      // Initial check
      const sidebarEl = document.querySelector('[data-slot="sidebar"]');
      if (sidebarEl) {
        const state = sidebarEl.getAttribute('data-state');
        setSidebarWidth(state === 'collapsed' ? 48 : 256);
      }
      
      return () => observer.disconnect();
    };

    const cleanup = observeSidebar();
    return () => cleanup?.();
  }, []);

  // Load initial execution history
  useEffect(() => {
    fetchExecutionLogs();
    
    const savedExpandedState = localStorage.getItem('executionFooterExpanded');
    if (savedExpandedState !== null) {
      setIsExpanded(JSON.parse(savedExpandedState));
    }
  }, [workflowId]);

  // Setup auto-refresh polling
  useEffect(() => {
    if (!autoRefreshEnabled) {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      return;
    }

    fetchExecutionLogs();

    refreshIntervalRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastFetchRef.current >= autoRefreshInterval) {
        fetchExecutionLogs();
      }
    }, autoRefreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, [autoRefreshEnabled, autoRefreshInterval]);

  // Persist expanded state
  useEffect(() => {
    localStorage.setItem('executionFooterExpanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  const fetchExecutionLogs = useCallback(async () => {
    try {
      setFooterLoading(true);
      const { api } = await import('@/app/lib/api');
      const logs = await api.executions.getWorkflowLogs(workflowId, 0, 20);
      const executionsList = Array.isArray(logs) ? logs : [];
      setExecutions(executionsList);
      onExecutionFetch(executionsList);
      lastFetchRef.current = Date.now();
    } catch (error) {
      console.error('Failed to fetch execution logs:', error);
    } finally {
      setFooterLoading(false);
    }
  }, [workflowId, onExecutionFetch]);

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
          background: 'linear-gradient(135deg, #0f1420 0%, #141b2d 100%)',
          borderTop: '1px solid #1e293b',
          zIndex: 9,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          transition: 'left 0.2s ease',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            📊 Executions
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
              background: footerLoading ? '#1e293b' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: footerLoading ? 'wait' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {footerLoading ? '⟳' : '↻ Refresh'}
          </button>
          <button
            onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              background: autoRefreshEnabled ? 'linear-gradient(135deg, #059669, #10b981)' : '#1e293b',
              color: autoRefreshEnabled ? '#ecfdf5' : '#94a3b8',
              border: autoRefreshEnabled ? 'none' : '1px solid #334155',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {autoRefreshEnabled ? '● Live' : '○ Paused'}
          </button>
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
              if (!isExpanded) setSelectedExecution(null);
            }}
            style={{
              padding: '4px 14px',
              fontSize: '11px',
              fontWeight: 600,
              background: isExpanded ? '#1e293b' : 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: isExpanded ? '#94a3b8' : '#fff',
              border: isExpanded ? '1px solid #334155' : 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {isExpanded ? '▼ Collapse' : '▲ Expand'}
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
            height: '55vh',
            background: 'linear-gradient(180deg, #0a0e17 0%, #0f1420 100%)',
            borderTop: '1px solid #1e293b',
            zIndex: 8,
            display: 'flex',
            flexDirection: 'column',
            transition: 'left 0.2s ease',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Panel Header */}
          <div style={{
            padding: '12px 20px',
            borderBottom: '1px solid #1e293b',
            background: 'linear-gradient(135deg, #0f1420 0%, #141b2d 100%)',
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
                      border: '1px solid #334155',
                      color: '#94a3b8',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    ← Back
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
                fontSize: '14px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#6366f1'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#334155'; }}
            >
              ✕
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
                    background: '#0c1019',
                    borderBottom: '1px solid #1e293b',
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
