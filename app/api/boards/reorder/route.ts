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
    const { boardIds } = body;

    if (!Array.isArray(boardIds)) {
      return NextResponse.json({
        success: false,
        error: 'Board IDs array is required',
      } as ApiResponse, { status: 400 });
    }

    const reorderedBoards = dataStore.reorderBoards(userId, boardIds);

    return NextResponse.json({
      success: true,
      data: reorderedBoards,
    } as ApiResponse);
  } catch (error) {
    console.error('Error reordering boards:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse, { status: 500 });
  }
}