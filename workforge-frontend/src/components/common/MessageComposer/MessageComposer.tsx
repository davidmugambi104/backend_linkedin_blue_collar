import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Modal } from '@components/ui/Modal';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Avatar } from '@components/ui/Avatar';
import { messageService } from '@services/message.service';
import { toast } from 'react-toastify';
import { Worker, Employer } from '@types';

interface MessageComposerProps {
  recipient: Worker | Employer;
  recipientRole: 'worker' | 'employer';
  isOpen: boolean;
  onClose: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  recipient,
  recipientRole,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    try {
      await messageService.sendMessage({
        receiver_id: (recipient as any).id,
        content: message,
      });

      toast.success('Message sent successfully');
      onClose();
      
      // Navigate to conversation
      setTimeout(() => {
        navigate('/messages');
      }, 1000);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const getRecipientName = () => {
    if (recipientRole === 'worker') {
      return (recipient as any).full_name || (recipient as any).display_name || 'Worker';
    }
    return (recipient as any).company_name || 'Employer';
  };

  const getRecipientAvatar = () => {
    if (recipientRole === 'worker') {
      return (recipient as any).profile_picture || (recipient as any).avatar;
    }
    return (recipient as any).logo;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <Modal.Header onClose={onClose} showCloseButton>
        Send Message
      </Modal.Header>
      <Modal.Body>
        <div className="space-y-4">
          {/* Recipient Info */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 bg-bg-gray-800 rounded-lg">
            <Avatar
              src={getRecipientAvatar()}
              name={getRecipientName()}
              size="md"
            />
            <div>
              <p className="text-sm font-medium text-gray-900 bg-text-white">
                To: {getRecipientName()}
              </p>
              <p className="text-xs text-gray-500 bg-text-gray-400 capitalize">
                {recipientRole}
              </p>
            </div>
          </div>

          {/* Message Input */}
          <div className="relative">
            <textarea
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              autoFocus
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-bg-gray-800 bg-border-gray-600 bg-text-white"
            />
          </div>

          <div className="text-xs text-gray-500 bg-text-gray-400">
            Messages are private and will only be visible to you and the recipient.
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          isLoading={isSending}
          disabled={!message.trim()}
          leftIcon={<PaperAirplaneIcon className="w-4 h-4" />}
        >
          Send Message
        </Button>
      </Modal.Footer>
    </Modal>
  );
};