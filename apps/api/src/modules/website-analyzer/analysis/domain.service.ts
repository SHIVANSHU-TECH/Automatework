import type { DomainInfo } from '../types';

export async function getDomainInfo(hostname: string): Promise<DomainInfo | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const whois = require('whois-json') as (domain: string) => Promise<Record<string, string>>;
    const data  = await Promise.race([
      whois(hostname),
      new Promise<null>((_, r) => setTimeout(() => r(new Error('WHOIS timeout')), 8000)),
    ]);

    if (!data || typeof data !== 'object') return null;

    const raw = data as Record<string, string>;

    // Try multiple field names (registrars use different formats)
    const created = raw.creationDate ?? raw.createdDate ?? raw['creation date'] ??
                    raw.registered ?? raw['Registration Time'] ?? null;
    const expires = raw.expirationDate ?? raw.expiryDate ?? raw['expiry date'] ??
                    raw.registryExpiryDate ?? raw['Expiration Time'] ?? null;
    const registrar = raw.registrar ?? raw['Registrar'] ?? raw['sponsoring registrar'] ?? null;
    const registrant = raw.registrantOrganization ?? raw['Registrant Organization'] ??
                       raw.registrantName ?? raw['Registrant Name'] ?? null;

    let domainAgeMonths: number | undefined;
    let domainAge: string | undefined;
    let isExpiringSoon: boolean | undefined;

    if (created) {
      const createdDate = new Date(created);
      if (!isNaN(createdDate.getTime())) {
        const now = new Date();
        const diffMs   = now.getTime() - createdDate.getTime();
        const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const years     = Math.floor(totalDays / 365);
        const months    = Math.floor((totalDays % 365) / 30);
        domainAgeMonths = years * 12 + months;
        domainAge       = years > 0 ? `${years} year${years > 1 ? 's' : ''} ${months} month${months !== 1 ? 's' : ''}` : `${months} month${months !== 1 ? 's' : ''}`;
      }
    }

    if (expires) {
      const expiryDate = new Date(expires);
      if (!isNaN(expiryDate.getTime())) {
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        isExpiringSoon = daysUntilExpiry <= 90 && daysUntilExpiry > 0;
      }
    }

    return {
      domainAge,
      domainAgeMonths,
      registrar: registrar ?? undefined,
      createdAt: created ?? undefined,
      expiresAt: expires ?? undefined,
      registrant: registrant ?? undefined,
      isExpiringSoon,
    };
  } catch {
    return null;
  }
}
