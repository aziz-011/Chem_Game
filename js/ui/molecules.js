// Molecule Explorer: name, atom count, molar mass, percent composition
// and a 3D model when one is available.
(function (root) {
  'use strict';
  var UI = root.UI, Chem = root.Chem, h = UI.h;
  var EXAMPLES = ['H2O', 'CO2', 'NaCl', 'C6H12O6', 'H2SO4', 'Ca(OH)2', 'CuSO4·5H2O', 'NH3', 'C8H18', 'Fe2O3', 'C6H6'];
  var MAX_BALLS = 60;

  function modelFor(counts) {
    var key = Chem.hillKey(counts);
    return (root.MOLECULES || []).filter(function (m) {
      return Chem.hillKey(Chem.parseFormula(m.formula).counts) === key;
    })[0] || null;
  }

  function init() {
    var form = document.getElementById('mol-form');
    var input = document.getElementById('mol-input');
    form.addEventListener('submit', function (e) { e.preventDefault(); show(input.value); });
    var ex = document.getElementById('mol-examples');
    ex.appendChild(h('span', { class: 'muted', text: 'Examples:' }));
    EXAMPLES.forEach(function (f) {
      ex.appendChild(h('button', { class: 'chip', type: 'button', html: UI.formula(f), onclick: function () { show(f); } }));
    });

    var gallery = document.getElementById('mol-gallery');
    var stage = h('div', { style: { width: '100%', marginTop: '10px' } });
    (root.MOLECULES || []).forEach(function (m, i) {
      var chip = h('button', { class: 'chip', type: 'button', html: UI.formula(m.formula) + ' <span class="muted">' + UI.esc(m.name) + '</span>',
        onclick: function () {
          gallery.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
          chip.classList.add('active');
          showModel(stage, m);
        } });
      gallery.appendChild(chip);
      if (m.formula === 'CH4') { chip.classList.add('active'); showModel(stage, m); }
    });
    gallery.parentNode.appendChild(stage);
    show('H2O', true);
  }

  function showModel(stage, m) {
    stage.innerHTML = '';
    stage.appendChild(h('div', { class: 'grid-2' }, [
      UI.viewer3d(m),
      h('div', null, [
        h('div', { class: 'big-formula', html: UI.formula(m.formula) }),
        h('div', { class: 'mol-name', text: m.name }),
        h('p', { text: m.description, style: { marginTop: '8px' } }),
        h('p', { class: 'small muted', text: m.kind === 'ionic' ? 'Dashed lines = ionic attraction (no shared electrons).' :
          'One stick = single bond (2 shared electrons), two = double bond, three = triple bond.' }),
        h('button', { class: 'btn', type: 'button', text: 'Analyze composition', onclick: function () { show(m.formula); window.scrollTo({ top: 0, behavior: 'smooth' }); } })
      ])
    ]));
  }

  function show(text, quiet) {
    var input = document.getElementById('mol-input');
    var out = document.getElementById('mol-out');
    input.value = text;
    out.innerHTML = '';
    var comp, naming;
    try {
      comp = Chem.composition(text);
      naming = Chem.nameCompound(text);
    } catch (err) {
      out.appendChild(h('div', { class: 'card error', text: err.message }));
      return;
    }
    if (!quiet && location.hash !== '#molecules') location.hash = '#molecules';

    var hasMetal = comp.order.some(Chem.isMetal);
    var unit = comp.order.length === 1 ? 'piece' : hasMetal || naming.type === 'ionic' ? 'formula unit' : 'molecule';

    // Left: identity and atoms
    var balls = h('div', { class: 'atom-balls' });
    var shown = 0;
    comp.rows.forEach(function (r) {
      for (var i = 0; i < r.count && shown < MAX_BALLS; i++, shown++) {
        var c = UI.atomColor(r.symbol);
        balls.appendChild(h('span', { class: 'ball', title: r.name, text: r.symbol, style: { background: c, color: UI.textOn(c) } }));
      }
    });
    if (comp.atoms > MAX_BALLS) balls.appendChild(h('span', { class: 'muted small', text: '+ ' + (comp.atoms - MAX_BALLS) + ' more' }));

    var steps = h('ol', { class: 'steps small' });
    naming.steps.forEach(function (s) { steps.appendChild(h('li', { text: s })); });

    var left = h('div', { class: 'card stack' }, [
      h('div', null, [
        h('div', { class: 'big-formula', html: UI.formula(text.replace(/\s+/g, '')) }),
        h('div', { class: 'mol-name', text: naming.name || 'Name not in our rules yet' }),
        naming.systematic ? h('div', { class: 'small muted', text: 'Also called: ' + naming.systematic }) : null,
        h('span', { class: 'badge', text: typeLabel(naming.type, hasMetal) })
      ]),
      h('div', null, [h('h3', { text: 'How the name is built' }), steps]),
      h('div', null, [
        h('h3', { text: comp.atoms + ' atom' + (comp.atoms > 1 ? 's' : '') + ' in one ' + unit }),
        balls,
        h('div', { class: 'small muted', text: comp.rows.map(function (r) { return r.count + ' ' + r.name; }).join(' · ') })
      ])
    ]);

    // Right: composition
    var bar = h('div', { class: 'comp-bar', role: 'img', 'aria-label': 'Percent by mass' });
    comp.rows.forEach(function (r) {
      var c = UI.atomColor(r.symbol);
      bar.appendChild(h('div', { style: { width: r.percent + '%', background: c, color: UI.textOn(c) }, title: r.name + ' ' + r.percent.toFixed(1) + '%',
        text: r.percent > 8 ? r.symbol + ' ' + r.percent.toFixed(0) + '%' : '' }));
    });
    var table = h('table', { class: 'data' }, [
      h('thead', null, h('tr', null, ['Element', 'Atoms', 'Atomic mass', 'Mass in 1 mol', '% by mass'].map(function (t, i) {
        return h('th', { text: t, style: i ? { textAlign: 'right' } : null });
      }))),
      h('tbody', null, comp.rows.map(function (r) {
        return h('tr', null, [
          h('td', null, [h('span', { class: 'ball', text: r.symbol, style: { width: '22px', height: '22px', display: 'inline-grid', fontSize: '.6rem', marginRight: '6px', verticalAlign: 'middle', background: UI.atomColor(r.symbol), color: UI.textOn(UI.atomColor(r.symbol)) } }), r.name]),
          h('td', { class: 'num', text: r.count }),
          h('td', { class: 'num', text: UI.fmt(r.atomicMass, 3) }),
          h('td', { class: 'num', text: UI.fmt(r.mass, 3) + ' g' }),
          h('td', { class: 'num', text: r.percent.toFixed(2) + ' %' })
        ]);
      }))
    ]);
    var calc = comp.rows.map(function (r) { return r.count + ' × ' + UI.fmt(r.atomicMass, 3); }).join(' + ') + ' = ' + UI.fmt(comp.molarMass, 3) + ' g/mol';
    var right = h('div', { class: 'card stack' }, [
      h('div', null, [h('h3', { text: 'Molar mass' }),
        h('div', { class: 'big-formula', style: { fontSize: '1.6rem' }, text: UI.fmt(comp.molarMass, 3) + ' g/mol' }),
        h('div', { class: 'calc-line muted', text: calc }),
        h('p', { class: 'small muted', text: 'One mole (6.022 × 10²³ ' + unit + 's) weighs this many grams.' })]),
      h('div', null, [h('h3', { text: 'Percent composition by mass' }), bar, h('div', { class: 'scroll-x' }, table)])
    ]);

    out.appendChild(h('div', { class: 'grid-2' }, [left, right]));

    var model = modelFor(comp.counts);
    if (model) {
      var stage = h('div', { class: 'card', style: { marginTop: '16px' } });
      out.appendChild(stage);
      showModel(stage, model);
    }
  }

  function typeLabel(type, hasMetal) {
    return {
      ionic: 'Ionic compound (metal + nonmetal ions)', covalent: 'Molecular (covalent) compound', acid: 'Acid',
      organic: 'Organic compound', element: 'Element', hydrate: 'Hydrate (ionic + water)', molecular: 'Molecular compound',
      unknown: hasMetal ? 'Compound containing a metal' : 'Compound'
    }[type] || 'Compound';
  }

  UI.views.molecules = { init: init, show: show };
})(this);
