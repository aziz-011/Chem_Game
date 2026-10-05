// Compare Atoms view: side-by-side Bohr models, property bars and an
// auto-written list of the key differences (including the bond they form).
(function (root) {
  'use strict';
  var UI = root.UI, Chem = root.Chem, h = UI.h;
  var A = 11, B = 17;

  var PRESETS = [[11, 17], [6, 14], [3, 55], [8, 16], [2, 10], [26, 29], [9, 53], [12, 8], [1, 8]];

  var PROPS = [
    { key: 'number', label: 'Protons (atomic number)', fmt: function (v) { return v; } },
    { key: 'mass', label: 'Atomic mass', unit: 'u', fmt: function (v) { return UI.fmt(v, 2); } },
    { key: 'radius', label: 'Atomic radius', unit: 'pm', fmt: function (v) { return v; } },
    { key: 'en', label: 'Electronegativity', fmt: function (v) { return UI.fmt(v, 2); } },
    { key: 'ie1', label: 'First ionization energy', unit: 'kJ/mol', fmt: function (v) { return UI.fmt(v, 0); } },
    { key: 'melt', label: 'Melting point', unit: '°C', value: function (e) { return e.melt; }, fmt: function (v) { return UI.fmt(UI.kelvinToC(v), 0); } },
    { key: 'density', label: 'Density', unit: 'g/cm³', value: densityCm3, fmt: function (v) { return v < 0.01 ? v.toExponential(1) : UI.fmt(v, 2); } }
  ];

  function densityCm3(e) {
    if (e.density === null || e.density === undefined) return null;
    return e.densityUnit === 'g/L' ? e.density / 1000 : e.density;
  }

  // Most likely simple ion for main-group elements.
  function typicalCharge(el) {
    if (el.block === 's' && el.symbol !== 'H' && el.symbol !== 'He') return el.group;
    if (el.group === 13 && el.symbol !== 'B') return 3;
    if (el.group === 15 && el.period <= 3) return -3;
    if (el.group === 16 && el.period <= 5) return -2;
    if (el.group === 17) return -1;
    return null;
  }

  function ionText(el, q) {
    var sup = (Math.abs(q) > 1 ? Math.abs(q) : '') + (q > 0 ? '+' : '−');
    return el.symbol + '<sup>' + sup + '</sup>';
  }

  function init() {
    var sa = document.getElementById('cmp-a'), sb = document.getElementById('cmp-b');
    Chem.ELEMENTS.forEach(function (el) {
      var label = el.number + ' — ' + el.symbol + ' ' + el.name;
      sa.appendChild(h('option', { value: el.number, text: label }));
      sb.appendChild(h('option', { value: el.number, text: label }));
    });
    sa.addEventListener('change', function () { A = +sa.value; render(); });
    sb.addEventListener('change', function () { B = +sb.value; render(); });
    var presets = document.getElementById('cmp-presets');
    presets.appendChild(h('span', { class: 'muted', text: 'Try:' }));
    PRESETS.forEach(function (p) {
      var a = Chem.ELEMENTS[p[0] - 1], b = Chem.ELEMENTS[p[1] - 1];
      presets.appendChild(h('button', { class: 'chip', type: 'button', text: a.symbol + ' vs ' + b.symbol,
        onclick: function () { A = p[0]; B = p[1]; render(); } }));
    });
    render();
  }

  function setA(n) { A = n; if (A === B) B = n === 8 ? 16 : 8; render(); }

  function atomCard(el, side) {
    var cat = UI.category(el);
    var v = Chem.valenceElectrons(el);
    var q = typicalCharge(el);
    return h('div', { class: 'card cmp-card' }, [
      h('h3', null, [h('span', { class: 'badge cat-' + cat.key, style: { color: 'var(--tile-text)' }, text: el.symbol }), el.name,
        h('span', { class: 'badge', style: { marginLeft: 'auto', background: side === 'a' ? 'var(--cmp-a)' : 'var(--cmp-b)', color: 'var(--on-accent)' }, text: side.toUpperCase() })]),
      h('div', { class: 'muted small', text: cat.label + ' · ' + el.phase + ' at room temperature' }),
      UI.bohr(el, 190),
      h('div', { class: 'particles' }, [
        h('div', { class: 'particle p' }, [h('b', { text: el.number }), 'protons']),
        h('div', { class: 'particle n' }, [h('b', { text: UI.neutrons(el) }), 'neutrons']),
        h('div', { class: 'particle e' }, [h('b', { text: el.number }), 'electrons'])
      ]),
      h('div', { class: 'small', html: 'Shells: <b>' + el.shells.join(', ') + '</b> · Valence electrons: <b>' + (v === null ? 'varies' : v) + '</b>' +
        (q ? ' · Usual ion: <b>' + ionText(el, q) + '</b>' : '') })
    ]);
  }

  function bars(a, b) {
    var wrap = h('div', { class: 'cmp-bars' });
    PROPS.forEach(function (p) {
      var get = p.value || function (e) { return e[p.key]; };
      var va = get(a), vb = get(b);
      var max = Math.max(va || 0, vb || 0) || 1;
      function bar(el, v, cls) {
        var w = v === null || v === undefined ? 0 : Math.max(2, (v / max) * 100);
        return h('div', { class: 'cmp-bar' }, [
          h('b', { text: el.symbol }),
          h('div', { class: 'track' }, [h('div', { class: 'fill ' + cls, style: { width: w + '%' } })]),
          h('span', { class: 'val', text: v === null || v === undefined ? 'no data' : p.fmt(v) + (p.unit ? ' ' + p.unit : '') })
        ]);
      }
      wrap.appendChild(h('div', { class: 'cmp-row' }, [h('div', { class: 'label', text: p.label }), bar(a, va, 'a'), bar(b, vb, 'b')]));
    });
    return wrap;
  }

  function differences(a, b) {
    var out = [];
    if (a.number === b.number) return ['These are the same element — every atom of an element has the same number of protons.'];
    var hi = a.number > b.number ? a : b, lo = hi === a ? b : a;
    out.push('<b>' + hi.name + '</b> has ' + (hi.number - lo.number) + ' more proton' + (hi.number - lo.number > 1 ? 's' : '') +
      ' than ' + lo.name + '. The number of protons is what makes an element that element.');

    if (a.period === b.period) out.push('Both are in period ' + a.period + ', so their electrons fill the same number of shells (' + a.shells.length + ').');
    else {
      var more = a.shells.length > b.shells.length ? a : b, less = more === a ? b : a;
      out.push(more.name + ' has ' + more.shells.length + ' electron shells and ' + less.name + ' has ' + less.shells.length +
        '. Extra shells put the outer electrons farther from the nucleus.');
    }

    if (a.group && a.group === b.group) {
      var v = Chem.valenceElectrons(a);
      out.push('They are in the <b>same group</b> (' + a.group + ')' + (v !== null ? ', each with ' + v + ' valence electron' + (v > 1 ? 's' : '') : '') +
        ', so they have similar chemical properties.');
    }

    if (a.radius && b.radius && a.radius !== b.radius) {
      var big = a.radius > b.radius ? a : b, small = big === a ? b : a;
      out.push(big.name + ' atoms are about ' + UI.fmt(big.radius / small.radius, 1) + '× wider than ' + small.name + ' atoms.');
    }

    var ma = Chem.isMetal(a.symbol), mb = Chem.isMetal(b.symbol);
    if (ma !== mb) {
      var metal = ma ? a : b, non = ma ? b : a;
      out.push(metal.name + ' is a <b>metal</b> (tends to lose electrons and become a positive ion); ' + non.name +
        ' is a <b>nonmetal</b> (tends to gain or share electrons).');
    } else {
      out.push('Both are ' + (ma ? 'metals' : 'nonmetals') + '.');
    }

    var bond = bondBetween(a, b);
    if (bond) out.push(bond);
    return out;
  }

  function bondBetween(a, b) {
    if (/noble gas/.test(a.category) || /noble gas/.test(b.category)) {
      return 'Noble gases have full outer shells, so they almost never bond with anything.';
    }
    var ma = Chem.isMetal(a.symbol), mb = Chem.isMetal(b.symbol);
    if (ma && mb) return 'If combined, two metals form a <b>metallic bond</b> — a mixture of metals is called an alloy.';
    if (a.en === null || b.en === null) return null;
    var d = Math.abs(a.en - b.en);
    var kind = d > 1.7 ? '<b>ionic</b> bond (electrons are transferred)' : d >= 0.4 ? '<b>polar covalent</b> bond (electrons shared unequally)' :
      '<b>nonpolar covalent</b> bond (electrons shared equally)';
    var text = 'Electronegativity difference: |' + UI.fmt(a.en) + ' − ' + UI.fmt(b.en) + '| = <b>' + UI.fmt(d) + '</b> → they would form a ' + kind + '.';
    var qa = typicalCharge(a), qb = typicalCharge(b);
    if (qa && qb && qa * qb < 0) {
      var cat = qa > 0 ? a : b, an = qa > 0 ? b : a;
      var f = Chem.ionicFormula({ formula: cat.symbol, charge: Math.abs(typicalCharge(cat)) }, { formula: an.symbol, charge: Math.abs(typicalCharge(an)) }).formula;
      var name = Chem.nameCompound(f).name;
      text += ' The ions ' + ionText(cat, typicalCharge(cat)) + ' and ' + ionText(an, typicalCharge(an)) + ' combine as <b>' + UI.formula(f) + '</b>' +
        (name ? ' (' + UI.esc(name) + ')' : '') + '.';
    }
    return text;
  }

  function render() {
    document.getElementById('cmp-a').value = A;
    document.getElementById('cmp-b').value = B;
    var a = Chem.ELEMENTS[A - 1], b = Chem.ELEMENTS[B - 1];
    var out = document.getElementById('cmp-out');
    out.innerHTML = '';
    out.appendChild(h('div', { class: 'grid-2' }, [atomCard(a, 'a'), atomCard(b, 'b')]));
    var diff = h('ul', { class: 'diff-list' });
    differences(a, b).forEach(function (t) { diff.appendChild(h('li', { html: t })); });
    out.appendChild(h('div', { class: 'grid-2' }, [
      h('div', { class: 'card' }, [h('h3', { text: 'Key differences' }), diff]),
      h('div', { class: 'card' }, [h('h3', { text: 'Side by side' }), bars(a, b)])
    ]));
  }

  UI.views.compare = { init: init, setA: setA };
})(this);
