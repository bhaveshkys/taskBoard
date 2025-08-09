import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data';
import { authenticateRequest } from '@/lib/auth';
import { validateBoardTitle } from '@/lib/validation';
import { ApiResponse, Board } from '@/types';
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

    const boards = dataStore.getBoardsByUserId(userId);
    return NextResponse.json({
      success: true,
      data: boards,
    } as ApiResponse<Board[]>);

  } catch (error) {
    console.error('Get boards error:', error);
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
    const { title } = body;

    if (!title || !validateBoardTitle(title)) {
      return NextResponse.json({
        success: false,
        error: 'Board title is required and must be less than 100 characters',
      } as ApiResponse, { status: 400 });
    }

    const board = dataStore.createBoard(userId, title.trim());
    return NextResponse.json({
      success: true,
      data: board,
    } as ApiResponse<Board>, { status: 201 });

  } catch (error) {
    console.error('Create board error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse, { status: 500 });
  }
}
