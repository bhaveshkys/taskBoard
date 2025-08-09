export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  return { valid: true };
}

export function validateTaskTitle(title: string): boolean {
  return title.trim().length > 0 && title.length <= 200;
}

export function validateBoardTitle(title: string): boolean {
  return title.trim().length > 0 && title.length <= 100;
}

export function validateDueDate(dueDate: string): boolean {
  if (!dueDate) return true; // Optional field
  const date = new Date(dueDate);
  return !isNaN(date.getTime());
}