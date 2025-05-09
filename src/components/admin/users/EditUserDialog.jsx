
import React from 'react';
import UserFormDialog from '@/components/admin/users/UserFormDialog.jsx';

const EditUserDialog = ({ user, isOpen, onClose, onUpdateUser }) => {
  if (!user) return null;

  const handleSubmit = async (formData) => {
    await onUpdateUser(user.id, formData);
  };

  return (
    <UserFormDialog
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      initialData={{
        username: user.username || user.user_metadata?.username,
        email: user.email,
        role: user.role || user.user_metadata?.role,
      }}
      isEditing={true}
    />
  );
};

export default EditUserDialog;
