/**
 * Component tests. Use Testing Library + happy-dom.
 */

import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../helpers/render';
import { ProductGrid } from '@/components/catalog/product-grid';

describe('ProductGrid', () => {
  it('renders the empty state when no items', () => {
    const { container } = renderWithProviders(<ProductGrid items={[]} />);
    expect(container.textContent).toContain('No products found');
  });

  it('renders a card per item', () => {
    const items = [
      {
        id: '1',
        slug: 'a',
        name: 'Red Tee',
        shortDescription: null,
        priceCents: 1000,
        compareAtCents: null,
        currency: 'USD',
        stock: 5,
        averageRating: 4.2,
        reviewCount: 3,
        image: null,
        categorySlug: null,
        categoryName: null,
      },
    ];
    const { container } = renderWithProviders(<ProductGrid items={items} />);
    expect(container.textContent).toContain('Red Tee');
    expect(container.textContent).toContain('$10.00');
  });
});