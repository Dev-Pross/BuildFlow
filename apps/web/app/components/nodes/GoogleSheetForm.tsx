import React from 'react';
import Card from '../ui/Card';
import { GoogleSheetsNodeExecutor, GoogleOAuthService } from '@repo/nodes';
import { GoogleSheetFormClient } from './GoogleSheetFormClient';

const GoogleSheetForm = async () => {
  const userId = "f27185c9-da2e-4c1e-b489-746f4b811490";
  const nodeId = "550e8400-e29b-41d4-a716-446655440000";

  const executor = new GoogleSheetsNodeExecutor();
  const oauthService = new GoogleOAuthService();
  
  const credentials = await executor.getAllCredentials(userId);
  const authUrl = oauthService.getAuthUrl(userId);

  return (
    <Card color='bg-white'>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4">Google Sheets Configuration</h3>
        <GoogleSheetFormClient 
          initialData={{ credentials, authUrl, hasCredentials: (credentials?.length ?? 0) > 0 }}
          userId={userId}
          nodeId={nodeId}
        />
      </div>
    </Card>
  );
}

export default GoogleSheetForm