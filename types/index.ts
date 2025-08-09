export interface User {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  createdAt: string;
  tourCompleted?: boolean;
}

export interface Board {
  id: string;
  userId: string;
  title: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  boardId: string;
  userId: string;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  order: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
