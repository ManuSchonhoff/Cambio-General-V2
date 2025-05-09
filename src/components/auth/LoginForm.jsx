
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, currentUser, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (currentUser && !authLoading) {
      toast({ title: "Inicio de Sesión Exitoso", description: `Bienvenido de nuevo, ${currentUser.username || currentUser.email}.` });
      navigate('/');
    }
  }, [currentUser, authLoading, navigate, toast]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await login(loginEmail, loginPassword);
      console.log("Login attempt data:", data);
      console.log("Login attempt error:", error);

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          toast({
            title: "Correo No Confirmado",
            description: "Por favor, revisa tu bandeja de entrada y confirma tu dirección de correo electrónico.",
            variant: "destructive",
            duration: 7000,
            icon: <AlertCircle className="h-5 w-5" />
          });
        } else if (error.message.includes("Failed to fetch") || (error.message.includes("server") && error.message.includes("503"))) {
          toast({
            title: "Error de Conexión",
            description: "No se pudo conectar con el servidor. Revisa tu conexión o inténtalo más tarde. (Error 503)",
            variant: "destructive",
            duration: 7000,
            icon: <AlertCircle className="h-5 w-5" />
          });
        } else if (error.message.toLowerCase().includes("invalid login credentials")) {
           toast({
            title: "Credenciales Inválidas",
            description: "El correo electrónico o la contraseña son incorrectos. Por favor, verifica tus datos.",
            variant: "destructive",
            duration: 7000,
            icon: <AlertCircle className="h-5 w-5" />
          });
        }
        else {
          throw error;
        }
      }
      // Navigation is now handled by the useEffect hook watching currentUser
    } catch (error) {
      console.error("Login catch error:", error);
      toast({
        title: "Error al Iniciar Sesión",
        description: error.message || "Ocurrió un problema. Inténtalo de nuevo más tarde.",
        variant: "destructive",
        icon: <AlertCircle className="h-5 w-5" />
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
      <Card className="bg-slate-800/70 border-slate-700 shadow-2xl backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-sky-400">Bienvenido de Nuevo</CardTitle>
          <CardDescription className="text-slate-400">Ingresa tus credenciales para acceder.</CardDescription>
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
              />
            </div>
            <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white" disabled={isLoading || authLoading}>
              {isLoading || authLoading ? 'Ingresando...' : 'Iniciar Sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default LoginForm;
