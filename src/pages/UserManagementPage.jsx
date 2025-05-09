
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext.jsx'; 
import { supabase } from '@/lib/supabaseClient.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Users, UserPlus, Edit3, Trash2, AlertTriangle } from 'lucide-react';

const UserManagementPage = () => {
  const { currentUser } = useAuth(); // To check if current user is admin
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State for new/edit user dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null for new user, user object for editing
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); // Only for new users
  const [role, setRole] = useState('user');
  const [avatarUrl, setAvatarUrl] = useState('');


  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Supabase admin functions can list users, but for simplicity with RLS and profiles:
      // We'll fetch from 'profiles' table. Admin role should have RLS policy to read all profiles.
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast({ title: "Error al Cargar Usuarios", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [currentUser]);

  const openDialogForNew = () => {
    setEditingUser(null);
    setEmail('');
    setUsername('');
    setPassword('');
    setRole('user');
    setAvatarUrl('');
    setIsDialogOpen(true);
  };

  const openDialogForEdit = (user) => {
    setEditingUser(user);
    setEmail(user.email || ''); // Email might be in auth.users, not profiles. Prefer direct fetch if complex.
    setUsername(user.username || '');
    setPassword(''); // Do not show/edit password for existing users
    setRole(user.role || 'user');
    setAvatarUrl(user.avatar_url || '');
    setIsDialogOpen(true);
  };

  const handleSaveUser = async () => {
    setIsSaving(true);
    try {
      if (editingUser) { // Update existing user's profile
        const updates = {
          username,
          role,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        };
        // Note: Email and password changes for existing users are more complex with Supabase Auth
        // and typically involve separate flows (e.g., user-initiated password reset, email change confirmation)
        // For admin, changing user email/password directly would be via Supabase Admin SDK (not client-side) or specific Supabase functions.
        // Here, we only update profile data.
        const { error } = await supabase.from('profiles').update(updates).eq('id', editingUser.id);
        if (error) throw error;
        toast({ title: "Usuario Actualizado", description: `El perfil de ${username} ha sido actualizado.` });
      } else { // Create new user (profile will be created by trigger)
        if (!password) {
            toast({ title: "Error", description: "La contraseña es requerida para nuevos usuarios.", variant: "destructive" });
            setIsSaving(false);
            return;
        }
        // Use AuthContext's createUser or a direct Supabase call if more control needed
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { username, role, avatar_url: avatarUrl, theme: 'system' }
            }
        });
        if (authError) throw authError;
        toast({ title: "Usuario Creado", description: `Se envió un correo de confirmación a ${email}. El perfil se creará tras la confirmación.` });
      }
      fetchUsers(); // Refresh list
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: "Error al Guardar Usuario", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId, userIdentifier) => {
    // Deleting users with Supabase client-side is tricky.
    // auth.deleteUser requires admin privileges and is usually done server-side.
    // For now, we can delete their profile, but the auth.users entry remains.
    // Proper deletion needs a Supabase Edge Function or server-side call with service_role key.
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el perfil de ${userIdentifier}? Esta acción no eliminará al usuario del sistema de autenticación, solo su perfil asociado.`)) {
        return;
    }
    try {
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) throw error;
        toast({ title: "Perfil Eliminado", description: `El perfil de ${userIdentifier} ha sido eliminado.` });
        fetchUsers();
    } catch (error) {
        toast({ title: "Error al Eliminar Perfil", description: error.message, variant: "destructive" });
    }
  };


  if (currentUser?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <AlertTriangle size={48} className="mb-4 text-destructive" />
        <p className="text-xl">Acceso Denegado</p>
        <p>No tienes permisos para acceder a esta página.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <Card className="shadow-xl border-t-4 border-primary">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-bold flex items-center gap-2 text-primary">
              <Users className="h-8 w-8" /> Gestión de Usuarios
            </CardTitle>
            <CardDescription>Administra los usuarios y sus roles en el sistema.</CardDescription>
          </div>
          <Button onClick={openDialogForNew} className="gradient-blue-bg text-white">
            <UserPlus className="mr-2 h-4 w-4" /> Agregar Usuario
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Cargando usuarios...</p>
          ) : users.length === 0 ? (
             <p className="text-muted-foreground text-center py-8">No hay usuarios para mostrar. Agrega el primero.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Usuario</TableHead>
                    <TableHead>Nombre de Usuario</TableHead>
                    {/* <TableHead>Email</TableHead> Removed as it's not directly in profiles, handle with care */}
                    <TableHead>Rol</TableHead>
                    <TableHead>Avatar URL</TableHead>
                    <TableHead>Última Actualización (Perfil)</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="text-xs">{user.id}</TableCell>
                      <TableCell className="font-medium">{user.username || 'N/A'}</TableCell>
                      {/* <TableCell>{user.email || 'N/A'}</TableCell> */}
                      <TableCell>{user.role}</TableCell>
                      <TableCell className="max-w-[150px] truncate text-xs">{user.avatar_url || '-'}</TableCell>
                      <TableCell className="text-xs">{user.updated_at ? new Date(user.updated_at).toLocaleString('es-AR') : '-'}</TableCell>
                      <TableCell className="text-center space-x-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-primary" onClick={() => openDialogForEdit(user)}>
                          <Edit3 size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={() => handleDeleteUser(user.id, user.username || user.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-primary">{editingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario'}</DialogTitle>
            <DialogDescription>
              {editingUser ? 'Modifica los detalles del perfil del usuario.' : 'Crea un nuevo usuario. Se enviará un correo de confirmación.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!editingUser && (
                 <div className="space-y-1.5">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
            )}
             <div className="space-y-1.5">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            {!editingUser && (
                 <div className="space-y-1.5">
                    <Label htmlFor="password">Contraseña {editingUser ? '(Dejar en blanco para no cambiar)' : ''}</Label>
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="role">Rol</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="avatarUrl">URL del Avatar (Opcional)</Label>
              <Input id="avatarUrl" type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveUser} disabled={isSaving} className="gradient-blue-bg text-white">
              {isSaving ? (editingUser ? 'Guardando Cambios...' : 'Creando Usuario...') : (editingUser ? 'Guardar Cambios' : 'Crear Usuario')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default UserManagementPage;
