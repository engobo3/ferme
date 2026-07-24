/**
 * App-local string catalog for the investor dashboard.
 *
 * Strings that belong to the whole platform live in
 * libs/shared-ui/src/i18n/strings.ts (nav.*, status.*, money.*, common.*…).
 * Everything specific to this web app lives here, keyed off the same locale
 * from the shared I18nProvider so one FR/EN toggle drives both catalogs.
 */
import { useI18n, type Locale } from '@diaspora-trust/shared-ui';

const fr = {
    // Dashboard shell (page.tsx)
    'dash.commandCenter': 'Centre de commande',
    'dash.watchtowerTitle': 'Surveillance en direct',
    'dash.approvalsTitle': 'Validations en attente',
    'dash.constructionTitle': 'Gestion de chantier',
    'dash.legalTitle': 'Coffre juridique & actes',
    'dash.starlinkHub': 'Hub Starlink',
    'dash.systemHealth': 'État du système',
    'dash.liveSatellite': 'Vue satellite en direct',

    // Sidebar
    'side.myPortfolio': 'Mon portefeuille',
    'side.kikwitFarm': 'Ferme de Kikwit',
    'side.farmStatus': 'Actif • Phase de récolte',
    'side.newConstruction': 'Nouveau chantier',
    'side.clickToStart': '+ Cliquer pour démarrer',
    'side.platform': 'Plateforme',
    'side.online': 'En ligne',
    'side.user': 'Utilisateur',

    // Login
    'login.subtitle': 'Espace investisseur',
    'login.fullName': 'Nom complet',
    'login.confirmPassword': 'Confirmer le mot de passe',
    'login.passwordPlaceholderSignin': 'Entrez votre mot de passe',
    'login.passwordPlaceholderSignup': 'Créez un mot de passe',
    'login.confirmPlaceholder': 'Confirmez votre mot de passe',
    'login.signingIn': 'Connexion…',
    'login.creatingAccount': 'Création du compte…',
    'login.noAccount': 'Pas encore de compte ?',
    'login.createOne': 'Créer un compte',
    'login.haveAccount': 'Déjà un compte ?',
    'login.errPasswordMatch': 'Les mots de passe ne correspondent pas.',
    'login.errPasswordShort': 'Le mot de passe doit contenir au moins 6 caractères.',
    'login.errInvalid': 'E-mail ou mot de passe invalide.',
    'login.errEmailInUse': 'Un compte existe déjà avec cette adresse e-mail.',
    'login.errWeakPassword': 'Mot de passe trop faible. Utilisez au moins 6 caractères.',
    'login.errTooMany': 'Trop de tentatives. Veuillez réessayer plus tard.',
    'login.errSignIn': 'Échec de la connexion. Veuillez réessayer.',
    'login.errSignUp': 'Échec de la création du compte. Veuillez réessayer.',

    // Approval queue
    'appr.subtitle': 'Examinez les preuves et libérez les fonds aux opérateurs.',
    'appr.tasksWaiting': 'tâche(s) en attente',
    'appr.aiScoring': 'ANALYSE IA',
    'appr.aiActive': 'ACTIVE',
    'appr.allCaughtUp': 'Tout est à jour ! Aucune tâche en attente de validation.',
    'appr.colTask': 'Tâche',
    'appr.colAssigned': 'Assignée à',
    'appr.colEvidence': 'Preuves',
    'appr.colScore': 'Score IA',
    'appr.colAmount': 'Montant',
    'appr.colAction': 'Action',
    'appr.items': '{count} élément(s)',
    'appr.confirmRelease': 'Voulez-vous vraiment libérer les fonds pour cette tâche ?',
    'appr.fundsReleased': 'Fonds libérés avec succès !',
    'appr.error': 'Erreur : {message}',
    'appr.processing': 'Traitement…',
    'appr.oneClickPay': '⚡ Paiement en 1 clic',
    'appr.confHigh': 'ÉLEVÉ',
    'appr.confMedium': 'MOYEN',
    'appr.confLow': 'FAIBLE',
    'appr.reasonPhotosVerified': '{count} photos vérifiées',
    'appr.reasonPhotosAttached': '{count} photo(s) jointe(s)',
    'appr.reasonNoPhotos': 'Aucune preuve photo',
    'appr.reasonGps': 'Position vérifiée par GPS',
    'appr.reasonBoundary': 'Données de limites présentes',
    'appr.reasonDetailed': 'Description détaillée',
    'appr.reasonLowRisk': 'Montant à faible risque',

    // Financial widget
    'fin.portfolioPerformance': 'Performance du portefeuille',
    'fin.ytd': 'cumul annuel',
    'fin.activeDeployments': 'ÉQUIPES DÉPLOYÉES',
    'fin.teams': '{count} équipes',
    'fin.payoutsReleased': 'Paiements versés',
    'fin.deployed': '{percent}% déployé',
    'fin.auditOn': '🛡️ Mode audit : activé',
    'fin.auditToggle': '👁️ Activer le mode audit',

    // Smart yield predictor
    'yield.title': 'Prédicteur de rendement',
    'yield.ai': 'IA',
    'yield.hold': '📊 CONSERVER — marge de croissance',
    'yield.holdDetail': 'Poursuivre l’alimentation pour un rendement maximal',
    'yield.sellSoon': '⚡ VENDRE BIENTÔT',
    'yield.sellSoonDetail': 'Fenêtre de profit optimale proche',
    'yield.sellNow': '💰 VENDRE MAINTENANT',
    'yield.sellNowDetail': 'Point de profit maximal atteint',
    'yield.weekOf': 'Semaine {week} sur 6 • {weight} g en moy.',
    'yield.confidence': 'Confiance : {percent}%',
    'yield.currentWeek': 'Actuelle (S{week})',
    'yield.optimalWeek': 'Vente optimale (S{week})',
    'yield.projectedRevenue': 'Revenu projeté',
    'yield.feedCost': 'Coût aliment',
    'yield.netProfit': 'Profit net',
    'yield.margin': '{percent} % de marge',
    'yield.weeksToHarvest': '{count} semaine(s) avant la récolte optimale',

    // Watchtower
    'watch.hubTitle': 'Hub Starlink : Alpha-1',
    'watch.signalStrong': 'Signal fort (98 %)',
    'watch.downlink': 'Débit descendant',
    'watch.uplink': 'Débit montant',
    'watch.latency': 'Latence',
    'watch.live': 'EN DIRECT',
    'watch.selectCamera': 'Sélectionnez une caméra',
    'watch.activeFeeds': 'Flux actifs',
    'watch.online': 'en ligne',
    'watch.offline': 'hors ligne',
    'watch.latencyLabel': 'Latence : {value}',
    'watch.motionNone': 'Mouvement : aucun',
    'watch.addCamera': '+ Ajouter une caméra Wyze/Ring',
    'watch.camGate': 'Portail principal (nord)',
    'watch.camField': 'Champ de manioc A',
    'watch.camShed': 'Hangar de stockage',
    'watch.camProcessing': 'Unité de transformation',

    // Legal tools
    'legal.vaultTab': 'Coffre à documents',
    'legal.importTab': 'Import géomètre',
    'legal.safeKeeping': 'Conservation sécurisée',
    'legal.safeKeepingDesc':
        'Téléversez votre Titre Foncier ici. Nous le conservons en sécurité sur un registre blockchain (simulé).',
    'legal.dropPdf': 'Glissez-déposez votre PDF ici',
    'legal.clickBrowse': 'ou cliquez pour parcourir',
    'legal.storedDocs': 'Documents conservés',
    'legal.boundary': 'Limite légale',
    'legal.boundaryDesc':
        'Demandez à votre géomètre de vous envoyer par e-mail le fichier .kml ou .gpx de son appareil GPS.',

    // Survey importer
    'survey.title': 'Importer un levé de géomètre',
    'survey.parsing': 'Analyse de {name}…',
    'survey.invalidXml': 'Structure de fichier XML/KML invalide.',
    'survey.unsupported': 'Format non pris en charge. Utilisez .kml ou .gpx.',
    'survey.noPolygon': 'Aucun polygone trouvé dans le fichier.',
    'survey.parsed': 'Fichier analysé. Superficie calculée : {area} ha.',
    'survey.uploading': 'Envoi vers le registre principal…',
    'survey.success': 'Limite importée avec succès !',
    'survey.error': 'Erreur : {message}',
    'survey.processing': 'Traitement…',
    'survey.clickUpload': 'Cliquez pour téléverser un fichier .KML ou .GPX',
    'survey.compatible': 'Compatible avec Garmin, Trimble, Google Earth',
    'survey.analysis': 'Analyse du levé',
    'survey.calculatedArea': 'Superficie calculée :',
    'survey.confirmSave': 'Confirmer et enregistrer la limite',
    'survey.saving': 'Enregistrement…',
    'survey.updateNote': 'Ceci mettra à jour la limite légale de cette parcelle.',

    // Farm viewer (map overlay)
    'map.truthGap': 'ÉCART DE VÉRITÉ DÉTECTÉ',
    'map.truthGapDesc': 'La réalité (rouge) contredit la limite légale (bleu).',
    'map.legalBoundary': 'Limite légale (import géomètre)',
    'map.reality': 'Réalité (GPS terrain)',
} as const;

