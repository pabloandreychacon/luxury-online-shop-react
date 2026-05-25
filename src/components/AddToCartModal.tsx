import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Check, ShoppingBag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AddToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
}

export default function AddToCartModal({ isOpen, onClose, productName }: AddToCartModalProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full animate-slide-down">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X size={20} />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Check className="text-green-600 dark:text-green-400" size={24} />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-luxury text-gray-900 dark:text-white mb-1">
              {t('cart.addedToCartTitle')}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {productName.length > 50 ? productName.substring(0, 50) + '…' : productName}
            </p>
            
            <Link
              to="/cart"
              onClick={onClose}
              className="inline-flex items-center gap-2 bg-luxury-gold text-luxury-dark px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition"
            >
              <ShoppingBag size={18} />
              {t('cart.viewCart')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
