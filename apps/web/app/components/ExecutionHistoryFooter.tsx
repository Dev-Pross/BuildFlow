'use client';

import React, { useEffect, useState, useRef } from 'react';
import { WorkflowExecutionLog } from '@/app/types/execution.types';
import {
  formatDate,
  getStatusColor,
  getStatusLabel,
} from '@/app/lib/formatters';

interface ExecutionHistoryFooterProps {
  workflowId: string;
  onExecutionFetch: (executions: WorkflowExecutionLog[]) => void;
  isLoading?: boolean;
  autoRefreshInterval?: number; // in milliseconds, default 5000 (5 seconds)
}

// Inline table component for simplicity
const ExecutionListTable: React.FC<{
  executions: WorkflowExecutionLog[];
  selectedExecution?: WorkflowExecutionLog | null;
  onSelectExecution: (execution: WorkflowExecutionLog) => void;
  onLoadMore: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
}> = ({ executions, selectedExecution, onSelectExecution, isLoading }) => {
  if (executions.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No executions found</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto max-h-64 overflow-y-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 sticky top-0">
            <th className="text-left px-3 py-2 font-semibold">Started At</th>
            <th className="text-left px-3 py-2 font-semibold">Status</th>
            <th className="text-left px-3 py-2 font-semibold">Error</th>
          </tr>
        </thead>
        <tbody>
          {executions.map((execution) => {
            const isSelected = selectedExecution?.id === execution.id;
            const statusColor = getStatusColor(execution.status);

            return (
              <tr
                key={execution.id}
                onClick={() => onSelectExecution(execution)}
                className={`border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                  isSelected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                }`}
              >
                <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                  {formatDate(execution.startAt)}
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColor}`}>
                    {getStatusLabel(execution.status)}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-800 dark:text-gray-200 truncate text-xs">
                  {execution.error ? execution.error.substring(0, 40) + '...' : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

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

  // Load initial execution history
  useEffect(() => {
    fetchExecutionLogs();
    
    // Initialize localStorage state
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

    // Initial fetch immediately
    fetchExecutionLogs();

    // Setup polling interval
    refreshIntervalRef.current = setInterval(() => {
      const now = Date.now();
      // Only fetch if enough time has passed since last fetch
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

  // Persist expanded state to localStorage
  useEffect(() => {
    localStorage.setItem('executionFooterExpanded', JSON.stringify(isExpanded));
  }, [isExpanded]);

  const fetchExecutionLogs = async () => {
    try {
      setFooterLoading(true);
      // Import API dynamically to avoid issues
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
  };

  const lastExecution = executions[0];
  const lastStatus = lastExecution ? getStatusLabel(lastExecution.status) : 'No executions';

  return (
    <>
      {/* Sticky Footer Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
        <div className="h-14 px-4 flex items-center justify-between">
          {/* Left side - Title and status */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
              📊 Execution History
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Last: {lastStatus}
            </span>
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={fetchExecutionLogs}
              disabled={footerLoading}
              className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white rounded transition-colors font-medium"
              title="Refresh execution logs"
            >
              {footerLoading ? '⟳' : '🔄'}
            </button>
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`px-3 py-1 text-xs rounded transition-colors font-medium ${
                autoRefreshEnabled
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
              }`}
              title={autoRefreshEnabled ? 'Auto-refresh enabled' : 'Auto-refresh disabled'}
            >
              {autoRefreshEnabled ? '✓' : '✗'}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded transition-colors font-medium"
              title={isExpanded ? 'Minimize' : 'Expand'}
            >
              {isExpanded ? '▼' : '▲'}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="fixed bottom-14 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40 overflow-hidden transition-all"
        style={{ height: '60vh', maxHeight: '60vh' }}>
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-gray-200">Execution History</h2>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {footerLoading && executions.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Loading executions...</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Executions Table */}
                  <div className="mb-4">
                    <ExecutionListTable
                      executions={executions}
                      selectedExecution={selectedExecution}
                      onSelectExecution={setSelectedExecution}
                      onLoadMore={() => {}}
                      isLoading={footerLoading}
                      hasMore={false}
                    />
                  </div>

                  {/* Selected Execution Details */}
                  {selectedExecution && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                      <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200 mb-3">
                        Execution Details
                      </h3>
                      <div className="space-y-2 text-xs">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Status:</p>
                          <p className="text-gray-800 dark:text-gray-200">
                            {getStatusLabel(selectedExecution.status)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Started:</p>
                          <p className="text-gray-800 dark:text-gray-200">
                            {formatDate(selectedExecution.startAt)}
                          </p>
                        </div>
                        {selectedExecution.error && (
                          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-red-700 dark:text-red-300">
                            <p className="font-semibold">Error:</p>
                            <p>{selectedExecution.error}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Nodes executed:</p>
                          <p className="text-gray-800 dark:text-gray-200">
                            {selectedExecution.nodeExecutions?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add padding to page if footer is expanded */}
      {isExpanded && <div style={{ height: '60vh', marginTop: '3.5rem' }} />}
    </>
  );
}
