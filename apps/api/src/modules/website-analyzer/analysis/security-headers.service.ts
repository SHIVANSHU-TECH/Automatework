import axios from 'axios';
import type { SecurityHeaders } from '../types';

const HEADERS_TO_CHECK = [
  { key: 'strict-transport-security',  label: 'HSTS',                   field: 'hsts'                  },
  { key: 'x-frame-options',            label: 'X-Frame-Options',         field: 'xFrameOptions'          },
  { key: 'x-content-type-options',     label: 'X-Content-Type-Options',  field: 'xContentTypeOptions'   },
  { key: 'content-security-policy',    label: 'Content-Security-Policy', field: 'contentSecurityPolicy' },
  { key: 'referrer-policy',            label: 'Referrer-Policy',         field: 'referrerPolicy'        },
  { key: 'permissions-policy',         label: 'Permissions-Policy',      field: 'permissionsPolicy'     },
];

export async function getSecurityHeaders(url: string): Promise<SecurityHeaders> {
  const missing: string[] = [];
  const present: string[] = [];
  const result: Record<string, boolean> = {};

  try {
    const res = await axios.head(url, {
      timeout: 8000,
      maxRedirects: 5,
      validateStatus: () => true,
      headers: { 'User-Agent': 'ProposalWorks Analyzer/1.0' },
    });

    const headers = res.headers as Record<string, string>;

    for (const h of HEADERS_TO_CHECK) {
      const found = !!headers[h.key];
      result[h.field] = found;
      if (found) present.push(h.label);
      else         missing.push(h.label);
    }
  } catch {
    // If the request fails, all headers are missing
    for (const h of HEADERS_TO_CHECK) {
      result[h.field] = false;
      missing.push(h.label);
    }
  }

  const score = Math.round((present.length / HEADERS_TO_CHECK.length) * 100);

  return {
    hsts:                 result.hsts              ?? false,
    xFrameOptions:        result.xFrameOptions      ?? false,
    xContentTypeOptions:  result.xContentTypeOptions ?? false,
    contentSecurityPolicy:result.contentSecurityPolicy ?? false,
    referrerPolicy:       result.referrerPolicy     ?? false,
    permissionsPolicy:    result.permissionsPolicy  ?? false,
    score,
    missing,
    present,
  };
}
