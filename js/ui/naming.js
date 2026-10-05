// Naming view: formula ⇄ name tool, ion builder, quiz and reference rules.
(function (root) {
  'use strict';
  var UI = root.UI, Chem = root.Chem, h = UI.h;
  var C = root.COMPOUNDS;

  function ionHTML(ion, sign) {
    var q = (ion.charge > 1 ? ion.charge : '') + sign;
    return UI.formula(ion.formula) + '<sup>' + q + '</sup>';
  }

  // ---------- Name ⇄ formula ----------

  var covalentNames = null;
  function buildCovalentNames() {
    covalentNames = {};
    var nonmetals = Chem.ELEMENTS.filter(function (e) { return Chem.isNonmetal(e.symbol) && Chem.IDE[e.symbol]; });
    var firsts = Chem.ELEMENTS.filter(function (e) { return Chem.isNonmetal(e.symbol) && (!/noble/.test(e.category) || e.symbol === 'Xe'); });
    firsts.forEach(function (a) {
      nonmetals.forEach(function (b) {
        if (a === b) return;
        for (var i = 1; i <= 10; i++) {
          for (var j = 1; j <= 10; j++) {
            var name = Chem.prefixed(i, a.name.toLowerCase(), true) + ' ' + Chem.prefixed(j, Chem.IDE[b.symbol], false);
            covalentNames[name] = a.symbol + (i > 1 ? i : '') + b.symbol + (j > 1 ? j : '');
          }
        }
      });
    });
  }

  function nameToFormula(name) {
    var n = name.trim().toLowerCase().replace(/\s+/g, ' ').replace(/aluminium/, 'aluminum').replace(/caesium/, 'cesium').replace(/sulph/g, 'sulf');
    var hit = C.known.filter(function (k) {
      return k.name.toLowerCase() === n || k.name.toLowerCase().split(' (')[0] === n || (k.systematic || '').toLowerCase() === n;
    })[0];
    if (hit) return { formula: hit.formula, how: 'This is a common name you need to memorize.' };
    for (var i = 0; i < C.cations.length; i++) {
      for (var j = 0; j < C.anions.length; j++) {
        var cat = C.cations[i], an = C.anions[j];
        var names = [Chem.ionicName(cat, an)];
        if (an.alt && !/⁻/.test(an.alt)) names.push(cat.name + ' ' + an.alt);
        if (names.map(function (x) { return x.toLowerCase(); }).indexOf(n) >= 0) {
          var f = Chem.ionicFormula(cat, an);
          return { formula: f.formula, cation: cat, anion: an, counts: f,
            how: cat.name + ' = ' + cat.formula + ' (charge ' + cat.charge + '+), ' + an.name + ' = ' + an.formula + ' (charge ' + an.charge + '−). ' +
              'Balance the charges: ' + f.cationCount + ' × (+' + cat.charge + ') + ' + f.anionCount + ' × (−' + an.charge + ') = 0.' };
        }
      }
    }
    if (!covalentNames) buildCovalentNames();
    if (covalentNames[n]) return { formula: covalentNames[n], how: 'Molecular compound: each Greek prefix tells you how many atoms (mono = 1, di = 2, tri = 3 …).' };
    var el = Chem.ELEMENTS.filter(function (e) { return e.name.toLowerCase() === n; })[0];
    if (el) return { formula: el.symbol, how: 'This is an element.' };
    return null;
  }

  function renderNameTool() {
    var box = document.getElementById('naming-name');
    var input = h('input', { class: 'input', placeholder: 'Formula (Fe2O3) or name (iron(III) oxide)', autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Formula or name' });
    var out = h('div', { style: { marginTop: '12px' } });
    function run(v) {
      input.value = v;
      out.innerHTML = '';
      var text = v.trim();
      if (!text) return;
      var asFormula = null, err = null;
      if (/[A-Z]/.test(text.charAt(0)) && !/ /.test(text)) {
        try { asFormula = Chem.nameCompound(text); } catch (e) { err = e; }
      }
      if (asFormula) {
        var steps = h('ol', { class: 'steps' });
        asFormula.steps.forEach(function (s) { steps.appendChild(h('li', { text: s })); });
        out.appendChild(h('div', null, [
          h('div', { class: 'big-formula', html: UI.formula(text) + ' <span class="muted" style="font-weight:400">→</span> ' }),
          h('div', { class: 'mol-name', text: asFormula.name || 'Not covered by our naming rules yet' }),
          h('h3', { text: 'Step by step', style: { marginTop: '12px' } }), steps,
          h('button', { class: 'btn', type: 'button', text: 'See composition', onclick: function () { UI.views.molecules.show(text); } })
        ]));
        return;
      }
      var res = nameToFormula(text);
      if (res) {
        out.appendChild(h('div', null, [
          h('div', { class: 'mol-name', text: text }),
          h('div', { class: 'big-formula', html: '→ ' + UI.formula(res.formula) }),
          h('p', { text: res.how, style: { marginTop: '8px' } }),
          h('button', { class: 'btn', type: 'button', text: 'See composition', onclick: function () { UI.views.molecules.show(res.formula); } })
        ]));
      } else {
        out.appendChild(h('p', { class: 'error', text: err ? err.message : 'Could not recognize that name. Check the spelling, e.g. "copper(II) sulfate" or "dinitrogen tetroxide".' }));
      }
    }
    var form = h('form', { class: 'formula-bar', onsubmit: function (e) { e.preventDefault(); run(input.value); } }, [input, h('button', { class: 'btn primary', type: 'submit', text: 'Convert' })]);
    var examples = h('div', { class: 'row small', style: { marginTop: '8px' } }, [h('span', { class: 'muted', text: 'Try:' })]);
    ['Fe2O3', 'N2O4', '(NH4)3PO4', 'CuSO4·5H2O', 'HNO3', 'calcium nitrate', 'sulfur trioxide', 'lead(II) iodide'].forEach(function (x) {
      examples.appendChild(h('button', { class: 'chip', type: 'button', html: /[a-z] /.test(x) || /^[a-z]/.test(x) ? UI.esc(x) : UI.formula(x), onclick: function () { run(x); } }));
    });
    box.appendChild(h('div', { class: 'card' }, [h('h3', { text: 'Formula ⇄ name converter' }), form, examples, out]));
    run('Fe2O3');
  }

  // ---------- Ion builder ----------

  function renderBuilder() {
    var box = document.getElementById('naming-build');
    var cSel = h('select', { class: 'input', 'aria-label': 'Cation' });
    var aSel = h('select', { class: 'input', 'aria-label': 'Anion' });
    C.cations.forEach(function (c, i) { cSel.appendChild(h('option', { value: i, text: c.name + ' — ' + c.formula + (c.charge > 1 ? c.charge : '') + '+' })); });
    C.anions.forEach(function (a, i) { aSel.appendChild(h('option', { value: i, text: a.name + ' — ' + a.formula + (a.charge > 1 ? a.charge : '') + '−' })); });
    cSel.value = 9; aSel.value = 10; // calcium + hydroxide
    var out = h('div');
    function update() {
      var cat = C.cations[+cSel.value], an = C.anions[+aSel.value];
      var f = Chem.ionicFormula(cat, an);
      out.innerHTML = '';
      var vis = h('div', { class: 'ion-visual' });
      for (var i = 0; i < f.cationCount; i++) vis.appendChild(h('span', { class: 'ion cat', html: ionHTML(cat, '+') }));
      for (var j = 0; j < f.anionCount; j++) vis.appendChild(h('span', { class: 'ion an', html: ionHTML(an, '−') }));
      var plus = f.cationCount * cat.charge, minus = f.anionCount * an.charge;
      out.appendChild(vis);
      out.appendChild(h('p', { class: 'charge-sum', html: f.cationCount + ' × (+' + cat.charge + ') = <b>+' + plus + '</b> &nbsp; and &nbsp; ' +
        f.anionCount + ' × (−' + an.charge + ') = <b>−' + minus + '</b> &nbsp;→ total charge <b style="color:var(--good)">0 ✓</b>' }));
      out.appendChild(h('div', { style: { textAlign: 'center' } }, [
        h('div', { class: 'big-formula', html: UI.formula(f.formula) }),
        h('div', { class: 'mol-name', text: Chem.ionicName(cat, an) })
      ]));
      var tips = [];
      if (f.cationCount > 1 || f.anionCount > 1) tips.push('Criss-cross shortcut: the charge of one ion becomes the subscript of the other (then reduce to the smallest ratio).');
      if ((an.poly && f.anionCount > 1) || (cat.poly && f.cationCount > 1)) tips.push('A polyatomic ion that appears more than once goes in parentheses — the subscript multiplies the whole group.');
      if (cat.variable) tips.push(cat.formula + ' can form more than one ion, so the Roman numeral (' + Chem.ROMAN[cat.charge] + ') shows its charge.');
      if (tips.length) {
        var ul = h('ul', { class: 'small' });
        tips.forEach(function (t) { ul.appendChild(h('li', { text: t })); });
        out.appendChild(ul);
      }
    }
    cSel.addEventListener('change', update);
    aSel.addEventListener('change', update);
    box.appendChild(h('div', { class: 'card' }, [
      h('h3', { text: 'Build an ionic compound' }),
      h('p', { class: 'small muted', text: 'Positive and negative charges must cancel out. Pick a cation (+) and an anion (−) to see how many of each are needed.' }),
      h('div', { class: 'ion-select' }, [h('label', null, ['Cation (+)', cSel]), h('label', null, ['Anion (−)', aSel])]),
      out
    ]));
    cSel.style.width = aSel.style.width = '100%';
    update();
  }

  // ---------- Quiz ----------

  var QUIZ_TYPES = [
    { key: 'ionic', label: 'Simple ionic' },
    { key: 'variable', label: 'Roman numerals' },
    { key: 'poly', label: 'Polyatomic ions' },
    { key: 'covalent', label: 'Molecular (prefixes)' },
    { key: 'common', label: 'Acids & common names' }
  ];
  var MONO = ['F', 'Cl', 'Br', 'I', 'O', 'S', 'N', 'P'];
  var quiz = { types: { ionic: true, variable: true, poly: true, covalent: true, common: true }, score: 0, total: 0, streak: 0, best: 0, current: null };

  function ionPairs(type) {
    var pairs = [];
    C.cations.forEach(function (c) {
      C.anions.forEach(function (a) {
        var mono = MONO.indexOf(a.formula) >= 0;
        if (a.name === 'peroxide' || a.name === 'hydride' || a.name === 'selenide') return;
        if (c.poly && mono && !/^(F|Cl|Br|I)$/.test(a.formula)) return;
        if (type === 'ionic' && (c.variable || c.poly || !mono)) return;
        if (type === 'variable' && !c.variable) return;
        if (type === 'poly' && !(a.poly || c.poly)) return;
        if (c.formula === 'Hg2' || /^Au/.test(c.formula)) return;
        pairs.push({ cation: c, anion: a });
      });
    });
    return pairs;
  }

  function covalentVariant(formula) {
    var p = Chem.parseFormula(formula);
    var a = p.order[0], b = p.order[1];
    var out = [];
    [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [0, 2]].forEach(function (d) {
      var i = p.counts[a] + d[0], j = p.counts[b] + d[1];
      if (i >= 1 && j >= 1 && i <= 10 && j <= 10 && (d[0] || d[1])) out.push(a + (i > 1 ? i : '') + b + (j > 1 ? j : ''));
    });
    return out;
  }

  function covalentName(f) {
    var p = Chem.parseFormula(f);
    var a = Chem.bySymbol[p.order[0]], b = Chem.bySymbol[p.order[1]];
    return Chem.prefixed(p.counts[a.symbol], a.name.toLowerCase(), true) + ' ' + Chem.prefixed(p.counts[b.symbol], Chem.IDE[b.symbol], false);
  }

  function makeQuestion() {
    var types = QUIZ_TYPES.filter(function (t) { return quiz.types[t.key]; }).map(function (t) { return t.key; });
    if (!types.length) return null;
    var type = UI.pick(types);
    var toName = Math.random() < 0.5;
    var formula, name, distract = [];

    if (type === 'covalent') {
      formula = UI.pick(C.covalentQuiz);
      name = covalentName(formula);
      covalentVariant(formula).forEach(function (f) { distract.push({ formula: f, name: covalentName(f) }); });
    } else if (type === 'common') {
      formula = UI.pick(C.commonQuiz);
      name = Chem.nameCompound(formula).name;
      C.commonQuiz.forEach(function (f) { if (f !== formula) distract.push({ formula: f, name: Chem.nameCompound(f).name }); });
      distract = UI.shuffle(distract);
      if (/acid/.test(name)) {
        // Classic mix-ups: -ic vs -ous, hydro- prefix.
        distract.unshift({ name: name.replace(/ic acid/, 'ous acid') }, { name: /^hydro/.test(name) ? name.replace(/^hydro/, '') : 'hydro' + name });
      }
    } else {
      var pairs = ionPairs(type);
      var pr = UI.pick(pairs);
      var f = Chem.ionicFormula(pr.cation, pr.anion);
      formula = f.formula; name = Chem.ionicName(pr.cation, pr.anion);
      // Same metal, different charge / same anion, different metal / no criss-cross.
      C.cations.forEach(function (c) {
        if (c !== pr.cation && (c.formula === pr.cation.formula || Math.abs(c.charge - pr.cation.charge) <= 1 && Math.random() < 0.3)) {
          distract.push({ formula: Chem.ionicFormula(c, pr.anion).formula, name: Chem.ionicName(c, pr.anion) });
        }
      });
      C.anions.forEach(function (a) {
        if (a !== pr.anion && a.name !== 'peroxide' && (a.formula.charAt(0) === pr.anion.formula.charAt(0) || a.charge === pr.anion.charge) && Math.random() < 0.5) {
          distract.push({ formula: Chem.ionicFormula(pr.cation, a).formula, name: Chem.ionicName(pr.cation, a) });
        }
      });
      if (f.cationCount > 1 || f.anionCount > 1) {
        distract.unshift({ formula: pr.cation.formula + pr.anion.formula, name: null });
      }
      if (pr.cation.variable) {
        var wrongRoman = pr.cation.name.replace(/\(([IV]+)\)/, function (m, r) { return '(' + (r === 'II' ? 'III' : 'II') + ')'; });
        distract.unshift({ name: wrongRoman + ' ' + pr.anion.name });
      }
      if (!pr.cation.variable && !pr.cation.poly && f.anionCount > 1 && !pr.anion.poly) {
        distract.unshift({ name: pr.cation.name + ' ' + Chem.PREFIXES[f.anionCount] + pr.anion.name });
      }
    }

    var answer = toName ? name : formula;
    var opts = [answer];
    distract.forEach(function (d) {
      var v = toName ? d.name : d.formula;
      if (v && opts.indexOf(v) < 0 && opts.length < 4) opts.push(v);
    });
    var guard = 0;
    while (opts.length < 4 && guard++ < 50) {
      var extra = UI.pick(C.covalentQuiz.concat(C.commonQuiz));
      var v2 = toName ? Chem.nameCompound(extra).name : extra;
      if (opts.indexOf(v2) < 0) opts.push(v2);
    }
    return { type: type, toName: toName, formula: formula, name: name, answer: answer, options: UI.shuffle(opts) };
  }

  function renderQuiz() {
    var box = document.getElementById('naming-quiz');
    quiz.best = UI.store.get('bestStreak', 0);
    var filters = h('div', { class: 'row small' }, [h('span', { class: 'muted', text: 'Include:' })]);
    QUIZ_TYPES.forEach(function (t) {
      var chip = h('button', { class: 'chip' + (quiz.types[t.key] ? ' active' : ''), type: 'button', text: t.label, onclick: function () {
        quiz.types[t.key] = !quiz.types[t.key];
        chip.classList.toggle('active', quiz.types[t.key]);
        next();
      } });
      filters.appendChild(chip);
    });
    var board = h('div', { class: 'scoreboard' });
    var stage = h('div');
    box.appendChild(h('div', { class: 'card stack' }, [h('h3', { text: 'Naming quiz' }), filters, board, stage]));

    function drawBoard() {
      board.innerHTML = '';
      board.appendChild(h('div', null, [h('span', { text: 'Score ' }), quiz.score + ' / ' + quiz.total]));
      board.appendChild(h('div', null, [h('span', { text: 'Streak ' }), String(quiz.streak)]));
      board.appendChild(h('div', null, [h('span', { text: 'Best streak ' }), String(quiz.best)]));
    }

    function next() {
      stage.innerHTML = '';
      var q = makeQuestion();
      quiz.current = q;
      drawBoard();
      if (!q) { stage.appendChild(h('p', { class: 'muted', text: 'Pick at least one question type.' })); return; }
      stage.appendChild(h('div', { class: 'muted small', text: q.toName ? 'What is the name of this compound?' : 'What is the formula of this compound?' }));
      stage.appendChild(h('div', { class: 'quiz-q', html: q.toName ? UI.formula(q.formula) : UI.esc(q.name) }));
      var opts = h('div', { class: 'quiz-opts' });
      var fb = h('div');
      q.options.forEach(function (o) {
        var b = h('button', { class: 'btn quiz-opt', type: 'button', html: q.toName ? UI.esc(o) : UI.formula(o), onclick: function () { answer(o, b); } });
        opts.appendChild(b);
      });
      stage.appendChild(opts);
      stage.appendChild(fb);

      function answer(o, btn) {
        if (q.done) return;
        q.done = true;
        var ok = o === q.answer;
        quiz.total++;
        if (ok) { quiz.score++; quiz.streak++; } else { quiz.streak = 0; }
        if (quiz.streak > quiz.best) { quiz.best = quiz.streak; UI.store.set('bestStreak', quiz.best); }
        opts.querySelectorAll('button').forEach(function (b, i) {
          b.disabled = true;
          if (q.options[i] === q.answer) b.classList.add('correct');
        });
        if (!ok) btn.classList.add('wrong');
        drawBoard();
        var steps = h('ol', { class: 'steps small' });
        Chem.nameCompound(q.formula).steps.forEach(function (s) { steps.appendChild(h('li', { text: s })); });
        fb.className = 'feedback ' + (ok ? 'good' : 'bad');
        fb.appendChild(h('b', { html: (ok ? '✓ Correct! ' : '✗ Not quite. ') + UI.formula(q.formula) + ' = ' + UI.esc(q.name) }));
        fb.appendChild(steps);
        var nb = h('button', { class: 'btn primary', type: 'button', text: 'Next question →', onclick: next });
        fb.appendChild(nb);
        nb.focus();
      }
    }
    next();
  }

  // ---------- Rules ----------

  function renderRules() {
    var box = document.getElementById('naming-rules');
    var prefixRows = Chem.PREFIXES.slice(1).map(function (p, i) { return (i + 1) + ' = ' + p; }).join(' · ');
    var polys = h('div', { class: 'ion-table' });
    C.anions.filter(function (a) { return a.poly; }).concat(C.cations.filter(function (c) { return c.poly; })).forEach(function (ion) {
      var sign = C.cations.indexOf(ion) >= 0 ? '+' : '−';
      polys.appendChild(h('div', { html: '<b>' + ionHTML(ion, sign) + '</b> — ' + UI.esc(ion.name) + (ion.alt && !/⁻/.test(ion.alt) ? ' <span class="muted">(' + ion.alt + ')</span>' : '') }));
    });
    var variable = {};
    C.cations.filter(function (c) { return c.variable; }).forEach(function (c) {
      var el = c.formula === 'Hg2' ? 'Hg' : c.formula;
      (variable[el] = variable[el] || []).push(ionHTML(c, '+') + ' ' + UI.esc(c.name));
    });
    var varList = h('div', { class: 'ion-table' });
    Object.keys(variable).forEach(function (k) { varList.appendChild(h('div', { html: variable[k].join(', ') })); });

    box.appendChild(h('div', { class: 'grid-2' }, [
      h('div', { class: 'card' }, [
        h('h3', { text: '1. Ionic compounds (metal + nonmetal)' }),
        h('ol', { class: 'steps small' }, [
          h('li', { text: 'Name the metal (cation) first, unchanged: Na → sodium.' }),
          h('li', { text: 'Name the nonmetal (anion) with the ending -ide: Cl → chloride, O → oxide.' }),
          h('li', { text: 'Polyatomic ions keep their own name: SO₄²⁻ → sulfate.' }),
          h('li', { text: 'Never use prefixes (mono-, di-) for ionic compounds: CaCl₂ is calcium chloride.' }),
          h('li', { text: 'Transition metals that can have several charges get a Roman numeral: FeCl₃ → iron(III) chloride.' })
        ]),
        h('h3', { text: 'Typical charges by group', style: { marginTop: '12px' } }),
        h('p', { class: 'small', html: 'Group 1: <b>+1</b> · Group 2: <b>+2</b> · Group 13: <b>+3</b> · Group 15: <b>−3</b> · Group 16: <b>−2</b> · Group 17: <b>−1</b> · Group 18: no ions' })
      ]),
      h('div', { class: 'card' }, [
        h('h3', { text: '2. Molecular compounds (two nonmetals)' }),
        h('ol', { class: 'steps small' }, [
          h('li', { text: 'Use Greek prefixes for the number of each atom.' }),
          h('li', { text: 'Skip "mono" on the first element: CO is carbon monoxide, not monocarbon monoxide.' }),
          h('li', { text: 'The second element ends in -ide.' }),
          h('li', { text: 'Drop the a/o of the prefix before "oxide": pentoxide, monoxide.' })
        ]),
        h('p', { class: 'small', text: prefixRows }),
        h('h3', { text: '3. Acids (H + anion in water)', style: { marginTop: '12px' } }),
        h('ul', { class: 'small' }, [
          h('li', { html: 'No oxygen: <b>hydro- … -ic acid</b> (HCl → hydrochloric acid)' }),
          h('li', { html: '-ate ion → <b>-ic acid</b> (HNO₃ → nitric acid)' }),
          h('li', { html: '-ite ion → <b>-ous acid</b> (HNO₂ → nitrous acid)' })
        ])
      ]),
      h('div', { class: 'card' }, [h('h3', { text: 'Polyatomic ions to know' }), polys]),
      h('div', { class: 'card' }, [h('h3', { text: 'Metals with more than one charge' }), varList])
    ]));
  }

  function init() {
    renderNameTool();
    renderBuilder();
    renderQuiz();
    renderRules();
    var tabs = document.getElementById('naming-tabs');
    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('[data-sub]');
      if (!b) return;
      tabs.querySelectorAll('[data-sub]').forEach(function (x) { x.classList.toggle('active', x === b); });
      document.querySelectorAll('.naming-sub').forEach(function (s) { s.hidden = s.id !== 'naming-' + b.dataset.sub; });
    });
  }

  UI.views.naming = { init: init, nameToFormula: nameToFormula };
})(this);
