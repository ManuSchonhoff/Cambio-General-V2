
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";

const UserForm = ({ editingUser, onSave, onCancel, isSaving }) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    if (editingUser) {
      setEmail(editingUser.email || ''); // Email might not be directly on profile object
      setUsername(editingUser.username || '');
      setRole(editingUser.role || 'user');
      setAvatarUrl(editingUser.avatar_url || '');
      setPassword(''); // Clear password for editing
    } else {
      setEmail('');
      setUsername('');
      setPassword('');
      setRole('user');
      setAvatarUrl('');
    }
  }, [editingUser]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ email, username, password, role, avatarUrl });
  };

  return (
    <form onSubmit={handleSubmit}>
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
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            {editingUser && <p className="text-xs text-muted-foreground">Dejar en blanco para no cambiar la contraseña.</p>}
          </div>
        )}
         {editingUser && (
          <div className="space-y-1.5">
            <Label htmlFor="password-edit">Nueva Contraseña (Opcional)</Label>
            <Input id="password-edit" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Dejar en blanco para no cambiar"/>
             <p className="text-xs text-muted-foreground">Para cambiar la contraseña de un usuario existente, se recomienda un flujo de reseteo de contraseña iniciado por el usuario o una función de administrador más segura (no implementada aquí).</p>
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
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" disabled={isSaving} className="gradient-blue-bg text-white">
          {isSaving ? (editingUser ? 'Guardando Cambios...' : 'Creando Usuario...') : (editingUser ? 'Guardar Cambios' : 'Crear Usuario')}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default UserForm;
