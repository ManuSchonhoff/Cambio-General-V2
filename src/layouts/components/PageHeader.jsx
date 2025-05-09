
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import UserAvatarMenu from './UserAvatarMenu.jsx';

const PageHeader = ({ 
  toggleSidebar, 
  location, 
  navItems, 
  adminNavItems, 
  currentUser, 
  getInitials, 
  handleLogout, 
  resetAllData 
}) => {
  const getPageTitle = () => {
    const currentNavItem = navItems.find(item => 
      item.path === location.pathname || (item.path !== '/' && location.pathname.startsWith(item.path + "/"))
    );
    if (currentNavItem) return currentNavItem.label;

    const currentAdminNavItem = adminNavItems.find(item => 
      location.pathname === item.path || location.pathname.startsWith(item.path + "/")
    );
    if (currentAdminNavItem) return currentAdminNavItem.label;
    
    if (location.pathname === '/') return navItems.find(item => item.path === '/')?.label || 'Panel';
    if (location.pathname === '/settings') return 'Configuración';
    
    return "Panel";
  };

  return (
    <header className="flex justify-between items-center p-4 md:p-6 lg:p-8 border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-30">
      <Button variant="ghost" onClick={toggleSidebar} className="md:hidden h-10 w-10 p-0 mr-2">
        <Menu className="h-6 w-6" />
      </Button>
      
      <motion.h1 
        key={location.pathname} 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground truncate flex-1"
      >
        {getPageTitle()}
      </motion.h1>
      
      <UserAvatarMenu 
        currentUser={currentUser}
        getInitials={getInitials}
        handleLogout={handleLogout}
        resetAllData={resetAllData}
      />
    </header>
  );
};

export default PageHeader;
