'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, CheckSquare, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useProductTour } from '@/hooks/use-product-tour';
import { Board, Task } from '@/types';
import { CreateBoardDialog } from '@/components/create-board-dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BoardCard } from '@/components/board-card';
import { GripVertical } from 'lucide-react';

// Draggable Board Card Component
function DraggableBoardCard({ 
  board, 
  tasks, 
  onClick, 
  onUpdate, 
  onDelete 
}: {
  board: Board;
  tasks: Task[];
  onClick: () => void;
  onUpdate: (board: Board) => void;
  onDelete: (boardId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: board.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 right-2 z-10 p-1 rounded bg-ikea-white/80 hover:bg-ikea-yellow/80 cursor-grab active:cursor-grabbing transition-colors"
      >
        <GripVertical className="h-4 w-4 text-ikea-blue" />
      </div>
      
      <BoardCard
        board={board}
        tasks={tasks}
        onClick={onClick}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
}

export default function DashboardPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [tasks, setTasks] = useState<{ [boardId: string]: Task[] }>({});
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { user, logout, getAuthHeaders, loading: authLoading } = useAuth();
  const { tourCompleted, startTour, loading: tourLoading } = useProductTour();
  const router = useRouter();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Start tour for first-time users after boards are loaded
  useEffect(() => {
    if (!loading && !tourLoading && !tourCompleted && boards.length >= 0) {
      const timer = setTimeout(() => {
        startTour();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, tourLoading, tourCompleted, startTour, boards.length]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchBoards();
    }
  }, [authLoading, user]);

  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/boards', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        // Sort boards by order field
        const sortedBoards = data.data.sort((a: Board, b: Board) => (a.order || 0) - (b.order || 0));
        setBoards(sortedBoards);
        // Fetch tasks for each board
        for (const board of sortedBoards) {
          fetchTasksForBoard(board.id);
        }
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasksForBoard = async (boardId: string) => {
    try {
      const response = await fetch(`/api/tasks?boardId=${boardId}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        setTasks(prev => ({ ...prev, [boardId]: data.data }));
      }
    } catch (error) {
      console.error(`Error fetching tasks for board ${boardId}:`, error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = boards.findIndex((board) => board.id === active.id);
      const newIndex = boards.findIndex((board) => board.id === over.id);

      const newBoards = arrayMove(boards, oldIndex, newIndex);
      setBoards(newBoards);

      // Save the new order to the server
      try {
        const boardIds = newBoards.map(board => board.id);
        const response = await fetch('/api/boards/reorder', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ boardIds }),
        });

        if (!response.ok) {
          console.error('Failed to save board order');
          // Revert the change if the API call fails
          setBoards(boards);
        }
      } catch (error) {
        console.error('Error saving board order:', error);
        // Revert the change if the API call fails
        setBoards(boards);
      }
    }
  };

  const handleCreateBoard = (board: Board) => {
    setBoards(prev => [...prev, board]);
    setTasks(prev => ({ ...prev, [board.id]: [] }));
  };

  const handleUpdateBoard = (updatedBoard: Board) => {
    setBoards(prev => prev.map(board => 
      board.id === updatedBoard.id ? updatedBoard : board
    ));
  };

  const handleDeleteBoard = (boardId: string) => {
    setBoards(prev => prev.filter(board => board.id !== boardId));
    setTasks(prev => {
      const newTasks = { ...prev };
      delete newTasks[boardId];
      return newTasks;
    });
  };

  const handleBoardClick = (boardId: string) => {
    router.push(`/boards/${boardId}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-ikea-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-ikea-yellow"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ikea-gradient">
      <header className="bg-ikea-white shadow-lg border-b-4 border-ikea-yellow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4" data-tour="welcome">
              <div className="bg-ikea-blue p-2 rounded-lg">
                <CheckSquare className="h-8 w-8 text-ikea-white" />
              </div>
              <h1 className="text-3xl font-bold text-ikea-blue">TaskBoard</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 text-ikea-blue hover:bg-ikea-yellow-light hover:text-ikea-blue" 
                  data-tour="user-menu"
                >
                  <div className="bg-ikea-yellow p-1 rounded-full">
                    <User className="h-4 w-4 text-ikea-blue" />
                  </div>
                  <span className="font-semibold">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-ikea-white border-ikea-blue">
                <DropdownMenuItem onClick={logout} className="text-ikea-blue hover:bg-ikea-yellow-light">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-12">
          <div className="bg-ikea-white/90 backdrop-blur-sm p-6 rounded-xl shadow-lg border-2 border-ikea-yellow">
            <h2 className="text-4xl font-bold text-ikea-blue mb-2">Your Tasks</h2>
            <p className="text-ikea-blue/80 text-lg">
              Organize your tasks and stay productive
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)} 
            data-tour="create-board"
            className="bg-ikea-yellow hover:bg-ikea-yellow/90 text-ikea-blue font-bold text-lg px-8 py-4 rounded-xl shadow-lg border-2 border-ikea-blue hover:scale-105 transition-all duration-200"
          >
            <Plus className="mr-3 h-6 w-6" />
            New Task
          </Button>
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-ikea-white/90 backdrop-blur-sm p-12 rounded-2xl shadow-xl border-4 border-ikea-yellow max-w-md mx-auto">
              <div className="bg-ikea-blue p-4 rounded-full w-fit mx-auto mb-6">
                <CheckSquare className="h-16 w-16 text-ikea-yellow" />
              </div>
              <h3 className="text-2xl font-bold text-ikea-blue mb-4">No boards yet</h3>
              <p className="text-ikea-blue/80 text-lg mb-8">
                Get started by creating your first task board and bring some Swedish organization to your life!
              </p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-ikea-yellow hover:bg-ikea-yellow/90 text-ikea-blue font-bold text-lg px-8 py-4 rounded-xl shadow-lg border-2 border-ikea-blue hover:scale-105 transition-all duration-200"
              >
                <Plus className="mr-3 h-6 w-6" />
                Create Your First Board
              </Button>
            </div>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={boards.map(board => board.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-tour="boards-list">
                {boards.map((board) => (
                  <DraggableBoardCard
                    key={board.id}
                    board={board}
                    tasks={tasks[board.id] || []}
                    onClick={() => handleBoardClick(board.id)}
                    onUpdate={handleUpdateBoard}
                    onDelete={handleDeleteBoard}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>

      <CreateBoardDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreateBoard}
      />
    </div>
  );
}