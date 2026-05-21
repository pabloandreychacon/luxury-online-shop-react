import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { logger } from 'luna-components-library';

export default function Cart() {
  const { t } = useTranslation();
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();

  const taxAmount = items.reduce((sum, item) => {
    if (import.meta.env.DEV) {
      logger.info('Cart item:', item.name, 'taxes:', item.taxes);
    }
    const itemTax = (item.taxes && item.taxes > 0) ? (item.price * item.quantity * item.taxes / 100) : 0;
    return sum + itemTax;
  }, 0);

  const grandTotal = total + taxAmount;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-8 pb-20">
      <div className="container-luxury">
        <h1 className="font-luxury text-4xl mb-12">{t('cart.title')}</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">{t('cart.empty')}</p>
            <Link to="/shop" className="btn-primary inline-block">
              {t('cart.continueShopping')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {items.map(item => (
                  <div key={item.id} className="card-luxury p-4 rounded-lg">
                    <div className="flex gap-4">
                      {item.image?.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video src={item.image} className="w-20 h-20 object-cover rounded flex-shrink-0" autoPlay muted loop playsInline />
                      ) : (
                        <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-luxury text-base leading-tight">{item.name}</h3>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-red-500 hover:text-red-700 transition flex-shrink-0"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.material}</p>
                        <p className="font-luxury text-luxury-gold mt-1">${item.price.toFixed(2)}</p>
                        <div className="flex items-center justify-between mt-2">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                            className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded text-center text-sm"
                          />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="card-luxury p-8 rounded-lg sticky top-24">
                <h2 className="font-luxury text-2xl mb-6">{t('cart.title')}</h2>

                <div className="space-y-4 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                  <div className="flex justify-between text-sm">
                    <span>{t('cart.subtotal')}</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t('cart.tax')}</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between mb-8">
                  <span className="font-luxury text-lg">{t('cart.total')}</span>
                  <span className="font-luxury text-2xl text-luxury-gold">${grandTotal.toFixed(2)}</span>
                </div>

                <Link to="/checkout" className="btn-primary w-full mb-4 block text-center">
                  {t('cart.checkout')}
                </Link>

                <Link
                  to="/shop"
                  className="block text-center text-sm text-luxury-gold hover:text-opacity-80 transition py-2"
                >
                  {t('cart.continueShopping')}
                </Link>

                {items.length > 0 && (
                  <button
                    onClick={() => clearCart()}
                    className="block text-center w-full text-sm text-red-500 hover:text-red-700 transition mt-4"
                  >
                    {t('cart.clearCart')}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
