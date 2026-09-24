/**
 * Pure cart reducer. Used by client UI (zustand) and services for total
 * recomputation. No I/O; deterministic.
 */

import { applyFixedDiscount, applyPercentageDiscount, computeSubtotal, computeTotal, timesCents } from './money';

export interface CartLine {
  productId: string;
  variantId?: string;
  unitPriceCents: number;
  quantity: number;
}

export interface CouponLike {
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
}

export interface CartTotals {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  discountCents: number;
  totalCents: number;
}

export interface CartState {
  lines: CartLine[];
  coupon?: CouponLike | null;
  shippingCents: number;
  taxCents: number;
}

export function addLine(state: CartState, line: CartLine): CartState {
  const existing = state.lines.findIndex((l) => l.productId === line.productId && l.variantId === line.variantId);
  const lines = [...state.lines];
  if (existing >= 0) {
    lines[existing] = { ...lines[existing]!, quantity: lines[existing]!.quantity + line.quantity };
  } else {
    lines.push(line);
  }
  return { ...state, lines };
}

export function setQuantity(state: CartState, productId: string, quantity: number, variantId?: string): CartState {
  if (quantity <= 0) {
    return { ...state, lines: state.lines.filter((l) => !(l.productId === productId && l.variantId === variantId)) };
  }
  return {
    ...state,
    lines: state.lines.map((l) =>
      l.productId === productId && l.variantId === variantId ? { ...l, quantity } : l,
    ),
  };
}

export function removeLine(state: CartState, productId: string, variantId?: string): CartState {
  return {
    ...state,
    lines: state.lines.filter((l) => !(l.productId === productId && l.variantId === variantId)),
  };
}

export function clearCart(): CartState {
  return { lines: [], shippingCents: 0, taxCents: 0 };
}

export function applyCoupon(state: CartState, coupon: CouponLike): CartState {
  return { ...state, coupon };
}

export function removeCoupon(state: CartState): CartState {
  return { ...state, coupon: null };
}

export function computeCartTotals(state: CartState): CartTotals {
  const subtotalCents = computeSubtotal(state.lines);
  let discountCents = 0;
  let shippingCents = state.shippingCents;
  if (state.coupon) {
    if (state.coupon.type === 'PERCENTAGE') {
      discountCents = applyPercentageDiscount(subtotalCents, state.coupon.value);
    } else if (state.coupon.type === 'FIXED_AMOUNT') {
      discountCents = applyFixedDiscount(subtotalCents, state.coupon.value);
    } else if (state.coupon.type === 'FREE_SHIPPING') {
      shippingCents = 0;
    }
  }
  const totalCents = computeTotal({
    subtotalCents,
    shippingCents,
    taxCents: state.taxCents,
    discountCents,
  });
  return { subtotalCents, shippingCents, taxCents: state.taxCents, discountCents, totalCents };
}

export function cartItemCount(state: CartState): number {
  return state.lines.reduce((acc, l) => acc + l.quantity, 0);
}

export function lineTotalCents(line: CartLine): number {
  return timesCents(line.unitPriceCents, line.quantity);
}