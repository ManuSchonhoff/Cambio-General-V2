
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Trash2, ShieldCheck, User as UserIcon } from 'lucide-react';
import DeleteUserAlert from '@/components/admin/users/DeleteUserAlert.jsx';
import EditUserDialog from '@/components/admin/users/EditUserDialog.jsx';

const RoleIcon = ({ role }) => {
  if (role === 'admin') return <ShieldCheck className="h-5 w-5 text-green-500" />;
  return <UserIcon className="h-5 w-5 text-gray-500" />;
};

const UserTable = ({ users, currentUserId, onEdit, onDelete, onUpdateUser }) => {
  const [editingUser, setEditingUser] = React.useState(null);
  const [deletingUser, setDeletingUser] = React.useState(null);

  const openEditDialog = (user) => {
    setEditingUser(user);
  };

  const closeEditDialog = () => {
    setEditingUser(null);
  };

  const openDeleteAlert = (user) => {
    setDeletingUser(user);
  };

  const closeDeleteAlert = () => {
    setDeletingUser(null);
  };
  
  return (
    <>
      <div className="bg-card shadow-md rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] hidden sm:table-cell">Avatar</TableHead>
              <TableHead>Nombre de Usuario</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="text-center">Rol</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50">
                <TableCell className="hidden sm:table-cell">
                  <img
                    src={user.avatar_url || user.user_metadata?.avatar_url || `https://avatar.vercel.sh/${user.id}.png?size=40`}
                    alt={user.username || user.user_metadata?.username}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                </TableCell>
                <TableCell className="font-medium">{user.username || user.user_metadata?.username || 'N/A'}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{user.email}</TableCell>
                <TableCell className="text-center">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin' || user.user_metadata?.role === 'admin' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                    <RoleIcon role={user.role || user.user_metadata?.role} />
                    <span className="ml-1">{user.role === 'admin' || user.user_metadata?.role === 'admin' ? 'Admin' : 'Usuario'}</span>
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700" onClick={() => openEditDialog(user)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" disabled={user.id === currentUserId || user.email === 'admin@example.com'}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    {/* DeleteUserAlert will be rendered here if its trigger is part of this AlertDialog */}
                    {/* For now, we assume DeleteUserAlert is its own dialog system or part of a global one */}
                    {/* If DeleteUserAlert is a separate dialog, trigger it directly: onClick={() => openDeleteAlert(user)} */}
                  </AlertDialog>
                   <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700" 
                    onClick={() => openDeleteAlert(user)} 
                    disabled={user.id === currentUserId || user.email === 'admin@example.com' /* Prevent deleting the seed admin or self */}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {users.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No se encontraron usuarios.</p>
        )}
      </div>

      {editingUser && (
        <EditUserDialog
          user={editingUser}
          isOpen={!!editingUser}
          onClose={closeEditDialog}
          onUpdateUser={onUpdateUser}
        />
      )}

      {deletingUser && (
        <DeleteUserAlert
          user={deletingUser}
          isOpen={!!deletingUser}
          onClose={closeDeleteAlert}
          onDeleteUser={onDelete}
        />
      )}
    </>
  );
};

export default UserTable;
