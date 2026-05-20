import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError(t('profile.passwordMismatch'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('profile.passwordTooShort'));
      return;
    }

    setLoading(true);
    try {
      const { data } = await supabase.from('Profiles').select('PasswordHash').eq('Id', user.id).maybeSingle();
      if (!data) throw new Error(t('profile.userNotFound'));

      const match = await bcrypt.compare(currentPassword, data.PasswordHash);
      if (!match) throw new Error(t('profile.wrongCurrentPassword'));

      const hash = await bcrypt.hash(newPassword, 10);
      await supabase.from('Profiles').update({ PasswordHash: hash }).eq('Id', user.id);

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('profile.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-luxury text-luxury-gold mb-2">{t('profile.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{user.firstName} · {user.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 p-4 rounded text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 p-4 rounded text-sm">
              {t('profile.passwordUpdated')}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">{t('profile.currentPassword')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:border-luxury-gold"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">{t('profile.newPassword')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:border-luxury-gold"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">{t('profile.confirmPassword')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:border-luxury-gold"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('common.loading') : t('profile.updatePassword')}
          </button>
        </form>
      </div>
    </div>
  );
}
