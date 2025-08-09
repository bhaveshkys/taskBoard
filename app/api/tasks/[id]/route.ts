import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data';
import { authenticateRequest } from '@/lib/auth';
import { validateTaskTitle, validateDueDate } from '@/lib/validation';
import { ApiResponse, Task } from '@/types';
export const dynamic = 'force-dynamic';
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse, { status: 401 });
    }

    const task = dataStore.getTaskById(params.id, userId);
    if (!task) {
      return NextResponse.json({
        success: false,
        error: 'Task not found',
      } as ApiResponse, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: task,
    } as ApiResponse<Task>);

  } catch (error) {
    console.error('Get task error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, dueDate } = body;

    const updates: any = {};

    if (title !== undefined) {
      if (!validateTaskTitle(title)) {
        return NextResponse.json({
          success: false,
          error: 'Task title must be less than 200 characters and not empty',
        } as ApiResponse, { status: 400 });
      }
      updates.title = title.trim();
    }

    if (description !== undefined) {
      updates.description = description?.trim();
    }

    if (status !== undefined) {
      if (status !== 'pending' && status !== 'completed') {
        return NextResponse.json({
          success: false,
          error: 'Status must be either "pending" or "completed"',
        } as ApiResponse, { status: 400 });
      }
      updates.status = status;
    }

    if (dueDate !== undefined) {
      if (dueDate && !validateDueDate(dueDate)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid due date format',
        } as ApiResponse, { status: 400 });
      }
      updates.dueDate = dueDate;
    }

    const updatedTask = dataStore.updateTask(params.id, userId, updates);
    if (!updatedTask) {
      return NextResponse.json({
        success: false,
        error: 'Task not found',
      } as ApiResponse, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedTask,
    } as ApiResponse<Task>);

  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse, { status: 401 });
    }

    const deleted = dataStore.deleteTask(params.id, userId);
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Task not found',
      } as ApiResponse, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Task deleted successfully' },
    } as ApiResponse);

  } catch (error) {
    console.error('Delete task error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse, { status: 500 });
  }
}