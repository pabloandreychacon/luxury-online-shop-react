import { useTranslation } from 'react-i18next';

interface FilterCat { Id: number | string; DisplayName?: string; Name?: string; }
interface FilterBrand { Id: number | string; DisplayName?: string; Name?: string; }

interface ProductFiltersProps {
  categories: FilterCat[];
  brands: FilterBrand[];
  filterCategory: number;
  filterBrand: number;
  searchName: string;
  filterPriceMax: number;
  onCategoryChange: (categoryId: number) => void;
  onBrandChange: (brandId: number) => void;
  onSearchChange: (name: string) => void;
  onPriceMaxChange: (max: number) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onCloseFilters: () => void;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function ProductFilters({
  categories, brands,
  filterCategory, filterBrand, searchName, filterPriceMax,
  onCategoryChange, onBrandChange, onSearchChange, onPriceMaxChange,
  showFilters, onToggleFilters, onCloseFilters,
  title, children, className,
}: ProductFiltersProps) {
  const { t } = useTranslation();
  const panelTitle = title || t('shop.filters');

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
              {categories.map(c => <option key={c.Id} value={c.Id}>{c.DisplayName || c.Name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('product.brand')}</label>
            <select value={filterBrand} onChange={(e) => { onBrandChange(parseInt(e.target.value)); onCloseFilters(); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-luxury-gold">
              <option value={0}>{t('shop.allBrands')}</option>
              {brands.map(b => <option key={b.Id} value={b.Id}>{b.DisplayName || b.Name}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-40">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.search')}</label>
            <input type="text" placeholder={t('admin.searchByName')} value={searchName}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-luxury-gold" />
          </div>
          <div className="flex-1 min-w-32">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('shop.priceRange')}</label>
            <input type="range" min="0" max="5000" step="100" value={filterPriceMax}
              onChange={(e) => onPriceMaxChange(parseInt(e.target.value))}
              className="w-full" />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('shop.upTo')} ${filterPriceMax.toLocaleString()}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
