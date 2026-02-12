/**
 * Variable Interpolation Utility for BuildFlow
 * 
 * Resolves {{variable}} syntax in node configurations using data
 * from previous node executions.
 * 
 * Syntax: {{nodeName.path}}
 * Examples:
 *   - {{google_sheets.rows[0].email}}
 *   - {{google_sheets.rowCount}}
 *   - {{webhook.body.name}}
 */

// Regex to match {{variable}} patterns
const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * Safely gets a nested value from an object using a dot-notation path
 * Supports array indexing: "rows[0].email"
 * 
 * @param obj - The object to extract value from
 * @param path - Dot-notation path (e.g., "rows[0].email")
 * @returns The value at the path, or undefined if not found
 */
export function getNestedValue(obj: any, path: string): any {
  if (!obj || !path) return undefined;

  // Split path and handle array notation
  // "rows[0].email" -> ["rows", "0", "email"]
  const keys = path
    .replace(/\[(\d+)\]/g, '.$1')  // Convert [0] to .0
    .split('.')
    .filter(Boolean);

  let current = obj;
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

/**
 * Context containing data from all previous nodes
 * Key is the normalized node name (lowercase, underscores)
 */
export interface InterpolationContext {
  [nodeName: string]: any;
}

/**
 * Builds interpolation context from execution data
 * Maps node names to their output data
 * 
 * @param nodeOutputs - Array of {nodeName, outputData} from previous executions
 * @returns Context object for interpolation
 */
export function buildInterpolationContext(
  nodeOutputs: Array<{ nodeName: string; outputData: any }>
): InterpolationContext {
  const context: InterpolationContext = {};
  
  for (const { nodeName, outputData } of nodeOutputs) {
    // Normalize node name: "Google Sheets" -> "google_sheets"
    const normalizedName = nodeName.toLowerCase().replace(/\s+/g, '_');
    context[normalizedName] = outputData;
  }
  
  return context;
}

/**
 * Resolves a single variable reference
 * Supports both column-based syntax ({{google_sheet.email}}) and
 * legacy path syntax ({{google_sheet.rows[1][0]}})
 * 
 * @param variable - The variable path without braces
 * @param context - The interpolation context
 * @returns The resolved value or the original {{variable}} if not found
 */
export function resolveVariable(variable: string, context: InterpolationContext): any {
  const trimmed = variable.trim();
  
  const dotIndex = trimmed.indexOf('.');
  if (dotIndex === -1) {
    return context[trimmed];
  }
  
  const nodeName = trimmed.substring(0, dotIndex);
  const path = trimmed.substring(dotIndex + 1);
  
  const nodeData = context[nodeName];
  if (nodeData === undefined) {
    return `{{${variable}}}`;
  }
  
  // Column-based resolution: {{google_sheet.email}} → rows[currentRow][columnIndex]
  if (nodeData.columns && nodeData.columns[path] !== undefined) {
    const colIndex = nodeData.columns[path];
    const rowIndex = nodeData._currentRowIndex ?? nodeData.dataStartIndex ?? 1;
    const value = nodeData.rows?.[rowIndex]?.[colIndex];
    return value !== undefined ? value : `{{${variable}}}`;
  }
  
  // Fallback: standard nested path resolution (e.g., rows[1][0])
  const value = getNestedValue(nodeData, path);
  return value !== undefined ? value : `{{${variable}}}`;
}

/**
 * Resolves all {{variable}} references in a string
 * 
 * @param template - String containing {{variable}} placeholders
 * @param context - The interpolation context
 * @returns String with all variables resolved
 */
export function interpolateString(template: string, context: InterpolationContext): string {
  if (!template || typeof template !== 'string') return template;
  
  // Create a new regex instance to avoid global flag issues
  const regex = /\{\{([^}]+)\}\}/g;
  
  console.log(`[interpolateString] Input: "${template}"`);
  console.log(`[interpolateString] Context keys: ${Object.keys(context).join(', ')}`);
  
  const result = template.replace(regex, (match, variable) => {
    console.log(`[interpolateString] Found variable: "${variable}"`);
    console.log(`[interpolateString] MATCH variable: "${match}"`);
    const resolved = resolveVariable(variable, context);
    console.log(`[interpolateString] Resolved to: ${JSON.stringify(resolved)}`);
    
    // Convert non-string values to string for template replacement
    if (typeof resolved === 'object') {
      return JSON.stringify(resolved);
    }
    return String(resolved ?? match);
  });
  
  console.log(`[interpolateString] Output: "${result}"`);
  return result;
}

