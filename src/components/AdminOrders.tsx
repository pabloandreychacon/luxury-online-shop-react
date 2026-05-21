import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { defaultSettings, getSettings } from '../data/settings';

interface Order {
  Id: number;
  UserId: number;
  TotalAmount: number;
  StatusId: number;
  PaymentOrderId: string;
  ShippingAddress: string;
  ShippingMethod: string;
  TrackingNumber: string;
  EstimatedDeliveryDate: string;
  Notes: string;
  CreatedAt: string;
  BuyerEmail: string;
  BusinessEmail: string;
}

interface OrderItem {
  Id: number;
  ProductId: number;
  ProductName: string;
  Quantity: number;
  Price: number;
  ItemTotal: number;
}

interface PendingUpdate {
  id: number;
  field: string;
  value: any;
}

export default function AdminOrders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [orderItems, setOrderItems] = useState<{ [orderId: number]: OrderItem[] }>({});
  const [emailFilter, setEmailFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [emailSent, setEmailSent] = useState<number | null>(null);
  const [pendingUpdate, setPendingUpdate] = useState<PendingUpdate | null>(null);

  const ORDER_STATUSES = [
    { id: 1, label: t('admin.orderStatusPaid') },
    { id: 2, label: t('admin.orderStatusShipped') },
    { id: 4, label: t('admin.orderStatusCancelled') }
  ];

  const EMAIL_TRIGGER_FIELDS = ['StatusId', 'TrackingNumber', 'Notes'];

  useEffect(() => { loadOrders(); }, []);

  useEffect(() => {
    let filtered = orders;
    if (emailFilter) filtered = filtered.filter(o => o.BuyerEmail.toLowerCase().includes(emailFilter.toLowerCase()));
    if (dateFilter) filtered = filtered.filter(o => {
      const d = new Date(o.CreatedAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` === dateFilter;
    });
    setFilteredOrders(filtered);
  }, [orders, emailFilter, dateFilter]);

  const loadOrders = async () => {
    const { data } = await supabase.from('Orders').select('*').eq('IdBusiness', defaultSettings.id).order('CreatedAt', { ascending: false });
    setOrders(data || []);
    setFilteredOrders(data || []);
  };

  const applyUpdate = async (update: PendingUpdate) => {
    const { id, field, value } = update;
    await supabase.from('Orders').update({ [field]: value }).eq('Id', id);
    setOrders(prev => prev.map(o => o.Id === id ? { ...o, [field]: value } : o));
  };

  const sendShippingEmail = async (orderId: number, updatedField: string, updatedValue: any) => {
    const order = orders.find(o => o.Id === orderId);
    if (!order) return;

    const mergedOrder = { ...order, [updatedField]: updatedValue };
    if (!mergedOrder.BuyerEmail || !mergedOrder.TrackingNumber) return;

    const { data: items } = await supabase.from('OrderItems').select('*').eq('OrderId', orderId);
    const settings = await getSettings();

    const itemsList = (items || []).map((item: any) =>
      `${item.ProductName} - Qty: ${item.Quantity} x $${item.Price.toFixed(2)} = $${item.ItemTotal.toFixed(2)}`
    ).join('\n');

    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: 'service_s481rtv',
        template_id: 'template_771ecr6',
        user_id: 'L7o6hZUmFJQ_Jbqu0',
        template_params: {
          to_email: mergedOrder.BuyerEmail,
          from_email: settings.email,
          subject: `Your Order #${orderId} Has Shipped!`,
          message: `Great news! Your order #${orderId} has been shipped.\n\nTracking Number: ${mergedOrder.TrackingNumber}\nShipping Method: ${mergedOrder.ShippingMethod || 'N/A'}\nShipping Address: ${mergedOrder.ShippingAddress || 'N/A'}\nEstimated Delivery: ${mergedOrder.EstimatedDeliveryDate ? new Date(mergedOrder.EstimatedDeliveryDate).toLocaleDateString() : 'N/A'}\n\nOrder Items:\n${itemsList}\n\nTotal: $${mergedOrder.TotalAmount.toFixed(2)}${mergedOrder.Notes ? `\nNotes: ${mergedOrder.Notes}` : ''}\n\nThank you for your purchase!\n\n---\n${settings.businessName}\n${settings.email}\n${settings.phone}`,
          name: mergedOrder.BuyerEmail,
        },
      }),
    });

    setEmailSent(orderId);
    setTimeout(() => setEmailSent(null), 4000);
  };

  const handleUpdateOrder = async (id: number, field: string, value: any) => {
    const order = orders.find(o => o.Id === id);
    const isShipped = field === 'StatusId' ? value === 2 : order?.StatusId === 2;
    const trackingNumber = field === 'TrackingNumber' ? value : order?.TrackingNumber;
    const shouldPrompt = EMAIL_TRIGGER_FIELDS.includes(field) && isShipped && !!trackingNumber;
    if (shouldPrompt) {
      setPendingUpdate({ id, field, value });
    } else {
      await applyUpdate({ id, field, value });
    }
  };

  const handleModalConfirm = async (sendEmail: boolean) => {
    if (!pendingUpdate) return;
    await applyUpdate(pendingUpdate);
    if (sendEmail) await sendShippingEmail(pendingUpdate.id, pendingUpdate.field, pendingUpdate.value);
    setPendingUpdate(null);
  };

  const toggleOrderItems = async (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
      if (!orderItems[orderId]) {
        const { data } = await supabase.from('OrderItems').select('*').eq('OrderId', orderId);
        setOrderItems(prev => ({ ...prev, [orderId]: data || [] }));
      }
    }
    setExpandedOrders(newExpanded);
  };

  return (
    <div className="space-y-6">

      {/* Confirmation Modal */}
      {pendingUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('admin.sendEmailTitle')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {t('admin.sendEmailDesc').replace('{{email}}', orders.find(o => o.Id === pendingUpdate.id)?.BuyerEmail || '')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => handleModalConfirm(false)} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                {t('admin.saveOnly')}
              </button>
              <button onClick={() => handleModalConfirm(true)} className="flex-1 px-4 py-2 bg-luxury-gold text-luxury-dark rounded-lg text-sm font-semibold hover:bg-opacity-90 transition">
                {t('admin.saveAndSend')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin.filters')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.filterByEmail')}</label>
            <input type="text" placeholder={t('admin.emailPlaceholder')} value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.filterByDate')}</label>
            <input type="month" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold" />
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          {t('orders.showing')} {filteredOrders.length} {t('orders.of')} {orders.length} {t('orders.orders')}
        </div>
      </div>

      {filteredOrders.map((order) => (
        <div key={order.Id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            <div className="flex flex-col gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('orders.order')} #{order.Id}</h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(order.CreatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => toggleOrderItems(order.Id)} className="text-sm text-luxury-gold hover:text-opacity-80 font-medium">
                  {expandedOrders.has(order.Id) ? t('orders.hideItems') : t('orders.showItems')}
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{order.BuyerEmail} • ${order.TotalAmount}</p>
              {emailSent === order.Id && (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">✓ {t('admin.emailSentTo')} {order.BuyerEmail}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.orderStatus')}</label>
                <select
                  value={order.StatusId}
                  onChange={(e) => handleUpdateOrder(order.Id, 'StatusId', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status.id} value={status.id}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.trackingNumber')}</label>
                <input
                  key={`tracking-${order.Id}`}
                  type="text"
                  defaultValue={order.TrackingNumber || ''}
                  onBlur={(e) => handleUpdateOrder(order.Id, 'TrackingNumber', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.estimatedDelivery')}</label>
                <input
                  key={`delivery-${order.Id}`}
                  type="date"
                  readOnly
                  defaultValue={order.EstimatedDeliveryDate ? new Date(order.EstimatedDeliveryDate).toISOString().split('T')[0] : ''}
                  onBlur={(e) => handleUpdateOrder(order.Id, 'EstimatedDeliveryDate', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.shippingAddress')}</label>
                <input
                  key={`address-${order.Id}`}
                  type="text"
                  readOnly
                  defaultValue={order.ShippingAddress || ''}
                  onBlur={(e) => handleUpdateOrder(order.Id, 'ShippingAddress', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.notes')}</label>
              <textarea
                key={`notes-${order.Id}`}
                defaultValue={order.Notes || ''}
                onBlur={(e) => handleUpdateOrder(order.Id, 'Notes', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                rows={2}
              />
            </div>

            {expandedOrders.has(order.Id) && orderItems[order.Id] && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t('orders.orderItems')}</h4>
                <div className="space-y-2">
                  {orderItems[order.Id].map((item) => (
                    <div key={item.Id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{item.ProductName}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{t('orders.qty')}: {item.Quantity} × ${item.Price}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">${item.ItemTotal}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
