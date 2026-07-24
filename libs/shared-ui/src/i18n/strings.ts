/**
 * FarmTrust string catalog — French-first.
 *
 * French is the working language of both launch markets (Kinshasa, Cotonou);
 * English is a secondary locale for diaspora investors. The French catalog is
 * canonical: its keys define the StringKey type, and any missing English entry
 * falls back to French at runtime.
 *
 * Interpolation: "Semaine {n}" + t('farm.weekN', locale, { n: 3 }).
 */

export type Locale = 'fr' | 'en';

export const DEFAULT_LOCALE: Locale = 'fr';

const fr = {
    // Common
    'common.appName': 'FarmTrust',
    'common.loading': 'Chargement…',
    'common.error': 'Une erreur est survenue',
    'common.retry': 'Réessayer',
    'common.cancel': 'Annuler',
    'common.save': 'Enregistrer',
    'common.submit': 'Soumettre',
    'common.confirm': 'Confirmer',
    'common.close': 'Fermer',
    'common.back': 'Retour',
    'common.seeAll': 'Tout voir',
    'common.offline': 'Hors ligne — vos données seront synchronisées automatiquement',
    'common.pendingSync': '{count} élément(s) en attente d’envoi',
    'common.signIn': 'Se connecter',
    'common.signOut': 'Se déconnecter',
    'common.signUp': 'Créer un compte',

    // Navigation
    'nav.home': 'Accueil',
    'nav.site': 'Chantier',
    'nav.tools': 'Outils',
    'nav.dashboard': 'Tableau de bord',
    'nav.overview': 'Vue d’ensemble',
    'nav.watchtower': 'Surveillance',
    'nav.approvals': 'Validations',
    'nav.construction': 'Construction',
    'nav.legal': 'Juridique',
    'nav.portfolio': 'Portefeuille',

    // Task statuses (canonical labels, used by getTaskStatusDisplay)
    'status.pending': 'En attente',
    'status.inReview': 'En révision',
    'status.completed': 'Terminé',
    'status.rejected': 'Rejeté',

    // Tasks
    'task.myTasks': 'Mes tâches',
    'task.noTasks': 'Aucune tâche pour le moment',
    'task.detail': 'Détail de la tâche',
    'task.due': 'Échéance',
    'task.payout': 'Paiement',
    'task.submitReview': 'Soumettre pour validation',
    'task.approvePay': 'Approuver et payer',
    'task.evidence': 'Preuves',
    'task.addPhoto': 'Prendre une photo',
    'task.retakePhoto': 'Reprendre',
    'task.evidenceQueued': 'En file d’attente — envoi dès que le réseau revient',
    'task.downloadDeed': 'Télécharger l’acte numérique',
    'task.overdue': 'En retard',

    // Field tools
    'tools.title': 'Outils de terrain',
    'tools.measureLand': 'Mesurer le terrain',
    'tools.measureLandDesc': 'Marchez le long des limites pour mesurer la parcelle (GPS)',
    'tools.cropScan': 'Scanner les cultures',
    'tools.cropScanDesc': 'Identification des cultures par l’appareil photo (IA)',
    'tools.witness': 'Témoin vidéo',
    'tools.witnessDesc': 'Enregistrer un témoignage vidéo géolocalisé',
    'tools.clockIn': 'Pointer',
    'tools.onSite': 'Sur site',
    'tools.offSite': 'Hors site',
    'tools.requestFunds': 'Demander un bon d’achat',
    'tools.requestFundsDesc': 'Bon d’achat restreint à une catégorie de fournisseur',

    // Construction / chantier
    'construction.materials': 'Matériaux',
    'construction.siteTracking': 'Suivi de chantier',
    'construction.noMaterials': 'Aucun matériau enregistré',
    'construction.custody': 'Chaîne de traçabilité',
    'construction.missingSteps': 'Étapes manquantes',
    'construction.purchased': 'Acheté',
    'construction.inTransit': 'En transit',
    'construction.delivered': 'Livré sur site',
    'construction.installed': 'Posé',
    'construction.damaged': 'Endommagé',
    'construction.missing': 'Manquant',
    'construction.priceCheck': 'Vérification des prix',
    'construction.overBenchmark': 'Prix au-dessus du marché',
    'construction.materialTracking': 'Suivi des matériaux',
    'construction.costSummary': 'Résumé des coûts',

    // Farm
    'farm.poultry': 'Volaille',
    'farm.pigs': 'Porcs',
    'farm.batch': 'Lot',
    'farm.weekN': 'Semaine {n}',
    'farm.mortality': 'Mortalité',
    'farm.feed': 'Aliment',
    'farm.weighIn': 'Pesée hebdomadaire',

    // Vouchers
    'voucher.title': 'Bon d’achat',
    'voucher.amount': 'Montant',
    'voucher.purpose': 'Motif',
    'voucher.category': 'Catégorie de fournisseur',
    'voucher.redeem': 'Utiliser le bon',
    'voucher.balance': 'Solde restant',
    'voucher.submitted': 'Demande envoyée pour validation',

    // Money
    'money.mobileMoney': 'Mobile money',
    'money.paidVia': 'Payé via {provider}',
    'money.available': 'Solde disponible',
    'money.invested': 'Total investi',

    // Auth
    'auth.email': 'Adresse e-mail',
    'auth.password': 'Mot de passe',
    'auth.phone': 'Numéro de téléphone',
    'auth.otp': 'Code de vérification',

    // Region
    'region.kinshasa': 'Kinshasa (RD Congo)',
    'region.cotonou': 'Cotonou (Bénin)',
    'region.select': 'Choisir votre ville',
} as const;