/**
 * Recursively resolves all {{variable}} references in a config object
 * Handles nested objects and arrays
 * 
 * @param config - The configuration object with potential variables
 * @param context - The interpolation context
 * @returns New object with all variables resolved
 */
export function  resolveConfigVariables<T extends Record<string, any>>(
  config: T,
  context: InterpolationContext
): T {
  if (!config || typeof config !== 'object') {
    console.log("[---*---] config not an onject type")
    return config;
  }

  // Handle arrays
  if (Array.isArray(config)) {
    return config.map(item => resolveConfigVariables(item, context)) as unknown as T;
  }

  // Handle objects
  const resolved: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(config)) {
    if (typeof value === 'string') {
      resolved[key] = interpolateString(value, context);
    } else if (typeof value === 'object' && value !== null) {
      resolved[key] = resolveConfigVariables(value, context);
    } else {
      resolved[key] = value;
    }
  }
  
  return resolved as T;
}

/**
 * Extracts all variable references from a config object
 * Useful for validation and debugging
 * 
 * @param config - The configuration object
 * @returns Array of variable references found (e.g., ["google_sheets.rows[0].email"])
 */
export function extractVariables(config: Record<string, any>): string[] {
  const variables: string[] = [];
  
  function traverse(obj: any) {
    if (typeof obj === 'string') {
      let match;
      while ((match = VARIABLE_REGEX.exec(obj)) !== null) {
        if (match[1]) {
          variables.push(match[1]);
        }
      }
      // Reset regex lastIndex for next use
      VARIABLE_REGEX.lastIndex = 0;
    } else if (Array.isArray(obj)) {
      obj.forEach(traverse);
    } else if (typeof obj === 'object' && obj !== null) {
      Object.values(obj).forEach(traverse);
    }
  }
  
  traverse(config);
  return [...new Set(variables)]; // Remove duplicates
}

/**
 * Validates that all variables in config can be resolved
 * 
 * @param config - The configuration object
 * @param context - The interpolation context
 * @returns Object with validation result and any missing variables
 */
