
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import SidebarNav from './SidebarNav.jsx';

const MobileSidebar = ({ 
  isOpen, 
  toggleSidebar, 
  navItems, 
  adminNavItems, 
  currentUser, 
  location, 
  handleNavLinkClick 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={toggleSidebar}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-64 bg-card p-4 space-y-6 border-r border-border shadow-xl z-50 flex flex-col md:hidden"
          >
            <Button variant="ghost" onClick={toggleSidebar} className="absolute top-3 right-3 h-8 w-8 p-0">
              <X className="h-5 w-5" />
            </Button>
            <SidebarNav 
              navItems={navItems}
              adminNavItems={adminNavItems}
              currentUser={currentUser}
              location={location}
              handleNavLinkClick={handleNavLinkClick}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileSidebar;
