'use server';

import { GoogleSheetsNodeExecutor } from '@repo/nodes';

interface SaveConfigFormData {
  userId: string;
  nodeId: string;
  credentialId: string;
  spreadsheetId: string;
  sheetName: string;
  operation: string;
  range: string;
}

export async function handleSaveConfig(formData: SaveConfigFormData) {
  const executor = new GoogleSheetsNodeExecutor();

  const context = {
    userId: formData.userId,
    nodeId: formData.nodeId,
    config: {
      operation: formData.operation,
      spreadsheetId: formData.spreadsheetId,
      range: formData.range,
      sheetName: formData.sheetName,
      credentialId: formData.credentialId,
    },
  };

  const result = await executor.execute(context);
  
  // Return plain object (not class instance)
  return {
    success: result.success,
    output: result.output || null,
    error: result.error || null,
    authUrl: result.authUrl || null,
    requiresAuth: result.requiresAuth || false,
  };
}
