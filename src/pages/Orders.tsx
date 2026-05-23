import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { defaultSettings } from '../data/settings';

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
  PriceListId?: number;
}

export default function Orders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());
  const [orderItems, setOrderItems] = useState<{ [orderId: number]: OrderItem[] }>({});
  const [priceLists, setPriceLists] = useState<{ Id: number; Label: string }[]>([]);
  const [dateFilter, setDateFilter] = useState('');

  const ORDER_STATUSES = [
    { id: 0, label: t('admin.orderStatusPending') },
    { id: 1, label: t('admin.orderStatusPaid') },
    { id: 2, label: t('admin.orderStatusShipped') },
    { id: 3, label: t('admin.orderStatusDelivered') },
    { id: 4, label: t('admin.orderStatusCancelled') }
  ];

  const [guestEmail, setGuestEmail] = useState('');
  const [guestEmailInput, setGuestEmailInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data } = await supabase.from('PriceLists').select('Id, Label').eq('Active', true).eq('IdBusiness', defaultSettings.id);
    setPriceLists(data || []);
  };

  useEffect(() => {
    let filtered = orders;

    if (dateFilter) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.CreatedAt);
        const orderYearMonth = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        return orderYearMonth === dateFilter;
      });
    }

    setFilteredOrders(filtered);
  }, [orders, dateFilter]);

  const loadOrders = async (emailOverride?: string) => {
    const email = emailOverride || guestEmail;
    if (!email) return;
    const { data } = await supabase
      .from('Orders')
      .select('*')
      .eq('IdBusiness', defaultSettings.id)
      .eq('BuyerEmail', email)
      .order('CreatedAt', { ascending: false });
    setOrders(data || []);
    setFilteredOrders(data || []);
  };

  const handleGuestSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setGuestEmail(guestEmailInput);
    loadOrders(guestEmailInput);
  };

  const toggleOrderItems = async (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
      if (!orderItems[orderId]) {
        const { data } = await supabase.from('OrderItems').select('*').eq('OrderId', orderId);
        const items = data || [];
        if (items.length > 0) {
          const ids = items.map((i: any) => i.ProductId).filter(Boolean);
          const { data: products } = await supabase.from('Products').select('Id, Name').in('Id', ids);
          const nameMap: Record<number, string> = {};
          (products || []).forEach((p: any) => { nameMap[p.Id] = p.Name; });
          setOrderItems(prev => ({ ...prev, [orderId]: items.map((i: any) => ({ ...i, ProductName: nameMap[i.ProductId] || i.ProductName || i.productName || '—' })) }));
        } else {
          setOrderItems(prev => ({ ...prev, [orderId]: [] }));
        }
      }
    }
    setExpandedOrders(newExpanded);
  };

  const getStatusLabel = (statusId: number) => {
    return ORDER_STATUSES.find(s => s.id === statusId)?.label || 'Unknown';
  };

  if (!guestEmail) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 pt-8 pb-20">
        <div className="container-luxury max-w-md mx-auto text-center py-20">
          <h1 className="text-3xl font-luxury mb-4">{t('orders.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {t('orders.emailPrompt')}
          </p>
          <form onSubmit={handleGuestSearch} className="flex flex-col gap-4">
            <input
              type="email"
              required
              placeholder={t('orders.emailPlaceholder')}
              value={guestEmailInput}
              onChange={(e) => setGuestEmailInput(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold outline-none"
            />
            <button type="submit" className="btn-primary">
              {t('orders.search')}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-8 pb-20">
      <div className="container-luxury">
        <h1 className="font-luxury text-4xl mb-12">{t('orders.title')}</h1>

        {/* Filter */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('orders.filterByMonth')}
              </label>
              <input
                type="month"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
              />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-6">
              {t('orders.showing')} {filteredOrders.length} {t('orders.of')} {orders.length} {t('orders.orders')}
            </div>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">{t('orders.empty')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order.Id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="space-y-4">
                  <div className="flex flex-col gap-2 border-b border-gray-200 dark:border-gray-700 pb-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t('orders.order')} #{order.Id}
                      </h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(order.CreatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.StatusId === 1 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          order.StatusId === 2 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            order.StatusId === 3 ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                              order.StatusId === 4 ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                        {getStatusLabel(order.StatusId)}
                      </span>
                      <button
                        onClick={() => toggleOrderItems(order.Id)}
                        className="text-sm text-luxury-gold hover:text-opacity-80 font-medium"
                      >
                        {expandedOrders.has(order.Id) ? t('orders.hideItems') : t('orders.showItems')}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {t('orders.total')}: ${order.TotalAmount.toFixed(2)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{t('orders.shippingMethod')}:</span>
                      <p className="text-gray-600 dark:text-gray-400">{order.ShippingMethod || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{t('orders.trackingNumber')}:</span>
                      <p className="text-gray-600 dark:text-gray-400">{order.TrackingNumber || t('orders.notAvailable')}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{t('orders.estimatedDelivery')}:</span>
                      <p className="text-gray-600 dark:text-gray-400">
                        {order.EstimatedDeliveryDate ? new Date(order.EstimatedDeliveryDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{t('orders.shippingAddress')}:</span>
                      <p className="text-gray-600 dark:text-gray-400">{order.ShippingAddress || 'N/A'}</p>
                    </div>
                  </div>

                  {order.Notes && (
                    <div className="text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{t('orders.notes')}:</span>
                      <p className="text-gray-600 dark:text-gray-400">{order.Notes}</p>
                    </div>
                  )}

                  {expandedOrders.has(order.Id) && orderItems[order.Id] && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t('orders.orderItems')}</h4>
                      <div className="space-y-2">
                        {orderItems[order.Id].map((item) => (
                          <div key={item.Id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-3 rounded">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.ProductName}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{t('orders.qty')}: {item.Quantity} × ${item.Price.toFixed(2)}</p>
                              {item.PriceListId ? (
                                <p className="text-xs text-luxury-gold">
                                  {priceLists.find(pl => pl.Id === item.PriceListId)?.Label || `#${item.PriceListId}`}
                                </p>
                              ) : null}
                            </div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">${item.ItemTotal.toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}