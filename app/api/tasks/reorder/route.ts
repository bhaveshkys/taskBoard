import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data';
import { authenticateRequest } from '@/lib/auth';
import { ApiResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse, { status: 401 });
    }

    const body = await request.json();
    const { taskIds, boardId } = body;

    if (!Array.isArray(taskIds) || !boardId) {
      return NextResponse.json({
        success: false,
        error: 'Task IDs array and board ID are required',
      } as ApiResponse, { status: 400 });
    }

    const reorderedTasks = dataStore.reorderTasks(userId, boardId, taskIds);

    return NextResponse.json({
      success: true,
      data: reorderedTasks,
    } as ApiResponse);
  } catch (error) {
    console.error('Error reordering tasks:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse, { status: 500 });
  }
}