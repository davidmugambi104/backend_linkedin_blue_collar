import { Route } from 'react-router-dom';
import { lazy } from 'react';

const MessagesInbox = lazy(() => import('@pages/messages/Inbox/Inbox'));

export const MessagesRoutes = () => {
	return (
		<>
			<Route path="messages" element={<MessagesInbox />} />
		</>
	);
};
