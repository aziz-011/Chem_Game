// Tiny translation layer. Views register their own strings with I18N.add();
// static HTML uses data-i18n / data-i18n-html / data-i18n-ph / data-i18n-aria.
(function (root) {
  'use strict';
  var LANGS = [{ code: 'en', label: 'English', locale: 'en-US' }, { code: 'fr', label: 'Français', locale: 'fr-FR' }];
  var dict = { en: {}, fr: {} };
  var lang = 'en';

  function add(strings) {
    Object.keys(strings).forEach(function (l) {
      Object.keys(strings[l]).forEach(function (k) { dict[l][k] = strings[l][k]; });
    });
  }

  // t('key', {n: 2}) → string with {n} replaced. Falls back to English, then the key.
  function t(key, vars) {
    var s = dict[lang][key];
    if (s === undefined) s = dict.en[key];
    if (s === undefined) return key;
    if (typeof s === 'function') return s(vars || {});
    return !vars ? s : s.replace(/\{(\w+)\}/g, function (m, k) { return vars[k] === undefined ? m : vars[k]; });
  }

  // Picks a translated field from a data object: tr(obj, 'name') reads name_fr in French.
  function tr(obj, field) {
    if (!obj) return '';
    if (lang !== 'en' && obj[field + '_' + lang] !== undefined) return obj[field + '_' + lang];
    return obj[field];
  }

  function setLang(code) { lang = LANGS.some(function (l) { return l.code === code; }) ? code : 'en'; }
  function getLang() { return lang; }
  function locale() { return LANGS.filter(function (l) { return l.code === lang; })[0].locale; }

  function translateDom(scope) {
    scope.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    scope.querySelectorAll('[data-i18n-html]').forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
    scope.querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    scope.querySelectorAll('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
  }

  add({
    en: {
      'app.title': 'ChemLab — Learn Chemistry',
      'nav.table': 'Periodic Table', 'nav.compare': 'Compare Atoms', 'nav.molecules': 'Molecules',
      'nav.mechanisms': 'Mechanisms', 'nav.naming': 'Naming', 'nav.reactions': 'Reaction Lab',
      'nav.sections': 'Sections', 'theme.toggle': 'Toggle dark mode', 'lang.label': 'Language',
      'common.try': 'Try:', 'common.examples': 'Examples:', 'common.noData': 'no data',

      'table.title': 'The Periodic Table',
      'table.intro': 'Click any element to see what its atom is made of. Use “Color by” to discover the patterns (trends) across the table.',
      'table.search': 'Search name, symbol or number…', 'table.colorBy': 'Color by',
      'color.category': 'Element family', 'color.phase': 'State at room temperature', 'color.block': 'Block (s, p, d, f)',
      'color.en': 'Electronegativity', 'color.radius': 'Atomic radius', 'color.ie1': 'Ionization energy',
      'color.mass': 'Atomic mass', 'color.melt': 'Melting point', 'color.density': 'Density',

      'compare.title': 'Compare Two Atoms',
      'compare.intro': 'Pick two elements and see how their atoms differ: protons, electrons, size, and how strongly they hold on to electrons.',
      'compare.a': 'Element A', 'compare.b': 'Element B',

      'mol.title': 'Molecule Explorer',
      'mol.intro': 'Type a chemical formula to see its name, which atoms it contains, its molar mass and percent composition.',
      'mol.placeholder': 'e.g. H2O, CO2, Ca(OH)2, C6H12O6', 'mol.analyze': 'Analyze', 'mol.formulaAria': 'Chemical formula',
      'mol.galleryTitle': '3D Model Gallery',
      'mol.galleryHint': 'Drag to rotate. Atom colors follow the standard CPK scheme (C grey, O red, H white, N blue…).',
      'mol.mechLink': 'See how organic molecules react (SN1, SN2, E1, E2) →',

      'mech.title': 'Reaction Mechanisms: SN1, SN2, E1, E2',
      'mech.intro': 'Watch substitution and elimination happen atom by atom. Pick a mechanism, press play, and drag the model to look from any side.',

      'naming.title': 'Naming Compounds', 'naming.intro': 'Learn the rules, build ionic compounds from ions, and test yourself.',
      'naming.tab.name': 'Name a formula', 'naming.tab.build': 'Ion builder', 'naming.tab.quiz': 'Quiz', 'naming.tab.rules': 'Rules & ions',

      'rx.title': 'Reaction Lab',
      'rx.intro': 'Pick one or two chemicals from the shelf and mix them. Watch what happens, then see the balanced equation and why it works.',
      'rx.shelf': 'Chemical shelf', 'rx.filter': 'Filter…', 'rx.filterAria': 'Filter chemicals', 'rx.mix': 'Mix!', 'rx.clear': 'Clear',
      'rx.random': 'Surprise me', 'rx.pick': 'Pick one or two chemicals to start', 'rx.balTitle': 'Equation balancer',
      'rx.balHint': 'Type any equation using -> or =. Type just a fuel + O2 (like C4H10 + O2) and the combustion products are filled in for you.',
      'rx.balPlaceholder': 'e.g. Fe + O2 -> Fe2O3', 'rx.balance': 'Balance', 'rx.balAria': 'Chemical equation', 'rx.typesTitle': 'Types of reactions',

      'footer': 'Element data from the open <a href="https://github.com/Bowserinator/Periodic-Table-JSON" rel="noopener">Periodic-Table-JSON</a> dataset (compiled from Wikipedia). Reactions shown are simplified for learning. Never try them without a teacher and proper safety equipment.'
    },
    fr: {
      'app.title': 'ChemLab — Apprendre la chimie',
      'nav.table': 'Tableau périodique', 'nav.compare': 'Comparer des atomes', 'nav.molecules': 'Molécules',
      'nav.mechanisms': 'Mécanismes', 'nav.naming': 'Nomenclature', 'nav.reactions': 'Labo de réactions',
      'nav.sections': 'Sections', 'theme.toggle': 'Basculer le mode sombre', 'lang.label': 'Langue',
      'common.try': 'Essaie :', 'common.examples': 'Exemples :', 'common.noData': 'pas de donnée',

      'table.title': 'Le tableau périodique',
      'table.intro': 'Clique sur un élément pour voir de quoi son atome est fait. Utilise « Colorer par » pour découvrir les tendances du tableau.',
      'table.search': 'Rechercher un nom, un symbole ou un numéro…', 'table.colorBy': 'Colorer par',
      'color.category': 'Famille d’éléments', 'color.phase': 'État à température ambiante', 'color.block': 'Bloc (s, p, d, f)',
      'color.en': 'Électronégativité', 'color.radius': 'Rayon atomique', 'color.ie1': 'Énergie d’ionisation',
      'color.mass': 'Masse atomique', 'color.melt': 'Point de fusion', 'color.density': 'Masse volumique',

      'compare.title': 'Comparer deux atomes',
      'compare.intro': 'Choisis deux éléments et vois en quoi leurs atomes diffèrent : protons, électrons, taille et force avec laquelle ils retiennent leurs électrons.',
      'compare.a': 'Élément A', 'compare.b': 'Élément B',

      'mol.title': 'Explorateur de molécules',
      'mol.intro': 'Tape une formule chimique pour voir son nom, les atomes qu’elle contient, sa masse molaire et sa composition en pourcentage.',
      'mol.placeholder': 'ex. H2O, CO2, Ca(OH)2, C6H12O6', 'mol.analyze': 'Analyser', 'mol.formulaAria': 'Formule chimique',
      'mol.galleryTitle': 'Galerie de modèles 3D',
      'mol.galleryHint': 'Fais glisser pour tourner. Les couleurs suivent le code CPK (C gris, O rouge, H blanc, N bleu…).',
      'mol.mechLink': 'Voir comment réagissent les molécules organiques (SN1, SN2, E1, E2) →',

      'mech.title': 'Mécanismes réactionnels : SN1, SN2, E1, E2',
      'mech.intro': 'Regarde une substitution ou une élimination se produire atome par atome. Choisis un mécanisme, lance l’animation et fais tourner le modèle.',

      'naming.title': 'Nommer les composés', 'naming.intro': 'Apprends les règles, construis des composés ioniques et teste-toi.',
      'naming.tab.name': 'Nommer une formule', 'naming.tab.build': 'Constructeur d’ions', 'naming.tab.quiz': 'Quiz', 'naming.tab.rules': 'Règles et ions',

      'rx.title': 'Labo de réactions',
      'rx.intro': 'Choisis un ou deux produits sur l’étagère et mélange-les. Observe ce qui se passe, puis découvre l’équation équilibrée et son explication.',
      'rx.shelf': 'Étagère de produits', 'rx.filter': 'Filtrer…', 'rx.filterAria': 'Filtrer les produits', 'rx.mix': 'Mélanger !', 'rx.clear': 'Vider',
      'rx.random': 'Surprends-moi', 'rx.pick': 'Choisis un ou deux produits pour commencer', 'rx.balTitle': 'Équilibreur d’équations',
      'rx.balHint': 'Tape une équation avec -> ou =. Tape seulement un combustible + O2 (comme C4H10 + O2) et les produits de combustion sont ajoutés pour toi.',
      'rx.balPlaceholder': 'ex. Fe + O2 -> Fe2O3', 'rx.balance': 'Équilibrer', 'rx.balAria': 'Équation chimique', 'rx.typesTitle': 'Types de réactions',

      'footer': 'Données des éléments issues du jeu de données libre <a href="https://github.com/Bowserinator/Periodic-Table-JSON" rel="noopener">Periodic-Table-JSON</a> (compilé depuis Wikipédia). Les réactions sont simplifiées pour apprendre. Ne les essaie jamais sans un enseignant et un équipement de sécurité.'
    }
  });

  var api = { LANGS: LANGS, add: add, t: t, tr: tr, setLang: setLang, getLang: getLang, locale: locale, translateDom: translateDom };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.I18N = api;
})(this);
