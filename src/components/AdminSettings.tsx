import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import bcryptjs from 'bcryptjs';
import { supabase } from '../lib/supabase';
import { getSettings, defaultSettings, getBusinessLanguages } from '../data/settings';
import type { BusinessLanguage } from '../data/settings';

export default function AdminSettings({ onSave }: { onSave?: () => void }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [mapLocation, setMapLocation] = useState('');
  const [paypalClientId, setPaypalClientId] = useState('');
  const [languages, setLanguages] = useState<BusinessLanguage[]>([]);
  const [newCode, setNewCode] = useState('');
  const [newLabel, setNewLabel] = useState('');

  useEffect(() => {
    loadSettings();
    loadLanguages();
  }, []);

  const loadSettings = async () => {
    const data = await getSettings();
    setEmail(data.email);
    setPhone(data.phone);
    setAddress(data.address);
    setBusinessName(data.businessName);
    setMapLocation(`${data.latitude}, ${data.longitude}`);
    setPaypalClientId(data.paypalClientId || '');
  };

  const loadLanguages = async () => {
    const data = await getBusinessLanguages();
    setLanguages(data);
  };

  const handleSave = async (field: string, value: any) => {
    const updateData: any = { [field]: value };

    if (field === 'OnlinePassword') {
      updateData[field] = await bcryptjs.hash(value, 10);
    }

    await supabase
      .from('Settings')
      .update(updateData)
      .eq('Id', defaultSettings.id);

    await loadSettings();
    onSave?.();
  };

  const handleLanguageChange = (originalCode: string | undefined, field: keyof BusinessLanguage, value: string) => {
    setLanguages((current) =>
      current.map((language) =>
        language.originalCode === originalCode
          ? { ...language, [field]: field === 'Code' ? value.toLowerCase() : value }
          : language
      )
    );
  };

  const handleAddLanguage = async () => {
    if (!newCode.trim()) return;

    const insertData = {
      IdBusiness: defaultSettings.id,
      Code: newCode.trim().toLowerCase(),
      Label: newLabel.trim() || null,
    };

    await supabase.from('BusinessLanguages').insert([insertData]);
    setNewCode('');
    setNewLabel('');
    await loadLanguages();
  };

  const handleUpdateLanguage = async (language: BusinessLanguage) => {
    const lookupCode = language.originalCode || language.Code;
    await supabase
      .from('BusinessLanguages')
      .update({ Code: language.Code.trim().toLowerCase(), Label: language.Label?.trim() || null })
      .match({ IdBusiness: defaultSettings.id, Code: lookupCode });

    await loadLanguages();
  };

  const handleDeleteLanguage = async (originalCode?: string) => {
    if (!originalCode) return;
    await supabase
      .from('BusinessLanguages')
      .delete()
      .match({ IdBusiness: defaultSettings.id, Code: originalCode });
    await loadLanguages();
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('contact.email')}
        </label>
        <input
          type="email"
          defaultValue={email}
          onBlur={(e) => handleSave('Email', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('contact.phone')}
        </label>
        <input
          type="tel"
          defaultValue={phone}
          onBlur={(e) => handleSave('Phone', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('contact.address')}
        </label>
        <input
          type="text"
          defaultValue={address}
          onBlur={(e) => handleSave('Address', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('admin.businessName')}
        </label>
        <input
          type="text"
          defaultValue={businessName}
          onBlur={(e) => handleSave('BusinessName', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('admin.mapLocation')}
        </label>
        <input
          type="text"
          defaultValue={mapLocation}
          onBlur={(e) => handleSave('MapLocation', e.target.value)}
          placeholder="lat, lng"
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('admin.paypalClientId')}
        </label>
        <input
          type="text"
          defaultValue={paypalClientId}
          onBlur={(e) => handleSave('PaypalClientId', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
        />
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {t('admin.languages')}
        </h2>
        {languages.map((language) => (
          <div key={language.originalCode || language.Code} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('admin.languageCode')}
              </label>
              <input
                type="text"
                value={language.Code}
                onChange={(e) => handleLanguageChange(language.originalCode || language.Code, 'Code', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('admin.languageLabel')}
              </label>
              <input
                type="text"
                value={language.Label || ''}
                onChange={(e) => handleLanguageChange(language.originalCode || language.Code, 'Label', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
              />
            </div>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => handleUpdateLanguage(language)}
                className="inline-flex items-center justify-center px-4 py-2 bg-luxury-gold text-white rounded-lg hover:bg-yellow-500"
              >
                {t('admin.save')}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteLanguage(language.originalCode || language.Code)}
                className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500"
              >
                {t('admin.delete')}
              </button>
            </div>
          </div>
        ))}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.languageCode')}
            </label>
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('admin.languageLabel')}
            </label>
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
            />
          </div>
          <div>
            <button
              type="button"
              onClick={handleAddLanguage}
              className="inline-flex items-center justify-center px-4 py-2 bg-luxury-gold text-white rounded-lg hover:bg-yellow-500"
            >
              {t('admin.addLanguage')}
            </button>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('admin.newPassword')}
        </label>
        <input
          type="password"
          placeholder={t('admin.passwordPlaceholder')}
          onBlur={(e) => {
          if (!e.target.value) return;
          handleSave('OnlinePassword', e.target.value);
          e.target.value = '';
        }}
          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold"
        />
      </div>
    </div>
  );
}
