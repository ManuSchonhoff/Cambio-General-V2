
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext.jsx';
import { supabase } from '@/lib/supabaseClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { User, Lock, Image as ImageIcon, Edit3, Check, AlertCircle } from 'lucide-react';
import { debug } from '@/lib/logger.js';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { currentUser, updateUserProfile, loading: authLoading, initialAuthChecked } = useAuth();
  const { toast } = useToast();

  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [isSubmittingAvatar, setIsSubmittingAvatar] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || '');
      setAvatarPreview(currentUser.avatar_url || '');
      debug.log('[SettingsPage] User data loaded:', { username: currentUser.username, avatar_url: currentUser.avatar_url });
    }
  }, [currentUser]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!username.trim()) {
      toast({ title: "Error", description: "El nombre de usuario no puede estar vacío.", variant: "destructive" });
      return;
    }
    setIsSubmittingProfile(true);
    debug.log('[SettingsPage] Updating profile with username:', username);
    try {
      await updateUserProfile(currentUser.id, { username });
      toast({ title: "Éxito", description: "Nombre de usuario actualizado." });
    } catch (error) {
      debug.error('[SettingsPage] Error updating profile:', error);
      toast({ title: "Error", description: `Error al actualizar el perfil: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "La contraseña debe tener al menos 6 caracteres.", variant: "destructive" });
      return;
    }
    setIsSubmittingPassword(true);
    debug.log('[SettingsPage] Updating password.');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Éxito", description: "Contraseña actualizada correctamente." });
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      debug.error('[SettingsPage] Error updating password:', error);
      toast({ title: "Error", description: `Error al actualizar la contraseña: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmittingPassword(false);
    }
  };
  
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({ title: "Archivo Demasiado Grande", description: "El tamaño máximo del avatar es 2MB.", variant: "destructive" });
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
        toast({ title: "Formato Inválido", description: "Solo se permiten imágenes JPG, PNG o GIF.", variant: "destructive" });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
      debug.log('[SettingsPage] Avatar file selected:', file.name);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !currentUser) return;

    setIsSubmittingAvatar(true);
    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    debug.log('[SettingsPage] Uploading avatar:', filePath);

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        debug.error('[SettingsPage] Error uploading avatar to storage:', uploadError);
        throw uploadError;
      }
      
      const { data: publicUrlData, error: urlError } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (urlError) {
        debug.error('[SettingsPage] Error getting public URL for avatar:', urlError);
        throw urlError;
      }
      
      const avatar_url = publicUrlData.publicUrl;
      debug.log('[SettingsPage] Avatar public URL:', avatar_url);

      await updateUserProfile(currentUser.id, { avatar_url });
      setAvatarPreview(avatar_url + `?t=${new Date().getTime()}`); 
      toast({ title: "Éxito", description: "Avatar actualizado." });
      setAvatarFile(null);
    } catch (error) {
      debug.error('[SettingsPage] Error in avatar upload process:', error);
      toast({ title: "Error de Avatar", description: `No se pudo actualizar el avatar: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmittingAvatar(false);
    }
  };
  
  if (authLoading && !initialAuthChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="p-4 bg-slate-800/80 rounded-lg shadow-2xl flex flex-col items-center">
          <svg className="animate-spin h-10 w-10 text-sky-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-slate-300 text-sm">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (initialAuthChecked && !currentUser) {
     return (
        <div className="flex flex-col justify-center items-center h-screen text-center">
            <AlertCircle size={48} className="text-destructive mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Acceso Denegado</h2>
            <p className="text-muted-foreground mb-6">Debes iniciar sesión para acceder a la configuración.</p>
            <Button onClick={() => navigate('/login')}>Ir a Iniciar Sesión</Button>
        </div>
     );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto max-w-4xl py-8 px-4 md:px-0"
    >
      <h1 className="text-3xl font-bold mb-8 text-foreground">Configuración de Cuenta</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card">
                <CardHeader className="items-center text-center">
                    <div className="relative mb-4">
                        <img  
                            alt={currentUser?.username || "Avatar de Usuario"}
                            className="w-32 h-32 rounded-full object-cover border-4 border-primary/50 shadow-md"
                            style={{ objectFit: 'cover' }}
                         src="https://images.unsplash.com/photo-1697383904756-5e8928369093" />
                        <Label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                            <ImageIcon size={18} />
                        </Label>
                        <Input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </div>
                    <CardTitle className="text-2xl font-semibold text-foreground">{currentUser?.username || "Usuario"}</CardTitle>
                    <CardDescription className="text-muted-foreground">{currentUser?.email}</CardDescription>
                    <CardDescription className="text-xs text-muted-foreground uppercase tracking-wider">{currentUser?.role}</CardDescription>
                </CardHeader>
                {avatarFile && (
                  <CardFooter>
                      <Button onClick={handleAvatarUpload} disabled={isSubmittingAvatar || authLoading} className="w-full gradient-blue-bg text-white">
                          {isSubmittingAvatar ? 'Subiendo Avatar...' : 'Guardar Avatar'}
                      </Button>
                  </CardFooter>
                )}
            </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-foreground"><User className="mr-2 text-primary" /> Actualizar Perfil</CardTitle>
              <CardDescription>Modifica tu nombre de usuario.</CardDescription>
            </CardHeader>
            <form onSubmit={handleProfileUpdate}>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-muted-foreground">Nombre de usuario</Label>
                  <div className="relative">
                    <Input 
                      id="username" 
                      type="text" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      className="pl-10 bg-background border-border focus:ring-primary"
                      placeholder="Tu nombre de usuario"
                    />
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmittingProfile || authLoading} className="w-full md:w-auto gradient-blue-bg text-white">
                  {isSubmittingProfile ? 'Guardando...' : <><Edit3 size={16} className="mr-2" />Guardar Cambios de Perfil</>}
                </Button>
              </CardFooter>
            </form>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center text-xl text-foreground"><Lock className="mr-2 text-primary" /> Cambiar Contraseña</CardTitle>
              <CardDescription>Actualiza tu contraseña de acceso.</CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordUpdate}>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="newPassword">Nueva Contraseña</Label>
                  <div className="relative">
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className="pl-10 bg-background border-border focus:ring-primary"
                    placeholder="Nueva contraseña (mín. 6 caracteres)"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
                  <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    className="pl-10 bg-background border-border focus:ring-primary"
                    placeholder="Confirma tu nueva contraseña"
                  />
                  <Check className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${newPassword && confirmPassword && newPassword === confirmPassword ? 'text-green-500' : 'text-muted-foreground'}`} />
                  </div>
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive mt-1 flex items-center"><AlertCircle size={12} className="mr-1"/>Las contraseñas no coinciden.</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isSubmittingPassword || authLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword} className="w-full md:w-auto gradient-blue-bg text-white">
                   {isSubmittingPassword ? 'Actualizando...' : <><Lock size={16} className="mr-2" />Actualizar Contraseña</>}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default SettingsPage;
