'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, CheckSquare, LogOut, User, ArrowLeft, Clock, CheckCircle, GripVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { Board, Task } from '@/types';
import { TaskCard } from '@/components/task-card';
import { CreateTaskDialog } from '@/components/create-task-dialog';
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
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Draggable Task Card Component
function DraggableTaskCard({
  task,
  onUpdate,
  onDelete,
}: {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-ikea-yellow/20 transition-colors"
        aria-label="Drag to reorder task"
      >
        <GripVertical className="h-4 w-4 text-ikea-blue/60" />
      </div>
      <div className="pl-8">
        <TaskCard
          task={task}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

export default function BoardPage() {
  const [board, setBoard] = useState<Board | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { user, logout, getAuthHeaders, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!authLoading && user) {
      fetchBoard();
      fetchTasks();
    }
  }, [authLoading, user, boardId]);

  const fetchBoard = async () => {
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        setBoard(data.data);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching board:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(`/api/tasks?boardId=${boardId}`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleCreateTask = (task: Task) => {
    setTasks(prev => [...prev, task]);
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    // Optimistic update
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ));

    try {
      const response = await fetch(`/api/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          status: updatedTask.status,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTasks(prev => prev.map(task => 
          task.id === data.data.id ? data.data : task
        ));
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert optimistic update on error
      fetchTasks();
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tasks.findIndex((task) => task.id === active.id);
      const newIndex = tasks.findIndex((task) => task.id === over.id);

      const newTasks = arrayMove(tasks, oldIndex, newIndex);
      setTasks(newTasks);

      // Update order on server
      try {
        const response = await fetch('/api/tasks/reorder', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            boardId: boardId,
            taskIds: newTasks.map(task => task.id),
          }),
        });

        if (!response.ok) {
          // Revert on error
          fetchTasks();
        }
      } catch (error) {
        console.error('Error reordering tasks:', error);
        // Revert on error
        fetchTasks();
      }
    }
  };

  // Show loading while auth is loading or while fetching board data
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-ikea-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-ikea-yellow"></div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="min-h-screen bg-ikea-gradient flex items-center justify-center">
        <div className="text-center bg-ikea-white/90 backdrop-blur-sm p-12 rounded-2xl shadow-xl border-4 border-ikea-yellow">
          <div className="bg-ikea-blue p-4 rounded-full w-fit mx-auto mb-6">
            <CheckSquare className="h-16 w-16 text-ikea-yellow" />
          </div>
          <h2 className="text-3xl font-bold text-ikea-blue mb-4">Board not found</h2>
          <p className="text-ikea-blue/80 text-lg mb-8">
            This board doesn't exist or you don't have access to it.
          </p>
          <Button 
            onClick={() => router.push('/dashboard')} 
            className="bg-ikea-yellow hover:bg-ikea-yellow/90 text-ikea-blue font-bold text-lg px-8 py-4 rounded-xl shadow-lg border-2 border-ikea-blue hover:scale-105 transition-all duration-200"
          >
            <ArrowLeft className="mr-3 h-6 w-6" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <div className="min-h-screen bg-ikea-gradient">
      <header className="bg-ikea-white shadow-lg border-b-4 border-ikea-yellow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/dashboard')}
                className="flex items-center text-ikea-blue hover:bg-ikea-yellow-light hover:text-ikea-blue font-semibold"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-4">
                <div className="bg-ikea-blue p-2 rounded-lg">
                  <CheckSquare className="h-8 w-8 text-ikea-white" />
                </div>
                <h1 className="text-3xl font-bold text-ikea-blue">{board.title}</h1>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="flex items-center space-x-2 text-ikea-blue hover:bg-ikea-yellow-light hover:text-ikea-blue"
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
            <h2 className="text-4xl font-bold text-ikea-blue mb-2">Tasks</h2>
            <p className="text-ikea-blue/80 text-lg">
              {tasks.length} task{tasks.length !== 1 ? 's' : ''} total • {completedTasks.length} completed
            </p>
          </div>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            className="bg-ikea-yellow hover:bg-ikea-yellow/90 text-ikea-blue font-bold text-lg px-8 py-4 rounded-xl shadow-lg border-2 border-ikea-blue hover:scale-105 transition-all duration-200"
          >
            <Plus className="mr-3 h-6 w-6" />
            Add Task
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Pending Tasks */}
          <div>
            <div className="flex items-center mb-6">
              <div className="bg-ikea-yellow p-3 rounded-lg mr-4">
                <Clock className="h-6 w-6 text-ikea-blue" />
              </div>
              <h3 className="text-2xl font-bold text-ikea-blue flex items-center">
                Pending Tasks
                <span className="ml-4 bg-ikea-yellow text-ikea-blue text-lg font-bold px-4 py-2 rounded-full border-2 border-ikea-blue">
                  {pendingTasks.length}
                </span>
              </h3>
            </div>
            <div className="space-y-6">
              {pendingTasks.length === 0 ? (
                <div className="text-center py-12 bg-ikea-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-4 border-ikea-yellow">
                  <div className="bg-ikea-blue p-4 rounded-full w-fit mx-auto mb-6">
                    <Clock className="h-12 w-12 text-ikea-yellow" />
                  </div>
                  <p className="text-ikea-blue text-xl font-semibold mb-6">No pending tasks</p>
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-ikea-yellow hover:bg-ikea-yellow/90 text-ikea-blue font-bold text-lg px-6 py-3 rounded-xl shadow-lg border-2 border-ikea-blue hover:scale-105 transition-all duration-200"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Add your first task
                  </Button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={pendingTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                    {pendingTasks.map((task) => (
                      <DraggableTaskCard
                        key={task.id}
                        task={task}
                        onUpdate={handleUpdateTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          {/* Completed Tasks */}
          <div>
            <div className="flex items-center mb-6">
              <div className="bg-green-500 p-3 rounded-lg mr-4">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-ikea-blue flex items-center">
                Completed Tasks
                <span className="ml-4 bg-green-500 text-white text-lg font-bold px-4 py-2 rounded-full border-2 border-green-600">
                  {completedTasks.length}
                </span>
              </h3>
            </div>
            <div className="space-y-6">
              {completedTasks.length === 0 ? (
                <div className="text-center py-12 bg-ikea-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-4 border-green-500">
                  <div className="bg-green-500 p-4 rounded-full w-fit mx-auto mb-6">
                    <CheckCircle className="h-12 w-12 text-white" />
                  </div>
                  <p className="text-ikea-blue text-xl font-semibold">No completed tasks yet</p>
                  <p className="text-ikea-blue/70 text-lg mt-2">Complete some tasks to see them here!</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={completedTasks.map(task => task.id)} strategy={verticalListSortingStrategy}>
                    {completedTasks.map((task) => (
                      <DraggableTaskCard
                        key={task.id}
                        task={task}
                        onUpdate={handleUpdateTask}
                        onDelete={handleDeleteTask}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>
      </main>

      <CreateTaskDialog
        boardId={boardId}
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreateTask}
      />
    </div>
  );
}