import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';
import { AuthProvider } from '@context/AuthContext';

describe('Header', () => {
  it('renders brand title', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <Header variant="public" />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText('WorkForge')).toBeInTheDocument();
  });
});
