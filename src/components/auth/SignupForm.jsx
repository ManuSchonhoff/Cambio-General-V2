
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from "@/components/ui/use-toast";

const SignupForm = () => {
  const { createUser } = useAuth();
  const { toast } = useToast();

  const [signupEmail, setSignupEmail] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    if (signupPassword !== signupConfirmPassword) {
      toast({ title: "Error de Registro", description: "Las contraseñas no coinciden.", variant: "destructive", icon: <AlertCircle className="h-5 w-5" /> });
      return;
    }
    setIsLoading(true);
    try {
      await createUser(signupEmail, signupPassword, signupUsername);
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
      setIsLoading(false);
    }
  };

  return (
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
              />
            </div>
            <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white" disabled={isLoading}>
              {isLoading ? 'Registrando...' : 'Crear Cuenta'}
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
  );
};

export default SignupForm;
