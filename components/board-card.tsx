'use client';

import { useState } from 'react';
import { Board, Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, CheckSquare } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditBoardDialog } from './edit-board-dialog';
import { DeleteBoardDialog } from './delete-board-dialog';

interface BoardCardProps {
  board: Board;
  tasks: Task[];
  onClick: () => void;
  onUpdate: (board: Board) => void;
  onDelete: (boardId: string) => void;
}

export function BoardCard({ board, tasks, onClick, onUpdate, onDelete }: BoardCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const totalTasks = tasks.length;

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <Card className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-ikea-white border-4 border-ikea-yellow hover:border-ikea-blue group" onClick={onClick}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 bg-ikea-blue rounded-t-lg">
          <div className="flex items-center space-x-3 flex-1">
            <div className="bg-ikea-yellow p-2 rounded-lg group-hover:bg-ikea-white transition-colors duration-300">
              <CheckSquare className="h-5 w-5 text-ikea-blue" />
            </div>
            <CardTitle className="text-xl font-bold text-ikea-white truncate flex-1 group-hover:text-ikea-yellow transition-colors duration-300">
              {board.title}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={handleMenuClick}>
              <Button variant="ghost" className="h-10 w-10 p-0 text-ikea-white hover:bg-ikea-yellow hover:text-ikea-blue rounded-full">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-ikea-white border-2 border-ikea-blue">
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditDialog(true);
                }}
                className="text-ikea-blue hover:bg-ikea-yellow-light"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteDialog(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold text-ikea-blue">
              {totalTasks} task{totalTasks !== 1 ? 's' : ''}
            </div>
            <Badge 
              variant="secondary" 
              className="bg-ikea-yellow text-ikea-blue font-bold text-lg px-4 py-2 border-2 border-ikea-blue"
            >
              {completedTasks}/{totalTasks}
            </Badge>
          </div>
          {totalTasks > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium text-ikea-blue">
                <span>Progress</span>
                <span>{Math.round((completedTasks / totalTasks) * 100)}%</span>
              </div>
              <div className="w-full bg-ikea-blue/20 rounded-full h-4 border-2 border-ikea-blue/30">
                <div
                  className="bg-ikea-yellow h-full rounded-full transition-all duration-500 border-r-2 border-ikea-blue"
                  style={{
                    width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
          {totalTasks === 0 && (
            <div className="text-center py-4">
              <div className="text-ikea-blue/60 font-medium">
                No tasks yet - click to add some!
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <EditBoardDialog
        board={board}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdate={onUpdate}
      />

      <DeleteBoardDialog
        board={board}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDelete={onDelete}
      />
    </>
  );
}