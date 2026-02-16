import React, { useState } from 'react';
import { useVerificationQueue, useReviewVerification } from '@hooks/useAdmin';
import { VerificationRequestCard } from './components/VerificationRequestCard';
import { VerificationStats } from './components/VerificationStats';
import { Card, CardBody } from '@components/ui/Card';
import { Tabs, TabPanel } from '@components/ui/Tabs';
import { Select } from '@components/ui/Select';
import { Input } from '@components/ui/Input';
import { Pagination } from '@components/common/Pagination';
import { Skeleton } from '@components/ui/Skeleton';
import { MagnifyingGlassIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export const VerificationQueue: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState('all');

  const { data, isLoading } = useVerificationQueue({
    status: activeTab !== 'all' ? activeTab : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    page: currentPage,
    limit: 10,
  });

  const reviewVerification = useReviewVerification();

  const handleReview = async (
    verificationId: number,
    status: 'approved' | 'rejected',
    notes?: string
  ) => {
    await reviewVerification.mutateAsync({
      verificationId,
      data: { status, notes },
    });
  };

  const tabs = [
    { id: 'pending', label: 'Pending Review' },
    { id: 'verified', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'all', label: 'All Requests' },
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'id_card', label: 'ID Card' },
    { value: 'license', label: 'Professional License' },
    { value: 'certification', label: 'Certification' },
  ];

  const filteredRequests = data?.requests.filter((request) =>
    request.worker?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.worker?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Verification Queue
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Review and approve worker verification documents
        </p>
      </div>

      <VerificationStats />

      <Card>
        <CardBody>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<MagnifyingGlassIcon className="w-5 h-5" />}
                fullWidth
              />
            </div>
            <div className="sm:w-48">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {/* Tabs */}
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
            className="mb-6"
          />

          {/* Verification Requests */}
          <div className="space-y-4">
            {filteredRequests?.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheckIcon className="w-12 h-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                  No verification requests
                </h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {activeTab === 'pending'
                    ? 'All caught up! No pending verifications.'
                    : `No ${activeTab} verification requests found.`}
                </p>
              </div>
            ) : (
              filteredRequests?.map((request) => (
                <VerificationRequestCard
                  key={request.id}
                  request={request}
                  onReview={handleReview}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {data?.total && data.total > 10 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(data.total / 10)}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default VerificationQueue;