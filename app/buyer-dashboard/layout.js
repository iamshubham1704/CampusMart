import { WishlistProvider } from '../../components/contexts/WishlistContext';
import { CartProvider } from '../../components/contexts/CartContext'; // Assuming you have this

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* Wrap everything with your providers */}
        <WishlistProvider>
          <CartProvider>
             {children}
          </CartProvider>
        </WishlistProvider>
      </body>
    </html>
  );
}