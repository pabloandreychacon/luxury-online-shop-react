import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { defaultSettings } from '../data/settings';

interface ShippingMethod {
  Id: string;
  Description: string;
  Price: number;
  DeliveryDays: number;
  BusinessEmail: string;
  Active: boolean;
  IdBusiness: number;
}

export default function AdminShippingMethods() {
  const { t } = useTranslation();
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [newMethod, setNewMethod] = useState({ description: '', price: 0, deliveryDays: 0 });

  useEffect(() => {
    loadShippingMethods();
  }, []);

  const loadShippingMethods = async () => {
    const { data } = await supabase
      .from('ShippingMethods')
      .select('*')
      .eq('IdBusiness', defaultSettings.id);
    setShippingMethods(data || []);
  };

  const handleAddMethod = async () => {
    if (!newMethod.description || newMethod.price <= 0) return;
    
    await supabase.from('ShippingMethods').insert([{
      Description: newMethod.description,
      Price: newMethod.price,
      DeliveryDays: newMethod.deliveryDays,
      BusinessEmail: defaultSettings.email,
      Active: true,
      IdBusiness: defaultSettings.id
    }]);

    setNewMethod({ description: '', price: 0, deliveryDays: 0 });
    loadShippingMethods();
  };

  const handleUpdateMethod = async (id: string, field: string, value: any) => {
    await supabase.from('ShippingMethods').update({ [field]: value }).eq('Id', id);
    loadShippingMethods();
  };

  const handleDeleteMethod = async (id: string) => {
    await supabase.from('ShippingMethods').delete().eq('Id', id);
    loadShippingMethods();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-luxury text-gray-900 dark:text-white">
          {t('admin.addShippingMethod')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder={t('admin.shippingDescription')}
            value={newMethod.description}
            onChange={(e) => setNewMethod({ ...newMethod, description: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('product.price')}
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={newMethod.price}
              onChange={(e) => setNewMethod({ ...newMethod, price: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.deliveryDays')}
            </label>
            <input
              type="number"
              placeholder="0"
              value={newMethod.deliveryDays}
              onChange={(e) => setNewMethod({ ...newMethod, deliveryDays: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
            />
          </div>
        </div>
        <button
          onClick={handleAddMethod}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          {t('admin.add')}
        </button>
      </div>

      {shippingMethods.map((method) => (
        <div key={method.Id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.shippingDescription')}
                  </label>
                  <input
                    type="text"
                    defaultValue={method.Description}
                    onBlur={(e) => handleUpdateMethod(method.Id, 'Description', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('product.price')}
                  </label>
                  <input
                    type="number"
                    defaultValue={method.Price}
                    onBlur={(e) => handleUpdateMethod(method.Id, 'Price', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.deliveryDays')}
                  </label>
                  <input
                    type="number"
                    defaultValue={method.DeliveryDays}
                    onBlur={(e) => handleUpdateMethod(method.Id, 'DeliveryDays', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={method.Active}
                  onChange={(e) => handleUpdateMethod(method.Id, 'Active', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('admin.active')}
                </label>
              </div>
            </div>
            <button
              onClick={() => handleDeleteMethod(method.Id)}
              className="ml-4 text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
