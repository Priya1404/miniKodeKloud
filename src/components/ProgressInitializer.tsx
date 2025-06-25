import React, { useEffect } from 'react';
import { useAppDispatch } from '../hooks/useAppDispatch';
import { initializeProgressData } from '../store/courseSlice';

interface Props {
  children: React.ReactNode;
}

export const ProgressWrapper: React.FC<Props> = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeProgressData());
  }, [dispatch]);

  return <>{children}</>;
}; 