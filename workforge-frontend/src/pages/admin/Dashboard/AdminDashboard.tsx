/**
 * Admin Dashboard - Release 1: Foundation
 * - Core KPIs
 * - Activity feed
 * - Quick actions
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  UsersIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  BellAlertIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { Skeleton } from '@components/ui/Skeleton';
import { useAdminKPIs, useActivityFeed, useAdminPermissions } from '@hooks/useAdminDashboard';
import { formatDate } from '@lib/utils/format';

export const AdminDashboard: React.FC = () => {
  const { data: kpis, isLoading: kpisLoading } = useAdminKPIs();
  const { data: activity, isLoading: activityLoading } = useActivityFeed(10);
  const { data: permissions } = useAdminPermissions();

  // Format currency
  const formatKES = (amount: number) => {
    if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `KES ${(amount / 1000).toFixed(1)}K`;
    return `KES ${amount.toFixed(0)}`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Platform overview and key metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Live
          </span>
        </div>
      </div>

      {/* Admin Role Badge */}
      {permissions && (
        <div className="solid-card p-4 bg-gradient-to-r from-navy-50 to-navy-100 border-navy-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-navy flex items-center justify-center">
                <ShieldCheckIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-charcoal">
                  Logged in as: <span className="text-navy">{permissions.username}</span>
                </p>
                <p className="text-sm text-muted">
                  Role: {permissions.admin_role?.replace('_', ' ').toUpperCase()}
                </p>
              </div>
            </div>
            <span className="badge badge-info">
              {permissions.permissions.length} permissions
            </span>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="employer-grid employer-grid-4">
        {/* Total Users */}
        <div className="stat-widget">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Total Users</p>
              <p className="text-2xl lg:text-3xl font-bold text-charcoal mt-1">
                {kpisLoading ? <Skeleton className="h-8 w-20" /> : kpis?.users.total.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-2">
                {kpis?.users.new_today ? (
                  <>
                    <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                    <span className="text-xs text-green-600">
                      +{kpis.users.new_today} today
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-muted">No new users today</span>
                )}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-navy-50 flex items-center justify-center text-navy">
              <UsersIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="stat-widget">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Active Jobs</p>
              <p className="text-2xl lg:text-3xl font-bold text-charcoal mt-1">
                {kpisLoading ? <Skeleton className="h-8 w-20" /> : kpis?.jobs.active.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                <span className="text-xs text-green-600">
                  {kpis?.jobs.completed || 0} completed
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <BriefcaseIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Payment Volume */}
        <div className="stat-widget">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Payment Volume</p>
              <p className="text-2xl lg:text-3xl font-bold text-charcoal mt-1">
                {kpisLoading ? <Skeleton className="h-8 w-20" /> : formatKES(kpis?.payments.total_volume || 0)}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-xs text-muted">
                  KES {((kpis?.payments.volume_week || 0) / 1000).toFixed(0)}K this week
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <CurrencyDollarIcon className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Pending Verifications */}
        <div className="stat-widget">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Pending Verifications</p>
              <p className="text-2xl lg:text-3xl font-bold text-charcoal mt-1">
                {kpisLoading ? <Skeleton className="h-8 w-20" /> : kpis?.verifications.pending || 0}
              </p>
              <div className="flex items-center gap-1 mt-2">
                <ClockIcon className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-amber-600">
                  {kpis?.verifications.this_week || 0} this week
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <ShieldCheckIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {/* Workers */}
        <Card className="p-4 lg:p-6" hoverable>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 bg-indigo-900/30 flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 ">Workers</p>
              <p className="text-lg font-bold text-gray-900 text-[#1A1A1A]">
                {kpisLoading ? <Skeleton className="h-6 w-12" /> : kpis?.users.workers || 0}
              </p>
            </div>
          </div>
        </Card>

        {/* Employers */}
        <Card className="p-4 lg:p-6" hoverable>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-pink-100 bg-pink-900/30 flex items-center justify-center">
              <BriefcaseIcon className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 ">Employers</p>
              <p className="text-lg font-bold text-gray-900 text-[#1A1A1A]">
                {kpisLoading ? <Skeleton className="h-6 w-12" /> : kpis?.users.employers || 0}
              </p>
            </div>
          </div>
        </Card>

        {/* Open Disputes */}
        <Card className="p-4 lg:p-6" hoverable>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-100 bg-red-900/30 flex items-center justify-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 ">Open Disputes</p>
              <p className="text-lg font-bold text-gray-900 text-[#1A1A1A]">
                {kpisLoading ? <Skeleton className="h-6 w-12" /> : kpis?.disputes.open || 0}
              </p>
            </div>
          </div>
        </Card>

        {/* Verified Workers */}
        <Card className="p-4 lg:p-6" hoverable>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 bg-green-900/30 flex items-center justify-center">
              <ShieldCheckIcon className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 ">Verified Workers</p>
              <p className="text-lg font-bold text-gray-900 text-[#1A1A1A]">
                {kpisLoading ? <Skeleton className="h-6 w-12" /> : kpis?.users.verified_workers || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="p-4 lg:p-6">
          <h3 className="text-lg font-semibold text-gray-900 text-[#1A1A1A] mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/admin/users">
              <Button variant="outline" className="w-full justify-start" leftIcon={<UsersIcon className="h-5 w-5" />}>
                Manage Users
              </Button>
            </Link>
            <Link to="/admin/verifications">
              <Button variant="outline" className="w-full justify-start" leftIcon={<ShieldCheckIcon className="h-5 w-5" />}>
                Review Verifications
                {kpis?.verifications.pending ? (
                  <Badge variant="warning" className="ml-auto">{kpis.verifications.pending}</Badge>
                ) : null}
              </Button>
            </Link>
            <Link to="/admin/jobs">
              <Button variant="outline" className="w-full justify-start" leftIcon={<BriefcaseIcon className="h-5 w-5" />}>
                Moderate Jobs
              </Button>
            </Link>
            <Link to="/admin/payments">
              <Button variant="outline" className="w-full justify-start" leftIcon={<CurrencyDollarIcon className="h-5 w-5" />}>
                View Payments
              </Button>
            </Link>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-4 lg:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 text-[#1A1A1A]">Recent Activity</h3>
            <Link to="/admin/audit-log" className="text-sm text-blue-600 text-blue-400 hover:underline">
              View All
            </Link>
          </div>
          
          {activityLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {/* Users */}
              {activity?.users?.slice(0, 3).map((user: any) => (
                <div key={`user-${user.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 hover:bg-gray-800/50">
                  <div className="w-8 h-8 rounded-full bg-blue-100 bg-blue-900/30 flex items-center justify-center">
                    <UsersIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 text-[#1A1A1A] truncate">
                      New user: {user.username}
                    </p>
                    <p className="text-xs text-slate-500">{formatDate(user.created_at)}</p>
                  </div>
                  <Badge variant="success">New</Badge>
                </div>
              ))}
              
              {/* Jobs */}
              {activity?.jobs?.slice(0, 2).map((job: any) => (
                <div key={`job-${job.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 hover:bg-gray-800/50">
                  <div className="w-8 h-8 rounded-full bg-purple-100 bg-purple-900/30 flex items-center justify-center">
                    <BriefcaseIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 text-[#1A1A1A] truncate">
                      {job.title}
                    </p>
                    <p className="text-xs text-slate-500">{job.status} • {formatDate(job.created_at)}</p>
                  </div>
                </div>
              ))}
              
              {/* Disputes */}
              {activity?.disputes?.slice(0, 2).map((dispute: any) => (
                <div key={`dispute-${dispute.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 hover:bg-gray-800/50">
                  <div className="w-8 h-8 rounded-full bg-red-100 bg-red-900/30 flex items-center justify-center">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 text-[#1A1A1A] truncate">
                      Dispute #{dispute.id}: {dispute.dispute_type}
                    </p>
                    <p className="text-xs text-slate-500">{dispute.status} • {formatDate(dispute.created_at)}</p>
                  </div>
                  <Badge variant={dispute.status === 'open' ? 'warning' : 'default'}>{dispute.status}</Badge>
                </div>
              ))}
              
              {(!activity?.users?.length && !activity?.jobs?.length && !activity?.disputes?.length) && (
                <p className="text-center text-slate-500  py-8">
                  No recent activity
                </p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Platform Health */}
      <Card className="p-4 lg:p-6">
        <h3 className="text-lg font-semibold text-gray-900 text-[#1A1A1A] mb-4">Platform Health</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-green-50 bg-green-900/20">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircleIcon className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800 text-green-400">System Status</span>
            </div>
            <p className="text-2xl font-bold text-green-700 text-green-300">Healthy</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 bg-blue-900/20">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheckIcon className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800 text-blue-400">Verification Rate</span>
            </div>
            <p className="text-2xl font-bold text-blue-700 text-blue-300">
              {kpisLoading ? <Skeleton className="h-8 w-16" /> : `${kpis?.platform_health.verification_rate || 0}%`}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-purple-50 bg-purple-900/20">
            <div className="flex items-center gap-2 mb-2">
              <BriefcaseIcon className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-purple-800 text-purple-400">Job Completion</span>
            </div>
            <p className="text-2xl font-bold text-purple-700 text-purple-300">
              {kpisLoading ? <Skeleton className="h-8 w-16" /> : `${kpis?.platform_health.job_completion_rate || 0}%`}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-amber-50 bg-amber-900/20">
            <div className="flex items-center gap-2 mb-2">
              <ClockIcon className="h-5 w-5 text-amber-600" />
              <span className="font-medium text-amber-800 text-amber-400">Pending Payments</span>
            </div>
            <p className="text-2xl font-bold text-amber-700 text-amber-300">
              {kpisLoading ? <Skeleton className="h-8 w-16" /> : kpis?.payments.pending || 0}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminDashboard;
