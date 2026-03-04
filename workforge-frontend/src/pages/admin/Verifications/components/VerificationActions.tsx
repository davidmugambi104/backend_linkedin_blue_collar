// workforge-frontend/src/pages/admin/Verifications/components/VerificationActions.tsx
import React, { useState } from 'react';
import { Button } from '@components/ui/Button';
import { Textarea } from '@components/ui/Textarea';

interface VerificationActionsProps {
  verificationId: number;
  onApprove: (notes?: string) => void;
  onReject: (notes?: string) => void;
}

export const VerificationActions: React.FC<VerificationActionsProps> = ({
  onApprove,
  onReject,
}) => {
  const [notes, setNotes] = useState('');

  return (
    <div className="mt-4 space-y-3">
      <Textarea
        label="Review Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />
      <div className="flex items-center gap-3">
        <Button onClick={() => onApprove(notes)} className="bg-green-600 hover:bg-green-700">
          Approve
        </Button>
        <Button variant="outline" onClick={() => onReject(notes)} className="text-red-600">
          Reject
        </Button>
      </div>
    </div>
  );
};
