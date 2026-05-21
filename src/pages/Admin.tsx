import { useState, useEffect } from 'react';
import bcryptjs from 'bcryptjs';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { getSettings, defaultSettings } from '../data/settings';
import type { BusinessSettings } from '../data/settings';
import AdminSettings from '../components/AdminSettings';
import AdminProducts from '../components/AdminProducts';
import AdminCategories from '../components/AdminCategories';
import AdminShippingMethods from '../components/AdminShippingMethods';
import AdminOrders from '../components/AdminOrders';
import AdminBrands from '../components/AdminBrands';

export default function Admin() {
  const { t } = useTranslation();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'products' | 'categories' | 'brands' | 'shipping' | 'orders'>('settings');
  const [loading] = useState(false);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await getSettings();
    setSettings(data);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings?.onlinePassword) return;

    const isValid = await bcryptjs.compare(password, settings.onlinePassword);

    if (isValid) {
      setAuthenticated(true);
      setPassword('');
    } else {
      alert(t('auth.invalidPassword'));
    }
  };

  const handleForgotPassword = async () => {
    if (!settings) return;
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashed = await bcryptjs.hash(tempPassword, 10);

    try {
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: 'service_s481rtv',
          template_id: 'template_771ecr6',
          user_id: 'L7o6hZUmFJQ_Jbqu0',
          template_params: {
            to_email: settings.email,
            from_email: settings.email,
            subject: 'Password Reset - Admin',
            message: `Your temporary admin password is: ${tempPassword}\n\nUse this to access the Admin panel. Change it immediately after logging in.`,
            name: settings.businessName
          }
        })
      });

      await supabase
        .from('Settings')
        .update({ OnlinePassword: hashed })
        .eq('Id', defaultSettings.id);

      await loadSettings();
      alert(t('auth.passwordSent'));
      setShowForgotPassword(false);
    } catch (error) {
      alert(t('auth.emailError'));
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-luxury mb-6 text-gray-900 dark:text-white">
            {t('admin.access')}
          </h1>
          {!showForgotPassword ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-luxury-gold text-luxury-dark py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
              >
                {t('auth.login')}
              </button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="w-full text-luxury-gold hover:text-opacity-80 text-sm"
              >
                {t('auth.forgotPassword')}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('auth.tempPasswordInfo')}
              </p>
              <button
                onClick={handleForgotPassword}
                className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                {t('auth.sendTempPassword')}
              </button>
              <button
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-gray-600 hover:text-gray-700 text-sm"
              >
                {t('common.back')}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-luxury text-gray-900 dark:text-white">
            {t('admin.panel')}
          </h1>
          <button
            onClick={() => setAuthenticated(false)}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('auth.logout')}
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'settings'
              ? 'bg-luxury-gold text-luxury-dark'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
          >
            {t('admin.settings')}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'categories'
              ? 'bg-luxury-gold text-luxury-dark'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
          >
            {t('admin.categories')}
          </button>
          <button
            onClick={() => setActiveTab('brands')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'brands'
              ? 'bg-luxury-gold text-luxury-dark'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
          >
            {t('admin.brands')}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'products'
              ? 'bg-luxury-gold text-luxury-dark'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
          >
            {t('admin.products')}
          </button>

          <button
            onClick={() => setActiveTab('shipping')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'shipping'
              ? 'bg-luxury-gold text-luxury-dark'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
          >
            {t('admin.shipping')}
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === 'orders'
              ? 'bg-luxury-gold text-luxury-dark'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
          >
            {t('admin.orders')}
          </button>
        </div>

        {activeTab === 'settings' && <AdminSettings onSave={loadSettings} />}
        {activeTab === 'products' && <AdminProducts />}
        {activeTab === 'categories' && <AdminCategories />}
        {activeTab === 'brands' && <AdminBrands />}
        {activeTab === 'shipping' && <AdminShippingMethods />}
        {activeTab === 'orders' && <AdminOrders />}

        {loading && (
          <div className="text-center text-gray-600 dark:text-gray-300">
            {t('common.saving')}
          </div>
        )}
      </div>
    </div>
  );
}
