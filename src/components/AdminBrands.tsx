import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { defaultSettings } from '../data/settings';

interface Brand {
  Id: string;
  Name: string;
  DisplayName: string;
  BusinessEmail: string;
  Active: boolean;
  IdBusiness: number;
}

export default function AdminBrands() {
  const { t } = useTranslation();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [newBrand, setNewBrand] = useState({ name: '', displayName: '' });

  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    const { data } = await supabase
      .from('Brands')
      .select('*')
      .eq('IdBusiness', defaultSettings.id);
    setBrands(data || []);
  };

  const handleAddBrand = async () => {
    if (!newBrand.name || !newBrand.displayName) return;

    await supabase.from('Brands').insert([{
      Name: newBrand.name,
      DisplayName: newBrand.displayName,
      BusinessEmail: defaultSettings.email,
      Active: true,
      IdBusiness: defaultSettings.id
    }]);

    setNewBrand({ name: '', displayName: '' });
    loadBrands();
  };

  const handleUpdateBrand = async (id: string, field: string, value: any) => {
    await supabase.from('Brands').update({ [field]: value }).eq('Id', id);
    loadBrands();
  };

  const handleDeleteBrand = async (id: string) => {
    await supabase.from('Brands').delete().eq('Id', id);
    loadBrands();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-luxury text-gray-900 dark:text-white">
          {t('admin.addBrand')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={t('common.name')}
            value={newBrand.name}
            onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
          />
          <input
            type="text"
            placeholder={t('admin.displayName')}
            value={newBrand.displayName}
            onChange={(e) => setNewBrand({ ...newBrand, displayName: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
          />
        </div>
        <button
          onClick={handleAddBrand}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          {t('admin.add')}
        </button>
      </div>

      {brands.map((brand) => (
        <div key={brand.Id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('common.name')}
                  </label>
                  <input
                    type="text"
                    defaultValue={brand.Name}
                    onBlur={(e) => handleUpdateBrand(brand.Id, 'Name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.displayName')}
                  </label>
                  <input
                    type="text"
                    defaultValue={brand.DisplayName}
                    onBlur={(e) => handleUpdateBrand(brand.Id, 'DisplayName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={brand.Active}
                  onChange={(e) => handleUpdateBrand(brand.Id, 'Active', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('admin.active')}
                </label>
              </div>
            </div>
            <button
              onClick={() => handleDeleteBrand(brand.Id)}
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
