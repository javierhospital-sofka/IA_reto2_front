import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../features/auth/AuthProvider';
import { ToastProvider } from '../shared/components/ui/Toast';
import { LoginPage } from './LoginPage';

function renderLogin() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <MemoryRouter>
            <LoginPage />
          </MemoryRouter>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('LoginPage', () => {
  it('renders the demo login form with default credentials', () => {
    renderLogin();

    expect(
      screen.getByRole('heading', { name: /gestión de inventario/i })
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('admin.retail@sofka.local')).toBeInTheDocument();
  });

  it('shows a Zod validation error when email is empty', async () => {
    const user = userEvent.setup();
    renderLogin();

    const emailInput = screen.getByLabelText(/email/i);
    await user.clear(emailInput);
    await user.click(screen.getByRole('button', { name: /ingresar/i }));

    expect(await screen.findByText(/email requerido/i)).toBeInTheDocument();
  });
});
