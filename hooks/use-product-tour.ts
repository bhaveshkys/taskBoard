'use client';

import { useEffect, useState } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from './use-auth';

export function useProductTour() {
  const [tourCompleted, setTourCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, getAuthHeaders } = useAuth();

  useEffect(() => {
    // Fetch tour status from database when user is available
    if (user) {
      fetchTourStatus();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchTourStatus = async () => {
    try {
      const response = await fetch('/api/user/tour-status', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        setTourCompleted(data.data.tourCompleted);
      }
    } catch (error) {
      console.error('Error fetching tour status:', error);
      // Fallback to false if there's an error
      setTourCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  const updateTourStatus = async (completed: boolean) => {
    try {
      const response = await fetch('/api/user/tour-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ tourCompleted: completed }),
      });
      
      const data = await response.json();
      if (data.success) {
        setTourCompleted(completed);
      }
    } catch (error) {
      console.error('Error updating tour status:', error);
    }
  };

  const startTour = () => {
    const driverObj = driver({
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      allowClose: false, // Prevent closing tour by clicking outside
      disableActiveInteraction: false, // Allow interaction with highlighted elements
      steps: [
        {
          element: '[data-tour="welcome"]',
          popover: {
            title: 'Welcome to TaskBoards! 🎉',
            description: 'Let\'s take a quick tour to help you get started with managing your tasks and boards effectively.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '[data-tour="create-board"]',
          popover: {
            title: 'Create Your First Board 📋',
            description: 'Click this button to create a new board. You can create boards to organize your tasks by project, category, or any way that works for you.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '[data-tour="boards-list"]',
          popover: {
            title: 'Your Boards Collection 📚',
            description: 'All your boards will appear here. Click on any board to view and manage its tasks. You can also edit or delete boards from here.',
            side: 'top',
            align: 'start'
          }
        },
        {
          element: '[data-tour="user-menu"]',
          popover: {
            title: 'User Menu 👤',
            description: 'Access your account settings and logout from here. Your profile information is always accessible.',
            side: 'bottom',
            align: 'end'
          }
        },
        {
          popover: {
            title: 'You\'re All Set! 🚀',
            description: 'That\'s it! You\'re ready to start organizing your tasks. Create your first board and begin your productivity journey. You can always restart this tour from the help menu.',
            side: 'bottom',
            align: 'center'
          }
        }
      ],
      onDestroyed: () => {
        // Mark tour as completed in database
        updateTourStatus(true);
      }
    });

    driverObj.drive();
  };

  const resetTour = () => {
    updateTourStatus(false);
  };

  return {
    tourCompleted,
    startTour,
    resetTour,
    loading,
  };
}