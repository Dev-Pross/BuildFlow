// Error formatting helpers for naive user consumption

export const formatErrorMessage = (error: string | null | undefined): string => {
  if (!error) return '—';

  try {
    // Remove common technical jargon and stack traces
    let message = error
      .replace(/Error: /g, '')
      .replace(/TypeError: /g, '')
      .replace(/ReferenceError: /g, '')
      .replace(/SyntaxError: /g, '')
      .replace(/at \w+.*:\d+:\d+/g, '')
      .replace(/\n.*$/gs, '')
      .trim();

    // If error starts with a backtick, it's likely JSON or code, don't modify
    if (message.startsWith('`')) {
      return message.slice(1, -1);
    }

    // Truncate very long errors to be user-friendly
    if (message.length > 200) {
      message = message.substring(0, 200) + '...';
    }

    return message || 'Unknown error occurred';
  } catch {
    return String(error).substring(0, 200);
  }
};

export const getErrorSeverity = (error: string | null | undefined): 'critical' | 'warning' | 'info' => {
  if (!error) return 'info';

  const errorLower = error.toLowerCase();

  // Critical errors
  if (
    errorLower.includes('fail') ||
    errorLower.includes('error') ||
    errorLower.includes('fatal') ||
    errorLower.includes('crash') ||
    errorLower.includes('exception')
  ) {
    return 'critical';
  }

  // Warnings
  if (
    errorLower.includes('warn') ||
    errorLower.includes('timeout') ||
    errorLower.includes('retry') ||
    errorLower.includes('deprecated') ||
    errorLower.includes('connection')
  ) {
    return 'warning';
  }

  return 'info';
};

export interface ErrorContext {
  level: 'workflow' | 'node';
  nodeId?: string;
  nodeName?: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

export const extractErrorContext = (
  workflowError: string | null | undefined,
  nodeErrors: Array<{ nodeId: string; nodeName?: string; error: string | null }> = []
): ErrorContext[] => {
  const errors: ErrorContext[] = [];

  // Add workflow-level error if present
  if (workflowError) {
    errors.push({
      level: 'workflow',
      message: formatErrorMessage(workflowError),
      severity: getErrorSeverity(workflowError),
    });
  }

  // Add node-level errors if present
  for (const nodeError of nodeErrors) {
    if (nodeError.error) {
      errors.push({
        level: 'node',
        nodeId: nodeError.nodeId,
        nodeName: nodeError.nodeName,
        message: formatErrorMessage(nodeError.error),
        severity: getErrorSeverity(nodeError.error),
      });
    }
  }

  return errors;
};

export const getSeverityColor = (severity: 'critical' | 'warning' | 'info'): string => {
  switch (severity) {
    case 'critical':
      return 'text-red-700 dark:text-red-400';
    case 'warning':
      return 'text-yellow-700 dark:text-yellow-400';
    case 'info':
      return 'text-blue-700 dark:text-blue-400';
  }
};

export const getSeverityIcon = (severity: 'critical' | 'warning' | 'info'): string => {
  switch (severity) {
    case 'critical':
      return '⚠️';
    case 'warning':
      return '⚡';
    case 'info':
      return 'ℹ️';
  }
};
