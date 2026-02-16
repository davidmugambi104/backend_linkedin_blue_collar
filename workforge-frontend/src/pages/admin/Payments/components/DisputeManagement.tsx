import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  ExclamationTriangleIcon,
  UserIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Textarea } from '@components/ui/Textarea';
import { Select } from '@components/ui/Select';
import { Modal } from '@components/ui/Modal';
import { useDisputes, useResolveDispute } from '@hooks/useAdmin';
import type { DisputeCase } from '@types';
import { formatCurrency } from '@lib/utils/format';
import { Skeleton } from '@components/ui/Skeleton';

const priorityColors = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  urgent: 'error',
};

const statusColors = {
  open: 'warning',
  investigating: 'info',
  resolved: 'success',
  escalated: 'error',
};

export const DisputeManagement: React.FC = () => {
  const [selectedDispute, setSelectedDispute] = useState<DisputeCase | null>(null);
  const [resolution, setResolution] = useState('');
  const [refundAmount, setRefundAmount] = useState<number>();

  const { data, isLoading } = useDisputes({ status: 'open' });
  const resolveDispute = useResolveDispute();

  const handleResolve = async () => {
    if (!selectedDispute) return;

    await resolveDispute.mutateAsync({
      disputeId: selectedDispute.id,
      data: {
        resolution,
        refund_amount: refundAmount,
      },
    });

    setSelectedDispute(null);
    setResolution('');
    setRefundAmount(undefined);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Active Disputes</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Active Disputes</h3>
          <Badge variant="error" size="sm">
            {data?.total || 0} Open
          </Badge>
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {data?.disputes.length === 0 ? (
              <div className="text-center py-6">
                <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-gray-400" />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  No active disputes
                </p>
              </div>
            ) : (
              data?.disputes.map((dispute) => (
                <div
                  key={dispute.id}
                  className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mt-0.5" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Dispute #{dispute.id}
                          </h4>
                          <Badge variant={priorityColors[dispute.priority] as any} size="sm">
                            {dispute.priority}
                          </Badge>
                          <Badge variant={statusColors[dispute.status] as any} size="sm">
                            {dispute.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {dispute.reason}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setSelectedDispute(dispute)}
                    >
                      Review
                    </Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <UserIcon className="w-4 h-4 mr-2" />
                      <span>
                        {dispute.initiated_by === 'employer' ? 'Employer' : 'Worker'}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <BriefcaseIcon className="w-4 h-4 mr-2" />
                      <span>Job #{dispute.job_id}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                      <span>${dispute.payment_id}</span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Created {format(new Date(dispute.created_at), 'MMM dd, yyyy h:mm a')}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardBody>
      </Card>

      {/* Resolution Modal */}
      <Modal
        isOpen={!!selectedDispute}
        onClose={() => setSelectedDispute(null)}
        size="lg"
      >
        <Modal.Header onClose={() => setSelectedDispute(null)} showCloseButton>
          Resolve Dispute #{selectedDispute?.id}
        </Modal.Header>
        <Modal.Body>
          {selectedDispute && (
            <div className="space-y-6">
              {/* Dispute Details */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Dispute Details
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedDispute.description}
                </p>
                {selectedDispute.evidence_urls && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Evidence:
                    </p>
                    <div className="flex space-x-2">
                      {selectedDispute.evidence_urls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:underline"
                        >
                          Document {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Resolution Form */}
              <div className="space-y-4">
                <Textarea
                  label="Resolution Notes"
                  placeholder="Describe how this dispute should be resolved..."
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={4}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Refund Amount (Optional)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={refundAmount || ''}
                        onChange={(e) => setRefundAmount(parseFloat(e.target.value))}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-900 dark:border-gray-700"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Payment Amount
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(selectedDispute.payment_id)} {/* This should be payment.amount */}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedDispute(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleResolve}
                  isLoading={resolveDispute.isPending}
                  disabled={!resolution.trim()}
                >
                  Resolve Dispute
                </Button>
              </div>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};