import React from 'react';
import { format } from 'date-fns';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Payment, PaymentStatus, PaymentType, JobStatus } from '@types';
import { cn } from '@lib/utils/cn';

interface PaymentTimelineProps {
  payment: Payment;
}

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  status: PaymentStatus;
  icon: React.ElementType;
  completed: boolean;
}

export const PaymentTimeline: React.FC<PaymentTimelineProps> = ({ payment }) => {
  const events: TimelineEvent[] = [
    {
      id: 'created',
      title: 'Payment Initiated',
      description: 'Payment was created and is pending',
      timestamp: payment.created_at,
      status: PaymentStatus.PENDING,
      icon: ClockIcon,
      completed: true,
    },
    ...(payment.payment_type === PaymentType.JOB_PAYMENT && payment.status !== PaymentStatus.CANCELLED ? [
      {
        id: 'escrow',
        title: 'Funds Held in Escrow',
        description: 'Payment secured in escrow account',
        timestamp: payment.created_at,
        status: PaymentStatus.ESCROW,
        icon: ShieldCheckIcon,
        completed: payment.status === PaymentStatus.ESCROW || 
                 payment.status === PaymentStatus.RELEASED ||
                 payment.status === PaymentStatus.PAID,
      },
      {
        id: 'work_completed',
        title: 'Work Completed',
        description: 'Job marked as completed by employer',
        timestamp: payment.job?.updated_at || payment.created_at,
        status: PaymentStatus.PROCESSING,
        icon: CheckCircleIcon,
        completed: payment.job?.status === JobStatus.COMPLETED,
      },
      {
        id: 'released',
        title: 'Payment Released',
        description: 'Funds released to worker',
        timestamp: payment.paid_at || payment.updated_at,
        status: PaymentStatus.RELEASED,
        icon: DocumentTextIcon,
        completed: payment.status === PaymentStatus.RELEASED || 
                 payment.status === PaymentStatus.PAID,
      },
    ] : []),
    {
      id: 'completed',
      title: 'Payment Completed',
      description: 'Transaction successfully completed',
      timestamp: payment.paid_at || payment.updated_at,
      status: PaymentStatus.PAID,
      icon: CheckCircleIcon,
      completed: payment.status === PaymentStatus.PAID,
    },
    ...(payment.status === PaymentStatus.REFUNDED ? [
      {
        id: 'refunded',
        title: 'Payment Refunded',
        description: payment.refund_reason || 'Payment was refunded',
        timestamp: payment.refunded_at || payment.updated_at,
        status: PaymentStatus.REFUNDED,
        icon: ArrowPathIcon,
        completed: true,
      },
    ] : []),
    ...(payment.status === PaymentStatus.FAILED ? [
      {
        id: 'failed',
        title: 'Payment Failed',
        description: 'Transaction could not be completed',
        timestamp: payment.updated_at,
        status: PaymentStatus.FAILED,
        icon: XCircleIcon,
        completed: true,
      },
    ] : []),
    ...(payment.status === PaymentStatus.DISPUTED ? [
      {
        id: 'disputed',
        title: 'Payment Disputed',
        description: 'Dispute filed by employer or worker',
        timestamp: payment.updated_at,
        status: PaymentStatus.DISPUTED,
        icon: XCircleIcon,
        completed: true,
      },
    ] : []),
  ];

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Payment Timeline
        </h3>
      </CardHeader>
      <CardBody>
        <div className="flow-root">
          <ul className="-mb-8">
            {events.filter(e => e.completed).map((event, eventIdx) => (
              <li key={event.id}>
                <div className="relative pb-8">
                  {eventIdx !== events.filter(e => e.completed).length - 1 && (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700"
                      aria-hidden="true"
                    />
                  )}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white dark:ring-gray-900',
                          {
                            'bg-green-500': event.status === PaymentStatus.PAID || 
                                           event.status === PaymentStatus.RELEASED,
                            'bg-blue-500': event.status === PaymentStatus.ESCROW,
                            'bg-yellow-500': event.status === PaymentStatus.PENDING ||
                                            event.status === PaymentStatus.PROCESSING,
                            'bg-red-500': event.status === PaymentStatus.FAILED ||
                                         event.status === PaymentStatus.DISPUTED,
                            'bg-gray-500': event.status === PaymentStatus.REFUNDED ||
                                          event.status === PaymentStatus.CANCELLED,
                          }
                        )}
                      >
                        <event.icon className="h-5 w-5 text-white" />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {event.title}
                        </p>
                        {event.description && (
                          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <div className="whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                        <time dateTime={event.timestamp}>
                          {format(new Date(event.timestamp), 'MMM d, yyyy • h:mm a')}
                        </time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {payment.disputes && payment.disputes.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
              Dispute Details
            </h4>
            {payment.disputes.map((dispute) => (
              <div
                key={dispute.id}
                className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4"
              >
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                      {dispute.reason}
                    </p>
                    <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                      Status: {dispute.status} • Filed {format(new Date(dispute.created_at), 'MMM d, yyyy')}
                    </p>
                    {dispute.resolution && (
                      <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                        Resolution: {dispute.resolution}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};