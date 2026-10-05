// Core chemistry logic: formula parsing, molar mass, composition,
// equation balancing and compound naming. Works in the browser
// (window.Chem) and in Node (require) so it can be unit-tested.
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory(require('./data/elements.js'), require('./data/compounds.js'));
  } else {
    root.Chem = factory(root.ELEMENTS, root.COMPOUNDS);
  }
})(this, function (ELEMENTS, COMPOUNDS) {
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
    if (!text) throw new Error('Type a formula, e.g. H2O or Ca(OH)2.');
    text = normalizeSubscripts(text);

    var parts = text.split(/[·•*.]/);
    var counts = {};
    var order = [];
    parts.forEach(function (part, idx) {
      if (!part) throw new Error('Unexpected "·" in formula.');
      var m = /^(\d+)(.*)$/.exec(part);
      var mult = 1;
      if (m && idx > 0) { mult = parseInt(m[1], 10); part = m[2]; }
      else if (m) throw new Error('A formula cannot start with a number (use coefficients only in equations).');
      var res = parseGroup(part, 0, null);
      if (res.pos !== part.length) throw new Error('Unexpected "' + part[res.pos] + '" in formula.');
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
        if (c !== closer) throw new Error('Unmatched "' + c + '" in formula.');
        return { counts: counts, order: order, pos: pos + 1 };
      } else if (/[A-Z]/.test(c)) {
        var sym = c;
        if (pos + 1 < s.length && /[a-z]/.test(s[pos + 1])) {
          sym += s[pos + 1];
        }
        if (!bySymbol[sym] && sym.length === 2 && bySymbol[c]) sym = c;
        if (!bySymbol[sym]) throw new Error('"' + sym + '" is not an element symbol.');
        var k = readNumber(s, pos + sym.length);
        if (k.value === 0) throw new Error('Subscripts must be at least 1.');
        add(counts, order, sym, k.value);
        pos = k.pos;
      } else if (/[a-z]/.test(c)) {
        throw new Error('Element symbols start with a capital letter ("' + c.toUpperCase() + '", not "' + c + '").');
      } else {
        throw new Error('Unexpected "' + c + '" in formula.');
      }
    }
    if (closer) throw new Error('Missing "' + closer + '" in formula.');
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
    if (sides.length !== 2) throw new Error('Write the equation as reactants -> products, e.g. H2 + O2 -> H2O.');
    function side(s) {
      return s.split('+').map(function (t) { return t.trim().replace(/^\d+\s*/, ''); })
        .filter(function (t) { return t.length; });
    }
    var r = side(sides[0]); var p = side(sides[1]);
    if (!r.length || !p.length) throw new Error('Both sides of the equation need at least one substance.');
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
        throw new Error(bySymbol[el].name + ' (' + el + ') appears on only one side — atoms cannot appear or disappear in a reaction.');
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
    if (free.length === 0) throw new Error('This equation cannot be balanced — check the formulas.');
    if (free.length > 1) throw new Error('This equation can be balanced in more than one way — it is probably two reactions combined.');

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
      throw new Error('No positive set of coefficients balances this — a substance may be on the wrong side.');
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

  function ionicName(cation, anion) { return cation.name + ' ' + anion.name; }

  function sameCounts(a, b) {
    var ka = Object.keys(a); var kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every(function (k) { return a[k] === b[k]; });
  }

  // ---------- Naming ----------

  var PREFIXES = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca'];
  var ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

  var IDE = {
    H: 'hydride', B: 'boride', C: 'carbide', N: 'nitride', O: 'oxide', F: 'fluoride',
    Si: 'silicide', P: 'phosphide', S: 'sulfide', Cl: 'chloride', As: 'arsenide',
    Se: 'selenide', Br: 'bromide', Te: 'telluride', I: 'iodide', At: 'astatide'
  };

  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }

  function prefixed(n, word, isFirst) {
    if (isFirst && n === 1) return word;
    var p = PREFIXES[n] || (n + '-');
    // Drop the final vowel of the prefix before "oxide" (monoxide, pentoxide).
    if (/^o/.test(word) && /[ao]$/.test(p)) p = p.slice(0, -1);
    return p + word;
  }

  function findKnown(counts) {
    var key = hillKey(counts);
    for (var i = 0; i < COMPOUNDS.known.length; i++) {
      var k = COMPOUNDS.known[i];
      if (hillKey(parseFormula(k.formula).counts) === key) return k;
    }
    return null;
  }

  function alkaneName(counts) {
    var names = ['', 'methane', 'ethane', 'propane', 'butane', 'pentane', 'hexane', 'heptane', 'octane', 'nonane', 'decane'];
    var keys = Object.keys(counts);
    if (keys.length !== 2 || !counts.C || !counts.H) return null;
    if (counts.H === 2 * counts.C + 2 && names[counts.C]) return names[counts.C];
    return null;
  }

  // Names a compound from its formula. Returns
  // { name, type, steps: [explanations] } or { name: null, ... } if unknown.
  function nameCompound(formula) {
    var text = normalizeSubscripts(String(formula).replace(/\s+/g, ''));
    var parsed = parseFormula(text);
    var counts = parsed.counts;
    var steps = [];

    // Hydrates: CuSO4·5H2O
    var hyd = /^(.+?)[·•*.](\d*)H2O$/.exec(text);
    if (hyd) {
      var n = hyd[2] ? parseInt(hyd[2], 10) : 1;
      var base = nameCompound(hyd[1]);
      if (base.name) {
        var hydName = base.name + ' ' + (PREFIXES[n] || n + '-') + 'hydrate';
        return {
          name: hydName, type: 'hydrate',
          steps: base.steps.concat(['The "·' + n + 'H2O" means ' + n + ' water molecule' + (n > 1 ? 's are' : ' is') +
            ' trapped in the crystal → add "' + (PREFIXES[n] || n + '-') + 'hydrate".'])
        };
      }
    }

    var known = findKnown(counts);
    if (known) {
      steps.push(known.formula + ' is a well-known compound with a common name' + (known.note ? ': ' + known.note : '.'));
      return { name: known.name, type: known.type || 'common', steps: steps, systematic: known.systematic };
    }

    // Pure elements
    if (parsed.order.length === 1) {
      var el = bySymbol[parsed.order[0]];
      var cnt = counts[el.symbol];
      steps.push('Only one kind of atom → this is the element ' + el.name.toLowerCase() + '.');
      if (cnt === 2 && ['H', 'N', 'O', 'F', 'Cl', 'Br', 'I'].indexOf(el.symbol) >= 0) {
        steps.push(el.name + ' exists as diatomic molecules (' + el.symbol + '2).');
      }
      return { name: lower(el.name) + (cnt === 3 && el.symbol === 'O' ? ' (ozone)' : ''), type: 'element', steps: steps };
    }

    var alk = alkaneName(counts);
    if (alk) {
      steps.push('Only C and H with H = 2×C + 2 → an alkane (single bonds only).');
      steps.push(counts.C + ' carbon atom' + (counts.C > 1 ? 's' : '') + ' → prefix "' + alk.replace(/ane$/, '') + '-" + "-ane".');
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
        name: ionicName(match.cation, match.anion), type: 'ionic',
        steps: ionicSteps(match.cation, match.anion, match.f), cation: match.cation, anion: match.anion
      };
    }

    // Binary covalent (two nonmetals)
    if (parsed.order.length === 2 && parsed.order.every(isNonmetal)) {
      var a = bySymbol[parsed.order[0]]; var b = bySymbol[parsed.order[1]];
      var first = prefixed(counts[a.symbol], lower(a.name), true);
      var second = prefixed(counts[b.symbol], IDE[b.symbol] || lower(b.name) + 'ide', false);
      steps.push('Both ' + a.name + ' and ' + b.name + ' are nonmetals → a molecular (covalent) compound; use Greek prefixes.');
      steps.push(counts[a.symbol] + ' ' + a.symbol + ' → "' + first + '"' + (counts[a.symbol] === 1 ? ' (no "mono" on the first element)' : '') + '.');
      steps.push(counts[b.symbol] + ' ' + b.symbol + ' → "' + second + '" (the second element ends in -ide).');
      return { name: first + ' ' + second, type: 'covalent', steps: steps };
    }

    return {
      name: null, type: 'unknown',
      steps: ['This compound is outside the naming rules this app knows (it may be organic or a complex ion).']
    };
  }

  function ionicSteps(cat, an, f) {
    var steps = [];
    var catKind = cat.formula === 'NH4' ? 'the polyatomic ion ammonium' :
      (cat.variable ? 'a metal that can form more than one ion' : 'a metal with only one common charge');
    steps.push(cat.formula + ' is ' + catKind + '; ' + an.formula + ' is ' +
      (isPolyatomic(an) ? 'the polyatomic ion ' + an.name : 'a nonmetal → the "-ide" ion ' + an.name) + ' (charge ' + an.charge + '−).');
    if (cat.variable) {
      var totalNeg = an.charge * f.anionCount;
      steps.push('Total negative charge: ' + f.anionCount + ' × ' + an.charge + '− = ' + totalNeg + '−. Spread over ' +
        f.cationCount + ' ' + cat.formula + ' → each is ' + cat.charge + '+, so write the Roman numeral (' + ROMAN[cat.charge] + ').');
    }
    steps.push('Name the cation first, then the anion: ' + ionicName(cat, an) + '.');
    return steps;
  }

  return {
    ELEMENTS: ELEMENTS,
    bySymbol: bySymbol,
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
    ionicFormula: ionicFormula,
    ionicName: ionicName,
    isPolyatomic: isPolyatomic,
    nameCompound: nameCompound,
    prefixed: prefixed,
    PREFIXES: PREFIXES,
    ROMAN: ROMAN,
    IDE: IDE,
    CATIONS: CATIONS,
    ANIONS: ANIONS
  };
});
