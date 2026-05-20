import { useTranslation } from 'react-i18next';
import { Menu, X, ShoppingBag, Heart, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWishlist } from '../context/WishlistContext';
import { getSettings, getBusinessLanguages } from '../data/settings';

export default function Header() {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const defaultLangOptions = [
    { code: 'en', label: '🇺🇸 EN' },
    { code: 'es', label: '🇪🇸 ES' },
    { code: 'zh', label: '🇨🇳 中文' },
  ];
  const [businessName, setBusinessName] = useState('Costa Rica Luxury');
  const [langOptions, setLangOptions] = useState(defaultLangOptions);
  const { itemCount } = useCart();
  const { itemCount: wishlistCount } = useWishlist();
  const { user, logout } = useAuth();
  const { isDark, toggleDarkMode } = useTheme();

  useEffect(() => {
    const loadBusinessName = async () => {
      const settings = await getSettings();
      setBusinessName(settings.businessName);
    };
    loadBusinessName();
  }, []);

  useEffect(() => {
    const loadLanguageOptions = async () => {
      const languages = await getBusinessLanguages();
      if (languages.length > 0) {
        const loadedOptions = languages.map((lang) => ({
          code: lang.Code,
          label: lang.Label?.trim() || lang.Code.toUpperCase(),
        }));
        if (!loadedOptions.some((opt) => opt.code === i18n.language)) {
          const fallback = defaultLangOptions.find((opt) => opt.code === i18n.language);
          if (fallback) {
            loadedOptions.push(fallback);
          }
        }
        setLangOptions(loadedOptions);
      }
    };

    loadLanguageOptions();
  }, [i18n.language]);

  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-luxury-dark border-b border-gray-200 dark:border-gray-800">
      <div className="container-luxury py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-2xl font-luxury text-luxury-gold">{businessName}</h1>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-luxury-gold transition">
              {t('nav.home')}
            </Link>
            <Link to="/shop" className="text-gray-700 dark:text-gray-300 hover:text-luxury-gold transition">
              {t('nav.shop')}
            </Link>
            <Link to="/about" className="text-gray-700 dark:text-gray-300 hover:text-luxury-gold transition">
              {t('nav.about')}
            </Link>
            <Link to="/contact" className="text-gray-700 dark:text-gray-300 hover:text-luxury-gold transition">
              {t('nav.contact')}
            </Link>
            <Link to="/admin" className="text-gray-700 dark:text-gray-300 hover:text-luxury-gold transition">
              Admin
            </Link>
          </nav>

          {/* Right Icons */}
          <div className="flex items-center space-x-4">
            {/* Language Select */}
            <select
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="text-sm font-semibold bg-transparent text-gray-700 dark:text-gray-300 hover:text-luxury-gold focus:outline-none cursor-pointer"
            >
              {langOptions.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </select>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="hidden md:inline-flex p-2 text-gray-700 dark:text-gray-300 hover:text-luxury-gold transition"
              title={t('common.darkMode')}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Wishlist */}
            <Link to="/wishlist" className="hidden md:inline-flex relative p-2 text-gray-700 dark:text-gray-300 hover:text-luxury-gold transition">
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-luxury-gold text-luxury-dark text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link to="/cart" className="hidden md:inline-flex relative p-2 text-gray-700 dark:text-gray-300 hover:text-luxury-gold transition">
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-luxury-gold text-luxury-dark text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Account */}
            {user ? (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/orders" className="text-sm text-gray-700 dark:text-gray-300 hover:text-luxury-gold transition">
                  Orders
                </Link>
                <span className="text-sm text-gray-700 dark:text-gray-300">{user.firstName}</span>
                <button
                  onClick={() => logout()}
                  className="text-sm text-gray-700 dark:text-gray-300 hover:text-luxury-gold transition"
                >
                  {t('nav.logout')}
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden md:inline-flex text-sm text-gray-700 dark:text-gray-300 hover:text-luxury-gold transition">
                {t('nav.account')}
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 text-gray-700 dark:text-gray-300"
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {menuOpen && (
          <nav className="md:hidden mt-4 pb-4 border-t border-gray-200 dark:border-gray-800 pt-4 space-y-4">
            <Link to="/" onClick={() => setMenuOpen(false)} className="block text-gray-700 dark:text-gray-300 hover:text-luxury-gold">
              {t('nav.home')}
            </Link>
            <Link to="/shop" onClick={() => setMenuOpen(false)} className="block text-gray-700 dark:text-gray-300 hover:text-luxury-gold">
              {t('nav.shop')}
            </Link>
            <Link to="/about" onClick={() => setMenuOpen(false)} className="block text-gray-700 dark:text-gray-300 hover:text-luxury-gold">
              {t('nav.about')}
            </Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)} className="block text-gray-700 dark:text-gray-300 hover:text-luxury-gold">
              {t('nav.contact')}
            </Link>
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="block text-gray-700 dark:text-gray-300 hover:text-luxury-gold">
              Admin
            </Link>
            <Link to="/wishlist" onClick={() => setMenuOpen(false)} className="block text-gray-700 dark:text-gray-300 hover:text-luxury-gold">
              {t('nav.wishlist')}
            </Link>
            <Link to="/cart" onClick={() => setMenuOpen(false)} className="block text-gray-700 dark:text-gray-300 hover:text-luxury-gold">
              {t('nav.cart')}
            </Link>
            {user ? (
              <>
                <Link to="/orders" onClick={() => setMenuOpen(false)} className="block text-gray-700 dark:text-gray-300 hover:text-luxury-gold">
                  Orders
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left block text-gray-700 dark:text-gray-300 hover:text-luxury-gold"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-gray-700 dark:text-gray-300 hover:text-luxury-gold">
                {t('nav.account')}
              </Link>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
