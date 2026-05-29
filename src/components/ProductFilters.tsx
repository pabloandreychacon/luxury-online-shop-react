import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

interface FilterCat { Id: number | string; DisplayName?: string; Name?: string; }
interface FilterBrand { Id: number | string; DisplayName?: string; Name?: string; }

interface ProductFiltersProps {
  categories: FilterCat[];
  brands: FilterBrand[];
  filterCategory: number;
  filterBrand: number;
  searchName: string;
  onCategoryChange: (categoryId: number) => void;
  onBrandChange: (brandId: number) => void;
  onSearchChange: (name: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onCloseFilters: () => void;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function ProductFilters({
  categories, brands,
  filterCategory, filterBrand, searchName,
  onCategoryChange, onBrandChange, onSearchChange,
  showFilters, onToggleFilters, onCloseFilters,
  title, children, className,
}: ProductFiltersProps) {
  const { t } = useTranslation();
  const panelTitle = title || t('shop.filters');
  const [localSearch, setLocalSearch] = useState(searchName);

  const sortedCategories = [...categories].sort((a, b) => (a.DisplayName || a.Name || '').localeCompare(b.DisplayName || b.Name || ''));
  const sortedBrands = [...brands].sort((a, b) => (a.DisplayName || a.Name || '').localeCompare(b.DisplayName || b.Name || ''));

  const handleSearch = () => {
    onSearchChange(localSearch);
    onCloseFilters();
  };

  return (
    <div className="sticky top-20 z-10">
      <button onClick={onToggleFilters}
        className="lg:hidden w-full mb-4 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-md flex items-center justify-between text-sm font-semibold text-gray-700 dark:text-gray-300">
        {panelTitle}
        <span className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}>▼</span>
      </button>
      <div className={`${showFilters ? 'fixed inset-x-0 top-20 bottom-0 z-20 bg-white dark:bg-gray-900 p-4 overflow-y-auto' : 'hidden'} lg:block lg:static lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0 lg:overflow-visible`}>
        <div className={`flex flex-wrap gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md ${className || ''}`}>
          <div className="flex items-center justify-between w-full lg:hidden mb-2">
            <h3 className="font-luxury text-lg text-gray-900 dark:text-white">{panelTitle}</h3>
            <button onClick={onCloseFilters} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
          </div>
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('shop.category')}</label>
            <select value={filterCategory} onChange={(e) => { onCategoryChange(parseInt(e.target.value)); onCloseFilters(); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-luxury-gold">
              <option value={0}>{t('shop.allCategories')}</option>
              {sortedCategories.map(c => <option key={c.Id} value={c.Id}>{c.DisplayName || c.Name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('product.brand')}</label>
            <select value={filterBrand} onChange={(e) => { onBrandChange(parseInt(e.target.value)); onCloseFilters(); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-luxury-gold">
              <option value={0}>{t('shop.allBrands')}</option>
              {sortedBrands.map(b => <option key={b.Id} value={b.Id}>{b.DisplayName || b.Name}</option>)}
            </select>
          </div>
          <div className="w-full lg:contents grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="min-w-0 lg:flex-1 lg:min-w-48">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.search')}</label>
              <div className="flex gap-1">
                <input type="text" placeholder={t('admin.searchByName')} value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-luxury-gold" />
                <button onClick={handleSearch}
                  className="px-3 py-2 bg-luxury-gold text-luxury-dark rounded-lg hover:bg-opacity-90 transition flex items-center justify-center">
                  <Search size={16} />
                </button>
              </div>
            </div>
            <div className="min-w-0 lg:flex-1 lg:min-w-32 flex flex-wrap gap-4">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
