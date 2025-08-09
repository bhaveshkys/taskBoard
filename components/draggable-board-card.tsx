'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Board, Task } from '@/types';
import { BoardCard } from './board-card';
import { GripVertical } from 'lucide-react';

interface DraggableBoardCardProps {
  board: Board;
  tasks: Task[];
  onClick: () => void;
  onUpdate: (board: Board) => void;
  onDelete: (boardId: string) => void;
}

export function DraggableBoardCard({
  board,
  tasks,
  onClick,
  onUpdate,
  onDelete,
}: DraggableBoardCardProps) {
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
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-ikea-yellow/20 transition-colors"
        aria-label="Drag to reorder board"
      >
        <GripVertical className="h-4 w-4 text-ikea-blue/60" />
      </div>
      <div className="pl-8">
        <BoardCard
          board={board}
          tasks={tasks}
          onClick={onClick}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}