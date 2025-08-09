import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data';
import { authenticateRequest } from '@/lib/auth';
import { ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const userId = await authenticateRequest(request);
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      } as ApiResponse, { status: 401 });
    }

    const tourCompleted = await dataStore.getUserTourStatus(userId);
    
    return NextResponse.json({
      success: true,
      data: { tourCompleted },
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting tour status:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse, { status: 500 });
  }
}

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
    const { tourCompleted } = body;

    if (typeof tourCompleted !== 'boolean') {
      return NextResponse.json({
        success: false,
        error: 'tourCompleted must be a boolean',
      } as ApiResponse, { status: 400 });
    }

    const updatedUser = await dataStore.updateUserTourStatus(userId, tourCompleted);
    
    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      } as ApiResponse, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: { tourCompleted: updatedUser.tourCompleted },
    } as ApiResponse);
  } catch (error) {
    console.error('Error updating tour status:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse, { status: 500 });
  }
}