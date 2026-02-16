import { Route } from 'react-router-dom';
import { lazy } from 'react';

const PaymentList = lazy(() => import('@pages/payments/PaymentList/PaymentList'));
const PaymentDetail = lazy(() => import('@pages/payments/PaymentDetail/PaymentDetail'));
const CreatePayment = lazy(() => import('@pages/payments/CreatePayment/CreatePayment'));

export const PaymentRoutes = () => {
	return (
		<>
			<Route path="payments" element={<PaymentList />} />
			<Route path="payments/:paymentId" element={<PaymentDetail />} />
			<Route path="payments/create" element={<CreatePayment />} />
		</>
	);
};