export type StringKey = keyof typeof fr;

const en: Record<StringKey, string> = {
    'common.appName': 'FarmTrust',
    'common.loading': 'Loading…',
    'common.error': 'Something went wrong',
    'common.retry': 'Retry',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.submit': 'Submit',
    'common.confirm': 'Confirm',
    'common.close': 'Close',
    'common.back': 'Back',
    'common.seeAll': 'See all',
    'common.offline': 'Offline — your data will sync automatically',
    'common.pendingSync': '{count} item(s) waiting to upload',
    'common.signIn': 'Sign in',
    'common.signOut': 'Sign out',
    'common.signUp': 'Create account',

    'nav.home': 'Home',
    'nav.site': 'Site',
    'nav.tools': 'Tools',
    'nav.dashboard': 'Dashboard',
    'nav.overview': 'Overview',
    'nav.watchtower': 'Watchtower',
    'nav.approvals': 'Approvals',
    'nav.construction': 'Construction',
    'nav.legal': 'Legal',
    'nav.portfolio': 'Portfolio',

    'status.pending': 'Pending',
    'status.inReview': 'In review',
    'status.completed': 'Completed',
    'status.rejected': 'Rejected',

    'task.myTasks': 'My tasks',
    'task.noTasks': 'No tasks yet',
    'task.detail': 'Task detail',
    'task.due': 'Due',
    'task.payout': 'Payout',
    'task.submitReview': 'Submit for review',
    'task.approvePay': 'Approve & pay',
    'task.evidence': 'Evidence',
    'task.addPhoto': 'Take a photo',
    'task.retakePhoto': 'Retake',
    'task.evidenceQueued': 'Queued — will upload when back online',
    'task.downloadDeed': 'Download digital deed',
    'task.overdue': 'Overdue',

    'tools.title': 'Field tools',
    'tools.measureLand': 'Measure land',
    'tools.measureLandDesc': 'Walk the boundary to measure the plot (GPS)',
    'tools.cropScan': 'Crop scan',
    'tools.cropScanDesc': 'Camera-based crop identification (AI)',
    'tools.witness': 'Video witness',
    'tools.witnessDesc': 'Record a geotagged witness statement',
    'tools.clockIn': 'Clock in',
    'tools.onSite': 'On site',
    'tools.offSite': 'Off site',
    'tools.requestFunds': 'Request a voucher',
    'tools.requestFundsDesc': 'Voucher restricted to a supplier category',

    'construction.materials': 'Materials',
    'construction.siteTracking': 'Site tracking',
    'construction.noMaterials': 'No materials recorded',
    'construction.custody': 'Chain of custody',
    'construction.missingSteps': 'Missing steps',
    'construction.purchased': 'Purchased',
    'construction.inTransit': 'In transit',
    'construction.delivered': 'Delivered on site',
    'construction.installed': 'Installed',
    'construction.damaged': 'Damaged',
    'construction.missing': 'Missing',
    'construction.priceCheck': 'Price check',
    'construction.overBenchmark': 'Priced above market',
    'construction.materialTracking': 'Material tracking',
    'construction.costSummary': 'Cost summary',

    'farm.poultry': 'Poultry',
    'farm.pigs': 'Pigs',
    'farm.batch': 'Batch',
    'farm.weekN': 'Week {n}',
    'farm.mortality': 'Mortality',
    'farm.feed': 'Feed',
    'farm.weighIn': 'Weekly weigh-in',

    'voucher.title': 'Voucher',
    'voucher.amount': 'Amount',
    'voucher.purpose': 'Purpose',
    'voucher.category': 'Supplier category',
    'voucher.redeem': 'Redeem voucher',
    'voucher.balance': 'Remaining balance',
    'voucher.submitted': 'Request sent for approval',

    'money.mobileMoney': 'Mobile money',
    'money.paidVia': 'Paid via {provider}',
    'money.available': 'Available balance',
    'money.invested': 'Total invested',

    'auth.email': 'Email address',
    'auth.password': 'Password',
    'auth.phone': 'Phone number',
    'auth.otp': 'Verification code',

    'region.kinshasa': 'Kinshasa (DR Congo)',
    'region.cotonou': 'Cotonou (Benin)',
    'region.select': 'Choose your city',
};

const CATALOG: Record<Locale, Record<StringKey, string>> = { fr, en };

/**
 * Translate a key. Missing English entries fall back to French; an unknown
 * key returns the key itself so a bad reference never crashes a screen.
 */
export function t(
    key: StringKey,
    locale: Locale = DEFAULT_LOCALE,
    params?: Record<string, string | number>,
): string {
    const raw = CATALOG[locale]?.[key] ?? fr[key] ?? key;
    if (!params) return raw;
    return raw.replace(/\{(\w+)\}/g, (match, name) =>
        params[name] != null ? String(params[name]) : match,
    );
}
