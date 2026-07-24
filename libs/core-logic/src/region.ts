/**
 * Region & currency logic for the two launch markets:
 *   - Kinshasa, RD Congo → CDF (franc congolais)
 *   - Cotonou, Bénin     → XOF (franc CFA UEMOA)
 *
 * Zero dependencies — safe for mobile, web, and Cloud Functions.
 * Every amount in the platform must be displayed through formatMoney()
 * so CDF and XOF never get mixed up again.
 */

export type CurrencyCode = 'CDF' | 'XOF' | 'USD';
export type CountryCode = 'CD' | 'BJ';
export type RegionId = 'kinshasa' | 'cotonou';

export interface MobileMoneyProvider {
    id: string;
    label: string;
    /** PawaPay correspondent identifier used by the payout function. */
    pawaPayCorrespondent: string;
}

export interface Region {
    id: RegionId;
    city: string;
    country: CountryCode;
    countryLabel: string;
    currency: CurrencyCode;
    /** BCP-47 locale used for number/date formatting. */
    locale: string;
    phonePrefix: string;
    timezone: string;
    mobileMoneyProviders: MobileMoneyProvider[];
}

export const REGIONS: Record<RegionId, Region> = {
    kinshasa: {
        id: 'kinshasa',
        city: 'Kinshasa',
        country: 'CD',
        countryLabel: 'RD Congo',
        currency: 'CDF',
        locale: 'fr-CD',
        phonePrefix: '+243',
        timezone: 'Africa/Kinshasa',
        mobileMoneyProviders: [
            { id: 'mpesa-cd', label: 'M-Pesa (Vodacom)', pawaPayCorrespondent: 'VODACOM_MPESA_COD' },
            { id: 'airtel-cd', label: 'Airtel Money', pawaPayCorrespondent: 'AIRTEL_COD' },
            { id: 'orange-cd', label: 'Orange Money', pawaPayCorrespondent: 'ORANGE_COD' },
        ],
    },
    cotonou: {
        id: 'cotonou',
        city: 'Cotonou',
        country: 'BJ',
        countryLabel: 'Bénin',
        currency: 'XOF',
        locale: 'fr-BJ',
        phonePrefix: '+229',
        timezone: 'Africa/Porto-Novo',
        mobileMoneyProviders: [
            { id: 'mtn-bj', label: 'MTN MoMo', pawaPayCorrespondent: 'MTN_MOMO_BEN' },
            { id: 'moov-bj', label: 'Moov Money', pawaPayCorrespondent: 'MOOV_BEN' },
        ],
    },
};

export const DEFAULT_REGION_ID: RegionId = 'kinshasa';

export function getRegion(id?: RegionId | null): Region {
    return REGIONS[id ?? DEFAULT_REGION_ID];
}

/** Resolve the region a currency belongs to (CDF → Kinshasa, XOF → Cotonou). */
export function regionForCurrency(currency?: string | null): Region {
    const match = Object.values(REGIONS).find((r) => r.currency === currency);
    return match ?? REGIONS[DEFAULT_REGION_ID];
}

/**
 * Format an amount for display. CDF and XOF are zero-decimal in daily use.
 * e.g. formatMoney(125000, 'CDF') → "125 000 FC"
 */
export function formatMoney(
    amount: number,
    currency: CurrencyCode = 'CDF',
    locale?: string,
): string {
    const resolvedLocale = locale ?? regionForCurrency(currency).locale;
    const fractionDigits = currency === 'USD' ? 2 : 0;
    try {
        return new Intl.NumberFormat(resolvedLocale, {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: fractionDigits,
        }).format(amount);
    } catch {
        // Hermes/older engines without full ICU currency data
        return `${Math.round(amount).toLocaleString('fr-FR')} ${currency}`;
    }
}

const COMPACT_SYMBOLS: Record<CurrencyCode, string> = {
    CDF: 'FC',
    XOF: 'F CFA',
    USD: '$',
};

/**
 * Compact form for KPI tiles and dashboards, e.g. "1,2 M FC".
 * Implemented manually — Hermes' Intl does not reliably support
 * `notation: 'compact'` on all Android versions in the field.
 */
export function formatMoneyCompact(amount: number, currency: CurrencyCode = 'CDF'): string {
    const symbol = COMPACT_SYMBOLS[currency];
    const abs = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    const one = (v: number) =>
        v.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
    if (abs >= 1_000_000_000) return `${sign}${one(abs / 1_000_000_000)} Md ${symbol}`;
    if (abs >= 1_000_000) return `${sign}${one(abs / 1_000_000)} M ${symbol}`;
    if (abs >= 10_000) return `${sign}${one(abs / 1_000)} k ${symbol}`;
    return `${sign}${Math.round(abs).toLocaleString('fr-FR')} ${symbol}`;
}

/**
 * Loose MSISDN sanity check for payout targets in the two markets.
 * Accepts local (e.g. "0812345678") or international ("+243812345678") forms.
 */
export function isPlausibleMsisdn(phone: string, region: Region): boolean {
    const digits = phone.replace(/\D/g, '');
    const cc = region.phonePrefix.replace(/\D/g, '');
    if (digits.startsWith(cc)) {
        const national = digits.slice(cc.length);
        return national.length >= 8 && national.length <= 10;
    }
    return digits.length >= 8 && digits.length <= 10;
}
