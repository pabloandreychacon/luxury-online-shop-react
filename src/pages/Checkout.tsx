import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { defaultSettings, getSettings } from '../data/settings';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';

interface ShippingMethod {
  Id: number;
  Description: string;
  Price: number;
  DeliveryDays: number;
  Active: boolean;
}

export default function Checkout() {
  const { t } = useTranslation();
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
  const [paypalClientId, setPaypalClientId] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState(0);

  useEffect(() => {
    if (items.length === 0 && !showSuccessModal) {
      navigate('/cart');
    }
  }, [items, showSuccessModal, navigate]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const settings = await getSettings();
    setPaypalClientId(settings.paypalClientId || '');
    setBusinessEmail(settings.email);
    setBusinessName(settings.businessName);
    setBusinessPhone(settings.phone);

    const { data } = await supabase
      .from('ShippingMethods')
      .select('*')
      .eq('IdBusiness', defaultSettings.id)
      .eq('Active', true);
    
    if (data && data.length > 0) {
      setShippingMethods(data);
      setSelectedShipping(data[0]);
    }
  };

  const saveOrder = async (paypalOrderId: string, buyerEmail: string, shippingAddress: string) => {
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + (selectedShipping?.DeliveryDays || 0));

    const { data: orderData, error: orderError } = await supabase
      .from('Orders')
      .insert([{
        UserId: null,
        TotalAmount: grandTotal,
        StatusId: 1,
        PaymentOrderId: paypalOrderId,
        ShippingAddress: shippingAddress,
        ShippingMethod: selectedShipping?.Description,
        EstimatedDeliveryDate: estimatedDelivery.toISOString(),
        BuyerEmail: buyerEmail,
        BusinessEmail: businessEmail,
        IdBusiness: defaultSettings.id,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      }])
      .select();

    if (orderError || !orderData) return null;

    const orderId = orderData[0].Id;

    for (const item of items) {
      await supabase.from('OrderItems').insert([{
        PaypalOrderId: paypalOrderId,
        ProductId: parseInt(item.id),
        ProductName: item.name,
        Quantity: item.quantity,
        Price: item.price,
        ItemTotal: item.price * item.quantity,
        OrderId: orderId
      }]);
    }

    return orderId;
  };

  const sendOrderEmail = async (orderNumber: number, buyerName: string, buyerEmail: string, shippingAddress: string) => {
    const itemsList = items.map(item =>
      `${item.name} - Qty: ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
    ).join('\n');

    const orderSummary = `Order Number: ${orderNumber}\n\nShipping Method: ${selectedShipping?.Description}\nShipping Address: ${shippingAddress}\n\nItems:\n${itemsList}\n\nSubtotal: $${total.toFixed(2)}${taxAmount > 0 ? `\nTax: $${taxAmount.toFixed(2)}` : ''}\nShipping: $${shippingCost.toFixed(2)}\nTotal: $${grandTotal.toFixed(2)}`;

    const signature = `\n\n---\n${businessName}\n${businessEmail}\n${businessPhone}`;

    const sendEmail = (toEmail: string, subject: string, message: string) =>
      fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: 'service_s481rtv',
          template_id: 'template_771ecr6',
          user_id: 'L7o6hZUmFJQ_Jbqu0',
          template_params: { to_email: toEmail, from_email: buyerEmail, subject, message, name: buyerName },
        }),
      });

    await Promise.all([
      sendEmail(businessEmail, `New Order #${orderNumber}`, `Customer: ${buyerName}\nEmail: ${buyerEmail}\n\n${orderSummary}${signature}`),
      sendEmail(buyerEmail, `Your Order #${orderNumber} Confirmation`, `Hi ${buyerName},\n\nThank you for your purchase! Here are your order details:\n\n${orderSummary}\n\nWe will notify you once your order ships.${signature}`),
    ]);
  };

  const taxAmount = items.reduce((sum, item) => {
    const itemTax = (item.taxes && item.taxes > 0) ? (item.price * item.quantity * item.taxes / 100) : 0;
    return sum + itemTax;
  }, 0);

  const shippingCost = selectedShipping?.Price || 0;
  const grandTotal = total + taxAmount + shippingCost;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-8 pb-20">
      <div className="container-luxury max-w-6xl">
        <h1 className="font-luxury text-4xl mb-12">{t('cart.checkout')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Cart Items */}
            <div className="card-luxury p-6 rounded-lg">
              <h2 className="font-luxury text-2xl mb-6">{t('checkout.yourItems')}</h2>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                        className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded text-center"
                      />
                      <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Methods */}
            <div className="card-luxury p-6 rounded-lg">
              <h2 className="font-luxury text-2xl mb-6">{t('checkout.shippingMethod')}</h2>
              <div className="space-y-3">
                {shippingMethods.map(method => (
                  <label
                    key={method.Id}
                    className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition ${
                      selectedShipping?.Id === method.Id
                        ? 'border-luxury-gold bg-luxury-gold bg-opacity-10'
                        : 'border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        checked={selectedShipping?.Id === method.Id}
                        onChange={() => setSelectedShipping(method)}
                        className="w-4 h-4"
                      />
                      <div>
                        <span className="font-medium">{method.Description}</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{method.DeliveryDays} {t('checkout.days')}</p>
                      </div>
                    </div>
                    <span className="font-semibold">${method.Price.toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card-luxury p-6 rounded-lg sticky top-24">
              <h2 className="font-luxury text-2xl mb-6">{t('checkout.orderSummary')}</h2>

              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex justify-between text-sm">
                  <span>{t('cart.subtotal')}</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('cart.tax')}</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>{t('cart.shipping')}</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between mb-6">
                <span className="font-luxury text-lg">{t('cart.total')}</span>
                <span className="font-luxury text-2xl text-luxury-gold">${grandTotal.toFixed(2)}</span>
              </div>

              {paypalClientId && (
                <PayPalScriptProvider options={{ clientId: paypalClientId, currency: 'USD' }}>
                  <PayPalButtons
                    style={{ layout: 'vertical' }}
                    createOrder={(_data, actions) => {
                      return actions.order.create({
                        intent: 'CAPTURE',
                        purchase_units: [{
                          amount: {
                            currency_code: 'USD',
                            value: grandTotal.toFixed(2),
                          },
                        }],
                      });
                    }}
                    onApprove={async (data, actions) => {
                      const details = await actions.order?.capture();
                      const buyerName = `${details?.payer?.name?.given_name} ${details?.payer?.name?.surname}`;
                      const buyerEmail = details?.payer?.email_address || '';
                      const shippingAddress = details?.purchase_units?.[0]?.shipping?.address ?
                        `${details.purchase_units[0].shipping.address.address_line_1}, ${details.purchase_units[0].shipping.address.admin_area_2}, ${details.purchase_units[0].shipping.address.admin_area_1} ${details.purchase_units[0].shipping.address.postal_code}` :
                        'N/A';

                      const orderId = await saveOrder(data.orderID, buyerEmail, shippingAddress);

                      if (orderId) {
                        await sendOrderEmail(orderId, buyerName, buyerEmail, shippingAddress);
                        setOrderNumber(orderId);
                        setShowSuccessModal(true);
                        localStorage.removeItem('cart');
                        clearCart();
                      }
                    }}
                  />
                </PayPalScriptProvider>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-md mx-4">
            <div className="text-center">
              <div className="text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-luxury text-gray-900 dark:text-white mb-4">
                {t('checkout.orderCompleted')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t('checkout.orderPlaced').replace('{orderNumber}', String(orderNumber))}
              </p>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/');
                }}
                className="btn-primary w-full"
              >
                {t('cart.continueShopping')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
