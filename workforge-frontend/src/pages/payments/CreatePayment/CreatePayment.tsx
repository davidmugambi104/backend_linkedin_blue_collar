import { Card, CardHeader, CardBody } from '@components/ui/Card';
import { PaymentForm } from './components/PaymentForm';

export default function CreatePayment() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create Payment</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Initialize a new payment transaction</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Payment Details</h2>
        </CardHeader>
        <CardBody>
          <PaymentForm />
        </CardBody>
      </Card>
    </div>
  );
}
