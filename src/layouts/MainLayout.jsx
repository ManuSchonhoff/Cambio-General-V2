
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; 
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext.jsx';
import { useOperations } from '@/context/OperationContext.jsx';
import { Home, LogOut, Users, Settings, DollarSign, ListChecks, FileText, Briefcase, Building, Users2, Activity, ShieldAlert, CalendarClock as ClockHistory, Trash, AlertTriangle, Menu, X } from 'lucide-react';
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
import { useToast } from "@/components/ui/use-toast";


const MainLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { resetAllData } = useOperations();
  const { toast } = useToast();
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const getInitials = (name) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleResetData = () => {
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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleNavLinkClick = () => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) { // md breakpoint
        setIsSidebarOpen(false); 
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  const SidebarContent = () => (
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


  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex w-60 bg-card p-4 space-y-6 border-r border-border shadow-lg flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar & Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
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
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col overflow-auto">
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
            {navItems.find(item => item.path === location.pathname || (item.path !== '/' && location.pathname.startsWith(item.path + "/")))?.label || 
             adminNavItems.find(item => item.path === location.pathname || location.pathname.startsWith(item.path + "/"))?.label ||
             (location.pathname === '/' ? navItems.find(item => item.path === '/')?.label : '') ||
             (location.pathname === '/settings' ? 'Configuración' : '') ||
             "Panel"}
          </motion.h1>
          
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
                                            <AlertDialogAction onClick={handleResetData} className="bg-destructive hover:bg-destructive/90">Sí, Resetear Datos</AlertDialogAction>
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
        </header>
        
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