export type AppStringKey = keyof typeof fr;

const en: Record<AppStringKey, string> = {
    'dash.commandCenter': 'Command center',
    'dash.watchtowerTitle': 'Live watchtower',
    'dash.approvalsTitle': 'Pending approvals',
    'dash.constructionTitle': 'Construction management',
    'dash.legalTitle': 'Legal vault & deeds',
    'dash.starlinkHub': 'Starlink hub',
    'dash.systemHealth': 'System health',
    'dash.liveSatellite': 'Live satellite feed',

    'side.myPortfolio': 'My portfolio',
    'side.kikwitFarm': 'Kikwit Farm',
    'side.farmStatus': 'Active • Harvest phase',
    'side.newConstruction': 'New construction',
    'side.clickToStart': '+ Click to start',
    'side.platform': 'Platform',
    'side.online': 'Online',
    'side.user': 'User',

    'login.subtitle': 'Investor dashboard',
    'login.fullName': 'Full name',
    'login.confirmPassword': 'Confirm password',
    'login.passwordPlaceholderSignin': 'Enter your password',
    'login.passwordPlaceholderSignup': 'Create a password',
    'login.confirmPlaceholder': 'Confirm your password',
    'login.signingIn': 'Signing in…',
    'login.creatingAccount': 'Creating account…',
    'login.noAccount': 'Don’t have an account?',
    'login.createOne': 'Create one',
    'login.haveAccount': 'Already have an account?',
    'login.errPasswordMatch': 'Passwords do not match.',
    'login.errPasswordShort': 'Password must be at least 6 characters.',
    'login.errInvalid': 'Invalid email or password.',
    'login.errEmailInUse': 'An account with this email already exists.',
    'login.errWeakPassword': 'Password is too weak. Use at least 6 characters.',
    'login.errTooMany': 'Too many attempts. Please try again later.',
    'login.errSignIn': 'Sign in failed. Please try again.',
    'login.errSignUp': 'Sign up failed. Please try again.',

    'appr.subtitle': 'Review evidence and release funds to operators.',
    'appr.tasksWaiting': 'task(s) waiting',
    'appr.aiScoring': 'AI SCORING',
    'appr.aiActive': 'ACTIVE',
    'appr.allCaughtUp': 'All caught up! No tasks pending review.',
    'appr.colTask': 'Task',
    'appr.colAssigned': 'Assigned to',
    'appr.colEvidence': 'Evidence',
    'appr.colScore': 'AI score',
    'appr.colAmount': 'Amount',
    'appr.colAction': 'Action',
    'appr.items': '{count} item(s)',
    'appr.confirmRelease': 'Are you sure you want to release funds for this task?',
    'appr.fundsReleased': 'Funds released successfully!',
    'appr.error': 'Error: {message}',
    'appr.processing': 'Processing…',
    'appr.oneClickPay': '⚡ 1-click pay',
    'appr.confHigh': 'HIGH',
    'appr.confMedium': 'MEDIUM',
    'appr.confLow': 'LOW',
    'appr.reasonPhotosVerified': '{count} photos verified',
    'appr.reasonPhotosAttached': '{count} photo(s) attached',
    'appr.reasonNoPhotos': 'No photo evidence',
    'appr.reasonGps': 'GPS-verified location',
    'appr.reasonBoundary': 'Boundary data present',
    'appr.reasonDetailed': 'Detailed description',
    'appr.reasonLowRisk': 'Low-risk amount',

    'fin.portfolioPerformance': 'Portfolio performance',
    'fin.ytd': 'YTD',
    'fin.activeDeployments': 'ACTIVE DEPLOYMENTS',
    'fin.teams': '{count} teams',
    'fin.payoutsReleased': 'Payouts released',
    'fin.deployed': '{percent}% deployed',
    'fin.auditOn': '🛡️ Audit mode: on',
    'fin.auditToggle': '👁️ Toggle audit mode',

    'yield.title': 'Smart yield predictor',
    'yield.ai': 'AI',
    'yield.hold': '📊 HOLD — room to grow',
    'yield.holdDetail': 'Continue feeding for maximum yield',
    'yield.sellSoon': '⚡ SELL SOON',
    'yield.sellSoonDetail': 'Approaching peak profit window',
    'yield.sellNow': '💰 SELL NOW',
    'yield.sellNowDetail': 'Maximum profit point reached',
    'yield.weekOf': 'Week {week} of 6 • {weight}g avg',
    'yield.confidence': 'Confidence: {percent}%',
    'yield.currentWeek': 'Current (Wk {week})',
    'yield.optimalWeek': 'Optimal sell (Wk {week})',
    'yield.projectedRevenue': 'Projected revenue',
    'yield.feedCost': 'Feed cost',
    'yield.netProfit': 'Net profit',
    'yield.margin': '{percent}% margin',
    'yield.weeksToHarvest': '{count} week(s) to optimal harvest',

    'watch.hubTitle': 'Starlink hub: Alpha-1',
    'watch.signalStrong': 'Strong signal (98%)',
    'watch.downlink': 'Downlink',
    'watch.uplink': 'Uplink',
    'watch.latency': 'Latency',
    'watch.live': 'LIVE',
    'watch.selectCamera': 'Select a camera',
    'watch.activeFeeds': 'Active feeds',
    'watch.online': 'online',
    'watch.offline': 'offline',
    'watch.latencyLabel': 'Latency: {value}',
    'watch.motionNone': 'Motion: none',
    'watch.addCamera': '+ Add Wyze/Ring camera',
    'watch.camGate': 'Main gate (north)',
    'watch.camField': 'Cassava field A',
    'watch.camShed': 'Storage shed',
    'watch.camProcessing': 'Processing unit',

    'legal.vaultTab': 'Document vault',
    'legal.importTab': 'Surveyor import',
    'legal.safeKeeping': 'Safe keeping',
    'legal.safeKeepingDesc':
        'Upload your Titre Foncier here. We store it securely on the blockchain ledger (simulated).',
    'legal.dropPdf': 'Drag & drop your PDF here',
    'legal.clickBrowse': 'or click to browse',
    'legal.storedDocs': 'Stored documents',
    'legal.boundary': 'Legal boundary',
    'legal.boundaryDesc':
        'Ask your surveyor to email you the .kml or .gpx file from their GPS device.',

    'survey.title': 'Import professional survey',
    'survey.parsing': 'Parsing {name}…',
    'survey.invalidXml': 'Invalid XML/KML file structure.',
    'survey.unsupported': 'Unsupported format. Use .kml or .gpx.',
    'survey.noPolygon': 'No polygon found in file.',
    'survey.parsed': 'File parsed. Calculated area: {area} ha.',
    'survey.uploading': 'Uploading to master record…',
    'survey.success': 'Success! Boundary imported.',
    'survey.error': 'Error: {message}',
    'survey.processing': 'Processing…',
    'survey.clickUpload': 'Click to upload a .KML or .GPX file',
    'survey.compatible': 'Compatible with Garmin, Trimble, Google Earth',
    'survey.analysis': 'Survey analysis',
    'survey.calculatedArea': 'Calculated area:',
    'survey.confirmSave': 'Confirm & save boundary',
    'survey.saving': 'Saving…',
    'survey.updateNote': 'This will update the legal boundary for this plot.',

    'map.truthGap': 'TRUTH GAP DETECTED',
    'map.truthGapDesc': 'Reality (red) conflicts with the legal boundary (blue).',
    'map.legalBoundary': 'Legal boundary (surveyor import)',
    'map.reality': 'Reality (field GPS)',
};

const CATALOG: Record<Locale, Record<AppStringKey, string>> = { fr, en };

/** Translate an app-local key. Unknown keys return themselves; EN falls back to FR. */
export function appT(
    key: AppStringKey,
    locale: Locale = 'fr',
    params?: Record<string, string | number>,
): string {
    const raw = CATALOG[locale]?.[key] ?? fr[key] ?? key;
    if (!params) return raw;
    return raw.replace(/\{(\w+)\}/g, (match, name) =>
        params[name] != null ? String(params[name]) : match,
    );
}

/**
 * App-local translation hook. Reads the current locale from the shared
 * I18nProvider so the FR/EN toggle drives both catalogs at once.
 */
export function useAppT() {
    const { locale } = useI18n();
    return {
        locale,
        ta: (key: AppStringKey, params?: Record<string, string | number>) =>
            appT(key, locale, params),
    };
}
