import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { defaultSettings } from '../data/settings';

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

interface Category {
  Id: string;
  Name: string;
  DisplayName: string;
  CategoryId: number;
}

interface Brand {
  Id: string;
  Name: string;
  DisplayName: string;
  Active: boolean;
  IdBusiness: number;
}

interface ProductMediaItem {
  Id: number;
  ProductId: number;
  MediaType: 'image' | 'video';
  MediaUrl: string;
  DisplayOrder: number;
  BusinessEmail: string;
  IdBusiness: number;
  isVideo: boolean;
}

export default function AdminProducts() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    categoryId: 0,
    brandId: 0,
    description: '',
    stockQuantity: 0,
    taxes: 0,
    weight: 0,
    isOffer: false,
  });

  const [errors, setErrors] = useState({ name: '', price: '', category: '', brand: '' });
  const [productMedia, setProductMedia] = useState<Record<string, ProductMediaItem[]>>({});
  const [newMediaInputs, setNewMediaInputs] = useState<Record<string, { url: string; isVideo: boolean }>>({});
  const [productTranslations, setProductTranslations] = useState<Record<string, Record<string, { Name: string; Description?: string }>>>({});
  const [translationLangs, setTranslationLangs] = useState<Record<string, string>>({});

  const langOptions = [
    { code: 'en', label: '🇺🇸 EN' },
    { code: 'es', label: '🇪🇸 ES' },
    { code: 'zh', label: '🇨🇳 中文' },
  ];

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadBrands();
  }, []);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('Products')
      .select('*')
      .eq('IdBusiness', defaultSettings.id);
    setProducts(data || []);

    if (data && data.length > 0) {
      const productIds = data.map((product) => Number(product.Id));
      await loadProductMedia(productIds);
      await loadProductTranslations(productIds);
    }
  };

  const loadProductTranslations = async (productIds: number[]) => {
    if (productIds.length === 0) {
      setProductTranslations({});
      return;
    }

    const { data, error } = await supabase
      .from('ProductTranslations')
      .select('*')
      .in('ProductId', productIds);

    if (error) {
      console.error('Error loading product translations:', error);
      setProductTranslations({});
      return;
    }

    const grouped: Record<string, Record<string, { Name: string; Description?: string }>> = {};
    (data || []).forEach((t) => {
      const pid = String(t.ProductId);
      if (!grouped[pid]) grouped[pid] = {};
      grouped[pid][t.Language] = { Name: t.Name, Description: t.Description };
    });

    setProductTranslations(grouped);

    // initialize selected language per product (prefer 'en')
    const langs: Record<string, string> = {};
    productIds.forEach((id) => {
      const key = String(id);
      langs[key] = grouped[key]?.['en'] ? 'en' : Object.keys(grouped[key] || {})[0] || 'en';
    });
    setTranslationLangs(langs);
  };

  const loadProductMedia = async (productIds: number[]) => {
    if (productIds.length === 0) {
      setProductMedia({});
      return;
    }

    const { data, error } = await supabase
      .from('ProductMedia')
      .select('*')
      .in('ProductId', productIds)
      .eq('IdBusiness', defaultSettings.id)
      .order('DisplayOrder', { ascending: true });

    if (error) {
      console.error('Error loading product media:', error);
      setProductMedia({});
      return;
    }

    const grouped: Record<string, ProductMediaItem[]> = {};
    (data || []).forEach((media) => {
      const productId = String(media.ProductId);
      if (!grouped[productId]) grouped[productId] = [];
      grouped[productId].push(media as ProductMediaItem);
    });

    setProductMedia(grouped);
  };

  const deleteProductMedia = async (productId: string | number, mediaId: number) => {
    const { error } = await supabase.from('ProductMedia').delete().eq('Id', mediaId);
    if (error) {
      alert('Error deleting media');
      return;
    }

    setProductMedia((prev) => {
      const key = String(productId);
      const updated = prev[key]?.filter((item) => item.Id !== mediaId) || [];
      return { ...prev, [key]: updated };
    });
  };

  const toggleMediaVideo = async (mediaId: number, productId: string | number, isVideo: boolean) => {
    const { error } = await supabase.from('ProductMedia').update({ isVideo, MediaType: isVideo ? 'video' : 'image' }).eq('Id', mediaId);
    if (error) {
      alert('Error updating media type');
      return;
    }

    setProductMedia((prev) => {
      const key = String(productId);
      const updated = prev[key]?.map((item) => item.Id === mediaId ? { ...item, isVideo, MediaType: isVideo ? 'video' : 'image' } : item) || [];
      return { ...prev, [key]: updated };
    });
  };

  const handleAddMediaItem = async (productId: string) => {
    const input = newMediaInputs[productId] || { url: '', isVideo: false };
    if (!input.url) return;

    const { error } = await supabase.from('ProductMedia').insert([{
      ProductId: Number(productId),
      MediaType: input.isVideo ? 'video' : 'image',
      MediaUrl: input.url,
      DisplayOrder: 0,
      BusinessEmail: defaultSettings.email,
      IdBusiness: defaultSettings.id,
      isVideo: input.isVideo
    }]);

    if (error) {
      alert('Error adding media item');
      return;
    }

    setNewMediaInputs((prev) => ({ ...prev, [productId]: { url: '', isVideo: false } }));
    await loadProductMedia([Number(productId)]);
  };

  const handleSaveTranslation = async (productId: string) => {
    const lang = translationLangs[productId] || 'en';
    const current = productTranslations[productId]?.[lang] || { Name: '', Description: '' };

    // optimistic update already applied to state via inputs
    const payload = {
      ProductId: Number(productId),
      Language: lang,
      Name: current.Name,
      Description: current.Description || null,
    };

    const { error } = await supabase.from('ProductTranslations').upsert([payload], { onConflict: ['ProductId', 'Language'] });
    if (error) {
      alert('Error saving translation');
      await loadProductTranslations([Number(productId)]);
    } else {
      alert('Translation saved');
    }
  };


  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('Categories')
      .select('*')
      .eq('IdBusiness', defaultSettings.id)
      .eq('Active', true);

    if (error) {
      console.error('Error loading categories:', error);
    }
    setCategories(data || []);
  };

  const loadBrands = async () => {
    const { data, error } = await supabase
      .from('Brands')
      .select('*')
      .eq('IdBusiness', defaultSettings.id)
      .eq('Active', true);

    if (error) {
      console.error('Error loading brands:', error);
    }
    setBrands(data || []);
  };

  const handleAddProduct = async () => {
    const newErrors = { name: '', price: '', category: '', brand: '' };

    if (!newProduct.name) {
      newErrors.name = 'Please enter a product name';
    }
    if (!newProduct.price || newProduct.price <= 0) {
      newErrors.price = 'Please enter a valid price';
    }
    if (!newProduct.categoryId || newProduct.categoryId === 0) {
      newErrors.category = 'Please select a category';
    }
    if (!newProduct.brandId || newProduct.brandId === 0) {
      newErrors.brand = 'Please select a brand';
    }

    setErrors(newErrors);

    if (newErrors.name || newErrors.price || newErrors.category || newErrors.brand) {
      return;
    }

    const { data: inserted, error } = await supabase.from('Products').insert([{
      CategoryId: newProduct.categoryId,
      Price: newProduct.price,
      ProductId: 0,
      StockQuantity: newProduct.stockQuantity || 0,
      BusinessEmail: defaultSettings.email,
      BrandId: newProduct.brandId,
      Taxes: newProduct.taxes || 0,
      Active: true,
      IsService: false,
      IsOffer: newProduct.isOffer || false,
      IdBusiness: defaultSettings.id,
      Weigth: newProduct.weight || 0
    }]).select('Id').maybeSingle();

    if (error) {
      alert(`Error adding product: ${error.message}`);
      return;
    }

    // create initial translation (default to 'en')
    if (inserted?.Id) {
      const { error: trErr } = await supabase.from('ProductTranslations').insert([{
        ProductId: inserted.Id,
        Language: 'en',
        Name: newProduct.name,
        Description: newProduct.description || ''
      }]);
      if (trErr) {
        console.error('Error inserting translation:', trErr);
      }
    }

    if (error) {
      alert(`Error adding product: ${error.message}`);
      return;
    }

    setNewProduct({ name: '', price: 0, categoryId: 0, brandId: 0, description: '', stockQuantity: 0, taxes: 0, weight: 0, isOffer: false });
    setErrors({ name: '', price: '', category: '', brand: '' });
    await loadProducts();
    alert('Product added successfully!');
  };

  const handleUpdateProduct = async (id: string, field: string, value: any) => {
    setProducts((prev) => prev.map((product) => (
      product.Id === id ? { ...product, [field]: value } : product
    )));

    const { error } = await supabase.from('Products').update({ [field]: value }).eq('Id', id);
    if (error) {
      alert('Error updating product');
      loadProducts();
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((product) => product.Id !== id));
    setProductMedia((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

    const { error } = await supabase.from('Products').delete().eq('Id', id);
    if (error) {
      alert('Error deleting product');
      loadProducts();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
        <h2 className="text-xl font-luxury text-gray-900 dark:text-white">
          {t('admin.addProduct')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <input
              type="text"
              placeholder={t('common.name')}
              value={newProduct.name}
              onChange={(e) => {
                setNewProduct({ ...newProduct, name: e.target.value });
                setErrors({ ...errors, name: '' });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-luxury-gold ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('product.price')}
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={newProduct.price}
              onChange={(e) => {
                setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 });
                setErrors({ ...errors, price: '' });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-luxury-gold ${errors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white`}
            />
            {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('product.category')}
            </label>
            <select
              value={newProduct.categoryId}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setNewProduct({ ...newProduct, categoryId: value });
                setErrors({ ...errors, category: '' });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-luxury-gold ${errors.category ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white`}
            >
              <option value="0">-- {t('product.category')} --</option>
              {categories.map((cat) => (
                <option key={cat.Id} value={cat.Id}>{cat.DisplayName}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('product.brand')}
            </label>
            <select
              value={newProduct.brandId}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setNewProduct({ ...newProduct, brandId: value });
                setErrors({ ...errors, brand: '' });
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-luxury-gold ${errors.brand ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                } dark:bg-gray-700 dark:text-white`}
            >
              <option value="0">-- {t('product.brand')} --</option>
              {brands.map((brand) => (
                <option key={brand.Id} value={brand.Id}>{brand.DisplayName || brand.Name}</option>
              ))}
            </select>
            {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.stock')}
            </label>
            <input
              type="number"
              placeholder="0"
              value={newProduct.stockQuantity}
              onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              checked={newProduct.isOffer}
              onChange={(e) => setNewProduct({ ...newProduct, isOffer: e.target.checked })}
              className="w-4 h-4 rounded"
            />
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('admin.isOffer')}
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Taxes (%)
            </label>
            <input
              type="number"
              placeholder="0"
              value={newProduct.taxes}
              onChange={(e) => setNewProduct({ ...newProduct, taxes: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={newProduct.weight}
              onChange={(e) => setNewProduct({ ...newProduct, weight: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
            />
          </div>
          <textarea
            placeholder={t('product.description')}
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
            rows={2}
          />
        </div>
        <button
          onClick={handleAddProduct}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          {t('admin.add')}
        </button>
      </div>

      {products.map((product) => (
        <div key={product.Id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-start">
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('common.name')}
                  </label>
                  <input
                    type="text"
                    value={productTranslations[product.Id]?.[translationLangs[product.Id] || 'en']?.Name || ''}
                    onChange={(e) => setProductTranslations((prev) => {
                      const key = product.Id;
                      const lang = translationLangs[key] || 'en';
                      const copy = { ...prev };
                      copy[key] = copy[key] || {};
                      copy[key][lang] = { ...(copy[key][lang] || {}), Name: e.target.value };
                      return copy;
                    })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('product.price')}
                  </label>
                  <input
                    type="number"
                    value={product.Price}
                    onChange={(e) => handleUpdateProduct(product.Id, 'Price', parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('product.category')}
                  </label>
                  <select
                    value={product.CategoryId}
                    onChange={(e) => handleUpdateProduct(product.Id, 'CategoryId', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                  >
                    {categories.map((cat) => (
                      <option key={cat.Id} value={cat.Id}>{cat.DisplayName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('product.brand')}
                  </label>
                  <select
                    value={(product as any).BrandId || 0}
                    onChange={(e) => handleUpdateProduct(product.Id, 'BrandId', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                  >
                    <option value="0">-- {t('product.brand')} --</option>
                    {brands.map((brand) => (
                      <option key={brand.Id} value={brand.Id}>{brand.DisplayName || brand.Name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('admin.stock')}
                  </label>
                  <input
                    type="number"
                    value={product.StockQuantity}
                    onChange={(e) => handleUpdateProduct(product.Id, 'StockQuantity', parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Taxes (%)
                  </label>
                  <input
                    type="number"
                    defaultValue={product.Taxes}
                    onBlur={(e) => handleUpdateProduct(product.Id, 'Taxes', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={product.Weigth}
                    onBlur={(e) => handleUpdateProduct(product.Id, 'Weigth', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    {t('admin.productMedia') || 'Product Media'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('admin.mediaUrl')}
                      </label>
                      <input
                        type="text"
                        value={newMediaInputs[product.Id]?.url || ''}
                        onChange={(e) => setNewMediaInputs((prev) => ({
                          ...prev,
                          [product.Id]: {
                            url: e.target.value,
                            isVideo: prev[product.Id]?.isVideo || false,
                          },
                        }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                        placeholder={t('admin.mediaUrlPlaceholder') || 'https://media.example.com/file.jpg'}
                      />
                    </div>
                    <div className="flex items-end gap-3">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={newMediaInputs[product.Id]?.isVideo || false}
                          onChange={(e) => setNewMediaInputs((prev) => ({
                            ...prev,
                            [product.Id]: {
                              url: prev[product.Id]?.url || '',
                              isVideo: e.target.checked,
                            },
                          }))}
                          className="w-4 h-4 rounded"
                        />
                        {t('admin.isVideo')}
                      </label>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <button
                      onClick={() => handleAddMediaItem(product.Id)}
                      className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      {t('admin.addMedia')}
                    </button>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('admin.mediaUrlHint') || 'Use a valid image or video URL for ProductMedia.'}
                    </p>
                  </div>
                </div>

                {productMedia[product.Id] && productMedia[product.Id].length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {t('admin.uploadedMedia') || 'Uploaded Media'} ({productMedia[product.Id].length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {productMedia[product.Id].map((media) => (
                        <div key={media.Id} className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg">
                          {media.isVideo ? (
                            <video controls src={media.MediaUrl} className="w-full h-48 object-cover rounded" />
                          ) : (
                            <img src={media.MediaUrl} alt={`Media ${media.Id}`} className="w-full h-48 object-cover rounded" />
                          )}
                          <div className="mt-3 flex flex-col gap-2">
                            <button
                              onClick={() => toggleMediaVideo(media.Id, product.Id, !media.isVideo)}
                              className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              {media.isVideo ? t('admin.markAsImage') : t('admin.markAsVideo')}
                            </button>
                            <button
                              onClick={() => deleteProductMedia(product.Id, media.Id)}
                              className="w-full bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center justify-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              {t('admin.deleteMedia') || 'Delete'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-300 dark:border-gray-700">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('admin.translations') || 'Translations'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('common.language')}</label>
                    <select
                      value={translationLangs[product.Id] || 'en'}
                      onChange={(e) => setTranslationLangs((prev) => ({ ...prev, [product.Id]: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                    >
                      {langOptions.map((l) => (
                        <option key={l.code} value={l.code}>{l.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.translationName') || t('common.name')}</label>
                    <input
                      type="text"
                      value={productTranslations[product.Id]?.[translationLangs[product.Id] || 'en']?.Name || ''}
                      onChange={(e) => setProductTranslations((prev) => {
                        const key = product.Id;
                        const lang = translationLangs[key] || 'en';
                        const copy = { ...prev };
                        copy[key] = copy[key] || {};
                        copy[key][lang] = { ...(copy[key][lang] || {}), Name: e.target.value };
                        return copy;
                      })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                    />
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 mt-3">{t('admin.translationDescription') || t('product.description')}</label>
                    <textarea
                      value={productTranslations[product.Id]?.[translationLangs[product.Id] || 'en']?.Description || ''}
                      onChange={(e) => setProductTranslations((prev) => {
                        const key = product.Id;
                        const lang = translationLangs[key] || 'en';
                        const copy = { ...prev };
                        copy[key] = copy[key] || {};
                        copy[key][lang] = { ...(copy[key][lang] || {}), Description: e.target.value };
                        return copy;
                      })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                    />
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleSaveTranslation(product.Id)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        {t('admin.saveTranslation') || 'Save Translation'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('product.description')}
                </label>
                <textarea
                  value={productTranslations[product.Id]?.[translationLangs[product.Id] || 'en']?.Description || ''}
                  onChange={(e) => setProductTranslations((prev) => {
                    const key = product.Id;
                    const lang = translationLangs[key] || 'en';
                    const copy = { ...prev };
                    copy[key] = copy[key] || {};
                    copy[key][lang] = { ...(copy[key][lang] || {}), Description: e.target.value };
                    return copy;
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                  rows={3}
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={product.Active}
                    onChange={(e) => handleUpdateProduct(product.Id, 'Active', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  {t('admin.active')}
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={product.IsOffer}
                    onChange={(e) => handleUpdateProduct(product.Id, 'IsOffer', e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  {t('admin.isOffer')}
                </label>
              </div>
            </div>
            <button
              onClick={() => handleDeleteProduct(product.Id)}
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
