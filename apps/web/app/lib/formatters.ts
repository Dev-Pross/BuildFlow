// Utility formatters for execution history display

export const formatDate = (date: Date | string | undefined): string => {
  if (!date) return '—';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return '—';
    }

    return dateObj.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
};

export const formatDuration = (
  startDate: Date | string | undefined,
  endDate: Date | string | undefined
): string => {
  if (!startDate || !endDate) return '—';

  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return '—';
    }

    const diffMs = Math.max(0, end.getTime() - start.getTime());
    const totalSeconds = Math.floor(diffMs / 1000);

    if (totalSeconds === 0) {
      return '0s';
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];

    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0) {
      parts.push(`${minutes}m`);
    }
    if (seconds > 0 || parts.length === 0) {
      parts.push(`${seconds}s`);
    }

    return parts.join(' ');
  } catch {
    return '—';
  }
};

export const getStatusColor = (status: string | undefined): string => {
  if (!status) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }

  const normalizedStatus = status.trim();

  switch (normalizedStatus) {
    case 'Completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'Failed':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'InProgress':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'ReConnecting':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'Start':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  }
};

export const getStatusLabel = (status: string | undefined): string => {
  if (!status) return 'Unknown';

  const normalizedStatus = status.trim();

  switch (normalizedStatus) {
    case 'Start':
      return 'Started';
    case 'Pending':
      return 'Pending';
    case 'InProgress':
      return 'In Progress';
    case 'ReConnecting':
      return 'Reconnecting';
    case 'Failed':
      return 'Failed';
    case 'Completed':
      return 'Completed';
    default:
      return status;
  }
};

export const formatJson = (data: any): string => {
  if (data === null || data === undefined) return 'null';

  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

export const parseJsonSafe = (str: string): any => {
  if (!str || typeof str !== 'string') {
    return null;
  }

  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'Completed':
      return '✓';
    case 'Failed':
      return '✕';
    case 'InProgress':
      return '⟳';
    case 'Pending':
      return '⋯';
    case 'ReConnecting':
      return '↻';
    case 'Start':
      return '●';
    default:
      return '○';
  }
};
