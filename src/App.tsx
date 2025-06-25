import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import { AppNavigator } from './navigation/AppNavigator';
import { ProgressWrapper } from './components/ProgressInitializer';
import { OfflineBanner } from './components/OfflineBanner';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <ProgressWrapper>
          <OfflineBanner />
          <AppNavigator />
        </ProgressWrapper>
      </Provider>
    </SafeAreaProvider>
  );
}

export default App;
