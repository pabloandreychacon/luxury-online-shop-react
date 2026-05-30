import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Preloader } from 'luna-components-library';

interface Session {
  id: number;
  created_at: string;
  device_type: string;
  os_name: string;
  browser_name: string;
  browser_language: string;
  timezone: string;
  country_region: string;
  traffic_referrer: string;
}

interface Interaction {
  id: number;
  created_at: string;
  session_id: number;
  interaction_type: string;
  url_path: string;
  url_query: any;
  page_title: string;
  page_url_path: string;
  element_type: string;
  element_name: string;
  element_value: string;
}

export default function AdminAnalytics() {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);
  const today = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [interactionTypes, setInteractionTypes] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    cleanupOldData();
    loadTypes();
  }, []);

  useEffect(() => {
    loadData();
  }, [dateFrom, dateTo, typeFilter]);

  const cleanupOldData = async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('analytics_interactions').delete().lt('created_at', weekAgo);
    await supabase.from('analytics_sessions').delete().lt('created_at', weekAgo);
  };

  useEffect(() => {
    loadData();
  }, [typeFilter]);

  const loadTypes = async () => {
    const { data } = await supabase
      .from('analytics_interactions')
      .select('interaction_type')
      .order('interaction_type', { ascending: true });
    const types = [...new Set((data || []).map((r: any) => r.interaction_type))].sort();
    setInteractionTypes(types);
  };

  const loadData = async () => {
    setLoading(true);
    const toEnd = dateTo ? dateTo + 'T23:59:59.999Z' : undefined;
    let sessionsQuery = supabase.from('analytics_sessions').select('*');
    if (dateFrom) sessionsQuery = sessionsQuery.gte('created_at', dateFrom + 'T00:00:00Z');
    if (toEnd) sessionsQuery = sessionsQuery.lte('created_at', toEnd);
    sessionsQuery = sessionsQuery.order('created_at', { ascending: false });
    const { data: sessionsData } = await sessionsQuery;
    setSessions(sessionsData || []);

    let interactionsQuery = supabase.from('analytics_interactions').select('*');
    if (dateFrom) interactionsQuery = interactionsQuery.gte('created_at', dateFrom + 'T00:00:00Z');
    if (toEnd) interactionsQuery = interactionsQuery.lte('created_at', toEnd);
    if (typeFilter) interactionsQuery = interactionsQuery.eq('interaction_type', typeFilter);
    interactionsQuery = interactionsQuery.order('created_at', { ascending: false });
    const { data: interactionsData } = await interactionsQuery;
    setInteractions(interactionsData || []);
    setLoading(false);
  };

  if (loading) return <Preloader isLoading={loading} backgroundColor="#0f0f0f" accentColor="#d4af37" size={70} borderWidth={3} />;

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('admin.filters')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('common.from')}</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('common.to')}</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('admin.analyticsFilterType')}</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-luxury-gold">
              <option value="">{t('admin.analyticsTypeAll')}</option>
              {interactionTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('admin.sessions')} ({sessions.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">{t('common.id')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('common.date')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.deviceType')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.os')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.browser')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.lang')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.timezone')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.region')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.referrer')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {sessions.length === 0 ? (
                <tr><td colSpan={9} className="px-3 py-8 text-center text-gray-500">{t('common.noResults')}</td></tr>
              ) : sessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{s.id}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{String(s.created_at).replace('T', ' ').replace(/\.\d+/, '').replace(/\+00:00/, ' UTC')}</td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{s.device_type}</td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{s.os_name}</td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{s.browser_name}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{s.browser_language}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{s.timezone}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{s.country_region}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400 max-w-[150px] truncate" title={s.traffic_referrer}>{s.traffic_referrer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('admin.interactions')} ({interactions.length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">{t('common.id')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('common.date')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.session')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.analyticsFilterType')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.element')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('common.name')}</th>
                <th className="px-3 py-2 text-left font-semibold">{t('admin.url')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {interactions.length === 0 ? (
                <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-500">{t('common.noResults')}</td></tr>
              ) : interactions.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{i.id}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{String(i.created_at).replace('T', ' ').replace(/\.\d+/, '').replace(/\+00:00/, ' UTC')}</td>
                  <td className="px-3 py-2 text-luxury-gold">{i.session_id}</td>
                  <td className="px-3 py-2"><span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">{i.interaction_type}</span></td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white">{i.element_type}</td>
                  <td className="px-3 py-2 text-gray-900 dark:text-white max-w-[200px] truncate" title={i.element_name}>{i.element_name}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400 max-w-[150px] truncate" title={i.url_path}>{i.url_path}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
