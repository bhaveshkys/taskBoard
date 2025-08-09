import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/data';
import { generateToken } from '@/lib/auth';
import { validateEmail, validatePassword } from '@/lib/validation';
import { ApiResponse, AuthResponse } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json({
        success: false,
        error: 'Email, password, and name are required',
      } as ApiResponse, { status: 400 });
    }

    if (!validateEmail(email)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email format',
      } as ApiResponse, { status: 400 });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json({
        success: false,
        error: passwordValidation.message,
      } as ApiResponse, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await dataStore.findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User already exists with this email',
      } as ApiResponse, { status: 409 });
    }

    // Create user
    const user = await dataStore.createUser(email, password, name);
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
    console.error('Registration error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    } as ApiResponse, { status: 500 });
  }
}