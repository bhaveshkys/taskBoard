import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data';
import { authenticateRequest } from '@/lib/auth';
import { validateTaskTitle, validateDueDate } from '@/lib/validation';
import { ApiResponse, Task } from '@/types';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');

    if (!boardId) {
      return NextResponse.json({
        success: false,
        error: 'Board ID is required',
      } as ApiResponse, { status: 400 });
    }

    const tasks = dataStore.getTasksByBoardId(boardId, userId);
    return NextResponse.json({
      success: true,
      data: tasks,
    } as ApiResponse<Task[]>);

  } catch (error) {
    console.error('Get tasks error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse, { status: 401 });
    }

    const body = await request.json();
    const { boardId, title, description, dueDate } = body;

    if (!boardId || !title || !validateTaskTitle(title)) {
      return NextResponse.json({
        success: false,
        error: 'Board ID and task title are required (title must be less than 200 characters)',
      } as ApiResponse, { status: 400 });
    }

    if (dueDate && !validateDueDate(dueDate)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid due date format',
      } as ApiResponse, { status: 400 });
    }

    const task = dataStore.createTask(boardId, userId, title.trim(), description?.trim(), dueDate);
    if (!task) {
      return NextResponse.json({
        success: false,
        error: 'Board not found or access denied',
      } as ApiResponse, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: task,
    } as ApiResponse<Task>, { status: 201 });

  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse, { status: 500 });
  }
}