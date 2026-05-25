import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getSettings } from '../data/settings';
import { Button, QRCode } from "luna-components-library";

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [businessName, setBusinessName] = useState('BusinessName');
  const [email, setEmail] = useState('info@businessname.com');
  const [phone, setPhone] = useState('+1 (234) 567-890');
  const [address, setAddress] = useState('123 Fashion Ave, NY');
  const [urlQrCode, setUrlQrCode] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setBusinessName(settings.businessName);
      setEmail(settings.email);
      setPhone(settings.phone);
      setAddress(settings.address);
      setUrlQrCode(settings.finalUrl || '');
    };
    loadSettings();
  }, []);

  return (
    <footer className="bg-gray-900 dark:bg-black text-gray-100 mt-20">
      <div className="container-luxury py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-luxury text-luxury-gold mb-4">{businessName}</h3>
            <p className="text-gray-400 text-sm">
              {t('footer.description')}
            </p>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-luxury text-lg mb-4 text-gray-100">{t('footer.company')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="/about" className="hover:text-luxury-gold transition">{t('footer.about')}</Link></li>
              {/* <li><Link to="#" className="hover:text-luxury-gold transition">{t('footer.careers')}</Link></li>
              <li><Link to="#" className="hover:text-luxury-gold transition">{t('footer.press')}</Link></li> */}
            </ul>
          </div>

          {/* Customer Service */}
          {/* <div>
            <h4 className="font-luxury text-lg mb-4 text-gray-100">{t('footer.customer')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link to="#" className="hover:text-luxury-gold transition">{t('footer.shipping')}</Link></li>
              <li><Link to="#" className="hover:text-luxury-gold transition">{t('footer.returns')}</Link></li>
              <li><Link to="#" className="hover:text-luxury-gold transition">{t('footer.faq')}</Link></li>
            </ul>
          </div> */}

          {/* Contact */}
          <div>
            <h4 className="font-luxury text-lg mb-4 text-gray-100">{t('footer.contact')}</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center space-x-2">
                <Mail size={16} className="text-luxury-gold" />
                <a href={`mailto:${email}`} className="hover:text-luxury-gold transition">{email}</a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone size={16} className="text-luxury-gold" />
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-luxury-gold transition">{phone}</a>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin size={16} className="text-luxury-gold" />
                <span>{address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="flex justify-center space-x-6">
            {/* <a href="#" className="text-gray-400 hover:text-luxury-gold transition">                
                <Button variant="primary" rounded icon="F" size="sm" className='!font-extrabold' />
              </a> */}
            <a href="https://www.instagram.com/luxurywatchgeorge?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw===" className="text-gray-400 hover:text-luxury-gold transition" style={{
              background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285aeb 90%)',
              color: 'white',
              borderRadius: '20%'
            }}>
              {/* use an I for Instagram */}
              <Button variant="none" rounded icon="I" size="sm" className='!font-extrabold' />
            </a>
            {/* tiktok */}
            <a href="https://www.tiktok.com/@luxury.watch464?_r=1&_t=ZS-96Tzh3TfI5Y" className="text-gray-400 hover:text-luxury-gold transition"
              style={{ background: "black", color: 'white', borderRadius: '20%', border: '1px solid white' }}>
              {/* use a T for TikTok */}
              <Button variant="none" rounded icon="t" size="sm" className='!font-extrabold !text-white' />
            </a>
            {/*<a href="#" className="text-gray-400 hover:text-luxury-gold transition">
              <Twitter size={20} />
            </a> */}
          </div>
        </div>

        {/* QR Code Section */}
        {urlQrCode && (
          <div className="border-t border-gray-800 pt-8 flex flex-col justify-between items-center text-sm text-gray-400 mb-5">
            <QRCode value={urlQrCode} size={150} className="mx-auto" />
          </div>
        )}

        {/* Terms of Service */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <p className="text-xs text-gray-500 leading-relaxed text-center max-w-4xl mx-auto">
            {t('footer.termsOfService')}
          </p>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>&copy; {currentYear} {businessName}. {t('footer.allRightsReserved')}</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {/* <Link to="#" className="hover:text-luxury-gold transition">{t('footer.privacy')}</Link>
            <Link to="#" className="hover:text-luxury-gold transition">{t('footer.terms')}</Link> */}
          </div>
        </div>
      </div>
    </footer>
  );
}
