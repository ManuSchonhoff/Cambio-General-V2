
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit3, Trash2, UserCircle, Shield } from 'lucide-react';

const UserList = ({ users, onEditUser, onDeleteUser }) => {
  if (users.length === 0) {
    return <p className="text-muted-foreground text-center py-12 text-lg">No hay usuarios para mostrar. ¡Agrega el primero!</p>;
  }

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full">
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[80px] pl-6">Avatar</TableHead>
            <TableHead>Nombre de Usuario</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead className="hidden md:table-cell">ID Usuario</TableHead>
            <TableHead className="hidden lg:table-cell">Última Actualización</TableHead>
            <TableHead className="text-right pr-6">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id} className="hover:bg-muted/30 transition-colors duration-150">
              <TableCell className="pl-6">
                <Avatar className="h-10 w-10 border-2 border-primary/50">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.username || 'Usuario'} />
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
              </TableCell>
              <TableCell className="font-medium text-foreground">{user.username || 'N/A'}</TableCell>
              <TableCell>
                <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="text-xs font-semibold flex items-center gap-1 w-fit">
                  {user.role === 'admin' ? <Shield size={12} /> : <UserCircle size={12} />}
                  {user.role === 'admin' ? 'Admin' : 'Usuario'}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{user.id}</TableCell>
              <TableCell className="text-xs text-muted-foreground hidden lg:table-cell">
                {user.updated_at ? new Date(user.updated_at).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}
              </TableCell>
              <TableCell className="text-right space-x-1 pr-6">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors" onClick={() => onEditUser(user)}>
                  <Edit3 size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors" onClick={() => onDeleteUser(user.id, user.username || user.id)}>
                  <Trash2 size={16} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserList;
