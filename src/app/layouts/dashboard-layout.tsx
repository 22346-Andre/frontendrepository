import { useState } from 'react';
import { Outlet } from 'react-router';
import { Header } from '../components/header';
import { Sidebar } from '../components/sidebar';
import { AccessibilityMenu } from '../components/accessibility-menu';

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-muted relative">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* O microfone moderno está aqui dentro do Header! */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {/* Menu de Acessibilidade */}
      <AccessibilityMenu />
    </div>
  );
}