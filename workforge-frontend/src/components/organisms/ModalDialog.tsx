import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import type { ReactNode } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Button } from '@components/atoms';

export interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const ModalDialog = ({ open, onClose, title, children, footer }: ModalDialogProps) => (
  <Dialog open={open} onClose={onClose} className="relative z-50">
    <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
    <div className="fixed inset-0 flex items-center justify-center p-4">
      <DialogPanel className="w-full max-w-lg rounded-lg bg-white p-6 shadow-level-3">
        <div className="mb-4 flex items-center justify-between">
          <DialogTitle className="font-heading text-lg font-semibold text-gray-900">{title}</DialogTitle>
          <Button variant="icon" aria-label="Close dialog" onClick={onClose}>
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        <div>{children}</div>
        {footer ? <div className="mt-4 flex justify-end gap-2">{footer}</div> : null}
      </DialogPanel>
    </div>
  </Dialog>
);
