// Mechanisms view: animated SN2 / SN1 / E2 / E1 with curved arrows, an
// energy diagram, a comparison table and a "which mechanism?" predictor.
(function (root) {
  'use strict';
  var UI = root.UI, h = UI.h, svg = UI.svg;
  var I18N = root.I18N, M = root.MECHANISMS;
  var t = function (k, v) { return I18N.t(k, v); };

  I18N.add({
    en: {
      'mech.sn2': 'SN2', 'mech.sn1': 'SN1', 'mech.e2': 'E2', 'mech.e1': 'E1',
      'mech.sn2.full': 'Bimolecular nucleophilic substitution', 'mech.sn1.full': 'Unimolecular nucleophilic substitution',
      'mech.e2.full': 'Bimolecular elimination', 'mech.e1.full': 'Unimolecular elimination',
      'mech.substrate': 'Substrate', 'mech.play': 'Play', 'mech.pause': 'Pause', 'mech.prev': '← Back', 'mech.next': 'Next →',
      'mech.reset': 'Restart', 'mech.step': 'Step {n} of {total}', 'mech.drag': 'Drag the model to rotate it. Red arrows show where electron pairs move next.',
      'mech.sub.methyl': 'methyl', 'mech.sub.primary': 'primary (1°)', 'mech.sub.secondary': 'secondary (2°)', 'mech.sub.tertiary': 'tertiary (3°)',
      'mech.warn.sn2': 'In real life a tertiary carbon is too crowded for a backside attack, so SN2 does not happen here. Try SN1.',
      'mech.warn.sn1': 'Methyl and primary carbocations are too unstable, so these substrates do not react by SN1. Try SN2.',
      'mech.energy': 'Energy', 'mech.progress': 'Reaction progress',
      'mech.mark.reactants': 'Reactants', 'mech.mark.products': 'Products', 'mech.mark.ts': 'TS ‡', 'mech.mark.ts1': 'TS1 ‡',
      'mech.mark.ts2': 'TS2 ‡', 'mech.mark.intermediate': 'Carbocation',

      'sn2.0': 'Start: the hydroxide ion (OH⁻) is the nucleophile. It has a lone pair and a negative charge, and it is attracted to the slightly positive carbon bonded to bromine.',
      'sn2.1': 'OH⁻ attacks the carbon from the back, exactly opposite the bromine (180°). At the same moment, the C–Br bond starts to break.',
      'sn2.2': 'Transition state: carbon is half-bonded to both O and Br. The three other groups are flat, like an umbrella turning inside out. Everything happens in one step.',
      'sn2.3': 'Product: an alcohol and Br⁻. The three groups flipped to the other side: this is called inversion of configuration (Walden inversion).',
      'sn1.0': 'Start: a substrate in a polar protic solvent such as water. Water is a weak nucleophile, so it waits.',
      'sn1.1': 'Step 1 (slow): the C–Br bond breaks by itself. Both electrons leave with bromine. This is the rate-determining step.',
      'sn1.2': 'Carbocation intermediate: carbon is positive and flat (sp², 120°). Its empty p orbital can be attacked from the top or the bottom.',
      'sn1.3': 'Step 2 (fast): water uses a lone pair to bond to the carbocation. It can come from either side, so both mirror-image products form.',
      'sn1.4': 'An oxonium ion forms: oxygen now has three bonds and a + charge.',
      'sn1.5': 'Step 3: another water molecule removes an H⁺, giving a neutral alcohol. If the carbon was chiral, you get a mixture of both forms (racemization).',
      'e2.0': 'Start: a strong base (OH⁻). The H on the β-carbon and the Br on the α-carbon point in opposite directions (anti-periplanar).',
      'e2.1': 'All in one step: the base pulls off the β-H, the C–H electrons move in to make a C=C double bond, and Br⁻ leaves.',
      'e2.2': 'Transition state: the C–H and C–Br bonds are half broken while the double bond is half formed.',
      'e2.3': 'Product: an alkene, water and Br⁻. The atoms around the C=C are now flat.',
      'e1.0': 'Start: a substrate with a weak base (water), usually with heat.',
      'e1.1': 'Step 1 (slow): the C–Br bond breaks and Br⁻ leaves, just like in SN1.',
      'e1.2': 'Carbocation intermediate: the α-carbon is positive and flat.',
      'e1.3': 'Step 2 (fast): water removes an H from the neighboring β-carbon, and those electrons form the C=C double bond.',
      'e1.4': 'Product: an alkene plus H₃O⁺ and Br⁻. When several alkenes are possible, the more substituted one is usually the major product (Zaitsev rule).',

      'mech.facts': 'Key facts', 'mech.fact.rate': 'Rate law', 'mech.fact.steps': 'Steps', 'mech.fact.substrate': 'Best substrate',
      'mech.fact.reagent': 'Reagent', 'mech.fact.solvent': 'Solvent', 'mech.fact.stereo': 'Stereochemistry',
      'sn2.rate': 'rate = k [substrate][Nu⁻]', 'sn2.steps': '1 (concerted)', 'sn2.substrate': 'methyl > 1° > 2° (3° does not react)',
      'sn2.reagent': 'strong nucleophile (OH⁻, CH₃O⁻, I⁻, HS⁻)', 'sn2.solvent': 'polar aprotic (acetone, DMSO)', 'sn2.stereo': 'inversion',
      'sn1.rate': 'rate = k [substrate]', 'sn1.steps': '2 or 3 (carbocation intermediate)', 'sn1.substrate': '3° > 2° (methyl and 1° do not react)',
      'sn1.reagent': 'weak nucleophile (H₂O, CH₃OH)', 'sn1.solvent': 'polar protic (water, alcohols)', 'sn1.stereo': 'racemization (both forms)',
      'e2.rate': 'rate = k [substrate][base]', 'e2.steps': '1 (concerted)', 'e2.substrate': '3° > 2° > 1°',
      'e2.reagent': 'strong base (OH⁻, CH₃O⁻, bulky t-BuO⁻)', 'e2.solvent': 'many solvents', 'e2.stereo': 'H and leaving group must be anti-periplanar',
      'e1.rate': 'rate = k [substrate]', 'e1.steps': '2 (carbocation intermediate)', 'e1.substrate': '3° > 2°',
      'e1.reagent': 'weak base (H₂O, CH₃OH) + heat', 'e1.solvent': 'polar protic', 'e1.stereo': 'more substituted alkene (Zaitsev)',

      'pred.title': 'Which mechanism?', 'pred.intro': 'Choose the substrate and the reagent. The app predicts the main mechanism using the usual textbook rules.',
      'pred.substrate': 'Substrate (carbon bonded to the leaving group)', 'pred.reagent': 'Reagent', 'pred.heat': 'Heat',
      'pred.r.goodNu': 'Good nucleophile, weak base (I⁻, Br⁻, HS⁻)', 'pred.r.strongBase': 'Strong nucleophile and strong base (OH⁻, CH₃O⁻)',
      'pred.r.bulky': 'Strong bulky base (t-BuO⁻)', 'pred.r.weak': 'Weak nucleophile and weak base (H₂O, CH₃OH)',
      'pred.show': 'Show this mechanism', 'pred.none': 'No reaction (very slow)',
      'why.methylWeak': 'Methyl substrates cannot form a carbocation, and water/alcohol are too weak to do SN2.',
      'why.methyl': 'A methyl carbon is unhindered and has no β-hydrogen, so only SN2 is possible.',
      'why.1bulky': 'A bulky base cannot reach the carbon, so it removes a β-H instead: E2.',
      'why.1': 'Primary carbons are easy to reach from the back: SN2 is the main path.',
      'why.1weak': 'Primary carbocations are too unstable for SN1/E1, and the reagent is too weak for SN2.',
      'why.2goodNu': 'A good nucleophile that is a weak base substitutes: SN2.',
      'why.2base': 'A strong base on a secondary carbon mostly eliminates: E2 (SN2 is a minor product).',
      'why.2weak': 'A weak nucleophile on a secondary carbon reacts slowly through a carbocation: SN1, with E1 when heated.',
      'why.3goodNu': 'Tertiary carbons are too crowded for SN2, but form stable carbocations: SN1.',
      'why.3base': 'A strong base and a tertiary substrate give elimination: E2.',
      'why.3weak': 'A weak nucleophile and a stable tertiary carbocation: SN1, with E1 when heated.',
      'why.heat': 'Heat favors elimination over substitution.',

      'cmp.title': 'SN1, SN2, E1, E2 side by side'
    },
    fr: {
      'mech.sn2.full': 'Substitution nucléophile bimoléculaire', 'mech.sn1.full': 'Substitution nucléophile monomoléculaire',
      'mech.e2.full': 'Élimination bimoléculaire', 'mech.e1.full': 'Élimination monomoléculaire',
      'mech.substrate': 'Substrat', 'mech.play': 'Lecture', 'mech.pause': 'Pause', 'mech.prev': '← Retour', 'mech.next': 'Suivant →',
      'mech.reset': 'Recommencer', 'mech.step': 'Étape {n} sur {total}', 'mech.drag': 'Fais glisser le modèle pour le tourner. Les flèches rouges montrent où vont les doublets d’électrons.',
      'mech.sub.methyl': 'méthyle', 'mech.sub.primary': 'primaire (1°)', 'mech.sub.secondary': 'secondaire (2°)', 'mech.sub.tertiary': 'tertiaire (3°)',
      'mech.warn.sn2': 'En réalité, un carbone tertiaire est trop encombré pour une attaque par l’arrière : la SN2 n’a pas lieu ici. Essaie la SN1.',
      'mech.warn.sn1': 'Les carbocations méthyle et primaires sont trop instables : ces substrats ne réagissent pas par SN1. Essaie la SN2.',
      'mech.energy': 'Énergie', 'mech.progress': 'Avancement de la réaction',
      'mech.mark.reactants': 'Réactifs', 'mech.mark.products': 'Produits', 'mech.mark.ts': 'ET ‡', 'mech.mark.ts1': 'ET1 ‡',
      'mech.mark.ts2': 'ET2 ‡', 'mech.mark.intermediate': 'Carbocation',

      'sn2.0': 'Départ : l’ion hydroxyde (OH⁻) est le nucléophile. Il a un doublet libre et une charge négative, et il est attiré par le carbone légèrement positif lié au brome.',
      'sn2.1': 'OH⁻ attaque le carbone par l’arrière, exactement à l’opposé du brome (180°). Au même moment, la liaison C–Br commence à se rompre.',
      'sn2.2': 'État de transition : le carbone est à moitié lié à O et à Br. Les trois autres groupes sont à plat, comme un parapluie qui se retourne. Tout se passe en une seule étape.',
      'sn2.3': 'Produit : un alcool et Br⁻. Les trois groupes sont passés de l’autre côté : c’est l’inversion de configuration (inversion de Walden).',
      'sn1.0': 'Départ : un substrat dans un solvant polaire protique comme l’eau. L’eau est un nucléophile faible, elle attend.',
      'sn1.1': 'Étape 1 (lente) : la liaison C–Br se rompt toute seule. Les deux électrons partent avec le brome. C’est l’étape cinétiquement déterminante.',
      'sn1.2': 'Intermédiaire carbocation : le carbone est positif et plan (sp², 120°). Son orbitale p vide peut être attaquée par le haut ou par le bas.',
      'sn1.3': 'Étape 2 (rapide) : l’eau utilise un doublet libre pour se lier au carbocation. Elle peut arriver des deux côtés, donc les deux produits images l’un de l’autre se forment.',
      'sn1.4': 'Un ion oxonium se forme : l’oxygène a maintenant trois liaisons et une charge +.',
      'sn1.5': 'Étape 3 : une autre molécule d’eau enlève un H⁺ et donne un alcool neutre. Si le carbone était chiral, on obtient un mélange des deux formes (racémisation).',
      'e2.0': 'Départ : une base forte (OH⁻). Le H du carbone β et le Br du carbone α pointent dans des directions opposées (anti-périplanaires).',
      'e2.1': 'Tout en une étape : la base arrache le H en β, les électrons C–H forment une double liaison C=C, et Br⁻ part.',
      'e2.2': 'État de transition : les liaisons C–H et C–Br sont à moitié rompues pendant que la double liaison est à moitié formée.',
      'e2.3': 'Produit : un alcène, de l’eau et Br⁻. Les atomes autour de la C=C sont maintenant dans un même plan.',
      'e1.0': 'Départ : un substrat avec une base faible (l’eau), en général en chauffant.',
      'e1.1': 'Étape 1 (lente) : la liaison C–Br se rompt et Br⁻ part, comme dans la SN1.',
      'e1.2': 'Intermédiaire carbocation : le carbone α est positif et plan.',
      'e1.3': 'Étape 2 (rapide) : l’eau enlève un H du carbone β voisin, et ces électrons forment la double liaison C=C.',
      'e1.4': 'Produit : un alcène, H₃O⁺ et Br⁻. Quand plusieurs alcènes sont possibles, le plus substitué est en général majoritaire (règle de Zaïtsev).',

      'mech.facts': 'À retenir', 'mech.fact.rate': 'Loi de vitesse', 'mech.fact.steps': 'Étapes', 'mech.fact.substrate': 'Meilleur substrat',
      'mech.fact.reagent': 'Réactif', 'mech.fact.solvent': 'Solvant', 'mech.fact.stereo': 'Stéréochimie',
      'sn2.rate': 'v = k [substrat][Nu⁻]', 'sn2.steps': '1 (concertée)', 'sn2.substrate': 'méthyle > 1° > 2° (le 3° ne réagit pas)',
      'sn2.reagent': 'nucléophile fort (OH⁻, CH₃O⁻, I⁻, HS⁻)', 'sn2.solvent': 'polaire aprotique (acétone, DMSO)', 'sn2.stereo': 'inversion',
      'sn1.rate': 'v = k [substrat]', 'sn1.steps': '2 ou 3 (intermédiaire carbocation)', 'sn1.substrate': '3° > 2° (méthyle et 1° ne réagissent pas)',
      'sn1.reagent': 'nucléophile faible (H₂O, CH₃OH)', 'sn1.solvent': 'polaire protique (eau, alcools)', 'sn1.stereo': 'racémisation (les deux formes)',
      'e2.rate': 'v = k [substrat][base]', 'e2.steps': '1 (concertée)', 'e2.substrate': '3° > 2° > 1°',
      'e2.reagent': 'base forte (OH⁻, CH₃O⁻, t-BuO⁻ encombrée)', 'e2.solvent': 'nombreux solvants', 'e2.stereo': 'H et groupe partant anti-périplanaires',
      'e1.rate': 'v = k [substrat]', 'e1.steps': '2 (intermédiaire carbocation)', 'e1.substrate': '3° > 2°',
      'e1.reagent': 'base faible (H₂O, CH₃OH) + chaleur', 'e1.solvent': 'polaire protique', 'e1.stereo': 'alcène le plus substitué (Zaïtsev)',

      'pred.title': 'Quel mécanisme ?', 'pred.intro': 'Choisis le substrat et le réactif. L’application prédit le mécanisme principal avec les règles habituelles du cours.',
      'pred.substrate': 'Substrat (carbone lié au groupe partant)', 'pred.reagent': 'Réactif', 'pred.heat': 'Chauffage',
      'pred.r.goodNu': 'Bon nucléophile, base faible (I⁻, Br⁻, HS⁻)', 'pred.r.strongBase': 'Nucléophile fort et base forte (OH⁻, CH₃O⁻)',
      'pred.r.bulky': 'Base forte encombrée (t-BuO⁻)', 'pred.r.weak': 'Nucléophile faible et base faible (H₂O, CH₃OH)',
      'pred.show': 'Voir ce mécanisme', 'pred.none': 'Pas de réaction (très lente)',
      'why.methylWeak': 'Un substrat méthyle ne peut pas former de carbocation, et l’eau ou l’alcool sont trop faibles pour une SN2.',
      'why.methyl': 'Un carbone méthyle n’est pas encombré et n’a pas d’hydrogène en β : seule la SN2 est possible.',
      'why.1bulky': 'Une base encombrée ne peut pas atteindre le carbone, elle arrache donc un H en β : E2.',
      'why.1': 'Les carbones primaires sont faciles à attaquer par l’arrière : la SN2 est la voie principale.',
      'why.1weak': 'Les carbocations primaires sont trop instables pour SN1/E1, et le réactif est trop faible pour une SN2.',
      'why.2goodNu': 'Un bon nucléophile qui est une base faible fait une substitution : SN2.',
      'why.2base': 'Une base forte sur un carbone secondaire donne surtout une élimination : E2 (la SN2 est minoritaire).',
      'why.2weak': 'Un nucléophile faible sur un carbone secondaire réagit lentement via un carbocation : SN1, et E1 si on chauffe.',
      'why.3goodNu': 'Les carbones tertiaires sont trop encombrés pour la SN2 mais forment des carbocations stables : SN1.',
      'why.3base': 'Une base forte et un substrat tertiaire donnent une élimination : E2.',
      'why.3weak': 'Un nucléophile faible et un carbocation tertiaire stable : SN1, et E1 si on chauffe.',
      'why.heat': 'La chaleur favorise l’élimination par rapport à la substitution.',

      'cmp.title': 'SN1, SN2, E1, E2 côte à côte'
    }
  });

  var STYLE = {
    C: { color: '#5b6070', r: 0.4, text: '#ffffff' },
    H: { color: '#f4f4f4', r: 0.27, text: '#1c2233' },
    O: { color: '#e53935', r: 0.44, text: '#ffffff' },
    Br: { color: '#a52a2a', r: 0.52, text: '#ffffff' },
    R: { color: '#9aa0ad', r: 0.42, text: '#1c2233' }
  };

  var state = { mech: M.list[0], substrate: 'secondary', frame: 0, playing: false, yaw: 0.6, pitch: -0.35, anim: null, pos: null };
  var els = {};

  // ---------- 3D stage ----------

  var SCALE = 74; // pixels per ångström, refit for each mechanism

  function project(p) {
    var cy = Math.cos(state.yaw), sy = Math.sin(state.yaw);
    var c = state.center || [0, 0, 0];
    p = [p[0] - c[0], p[1] - c[1], p[2] - c[2]];
    var x1 = p[0] * cy + p[2] * sy, z1 = -p[0] * sy + p[2] * cy;
    var cp = Math.cos(state.pitch), sp = Math.sin(state.pitch);
    var y2 = p[1] * cp - z1 * sp, z2 = p[1] * sp + z1 * cp;
    var k = 1 + z2 * 0.05;
    return { x: 330 + x1 * SCALE * k, y: 190 - y2 * SCALE * k, z: z2, k: k };
  }

  function labelFor(atom, frame) {
    if (frame.labels && frame.labels[atom.id]) return frame.labels[atom.id];
    if (/^R\d$/.test(atom.id) && state.mech.atoms[1].id === 'R1') {
      var sub = M.substrates.filter(function (s) { return s.key === state.substrate; })[0];
      return sub.groups[+atom.id.slice(1) - 1];
    }
    return atom.label;
  }

  function styleFor(atom, label) {
    if (atom.el === 'R' && label === 'H') return STYLE.H;
    return STYLE[atom.el];
  }

  function draw() {
    var stage = els.stage;
    while (stage.firstChild) stage.removeChild(stage.firstChild);
    var mech = state.mech, frame = mech.frames[state.frame];
    var pts = {};
    mech.atoms.forEach(function (a) { pts[a.id] = project(state.pos[a.id]); });

    var items = [];
    frame.bonds.forEach(function (b) {
      var p = pts[b[0]], q = pts[b[1]];
      items.push({ z: (p.z + q.z) / 2 - 0.05, draw: function () { drawBond(stage, p, q, b[2]); } });
    });
    mech.atoms.forEach(function (a) {
      var p = pts[a.id];
      var label = labelFor(a, frame);
      var st = styleFor(a, label);
      items.push({ z: p.z, draw: function () {
        var r = st.r * SCALE * 0.68 * p.k;
        stage.appendChild(svg('circle', { cx: p.x, cy: p.y, r: r, fill: st.color, stroke: 'rgba(0,0,0,.35)', 'stroke-width': 1 }));
        stage.appendChild(svg('circle', { cx: p.x - r * 0.35, cy: p.y - r * 0.35, r: r * 0.35, fill: 'rgba(255,255,255,.35)' }));
        var tx = svg('text', { x: p.x, y: p.y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': Math.min(15, r * 0.75), 'font-weight': 700, fill: st.text });
        tx.textContent = label;
        stage.appendChild(tx);
        var q = frame.charges && frame.charges[a.id];
        if (q) {
          var ct = svg('text', { x: p.x + r * 0.9, y: p.y - r * 0.9, 'font-size': 17, 'font-weight': 800, class: 'mech-charge' });
          ct.textContent = q;
          stage.appendChild(ct);
        }
      } });
    });
    items.sort(function (a, b) { return a.z - b.z; }).forEach(function (it) { it.draw(); });

    if (!state.anim) (frame.arrows || []).forEach(function (ar) { drawArrow(stage, point(ar.from, pts), point(ar.to, pts)); });
    if (frame.ts) {
      var ts = svg('text', { x: 330, y: 40, 'text-anchor': 'middle', 'font-size': 22, 'font-weight': 800, class: 'mech-ts' });
      ts.textContent = '[ ‡ ]';
      stage.appendChild(ts);
    }
  }

  function point(ref, pts) {
    if (typeof ref === 'string') return pts[ref];
    var a = pts[ref[0]], b = pts[ref[1]];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function drawBond(stage, p, q, order) {
    var dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy) || 1;
    var nx = -dy / len, ny = dx / len;
    var lines = order === 2 ? [[-4, false], [4, false]] : order === 1.5 ? [[-3.5, false], [3.5, true]] : [[0, order === 0.5]];
    lines.forEach(function (l) {
      stage.appendChild(svg('line', {
        x1: p.x + nx * l[0], y1: p.y + ny * l[0], x2: q.x + nx * l[0], y2: q.y + ny * l[0],
        class: 'mech-bond', 'stroke-width': order >= 1.5 ? 3.5 : 6, 'stroke-linecap': 'round', 'stroke-dasharray': l[1] ? '5 6' : null
      }));
    });
  }

  function drawArrow(stage, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    // Stop short of the target and bow the curve sideways like a textbook arrow.
    var ex = b.x - dx / len * 16, ey = b.y - dy / len * 16;
    var cx = (a.x + ex) / 2 - dy / len * Math.min(60, len * 0.45), cy = (a.y + ey) / 2 + dx / len * Math.min(60, len * 0.45);
    stage.appendChild(svg('path', { d: 'M' + a.x + ' ' + a.y + ' Q' + cx + ' ' + cy + ' ' + ex + ' ' + ey, class: 'mech-arrow', 'marker-end': 'url(#mech-head)' }));
  }

  // ---------- Animation ----------

  function ease(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }

  function goTo(i, instant) {
    var mech = state.mech;
    i = Math.max(0, Math.min(mech.frames.length - 1, i));
    var from = state.pos, to = mech.frames[i].pos;
    state.frame = i;
    if (state.anim) cancelAnimationFrame(state.anim);
    state.anim = null;
    var reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var t0 = mech.frames[Math.max(0, i - 1)].t, t1 = mech.frames[i].t;
    if (instant || !from || reduced) {
      state.pos = clone(to); draw(); updateUi(t1); return;
    }
    var start = null, dur = 1100, prevT = state.energyT === undefined ? t0 : state.energyT;
    function stepFn(ts) {
      if (start === null) start = ts;
      var x = Math.min(1, (ts - start) / dur), e = ease(x);
      state.pos = {};
      Object.keys(to).forEach(function (k) {
        state.pos[k] = to[k].map(function (v, j) { return from[k][j] + (v - from[k][j]) * e; });
      });
      draw();
      moveMarker(prevT + (t1 - prevT) * e);
      if (x < 1) state.anim = requestAnimationFrame(stepFn);
      else { state.anim = null; draw(); updateUi(t1); }
    }
    updateUi(null);
    state.anim = requestAnimationFrame(stepFn);
  }

  function clone(pos) {
    var o = {};
    Object.keys(pos).forEach(function (k) { o[k] = pos[k].slice(); });
    return o;
  }

  function play() {
    if (state.playing) { stop(); return; }
    state.playing = true;
    if (state.frame >= state.mech.frames.length - 1) goTo(0, true);
    els.play.textContent = t('mech.pause');
    (function tick() {
      if (!state.playing) return;
      if (state.frame >= state.mech.frames.length - 1) { stop(); return; }
      goTo(state.frame + 1);
      state.timer = setTimeout(tick, 3200);
    })();
  }

  function stop() {
    state.playing = false;
    clearTimeout(state.timer);
    els.play.textContent = t('mech.play');
  }

  function updateUi(energyT) {
    var mech = state.mech, frame = mech.frames[state.frame];
    els.stepNo.textContent = t('mech.step', { n: state.frame + 1, total: mech.frames.length });
    els.caption.textContent = t(frame.step);
    els.prev.disabled = state.frame === 0;
    els.next.disabled = state.frame === mech.frames.length - 1;
    if (energyT !== null) moveMarker(energyT);
  }

  // ---------- Energy diagram ----------

  var EW = 340, EH = 210, PAD = { l: 34, r: 12, t: 18, b: 30 };

  function energyAt(profile, x) {
    for (var i = 0; i < profile.length - 1; i++) {
      var a = profile[i], b = profile[i + 1];
      if (x >= a[0] && x <= b[0]) {
        var f = (x - a[0]) / (b[0] - a[0] || 1);
        return a[1] + (b[1] - a[1]) * (1 - Math.cos(Math.PI * f)) / 2;
      }
    }
    return profile[profile.length - 1][1];
  }
  function ex(x) { return PAD.l + x * (EW - PAD.l - PAD.r); }
  function ey(y) { return PAD.t + y * (EH - PAD.t - PAD.b); }

  function drawEnergy() {
    var s = els.energy;
    while (s.firstChild) s.removeChild(s.firstChild);
    var prof = state.mech.profile;
    s.appendChild(svg('line', { x1: PAD.l, y1: PAD.t - 6, x2: PAD.l, y2: EH - PAD.b, class: 'mech-axis' }));
    s.appendChild(svg('line', { x1: PAD.l, y1: EH - PAD.b, x2: EW - PAD.r, y2: EH - PAD.b, class: 'mech-axis' }));
    var yl = svg('text', { x: 12, y: (EH - PAD.b) / 2 + 10, transform: 'rotate(-90 12 ' + ((EH - PAD.b) / 2 + 10) + ')', 'text-anchor': 'middle', class: 'mech-axis-text' });
    yl.textContent = t('mech.energy');
    s.appendChild(yl);
    var xl = svg('text', { x: (EW + PAD.l) / 2, y: EH - 8, 'text-anchor': 'middle', class: 'mech-axis-text' });
    xl.textContent = t('mech.progress');
    s.appendChild(xl);
    var d = '';
    for (var i = 0; i <= 120; i++) {
      var x = i / 120;
      d += (i ? 'L' : 'M') + ex(x).toFixed(1) + ' ' + ey(energyAt(prof, x)).toFixed(1);
    }
    s.appendChild(svg('path', { d: d, class: 'mech-curve' }));
    state.mech.marks.forEach(function (m) {
      var y = ey(energyAt(prof, m.t));
      var lab = svg('text', { x: Math.min(EW - PAD.r - 2, Math.max(PAD.l + 4, ex(m.t))), y: y + (/^ts/.test(m.k) ? -8 : 16),
        'text-anchor': m.t === 0 ? 'start' : m.t === 1 ? 'end' : 'middle', class: 'mech-mark' });
      lab.textContent = t('mech.mark.' + m.k);
      s.appendChild(lab);
    });
    els.marker = svg('circle', { r: 7, class: 'mech-marker' });
    s.appendChild(els.marker);
  }

  function moveMarker(x) {
    state.energyT = x;
    if (!els.marker) return;
    els.marker.setAttribute('cx', ex(x));
    els.marker.setAttribute('cy', ey(energyAt(state.mech.profile, x)));
  }

  // ---------- Facts, comparison and predictor ----------

  var FACTS = ['rate', 'steps', 'substrate', 'reagent', 'solvent', 'stereo'];

  function renderFacts() {
    var k = state.mech.key;
    var dl = h('dl', { class: 'el-props' });
    FACTS.forEach(function (f) {
      dl.appendChild(h('dt', { text: t('mech.fact.' + f) }));
      dl.appendChild(h('dd', { text: t(k + '.' + f) }));
    });
    els.facts.innerHTML = '';
    els.facts.appendChild(h('h3', { text: t('mech.facts') }));
    els.facts.appendChild(dl);
  }

  function renderWarning() {
    var k = state.mech.key, s = state.substrate, msg = null;
    if (k === 'sn2' && s === 'tertiary') msg = t('mech.warn.sn2');
    if (k === 'sn1' && (s === 'methyl' || s === 'primary')) msg = t('mech.warn.sn1');
    els.warn.hidden = !msg;
    els.warn.textContent = msg || '';
  }

  function comparisonTable() {
    var keys = ['sn2', 'sn1', 'e2', 'e1'];
    return h('div', { class: 'scroll-x' }, h('table', { class: 'data mech-table' }, [
      h('thead', null, h('tr', null, [h('th')].concat(keys.map(function (k) { return h('th', { text: k.toUpperCase() }); })))),
      h('tbody', null, FACTS.map(function (f) {
        return h('tr', null, [h('th', { text: t('mech.fact.' + f) })].concat(keys.map(function (k) { return h('td', { text: t(k + '.' + f) }); })));
      }))
    ]));
  }

  // Textbook decision rules. Returns { mech, minor, why: [keys] }.
  function predict(sub, reagent, heat) {
    var r = { mech: null, minor: null, why: [] };
    if (sub === 'methyl') {
      if (reagent === 'weak') { r.why.push('why.methylWeak'); return r; }
      r.mech = 'sn2'; r.why.push('why.methyl'); return r;
    }
    if (sub === 'primary') {
      if (reagent === 'bulky') { r.mech = 'e2'; r.why.push('why.1bulky'); return r; }
      if (reagent === 'weak') { r.why.push('why.1weak'); return r; }
      r.mech = 'sn2'; r.why.push('why.1');
      if (reagent === 'strongBase') r.minor = 'e2';
      return r;
    }
    if (sub === 'secondary') {
      if (reagent === 'goodNu') { r.mech = 'sn2'; r.why.push('why.2goodNu'); return r; }
      if (reagent === 'weak') { r.mech = heat ? 'e1' : 'sn1'; r.minor = heat ? 'sn1' : 'e1'; r.why.push('why.2weak'); }
      else { r.mech = 'e2'; r.minor = reagent === 'strongBase' ? 'sn2' : null; r.why.push('why.2base'); }
    } else {
      if (reagent === 'goodNu') { r.mech = 'sn1'; r.why.push('why.3goodNu'); }
      else if (reagent === 'weak') { r.mech = heat ? 'e1' : 'sn1'; r.minor = heat ? 'sn1' : 'e1'; r.why.push('why.3weak'); }
      else { r.mech = 'e2'; r.why.push('why.3base'); }
    }
    if (heat) r.why.push('why.heat');
    return r;
  }

  function renderPredictor(box) {
    var subSel = h('select', { class: 'input', id: 'pred-sub' });
    M.substrates.forEach(function (s) { subSel.appendChild(h('option', { value: s.key, text: t('mech.sub.' + s.key) + ' — ' + s.formula })); });
    var reSel = h('select', { class: 'input', id: 'pred-reagent' });
    ['goodNu', 'strongBase', 'bulky', 'weak'].forEach(function (k) { reSel.appendChild(h('option', { value: k, text: t('pred.r.' + k) })); });
    var heat = h('input', { type: 'checkbox', id: 'pred-heat' });
    var out = h('div', { class: 'pred-out', 'aria-live': 'polite' });
    subSel.value = 'tertiary'; reSel.value = 'weak';
    function update() {
      var r = predict(subSel.value, reSel.value, heat.checked);
      out.innerHTML = '';
      out.appendChild(h('div', { class: 'pred-result', text: r.mech ? r.mech.toUpperCase() + (r.minor ? '  (+ ' + r.minor.toUpperCase() + ')' : '') : t('pred.none') }));
      var ul = h('ul', { class: 'small' });
      r.why.forEach(function (w) { ul.appendChild(h('li', { text: t(w) })); });
      out.appendChild(ul);
      if (r.mech) {
        out.appendChild(h('button', { class: 'btn', type: 'button', text: t('pred.show'), onclick: function () {
          var sub = subSel.value;
          select(r.mech, /^sn/.test(r.mech) ? sub : null);
          els.stageWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } }));
      }
    }
    [subSel, reSel, heat].forEach(function (c) { c.addEventListener('change', update); });
    subSel.style.width = reSel.style.width = '100%';
    box.appendChild(h('div', { class: 'card stack' }, [
      h('h3', { text: t('pred.title') }),
      h('p', { class: 'small muted', text: t('pred.intro') }),
      h('div', { class: 'ion-select' }, [
        h('label', { for: 'pred-sub' }, [t('pred.substrate'), subSel]),
        h('label', { for: 'pred-reagent' }, [t('pred.reagent'), reSel])
      ]),
      h('label', { class: 'row small', for: 'pred-heat' }, [heat, t('pred.heat')]),
      out
    ]));
    update();
  }

  // Middle of everything the animation shows, so each mechanism sits centered on the stage.
  function centroid(mech) {
    var min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    mech.frames.forEach(function (f) {
      Object.keys(f.pos).forEach(function (k) {
        f.pos[k].forEach(function (v, i) { min[i] = Math.min(min[i], v); max[i] = Math.max(max[i], v); });
      });
    });
    return min.map(function (v, i) { return (v + max[i]) / 2; });
  }

  // Largest zoom that keeps every frame inside the 660×380 stage.
  function fitScale(mech, c) {
    var rH = 0, rV = 0;
    mech.frames.forEach(function (f) {
      Object.keys(f.pos).forEach(function (k) {
        var p = f.pos[k];
        rH = Math.max(rH, Math.hypot(p[0] - c[0], p[2] - c[2]));
        rV = Math.max(rV, Math.hypot(p[1] - c[1], p[2] - c[2]));
      });
    });
    return Math.min(80, 300 / (rH + 0.35), 172 / (rV + 0.35));
  }

  // ---------- Layout ----------

  function select(key, substrate) {
    stop();
    state.mech = M.list.filter(function (m) { return m.key === key; })[0];
    if (substrate) state.substrate = substrate;
    els.tabs.querySelectorAll('[data-mech]').forEach(function (b) { b.classList.toggle('active', b.dataset.mech === key); });
    els.title.textContent = key.toUpperCase() + ' — ' + t('mech.' + key + '.full');
    var isSub = /^sn/.test(key);
    els.subRow.hidden = !isSub;
    els.subSel.value = state.substrate;
    state.pos = null; state.energyT = undefined;
    state.center = centroid(state.mech);
    SCALE = fitScale(state.mech, state.center);
    state.yaw = isSub ? 0.6 : 0.35;
    state.pitch = isSub ? -0.35 : -0.55;
    drawEnergy();
    renderFacts();
    renderWarning();
    goTo(0, true);
  }

  function init() {
    var box = document.getElementById('mech-root');
    els.tabs = h('div', { class: 'subtabs' });
    M.list.forEach(function (m) {
      els.tabs.appendChild(h('button', { class: 'chip', type: 'button', 'data-mech': m.key, text: m.key.toUpperCase(), onclick: function () { select(m.key); } }));
    });

    els.subSel = h('select', { class: 'input', id: 'mech-substrate', onchange: function () { state.substrate = els.subSel.value; renderWarning(); draw(); } });
    M.substrates.forEach(function (s) { els.subSel.appendChild(h('option', { value: s.key, text: t('mech.sub.' + s.key) + ' — ' + s.formula })); });
    els.subRow = h('label', { class: 'row small', for: 'mech-substrate' }, [t('mech.substrate'), els.subSel]);

    els.stage = svg('g');
    var defs = svg('defs');
    var marker = svg('marker', { id: 'mech-head', viewBox: '0 0 10 10', refX: '7', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' });
    marker.appendChild(svg('path', { d: 'M0 0 L10 5 L0 10 z', class: 'mech-arrow-head' }));
    defs.appendChild(marker);
    var view = svg('svg', { viewBox: '0 0 660 380', class: 'viewer mech-viewer', role: 'img', 'aria-label': 'Reaction mechanism animation' });
    view.appendChild(defs);
    view.appendChild(els.stage);
    var drag = null;
    view.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, y: e.clientY }; if (view.setPointerCapture) view.setPointerCapture(e.pointerId); });
    view.addEventListener('pointermove', function (e) {
      if (!drag) return;
      state.yaw += (e.clientX - drag.x) * 0.01;
      state.pitch = Math.max(-1.4, Math.min(1.4, state.pitch + (e.clientY - drag.y) * 0.01));
      drag = { x: e.clientX, y: e.clientY };
      draw();
    });
    ['pointerup', 'pointercancel'].forEach(function (ev) { view.addEventListener(ev, function () { drag = null; }); });

    els.title = h('h3', { style: { margin: 0 } });
    els.warn = h('div', { class: 'feedback bad small', hidden: true });
    els.stepNo = h('div', { class: 'small muted' });
    els.caption = h('p', { class: 'mech-caption' });
    els.prev = h('button', { class: 'btn', type: 'button', text: t('mech.prev'), onclick: function () { stop(); goTo(state.frame - 1); } });
    els.next = h('button', { class: 'btn', type: 'button', text: t('mech.next'), onclick: function () { stop(); goTo(state.frame + 1); } });
    els.play = h('button', { class: 'btn primary', type: 'button', text: t('mech.play'), onclick: play });
    var reset = h('button', { class: 'btn', type: 'button', text: t('mech.reset'), onclick: function () { stop(); state.pos = null; goTo(0, true); } });
    els.energy = svg('svg', { viewBox: '0 0 ' + EW + ' ' + EH, class: 'mech-energy', role: 'img', 'aria-label': 'Energy diagram' });
    els.facts = h('div', { class: 'card' });

    els.stageWrap = h('div', { class: 'card stack' }, [
      h('div', { class: 'row', style: { justifyContent: 'space-between' } }, [els.title, els.subRow]),
      els.warn,
      view,
      h('p', { class: 'small muted', text: t('mech.drag') }),
      h('div', { class: 'row' }, [els.prev, els.play, els.next, reset, els.stepNo]),
      els.caption
    ]);

    box.appendChild(els.tabs);
    box.appendChild(h('div', { class: 'mech-layout' }, [
      els.stageWrap,
      h('div', { class: 'stack' }, [h('div', { class: 'card' }, [els.energy]), els.facts])
    ]));
    var lower = h('div', { style: { marginTop: '16px' } });
    renderPredictor(lower);
    box.appendChild(lower);
    box.appendChild(h('div', { class: 'card', style: { marginTop: '16px' } }, [h('h3', { text: t('cmp.title') }), comparisonTable()]));
    select('sn2', 'secondary');
  }

  UI.views.mechanisms = { init: init, predict: predict };
})(this);
