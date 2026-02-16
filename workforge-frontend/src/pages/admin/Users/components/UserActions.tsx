import React from 'react';
import { Button } from '@components/ui/Button';
import { UserWithDetails } from '@types';

interface UserActionsProps {
  user: UserWithDetails;
  onView: () => void;
  onBan: () => void;
  onUnban: () => void;
  onDelete: () => void;
}

export const UserActions: React.FC<UserActionsProps> = ({
  user,
  onView,
  onBan,
  onUnban,
  onDelete,
}) => {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" size="sm" onClick={onView}>
        View
      </Button>
      {user.is_active ? (
        <Button variant="outline" size="sm" onClick={onBan}>
          Ban
        </Button>
      ) : (
        <Button variant="outline" size="sm" onClick={onUnban}>
          Unban
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={onDelete}>
        Delete
      </Button>
    </div>
  );
};