export function validateVariables(
  config: Record<string, any>,
  context: InterpolationContext
): { valid: boolean; missing: string[] } {
  const variables = extractVariables(config);
  const missing: string[] = [];
  
  for (const variable of variables) {
    const resolved = resolveVariable(variable, context);
    // If resolved value still contains {{, it wasn't found
    if (typeof resolved === 'string' && resolved.includes('{{')) {
      missing.push(variable);
    }
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Extracts dynamic variables from actual execution output
 * This is used to generate VariableDefinition[] for the Variable Panel
 * 
 * Handles special case for spreadsheet data where:
 * - rows[0] = column headers
 * - rows[1+] = data rows
 * 
 * @param output - The actual output from node execution
 * @param prefix - Path prefix for nested objects
 * @returns Array of variable definitions
 */
export function extractVariablesFromOutput(
  output: any,
  prefix: string = ''
): Array<{ name: string; path: string; type: string; sampleValue?: any }> {
  const variables: Array<{ name: string; path: string; type: string; sampleValue?: any }> = [];
  
  if (output === null || output === undefined) {
    return variables;
  }
  
  // Special handling for spreadsheet-like data (rows with headers in first row)
  if (isSpreadsheetOutput(output)) {
    return extractSpreadsheetVariables(output);
  }
  
  if (Array.isArray(output)) {
    // For arrays, show the array itself and sample from first element
    variables.push({
      name: prefix || 'data',
      path: prefix || 'data',
      type: 'array',
      sampleValue: output.length > 0 ? `[${output.length} items]` : '[]',
    });
    
    // Extract variables from first element if exists
    if (output.length > 0 && typeof output[0] === 'object') {
      const childVars = extractVariablesFromOutput(output[0], `${prefix}[0]`);
      variables.push(...childVars);
    }
  } else if (typeof output === 'object') {
    for (const [key, value] of Object.entries(output)) {
      const path = prefix ? `${prefix}.${key}` : key;
      const name = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      
      if (value === null || value === undefined) {
        variables.push({ name, path, type: 'any', sampleValue: null });
      } else if (Array.isArray(value)) {
        variables.push({
          name,
          path,
          type: 'array',
          sampleValue: `[${value.length} items]`,
        });
        // Extract from first element
        if (value.length > 0 && typeof value[0] === 'object') {
          const childVars = extractVariablesFromOutput(value[0], `${path}[0]`);
          variables.push(...childVars);
        }
      } else if (typeof value === 'object') {
        variables.push({ name, path, type: 'object', sampleValue: '{...}' });
        const childVars = extractVariablesFromOutput(value, path);
        variables.push(...childVars);
      } else {
        variables.push({
          name,
          path,
          type: typeof value as string,
          sampleValue: value,
        });
      }
    }
  } else {
    variables.push({
      name: prefix || 'value',
      path: prefix || 'value',
      type: typeof output,
      sampleValue: output,
    });
  }
  
  return variables;
}

/**
 * Checks if output looks like spreadsheet data
 * Pattern: { rows: [[headers], [data1], [data2], ...], ... }
 */
function isSpreadsheetOutput(output: any): boolean {
  if (typeof output !== 'object' || output === null) return false;
  if (!Array.isArray(output.rows)) return false;
  if (output.rows.length < 1) return false;
  
  // Check if first row is an array of strings (headers)
  const firstRow = output.rows[0];
  if (!Array.isArray(firstRow)) return false;
  
  // At least some values should be strings (column names)
  return firstRow.some((cell: any) => typeof cell === 'string');
}

/**
 * Extracts variables from spreadsheet-like output
 * Uses column names as variable paths for clean syntax
 * e.g., {{google_sheet.email}} instead of {{google_sheet.rows[1][0]}}
 */
function extractSpreadsheetVariables(
  output: { rows: any[][]; columns?: Record<string, number>; [key: string]: any }
): Array<{ name: string; path: string; type: string; sampleValue?: any }> {
  const variables: Array<{ name: string; path: string; type: string; sampleValue?: any }> = [];
  
  const rows = output.rows;
  const headers = rows[0] as string[];
  const dataRow = rows.length > 1 ? rows[1] : null;
  
  // Add each column as a variable using normalized column name as path
  headers.forEach((columnName, colIndex) => {
    const displayName = String(columnName).trim() || `Column ${colIndex + 1}`;
    const normalized = String(columnName).trim().toLowerCase().replace(/\s+/g, '_');
    const sampleValue = dataRow ? dataRow[colIndex] : undefined;
    
    variables.push({
      name: displayName,
      path: normalized || `column_${colIndex + 1}`,  // "email", "job_title", etc.
      type: typeof sampleValue === 'number' ? 'number' : 'string',
      sampleValue: sampleValue,
    });
  });
  
  // Add helper variable for all data rows
  const dataRowCount = Math.max(0, rows.length - 1);
  variables.push({
    name: '📋 All Data Rows',
    path: 'rows',
    type: 'array',
    sampleValue: `[${dataRowCount} data rows]`,
  });
  
  return variables;
}
