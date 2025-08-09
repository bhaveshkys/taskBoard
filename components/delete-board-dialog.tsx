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
import { useAuth } from '@/hooks/use-auth';
import { Board } from '@/types';

interface DeleteBoardDialogProps {
  board: Board;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (boardId: string) => void;
}

export function DeleteBoardDialog({ board, open, onOpenChange, onDelete }: DeleteBoardDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { getAuthHeaders } = useAuth();

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/boards/${board.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (data.success) {
        onDelete(board.id);
        onOpenChange(false);
      } else {
        setError(data.error || 'Failed to delete board');
      }
    } catch (error) {
      setError('Failed to delete board');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!loading) {
      onOpenChange(open);
      if (!open) {
        setError('');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Board</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{board.title}"? This action will also delete all tasks within this board and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? 'Deleting...' : 'Delete Board'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}