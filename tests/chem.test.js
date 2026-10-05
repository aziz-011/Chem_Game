const test = require('node:test');
const assert = require('node:assert/strict');
const Chem = require('../js/chem.js');
const { reactions, reagents } = require('../js/data/reactions.js');
const COMPOUNDS = require('../js/data/compounds.js');
const MOLECULES = require('../js/data/molecules.js');

test('parses simple and nested formulas', () => {
  assert.deepEqual(Chem.parseFormula('H2O').counts, { H: 2, O: 1 });
  assert.deepEqual(Chem.parseFormula('Ca(OH)2').counts, { Ca: 1, O: 2, H: 2 });
  assert.deepEqual(Chem.parseFormula('Al2(SO4)3').counts, { Al: 2, S: 3, O: 12 });
  assert.deepEqual(Chem.parseFormula('K4[Fe(CN)6]').counts, { K: 4, Fe: 1, C: 6, N: 6 });
  assert.deepEqual(Chem.parseFormula('CuSO4·5H2O').counts, { Cu: 1, S: 1, O: 9, H: 10 });
  assert.deepEqual(Chem.parseFormula('H₂O').counts, { H: 2, O: 1 });
  assert.deepEqual(Chem.parseFormula('CO').order, ['C', 'O']);
  assert.deepEqual(Chem.parseFormula('Co').order, ['Co']);
});

test('rejects bad formulas with helpful messages', () => {
  assert.throws(() => Chem.parseFormula('h2o'), /capital/);
  assert.throws(() => Chem.parseFormula('Xx'), /not an element/);
  assert.throws(() => Chem.parseFormula('Ca(OH'), /Missing/);
  assert.throws(() => Chem.parseFormula('Ca)'), /Unmatched/);
  assert.throws(() => Chem.parseFormula(''), /Type a formula/);
});

test('molar mass and percent composition', () => {
  const water = Chem.composition('H2O');
  assert.ok(Math.abs(water.molarMass - 18.015) < 0.01);
  const total = water.rows.reduce((s, r) => s + r.percent, 0);
  assert.ok(Math.abs(total - 100) < 1e-9);
  assert.ok(Math.abs(Chem.composition('C6H12O6').molarMass - 180.156) < 0.01);
});

test('balances equations', () => {
  assert.equal(Chem.equationToString(Chem.balanceText('H2 + O2 -> H2O')), '2 H2 + O2 → 2 H2O');
  assert.equal(Chem.equationToString(Chem.balanceText('C8H18 + O2 -> CO2 + H2O')), '2 C8H18 + 25 O2 → 16 CO2 + 18 H2O');
  assert.equal(Chem.equationToString(Chem.balanceText('KMnO4 + HCl = KCl + MnCl2 + H2O + Cl2')),
    '2 KMnO4 + 16 HCl → 2 KCl + 2 MnCl2 + 8 H2O + 5 Cl2');
  assert.throws(() => Chem.balanceText('H2 + O2 -> H2O + CO2'), /only one side/);
  assert.throws(() => Chem.balanceText('H2O'), /->/);
});

test('every lab reaction balances and uses shelf reagents', () => {
  for (const r of reactions) {
    const b = Chem.balance(r.reactants, r.products);
    const t = Chem.atomTally(b);
    assert.deepEqual(t.left, t.right, r.reactants.join('+'));
    for (const f of r.reactants) assert.ok(reagents[f], 'missing shelf name for ' + f);
  }
});

test('names ionic compounds', () => {
  const cases = {
    NaCl: 'sodium chloride', Fe2O3: 'iron(III) oxide', FeO: 'iron(II) oxide', 'Ca(OH)2': 'calcium hydroxide',
    '(NH4)2SO4': 'ammonium sulfate', Hg2Cl2: 'mercury(I) chloride', KMnO4: 'potassium permanganate',
    CH3COONa: 'sodium acetate', 'Al2(SO4)3': 'aluminum sulfate', Cu2O: 'copper(I) oxide', PbO2: 'lead(IV) oxide'
  };
  for (const [f, name] of Object.entries(cases)) assert.equal(Chem.nameCompound(f).name, name, f);
});

test('names covalent, acids, hydrates and elements', () => {
  const cases = {
    CO: 'carbon monoxide', CO2: 'carbon dioxide', N2O5: 'dinitrogen pentoxide', N2O4: 'dinitrogen tetroxide',
    SF6: 'sulfur hexafluoride', P4O10: 'tetraphosphorus decoxide', H2O: 'water', HCl: 'hydrochloric acid',
    H2SO4: 'sulfuric acid', 'CuSO4·5H2O': 'copper(II) sulfate pentahydrate', O2: 'oxygen', C8H18: 'octane'
  };
  for (const [f, name] of Object.entries(cases)) assert.equal(Chem.nameCompound(f).name, name, f);
  assert.equal(Chem.nameCompound('C9H8O4').name, null);
});

test('ionic formula uses criss-cross with parentheses for polyatomic ions', () => {
  const find = (list, f, c) => list.find((i) => i.formula === f && (c === undefined || i.charge === c));
  const { cations, anions } = COMPOUNDS;
  assert.equal(Chem.ionicFormula(find(cations, 'Al'), find(anions, 'O')).formula, 'Al2O3');
  assert.equal(Chem.ionicFormula(find(cations, 'Ca'), find(anions, 'PO4')).formula, 'Ca3(PO4)2');
  assert.equal(Chem.ionicFormula(find(cations, 'NH4'), find(anions, 'SO4')).formula, '(NH4)2SO4');
  assert.equal(Chem.ionicFormula(find(cations, 'Mg'), find(anions, 'O')).formula, 'MgO');
});

test('every ion pair names back to itself', () => {
  for (const c of COMPOUNDS.cations) {
    for (const a of COMPOUNDS.anions) {
      if (c.variable && a.name === 'peroxide') continue; // PbO2 reads as lead(IV) oxide
      const f = Chem.ionicFormula(c, a).formula;
      assert.equal(Chem.nameCompound(f).name, Chem.ionicName(c, a), f);
    }
  }
});

test('quiz compounds and 3D models are valid', () => {
  for (const f of COMPOUNDS.covalentQuiz.concat(COMPOUNDS.commonQuiz)) assert.ok(Chem.nameCompound(f).name, f);
  for (const m of MOLECULES) {
    const counts = {};
    for (const a of m.atoms) counts[a[0]] = (counts[a[0]] || 0) + 1;
    if (m.kind !== 'ionic') assert.equal(Chem.hillKey(counts), Chem.hillKey(Chem.parseFormula(m.formula).counts), m.formula);
  }
});

test('mechanism frames are complete and consistent', () => {
  const { list } = require('../js/data/mechanisms.js');
  for (const m of list) {
    const ids = m.atoms.map((a) => a.id);
    m.frames.forEach((f, i) => {
      assert.deepEqual(Object.keys(f.pos).sort(), ids.slice().sort(), `${m.key} frame ${i} positions`);
      for (const b of f.bonds) assert.ok(ids.includes(b[0]) && ids.includes(b[1]), `${m.key} frame ${i} bond ${b}`);
      for (const a of f.arrows || []) for (const r of [].concat(a.from, a.to)) assert.ok(ids.includes(r), `${m.key} arrow ${r}`);
      if (i) assert.ok(f.t >= m.frames[i - 1].t, `${m.key} energy goes forward`);
    });
  }
});
