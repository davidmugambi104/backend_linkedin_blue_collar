import { Badge, Button } from '@components/atoms';

export interface JobPostingCardProps {
  title: string;
  company: string;
  location: string;
  type: string;
  salaryRange: string;
  applicants: number;
  views: number;
}

export const JobPostingCard = ({ title, company, location, type, salaryRange, applicants, views }: JobPostingCardProps) => (
  <article className="rounded-lg border border-gray-200 bg-white p-6 shadow-level-1">
    <div className="mb-3 flex items-start justify-between gap-3">
      <h3 className="line-clamp-2 font-heading text-lg font-semibold text-gray-900">{title}</h3>
      <Badge variant="blue">{type}</Badge>
    </div>
    <p className="text-sm text-gray-500">{company}</p>
    <p className="text-sm text-gray-500">{location}</p>
    <p className="mt-2 text-sm font-medium text-gray-700">{salaryRange}</p>
    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
      <span>{applicants} applicants</span>
      <span>{views} views</span>
    </div>
    <div className="mt-4 flex gap-2">
      <Button variant="secondary" size="sm">Edit</Button>
      <Button variant="tertiary" size="sm">View Applicants</Button>
    </div>
  </article>
);
