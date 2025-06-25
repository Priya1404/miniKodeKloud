import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [state, setState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(setState);
    NetInfo.fetch().then(setState);
    return () => unsubscribe();
  }, []);

  return {
    isConnected: state?.isConnected ?? true,
    isInternetReachable: state?.isInternetReachable ?? true,
    details: state,
  };
} 