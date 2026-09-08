import {
  MOCK_STATS,
  MOCK_BUSINESSES,
  MOCK_CATEGORIES,
  MOCK_AUDIT_LOGS,
  MOCK_REQUIREMENTS,
  MOCK_REGULATORY
} from './mockData';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('foodsafe_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('foodsafe_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('foodsafe_token');
}

function resolveMockEndpoint(endpoint: string): any {
  const clean = endpoint.split('?')[0];

  if (clean === '/businesses/dashboard/stats') {
    return MOCK_STATS;
  }
  if (clean === '/businesses') {
    return { businesses: MOCK_BUSINESSES };
  }
  if (clean.startsWith('/businesses/')) {
    const id = parseInt(clean.replace('/businesses/', ''), 10);
    const biz = MOCK_BUSINESSES.find(b => b.id === id) || MOCK_BUSINESSES[0];
    return { business: biz, requirements: MOCK_REQUIREMENTS };
  }
  if (clean === '/categories') {
    return { categories: MOCK_CATEGORIES };
  }
  if (clean === '/audit') {
    return { auditLogs: MOCK_AUDIT_LOGS };
  }
  if (clean === '/requirements' || clean.startsWith('/requirements')) {
    return { requirements: MOCK_REQUIREMENTS };
  }
  if (clean === '/regulatory' || clean.startsWith('/regulatory')) {
    return { updates: MOCK_REGULATORY };
  }
  if (clean === '/notifications' || clean.startsWith('/notifications')) {
    return { notifications: [] };
  }
  if (clean === '/evidence' || clean.startsWith('/evidence')) {
    return { documents: [] };
  }
  if (clean === '/templates' || clean.startsWith('/templates')) {
    return { templates: [] };
  }
  return null;
}

export async function apiRequest<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // If body is not FormData, set content-type json
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type') || '';
    // If Vercel rewrote request to HTML index.html, or error status, use mock fallback
    if (contentType.includes('text/html') || !response.ok) {
      const mock = resolveMockEndpoint(endpoint);
      if (mock !== null) {
        return mock as T;
      }
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        try {
          const errorJson = await response.json();
          errorMessage = errorJson.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }
    }

    return await response.json();
  } catch (err: any) {
    const mock = resolveMockEndpoint(endpoint);
    if (mock !== null) {
      return mock as T;
    }
    throw err;
  }
}
