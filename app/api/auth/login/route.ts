import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data';
import { generateToken } from '@/lib/auth';
import { validateEmail, validatePassword } from '@/lib/validation';
import { ApiResponse, AuthResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json({
        success: false,
        error: 'Email and password are required',
      } as ApiResponse, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format',
      } as ApiResponse, { status: 400 });
    }

    // Find user
    const user = await dataStore.findUserByEmail(email);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials',
      } as ApiResponse, { status: 401 });
    }

    // Verify password
    const isValidPassword = await dataStore.validatePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials',
      } as ApiResponse, { status: 401 });
    }

    // Generate token
    const token = generateToken(user.id);

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      } as AuthResponse,
    } as ApiResponse<AuthResponse>);

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse, { status: 500 });
  }
}