
import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import { useAuth } from '@/context/AuthContext.jsx';
import { useOperations } from '@/context/OperationContext.jsx';
import { Home, LogOut, Users, Settings, DollarSign, ListChecks, FileText, Briefcase, Building, Users2, Activity, ShieldAlert, CalendarClock as ClockHistory, Trash, AlertTriangle, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

import SidebarNav from './components/SidebarNav.jsx';
import PageHeader from './components/PageHeader.jsx';
import MobileSidebar from './components/MobileSidebar.jsx';

const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { resetAllData } = useOperations();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Cargar Op.', icon: DollarSign },
    { path: '/pending-operations', label: 'Pendientes', icon: ClockHistory },
    { path: '/transactions', label: 'Historial Ops.', icon: ListChecks },
    { path: '/cash', label: 'Caja', icon: Briefcase },
    { path: '/clients', label: 'Clientes', icon: Users2 },
    { path: '/expenses', label: 'Gastos/Costos', icon: FileText },
    { path: '/society', label: 'Sociedad', icon: Building },
  ];

  const adminNavItems = [
     { path: '/admin/users', label: 'Gestión Usuarios', icon: Users },
     { path: '/admin/log', label: 'Log Actividad Admin', icon: ShieldAlert },
  ];

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);
  
  const getInitials = useCallback((name) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }, []);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

  const handleNavLinkClick = useCallback(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setIsSidebarOpen(false); 
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden md:flex w-60 bg-card p-4 space-y-6 border-r border-border shadow-lg flex-col">
        <SidebarNav 
          navItems={navItems}
          adminNavItems={adminNavItems}
          currentUser={currentUser}
          location={location}
          handleNavLinkClick={handleNavLinkClick}
        />
      </aside>

      <MobileSidebar 
        isOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        navItems={navItems}
        adminNavItems={adminNavItems}
        currentUser={currentUser}
        location={location}
        handleNavLinkClick={handleNavLinkClick}
      />

      <main className="flex-1 flex flex-col overflow-auto">
        <PageHeader 
          toggleSidebar={toggleSidebar}
          location={location}
          navItems={navItems}
          adminNavItems={adminNavItems}
          currentUser={currentUser}
          getInitials={getInitials}
          handleLogout={handleLogout}
          resetAllData={resetAllData}
        />
        
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full" 
            >
                <Outlet />
            </motion.div>
            </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
