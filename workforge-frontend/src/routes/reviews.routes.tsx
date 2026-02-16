import { Route } from 'react-router-dom';
import { lazy } from 'react';

const ReviewList = lazy(() => import('@pages/reviews/ReviewList/ReviewList'));
const CreateReview = lazy(() => import('@pages/reviews/CreateReview/CreateReview'));

export const ReviewRoutes = () => {
	return (
		<>
			<Route path="reviews" element={<ReviewList />} />
			<Route path="reviews/create" element={<CreateReview />} />
		</>
	);
};
