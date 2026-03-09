/**
 * Admin Verification Queue - Release 2
 * Bulk approve/reject verifications with SLA timers
 */
import React, { useState } from 'react';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { useVerificationQueue, useApproveVerification, useRejectVerification, useBulkVerification } from '@hooks/useAdminOps';
import { formatDate } from '@lib/utils/format';

export const AdminVerifications: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [page, setPage] = useState(1);
  
  const { data: queue, isLoading } = useVerificationQueue({ 
    page, 
    per_page: 20, 
    type: filterType || undefined 
  });
  
  const approveMutation = useApproveVerification();
  const rejectMutation = useRejectVerification();
  const bulkMutation = useBulkVerification();

  const handleSelectAll = () => {
    if (selectedIds.length === queue?.verifications?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(queue?.verifications?.map((v: any) => v.id) || []);
    }
  };

  const handleSelect = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleApprove = async (verificationId: number) => {
    await approveMutation.mutateAsync({ verificationId });
  };

  const handleReject = async (verificationId: number) => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      await rejectMutation.mutateAsync({ verificationId, reason });
    }
  };

  const handleBulkApprove = async () => {
    await bulkMutation.mutateAsync({ ids: selectedIds, action: 'approve' });
    setSelectedIds([]);
  };

  const handleBulkReject = async () => {
    const reason = prompt('Enter rejection reason for all:');
    if (reason) {
      await bulkMutation.mutateAsync({ ids: selectedIds, action: 'reject', reason });
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 text-[#1A1A1A]">
            Verification Queue
          </h1>
          <p className="mt-1 text-slate-500 ">
            Review and approve user verification requests
          </p>
        </div>
        
        {/* Filter */}
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="h-10 rounded-xl border px-4 py-2 text-sm bg-white bg-slate-800 border-gray-300 border-gray-600"
        >
          <option value="">All Types</option>
          <option value="id_verification">ID Verification</option>
          <option value="phone_verification">Phone Verification</option>
          <option value="skill_certification">Skill Certification</option>
          <option value="business_verification">Business Verification</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card className="p-4 bg-blue-50 bg-blue-900/20 border-blue-200 border-blue-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-blue-800 text-blue-300">
              {selectedIds.length} verification(s) selected
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                onClick={handleBulkApprove}
                isLoading={bulkMutation.isPending}
              >
                Approve All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                leftIcon={<XCircleIcon className="h-4 w-4" />}
                onClick={handleBulkReject}
                isLoading={bulkMutation.isPending}
              >
                Reject All
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Queue List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-24" />
            </Card>
          ))}
        </div>
      ) : queue?.verifications?.length === 0 ? (
        <Card className="p-8 lg:p-12 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <ShieldCheckIcon className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 text-[#1A1A1A] mb-2">
            All Caught Up!
          </h2>
          <p className="text-slate-500 ">
            No pending verifications in the queue
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Select All */}
          <div className="flex items-center gap-2 px-4">
            <input
              type="checkbox"
              checked={selectedIds.length === queue?.verifications?.length}
              onChange={handleSelectAll}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm text-slate-500">Select all</span>
          </div>

          {queue?.verifications?.map((verification: any) => (
            <Card 
              key={verification.id} 
              className={`p-4 lg:p-6 ${selectedIds.includes(verification.id) ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Checkbox */}
                <input
                  type="checkbox"
                  checked={selectedIds.includes(verification.id)}
                  onChange={() => handleSelect(verification.id)}
                  className="w-4 h-4 rounded"
                />

                {/* User Info */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 text-[#1A1A1A]">
                        {verification.user.username}
                      </h3>
                      <Badge variant={verification.user.role === 'worker' ? 'info' : 'default'}>
                        {verification.user.role}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <EnvelopeIcon className="h-4 w-4" />
                        {verification.user.email}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verification Type */}
                <div className="flex items-center gap-3">
                  <Badge variant="warning" className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    {verification.verification_type?.replace('_', ' ')}
                  </Badge>
                  
                  {/* Time since submission */}
                  <span className="text-xs text-slate-500">
                    {formatDate(verification.created_at)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                    onClick={() => handleApprove(verification.id)}
                    isLoading={approveMutation.isPending}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    leftIcon={<XCircleIcon className="h-4 w-4" />}
                    onClick={() => handleReject(verification.id)}
                    isLoading={rejectMutation.isPending}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {queue?.pagination?.pages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-slate-500">
                Page {page} of {queue.pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === queue.pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminVerifications;
