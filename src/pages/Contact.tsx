import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin } from 'lucide-react';
import { getSettings } from '../data/settings';

export default function Contact() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const loadSettings = async () => {
      const settings = await getSettings();
      setBusinessEmail(settings.email);
      setPhone(settings.phone);
      setAddress(settings.address);
      setLatitude(settings.latitude);
      setLongitude(settings.longitude);
    };
    loadSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    setSuccess(false);

    try {
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: 'service_s481rtv',
          template_id: 'template_771ecr6',
          user_id: 'L7o6hZUmFJQ_Jbqu0',
          template_params: {
            to_email: businessEmail,
            subject: formData.subject,
            message: formData.message,
            name: formData.name,
            from_email: formData.email
          }
        })
      });
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-20">
      <div className="container-luxury max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="font-luxury text-4xl mb-4">{t('contact.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="card-luxury p-8 rounded-lg">
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 rounded">
              {t('common.success')} - {t('contact.successMessage')}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">{t('contact.name')}</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:border-luxury-gold"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">{t('contact.email')}</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:border-luxury-gold"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">{t('contact.subject')}</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:border-luxury-gold"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">{t('contact.message')}</label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:border-luxury-gold resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? t('common.loading') : t('contact.sendMessage')}
            </button>
          </form>
        </div>

        {/* Contact Info & Map */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="card-luxury p-8 rounded-lg">
            <h2 className="font-luxury text-2xl mb-6">{t('footer.contact')}</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="text-luxury-gold mt-1" size={20} />
                <div>
                  <p className="font-semibold">{t('contact.email')}</p>
                  <a href={`mailto:${businessEmail}`} className="text-gray-600 dark:text-gray-400 hover:text-luxury-gold">
                    {businessEmail}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="text-luxury-gold mt-1" size={20} />
                <div>
                  <p className="font-semibold">{t('contact.phone')}</p>
                  <a href={`tel:${phone}`} className="text-gray-600 dark:text-gray-400 hover:text-luxury-gold">
                    {phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="text-luxury-gold mt-1" size={20} />
                <div>
                  <p className="font-semibold">{t('contact.address')}</p>
                  <p className="text-gray-600 dark:text-gray-400">{address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="card-luxury p-8 rounded-lg">
            <h2 className="font-luxury text-2xl mb-6">{t('contact.location')}</h2>
            <div className="aspect-video rounded-lg overflow-hidden mb-4">
              <iframe
                src={`https://www.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
              />
            </div>
            <a
              href={`https://www.google.com/maps?q=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full text-center inline-block"
            >
              {t('contact.openInMaps')}
            </a>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
