import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CountCartButton() {
  const [isVisible, setIsVisible] = useState(false);
  const { pathname } = useLocation();
  const { itemCount } = useCart();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return isVisible && itemCount > 0 ? (
    <button
      onClick={() => { window.location.href = '/cart'; }}
      className="fixed top-1/2 -translate-y-1/2 right-8 p-3 bg-luxury-gold text-luxury-dark rounded-full shadow-lg hover:bg-opacity-90 transition-all duration-300 z-50"
      aria-label="Go to Cart"
    >
      <ShoppingBag size={24} />
      <span className="absolute -top-1 -right-1 bg-luxury-gold text-luxury-dark text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
        {itemCount}
      </span>
    </button>
  ) : null;
}
