import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { ReviewForm } from './components/ReviewForm';

export default function CreateReview() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Review</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Share your feedback and experience</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Review Details</h2>
        </CardHeader>
        <CardBody>
          <ReviewForm />
        </CardBody>
      </Card>
    </div>
  );
}
