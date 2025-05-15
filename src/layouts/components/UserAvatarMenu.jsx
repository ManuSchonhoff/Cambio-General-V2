
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings, ShieldCheck } from 'lucide-react';
import { debug } from '@/lib/logger.jsx';

const UserAvatarMenu = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    debug.log('[UserAvatarMenu] Attempting logout...');
    try {
      await logout();
      navigate('/login');
      debug.log('[UserAvatarMenu] Logout successful, navigated to login.');
    } catch (error) {
      debug.error('[UserAvatarMenu] Logout failed:', error);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const names = name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return names[0].charAt(0).toUpperCase() + names[names.length - 1].charAt(0).toUpperCase();
  };

  if (!currentUser) {
    return (
      <Button variant="outline" onClick={() => navigate('/login')}>
        Iniciar Sesión
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border-2 border-primary/50 hover:border-primary transition-colors">
            <AvatarImage 
              src={currentUser.avatar_url || `https://avatar.vercel.sh/${currentUser.id}.png?size=40&text=${getInitials(currentUser.username)}`} 
              alt={currentUser.username || "Usuario"} 
            />
            <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
              {getInitials(currentUser.username)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-card border-border shadow-xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-foreground">
              {currentUser.username || "Usuario"}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {currentUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer hover:bg-muted/50">
          <User className="mr-2 h-4 w-4 text-primary" />
          <span>Perfil / Configuración</span>
        </DropdownMenuItem>
        {currentUser.role === 'admin' && (
          <DropdownMenuItem onClick={() => navigate('/admin/users')} className="cursor-pointer hover:bg-muted/50">
            <ShieldCheck className="mr-2 h-4 w-4 text-primary" />
            <span>Admin Panel</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-border"/>
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive-foreground focus:bg-destructive/90 hover:bg-destructive/80">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatarMenu;
