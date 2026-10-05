// Reaction Lab: mix chemicals from a shelf, watch the beaker, read the
// balanced equation; plus a free equation balancer.
(function (root) {
  'use strict';
  var UI = root.UI, Chem = root.Chem, h = UI.h;
  var R = root.REACTIONS;
  var picked = [];

  var TYPES = [
    { key: 'synthesis', label: 'Synthesis', pattern: 'A + B → AB', text: 'Two or more substances combine into one product.' },
    { key: 'decomposition', label: 'Decomposition', pattern: 'AB → A + B', text: 'One compound breaks apart, usually with heat, light or electricity.' },
    { key: 'single replacement', label: 'Single replacement', pattern: 'A + BC → AC + B', text: 'A more reactive element pushes a less reactive one out of its compound.' },
    { key: 'double replacement', label: 'Double replacement', pattern: 'AB + CD → AD + CB', text: 'Two ionic compounds swap partners; often a solid precipitate forms.' },
    { key: 'combustion', label: 'Combustion', pattern: 'fuel + O₂ → CO₂ + H₂O', text: 'A fuel burns in oxygen, releasing heat and light.' },
    { key: 'neutralization', label: 'Neutralization', pattern: 'acid + base → salt + H₂O', text: 'H⁺ from the acid and OH⁻ from the base make water.' },
    { key: 'acid-carbonate', label: 'Acid + carbonate', pattern: 'acid + carbonate → salt + H₂O + CO₂', text: 'Carbonates fizz in acid, giving off carbon dioxide.' }
  ];

  function shelfItems() {
    var seen = {};
    R.reactions.forEach(function (r) { r.reactants.forEach(function (f) { seen[f] = true; }); });
    ['Au', 'NaCl', 'KNO3'].forEach(function (f) { seen[f] = true; });
    return Object.keys(seen).sort(function (a, b) { return R.reagents[a].localeCompare(R.reagents[b]); });
  }

  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    var x = a.slice().sort(), y = b.slice().sort();
    return x.every(function (v, i) { return v === y[i]; });
  }

  function findReaction(list) {
    return R.reactions.filter(function (r) { return sameSet(r.reactants, list); })[0] || null;
  }

  function init() {
    var shelf = document.getElementById('shelf');
    shelfItems().forEach(function (f) {
      var b = h('button', { class: 'reagent', type: 'button', 'data-f': f, 'aria-pressed': 'false',
        html: '<span class="f">' + UI.formula(f) + '</span> <span class="small">' + UI.esc(R.reagents[f]) + '</span>',
        onclick: function () { toggle(f); } });
      shelf.appendChild(b);
    });
    document.getElementById('shelf-filter').addEventListener('input', function (e) {
      var q = e.target.value.trim().toLowerCase();
      shelf.querySelectorAll('.reagent').forEach(function (b) {
        b.hidden = q && b.textContent.toLowerCase().indexOf(q) < 0;
      });
    });
    document.getElementById('mix-btn').addEventListener('click', mix);
    document.getElementById('clear-btn').addEventListener('click', function () { picked = []; refresh(); resetBeaker(); document.getElementById('rx-result').innerHTML = ''; });
    document.getElementById('random-btn').addEventListener('click', function () {
      picked = UI.pick(R.reactions).reactants.slice();
      refresh();
      mix();
    });

    var types = document.getElementById('rx-types');
    TYPES.forEach(function (t) {
      var examples = R.reactions.filter(function (r) { return r.type === t.key; }).slice(0, 3);
      var row = h('div', { class: 'row', style: { marginTop: '6px' } });
      examples.forEach(function (r) {
        row.appendChild(h('button', { class: 'chip', type: 'button', html: r.reactants.map(UI.formula).join(' + '), onclick: function () {
          picked = r.reactants.slice(); refresh(); mix(); document.getElementById('beaker-wrap').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } }));
      });
      types.appendChild(h('div', { class: 'type-card' }, [h('b', { text: t.label }), h('code', { text: t.pattern }), h('div', { text: t.text }), row]));
    });

    initBalancer();
    refresh();
  }

  function toggle(f) {
    var i = picked.indexOf(f);
    if (i >= 0) picked.splice(i, 1);
    else if (picked.length < 2) picked.push(f);
    else { picked.shift(); picked.push(f); }
    refresh();
  }

  function refresh() {
    document.querySelectorAll('#shelf .reagent').forEach(function (b) {
      var on = picked.indexOf(b.dataset.f) >= 0;
      b.classList.toggle('picked', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.getElementById('mix-btn').disabled = picked.length === 0;
    document.getElementById('mix-btn').textContent = picked.length === 1 ? 'React alone (heat / catalyst)' : 'Mix!';
    document.getElementById('bench-label').innerHTML = picked.length ?
      'In the beaker: <b>' + picked.map(UI.formula).join(' + ') + '</b>' : 'Pick one or two chemicals to start';
  }

  function resetBeaker() {
    document.getElementById('fx').innerHTML = '';
    var liquid = document.getElementById('liquid');
    liquid.style.height = '0';
  }

  function animate(rx) {
    var fx = document.getElementById('fx');
    var liquid = document.getElementById('liquid');
    fx.innerHTML = '';
    liquid.style.backgroundColor = '#cfe6ff';
    liquid.style.height = '45%';
    var effect = rx ? rx.effect : 'none';
    setTimeout(function () {
      if (rx) liquid.style.backgroundColor = rx.color;
      var i;
      if (effect === 'bubbles') {
        for (i = 0; i < 16; i++) {
          fx.appendChild(h('span', { class: 'bubble', style: { left: (30 + Math.random() * 110) + 'px', animationDelay: (Math.random() * 1.6) + 's', width: (6 + Math.random() * 7) + 'px' } }));
        }
      } else if (effect === 'precipitate') {
        for (i = 0; i < 40; i++) {
          fx.appendChild(h('span', { class: 'flake', style: { left: (30 + Math.random() * 115) + 'px', background: rx.color, border: '1px solid rgba(0,0,0,.15)',
            animationDelay: (Math.random() * 1.2) + 's', '--drop': (45 + Math.random() * 25) + 'px' } }));
        }
        liquid.style.backgroundColor = '#e9f2ff';
      } else if (effect === 'flame') {
        fx.appendChild(h('span', { class: 'flame' }));
      } else if (effect === 'flash') {
        fx.appendChild(h('span', { class: 'flash' }));
        fx.appendChild(h('span', { class: 'flame' }));
      } else if (effect === 'smoke') {
        for (i = 0; i < 3; i++) fx.appendChild(h('span', { class: 'smoke', style: { animationDelay: (i * 0.7) + 's' } }));
      } else if (effect === 'heat') {
        fx.appendChild(h('span', { class: 'heatwave' }));
      }
    }, 450);
  }

  function equationHTML(b) {
    function side(list) {
      return list.map(function (s) { return (s.coef > 1 ? '<span class="coef">' + s.coef + '</span> ' : '') + UI.formula(s.formula); }).join(' + ');
    }
    return side(b.reactants) + ' → ' + side(b.products);
  }

  function tallyTable(b) {
    var t = Chem.atomTally(b);
    var grid = h('div', { class: 'tally' }, [h('b', { text: 'Atom' }), h('b', { text: 'Reactants' }), h('b', { text: 'Products' }), h('span')]);
    Object.keys(t.left).forEach(function (el) {
      var ok = t.left[el] === t.right[el];
      grid.appendChild(h('span', { text: el }));
      grid.appendChild(h('span', { text: t.left[el] }));
      grid.appendChild(h('span', { text: t.right[el] || 0 }));
      grid.appendChild(h('span', { class: ok ? 'ok' : 'no', text: ok ? '✓' : '✗' }));
    });
    return grid;
  }

  // Explains why nothing happened, using the activity series where possible.
  function noReactionHint(list) {
    var act = R.activity;
    if (list.length === 1) return 'On its own, ' + R.reagents[list[0]].toLowerCase() + ' is stable here. Try mixing it with something.';
    var parsed = list.map(Chem.parseFormula);
    var elementIdx = parsed.findIndex(function (p) { return p.order.length === 1; });
    if (elementIdx >= 0 && parsed.every(function (p) { return p.order.length === 1; })) {
      var bothMetal = list.every(function (f) { return Chem.isMetal(Chem.parseFormula(f).order[0]); });
      if (bothMetal) return 'Two metals do not react with each other. When melted together they can form a mixture called an alloy.';
    }
    if (elementIdx >= 0) {
      var metal = parsed[elementIdx].order[0];
      var other = parsed[1 - elementIdx];
      var target = other.order.filter(function (el) { return Chem.isMetal(el) || el === 'H'; })[0];
      if (Chem.isMetal(metal) && target && act.indexOf(metal) >= 0 && act.indexOf(target) >= 0 && act.indexOf(metal) > act.indexOf(target)) {
        return Chem.bySymbol[metal].name + ' is <b>less reactive</b> than ' + (target === 'H' ? 'hydrogen' : Chem.bySymbol[target].name) +
          ' in the activity series, so it cannot replace it. No reaction!<br><span class="small muted">Activity series: ' + act.join(' > ') + '</span>';
      }
    }
    var ionic = list.every(function (f) { return Chem.parseFormula(f).order.some(Chem.isMetal); });
    if (ionic) return 'Both are ionic compounds, but every possible new combination stays dissolved — the ions just mix. No precipitate, gas or water forms, so there is no reaction.';
    return 'Nothing happens with this combination in our lab (or it needs special conditions).';
  }

  function mix() {
    if (!picked.length) return;
    var rx = findReaction(picked);
    var out = document.getElementById('rx-result');
    out.innerHTML = '';
    animate(rx);
    if (!rx) {
      out.appendChild(h('div', { class: 'feedback bad', html: '<b>No reaction.</b> ' + noReactionHint(picked) }));
      return;
    }
    var b = Chem.balance(rx.reactants, rx.products);
    var names = rx.products.map(function (f) { return UI.formula(f) + ' (' + UI.esc(Chem.nameCompound(f).name || f) + ')'; }).join(', ');
    out.appendChild(h('div', { class: 'stack', style: { marginTop: '8px' } }, [
      h('div', { class: 'row', style: { justifyContent: 'center' } }, [
        h('span', { class: 'badge', text: rx.type }),
        h('span', { class: 'badge ' + (rx.energy === 'exothermic' ? 'exo' : 'endo'), text: rx.energy === 'exothermic' ? '🔥 exothermic (releases heat)' : '❄ endothermic (absorbs heat)' }),
        rx.condition ? h('span', { class: 'badge', text: 'needs: ' + rx.condition }) : null
      ]),
      h('div', { class: 'equation', html: equationHTML(b) }),
      h('p', { text: rx.explain }),
      h('p', { class: 'small', html: '<b>Products:</b> ' + names }),
      h('details', null, [h('summary', { text: 'Check the atom count (law of conservation of mass)' }), tallyTable(b)])
    ]));
  }

  // ---------- Balancer ----------

  function initBalancer() {
    var form = document.getElementById('bal-form');
    var input = document.getElementById('bal-input');
    var ex = document.getElementById('bal-examples');
    ex.appendChild(h('span', { class: 'muted', text: 'Try:' }));
    ['Fe + O2 -> Fe2O3', 'C4H10 + O2', 'Al + HCl -> AlCl3 + H2', 'KClO3 -> KCl + O2', 'Ca3(PO4)2 + H2SO4 -> CaSO4 + H3PO4'].forEach(function (e) {
      ex.appendChild(h('button', { class: 'chip', type: 'button', text: e, onclick: function () { input.value = e; run(e); } }));
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); run(input.value); });
  }

  function run(text) {
    var out = document.getElementById('bal-out');
    out.innerHTML = '';
    var note = null;
    try {
      if (!/->|=|→/.test(text)) {
        var parts = text.split('+').map(function (s) { return s.trim(); }).filter(Boolean);
        var fuel = parts.filter(function (p) { return p !== 'O2'; });
        if (parts.length === 2 && fuel.length === 1 && parts.indexOf('O2') >= 0) {
          var els = Chem.parseFormula(fuel[0]).order;
          if (els.every(function (e) { return /^(C|H|O)$/.test(e); }) && els.indexOf('C') >= 0) {
            text = fuel[0] + ' + O2 -> CO2 + H2O';
            note = 'Complete combustion of a C/H/O fuel always makes CO₂ and H₂O.';
          }
        }
      }
      var b = Chem.balanceText(text);
      out.appendChild(h('div', { class: 'equation', html: equationHTML(b) }));
      if (note) out.appendChild(h('p', { class: 'small muted', text: note }));
      out.appendChild(h('details', { open: true }, [h('summary', { text: 'Atom count on each side' }), tallyTable(b)]));
      out.appendChild(h('p', { class: 'small muted', text: 'Coefficients (big numbers) multiply whole molecules. Never change the small subscripts — that would make a different substance!' }));
    } catch (err) {
      out.appendChild(h('p', { class: 'error', text: err.message }));
    }
  }

  UI.views.reactions = { init: init };
})(this);
