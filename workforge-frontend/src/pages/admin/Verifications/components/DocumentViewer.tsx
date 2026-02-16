import React from 'react';
import { Modal } from '@components/ui/Modal';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl?: string;
  documentType?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  onClose,
  documentUrl,
  documentType,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <Modal.Header onClose={onClose} showCloseButton>
        Document Preview
      </Modal.Header>
      <Modal.Body>
        {documentUrl ? (
          <div className="w-full h-[70vh]">
            <iframe
              title={documentType || 'document'}
              src={documentUrl}
              className="w-full h-full rounded-lg border border-gray-200 dark:border-gray-700"
            />
          </div>
        ) : (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            No document available.
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};
