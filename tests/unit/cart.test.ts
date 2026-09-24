import { describe, expect, it } from 'vitest';
import { addLine, cartItemCount, clearCart, lineTotalCents, removeLine, setQuantity } from '@/lib/cart';

describe('cart reducer', () => {
  it('adds a new line', () => {
    const next = addLine(clearCart(), { productId: 'p1', unitPriceCents: 1000, quantity: 2 });
    expect(next.lines).toHaveLength(1);
    expect(next.lines[0]!.quantity).toBe(2);
  });

  it('increments quantity when adding existing line', () => {
    let s = clearCart();
    s = addLine(s, { productId: 'p1', unitPriceCents: 1000, quantity: 1 });
    s = addLine(s, { productId: 'p1', unitPriceCents: 1000, quantity: 2 });
    expect(s.lines).toHaveLength(1);
    expect(s.lines[0]!.quantity).toBe(3);
  });

  it('sets quantity and removes line when zero', () => {
    let s = clearCart();
    s = addLine(s, { productId: 'p1', unitPriceCents: 100, quantity: 1 });
    s = setQuantity(s, 'p1', 0);
    expect(s.lines).toHaveLength(0);
    s = addLine(s, { productId: 'p2', unitPriceCents: 100, quantity: 1 });
    s = setQuantity(s, 'p2', 5);
    expect(s.lines[0]!.quantity).toBe(5);
  });

  it('removes a line', () => {
    let s = clearCart();
    s = addLine(s, { productId: 'p1', unitPriceCents: 100, quantity: 1 });
    s = addLine(s, { productId: 'p2', unitPriceCents: 200, quantity: 1 });
    s = removeLine(s, 'p1');
    expect(s.lines).toHaveLength(1);
    expect(s.lines[0]!.productId).toBe('p2');
  });

  it('counts total items', () => {
    let s = clearCart();
    s = addLine(s, { productId: 'p1', unitPriceCents: 100, quantity: 3 });
    s = addLine(s, { productId: 'p2', unitPriceCents: 100, quantity: 2 });
    expect(cartItemCount(s)).toBe(5);
  });

  it('computes line total', () => {
    expect(lineTotalCents({ productId: 'p1', unitPriceCents: 250, quantity: 4 })).toBe(1000);
  });
});