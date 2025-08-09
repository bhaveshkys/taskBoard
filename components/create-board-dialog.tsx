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
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { Board } from '@/types';

interface CreateBoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (board: Board) => void;
}

export function CreateBoardDialog({ open, onOpenChange, onCreate }: CreateBoardDialogProps) {
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { getAuthHeaders } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ title: title.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        onCreate(data.data);
        setTitle('');
        onOpenChange(false);
      } else {
        setError(data.error || 'Failed to create board');
      }
    } catch (error) {
      setError('Failed to create board');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!loading) {
      onOpenChange(open);
      if (!open) {
        setTitle('');
        setError('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-ikea-white border-4 border-ikea-yellow shadow-2xl" data-tour="create-board-modal">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold text-ikea-blue">Create New Task</DialogTitle>
          <DialogDescription className="text-ikea-blue/80 text-lg">
            Give your Task a name to get started organizing your tasks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-6">
            <div className="space-y-3">
              <Label htmlFor="title" className="text-ikea-blue font-semibold text-lg">Task Name</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Work, Personal, Groceries"
                maxLength={100}
                disabled={loading}
                data-tour="board-name-input"
                className="border-2 border-ikea-blue focus:border-ikea-yellow focus:ring-ikea-yellow text-ikea-blue placeholder:text-ikea-blue/60 text-lg p-4"
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
              data-tour="create-board-submit"
              className="bg-ikea-yellow hover:bg-ikea-yellow/90 text-ikea-blue font-bold text-lg px-6 py-3 border-2 border-ikea-blue hover:scale-105 transition-all duration-200"
            >
              {loading ? 'Creating...' : 'Create Board'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}