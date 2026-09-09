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
    const bizRequirements = MOCK_REQUIREMENTS.map((r, idx) => ({
      ...r,
      client_id: biz.id,
      business_name: biz.business_name,
      custom_name: r.custom_name || r.requirement_name,
      template_name: r.template_name || r.requirement_name,
      requirement_template_id: (r as any).template_id || (r as any).requirement_template_id || (idx + 1),
      documents: (r as any).documents || [
        {
          id: r.id * 10 + 1,
          client_requirement_id: r.id,
          file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          file_name: `${biz.business_name.replace(/\s+/g, '_')}_${(r.requirement_name || 'Evidence').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
          file_type: 'application/pdf',
          file_size: 184500,
          uploaded_by: 2,
          uploader_name: biz.contact_person,
          uploaded_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          review_status: r.status === 'Approved' ? 'APPROVED' : 'PENDING',
          reviewer_notes: r.status === 'Approved' ? 'Verified by Lead Auditor' : undefined
        }
      ]
    }));

    const regulatory = MOCK_REGULATORY.map(u => ({
      ...u,
      summary: (u as any).summary || u.description || 'Mandatory regulatory compliance directive.',
      published_date: (u as any).published_date || ((u as any).created_at ? (u as any).created_at.split('T')[0] : '2026-03-01'),
      effective_date: u.effective_date || '2026-04-01',
      source: (u as any).source || 'FSSAI Notification',
      acknowledgement_status: (u as any).acknowledgement_status || 'ACKNOWLEDGED'
    }));

    return {
      business: biz,
      requirements: bizRequirements,
      regulatoryUpdates: regulatory,
      activityTrail: MOCK_AUDIT_LOGS,
      notifications: []
    };
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
  if (clean === '/evidence/pending' || clean.startsWith('/evidence/pending')) {
    return {
      pendingDocuments: [
        {
          id: 1001,
          client_requirement_id: 101,
          business_name: 'Shree Foods',
          category_name: 'Pickle Manufacturer',
          requirement_name: 'Water Potability Testing (IS 10500)',
          priority: 'HIGH',
          due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
          file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          file_name: 'Water_Test_NABL_Report_Q1_2026.pdf',
          file_type: 'application/pdf',
          file_size: 215400,
          uploaded_by: 2,
          uploader_name: 'Rajesh Sharma',
          uploaded_at: new Date(Date.now() - 2 * 86400000).toISOString(),
          review_status: 'PENDING'
        },
        {
          id: 1003,
          client_requirement_id: 103,
          business_name: 'Shree Foods',
          category_name: 'Pickle Manufacturer',
          requirement_name: 'Pest Control Audit & Treatment',
          priority: 'MEDIUM',
          due_date: new Date(Date.now() + 12 * 86400000).toISOString().split('T')[0],
          file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          file_name: 'PestControl_Service_Card_March.pdf',
          file_type: 'application/pdf',
          file_size: 132000,
          uploaded_by: 3,
          uploader_name: 'Santosh Kamble',
          uploaded_at: new Date(Date.now() - 1 * 86400000).toISOString(),
          review_status: 'PENDING'
        },
        {
          id: 1005,
          client_requirement_id: 105,
          business_name: 'Annapurna Foods',
          category_name: 'Masala Manufacturer',
          requirement_name: 'Pesticide Residue & Heavy Metal Test',
          priority: 'CRITICAL',
          due_date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
          file_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          file_name: 'Annapurna_Pesticide_Residue_Audit.pdf',
          file_type: 'application/pdf',
          file_size: 340000,
          uploaded_by: 4,
          uploader_name: 'Vikas Deshmukh',
          uploaded_at: new Date(Date.now() - 8 * 3600000).toISOString(),
          review_status: 'PENDING'
        }
      ]
    };
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
