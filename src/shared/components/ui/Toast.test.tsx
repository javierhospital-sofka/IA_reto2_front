import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from './Toast';

function ToastTrigger() {
  const toast = useToast();
  return (
    <div>
      <button onClick={() => toast.success('Guardado', 'Datos persistidos')}>success</button>
      <button onClick={() => toast.error('Falla', 'No se pudo guardar')}>error</button>
    </div>
  );
}

describe('Toast system', () => {
  it('renders a polite live region for screen readers', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    const region = document.querySelector('.toast-region');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-live', 'polite');
  });

  it('shows a success toast and dismisses it via the close button', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: 'success' }));

    expect(await screen.findByText('Guardado')).toBeInTheDocument();
    expect(screen.getByText('Datos persistidos')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cerrar notificación/i }));
    expect(screen.queryByText('Guardado')).not.toBeInTheDocument();
  });

  it('throws when useToast is used outside the provider', () => {
    const original = console.error;
    console.error = () => {};
    try {
      expect(() => render(<ToastTrigger />)).toThrow(/useToast must be used inside/i);
    } finally {
      console.error = original;
    }
  });

  it('auto-dismisses after the configured duration', () => {
    vi.useFakeTimers();
    function Trigger() {
      const toast = useToast();
      return (
        <button onClick={() => toast.push({ tone: 'info', title: 'Hola', durationMs: 1000 })}>
          go
        </button>
      );
    }

    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>
    );

    act(() => {
      screen.getByRole('button', { name: 'go' }).click();
    });
    expect(screen.getByText('Hola')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.queryByText('Hola')).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
