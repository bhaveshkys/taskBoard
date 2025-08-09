'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { Task } from '@/types';

interface CreateTaskDialogProps {
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (task: Task) => void;
}

export function CreateTaskDialog({ boardId, open, onOpenChange, onCreate }: CreateTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { getAuthHeaders } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          boardId,
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dueDate || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onCreate(data.data);
        setTitle('');
        setDescription('');
        setDueDate('');
        onOpenChange(false);
      } else {
        setError(data.error || 'Failed to create task');
      }
    } catch (error) {
      setError('Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!loading) {
      onOpenChange(open);
      if (!open) {
        setTitle('');
        setDescription('');
        setDueDate('');
        setError('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-ikea-white border-4 border-ikea-yellow shadow-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-ikea-blue">Create New Task</DialogTitle>
          <DialogDescription className="text-ikea-blue/80 text-lg">
            Add a new task to your board.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-6">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-ikea-blue font-semibold text-lg">Task Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                maxLength={200}
                disabled={loading}
                className="border-2 border-ikea-blue focus:border-ikea-yellow focus:ring-ikea-yellow text-ikea-blue placeholder:text-ikea-blue/60 text-lg p-4"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="description" className="text-ikea-blue font-semibold text-lg">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
                rows={3}
                disabled={loading}
                className="border-2 border-ikea-blue focus:border-ikea-yellow focus:ring-ikea-yellow text-ikea-blue placeholder:text-ikea-blue/60 text-lg p-4"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="dueDate" className="text-ikea-blue font-semibold text-lg">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={loading}
                className="border-2 border-ikea-blue focus:border-ikea-yellow focus:ring-ikea-yellow text-ikea-blue text-lg p-4"
              />
            </div>
            {error && (
              <div className="text-lg text-red-600 bg-red-50 p-4 rounded-lg border-2 border-red-200 font-semibold">
                {error}
              </div>
            )}
          </div>
          <DialogFooter className="gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              className="border-2 border-ikea-blue text-ikea-blue hover:bg-ikea-blue hover:text-ikea-white font-semibold text-lg px-6 py-3"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !title.trim()}
              className="bg-ikea-yellow hover:bg-ikea-yellow/90 text-ikea-blue font-bold text-lg px-6 py-3 border-2 border-ikea-blue hover:scale-105 transition-all duration-200"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}