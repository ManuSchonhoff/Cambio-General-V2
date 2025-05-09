
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar.jsx";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Settings, LogOut, Users, ListChecks, ShieldAlert, Trash, AlertTriangle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

const UserAvatarMenu = ({ currentUser, getInitials, handleLogout, resetAllData }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleResetDataInternal = () => {
    try {
        resetAllData();
        toast({
            title: "Datos Reseteados",
            description: "Todos los datos de operaciones, clientes y cajas han sido eliminados (localStorage).",
        });
        window.location.reload(); 
    } catch(error) {
        toast({
            title: "Error al Resetear",
            description: error.message,
            variant: "destructive",
        });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background">
          <Avatar className="h-10 w-10 border-2 border-primary/50">
            <AvatarImage src={currentUser?.avatarUrl || `https://avatar.vercel.sh/${currentUser?.id}.png?size=40`} alt={currentUser?.username} />
            <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(currentUser?.username)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-card border-border text-foreground" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{currentUser?.username}</p>
            <p className="text-xs leading-none text-muted-foreground">{currentUser?.email || `${currentUser?.id}@example.com`}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border"/>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => navigate('/settings')} className="hover:bg-accent focus:bg-accent cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
          </DropdownMenuItem>
          {currentUser?.role === 'admin' && (
              <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="hover:bg-accent focus:bg-accent cursor-pointer">
                      <ShieldAlert className="mr-2 h-4 w-4" />
                      <span>Panel Admin</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                      <DropdownMenuSubContent className="bg-card border-border">
                          <DropdownMenuItem onClick={() => navigate('/admin/users')} className="cursor-pointer">
                              <Users className="mr-2 h-4 w-4" /> Gestión de Usuarios
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate('/admin/log')} className="cursor-pointer">
                              <ListChecks className="mr-2 h-4 w-4" /> Log de Actividad
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive hover:!bg-destructive/10 focus:!bg-destructive/10 hover:!text-destructive focus:!text-destructive cursor-pointer">
                                      <Trash className="mr-2 h-4 w-4" /> Resetear Datos App
                                  </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle className="flex items-center"><AlertTriangle className="text-red-500 mr-2"/>¿Estás absolutamente seguro?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          Esta acción no se puede deshacer. Se eliminarán TODAS las operaciones, clientes, y saldos de cajas (de localStorage).
                                          Esto es útil para empezar de cero, pero irreversible.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={handleResetDataInternal} className="bg-destructive hover:bg-destructive/90">Sí, Resetear Datos</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                      </DropdownMenuSubContent>
                  </DropdownMenuPortal>
              </DropdownMenuSub>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-border"/>
        <DropdownMenuItem onClick={handleLogout} className="text-destructive hover:bg-destructive/10 focus:bg-destructive/10 hover:!text-destructive focus:!text-destructive cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Cerrar Sesión</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatarMenu;
