'use client';

import { CartProvider } from '@/components/contexts/CartContext';

export default function BuyerDashboardLayout({ children }) {
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
}
