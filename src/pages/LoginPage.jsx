
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Activity, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs.jsx";
import { useToast } from "@/components/ui/use-toast";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, createUserAccount, currentUser, loading: authLoading } = useAuth(); 
  const { toast } = useToast();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const [signupEmail, setSignupEmail] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false); 

  useEffect(() => {
    if (currentUser && !authLoading) {
      navigate('/', { replace: true });
    }
  }, [currentUser, authLoading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      toast({ title: "Inicio de Sesión Exitoso", description: `Bienvenido de nuevo.` });
    } catch (error) {
      toast({
        title: "Error al Iniciar Sesión",
        description: error.message || "Credenciales incorrectas o error de red.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupPassword !== signupConfirmPassword) {
      toast({ title: "Error de Registro", description: "Las contraseñas no coinciden.", variant: "destructive", icon: <AlertCircle className="h-5 w-5" /> });
      return;
    }
    setIsSubmitting(true);
    try {
      await createUserAccount(signupEmail, signupPassword, signupUsername);
      toast({ 
        title: "Registro Exitoso", 
        description: "Por favor, revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.",
        duration: 7000 
      });
      setSignupEmail('');
      setSignupUsername('');
      setSignupPassword('');
      setSignupConfirmPassword('');
    } catch (error) {
      toast({
        title: "Error de Registro",
        description: error.message || "No se pudo completar el registro.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading && !currentUser) {
     return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-4">
            <Activity className="h-16 w-16 text-sky-400 animate-pulse" />
            <p className="text-slate-300 mt-4">Cargando...</p>
        </div>
    );
  }


  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-4"
    >
      <div className="text-center mb-8">
        <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
          className="flex items-center justify-center gap-3 text-5xl font-bold text-sky-400 mb-3"
        >
          <Activity className="h-12 w-12" />
          <span>CambioGeneral</span>
        </motion.div>
        <motion.p 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-slate-300"
        >
          Tu plataforma de registro contable.
        </motion.p>
      </div>

      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700/50 border-slate-600">
          <TabsTrigger value="login" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white text-slate-300">
            <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
          </TabsTrigger>
          <TabsTrigger value="signup" className="data-[state=active]:bg-sky-600 data-[state=active]:text-white text-slate-300">
            <UserPlus className="mr-2 h-4 w-4" /> Registrarse
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="bg-slate-800/70 border-slate-700 shadow-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-sky-400">Bienvenido de Nuevo</CardTitle>
                <CardDescription className="text-slate-400">Ingresa tus credenciales para acceder a tu cuenta.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-slate-300">Correo Electrónico</Label>
                    <Input 
                      id="login-email" 
                      type="email" 
                      placeholder="tu@email.com" 
                      value={loginEmail} 
                      onChange={(e) => setLoginEmail(e.target.value)} 
                      required 
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-password" className="text-slate-300">Contraseña</Label>
                    <Input 
                      id="login-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={loginPassword} 
                      onChange={(e) => setLoginPassword(e.target.value)} 
                      required 
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white" disabled={isSubmitting || authLoading}>
                    {isSubmitting ? 'Ingresando...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="signup">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="bg-slate-800/70 border-slate-700 shadow-2xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-sky-400">Crear Nueva Cuenta</CardTitle>
                <CardDescription className="text-slate-400">Completa el formulario para unirte.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-slate-300">Correo Electrónico</Label>
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="tu@email.com" 
                      value={signupEmail} 
                      onChange={(e) => setSignupEmail(e.target.value)} 
                      required 
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-500"
                      disabled={isSubmitting}
                    />
                  </div>
                   <div className="space-y-1.5">
                    <Label htmlFor="signup-username" className="text-slate-300">Nombre de Usuario</Label>
                    <Input 
                      id="signup-username" 
                      type="text" 
                      placeholder="TuNombreDeUsuario" 
                      value={signupUsername} 
                      onChange={(e) => setSignupUsername(e.target.value)} 
                      required 
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-slate-300">Contraseña</Label>
                    <Input 
                      id="signup-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={signupPassword} 
                      onChange={(e) => setSignupPassword(e.target.value)} 
                      required 
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-confirm-password" className="text-slate-300">Confirmar Contraseña</Label>
                    <Input 
                      id="signup-confirm-password" 
                      type="password" 
                      placeholder="••••••••" 
                      value={signupConfirmPassword} 
                      onChange={(e) => setSignupConfirmPassword(e.target.value)} 
                      required 
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-sky-500"
                      disabled={isSubmitting}
                    />
                  </div>
                  <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white" disabled={isSubmitting || authLoading}>
                    {isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-slate-500 text-center w-full">
                  Al registrarte, aceptas nuestros Términos y Política de Privacidad (ficticios).
                  Recibirás un correo para confirmar tu cuenta.
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      <motion.p 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-sm text-slate-400 mt-10"
      >
        &copy; {new Date().getFullYear()} CambioGeneral. Todos los derechos reservados.
      </motion.p>
    </motion.div>
  );
};

export default LoginPage;
