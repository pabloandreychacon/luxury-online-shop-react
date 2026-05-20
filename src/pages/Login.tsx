import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setLocalError('');
    try {
      const normalized = forgotEmail.toLowerCase().trim();
      const { data, error: dbError } = await supabase
        .from('Profiles')
        .select('Id, FullName')
        .eq('Email', normalized)
        .maybeSingle();

      if (dbError || !data) throw new Error('No account found with that email.');

      const tempPassword = generateTempPassword();
      const hash = await bcrypt.hash(tempPassword, 10);

      await supabase.from('Profiles').update({ PasswordHash: hash }).eq('Id', data.Id);

      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: 'service_s481rtv',
          template_id: 'template_771ecr6',
          user_id: 'L7o6hZUmFJQ_Jbqu0',
          template_params: {
            to_email: normalized,
            from_email: normalized,
            subject: 'Your temporary password',
            message: `Hi ${data.FullName},\n\nYour temporary password is: ${tempPassword}\n\nPlease log in and change your password as soon as possible.`,
            name: data.FullName,
          },
        }),
      });

      setForgotSuccess(true);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {forgotMode ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-luxury text-luxury-gold mb-2">Forgot Password</h1>
              <p className="text-gray-600 dark:text-gray-400">Enter your email and we'll send you a temporary password.</p>
            </div>

            {forgotSuccess ? (
              <div className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 p-4 rounded text-sm text-center">
                Temporary password sent! Check your inbox.
                <button
                  onClick={() => { setForgotMode(false); setForgotSuccess(false); }}
                  className="block mx-auto mt-3 text-luxury-gold font-semibold"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-6">
                {localError && (
                  <div className="bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded text-sm">
                    {localError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold mb-2">{t('auth.email')}</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:border-luxury-gold"
                    placeholder="you@example.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {forgotLoading ? t('common.loading') : 'Send Temporary Password'}
                </button>
                <p className="text-center text-sm">
                  <button
                    type="button"
                    onClick={() => { setForgotMode(false); setLocalError(''); }}
                    className="text-luxury-gold hover:text-opacity-80 transition font-semibold"
                  >
                    Back to Login
                  </button>
                </p>
              </form>
            )}
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-luxury text-luxury-gold mb-2">{t('auth.login')}</h1>
              <p className="text-gray-600 dark:text-gray-400">{t('auth.alreadyHaveAccount')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {(error || localError) && (
                <div className="bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded text-sm">
                  {error || localError}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2">{t('auth.email')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:border-luxury-gold"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">{t('auth.password')}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:border-luxury-gold"
                  placeholder="••••••••"
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setForgotMode(true); setLocalError(''); }}
                  className="text-sm text-luxury-gold hover:text-opacity-80 transition"
                >
                  {t('auth.forgotPassword')}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('common.loading') : t('auth.signIn')}
              </button>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                {t('auth.noAccount')}{' '}
                <Link to="/signup" className="text-luxury-gold hover:text-opacity-80 transition font-semibold">
                  {t('auth.createAccount')}
                </Link>
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
