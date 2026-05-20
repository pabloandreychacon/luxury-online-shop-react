import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import AddToCartModal from './components/AddToCartModal';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';
import { getSettings } from './data/settings';
import { WhatsApp } from "luna-components-library";
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Contact from './pages/Contact';
import About from './pages/About';
import Admin from './pages/Admin';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';

function AppContent() {
  const { showModal, lastAddedProduct, closeModal, loadFromStorage, loadFromSupabase } = useCartStore();
  const { checkAuth, user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const { i18n, t } = useTranslation();
  const [whatsappPhone, setWhatsappPhone] = useState('');

  useEffect(() => {
    checkAuth();
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (user?.id) loadFromSupabase(user.id);
  }, [user?.id]);

  useEffect(() => {
    const lang = searchParams.get('lang');
    if (lang && (lang === 'en' || lang === 'es' || lang === 'zh')) i18n.changeLanguage(lang);
  }, [searchParams, i18n]);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSettings();
      setWhatsappPhone((settings.phone || '').replace(/\D/g, ''));
    };
    loadSettings();
  }, []);

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
          </Routes>
        </main>
        <Footer />
        <ScrollToTop />
      </div>
      <AddToCartModal
        isOpen={showModal}
        onClose={closeModal}
        productName={lastAddedProduct}
      />
      {whatsappPhone && (
        <WhatsApp className="fixed bottom-4 right-4"
          phone={whatsappPhone}
          message={t('contact.whatsappMessage')}
          position="bottom-left"
          tooltipText={t('contact.whatsapp')}
          zIndex={9999}
        />
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
