import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data';
import { authenticateRequest } from '@/lib/auth';
import { validateBoardTitle } from '@/lib/validation';
import { ApiResponse, Board } from '@/types';

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

    const board = dataStore.getBoardById(params.id, userId);
    if (!board) {
      return NextResponse.json({
        success: false,
        error: 'Board not found',
      } as ApiResponse, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: board,
    } as ApiResponse<Board>);

  } catch (error) {
    console.error('Get board error:', error);
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
    const { title } = body;

    if (!title || !validateBoardTitle(title)) {
      return NextResponse.json({
        success: false,
        error: 'Board title is required and must be less than 100 characters',
      } as ApiResponse, { status: 400 });
    }

    const updatedBoard = dataStore.updateBoard(params.id, userId, title.trim());
    if (!updatedBoard) {
      return NextResponse.json({
        success: false,
        error: 'Board not found',
      } as ApiResponse, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedBoard,
    } as ApiResponse<Board>);

  } catch (error) {
    console.error('Update board error:', error);
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

    const deleted = dataStore.deleteBoard(params.id, userId);
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Board not found',
      } as ApiResponse, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { message: 'Board deleted successfully' },
    } as ApiResponse);

  } catch (error) {
    console.error('Delete board error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse, { status: 500 });
  }
}
