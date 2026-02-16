import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AuthProvider } from '@context/AuthContext';

const renderSidebar = () =>
  render(
    <MemoryRouter initialEntries={['/worker/dashboard']}>
      <AuthProvider>
        <Sidebar />
      </AuthProvider>
    </MemoryRouter>
  );

describe('Sidebar', () => {
  it('renders navigation labels', () => {
    renderSidebar();
    expect(screen.getByLabelText(/sidebar navigation/i)).toBeInTheDocument();
  });
});
