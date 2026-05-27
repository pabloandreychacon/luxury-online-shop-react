import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle } from 'lucide-react';
import { logger } from 'luna-components-library';
import { supabase } from '../lib/supabase';
import { defaultSettings, getSettings } from '../data/settings';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';

interface ShippingMethod {
  Id: number;
  Description: string;
  Price: number;
  DeliveryDays: number;
  Active: boolean;
  MaxWeightAllowed: number;
}

export default function Checkout() {
  const { t } = useTranslation();
  const { items, removeItem, updateQuantity, total, clearCart } = useCart();
  const navigate = useNavigate();
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingMethod | null>(null);
  const [shippingError, setShippingError] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState(0);

  const [orderCompleted, setOrderCompleted] = useState(false);
  const [priceLists, setPriceLists] = useState<{ Id: number; Label: string }[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [reportingProduct, setReportingProduct] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');

  const handleReport = async (productId: string) => {
    if (!reportReason.trim()) return;
    const { error } = await supabase.from('product_reports').insert({
      product_id: parseInt(productId),
      reason: reportReason.trim(),
    });
    if (error) {
      console.error('Error reporting product:', error);
      return;
    }
    const { count } = await supabase
      .from('product_reports')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', parseInt(productId));
    if (count && count > 3) {
      await supabase.from('Products').update({ Active: false }).eq('Id', parseInt(productId));
    }
    setReportingProduct(null);
    setReportReason('');
  };

  useEffect(() => {
    if (items.length === 0 && !showSuccessModal && !orderCompleted) {
      navigate('/cart');
    }
  }, [items, showSuccessModal, navigate]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const loadData = async () => {
    const settings = await getSettings();
    setPaypalClientId(settings.paypalClientId || '');
    setBusinessEmail(settings.email);
    setBusinessName(settings.businessName);
    setBusinessPhone(settings.phone);
    setBusinessAddress(settings.address);

    const [{ data: shippingData }, { data: priceListData }] = await Promise.all([
      supabase.from('ShippingMethods').select('*').eq('IdBusiness', defaultSettings.id).eq('Active', true),
      supabase.from('PriceLists').select('Id, Label').eq('Active', true).eq('IdBusiness', defaultSettings.id),
    ]);

    if (shippingData && shippingData.length > 0) {
      setShippingMethods(shippingData);
    }
    setPriceLists(priceListData || []);
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
        Notes: orderNotes || null,
        IdBusiness: defaultSettings.id,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      }])
      .select();

    if (orderError || !orderData) return null;

    const orderId = orderData[0].Id;

    // fetch default names from Products table as fallback
    const productIds = items.map(item => parseInt(item.id));
    const { data: productsData } = await supabase.from('Products').select('Id, Name').in('Id', productIds);
    const productNameMap: Record<number, string> = {};
    (productsData || []).forEach((p: any) => { productNameMap[p.Id] = p.Name; });

    for (const item of items) {
      await supabase.from('OrderItems').insert([{
        PaypalOrderId: paypalOrderId,
        ProductId: parseInt(item.id),
        ProductName: item.name || productNameMap[parseInt(item.id)] || '',
        Quantity: item.quantity,
        Price: item.price,
        ItemTotal: item.price * item.quantity,
        OrderId: orderId,
        PriceListId: item.priceListId || null
      }]);
    }

    return { orderId, productNameMap };
  };

  const sendOrderEmail = async (orderNumber: number, buyerName: string, buyerEmail: string, shippingAddress: string, productNameMap: Record<number, string>) => {
    const itemsList = items.map(item => {
      const priceListLabel = item.priceListId ? priceLists.find(pl => pl.Id === item.priceListId)?.Label : null;
      const name = productNameMap[parseInt(item.id)] || item.name;
      return `${name}${priceListLabel ? ` [${priceListLabel}]` : ''} - Qty: ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`;
    }).join('\n');

    const orderSummary = `Order Number: ${orderNumber}\n\nShipping Method: ${selectedShipping?.Description}\nShipping Address: ${shippingAddress}${orderNotes ? `\nNotes: ${orderNotes}` : ''}\n\nItems:\n${itemsList}\n\nSubtotal: $${total.toFixed(2)}${taxAmount > 0 ? `\nTax: $${taxAmount.toFixed(2)}` : ''}\nShipping: $${shippingCost.toFixed(2)}\nTotal: $${grandTotal.toFixed(2)}`;

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

  const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0) * item.quantity, 0);
  logger.info('Weight check:', { totalWeight, items: items.map(i => ({ id: i.id, weight: i.weight, qty: i.quantity })), selectedShipping: selectedShipping ? { Id: selectedShipping.Id, MaxWeightAllowed: selectedShipping.MaxWeightAllowed } : null });

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
                  <div key={`${item.id}-${item.priceListId || 0}`} className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    {item.image?.match(/\.(mp4|webm|ogg)$/i) ? (
                      <video src={item.image} className="w-16 h-16 object-cover rounded flex-shrink-0" autoPlay muted loop playsInline />
                    ) : (
                      <img src={item.image} alt={item.name} referrerPolicy="no-referrer" className="w-16 h-16 object-cover rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-sm truncate">{item.name}</h3>
                        <button
                          onClick={() => { setReportingProduct(item.id); setReportReason(''); }}
                          className="text-xs text-red-400 hover:text-red-600 flex-shrink-0 flex items-center gap-1"
                        >
                          <AlertTriangle size={12} />
                          Report
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">${item.price.toFixed(2)}{item.weight ? ` · ${(item.weight * item.quantity).toFixed(2)} kg` : ''}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <input
                          type="number"
                          min="1"
                          max={item.maxSellAllowed || 10}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(item.id, Math.min(item.maxSellAllowed || 10, Math.max(1, parseInt(e.target.value) || 1)), item.priceListId)}
                          className="w-14 px-2 py-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded text-center text-sm"
                        />
                        <button onClick={() => removeItem(item.id, item.priceListId)} className="text-red-500 hover:text-red-700 flex-shrink-0">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Notes */}
            <div className="card-luxury p-6 rounded-lg">
              <h2 className="font-luxury text-2xl mb-4">{t('orders.notes')}</h2>
              <textarea
                id="order-notes"
                name="orderNotes"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder={t('checkout.notesPlaceholder')}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:border-luxury-gold resize-none text-sm"
              />
            </div>

            {/* Shipping Methods */}
            <div className="card-luxury p-6 rounded-lg">
              <h2 className="font-luxury text-2xl mb-6">{t('checkout.shippingLabel')}</h2>
              <select
                id="shipping-method"
                name="shipping-method"
                value={selectedShipping?.Id || ''}
                onChange={(e) => {
                  const id = parseInt(e.target.value);
                  const method = shippingMethods.find(m => m.Id === id) || null;
                  setSelectedShipping(method);
                  if (!method && acceptedTerms) setShippingError(true);
                  else setShippingError(false);
                  if (method && method.MaxWeightAllowed > 0 && totalWeight > method.MaxWeightAllowed) {
                    logger.info('Weight exceeded:', { totalWeight, MaxWeightAllowed: method.MaxWeightAllowed, methodId: method.Id });
                  }
                }}
                className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:border-luxury-gold bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${shippingError ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
              >
                <option value="">-- Select Shipping Method --</option>
                {shippingMethods.map(method => (
                  <option key={method.Id} value={method.Id}>
                    {method.Description} - {method.DeliveryDays} {t('checkout.days')} - ${method.Price.toFixed(2)}{method.MaxWeightAllowed ? ` (max ${method.MaxWeightAllowed} kg)` : ''}
                  </option>
                ))}
              </select>
              {shippingError && (
                <p className="text-red-500 text-xs mt-2">Please select a shipping method.</p>
              )}
              {selectedShipping && selectedShipping.MaxWeightAllowed > 0 && totalWeight > selectedShipping.MaxWeightAllowed && (
                <p className="text-red-500 text-xs mt-2">
                  The total weight of your items ({totalWeight.toFixed(2)}) exceeds the max weight allowed ({selectedShipping.MaxWeightAllowed}) for this shipping method.
                </p>
              )}
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

              <label className="flex items-start gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => { setAcceptedTerms(e.target.checked); if (e.target.checked && (!selectedShipping || (selectedShipping.MaxWeightAllowed > 0 && totalWeight > selectedShipping.MaxWeightAllowed))) setShippingError(true); }}
                  className="mt-1 w-4 h-4 flex-shrink-0"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t('checkout.disclaimer')}
                </span>
              </label>
              <div className="text-xs text-gray-400 dark:text-gray-500 mb-4 text-center leading-relaxed">
                {businessEmail} &mdash; {businessPhone}<br />
                {businessAddress}
              </div>

              {shippingError && (
                <p className="text-red-500 text-xs mb-4 text-center">Please select a shipping method before paying.</p>
              )}
              {paypalClientId && acceptedTerms && selectedShipping && (!selectedShipping.MaxWeightAllowed || selectedShipping.MaxWeightAllowed <= 0 || totalWeight <= selectedShipping.MaxWeightAllowed) && (
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
                      setProcessingPayment(true);
                      try {
                        const details = await actions.order?.capture();
                        const buyerName = `${details?.payer?.name?.given_name} ${details?.payer?.name?.surname}`;
                        const buyerEmail = details?.payer?.email_address || '';
                        const shippingAddress = details?.purchase_units?.[0]?.shipping?.address ?
                          `${details.purchase_units[0].shipping.address.address_line_1}, ${details.purchase_units[0].shipping.address.admin_area_2}, ${details.purchase_units[0].shipping.address.admin_area_1} ${details.purchase_units[0].shipping.address.postal_code}` :
                          'N/A';

                        const result = await saveOrder(data.orderID, buyerEmail, shippingAddress);
                        const orderId = result?.orderId;
                        const productNameMap = result?.productNameMap || {};

                        if (orderId) {
                          await sendOrderEmail(orderId, buyerName, buyerEmail, shippingAddress, productNameMap);
                          setOrderNumber(orderId);
                          setOrderCompleted(true);
                          setShowSuccessModal(true);
                          localStorage.removeItem('cart');
                          clearCart();
                        }
                      } finally {
                        setProcessingPayment(false);
                      }
                    }}
                    onCancel={() => setProcessingPayment(false)}
                    onError={() => setProcessingPayment(false)}
                  />
                </PayPalScriptProvider>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Processing Overlay */}
      {processingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" style={{ cursor: 'wait' }}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-sm mx-4 text-center">
            <div className="w-12 h-12 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-900 dark:text-white font-semibold">Processing payment...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait, do not close this page.</p>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Report Product</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setReportingProduct(null)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReport(reportingProduct)}
                disabled={!reportReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

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
                  navigate('/shop');
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
