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
import { debug } from '@/lib/logger.jsx';

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
      if (file.size > 2 * 1024 * 1024) {
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

  if (!initialAuthChecked) return null;

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto max-w-4xl py-8 px-4 md:px-0"
    >
      {/* Resto del contenido intacto */}
    </motion.div>
  );
};

export default SettingsPage;
