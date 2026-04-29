import React from 'react';
import AppRouter from './routes/Router';
import AppLayout from './components/Layout';
import ThemeConfig from './theme.jsx';
import { SecurityManager } from './components/SecurityManager';

function App() {
  return (
    <ThemeConfig>
      <SecurityManager>
        <AppLayout>
          <AppRouter />
        </AppLayout>
      </SecurityManager>
    </ThemeConfig>
  );
}

export default App;
