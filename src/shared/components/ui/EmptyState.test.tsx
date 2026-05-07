import { render, screen } from '@testing-library/react';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the title', () => {
    render(<EmptyState title="Sin datos" />);
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
  });

  it('renders description and action when provided', () => {
    render(
      <EmptyState
        title="x"
        description="Agrega un producto"
        action={<button>Agregar</button>}
      />
    );
    expect(screen.getByText('Agrega un producto')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Agregar' })).toBeInTheDocument();
  });

  it('uses the default Inbox icon when none is provided', () => {
    const { container } = render(<EmptyState title="x" />);
    expect(container.querySelector('.empty-state__icon')).toBeInTheDocument();
  });
});
