// Periodic table view: color modes (families, states, trends) and the
// element detail panel with a Bohr model.
(function (root) {
  'use strict';
  var UI = root.UI, Chem = root.Chem, h = UI.h;

  var NUMERIC = {
    en: { label: 'Electronegativity (Pauling)', unit: '', key: 'en',
      trend: 'Electronegativity grows going → across a period and ↑ up a group. Fluorine (top right) pulls on shared electrons the hardest; noble gases have no value because they rarely bond.' },
    radius: { label: 'Atomic radius', unit: 'pm', key: 'radius',
      trend: 'Atoms get smaller going → across a period (more protons pull the electrons closer) and bigger going ↓ a group (more shells).' },
    ie1: { label: 'First ionization energy', unit: 'kJ/mol', key: 'ie1',
      trend: 'Ionization energy (energy to remove one electron) is highest at the top right (helium) and lowest at the bottom left — that is why alkali metals react so easily.' },
    mass: { label: 'Atomic mass', unit: 'u', key: 'mass',
      trend: 'Atomic mass mostly increases with atomic number because heavier atoms have more protons and neutrons.' },
    melt: { label: 'Melting point', unit: 'K', key: 'melt',
      trend: 'Metals in the middle of the table (like tungsten) have the highest melting points; gases on the right melt far below 0 °C.' },
    density: { label: 'Density', unit: 'g/cm³ (g/L for gases)', key: 'density',
      trend: 'Density peaks around osmium and iridium in the middle of period 6.' }
  };

  var PHASES = { Solid: '#c9b8a6', Liquid: '#7fc8f8', Gas: '#f6e27f' };
  var BLOCKS = { s: '#ff9f9f', p: '#9fc5ff', d: '#ffd59a', f: '#c7a9ff' };

  var state = { mode: 'category', selected: null, hiddenCats: {}, tiles: {} };

  function init() {
    var grid = document.getElementById('ptable');
    Chem.ELEMENTS.forEach(function (el) {
      var row = el.y;
      var tile = h('button', {
        class: 'tile', type: 'button', 'data-n': el.number,
        style: { gridColumn: el.x, gridRow: row },
        'aria-label': el.name + ', atomic number ' + el.number,
        onclick: function () { select(el.number); }
      }, [h('span', { class: 'num', text: el.number }), h('span', { class: 'sym', text: el.symbol }), h('span', { class: 'nm', text: el.name })]);
      state.tiles[el.number] = tile;
      grid.appendChild(tile);
    });
    grid.appendChild(h('div', { class: 'tile placeholder', style: { gridColumn: 3, gridRow: 6 }, text: '57–71' }));
    grid.appendChild(h('div', { class: 'tile placeholder', style: { gridColumn: 3, gridRow: 7 }, text: '89–103' }));
    grid.appendChild(h('div', { class: 'pt-gap', style: { gridRow: 8 } }));

    document.getElementById('pt-color').addEventListener('change', function (e) {
      state.mode = e.target.value;
      paint();
      filter(document.getElementById('pt-search').value);
    });
    var search = document.getElementById('pt-search');
    search.addEventListener('input', function () { filter(search.value); });
    search.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var m = matches(search.value);
        if (m.length) select(m[0].number);
      }
    });
    paint();
    select(6);
  }

  function matches(q) {
    q = q.trim().toLowerCase();
    if (!q) return Chem.ELEMENTS;
    return Chem.ELEMENTS.filter(function (el) {
      return el.symbol.toLowerCase() === q || el.name.toLowerCase().indexOf(q) === 0 || String(el.number) === q;
    });
  }

  function filter(q) {
    if (!q.trim()) { paint(); return; }
    var hits = {};
    matches(q).forEach(function (el) { hits[el.number] = true; });
    Chem.ELEMENTS.forEach(function (el) { state.tiles[el.number].classList.toggle('dim', !hits[el.number]); });
  }

  function gradient(t) {
    // Blue → yellow → red scale.
    var stops = [[59, 130, 246], [250, 204, 21], [239, 68, 68]];
    var seg = t < 0.5 ? 0 : 1, lt = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    var a = stops[seg], b = stops[seg + 1];
    return 'rgb(' + a.map(function (c, i) { return Math.round(c + (b[i] - c) * lt); }).join(',') + ')';
  }

  function paint() {
    var legend = document.getElementById('pt-legend');
    var trend = document.getElementById('pt-trend');
    legend.innerHTML = '';
    trend.textContent = '';
    var mode = state.mode;

    Chem.ELEMENTS.forEach(function (el) {
      var t = state.tiles[el.number];
      t.className = t.className.replace(/\bcat-\S+/g, '').trim();
      t.style.background = '';
      t.classList.remove('dim');
      if (mode === 'category') {
        var cat = UI.category(el);
        t.classList.add('cat-' + cat.key);
        if (state.hiddenCats[cat.key]) t.classList.add('dim');
      } else if (mode === 'phase') {
        t.style.background = PHASES[el.phase] || '';
      } else if (mode === 'block') {
        t.style.background = BLOCKS[el.block] || '';
      }
    });
    if (state.selected) state.tiles[state.selected].classList.add('selected');

    if (mode === 'category') {
      UI.CATEGORIES.forEach(function (c) {
        legend.appendChild(h('button', {
          class: 'legend-item' + (state.hiddenCats[c.key] ? ' off' : ''), type: 'button',
          title: 'Click to highlight / hide',
          onclick: function () { state.hiddenCats[c.key] = !state.hiddenCats[c.key]; paint(); }
        }, [h('span', { class: 'sw cat-' + c.key }), c.label]));
      });
      legend.className = 'legend';
      trend.textContent = 'Metals are on the left and middle, nonmetals on the top right. Elements in the same column (group) have the same number of outer electrons, so they behave alike. Click a family to hide it.';
    } else if (mode === 'phase') {
      legend.className = 'legend';
      Object.keys(PHASES).forEach(function (p) { legend.appendChild(h('span', { class: 'legend-item' }, [h('span', { class: 'sw', style: { background: PHASES[p] } }), p])); });
      trend.textContent = 'At room temperature only two elements are liquid: mercury (Hg) and bromine (Br). Most nonmetals on the right are gases.';
    } else if (mode === 'block') {
      legend.className = 'legend';
      Object.keys(BLOCKS).forEach(function (b) { legend.appendChild(h('span', { class: 'legend-item' }, [h('span', { class: 'sw', style: { background: BLOCKS[b] } }), b + '-block'])); });
      trend.textContent = 'The block tells you which kind of orbital the outermost electrons fill: s (2 columns), p (6), d (10) and f (14).';
    } else {
      var cfg = NUMERIC[mode];
      var vals = Chem.ELEMENTS.map(function (el) { return el[cfg.key]; }).filter(function (v) { return v !== null && v !== undefined; });
      var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
      Chem.ELEMENTS.forEach(function (el) {
        var v = el[cfg.key];
        var t = state.tiles[el.number];
        if (v === null || v === undefined) { t.style.background = 'var(--surface-2)'; return; }
        var x = (v - min) / (max - min || 1);
        if (mode === 'density') x = Math.sqrt(x);
        t.style.background = gradient(x);
      });
      legend.className = 'gradient-legend';
      legend.appendChild(h('span', { text: UI.fmt(min) }));
      legend.appendChild(h('span', { class: 'gradient-bar', style: { background: 'linear-gradient(90deg,' + gradient(0) + ',' + gradient(0.5) + ',' + gradient(1) + ')' } }));
      legend.appendChild(h('span', { text: UI.fmt(max) + ' ' + cfg.unit }));
      legend.appendChild(h('span', { class: 'muted', text: '· grey = no data' }));
      trend.textContent = cfg.trend;
    }
  }

  function select(n) {
    if (state.selected) state.tiles[state.selected].classList.remove('selected');
    state.selected = n;
    state.tiles[n].classList.add('selected');
    renderPanel(Chem.ELEMENTS[n - 1]);
  }

  function prop(label, value) {
    return [h('dt', { text: label }), h('dd', { html: value })];
  }

  function renderPanel(el) {
    var panel = document.getElementById('element-panel');
    panel.innerHTML = '';
    var cat = UI.category(el);
    var valence = Chem.valenceElectrons(el);
    var melt = UI.kelvinToC(el.melt), boil = UI.kelvinToC(el.boil);

    panel.appendChild(h('div', { class: 'el-head' }, [
      h('div', { class: 'el-big cat-' + cat.key }, [h('span', { class: 'num', text: el.number }), h('span', { class: 'sym', text: el.symbol })]),
      h('div', null, [h('h3', { text: el.name, style: { fontSize: '1.4rem', margin: 0 } }), h('div', { class: 'muted small', text: cat.label + ' · ' + el.phase })])
    ]));

    panel.appendChild(h('div', { class: 'particles' }, [
      h('div', { class: 'particle p' }, [h('b', { text: el.number }), 'protons']),
      h('div', { class: 'particle n' }, [h('b', { text: UI.neutrons(el) }), 'neutrons*']),
      h('div', { class: 'particle e' }, [h('b', { text: el.number }), 'electrons'])
    ]));
    panel.appendChild(UI.bohr(el, 200));
    panel.appendChild(h('p', { class: 'small muted', style: { textAlign: 'center' }, text: 'Electrons per shell: ' + el.shells.join(', ') }));

    var dl = h('dl', { class: 'el-props' });
    [
      prop('Atomic mass', UI.fmt(el.mass, 3) + ' u'),
      prop('Group / Period', (el.group || '—') + ' / ' + el.period),
      prop('Electron config.', UI.esc(el.config).replace(/([spdf])(\d+)/g, '$1<sup>$2</sup>')),
      prop('Valence electrons', valence === null ? 'varies (d/f-block)' : valence),
      prop('Electronegativity', UI.fmt(el.en)),
      prop('Atomic radius', el.radius ? el.radius + ' pm' : '—'),
      prop('1st ionization', el.ie1 ? UI.fmt(el.ie1, 1) + ' kJ/mol' : '—'),
      prop('Melting point', melt === null ? '—' : UI.fmt(melt, 1) + ' °C'),
      prop('Boiling point', boil === null ? '—' : UI.fmt(boil, 1) + ' °C'),
      prop('Density', el.density ? UI.fmt(el.density, 4) + ' ' + (el.densityUnit || '') : '—'),
      prop('Discovered by', UI.esc(el.discoveredBy || '—'))
    ].forEach(function (pair) { pair.forEach(function (n) { dl.appendChild(n); }); });
    panel.appendChild(dl);
    if (el.summary) panel.appendChild(h('p', { class: 'small', text: el.summary }));
    panel.appendChild(h('div', { class: 'row' }, [
      h('button', { class: 'btn', type: 'button', text: 'Compare this atom', onclick: function () { UI.views.compare.setA(el.number); location.hash = '#compare'; } }),
      el.source ? h('a', { class: 'btn', href: el.source, target: '_blank', rel: 'noopener', text: 'Read more ↗', style: { textDecoration: 'none' } }) : null
    ]));
    panel.appendChild(h('p', { class: 'small muted', style: { marginTop: '10px' }, text: '*Neutrons for the most common isotope ≈ mass number − protons.' }));
  }

  UI.views.table = { init: init, select: select };
})(this);
