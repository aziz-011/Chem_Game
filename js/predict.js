// Predicts the outcome of an organic reaction (substrate + reagent + heat):
// mechanism, major/minor products, by-products, the step-by-step workflow
// and the catalyst's role. Text is returned as translation keys with
// variables, so the UI can show it in any language.
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory(require('./data/organic.js'));
  else root.Predict = factory(root.ORGANIC);
})(this, function (ORGANIC) {
  'use strict';

  function find(list, id) { return list.filter(function (x) { return x.id === id; })[0] || null; }

  // Textbook decision rules for alkyl halides. Returns { mech, minor, why }.
  function mechanismFor(cls, type, heat) {
    var r = { mech: null, minor: null, why: [] };
    if (cls === 'methyl') {
      if (type === 'weak') { r.why.push('why.methylWeak'); return r; }
      r.mech = 'sn2'; r.why.push('why.methyl'); return r;
    }
    if (cls === 'primary') {
      if (type === 'bulky') { r.mech = 'e2'; r.why.push('why.1bulky'); return r; }
      if (type === 'weak') { r.why.push('why.1weak'); return r; }
      r.mech = 'sn2'; r.why.push('why.1');
      if (type === 'strongBase') r.minor = 'e2';
      return r;
    }
    if (cls === 'secondary') {
      if (type === 'goodNu') { r.mech = 'sn2'; r.why.push('why.2goodNu'); return r; }
      if (type === 'weak') { r.mech = heat ? 'e1' : 'sn1'; r.minor = heat ? 'sn1' : 'e1'; r.why.push('why.2weak'); }
      else { r.mech = 'e2'; r.minor = type === 'strongBase' ? 'sn2' : null; r.why.push('why.2base'); }
    } else {
      if (type === 'goodNu') { r.mech = 'sn1'; r.why.push('why.3goodNu'); }
      else if (type === 'weak') { r.mech = heat ? 'e1' : 'sn1'; r.minor = heat ? 'sn1' : 'e1'; r.why.push('why.3weak'); }
      else { r.mech = 'e2'; r.why.push('why.3base'); }
    }
    if (heat) r.why.push('why.heat');
    return r;
  }

  // Product of one mechanism for an alkyl halide.
  function productOf(sub, reagent, mech) {
    if (mech === 'sn1' || mech === 'sn2') return sub.sub[reagent.nu] || null;
    if (mech === 'e1' || mech === 'e2') {
      if (!sub.zaitsev) return null;
      // A bulky base removes the easiest-to-reach H: the less substituted (Hofmann) alkene.
      if (mech === 'e2' && reagent.type === 'bulky' && sub.hofmann) return sub.hofmann;
      return sub.zaitsev;
    }
    return null;
  }

  function predictHalide(sub, reagent, heat) {
    var rule = mechanismFor(sub.cls, reagent.type, heat);
    var out = { mech: rule.mech || 'none', minorMech: rule.minor, why: rule.why.slice(), steps: [], catalyst: null, byproducts: [] };
    if (!rule.mech) return out;
    out.major = productOf(sub, reagent, rule.mech);
    if (!out.major) { out.mech = 'none'; out.why.push('why.noBetaH'); return out; }
    out.minor = rule.minor ? productOf(sub, reagent, rule.minor) : null;
    if (rule.mech === 'e2' && reagent.type === 'bulky' && sub.hofmann) {
      out.why.push('why.hofmann');
      out.minor = sub.zaitsev;
    } else if (/^e/.test(rule.mech) && sub.hofmann) {
      out.why.push('why.zaitsev');
      if (!out.minor) out.minor = sub.hofmann;
    }
    if (out.minor && out.major && out.minor[0] === out.major[0]) out.minor = null;
    var isSub = /^sn/.test(rule.mech);
    out.byproducts = isSub ? [reagent.salt] : (reagent.type === 'weak' ? [reagent.elimBy, 'Br-'] : [reagent.elimBy, reagent.salt]);
    var v = { nuc: reagent.ion, nuc_fr: reagent.ion_fr };
    if (rule.mech === 'sn2') {
      out.steps.push({ key: 'step.sn2', vars: v });
      if (sub.chiral) out.steps.push({ key: 'step.sn2.chiral' });
    } else if (rule.mech === 'sn1') {
      out.steps.push({ key: 'step.ionize' });
      out.steps.push({ key: 'step.sn1.attack', vars: v });
      if (reagent.type === 'weak') out.steps.push({ key: 'step.sn1.deprotonate' });
      if (sub.chiral) out.steps.push({ key: 'step.sn1.chiral' });
    } else if (rule.mech === 'e2') {
      out.steps.push({ key: 'step.e2', vars: v });
    } else {
      out.steps.push({ key: 'step.ionize' });
      out.steps.push({ key: 'step.e1.deprotonate', vars: v });
    }
    out.animate = rule.mech;
    out.animClass = sub.cls;
    return out;
  }

  function predictAlcohol(sub, reagent) {
    var out = { why: [], steps: [], catalyst: null, byproducts: [] };
    if (reagent.type === 'acidCat') {
      // Acid-catalysed dehydration: E1 for 2°/3°, E2 on the protonated alcohol for 1°.
      out.mech = sub.cls === 'primary' ? 'e2' : 'e1';
      out.major = sub.zaitsev;
      out.minor = sub.hofmann || null;
      out.byproducts = ['H2O'];
      out.catalyst = { formula: 'H2SO4', name: 'catalyst.h2so4', role: 'catalyst.dehydration', regenerated: true };
      out.why.push('why.dehydration');
      if (sub.hofmann) out.why.push('why.zaitsev');
      out.steps.push({ key: 'step.protonateOH', cat: 'enter' });
      if (out.mech === 'e1') {
        out.steps.push({ key: 'step.loseWater' });
        out.steps.push({ key: 'step.dehydration.e1', cat: 'regen' });
      } else {
        out.steps.push({ key: 'step.dehydration.e2', cat: 'regen' });
      }
      out.animate = out.mech;
      out.animClass = sub.cls;
      return out;
    }
    if (reagent.type === 'hbr') {
      out.mech = sub.cls === 'primary' ? 'sn2' : 'sn1';
      out.major = sub.bromide;
      out.byproducts = ['H2O'];
      out.why.push(sub.cls === 'primary' ? 'why.hbr1' : 'why.hbr23');
      out.notCatalyst = 'catalyst.hbrConsumed';
      out.steps.push({ key: 'step.protonateOH.hbr' });
      if (out.mech === 'sn1') {
        out.steps.push({ key: 'step.loseWater' });
        out.steps.push({ key: 'step.hbr.sn1' });
      } else {
        out.steps.push({ key: 'step.hbr.sn2' });
      }
      out.animate = out.mech;
      out.animClass = sub.cls;
      return out;
    }
    out.mech = 'none';
    out.why.push('why.poorLG');
    return out;
  }

  function predictAcid(sub, reagent) {
    var out = { why: [], steps: [], catalyst: null, byproducts: [] };
    if (reagent.id === 'NaOH') {
      out.mech = 'acidbase';
      out.major = sub.salt;
      out.byproducts = ['H2O'];
      out.why.push('why.neutralize');
      out.steps.push({ key: 'step.neutralize' });
      return out;
    }
    out.major = sub.esters[reagent.alcohol];
    out.byproducts = ['H2O'];
    if (!reagent.catalyst) {
      out.mech = 'slow';
      out.why.push('why.noCatalyst');
      return out;
    }
    out.mech = 'fischer';
    out.why.push('why.fischer');
    out.catalyst = { formula: 'H2SO4', name: 'catalyst.h2so4', role: 'catalyst.ester', regenerated: true };
    out.steps.push({ key: 'step.fischer.1', cat: 'enter' });
    out.steps.push({ key: 'step.fischer.2' });
    out.steps.push({ key: 'step.fischer.3' });
    out.steps.push({ key: 'step.fischer.4' });
    out.steps.push({ key: 'step.fischer.5', cat: 'regen' });
    out.steps.push({ key: 'step.fischer.eq' });
    return out;
  }

  var CATALYSTS = {
    AlCl3: { name: 'catalyst.alcl3', role: 'catalyst.fc' },
    FeBr3: { name: 'catalyst.febr3', role: 'catalyst.halogen' },
    FeCl3: { name: 'catalyst.fecl3', role: 'catalyst.halogen' },
    H2SO4: { name: 'catalyst.h2so4', role: 'catalyst.sulfonation' }
  };

  // Electrophilic aromatic substitution (Friedel–Crafts, halogenation, sulfonation).
  function predictAromatic(sub, reagent) {
    var out = { why: [], steps: [], catalyst: null, byproducts: [] };
    if (reagent.fc && (sub.ring === 'deactivated')) {
      out.mech = 'none';
      out.why.push('why.fcDeactivated');
      return out;
    }
    var products = sub.ar[reagent.E];
    out.mech = 'sear';
    out.major = products[0];
    out.minor = products[1] || null;
    out.byproducts = reagent.hx ? [reagent.hx] : [];
    var c = CATALYSTS[reagent.cat];
    out.catalyst = { formula: reagent.cat, name: c.name, role: c.role, regenerated: true };
    out.why.push('why.sear');
    out.why.push(sub.director === 'none' ? 'why.dir.none' : sub.director === 'meta' ? 'why.dir.meta' : sub.ring === 'strong' ? 'why.dir.strong' : 'why.dir.op');
    if (reagent.fc === 'alkyl') out.why.push('why.fcPoly');
    if (reagent.fc === 'acyl') out.why.push('why.fcAcyl');
    var v = { E: reagent.eIon, cat: reagent.cat.replace(/(\d)/g, function (d) { return '₀₁₂₃₄₅₆₇₈₉'[d]; }), X: reagent.counter, group: sub.group || '' };
    out.steps.push({ key: reagent.E === 'SO3H' ? 'step.sear.1.so3' : reagent.fc === 'acyl' ? 'step.sear.1.acyl' : reagent.fc ? 'step.sear.1.alkyl' : 'step.sear.1.hal', vars: v, cat: 'enter' });
    out.steps.push({ key: 'step.sear.2', vars: v });
    out.steps.push({ key: reagent.hx ? 'step.sear.3' : 'step.sear.3.so3', vars: v, cat: 'regen' });
    if (sub.director !== 'none') out.steps.push({ key: sub.director === 'meta' ? 'step.sear.meta' : 'step.sear.op', vars: v });
    return out;
  }

  // Balanced-equation ingredients for the quantity calculator (catalysts and solvents excluded).
  function calcEquation(out) {
    var sub = out.substrate, r = out.reagent;
    if (!out.major) return null;
    var p = out.major[0].replace(/=/g, '');
    var reagentUsed = !(r.type === 'acidCat' || (r.type === 'weak' && /^e/.test(out.mech)));
    var products = [p];
    if (sub.kind === 'halide') {
      if (r.type === 'weak') products.push('HBr');
      else {
        if (/^e/.test(out.mech)) products.push(r.elimBy);
        products.push(r.salt);
      }
    } else {
      out.byproducts.forEach(function (b) { products.push(b); });
    }
    return { reactants: [sub.formula.replace(/=/g, '')].concat(reagentUsed ? [r.formula] : []), products: products };
  }

  function predict(substrateId, reagentId, heat) {
    var sub = find(ORGANIC.substrates, substrateId);
    var reagent = find(ORGANIC.reagents, reagentId);
    if (!sub || !reagent) return null;
    var out = sub.kind === 'halide' ? predictHalide(sub, reagent, !!heat) :
      sub.kind === 'alcohol' ? predictAlcohol(sub, reagent) :
      sub.kind === 'aromatic' ? predictAromatic(sub, reagent) : predictAcid(sub, reagent);
    out.substrate = sub;
    out.reagent = reagent;
    out.calc = calcEquation(out);
    return out;
  }

  function reagentsFor(substrateId) {
    var sub = find(ORGANIC.substrates, substrateId);
    return ORGANIC.reagents.filter(function (r) { return sub && r.for.indexOf(sub.kind) >= 0; });
  }

  return { predict: predict, mechanismFor: mechanismFor, reagentsFor: reagentsFor, find: find };
});
