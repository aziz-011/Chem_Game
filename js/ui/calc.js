// Quantity calculator: enter masses, get moles, the limiting reactant, the
// theoretical yield and the percent yield, each step worked out with numbers.
(function (root) {
  'use strict';
  var UI = root.UI, Chem = root.Chem, I18N = root.I18N, h = UI.h;
  var t = function (k, v) { return I18N.t(k, v); };
  var uid = 0;

  I18N.add({
    en: {
      'calc.title': 'Calculate the quantities',
      'calc.intro': 'Type the mass of each reactant you start with. Leave a box empty if that reactant is in excess.',
      'calc.mass': 'mass of {f} (g)', 'calc.actual': 'Mass of {f} you actually got (g, optional)',
      'calc.s1': '1. Molar masses', 'calc.s2': '2. Moles of each reactant (n = m ÷ M)',
      'calc.s3': '3. Limiting reactant (divide moles by the coefficient)', 'calc.s4': '4. Theoretical yield',
      'calc.s5': '5. What is left over', 'calc.s6': '6. Percent yield',
      'calc.limiting': '{f} is the limiting reactant: it runs out first and decides how much product forms.',
      'calc.excess': 'in excess (not limiting)', 'calc.smallest': 'smallest',
      'calc.ratio': 'From the equation, {a} mol of {l} gives {b} mol of {p}.',
      'calc.left': '{f}: {n} − {u} = {r} mol left = {m} g',
      'calc.allUsed': 'Everything given is used up exactly.',
      'calc.need': 'Enter at least one mass to start.',
      'calc.yield': '% yield = actual ÷ theoretical × 100 = {a} g ÷ {t} g × 100 = {y} %',
      'calc.yieldHigh': 'More than 100 %: the product is probably still wet or impure.'
    },
    fr: {
      'calc.title': 'Calculer les quantités',
      'calc.intro': 'Tape la masse de chaque réactif au départ. Laisse une case vide si ce réactif est en excès.',
      'calc.mass': 'masse de {f} (g)', 'calc.actual': 'Masse de {f} réellement obtenue (g, facultatif)',
      'calc.s1': '1. Masses molaires', 'calc.s2': '2. Quantité de matière de chaque réactif (n = m ÷ M)',
      'calc.s3': '3. Réactif limitant (diviser n par le coefficient)', 'calc.s4': '4. Rendement théorique',
      'calc.s5': '5. Ce qui reste', 'calc.s6': '6. Rendement en pourcentage',
      'calc.limiting': '{f} est le réactif limitant : il s’épuise en premier et fixe la quantité de produit.',
      'calc.excess': 'en excès (non limitant)', 'calc.smallest': 'le plus petit',
      'calc.ratio': 'D’après l’équation, {a} mol de {l} donne {b} mol de {p}.',
      'calc.left': '{f} : {n} − {u} = {r} mol restantes = {m} g',
      'calc.allUsed': 'Tout ce qui a été donné est consommé exactement.',
      'calc.need': 'Entre au moins une masse pour commencer.',
      'calc.yield': 'rendement = réel ÷ théorique × 100 = {a} g ÷ {t} g × 100 = {y} %',
      'calc.yieldHigh': 'Plus de 100 % : le produit est sans doute encore humide ou impur.'
    }
  });

  function num(x, d) {
    if (d === undefined) d = 3;
    if (x === 0) return '0';
    var a = Math.abs(x);
    if (a < 0.001 || a >= 1e6) return x.toExponential(2).replace('e', ' × 10^');
    return Number(x.toFixed(a < 1 ? 4 : d)).toLocaleString(I18N.locale ? I18N.locale() : undefined, { maximumFractionDigits: a < 1 ? 4 : d });
  }

  function f(formula) { return UI.formula(formula); }

  // Breakdown of a molar mass: "6 × 12.011 + 6 × 1.008 = 78.114 g/mol"
  function massLine(formula) {
    var comp = Chem.composition(formula);
    return 'M(' + f(formula) + ') = ' + comp.rows.map(function (r) { return r.count + ' × ' + num(r.atomicMass) ; }).join(' + ') +
      ' = <b>' + num(comp.molarMass) + ' g/mol</b>';
  }

  // balanced: result of Chem.balance. opts.defaults: { formula: grams }, opts.main: product formula of interest.
  function calculator(balanced, opts) {
    opts = opts || {};
    var id = 'calc' + (++uid);
    var main = opts.main || balanced.products[0].formula;
    var inputs = {};
    var grid = h('div', { class: 'calc-inputs' });
    balanced.reactants.forEach(function (r, i) {
      var inp = h('input', { class: 'input', type: 'number', min: '0', step: 'any', id: id + '-r' + i, inputmode: 'decimal',
        value: opts.defaults && opts.defaults[r.formula] !== undefined ? opts.defaults[r.formula] : '' });
      inputs[r.formula] = inp;
      grid.appendChild(h('label', { for: id + '-r' + i }, [h('span', { html: t('calc.mass', { f: f(r.formula) }) }), inp]));
    });
    var actual = h('input', { class: 'input', type: 'number', min: '0', step: 'any', id: id + '-actual', inputmode: 'decimal' });
    grid.appendChild(h('label', { for: id + '-actual' }, [h('span', { html: t('calc.actual', { f: f(main) }) }), actual]));
    var out = h('div', { class: 'calc-out', 'aria-live': 'polite' });

    function update() {
      var masses = {};
      Object.keys(inputs).forEach(function (k) { masses[k] = parseFloat(inputs[k].value); });
      var s = Chem.stoichiometry(balanced, masses);
      out.innerHTML = '';
      if (!s) { out.appendChild(h('p', { class: 'muted small', text: t('calc.need') })); return; }
      var mainP = s.products.filter(function (p) { return p.formula === main; })[0] || s.products[0];
      var lim = s.limiting;

      function section(title, lines) {
        var box = h('div', { class: 'calc-step' }, [h('h4', { text: title })]);
        lines.forEach(function (l) { box.appendChild(h('div', { class: 'calc-line', html: l })); });
        out.appendChild(box);
      }

      var formulas = balanced.reactants.map(function (r) { return r.formula; }).concat([mainP.formula]);
      section(t('calc.s1'), formulas.filter(function (x, i) { return formulas.indexOf(x) === i; }).map(massLine));

      section(t('calc.s2'), s.reactants.map(function (r) {
        return r.n === null ? 'n(' + f(r.formula) + '): ' + t('calc.excess') :
          'n(' + f(r.formula) + ') = ' + num(r.mass) + ' g ÷ ' + num(r.M) + ' g/mol = <b>' + num(r.n) + ' mol</b>';
      }));

      var lines3 = s.reactants.filter(function (r) { return r.n !== null; }).map(function (r) {
        return f(r.formula) + ': ' + num(r.n) + ' ÷ ' + r.coef + ' = ' + num(r.n / r.coef) + (r === lim ? ' ← <b>' + t('calc.smallest') + '</b>' : '');
      });
      lines3.push('<b>' + t('calc.limiting', { f: f(lim.formula) }) + '</b>');
      section(t('calc.s3'), lines3);

      section(t('calc.s4'), [
        t('calc.ratio', { a: lim.coef, l: f(lim.formula), b: mainP.coef, p: f(mainP.formula) }),
        'n(' + f(mainP.formula) + ') = ' + num(lim.n) + ' × ' + mainP.coef + ' ÷ ' + lim.coef + ' = <b>' + num(mainP.n) + ' mol</b>',
        'm(' + f(mainP.formula) + ') = n × M = ' + num(mainP.n) + ' mol × ' + num(mainP.M) + ' g/mol = <b class="calc-answer">' + num(mainP.mass, 2) + ' g</b>'
      ].concat(s.products.filter(function (p) { return p !== mainP; }).map(function (p) {
        return 'm(' + f(p.formula) + ') = ' + num(p.n) + ' mol × ' + num(p.M) + ' g/mol = ' + num(p.mass, 2) + ' g';
      })));

      var left = s.reactants.filter(function (r) { return r.n !== null && r !== lim && r.left > 1e-9; });
      section(t('calc.s5'), left.length ? left.map(function (r) {
        return t('calc.left', { f: f(r.formula), n: num(r.n), u: num(r.needed), r: num(r.left), m: num(r.leftMass, 2) });
      }) : [t('calc.allUsed')]);

      var a = parseFloat(actual.value);
      if (a > 0) {
        var y = a / mainP.mass * 100;
        var l6 = [t('calc.yield', { a: num(a, 2), t: num(mainP.mass, 2), y: '<b class="calc-answer">' + num(y, 1) + '</b>' })];
        if (y > 100) l6.push('<span class="error">' + t('calc.yieldHigh') + '</span>');
        section(t('calc.s6'), l6);
      }
    }

    Object.keys(inputs).forEach(function (k) { inputs[k].addEventListener('input', update); });
    actual.addEventListener('input', update);
    update();
    return h('div', { class: 'calc' }, [
      h('h3', { text: t('calc.title') }),
      h('p', { class: 'small muted', text: t('calc.intro') }),
      grid, out
    ]);
  }

  UI.calculator = calculator;
})(this);
