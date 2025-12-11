import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsNodeExecutor } from '@repo/nodes';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, nodeId } = body;

    if (!userId || !nodeId) {
      return NextResponse.json(
        { success: false, error: 'Missing userId or nodeId' },
        { status: 400 }
      );
    }

    const executor = new GoogleSheetsNodeExecutor();
    const context = {
      userId,
      nodeId,
      config: { operation: 'read_rows' }
    };

    const result = await executor.getSheets(context);

    if ((result as any)?.success === false) {
      return NextResponse.json(result, { status: 400 });
    }

    // Extract files from the response
    const files = (result as any)?.data?.data?.files || [];

    return NextResponse.json({
      success: true,
      data: files
    });

  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
