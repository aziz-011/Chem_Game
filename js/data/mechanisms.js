// Animated organic reaction mechanisms (SN2, SN1, E2, E1).
// Each mechanism lists its atoms and a sequence of frames. A frame gives
// every atom's 3D position (ångströms), the bonds drawn, curved arrows
// (electron flow about to happen), charges, label changes, and where the
// frame sits on the energy diagram (t from 0 to 1).
// Bond order 0.5 = partial bond (dashed), 1.5 = single + dashed.
(function (root) {
  // Substituent directions around the central carbon (in the y/z plane).
  function ring(x, r) {
    return [90, 210, 330].map(function (deg) {
      var a = deg * Math.PI / 180;
      return [x, r * Math.cos(a), r * Math.sin(a)];
    });
  }
  function subst(frame, x) {
    var p = ring(x, 1.0);
    frame.R1 = p[0]; frame.R2 = p[1]; frame.R3 = p[2];
    return frame;
  }

  var SUBSTITUTION_ATOMS = [
    { id: 'C', el: 'C', label: 'C' },
    { id: 'R1', el: 'R', label: 'R1' },
    { id: 'R2', el: 'R', label: 'R2' },
    { id: 'R3', el: 'R', label: 'R3' },
    { id: 'LG', el: 'Br', label: 'Br' },
    { id: 'Nu', el: 'O', label: 'OH' }
  ];
  var CR = [['C', 'R1', 1], ['C', 'R2', 1], ['C', 'R3', 1]];

  var SN2 = {
    key: 'sn2',
    atoms: SUBSTITUTION_ATOMS,
    nucleophile: { label: 'OH', name: 'hydroxide' },
    profile: [[0, 0.62], [0.5, 0.12], [1, 0.78]],
    marks: [{ t: 0, k: 'reactants' }, { t: 0.5, k: 'ts' }, { t: 1, k: 'products' }],
    frames: [
      { pos: subst({ C: [0, 0, 0], LG: [1.95, 0, 0], Nu: [-4.4, 0, 0] }, -0.35),
        bonds: CR.concat([['C', 'LG', 1]]), charges: { Nu: '−' }, t: 0, step: 'sn2.0' },
      { pos: subst({ C: [0, 0, 0], LG: [1.95, 0, 0], Nu: [-3.0, 0, 0] }, -0.35),
        bonds: CR.concat([['C', 'LG', 1]]), charges: { Nu: '−' }, t: 0.25, step: 'sn2.1',
        arrows: [{ from: 'Nu', to: 'C' }, { from: ['C', 'LG'], to: 'LG' }] },
      { pos: subst({ C: [0, 0, 0], LG: [2.35, 0, 0], Nu: [-2.15, 0, 0] }, 0),
        bonds: CR.concat([['C', 'LG', 0.5], ['C', 'Nu', 0.5]]), charges: { Nu: 'δ−', LG: 'δ−' }, t: 0.5, step: 'sn2.2', ts: true },
      { pos: subst({ C: [0, 0, 0], LG: [4.4, 0, 0], Nu: [-1.43, 0, 0] }, 0.35),
        bonds: CR.concat([['C', 'Nu', 1]]), charges: { LG: '−' }, t: 1, step: 'sn2.3' }
    ]
  };

  var SN1 = {
    key: 'sn1',
    atoms: SUBSTITUTION_ATOMS,
    nucleophile: { label: 'H₂O', name: 'water' },
    profile: [[0, 0.62], [0.27, 0.1], [0.45, 0.42], [0.62, 0.26], [1, 0.8]],
    marks: [{ t: 0, k: 'reactants' }, { t: 0.27, k: 'ts1' }, { t: 0.45, k: 'intermediate' }, { t: 0.62, k: 'ts2' }, { t: 1, k: 'products' }],
    frames: [
      { pos: subst({ C: [0, 0, 0], LG: [1.95, 0, 0], Nu: [-4.4, 1.6, 0] }, -0.35),
        bonds: CR.concat([['C', 'LG', 1]]), labels: { Nu: 'H₂O' }, t: 0, step: 'sn1.0' },
      { pos: subst({ C: [0, 0, 0], LG: [2.1, 0, 0], Nu: [-4.4, 1.6, 0] }, -0.3),
        bonds: CR.concat([['C', 'LG', 1]]), labels: { Nu: 'H₂O' }, t: 0.15, step: 'sn1.1',
        arrows: [{ from: ['C', 'LG'], to: 'LG' }] },
      { pos: subst({ C: [0, 0, 0], LG: [4.3, -0.6, 0], Nu: [-4.0, 1.4, 0] }, 0),
        bonds: CR, charges: { C: '+', LG: '−' }, labels: { Nu: 'H₂O' }, t: 0.45, step: 'sn1.2' },
      { pos: subst({ C: [0, 0, 0], LG: [4.3, -0.6, 0], Nu: [-2.7, 0, 0] }, 0),
        bonds: CR, charges: { C: '+', LG: '−' }, labels: { Nu: 'H₂O' }, t: 0.55, step: 'sn1.3',
        arrows: [{ from: 'Nu', to: 'C' }] },
      { pos: subst({ C: [0, 0, 0], LG: [4.3, -0.6, 0], Nu: [-1.47, 0, 0] }, 0.35),
        bonds: CR.concat([['C', 'Nu', 1]]), charges: { Nu: '+', LG: '−' }, labels: { Nu: 'OH₂' }, t: 0.8, step: 'sn1.4' },
      { pos: subst({ C: [0, 0, 0], LG: [4.3, -0.6, 0], Nu: [-1.43, 0, 0] }, 0.35),
        bonds: CR.concat([['C', 'Nu', 1]]), charges: { LG: '−' }, labels: { Nu: 'OH' }, t: 1, step: 'sn1.5' }
    ]
  };

  // Elimination: Cα carries the leaving group, Cβ carries the H that the base removes.
  var ELIM_ATOMS = [
    { id: 'Ca', el: 'C', label: 'Cα' },
    { id: 'Cb', el: 'C', label: 'Cβ' },
    { id: 'LG', el: 'Br', label: 'Br' },
    { id: 'H', el: 'H', label: 'H' },
    { id: 'Ra1', el: 'R', label: 'CH₃' },
    { id: 'Ra2', el: 'R', label: 'CH₃' },
    { id: 'Hb1', el: 'H', label: 'H' },
    { id: 'Hb2', el: 'H', label: 'H' },
    { id: 'B', el: 'O', label: 'OH' }
  ];
  var START = {
    Ca: [0.77, 0, 0], Cb: [-0.77, 0, 0], LG: [1.25, -1.85, 0], H: [-1.2, 1.0, 0],
    Ra1: [1.3, 0.55, 0.95], Ra2: [1.3, 0.55, -0.95], Hb1: [-1.2, -0.4, 0.88], Hb2: [-1.2, -0.4, -0.88]
  };
  var ALKENE = {
    Ca: [0.67, 0, 0], Cb: [-0.67, 0, 0], Ra1: [1.35, 0, 1.08], Ra2: [1.35, 0, -1.08],
    Hb1: [-1.25, 0, 0.92], Hb2: [-1.25, 0, -0.92]
  };
  function at(base, extra) {
    var o = {};
    Object.keys(base).forEach(function (k) { o[k] = base[k]; });
    Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }
  var SKELETON = [['Ca', 'Ra1', 1], ['Ca', 'Ra2', 1], ['Cb', 'Hb1', 1], ['Cb', 'Hb2', 1]];

  var E2 = {
    key: 'e2',
    atoms: ELIM_ATOMS,
    nucleophile: { label: 'OH', name: 'hydroxide' },
    profile: [[0, 0.62], [0.5, 0.12], [1, 0.74]],
    marks: [{ t: 0, k: 'reactants' }, { t: 0.5, k: 'ts' }, { t: 1, k: 'products' }],
    frames: [
      { pos: at(START, { B: [-2.75, 2.95, 0] }), bonds: SKELETON.concat([['Ca', 'Cb', 1], ['Ca', 'LG', 1], ['Cb', 'H', 1]]),
        charges: { B: '−' }, t: 0, step: 'e2.0' },
      { pos: at(START, { B: [-2.45, 2.25, 0] }), bonds: SKELETON.concat([['Ca', 'Cb', 1], ['Ca', 'LG', 1], ['Cb', 'H', 1]]),
        charges: { B: '−' }, t: 0.25, step: 'e2.1',
        arrows: [{ from: 'B', to: 'H' }, { from: ['Cb', 'H'], to: ['Ca', 'Cb'] }, { from: ['Ca', 'LG'], to: 'LG' }] },
      { pos: at(START, { Ca: [0.72, 0, 0], Cb: [-0.72, 0, 0], LG: [1.4, -2.3, 0], H: [-1.55, 1.5, 0], B: [-2.25, 2.25, 0] }),
        bonds: SKELETON.concat([['Ca', 'Cb', 1.5], ['Ca', 'LG', 0.5], ['Cb', 'H', 0.5], ['B', 'H', 0.5]]),
        charges: { B: 'δ−', LG: 'δ−' }, t: 0.5, step: 'e2.2', ts: true },
      { pos: at(ALKENE, { LG: [1.9, -3.0, 0], H: [-1.9, 2.15, 0], B: [-2.6, 2.75, 0] }),
        bonds: SKELETON.concat([['Ca', 'Cb', 2], ['B', 'H', 1]]), charges: { LG: '−' }, labels: { B: 'OH', H: 'H' }, t: 1, step: 'e2.3' }
    ]
  };

  var E1 = {
    key: 'e1',
    atoms: ELIM_ATOMS,
    nucleophile: { label: 'H₂O', name: 'water' },
    profile: [[0, 0.62], [0.27, 0.1], [0.45, 0.42], [0.62, 0.28], [1, 0.72]],
    marks: [{ t: 0, k: 'reactants' }, { t: 0.27, k: 'ts1' }, { t: 0.45, k: 'intermediate' }, { t: 0.62, k: 'ts2' }, { t: 1, k: 'products' }],
    frames: [
      { pos: at(START, { B: [-2.75, 2.95, 0] }), bonds: SKELETON.concat([['Ca', 'Cb', 1], ['Ca', 'LG', 1], ['Cb', 'H', 1]]),
        labels: { B: 'H₂O' }, t: 0, step: 'e1.0' },
      { pos: at(START, { B: [-2.75, 2.95, 0] }), bonds: SKELETON.concat([['Ca', 'Cb', 1], ['Ca', 'LG', 1], ['Cb', 'H', 1]]),
        labels: { B: 'H₂O' }, t: 0.15, step: 'e1.1', arrows: [{ from: ['Ca', 'LG'], to: 'LG' }] },
      { pos: at(START, { Ra1: [1.35, 0, 1.08], Ra2: [1.35, 0, -1.08], LG: [1.9, -3.0, 0], B: [-2.75, 2.95, 0] }),
        bonds: SKELETON.concat([['Ca', 'Cb', 1], ['Cb', 'H', 1]]), charges: { Ca: '+', LG: '−' }, labels: { B: 'H₂O' }, t: 0.45, step: 'e1.2' },
      { pos: at(START, { Ra1: [1.35, 0, 1.08], Ra2: [1.35, 0, -1.08], LG: [1.9, -3.0, 0], B: [-2.45, 2.25, 0] }),
        bonds: SKELETON.concat([['Ca', 'Cb', 1], ['Cb', 'H', 1]]), charges: { Ca: '+', LG: '−' }, labels: { B: 'H₂O' }, t: 0.55, step: 'e1.3',
        arrows: [{ from: 'B', to: 'H' }, { from: ['Cb', 'H'], to: ['Ca', 'Cb'] }] },
      { pos: at(ALKENE, { LG: [1.9, -3.0, 0], H: [-1.9, 2.15, 0], B: [-2.6, 2.75, 0] }),
        bonds: SKELETON.concat([['Ca', 'Cb', 2], ['B', 'H', 1]]), charges: { LG: '−', B: '+' }, labels: { B: 'H₂O' }, t: 1, step: 'e1.4' }
    ]
  };

  // Substrates for the substitution animations: labels of the three groups on carbon.
  var SUBSTRATES = [
    { key: 'methyl', formula: 'CH₃Br', groups: ['H', 'H', 'H'] },
    { key: 'primary', formula: 'CH₃CH₂Br', groups: ['CH₃', 'H', 'H'] },
    { key: 'secondary', formula: '(CH₃)₂CHBr', groups: ['CH₃', 'CH₃', 'H'] },
    { key: 'tertiary', formula: '(CH₃)₃CBr', groups: ['CH₃', 'CH₃', 'CH₃'] }
  ];

  var data = { list: [SN2, SN1, E2, E1], substrates: SUBSTRATES };
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.MECHANISMS = data;
})(this);
