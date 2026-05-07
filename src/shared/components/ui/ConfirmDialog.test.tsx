import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders nothing when open=false', () => {
    const { container } = render(
      <ConfirmDialog
        open={false}
        title="Confirmar"
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders title and description, focuses confirm button', async () => {
    render(
      <ConfirmDialog
        open
        title="Anular movimiento"
        description="¿Estás seguro?"
        confirmLabel="Anular"
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />
    );

    const dialog = await screen.findByRole('dialog', { name: /anular movimiento/i });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText(/estás seguro/i)).toBeInTheDocument();

    const confirm = screen.getByRole('button', { name: 'Anular' });
    expect(document.activeElement).toBe(confirm);
  });

  it('calls onCancel when Escape is pressed', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open
        title="x"
        onConfirm={() => undefined}
        onCancel={onCancel}
      />
    );
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalled();
  });

  it('does not close on Escape while pending', async () => {
    const onCancel = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        open
        title="x"
        isPending
        onConfirm={() => undefined}
        onCancel={onCancel}
      />
    );
    await user.keyboard('{Escape}');
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('shows the danger tone styling when tone="danger"', () => {
    const { container } = render(
      <ConfirmDialog
        open
        title="Borrar"
        tone="danger"
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />
    );
    expect(container.querySelector('.dialog--danger')).toBeInTheDocument();
  });
});
