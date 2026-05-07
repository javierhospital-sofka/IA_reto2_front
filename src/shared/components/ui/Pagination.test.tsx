import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination, paginate } from './Pagination';

describe('paginate', () => {
  it('returns the slice for the given page', () => {
    expect(paginate([1, 2, 3, 4, 5], 1, 2)).toEqual([1, 2]);
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
    expect(paginate([1, 2, 3, 4, 5], 3, 2)).toEqual([5]);
  });

  it('clamps negative pages to the first slice', () => {
    expect(paginate([1, 2, 3], -1, 2)).toEqual([1, 2]);
  });
});

describe('Pagination component', () => {
  it('renders nothing when total fits in one page', () => {
    const { container } = render(
      <Pagination page={1} pageSize={10} total={5} onPageChange={() => undefined} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('emits the next/previous page when buttons are clicked', async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Pagination page={2} pageSize={5} total={20} onPageChange={onPageChange} />
    );

    await user.click(screen.getByRole('button', { name: /siguiente/i }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);

    await user.click(screen.getByRole('button', { name: /anterior/i }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  it('disables previous on the first page and next on the last', () => {
    render(
      <Pagination page={1} pageSize={5} total={20} onPageChange={() => undefined} />
    );
    expect(screen.getByRole('button', { name: /anterior/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /siguiente/i })).not.toBeDisabled();
  });
});
