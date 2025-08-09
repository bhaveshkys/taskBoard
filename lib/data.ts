import { User, Board, Task } from '@/types';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

interface DatabaseData {
  users: User[];
  boards: Board[];
  tasks: Task[];
}

// File-based data storage
class DataStore {
  private dataPath: string;
  private users: User[] = [];
  private boards: Board[] = [];
  private tasks: Task[] = [];

  constructor() {
    // Use /tmp directory in production (Vercel), local data directory in development
    if (process.env.NODE_ENV === 'production') {
      this.dataPath = '/tmp/database.json';
    } else {
      this.dataPath = path.join(process.cwd(), 'data', 'database.json');
    }
    this.ensureDataDirectory();
    this.loadData();
  }

  private ensureDataDirectory(): void {
    try {
      const dataDir = path.dirname(this.dataPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    } catch (error) {
      console.error('Error creating data directory:', error);
      // In production, if we can't create the directory, we'll work with in-memory data only
      if (process.env.NODE_ENV === 'production') {
        console.warn('Working with in-memory data only. Data will not persist between deployments.');
      }
    }
  }

  private loadData(): void {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf8');
        const parsedData: DatabaseData = JSON.parse(data);
        this.users = parsedData.users || [];
        this.boards = parsedData.boards || [];
        this.tasks = parsedData.tasks || [];
      } else {
        // Initialize with default data if file doesn't exist
        this.initializeDefaultData();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      // Initialize with default data if file is corrupted or doesn't exist
      this.initializeDefaultData();
    }
  }

  private initializeDefaultData(): void {
    // Initialize with empty arrays
    this.users = [];
    this.boards = [];
    this.tasks = [];
    
    // Try to save initial data
    this.saveData();
  }

  private saveData(): void {
    try {
      const data: DatabaseData = {
        users: this.users,
        boards: this.boards,
        tasks: this.tasks,
      };
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
      // In production, if we can't save to file, continue with in-memory data
      if (process.env.NODE_ENV === 'production') {
        console.warn('Unable to persist data to file system. Data will be lost on next deployment.');
      }
    }
  }

  // User methods
  async createUser(email: string, password: string, name: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user: User = {
      id: this.generateId(),
      email,
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString(),
    };
    this.users.push(user);
    this.saveData();
    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async findUserById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async validatePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  async getUserTourStatus(userId: string): Promise<boolean> {
    const user = await this.findUserById(userId);
    return user?.tourCompleted || false;
  }

  async updateUserTourStatus(userId: string, tourCompleted: boolean): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === userId);
    if (userIndex === -1) return null;

    this.users[userIndex] = {
      ...this.users[userIndex],
      tourCompleted,
    };
    this.saveData();
    return this.users[userIndex];
  }

  // Board methods
  createBoard(userId: string, title: string): Board {
    const userBoards = this.getBoardsByUserId(userId);
    const maxOrder = userBoards.length > 0 ? Math.max(...userBoards.map(b => b.order || 0)) : -1;
    
    const board: Board = {
      id: this.generateId(),
      userId,
      title,
      order: maxOrder + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.boards.push(board);
    this.saveData();
    return board;
  }

  getBoardsByUserId(userId: string): Board[] {
    return this.boards
      .filter(board => board.userId === userId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  getBoardById(id: string, userId: string): Board | null {
    return this.boards.find(board => board.id === id && board.userId === userId) || null;
  }

  updateBoard(id: string, userId: string, title: string): Board | null {
    const boardIndex = this.boards.findIndex(board => board.id === id && board.userId === userId);
    if (boardIndex === -1) return null;

    this.boards[boardIndex] = {
      ...this.boards[boardIndex],
      title,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    return this.boards[boardIndex];
  }

  reorderBoards(userId: string, boardIds: string[]): Board[] {
    const userBoards = this.boards.filter(board => board.userId === userId);
    
    // Update order for each board
    boardIds.forEach((boardId, index) => {
      const boardIndex = this.boards.findIndex(board => board.id === boardId && board.userId === userId);
      if (boardIndex !== -1) {
        this.boards[boardIndex] = {
          ...this.boards[boardIndex],
          order: index,
          updatedAt: new Date().toISOString(),
        };
      }
    });
    
    this.saveData();
    return this.getBoardsByUserId(userId);
  }

  deleteBoard(id: string, userId: string): boolean {
    const boardIndex = this.boards.findIndex(board => board.id === id && board.userId === userId);
    if (boardIndex === -1) return false;

    // Also delete all tasks in this board
    this.tasks = this.tasks.filter(task => task.boardId !== id);
    this.boards.splice(boardIndex, 1);
    this.saveData();
    return true;
  }

  // Task methods
  createTask(boardId: string, userId: string, title: string, description?: string, dueDate?: string): Task | null {
    // Verify board belongs to user
    const board = this.getBoardById(boardId, userId);
    if (!board) return null;

    const boardTasks = this.getTasksByBoardId(boardId, userId);
    const maxOrder = boardTasks.length > 0 ? Math.max(...boardTasks.map(t => t.order || 0)) : -1;

    const task: Task = {
      id: this.generateId(),
      boardId,
      userId,
      title,
      description,
      status: 'pending',
      order: maxOrder + 1,
      dueDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tasks.push(task);
    this.saveData();
    return task;
  }

  getTasksByBoardId(boardId: string, userId: string): Task[] {
    return this.tasks
      .filter(task => task.boardId === boardId && task.userId === userId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  getTaskById(id: string, userId: string): Task | null {
    return this.tasks.find(task => task.id === id && task.userId === userId) || null;
  }

  updateTask(
    id: string, 
    userId: string, 
    updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'dueDate'>>
  ): Task | null {
    const taskIndex = this.tasks.findIndex(task => task.id === id && task.userId === userId);
    if (taskIndex === -1) return null;

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveData();
    return this.tasks[taskIndex];
  }

  reorderTasks(boardId: string, userId: string, taskIds: string[]): Task[] {
    // Verify board belongs to user
    const board = this.getBoardById(boardId, userId);
    if (!board) return [];
    
    // Update order for each task
    taskIds.forEach((taskId, index) => {
      const taskIndex = this.tasks.findIndex(task => task.id === taskId && task.userId === userId && task.boardId === boardId);
      if (taskIndex !== -1) {
        this.tasks[taskIndex] = {
          ...this.tasks[taskIndex],
          order: index,
          updatedAt: new Date().toISOString(),
        };
      }
    });
    
    this.saveData();
    return this.getTasksByBoardId(boardId, userId);
  }

  deleteTask(id: string, userId: string): boolean {
    const taskIndex = this.tasks.findIndex(task => task.id === id && task.userId === userId);
    if (taskIndex === -1) return false;

    this.tasks.splice(taskIndex, 1);
    this.saveData();
    return true;
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export const dataStore = new DataStore();