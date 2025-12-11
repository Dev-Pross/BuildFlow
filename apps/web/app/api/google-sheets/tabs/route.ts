import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsNodeExecutor } from '@repo/nodes';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, nodeId, spreadsheetId } = body;

    if (!userId || !nodeId || !spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const executor = new GoogleSheetsNodeExecutor();
    const context = {
      userId,
      nodeId,
      config: { operation: 'read_rows' }
    };

    const result = await executor.getSheetTabs(context, spreadsheetId);

    if ((result as any)?.success === false) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error fetching sheet tabs:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
