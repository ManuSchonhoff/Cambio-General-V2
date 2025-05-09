
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Activity } from 'lucide-react';

const SidebarNav = ({ navItems, adminNavItems, currentUser, location, handleNavLinkClick }) => {
  return (
    <>
      <div className="text-center mb-8 mt-2">
        <Link to="/" onClick={handleNavLinkClick} className="flex items-center justify-center gap-2 text-2xl font-bold text-primary hover:text-primary/90 transition-colors">
          <Activity className="h-7 w-7" />
          <span>CambioGeneral</span>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Registro Contable</p>
      </div>
      <nav className="space-y-1.5 flex-grow">
        {navItems.map(item => (
          <Link key={item.path} to={item.path} onClick={handleNavLinkClick}>
            <Button
              variant={location.pathname === item.path ? "secondary" : "ghost"}
              className={`w-full justify-start text-sm py-2.5 px-3 
                ${location.pathname === item.path 
                  ? 'bg-primary/10 text-primary hover:bg-primary/20 font-semibold' 
                  : 'hover:bg-accent hover:text-accent-foreground text-foreground/80'
                }`}
            >
              <item.icon className="mr-2.5 h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        ))}
         {currentUser?.role === 'admin' && (
          <>
            <DropdownMenuSeparator className="my-2 bg-border" />
            <p className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
            {adminNavItems.map(item => (
               <Link key={item.path} to={item.path} onClick={handleNavLinkClick}>
                <Button
                  variant={location.pathname === item.path ? "secondary" : "ghost"}
                  className={`w-full justify-start text-sm py-2.5 px-3
                    ${location.pathname === item.path 
                      ? 'bg-primary/10 text-primary hover:bg-primary/20 font-semibold' 
                      : 'hover:bg-accent hover:text-accent-foreground text-foreground/80'
                    }`}
                >
                  <item.icon className="mr-2.5 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </>
         )}
      </nav>
       <div className="mt-auto pb-2">
          <p className="text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} CambioGeneral
          </p>
       </div>
    </>
  );
};

export default SidebarNav;
