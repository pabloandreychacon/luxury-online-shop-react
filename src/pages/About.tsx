import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { getSettings } from '../data/settings';

export default function About() {
  const { t } = useTranslation();
  const [businessName, setBusinessName] = useState('Costa Rica Luxury');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const loadSettings = async () => {
      const settings = await getSettings();
      setBusinessName(settings.businessName);
    };
    loadSettings();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-20">
      <div className="container-luxury max-w-3xl">
        <div className="text-center mb-16">
          <h1 className="font-luxury text-5xl mb-6">{t('about.title')}</h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {t('about.subtitle', { businessName })}
          </p>
        </div>

        <div className="space-y-12">
          <section>
            <h2 className="font-luxury text-3xl mb-4">{t('about.missionTitle')}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t('about.missionText', { businessName })}
            </p>
          </section>

          <section>
            <h2 className="font-luxury text-3xl mb-4">{t('about.qualityTitle')}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t('about.qualityText')}
            </p>
          </section>

          <section>
            <h2 className="font-luxury text-3xl mb-4">{t('about.commitmentTitle')}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t('about.commitmentText')}
            </p>
          </section>

          <section className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg">
            <h2 className="font-luxury text-2xl mb-4">{t('about.whyChooseTitle', { businessName })}</h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold">✓</span>
                <span>{t('about.reason1')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold">✓</span>
                <span>{t('about.reason2')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold">✓</span>
                <span>{t('about.reason3')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold">✓</span>
                <span>{t('about.reason4')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold">✓</span>
                <span>{t('about.reason5')}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-luxury-gold">✓</span>
                <span>{t('about.reason6')}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
