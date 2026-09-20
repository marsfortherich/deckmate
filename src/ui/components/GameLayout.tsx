/**
 * Game Layout - Wraps game screens with header
 */

import React from 'react';
import { Header } from './Header';

interface GameLayoutProps {
  children: React.ReactNode;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ children }) => {
  return (
    <div style={{
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#0f172a',
      color: '#f1f5f9',
      minHeight: '100vh',
    }}>
      <Header />
      <main>
        {children}
      </main>
    </div>
  );
};
