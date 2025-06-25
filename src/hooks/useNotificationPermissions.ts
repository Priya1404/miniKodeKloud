import { useState, useEffect } from 'react';

let notificationService: any = null;
try {
  const { notificationService: service } = require('../services/NotificationService');
  notificationService = service;
} catch (error) {
  console.warn('NotificationService not available:', error);
}

export const useNotificationPermissions = () => {
  const [permissionsGranted, setPermissionsGranted] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      setIsLoading(true);
      
      if (!notificationService) {
        console.warn('NotificationService not available, defaulting to false');
        setPermissionsGranted(false);
        return;
      }
      
      const enabled = await notificationService.areNotificationsEnabled();
      setPermissionsGranted(enabled);
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      setPermissionsGranted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      if (!notificationService) {
        console.warn('NotificationService not available, cannot request permissions');
        setPermissionsGranted(false);
        return false;
      }
      
      const granted = await notificationService.requestPermissions();
      setPermissionsGranted(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      setPermissionsGranted(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    permissionsGranted,
    isLoading,
    requestPermissions,
    checkPermissions,
  };
}; 