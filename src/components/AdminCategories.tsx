import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { defaultSettings } from '../data/settings';

interface Category {
  Id: string;
  Name: string;
  DisplayName: string;
  CategoryId: number;
  BusinessEmail: string;
  Active: boolean;
  IdBusiness: number;
  MaxSellAllowed: number;
}

export default function AdminCategories() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', displayName: '', categoryId: 0, maxSellAllowed: 0 });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('Categories')
      .select('*')
      .eq('IdBusiness', defaultSettings.id);
    setCategories(data || []);
  };

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.displayName) return;

    await supabase.from('Categories').insert([{
      Name: newCategory.name,
      DisplayName: newCategory.displayName,
      CategoryId: newCategory.categoryId,
      BusinessEmail: defaultSettings.email,
      Active: true,
      IdBusiness: defaultSettings.id,
      MaxSellAllowed: newCategory.maxSellAllowed
    }]);

    setNewCategory({ name: '', displayName: '', categoryId: 0, maxSellAllowed: 0 });
    loadCategories();
  };

  const handleUpdateCategory = async (id: string, field: string, value: any) => {
    setCategories((prev) => prev.map((category) => (
      category.Id === id ? { ...category, [field]: value } : category
    )));

    const { error } = await supabase.from('Categories').update({ [field]: value }).eq('Id', id);
    if (error) {
      console.error('Error updating category:', error);
      alert('Error updating category');
      loadCategories();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    await supabase.from('Categories').delete().eq('Id', id);
    loadCategories();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-luxury text-gray-900 dark:text-white">
          {t('admin.addCategory')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder={t('admin.categoryName')}
            value={newCategory.name}
            onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
          />
          <input
            type="text"
            placeholder={t('admin.displayName')}
            value={newCategory.displayName}
            onChange={(e) => setNewCategory({ ...newCategory, displayName: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Sell Allowed
            </label>
            <input
              type="number"
              min="1"
              value={newCategory.maxSellAllowed}
              onChange={(e) => setNewCategory({ ...newCategory, maxSellAllowed: Math.max(1, parseInt(e.target.value) || 1) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
            />
          </div>
        </div>
        <button
          onClick={handleAddCategory}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          {t('admin.add')}
        </button>
      </div>

      {categories.map((category) => (
        <div key={category.Id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.categoryName')}
                  </label>
                  <input
                    type="text"
                    defaultValue={category.Name}
                    onBlur={(e) => handleUpdateCategory(category.Id, 'Name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.displayName')}
                  </label>
                  <input
                    type="text"
                    defaultValue={category.DisplayName}
                    onBlur={(e) => handleUpdateCategory(category.Id, 'DisplayName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Sell Allowed
                  </label>
                  <input
                    type="number"
                    min="1"
                    defaultValue={category.MaxSellAllowed}
                    onBlur={(e) => handleUpdateCategory(category.Id, 'MaxSellAllowed', Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
                <div className="flex items-center gap-2 pt-7">
                  <input
                    type="checkbox"
                    checked={category.Active}
                    onChange={(e) => handleUpdateCategory(category.Id, 'Active', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('admin.active')}
                  </label>
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDeleteCategory(category.Id)}
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
