import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Trash2, Pencil, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { defaultSettings, getBusinessLanguages } from '../data/settings';

interface Product {
  Id: string;
  Name: string;
  CategoryId: number;
  BrandId?: number;
  Price: number;
  Description: string;
  StockQuantity: number;
  ProductId: number;
  BusinessEmail: string;
  Taxes: number;
  Active: boolean;
  IsService: boolean;
  IsOffer: boolean;
  Weigth: number;
}

interface Category { Id: string; Name: string; DisplayName: string; CategoryId: number; }
interface Brand { Id: string; Name: string; DisplayName: string; Active: boolean; IdBusiness: number; }
interface PriceList { Id: number; Code: string; Label: string; Active: boolean; IdBusiness: number; }
interface ProductListPrice { Id: number; ProductId: number; PriceListId: number; Price: number; }
interface ProductMediaItem {
  Id: number; ProductId: number; MediaType: 'image' | 'video';
  MediaUrl: string; DisplayOrder: number; BusinessEmail: string; IdBusiness: number; isVideo: boolean;
}

export default function AdminProducts() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [productFirstMedia, setProductFirstMedia] = useState<Record<string, { url: string; isVideo: boolean }>>({});
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productMedia, setProductMedia] = useState<ProductMediaItem[]>([]);
  const [newMediaInput, setNewMediaInput] = useState({ url: '', isVideo: false });
  const [productTranslations, setProductTranslations] = useState<Record<string, { Name: string; Description?: string }>>({});
  const [translationLang, setTranslationLang] = useState('en');
  const [priceLists, setPriceLists] = useState<PriceList[]>([]);
  const [productListPrices, setProductListPrices] = useState<ProductListPrice[]>([]);
  const [selectedPriceListId, setSelectedPriceListId] = useState<number>(0);
  const [priceListInputValue, setPriceListInputValue] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editFields, setEditFields] = useState({ Price: 0, CategoryId: 0, BrandId: 0, Taxes: 0, Weigth: 0, Active: true, IsOffer: false });
  const [langOptions, setLangOptions] = useState([
    { code: 'en', label: '🇺🇸 EN' },
    { code: 'es', label: '🇪🇸 ES' },
    { code: 'zh', label: '🇨🇳 中文' },
  ]);
  const [newProduct, setNewProduct] = useState({
    name: '', price: 0, categoryId: 0, brandId: 0,
    description: '', stockQuantity: 0, taxes: 0, weight: 0, isOffer: false,
  });
  const [errors, setErrors] = useState({ name: '', price: '', category: '', brand: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState(0);
  const [filterBrand, setFilterBrand] = useState(0);

  useEffect(() => {
    loadProducts(); loadCategories(); loadBrands(); loadLanguageOptions(); loadPriceLists();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase.from('Products').select('*').eq('IdBusiness', defaultSettings.id);
    if (!data) return;

    const ids = data.map(p => Number(p.Id));
    const { data: media } = await supabase.from('ProductMedia').select('ProductId, MediaUrl, isVideo, DisplayOrder')
      .in('ProductId', ids).eq('IdBusiness', defaultSettings.id).order('DisplayOrder', { ascending: true });

    const mediaMap: Record<string, { url: string; isVideo: boolean }> = {};
    (media || []).forEach((m: any) => {
      const key = String(m.ProductId);
      if (!mediaMap[key]) mediaMap[key] = { url: m.MediaUrl, isVideo: !!m.isVideo };
    });
    setProductFirstMedia(mediaMap);
    setProducts(data);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from('Categories').select('*').eq('IdBusiness', defaultSettings.id).eq('Active', true);
    setCategories(data || []);
  };

  const loadBrands = async () => {
    const { data } = await supabase.from('Brands').select('*').eq('IdBusiness', defaultSettings.id).eq('Active', true);
    setBrands(data || []);
  };

  const loadLanguageOptions = async () => {
    const languages = await getBusinessLanguages();
    if (languages.length > 0) setLangOptions(languages.map(l => ({ code: l.Code, label: l.Label?.trim() || l.Code.toUpperCase() })));
  };

  const loadPriceLists = async () => {
    const { data } = await supabase.from('PriceLists').select('*').eq('Active', true).eq('IdBusiness', defaultSettings.id);
    setPriceLists(data || []);
    if (data && data.length > 0) setSelectedPriceListId(data[0].Id);
  };

  const openEdit = async (product: Product) => {
    setEditingProduct(product);
    setEditName(product.Name || '');
    setEditDescription(product.Description || '');
    setEditFields({ Price: product.Price, CategoryId: product.CategoryId, BrandId: product.BrandId || 0, Taxes: product.Taxes, Weigth: product.Weigth, Active: product.Active, IsOffer: product.IsOffer });
    setTranslationLang('en');

    const [{ data: media }, { data: translations }, { data: listPrices }] = await Promise.all([
      supabase.from('ProductMedia').select('*').eq('ProductId', product.Id).eq('IdBusiness', defaultSettings.id).order('DisplayOrder', { ascending: true }),
      supabase.from('ProductTranslations').select('*').eq('ProductId', product.Id),
      supabase.from('ProductListPrices').select('*').eq('ProductId', product.Id),
    ]);

    setProductMedia(media || []);
    const map: Record<string, { Name: string; Description?: string }> = {};
    (translations || []).forEach((t: any) => { map[t.Language] = { Name: t.Name, Description: t.Description }; });
    setProductTranslations(map);
    setProductListPrices(listPrices || []);

    const firstPriceListId = priceLists[0]?.Id || 0;
    setSelectedPriceListId(firstPriceListId);
    const existing = (listPrices || []).find((lp: ProductListPrice) => lp.PriceListId === firstPriceListId);
    setPriceListInputValue(existing ? String(existing.Price) : '');
    setNewMediaInput({ url: '', isVideo: false });
  };

  const closeEdit = () => {
    setEditingProduct(null);
    setProductMedia([]);
    setProductTranslations({});
    loadProducts();
  };

  const handleUpdateProduct = async (field: string, value: any) => {
    if (!editingProduct) return;
    setEditingProduct(prev => prev ? { ...prev, [field]: value } : prev);
    await supabase.from('Products').update({ [field]: value }).eq('Id', editingProduct.Id);
    setProducts(prev => prev.map(p => p.Id === editingProduct.Id ? { ...p, [field]: value } : p));
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm(t('admin.deleteConfirm'))) return;
    await supabase.from('Products').delete().eq('Id', id);
    setProducts(prev => prev.filter(p => p.Id !== id));
  };

  const handleAddMediaItem = async () => {
    if (!editingProduct || !newMediaInput.url) return;
    await supabase.from('ProductMedia').insert([{
      ProductId: Number(editingProduct.Id), MediaType: newMediaInput.isVideo ? 'video' : 'image',
      MediaUrl: newMediaInput.url, DisplayOrder: 0, BusinessEmail: defaultSettings.email,
      IdBusiness: defaultSettings.id, isVideo: newMediaInput.isVideo
    }]);
    setNewMediaInput({ url: '', isVideo: false });
    const { data } = await supabase.from('ProductMedia').select('*').eq('ProductId', editingProduct.Id).eq('IdBusiness', defaultSettings.id).order('DisplayOrder', { ascending: true });
    setProductMedia(data || []);
  };

  const deleteProductMedia = async (mediaId: number) => {
    await supabase.from('ProductMedia').delete().eq('Id', mediaId);
    setProductMedia(prev => prev.filter(m => m.Id !== mediaId));
  };

  const toggleMediaVideo = async (mediaId: number, isVideo: boolean) => {
    await supabase.from('ProductMedia').update({ isVideo, MediaType: isVideo ? 'video' : 'image' }).eq('Id', mediaId);
    setProductMedia(prev => prev.map(m => m.Id === mediaId ? { ...m, isVideo, MediaType: isVideo ? 'video' : 'image' } : m));
  };

  const handleSaveNameDescription = async () => {
    if (!editingProduct) return;
    await supabase.from('Products').update({
      Name: editName,
      Description: editDescription,
      Price: editFields.Price,
      CategoryId: editFields.CategoryId,
      BrandId: editFields.BrandId || null,
      Taxes: editFields.Taxes,
      Weigth: editFields.Weigth,
      Active: editFields.Active,
      IsOffer: editFields.IsOffer,
    }).eq('Id', editingProduct.Id);
    setEditingProduct(prev => prev ? { ...prev, Name: editName, Description: editDescription, ...editFields } : prev);
    setProducts(prev => prev.map(p => p.Id === editingProduct.Id ? { ...p, Name: editName, ...editFields } : p));
    alert(t('admin.save') + ' ✓');
  };

  const handlePriceListChange = (priceListId: number) => {
    setSelectedPriceListId(priceListId);
    const existing = productListPrices.find(lp => lp.PriceListId === priceListId);
    setPriceListInputValue(existing ? String(existing.Price) : '');
  };

  const handleSavePriceListPrice = async () => {
    if (!editingProduct || !selectedPriceListId) return;
    const price = parseFloat(priceListInputValue);
    if (isNaN(price) || price < 0) return;
    await supabase.from('ProductListPrices').upsert([{
      ProductId: Number(editingProduct.Id),
      PriceListId: selectedPriceListId,
      Price: price,
    }], { onConflict: 'ProductId,PriceListId' });
    setProductListPrices(prev => {
      const exists = prev.find(lp => lp.PriceListId === selectedPriceListId);
      if (exists) return prev.map(lp => lp.PriceListId === selectedPriceListId ? { ...lp, Price: price } : lp);
      return [...prev, { Id: 0, ProductId: Number(editingProduct.Id), PriceListId: selectedPriceListId, Price: price }];
    });
    alert(t('admin.save') + ' ✓');
  };

  const handleSaveTranslation = async () => {
    if (!editingProduct) return;
    const current = productTranslations[translationLang] || { Name: '', Description: '' };
    await supabase.from('ProductTranslations').upsert([{
      ProductId: Number(editingProduct.Id), Language: translationLang,
      Name: current.Name, Description: current.Description || null,
    }], { onConflict: 'ProductId,Language' });
    if (translationLang === 'en' && current.Name) {
      await supabase.from('Products').update({ Name: current.Name }).eq('Id', editingProduct.Id);
      setProducts(prev => prev.map(p => p.Id === editingProduct.Id ? { ...p, Name: current.Name } : p));
    }
    alert(t('admin.save') + ' ✓');
  };

  const handleAddProduct = async () => {
    const newErrors = { name: '', price: '', category: '', brand: '' };
    if (!newProduct.name) newErrors.name = t('admin.required');
    if (!newProduct.price || newProduct.price <= 0) newErrors.price = t('admin.required');
    if (!newProduct.categoryId) newErrors.category = t('admin.required');
    if (!newProduct.brandId) newErrors.brand = t('admin.required');
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) return;

    const { data: inserted } = await supabase.from('Products').insert([{
      Name: newProduct.name,
      CategoryId: newProduct.categoryId, Price: newProduct.price, ProductId: 0,
      StockQuantity: newProduct.stockQuantity, BusinessEmail: defaultSettings.email,
      BrandId: newProduct.brandId, Taxes: newProduct.taxes, Active: true,
      IsService: false, IsOffer: newProduct.isOffer, IdBusiness: defaultSettings.id, Weigth: newProduct.weight
    }]).select('Id').maybeSingle();

    if (inserted?.Id) {
      await supabase.from('ProductTranslations').insert([{
        ProductId: inserted.Id, Language: 'en', Name: newProduct.name, Description: newProduct.description || ''
      }]);
    }

    setNewProduct({ name: '', price: 0, categoryId: 0, brandId: 0, description: '', stockQuantity: 0, taxes: 0, weight: 0, isOffer: false });
    setErrors({ name: '', price: '', category: '', brand: '' });
    setShowAddForm(false);
    await loadProducts();
  };

  const getCategoryName = (id: number) => categories.find(c => Number(c.Id) === id)?.DisplayName || '-';
  const getBrandName = (id?: number) => brands.find(b => Number(b.Id) === id)?.DisplayName || brands.find(b => Number(b.Id) === id)?.Name || '-';

  const filteredProducts = products.filter(p => {
    if (filterCategory && p.CategoryId !== filterCategory) return false;
    if (filterBrand && p.BrandId !== filterBrand) return false;
    return true;
  }).sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));

  return (
    <div className="space-y-4">
      {/* Add Product Toggle */}
      <div className="flex justify-end">
        <button onClick={() => setShowAddForm(!showAddForm)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold">
          {showAddForm ? `✕ ${t('admin.cancel')}` : `+ ${t('admin.addProduct')}`}
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-xl font-luxury text-gray-900 dark:text-white">{t('admin.addProduct')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('common.name')}</label>
              <input type="text" placeholder={t('common.name')} value={newProduct.name}
                onChange={(e) => { setNewProduct({ ...newProduct, name: e.target.value }); setErrors({ ...errors, name: '' }); }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-luxury-gold ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`} />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('product.price')}</label>
              <input type="number" placeholder={t('product.price')} value={newProduct.price}
                onChange={(e) => { setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 }); setErrors({ ...errors, price: '' }); }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-luxury-gold ${errors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`} />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('product.category')}</label>
              <select value={newProduct.categoryId}
                onChange={(e) => { setNewProduct({ ...newProduct, categoryId: parseInt(e.target.value) }); setErrors({ ...errors, category: '' }); }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-luxury-gold ${errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`}>
                <option value="0">-- {t('product.category')} --</option>
                {categories.map(c => <option key={c.Id} value={c.Id}>{c.DisplayName}</option>)}
              </select>
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('product.brand')}</label>
              <select value={newProduct.brandId}
                onChange={(e) => { setNewProduct({ ...newProduct, brandId: parseInt(e.target.value) }); setErrors({ ...errors, brand: '' }); }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-luxury-gold ${errors.brand ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} dark:bg-gray-700 dark:text-white`}>
                <option value="0">-- {t('product.brand')} --</option>
                {brands.map(b => <option key={b.Id} value={b.Id}>{b.DisplayName || b.Name}</option>)}
              </select>
              {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.taxes')}</label>
              <input type="number" placeholder={t('admin.taxes')} value={newProduct.taxes}
              onChange={(e) => setNewProduct({ ...newProduct, taxes: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.weight')}</label>
              <input type="number" step="0.01" placeholder={t('admin.weight')} value={newProduct.weight}
              onChange={(e) => setNewProduct({ ...newProduct, weight: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('product.description')}</label>
              <textarea placeholder={t('product.description')} value={newProduct.description}
              onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold" rows={2} />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={newProduct.isOffer} onChange={(e) => setNewProduct({ ...newProduct, isOffer: e.target.checked })} className="w-4 h-4 rounded" />
              {t('admin.isOffer')}
            </label>
          </div>
          <button onClick={handleAddProduct} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
            {t('admin.add')}
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <div className="flex-1 min-w-40">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('shop.category')}</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-luxury-gold">
            <option value={0}>{t('shop.allProducts')}</option>
            {categories.map(c => <option key={c.Id} value={c.Id}>{c.DisplayName}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-40">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('product.brand')}</label>
          <select value={filterBrand} onChange={(e) => setFilterBrand(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-luxury-gold">
            <option value={0}>{t('shop.allBrands')}</option>
            {brands.map(b => <option key={b.Id} value={b.Id}>{b.DisplayName || b.Name}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <span className="text-sm text-gray-500 dark:text-gray-400 pb-2">{filteredProducts.length} / {products.length}</span>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hidden md:table-header-group">
            <tr>
              <th className="px-4 py-3 text-left font-semibold w-16"></th>
              <th className="px-4 py-3 text-left font-semibold">{t('common.name')}</th>
              <th className="px-4 py-3 text-left font-semibold">{t('product.category')}</th>
              <th className="px-4 py-3 text-left font-semibold">{t('product.brand')}</th>
              <th className="px-4 py-3 text-left font-semibold">{t('product.price')}</th>
              <th className="px-4 py-3 text-left font-semibold">{t('admin.active')}</th>
              <th className="px-4 py-3 text-center font-semibold">{t('admin.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredProducts.map(product => (
              <tr key={product.Id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition flex flex-col md:table-row border-b border-gray-200 dark:border-gray-700 md:border-0">
                <td className="px-4 py-2 md:py-3 md:table-cell">
                  {productFirstMedia[product.Id] ? (
                    productFirstMedia[product.Id].isVideo
                      ? <video src={productFirstMedia[product.Id].url} className="w-12 h-12 object-cover rounded" muted />
                      : <img src={productFirstMedia[product.Id].url} alt="" className="w-12 h-12 object-cover rounded" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-gray-400 text-xs">—</div>
                  )}
                </td>
                <td className="px-4 py-2 md:py-3 text-gray-900 dark:text-white font-medium flex justify-between md:table-cell">
                  <span className="text-xs text-gray-500 md:hidden">{t('common.name')}</span>
                  {product.Name ? product.Name.length > 50 ? product.Name.substring(0, 50) + '…' : product.Name : '—'}
                </td>
                <td className="px-4 py-2 md:py-3 text-gray-600 dark:text-gray-400 flex justify-between md:table-cell">
                  <span className="text-xs text-gray-500 md:hidden">{t('product.category')}</span>
                  {getCategoryName(product.CategoryId)}
                </td>
                <td className="px-4 py-2 md:py-3 text-gray-600 dark:text-gray-400 flex justify-between md:table-cell">
                  <span className="text-xs text-gray-500 md:hidden">{t('product.brand')}</span>
                  {getBrandName(product.BrandId)}
                </td>
                <td className="px-4 py-2 md:py-3 text-gray-600 dark:text-gray-400 flex justify-between md:table-cell">
                  <span className="text-xs text-gray-500 md:hidden">{t('product.price')}</span>
                  ${product.Price?.toFixed(2)}
                </td>
                <td className="px-4 py-2 md:py-3 flex justify-between md:table-cell">
                  <span className="text-xs text-gray-500 md:hidden">{t('admin.active')}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${product.Active ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                    {product.Active ? '✓' : '✗'}
                  </span>
                </td>
                <td className="px-4 py-2 md:py-3 md:text-center">
                  <div className="flex items-center gap-2 md:justify-center">
                    <button onClick={() => openEdit(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded transition">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDeleteProduct(product.Id)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('common.noResults')}</p>
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto py-8 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-luxury text-gray-900 dark:text-white">{t('admin.editProduct')} #{editingProduct.Id}</h2>
              <button onClick={closeEdit} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={24} /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Name & Description */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('common.name')}</label>
                  <input type="text" value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('product.description')}</label>
                  <textarea value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold" />
                </div>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('product.price')} (base)</label>
                  <input type="number" value={editFields.Price}
                    onChange={(e) => setEditFields(f => ({ ...f, Price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('product.category')}</label>
                  <select value={editFields.CategoryId} onChange={(e) => setEditFields(f => ({ ...f, CategoryId: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold">
                    {categories.map(c => <option key={c.Id} value={c.Id}>{c.DisplayName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('product.brand')}</label>
                  <select value={editFields.BrandId} onChange={(e) => setEditFields(f => ({ ...f, BrandId: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold">
                    <option value={0}>-- {t('product.brand')} --</option>
                    {brands.map(b => <option key={b.Id} value={b.Id}>{b.DisplayName || b.Name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.taxes')}</label>
                  <input type="number" value={editFields.Taxes}
                    onChange={(e) => setEditFields(f => ({ ...f, Taxes: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.weight')}</label>
                  <input type="number" step="0.01" value={editFields.Weigth}
                    onChange={(e) => setEditFields(f => ({ ...f, Weigth: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold" />
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={editFields.Active} onChange={(e) => setEditFields(f => ({ ...f, Active: e.target.checked }))} className="w-4 h-4 rounded" />
                    {t('admin.active')}
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <input type="checkbox" checked={editFields.IsOffer} onChange={(e) => setEditFields(f => ({ ...f, IsOffer: e.target.checked }))} className="w-4 h-4 rounded" />
                    {t('admin.isOffer')}
                  </label>
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button onClick={handleSaveNameDescription} className="bg-luxury-gold text-luxury-dark px-4 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition">
                    {t('admin.save')}
                  </button>
                </div>
              </div>

              {/* Price Lists */}
              {priceLists.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('admin.priceLists')}</h3>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-40">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('admin.priceList')}</label>
                      <select value={selectedPriceListId} onChange={(e) => handlePriceListChange(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-luxury-gold">
                        {priceLists.map(pl => (
                          <option key={pl.Id} value={pl.Id}>{pl.Label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1 min-w-32">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{t('product.price')}</label>
                      <input type="number" step="0.01" value={priceListInputValue}
                        onChange={(e) => setPriceListInputValue(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-luxury-gold" />
                    </div>
                    <button onClick={handleSavePriceListPrice} className="bg-luxury-gold text-luxury-dark px-4 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90 transition whitespace-nowrap">
                      {t('admin.save')}
                    </button>
                  </div>
                  {productListPrices.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {productListPrices.map(lp => {
                        const pl = priceLists.find(p => p.Id === lp.PriceListId);
                        return pl ? (
                          <span key={lp.PriceListId} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-700 dark:text-gray-300">
                            {pl.Label}: ${lp.Price.toFixed(2)}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Media */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('admin.productMedia')}</h3>
                <div className="flex gap-3 mb-3">
                  <input type="text" value={newMediaInput.url} onChange={(e) => setNewMediaInput(p => ({ ...p, url: e.target.value }))}
                    placeholder={t('admin.mediaUrlPlaceholder')}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold text-sm" />
                  <label className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <input type="checkbox" checked={newMediaInput.isVideo} onChange={(e) => setNewMediaInput(p => ({ ...p, isVideo: e.target.checked }))} className="w-4 h-4" />
                    {t('admin.isVideo')}
                  </label>
                  <button onClick={handleAddMediaItem} className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 text-sm whitespace-nowrap">{t('admin.addMedia')}</button>
                </div>
                {productMedia.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {productMedia.map(media => (
                      <div key={media.Id} className="bg-gray-100 dark:bg-gray-900 p-2 rounded-lg">
                        {media.isVideo
                          ? <video controls src={media.MediaUrl} className="w-full h-32 object-cover rounded" />
                          : <img src={media.MediaUrl} alt="" className="w-full h-32 object-cover rounded" />}
                        <div className="mt-2 flex gap-1">
                          <button onClick={() => toggleMediaVideo(media.Id, !media.isVideo)} className="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700">
                            {media.isVideo ? t('admin.markAsImage') : t('admin.markAsVideo')}
                          </button>
                          <button onClick={() => deleteProductMedia(media.Id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Translations (optional) */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{t('admin.translations')} <span className="text-xs font-normal text-gray-400">({t('common.optional') ?? 'optional'})</span></h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('common.language')}</label>
                    <select value={translationLang} onChange={(e) => setTranslationLang(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold">
                      {langOptions.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.translationName')}</label>
                    <input type="text" value={productTranslations[translationLang]?.Name || ''}
                      onChange={(e) => setProductTranslations(prev => ({ ...prev, [translationLang]: { ...prev[translationLang], Name: e.target.value } }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold" />
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-3">{t('admin.translationDescription')}</label>
                    <textarea value={productTranslations[translationLang]?.Description || ''}
                      onChange={(e) => setProductTranslations(prev => ({ ...prev, [translationLang]: { ...prev[translationLang], Description: e.target.value } }))}
                      rows={3} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold" />
                    <button onClick={handleSaveTranslation} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
                      {t('admin.saveTranslation')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
