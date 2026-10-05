// Core chemistry logic: formula parsing, molar mass, composition,
// equation balancing and compound naming. Works in the browser
// (window.Chem) and in Node (require) so it can be unit-tested.
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('./data/elements.js'), require('./data/compounds.js'), require('./data/names-fr.js'));
  } else {
    root.Chem = factory(root.ELEMENTS, root.COMPOUNDS, root.NAMES_FR);
  }
})(this, function (ELEMENTS, COMPOUNDS, NAMES_FR) {
  'use strict';

  var bySymbol = {};
  ELEMENTS.forEach(function (e) { bySymbol[e.symbol] = e; });

  // ---------- Element classification ----------

  function isMetal(sym) {
    var e = bySymbol[sym];
    if (!e) return false;
    return /metal/.test(e.category) && !/nonmetal|metalloid/.test(e.category);
  }

  function isNonmetal(sym) {
    var e = bySymbol[sym];
    return !!e && (/nonmetal|noble gas|metalloid/.test(e.category));
  }

  // Valence electrons for main-group elements (null for d/f block).
  function valenceElectrons(el) {
    if (el.symbol === 'He') return 2;
    if (el.block === 's') return el.group;
    if (el.block === 'p') return el.group - 10;
    return null;
  }

  // ---------- Formula parsing ----------

  // Parses formulas like "H2O", "Ca(OH)2", "CuSO4·5H2O", "[Fe(CN)6]".
  // Returns { counts: {El: n}, order: [El...] } or throws an Error with a
  // student-friendly message.
  function parseFormula(input) {
    var text = String(input || '').replace(/\s+/g, '');
    if (!text) throw new Error(msg('empty'));
    text = normalizeSubscripts(text);

    var parts = text.split(/[·•*.]/);
    var counts = {};
    var order = [];
    parts.forEach(function (part, idx) {
      if (!part) throw new Error(msg('unexpected', { c: '·' }));
      var m = /^(\d+)(.*)$/.exec(part);
      var mult = 1;
      if (m && idx > 0) { mult = parseInt(m[1], 10); part = m[2]; }
      else if (m) throw new Error(msg('startsNumber'));
      var res = parseGroup(part, 0, null);
      if (res.pos !== part.length) throw new Error(msg('unexpected', { c: part[res.pos] }));
      Object.keys(res.counts).forEach(function (el) { add(counts, order, el, res.counts[el] * mult); });
      res.order.forEach(function (el) { if (order.indexOf(el) < 0) order.push(el); });
    });
    return { counts: counts, order: order };
  }

  function normalizeSubscripts(s) {
    var sub = '₀₁₂₃₄₅₆₇₈₉';
    return s.replace(/[₀-₉]/g, function (c) { return String(sub.indexOf(c)); });
  }

  function add(counts, order, el, n) {
    counts[el] = (counts[el] || 0) + n;
    if (order.indexOf(el) < 0) order.push(el);
  }

  function readNumber(s, pos) {
    var m = /^\d+/.exec(s.slice(pos));
    return m ? { value: parseInt(m[0], 10), pos: pos + m[0].length } : { value: 1, pos: pos };
  }

  function parseGroup(s, pos, closer) {
    var counts = {};
    var order = [];
    while (pos < s.length) {
      var c = s[pos];
      if (c === '(' || c === '[') {
        var inner = parseGroup(s, pos + 1, c === '(' ? ')' : ']');
        var n = readNumber(s, inner.pos);
        inner.order.forEach(function (el) { add(counts, order, el, inner.counts[el] * n.value); });
        pos = n.pos;
      } else if (c === ')' || c === ']') {
        if (c !== closer) throw new Error(msg('unmatched', { c: c }));
        return { counts: counts, order: order, pos: pos + 1 };
      } else if (/[A-Z]/.test(c)) {
        var sym = c;
        if (pos + 1 < s.length && /[a-z]/.test(s[pos + 1])) {
          sym += s[pos + 1];
        }
        if (!bySymbol[sym] && sym.length === 2 && bySymbol[c]) sym = c;
        if (!bySymbol[sym]) throw new Error(msg('notElement', { s: sym }));
        var k = readNumber(s, pos + sym.length);
        if (k.value === 0) throw new Error(msg('subscriptZero'));
        add(counts, order, sym, k.value);
        pos = k.pos;
      } else if (/[a-z]/.test(c)) {
        throw new Error(msg('lowercase', { u: c.toUpperCase(), l: c }));
      } else {
        throw new Error(msg('unexpected', { c: c }));
      }
    }
    if (closer) throw new Error(msg('missing', { c: closer }));
    return { counts: counts, order: order, pos: pos };
  }

  // ---------- Mass & composition ----------

  function molarMass(counts) {
    return Object.keys(counts).reduce(function (sum, el) {
      return sum + bySymbol[el].mass * counts[el];
    }, 0);
  }

  // Returns rows sorted by formula order with mass contribution and percent.
  function composition(formula) {
    var parsed = typeof formula === 'string' ? parseFormula(formula) : formula;
    var total = molarMass(parsed.counts);
    var rows = parsed.order.map(function (el) {
      var mass = bySymbol[el].mass * parsed.counts[el];
      return {
        symbol: el,
        name: bySymbol[el].name,
        count: parsed.counts[el],
        atomicMass: bySymbol[el].mass,
        mass: mass,
        percent: total ? (mass / total) * 100 : 0
      };
    });
    var atoms = rows.reduce(function (s, r) { return s + r.count; }, 0);
    return { rows: rows, molarMass: total, atoms: atoms, order: parsed.order, counts: parsed.counts };
  }

  // Hill-order key (C, H, then alphabetical) used to compare compositions.
  function hillKey(counts) {
    var els = Object.keys(counts);
    var hasC = counts.C > 0;
    els.sort(function (a, b) {
      if (hasC) {
        if (a === 'C') return -1; if (b === 'C') return 1;
        if (a === 'H') return -1; if (b === 'H') return 1;
      }
      return a < b ? -1 : a > b ? 1 : 0;
    });
    return els.map(function (el) { return el + (counts[el] > 1 ? counts[el] : ''); }).join('');
  }

  // ---------- Equation balancing ----------

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; }
  function lcm(a, b) { return a / gcd(a, b) * b; }

  function frac(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    return { n: n / g, d: d / g };
  }
  function fsub(a, b) { return frac(a.n * b.d - b.n * a.d, a.d * b.d); }
  function fmul(a, b) { return frac(a.n * b.n, a.d * b.d); }
  function fdiv(a, b) { return frac(a.n * b.d, a.d * b.n); }

  // Splits "2H2 + O2 -> 2H2O" into sides. Leading coefficients are ignored.
  function parseEquation(text) {
    var sides = String(text).split(/=+>|-+>|→|⟶|=/);
    if (sides.length !== 2) throw new Error(msg('eqFormat'));
    function side(s) {
      return s.split('+').map(function (t) { return t.trim().replace(/^\d+\s*/, ''); })
        .filter(function (t) { return t.length; });
    }
    var r = side(sides[0]); var p = side(sides[1]);
    if (!r.length || !p.length) throw new Error(msg('eqSides'));
    return { reactants: r, products: p };
  }

  // Returns { reactants:[{formula,coef}], products:[...] } or throws.
  function balance(reactants, products) {
    var species = reactants.concat(products);
    var parsed = species.map(parseFormula);
    var elements = [];
    parsed.forEach(function (p) { p.order.forEach(function (el) { if (elements.indexOf(el) < 0) elements.push(el); }); });

    var reactEls = {}; var prodEls = {};
    parsed.forEach(function (p, i) {
      p.order.forEach(function (el) { (i < reactants.length ? reactEls : prodEls)[el] = true; });
    });
    elements.forEach(function (el) {
      if (!reactEls[el] || !prodEls[el]) {
        throw new Error(msg('oneSide', { name: elName(bySymbol[el]), s: el }));
      }
    });

    // Matrix: rows = elements, cols = species (products negated).
    var m = elements.map(function (el) {
      return parsed.map(function (p, j) {
        var c = p.counts[el] || 0;
        return frac(j < reactants.length ? c : -c);
      });
    });

    // Reduced row echelon form.
    var rows = m.length; var cols = species.length; var pivotCols = []; var r = 0;
    for (var c = 0; c < cols && r < rows; c++) {
      var piv = -1;
      for (var i = r; i < rows; i++) if (m[i][c].n !== 0) { piv = i; break; }
      if (piv < 0) continue;
      var tmp = m[r]; m[r] = m[piv]; m[piv] = tmp;
      var pv = m[r][c];
      for (var k = 0; k < cols; k++) m[r][k] = fdiv(m[r][k], pv);
      for (i = 0; i < rows; i++) {
        if (i !== r && m[i][c].n !== 0) {
          var f = m[i][c];
          for (k = 0; k < cols; k++) m[i][k] = fsub(m[i][k], fmul(f, m[r][k]));
        }
      }
      pivotCols.push(c); r++;
    }

    var free = [];
    for (c = 0; c < cols; c++) if (pivotCols.indexOf(c) < 0) free.push(c);
    if (free.length === 0) throw new Error(msg('cannotBalance'));
    if (free.length > 1) throw new Error(msg('multiWays'));

    var fc = free[0];
    var sol = [];
    for (c = 0; c < cols; c++) sol[c] = frac(0);
    sol[fc] = frac(1);
    pivotCols.forEach(function (pc, row) { sol[pc] = frac(-m[row][fc].n, m[row][fc].d); });

    var den = sol.reduce(function (acc, x) { return lcm(acc, x.d); }, 1);
    var ints = sol.map(function (x) { return x.n * (den / x.d); });
    var g = ints.reduce(function (acc, x) { return gcd(acc, x); }, 0) || 1;
    ints = ints.map(function (x) { return x / g; });
    if (ints[0] < 0) ints = ints.map(function (x) { return -x; });
    if (ints.some(function (x) { return x <= 0; })) {
      throw new Error(msg('noPositive'));
    }
    return {
      reactants: reactants.map(function (f, i) { return { formula: f, coef: ints[i] }; }),
      products: products.map(function (f, i) { return { formula: f, coef: ints[reactants.length + i] }; })
    };
  }

  function balanceText(text) {
    var eq = parseEquation(text);
    return balance(eq.reactants, eq.products);
  }

  function equationToString(b) {
    function side(list) {
      return list.map(function (s) { return (s.coef > 1 ? s.coef + ' ' : '') + s.formula; }).join(' + ');
    }
    return side(b.reactants) + ' → ' + side(b.products);
  }

  // Atom tally per side, used to show students that the equation is balanced.
  function atomTally(b) {
    function tally(list) {
      var t = {};
      list.forEach(function (s) {
        var p = parseFormula(s.formula);
        p.order.forEach(function (el) { t[el] = (t[el] || 0) + p.counts[el] * s.coef; });
      });
      return t;
    }
    return { left: tally(b.reactants), right: tally(b.products) };
  }


  // ---------- Language ----------

  var lang = 'en';
  function setLang(l) { lang = l === 'fr' ? 'fr' : 'en'; }
  function L(explicit) { return explicit || lang; }

  var MSG = {
    en: {
      empty: 'Type a formula, e.g. H2O or Ca(OH)2.',
      unexpected: 'Unexpected "{c}" in formula.',
      startsNumber: 'A formula cannot start with a number (use coefficients only in equations).',
      unmatched: 'Unmatched "{c}" in formula.',
      notElement: '"{s}" is not an element symbol.',
      subscriptZero: 'Subscripts must be at least 1.',
      lowercase: 'Element symbols start with a capital letter ("{u}", not "{l}").',
      missing: 'Missing "{c}" in formula.',
      eqFormat: 'Write the equation as reactants -> products, e.g. H2 + O2 -> H2O.',
      eqSides: 'Both sides of the equation need at least one substance.',
      oneSide: '{name} ({s}) appears on only one side. Atoms cannot appear or disappear in a reaction.',
      cannotBalance: 'This equation cannot be balanced. Check the formulas.',
      multiWays: 'This equation can be balanced in more than one way. It is probably two reactions combined.',
      noPositive: 'No positive set of coefficients balances this. A substance may be on the wrong side.',
      hydrate: 'The "·{n}H2O" part means water molecules are trapped in the crystal ({n} per formula unit) → add "{word}".',
      known: '{f} is a well-known compound with a common name{note}.',
      element: 'Only one kind of atom → this is the element {name}.',
      diatomic: '{name} exists as diatomic molecules ({s}2).',
      alkane1: 'Only C and H with H = 2×C + 2 → an alkane (single bonds only).',
      alkane2: '{n} carbon atom(s) → prefix "{p}-" + "-ane".',
      cov1: 'Both {a} and {b} are nonmetals → a molecular (covalent) compound; use Greek prefixes.',
      cov2: '{n} {s} → "{word}"{note}.',
      cov2note: ' (no "mono" on the first element)',
      cov3: '{n} {s} → "{word}" (the second element ends in -ide).',
      ion1: '{cat} is {kind}; {an} is {anKind} (charge {q}−).',
      kindNH4: 'the polyatomic ion ammonium',
      kindVar: 'a metal that can form more than one ion',
      kindFixed: 'a metal with only one common charge',
      anPoly: 'the polyatomic ion {name}',
      anMono: 'a nonmetal → the "-ide" ion {name}',
      ion2: 'Total negative charge: {na} × {q}− = {tot}−. Spread over {nc} {cat} → each is {c}+, so write the Roman numeral ({r}).',
      ion3: 'Name the cation first, then the anion: {name}.',
      unknown: 'This compound is outside the naming rules this app knows (it may be organic or a complex ion).'
    },
    fr: {
      empty: 'Tape une formule, par ex. H2O ou Ca(OH)2.',
      unexpected: 'Caractère « {c} » inattendu dans la formule.',
      startsNumber: 'Une formule ne peut pas commencer par un nombre (les coefficients vont seulement dans les équations).',
      unmatched: '« {c} » sans parenthèse ouvrante dans la formule.',
      notElement: '« {s} » n’est pas un symbole d’élément.',
      subscriptZero: 'Les indices doivent valoir au moins 1.',
      lowercase: 'Les symboles commencent par une majuscule (« {u} », pas « {l} »).',
      missing: 'Il manque « {c} » dans la formule.',
      eqFormat: 'Écris l’équation sous la forme réactifs -> produits, par ex. H2 + O2 -> H2O.',
      eqSides: 'Chaque côté de l’équation doit contenir au moins une espèce.',
      oneSide: '{name} ({s}) n’apparaît que d’un côté. Les atomes ne peuvent ni apparaître ni disparaître.',
      cannotBalance: 'Cette équation ne peut pas être équilibrée. Vérifie les formules.',
      multiWays: 'Cette équation peut être équilibrée de plusieurs façons. Ce sont sans doute deux réactions combinées.',
      noPositive: 'Aucun jeu de coefficients positifs ne l’équilibre. Une espèce est peut-être du mauvais côté.',
      hydrate: 'La partie « ·{n}H2O » signifie que des molécules d’eau sont piégées dans le cristal ({n} par unité) → ajouter « {word} ».',
      known: '{f} est un composé connu qui porte un nom usuel{note}.',
      element: 'Un seul type d’atome → c’est l’élément {name}.',
      diatomic: '{name} existe sous forme de molécules diatomiques ({s}2).',
      alkane1: 'Seulement C et H avec H = 2×C + 2 → un alcane (liaisons simples uniquement).',
      alkane2: '{n} atome(s) de carbone → préfixe « {p}- » + « -ane ».',
      cov1: '{a} et {b} sont des non-métaux → composé moléculaire (covalent) ; on utilise les préfixes grecs.',
      cov2: '{n} {s} → « {word} »{note}.',
      cov2note: ' (pas de préfixe « mono »)',
      cov3: '{n} {s} → « {word} » (l’élément le plus électronégatif est nommé en premier, avec la terminaison -ure ou « oxyde »).',
      ion1: '{cat} est {kind} ; {an} est {anKind} (charge {q}−).',
      kindNH4: 'l’ion polyatomique ammonium',
      kindVar: 'un métal qui peut former plusieurs ions',
      kindFixed: 'un métal qui n’a qu’une seule charge courante',
      anPoly: 'l’ion polyatomique {name}',
      anMono: 'un non-métal → l’ion « -ure » {name}',
      ion2: 'Charge négative totale : {na} × {q}− = {tot}−. Répartie sur {nc} {cat} → chacun vaut {c}+, on écrit donc le chiffre romain ({r}).',
      ion3: 'En français, on nomme d’abord l’anion, puis le cation : {name}.',
      unknown: 'Ce composé dépasse les règles de nomenclature de l’application (il est peut-être organique ou un ion complexe).'
    }
  };

  function msg(key, vars, explicit) {
    var table = MSG[L(explicit)];
    var s = table[key] !== undefined ? table[key] : MSG.en[key];
    return s.replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] !== undefined ? vars[k] : m; });
  }

  function elName(el, explicit) {
    return L(explicit) === 'fr' && NAMES_FR && NAMES_FR.elements[el.number - 1] || el.name;
  }

  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }

  // French "de" with elision: de sodium, d'aluminium, d'hydrogène.
  function de(word) { return /^[aeéèêiïoôuyh]/i.test(word) ? 'd’' + word : 'de ' + word; }

  // ---------- Quantities (stoichiometry) ----------

  // Given a balanced equation and the mass in grams of each reactant (missing
  // or empty = in excess), returns moles, the limiting reactant, the
  // theoretical mass of each product and what is left of the others.
  function stoichiometry(balanced, masses) {
    var reactants = balanced.reactants.map(function (s) {
      var M = molarMass(parseFormula(s.formula).counts);
      var m = masses[s.formula];
      var given = typeof m === 'number' && isFinite(m) && m > 0;
      return { formula: s.formula, coef: s.coef, M: M, mass: given ? m : null, n: given ? m / M : null };
    });
    var given = reactants.filter(function (r) { return r.n !== null; });
    if (!given.length) return null;
    var limiting = given.reduce(function (best, r) { return r.n / r.coef < best.n / best.coef ? r : best; });
    var extent = limiting.n / limiting.coef;
    reactants.forEach(function (r) {
      r.needed = extent * r.coef;
      r.left = r.n === null ? null : r.n - r.needed;
      r.leftMass = r.left === null ? null : r.left * r.M;
    });
    var products = balanced.products.map(function (s) {
      var M = molarMass(parseFormula(s.formula).counts);
      return { formula: s.formula, coef: s.coef, M: M, n: extent * s.coef, mass: extent * s.coef * M };
    });
    return { reactants: reactants, products: products, limiting: limiting, extent: extent };
  }

  // ---------- Ions & ionic formulas ----------

  var CATIONS = COMPOUNDS.cations;
  var ANIONS = COMPOUNDS.anions;

  function isPolyatomic(ion) { return !!ion.poly; }

  // Builds the neutral formula of cation + anion using the criss-cross rule.
  function ionicFormula(cation, anion) {
    var l = lcm(cation.charge, anion.charge);
    var nc = l / cation.charge; var na = l / anion.charge;
    function part(ion, n) {
      if (n === 1) return ion.formula;
      return (ion.poly ? '(' + ion.formula + ')' : ion.formula) + n;
    }
    return { formula: part(cation, nc) + part(anion, na), cationCount: nc, anionCount: na };
  }

  function ionName(ion, explicit) {
    if (L(explicit) !== 'fr') return ion.name;
    return ion.name_fr || (NAMES_FR && NAMES_FR.ions && NAMES_FR.ions[ion.name]) || ion.name;
  }

  function ionicName(cation, anion, explicit) {
    if (L(explicit) === 'fr') return ionName(anion, 'fr') + ' ' + de(ionName(cation, 'fr'));
    return cation.name + ' ' + anion.name;
  }

  function sameCounts(a, b) {
    var ka = Object.keys(a); var kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(function (k) { return a[k] === b[k]; });
  }

  // ---------- Naming ----------

  var PREFIXES = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'];
  var PREFIXES_FR = ['', 'mono', 'di', 'tri', 'tétra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'déca'];
  var ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

  var IDE = {
    H: 'hydride', B: 'boride', C: 'carbide', N: 'nitride', O: 'oxide', F: 'fluoride',
    Si: 'silicide', P: 'phosphide', S: 'sulfide', Cl: 'chloride', As: 'arsenide',
    Se: 'selenide', Br: 'bromide', Te: 'telluride', I: 'iodide', At: 'astatide'
  };

  function prefixed(n, word, isFirst) {
    if (isFirst && n === 1) return word;
    var p = PREFIXES[n] || (n + '-');
    // Drop the final vowel of the prefix before "oxide" (monoxide, pentoxide).
    if (/^o/.test(word) && /[ao]$/.test(p)) p = p.slice(0, -1);
    return p + word;
  }

  // Name of a two-nonmetal compound from its formula, e.g. N2O4.
  function covalentName(formula, explicit) {
    var p = parseFormula(formula);
    var a = bySymbol[p.order[0]], b = bySymbol[p.order[1]];
    var na = p.counts[a.symbol], nb = p.counts[b.symbol];
    if (L(explicit) === 'fr') {
      var anion = NAMES_FR.ide[b.symbol] || lower(elName(b, 'fr')) + 'ure';
      var first = nb === 1 ? (anion === 'oxyde' ? 'monoxyde' : anion) : PREFIXES_FR[nb] + anion;
      var second = (na === 1 ? '' : PREFIXES_FR[na]) + lower(elName(a, 'fr'));
      return first + ' ' + de(second);
    }
    return prefixed(na, lower(a.name), true) + ' ' + prefixed(nb, IDE[b.symbol] || lower(b.name) + 'ide', false);
  }

  function knownName(k, explicit) {
    if (L(explicit) !== 'fr') return k.name;
    return k.name_fr || (NAMES_FR && NAMES_FR.known && NAMES_FR.known[k.formula]) || k.name;
  }

  function findKnown(counts) {
    var key = hillKey(counts);
    for (var i = 0; i < COMPOUNDS.known.length; i++) {
      var k = COMPOUNDS.known[i];
      if (hillKey(parseFormula(k.formula).counts) === key) return k;
    }
    return null;
  }

  function alkaneName(counts, explicit) {
    var keys = Object.keys(counts);
    if (keys.length !== 2 || !counts.C || !counts.H) return null;
    var names = L(explicit) === 'fr' ? NAMES_FR.alkanes : ['', 'methane', 'ethane', 'propane', 'butane', 'pentane', 'hexane', 'heptane', 'octane', 'nonane', 'decane'];
    if (counts.H === 2 * counts.C + 2 && names[counts.C]) return names[counts.C];
    return null;
  }

  // Names a compound from its formula in the current language. Returns
  // { name, type, steps: [explanations] } or { name: null, ... } if unknown.
  function nameCompound(formula, explicit) {
    var lg = L(explicit);
    var fr = lg === 'fr';
    var text = normalizeSubscripts(String(formula).replace(/\s+/g, ''));
    var parsed = parseFormula(text);
    var counts = parsed.counts;
    var steps = [];

    // Hydrates: CuSO4·5H2O
    var hyd = /^(.+?)[·•*.](\d*)H2O$/.exec(text);
    if (hyd) {
      var n = hyd[2] ? parseInt(hyd[2], 10) : 1;
      var base = nameCompound(hyd[1], lg);
      if (base.name) {
        var word = fr ? (PREFIXES_FR[n] || n + '-') + 'hydraté' : (PREFIXES[n] || n + '-') + 'hydrate';
        return {
          name: base.name + ' ' + word, type: 'hydrate',
          steps: base.steps.concat([msg('hydrate', { n: n, word: word }, lg)])
        };
      }
    }

    var known = findKnown(counts);
    if (known) {
      var note = fr ? known.note_fr : known.note;
      steps.push(msg('known', { f: known.formula, note: note ? (fr ? ' : ' : ': ') + note : '' }, lg));
      return {
        name: knownName(known, lg), type: known.type || 'common', steps: steps,
        systematic: fr ? known.systematic_fr || known.systematic : known.systematic
      };
    }

    // Pure elements
    if (parsed.order.length === 1) {
      var el = bySymbol[parsed.order[0]];
      var cnt = counts[el.symbol];
      var nm = lower(elName(el, lg));
      steps.push(msg('element', { name: nm }, lg));
      if (cnt === 2 && ['H', 'N', 'O', 'F', 'Cl', 'Br', 'I'].indexOf(el.symbol) >= 0) {
        steps.push(msg('diatomic', { name: elName(el, lg), s: el.symbol }, lg));
      }
      return { name: nm + (cnt === 3 && el.symbol === 'O' ? ' (ozone)' : ''), type: 'element', steps: steps };
    }

    var alk = alkaneName(counts, lg);
    if (alk) {
      steps.push(msg('alkane1', null, lg));
      steps.push(msg('alkane2', { n: counts.C, p: alk.replace(/ane$/, '') }, lg));
      return { name: alk, type: 'organic', steps: steps };
    }

    // Ionic compounds: try every cation/anion pair and compare composition.
    // PbO2 could be lead(IV) oxide or lead(II) peroxide: prefer the simple oxide.
    var match = null;
    for (var i = 0; i < CATIONS.length; i++) {
      for (var j = 0; j < ANIONS.length; j++) {
        var cat = CATIONS[i]; var an = ANIONS[j];
        var f = ionicFormula(cat, an);
        if (sameCounts(parseFormula(f.formula).counts, counts) && (!match || match.anion.name === 'peroxide')) {
          match = { cation: cat, anion: an, f: f };
        }
      }
    }
    if (match) {
      return {
        name: ionicName(match.cation, match.anion, lg), type: 'ionic',
        steps: ionicSteps(match.cation, match.anion, match.f, lg), cation: match.cation, anion: match.anion
      };
    }

    // Binary covalent (two nonmetals)
    if (parsed.order.length === 2 && parsed.order.every(isNonmetal)) {
      var a = bySymbol[parsed.order[0]]; var b = bySymbol[parsed.order[1]];
      var name = covalentName(text, lg);
      var parts = fr ? name.split(/ d[e’] ?/) : name.split(' ');
      steps.push(msg('cov1', { a: elName(a, lg), b: elName(b, lg) }, lg));
      if (fr) {
        steps.push(msg('cov3', { n: counts[b.symbol], s: b.symbol, word: parts[0] }, lg));
        steps.push(msg('cov2', { n: counts[a.symbol], s: a.symbol, word: parts[1], note: counts[a.symbol] === 1 ? msg('cov2note', null, lg) : '' }, lg));
      } else {
        steps.push(msg('cov2', { n: counts[a.symbol], s: a.symbol, word: parts[0], note: counts[a.symbol] === 1 ? msg('cov2note', null, lg) : '' }, lg));
        steps.push(msg('cov3', { n: counts[b.symbol], s: b.symbol, word: parts[1] }, lg));
      }
      return { name: name, type: 'covalent', steps: steps };
    }

    return { name: null, type: 'unknown', steps: [msg('unknown', null, lg)] };
  }

  function ionicSteps(cat, an, f, lg) {
    var steps = [];
    var kind = cat.formula === 'NH4' ? msg('kindNH4', null, lg) : msg(cat.variable ? 'kindVar' : 'kindFixed', null, lg);
    var anKind = msg(an.poly ? 'anPoly' : 'anMono', { name: ionName(an, lg) }, lg);
    steps.push(msg('ion1', { cat: cat.formula, kind: kind, an: an.formula, anKind: anKind, q: an.charge }, lg));
    if (cat.variable) {
      steps.push(msg('ion2', { na: f.anionCount, q: an.charge, tot: an.charge * f.anionCount, nc: f.cationCount, cat: cat.formula, c: cat.charge, r: ROMAN[cat.charge] }, lg));
    }
    steps.push(msg('ion3', { name: ionicName(cat, an, lg) }, lg));
    return steps;
  }

  return {
    ELEMENTS: ELEMENTS,
    bySymbol: bySymbol,
    setLang: setLang,
    getLang: function () { return lang; },
    elName: elName,
    de: de,
    isMetal: isMetal,
    isNonmetal: isNonmetal,
    valenceElectrons: valenceElectrons,
    parseFormula: parseFormula,
    molarMass: molarMass,
    composition: composition,
    hillKey: hillKey,
    parseEquation: parseEquation,
    balance: balance,
    balanceText: balanceText,
    equationToString: equationToString,
    atomTally: atomTally,
    stoichiometry: stoichiometry,
    ionicFormula: ionicFormula,
    ionicName: ionicName,
    ionName: ionName,
    knownName: knownName,
    covalentName: covalentName,
    isPolyatomic: isPolyatomic,
    nameCompound: nameCompound,
    prefixed: prefixed,
    PREFIXES: PREFIXES,
    PREFIXES_FR: PREFIXES_FR,
    ROMAN: ROMAN,
    IDE: IDE,
    CATIONS: CATIONS,
    ANIONS: ANIONS
  };
});
