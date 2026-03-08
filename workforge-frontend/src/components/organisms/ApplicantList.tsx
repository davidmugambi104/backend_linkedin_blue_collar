import { Avatar, Badge, Button } from '@components/atoms';

export interface Applicant {
  id: number;
  name: string;
  appliedDate: string;
  status: 'new' | 'reviewed' | 'shortlisted' | 'rejected';
}

export interface ApplicantListProps {
  applicants: Applicant[];
}

const statusVariant: Record<Applicant['status'], 'blue' | 'yellow' | 'green' | 'red'> = {
  new: 'blue',
  reviewed: 'yellow',
  shortlisted: 'green',
  rejected: 'red',
};

export const ApplicantList = ({ applicants }: ApplicantListProps) => (
  <div className="space-y-3">
    {applicants.map((applicant) => (
      <article key={applicant.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-level-1">
        <div className="flex items-center gap-3">
          <Avatar name={applicant.name} size="md" />
          <div>
            <p className="font-medium text-gray-900">{applicant.name}</p>
            <p className="text-sm text-gray-500">Applied {applicant.appliedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant[applicant.status]}>{applicant.status}</Badge>
          <Button variant="secondary" size="sm">View</Button>
        </div>
      </article>
    ))}
  </div>
);
