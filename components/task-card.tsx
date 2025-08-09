'use client';

import { useState } from 'react';
import { Task } from '@/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EditTaskDialog } from './edit-task-dialog';
import { DeleteTaskDialog } from './delete-task-dialog';
import { format, isAfter, isToday, isTomorrow } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onUpdate, onDelete }: TaskCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleStatusToggle = async (checked: boolean) => {
    const updatedTask = { ...task, status: checked ? 'completed' : 'pending' } as Task;
    onUpdate(updatedTask);
  };

  const getDueDateBadge = () => {
    if (!task.dueDate) return null;

    const dueDate = new Date(task.dueDate);
    const now = new Date();

    let badgeClass = 'bg-ikea-blue text-ikea-white border-ikea-blue';
    let text = format(dueDate, 'MMM d');

    if (isToday(dueDate)) {
      text = 'Today';
      badgeClass = task.status === 'completed' 
        ? 'bg-green-500 text-white border-green-600' 
        : 'bg-red-500 text-white border-red-600';
    } else if (isTomorrow(dueDate)) {
      text = 'Tomorrow';
      badgeClass = 'bg-ikea-yellow text-ikea-blue border-ikea-blue';
    } else if (isAfter(now, dueDate) && task.status !== 'completed') {
      text = `Overdue`;
      badgeClass = 'bg-red-500 text-white border-red-600';
    }

    return (
      <Badge className={`text-xs font-semibold ${badgeClass}`}>
        <Calendar className="mr-1 h-3 w-3" />
        {text}
      </Badge>
    );
  };

  return (
    <>
      <Card className={`transition-all duration-200 bg-ikea-white/90 backdrop-blur-sm border-2 border-ikea-yellow shadow-lg hover:shadow-xl hover:scale-[1.02] ${
        task.status === 'completed' ? 'opacity-75 border-green-500' : ''
      }`}>
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
          <div className="flex items-start space-x-4 flex-1 min-w-0">
            <Checkbox
              checked={task.status === 'completed'}
              onCheckedChange={handleStatusToggle}
              className="mt-1 border-ikea-blue data-[state=checked]:bg-green-500 data-[state=checked]:border-green-600"
            />
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-lg ${
                task.status === 'completed' 
                  ? 'line-through text-ikea-blue/60' 
                  : 'text-ikea-blue'
              }`}>
                {task.title}
              </h3>
              {task.description && (
                <p className={`text-sm mt-2 ${
                  task.status === 'completed' 
                    ? 'line-through text-ikea-blue/50' 
                    : 'text-ikea-blue/80'
                }`}>
                  {task.description}
                </p>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-8 w-8 p-0 text-ikea-blue hover:bg-ikea-yellow-light hover:text-ikea-blue"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-ikea-white border-ikea-blue">
              <DropdownMenuItem 
                onClick={() => setShowEditDialog(true)}
                className="text-ikea-blue hover:bg-ikea-yellow-light"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600 hover:bg-red-50"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getDueDateBadge()}
            </div>
            <div className="text-sm text-ikea-blue/70 flex items-center font-medium">
              <Clock className="mr-1 h-4 w-4" />
              {format(new Date(task.createdAt), 'MMM d')}
            </div>
          </div>
        </CardContent>
      </Card>

      <EditTaskDialog
        task={task}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onUpdate={onUpdate}
      />

      <DeleteTaskDialog
        task={task}
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDelete={onDelete}
      />
    </>
  );
}