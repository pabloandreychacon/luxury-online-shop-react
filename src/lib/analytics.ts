import { supabase } from './supabase';

let currentSessionId: number | null = null;

function detectDeviceType(): string {
  const ua = navigator.userAgent;
  if (/mobile|android|iphone|ipad|ipod/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

function detectOS(): string {
  const ua = navigator.userAgent;
  if (/windows/i.test(ua)) return 'Windows';
  if (/mac os|macintosh/i.test(ua)) return 'macOS';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (/edge|edg\//i.test(ua)) return 'Edge';
  if (/chrome|crios\//i.test(ua)) return 'Chrome';
  if (/firefox|fxios\//i.test(ua)) return 'Firefox';
  if (/safari\//i.test(ua)) return 'Safari';
  if (/opera|opr\//i.test(ua)) return 'Opera';
  return 'Unknown';
}

function getCountryFromTimezone(): string {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (tz.includes('America/')) return 'Americas';
  if (tz.includes('Europe/')) return 'Europe';
  if (tz.includes('Asia/')) return 'Asia';
  if (tz.includes('Africa/')) return 'Africa';
  if (tz.includes('Australia/') || tz.includes('Pacific/')) return 'Oceania';
  return 'Unknown';
}

export async function createSession(): Promise<number | null> {
  try {
    const deviceType = detectDeviceType();
    const osName = detectOS();
    const browserName = detectBrowser();
    const browserLanguage = navigator.language;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryRegion = getCountryFromTimezone();
    const trafficReferrer = document.referrer || null;

    const { data, error } = await supabase
      .from('analytics_sessions')
      .insert({
        device_type: deviceType,
        os_name: osName,
        browser_name: browserName,
        browser_language: browserLanguage,
        timezone,
        country_region: countryRegion,
        traffic_referrer: trafficReferrer,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Analytics session error:', error);
      return null;
    }

    currentSessionId = data.id;
    return data.id;
  } catch (err) {
    console.error('Analytics session error:', err);
    return null;
  }
}

export async function trackInteraction(data: {
  interactionType: string;
  elementType?: string;
  elementName?: string;
  elementValue?: string;
}) {
  const sessionId = currentSessionId;
  if (!sessionId) return;

  try {
    await supabase.from('analytics_interactions').insert({
      session_id: sessionId,
      interaction_type: data.interactionType,
      url_path: window.location.pathname,
      url_query: Object.fromEntries(new URLSearchParams(window.location.search)),
      page_title: document.title,
      page_url_path: window.location.pathname,
      element_type: data.elementType || null,
      element_name: data.elementName || null,
      element_value: data.elementValue || null,
    });
  } catch (err) {
    console.error('Analytics interaction error:', err);
  }
}
