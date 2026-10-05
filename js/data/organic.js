// Molecules and reagents for the reaction predictor.
// Products are listed per substrate so names stay correct (no guessing):
//   sub[nu]   → substitution product when the nucleophile is nu
//   zaitsev   → more substituted alkene (normal E1/E2 major product)
//   hofmann   → less substituted alkene (major with a bulky base)
// Each product is [condensed formula, English name, French name].
(function (root) {
  var SUBSTRATES = [
    // ---------- Alkyl halides ----------
    { id: 'CH3Br', kind: 'halide', cls: 'methyl', formula: 'CH3Br', name: 'bromomethane', name_fr: 'bromométhane',
      sub: {
        OH: ['CH3OH', 'methanol', 'méthanol'], OCH3: ['CH3OCH3', 'methoxymethane', 'méthoxyméthane'],
        I: ['CH3I', 'iodomethane', 'iodométhane'], SH: ['CH3SH', 'methanethiol', 'méthanethiol'],
        OtBu: ['CH3OC(CH3)3', '2-methoxy-2-methylpropane', '2-méthoxy-2-méthylpropane']
      } },
    { id: 'C2H5Br', kind: 'halide', cls: 'primary', formula: 'CH3CH2Br', name: 'bromoethane', name_fr: 'bromoéthane',
      sub: {
        OH: ['CH3CH2OH', 'ethanol', 'éthanol'], OCH3: ['CH3CH2OCH3', 'methoxyethane', 'méthoxyéthane'],
        I: ['CH3CH2I', 'iodoethane', 'iodoéthane'], SH: ['CH3CH2SH', 'ethanethiol', 'éthanethiol'],
        OtBu: ['CH3CH2OC(CH3)3', '2-ethoxy-2-methylpropane', '2-éthoxy-2-méthylpropane']
      },
      zaitsev: ['CH2=CH2', 'ethene', 'éthène'] },
    { id: '1-C3H7Br', kind: 'halide', cls: 'primary', formula: 'CH3CH2CH2Br', name: '1-bromopropane', name_fr: '1-bromopropane',
      sub: {
        OH: ['CH3CH2CH2OH', 'propan-1-ol', 'propan-1-ol'], OCH3: ['CH3CH2CH2OCH3', '1-methoxypropane', '1-méthoxypropane'],
        I: ['CH3CH2CH2I', '1-iodopropane', '1-iodopropane'], SH: ['CH3CH2CH2SH', 'propane-1-thiol', 'propane-1-thiol'],
        OtBu: ['CH3CH2CH2OC(CH3)3', '2-methyl-2-propoxypropane', '2-méthyl-2-propoxypropane']
      },
      zaitsev: ['CH3CH=CH2', 'propene', 'propène'] },
    { id: '2-C3H7Br', kind: 'halide', cls: 'secondary', formula: 'CH3CHBrCH3', name: '2-bromopropane', name_fr: '2-bromopropane',
      sub: {
        OH: ['CH3CH(OH)CH3', 'propan-2-ol', 'propan-2-ol'], OCH3: ['CH3CH(OCH3)CH3', '2-methoxypropane', '2-méthoxypropane'],
        I: ['CH3CHICH3', '2-iodopropane', '2-iodopropane'], SH: ['CH3CH(SH)CH3', 'propane-2-thiol', 'propane-2-thiol'],
        OtBu: ['CH3CH(OC(CH3)3)CH3', '2-methyl-2-(propan-2-yloxy)propane', '2-méthyl-2-(propan-2-yloxy)propane']
      },
      zaitsev: ['CH3CH=CH2', 'propene', 'propène'] },
    { id: '2-C4H9Br', kind: 'halide', cls: 'secondary', chiral: true, formula: 'CH3CHBrCH2CH3', name: '2-bromobutane', name_fr: '2-bromobutane',
      sub: {
        OH: ['CH3CH(OH)CH2CH3', 'butan-2-ol', 'butan-2-ol'], OCH3: ['CH3CH(OCH3)CH2CH3', '2-methoxybutane', '2-méthoxybutane'],
        I: ['CH3CHICH2CH3', '2-iodobutane', '2-iodobutane'], SH: ['CH3CH(SH)CH2CH3', 'butane-2-thiol', 'butane-2-thiol'],
        OtBu: ['CH3CH(OC(CH3)3)CH2CH3', '2-(butan-2-yloxy)-2-methylpropane', '2-(butan-2-yloxy)-2-méthylpropane']
      },
      zaitsev: ['CH3CH=CHCH3', 'but-2-ene (mostly trans)', 'but-2-ène (surtout trans)'],
      hofmann: ['CH2=CHCH2CH3', 'but-1-ene', 'but-1-ène'] },
    { id: 't-C4H9Br', kind: 'halide', cls: 'tertiary', formula: '(CH3)3CBr', name: '2-bromo-2-methylpropane', name_fr: '2-bromo-2-méthylpropane',
      sub: {
        OH: ['(CH3)3COH', '2-methylpropan-2-ol', '2-méthylpropan-2-ol'], OCH3: ['(CH3)3COCH3', '2-methoxy-2-methylpropane', '2-méthoxy-2-méthylpropane'],
        I: ['(CH3)3CI', '2-iodo-2-methylpropane', '2-iodo-2-méthylpropane'], SH: ['(CH3)3CSH', '2-methylpropane-2-thiol', '2-méthylpropane-2-thiol']
      },
      zaitsev: ['(CH3)2C=CH2', '2-methylpropene', '2-méthylpropène'] },
    { id: 't-C5H11Br', kind: 'halide', cls: 'tertiary', formula: '(CH3)2CBrCH2CH3', name: '2-bromo-2-methylbutane', name_fr: '2-bromo-2-méthylbutane',
      sub: {
        OH: ['(CH3)2C(OH)CH2CH3', '2-methylbutan-2-ol', '2-méthylbutan-2-ol'], OCH3: ['(CH3)2C(OCH3)CH2CH3', '2-methoxy-2-methylbutane', '2-méthoxy-2-méthylbutane'],
        I: ['(CH3)2CICH2CH3', '2-iodo-2-methylbutane', '2-iodo-2-méthylbutane'], SH: ['(CH3)2C(SH)CH2CH3', '2-methylbutane-2-thiol', '2-méthylbutane-2-thiol']
      },
      zaitsev: ['(CH3)2C=CHCH3', '2-methylbut-2-ene', '2-méthylbut-2-ène'],
      hofmann: ['CH2=C(CH3)CH2CH3', '2-methylbut-1-ene', '2-méthylbut-1-ène'] },

    // ---------- Alcohols ----------
    { id: 'EtOH', kind: 'alcohol', cls: 'primary', formula: 'CH3CH2OH', name: 'ethanol', name_fr: 'éthanol',
      bromide: ['CH3CH2Br', 'bromoethane', 'bromoéthane'], zaitsev: ['CH2=CH2', 'ethene', 'éthène'] },
    { id: 'iPrOH', kind: 'alcohol', cls: 'secondary', formula: 'CH3CH(OH)CH3', name: 'propan-2-ol', name_fr: 'propan-2-ol',
      bromide: ['CH3CHBrCH3', '2-bromopropane', '2-bromopropane'], zaitsev: ['CH3CH=CH2', 'propene', 'propène'] },
    { id: 'sBuOH', kind: 'alcohol', cls: 'secondary', formula: 'CH3CH(OH)CH2CH3', name: 'butan-2-ol', name_fr: 'butan-2-ol',
      bromide: ['CH3CHBrCH2CH3', '2-bromobutane', '2-bromobutane'],
      zaitsev: ['CH3CH=CHCH3', 'but-2-ene (mostly trans)', 'but-2-ène (surtout trans)'], hofmann: ['CH2=CHCH2CH3', 'but-1-ene', 'but-1-ène'] },
    { id: 'cHexOH', kind: 'alcohol', cls: 'secondary', formula: 'C6H11OH', name: 'cyclohexanol', name_fr: 'cyclohexanol',
      bromide: ['C6H11Br', 'bromocyclohexane', 'bromocyclohexane'], zaitsev: ['C6H10', 'cyclohexene', 'cyclohexène'] },
    { id: 'tBuOH', kind: 'alcohol', cls: 'tertiary', formula: '(CH3)3COH', name: '2-methylpropan-2-ol', name_fr: '2-méthylpropan-2-ol',
      bromide: ['(CH3)3CBr', '2-bromo-2-methylpropane', '2-bromo-2-méthylpropane'], zaitsev: ['(CH3)2C=CH2', '2-methylpropene', '2-méthylpropène'] },

    // ---------- Carboxylic acid ----------
    { id: 'AcOH', kind: 'acid', cls: 'acyl', formula: 'CH3COOH', name: 'acetic acid', name_fr: 'acide acétique',
      esters: { EtOH: ['CH3COOCH2CH3', 'ethyl acetate', 'acétate d’éthyle'], MeOH: ['CH3COOCH3', 'methyl acetate', 'acétate de méthyle'] },
      salt: ['CH3COONa', 'sodium acetate', 'acétate de sodium'] },

    // ---------- Aromatic rings (electrophilic aromatic substitution) ----------
    // director: none (benzene) | op (ortho/para) | meta. ring: activated | normal | deactivated
    // ar[E] = [para (or only) product, ortho product]; meta directors give a single meta product.
    { id: 'C6H6', kind: 'aromatic', cls: 'aromatic', director: 'none', ring: 'normal', formula: 'C6H6', name: 'benzene', name_fr: 'benzène',
      ar: {
        CH3: [['C6H5CH3', 'methylbenzene (toluene)', 'méthylbenzène (toluène)']],
        C2H5: [['C6H5CH2CH3', 'ethylbenzene', 'éthylbenzène']],
        COCH3: [['C6H5COCH3', '1-phenylethanone (acetophenone)', '1-phényléthanone (acétophénone)']],
        Br: [['C6H5Br', 'bromobenzene', 'bromobenzène']],
        Cl: [['C6H5Cl', 'chlorobenzene', 'chlorobenzène']],
        SO3H: [['C6H5SO3H', 'benzenesulfonic acid', 'acide benzènesulfonique']]
      } },
    { id: 'PhCH3', kind: 'aromatic', cls: 'aromatic', director: 'op', ring: 'activated', group: 'CH₃', formula: 'C6H5CH3', name: 'toluene (methylbenzene)', name_fr: 'toluène (méthylbenzène)',
      ar: {
        CH3: [['CH3C6H4CH3', '1,4-dimethylbenzene (p-xylene)', '1,4-diméthylbenzène (p-xylène)'], ['CH3C6H4CH3', '1,2-dimethylbenzene (o-xylene)', '1,2-diméthylbenzène (o-xylène)']],
        C2H5: [['CH3C6H4CH2CH3', '1-ethyl-4-methylbenzene', '1-éthyl-4-méthylbenzène'], ['CH3C6H4CH2CH3', '1-ethyl-2-methylbenzene', '1-éthyl-2-méthylbenzène']],
        COCH3: [['CH3C6H4COCH3', '1-(4-methylphenyl)ethanone', '1-(4-méthylphényl)éthanone'], ['CH3C6H4COCH3', '1-(2-methylphenyl)ethanone', '1-(2-méthylphényl)éthanone']],
        Br: [['CH3C6H4Br', '1-bromo-4-methylbenzene (p-bromotoluene)', '1-bromo-4-méthylbenzène (p-bromotoluène)'], ['CH3C6H4Br', '1-bromo-2-methylbenzene (o-bromotoluene)', '1-bromo-2-méthylbenzène (o-bromotoluène)']],
        Cl: [['CH3C6H4Cl', '1-chloro-4-methylbenzene', '1-chloro-4-méthylbenzène'], ['CH3C6H4Cl', '1-chloro-2-methylbenzene', '1-chloro-2-méthylbenzène']],
        SO3H: [['CH3C6H4SO3H', '4-methylbenzenesulfonic acid', 'acide 4-méthylbenzènesulfonique'], ['CH3C6H4SO3H', '2-methylbenzenesulfonic acid', 'acide 2-méthylbenzènesulfonique']]
      } },
    { id: 'PhOMe', kind: 'aromatic', cls: 'aromatic', director: 'op', ring: 'strong', group: 'OCH₃', formula: 'C6H5OCH3', name: 'anisole (methoxybenzene)', name_fr: 'anisole (méthoxybenzène)',
      ar: {
        CH3: [['CH3OC6H4CH3', '1-methoxy-4-methylbenzene', '1-méthoxy-4-méthylbenzène'], ['CH3OC6H4CH3', '1-methoxy-2-methylbenzene', '1-méthoxy-2-méthylbenzène']],
        C2H5: [['CH3OC6H4CH2CH3', '1-ethyl-4-methoxybenzene', '1-éthyl-4-méthoxybenzène'], ['CH3OC6H4CH2CH3', '1-ethyl-2-methoxybenzene', '1-éthyl-2-méthoxybenzène']],
        COCH3: [['CH3OC6H4COCH3', '1-(4-methoxyphenyl)ethanone', '1-(4-méthoxyphényl)éthanone'], ['CH3OC6H4COCH3', '1-(2-methoxyphenyl)ethanone', '1-(2-méthoxyphényl)éthanone']],
        Br: [['CH3OC6H4Br', '1-bromo-4-methoxybenzene', '1-bromo-4-méthoxybenzène'], ['CH3OC6H4Br', '1-bromo-2-methoxybenzene', '1-bromo-2-méthoxybenzène']],
        Cl: [['CH3OC6H4Cl', '1-chloro-4-methoxybenzene', '1-chloro-4-méthoxybenzène'], ['CH3OC6H4Cl', '1-chloro-2-methoxybenzene', '1-chloro-2-méthoxybenzène']],
        SO3H: [['CH3OC6H4SO3H', '4-methoxybenzenesulfonic acid', 'acide 4-méthoxybenzènesulfonique'], ['CH3OC6H4SO3H', '2-methoxybenzenesulfonic acid', 'acide 2-méthoxybenzènesulfonique']]
      } },
    { id: 'PhNO2', kind: 'aromatic', cls: 'aromatic', director: 'meta', ring: 'deactivated', group: 'NO₂', formula: 'C6H5NO2', name: 'nitrobenzene', name_fr: 'nitrobenzène',
      ar: {
        Br: [['O2NC6H4Br', '1-bromo-3-nitrobenzene', '1-bromo-3-nitrobenzène']],
        Cl: [['O2NC6H4Cl', '1-chloro-3-nitrobenzene', '1-chloro-3-nitrobenzène']],
        SO3H: [['O2NC6H4SO3H', '3-nitrobenzenesulfonic acid', 'acide 3-nitrobenzènesulfonique']]
      } }
  ];

  // type: goodNu | strongBase | bulky | weak (same classes as the mechanism rules)
  // byproduct of substitution with an alkyl bromide is listed per reagent.
  var REAGENTS = [
    { id: 'NaOH', for: ['halide', 'alcohol', 'acid'], formula: 'NaOH', label: 'NaOH (OH⁻)', type: 'strongBase', nu: 'OH',
      ion: 'OH⁻', ion_fr: 'OH⁻', salt: 'NaBr', elimBy: 'H2O' },
    { id: 'NaOMe', for: ['halide'], formula: 'CH3ONa', label: 'CH₃ONa (CH₃O⁻)', type: 'strongBase', nu: 'OCH3',
      ion: 'CH₃O⁻', ion_fr: 'CH₃O⁻', salt: 'NaBr', elimBy: 'CH3OH' },
    { id: 'KOtBu', for: ['halide'], formula: 'KOC(CH3)3', label: 't-BuOK ((CH₃)₃CO⁻, bulky)', label_fr: 't-BuOK ((CH₃)₃CO⁻, encombrée)', type: 'bulky', nu: 'OtBu',
      ion: '(CH₃)₃CO⁻', ion_fr: '(CH₃)₃CO⁻', salt: 'KBr', elimBy: '(CH3)3COH' },
    { id: 'NaI', for: ['halide'], formula: 'NaI', label: 'NaI in acetone (I⁻)', label_fr: 'NaI dans l’acétone (I⁻)', type: 'goodNu', nu: 'I',
      ion: 'I⁻', ion_fr: 'I⁻', salt: 'NaBr' },
    { id: 'NaSH', for: ['halide'], formula: 'NaSH', label: 'NaSH (HS⁻)', type: 'goodNu', nu: 'SH',
      ion: 'HS⁻', ion_fr: 'HS⁻', salt: 'NaBr' },
    { id: 'H2O', for: ['halide'], formula: 'H2O', label: 'H₂O (water)', label_fr: 'H₂O (eau)', type: 'weak', nu: 'OH',
      ion: 'H₂O', ion_fr: 'H₂O', salt: 'HBr', elimBy: 'H3O+' },
    { id: 'MeOH', for: ['halide'], formula: 'CH3OH', label: 'CH₃OH (methanol)', label_fr: 'CH₃OH (méthanol)', type: 'weak', nu: 'OCH3',
      ion: 'CH₃OH', ion_fr: 'CH₃OH', salt: 'HBr', elimBy: 'CH3OH2+' },
    { id: 'H2SO4', for: ['alcohol'], formula: 'H2SO4', label: 'conc. H₂SO₄ (catalyst), heat', label_fr: 'H₂SO₄ concentré (catalyseur), chauffage', type: 'acidCat' },
    { id: 'HBr', for: ['alcohol'], formula: 'HBr', label: 'HBr (concentrated)', label_fr: 'HBr (concentré)', type: 'hbr' },
    { id: 'EtOH_cat', for: ['acid'], formula: 'CH3CH2OH', label: 'ethanol + H₂SO₄ (catalyst)', label_fr: 'éthanol + H₂SO₄ (catalyseur)', type: 'ester', alcohol: 'EtOH', catalyst: true },
    { id: 'MeOH_cat', for: ['acid'], formula: 'CH3OH', label: 'methanol + H₂SO₄ (catalyst)', label_fr: 'méthanol + H₂SO₄ (catalyseur)', type: 'ester', alcohol: 'MeOH', catalyst: true },
    { id: 'EtOH_nocat', for: ['acid'], formula: 'CH3CH2OH', label: 'ethanol, no catalyst', label_fr: 'éthanol, sans catalyseur', type: 'ester', alcohol: 'EtOH', catalyst: false },

    // Electrophilic aromatic substitution: reagent + catalyst make the electrophile E⁺.
    // fc: Friedel–Crafts (fails on deactivated rings). counter: the anion that removes H⁺.
    { id: 'CH3Cl_AlCl3', for: ['aromatic'], formula: 'CH3Cl', label: 'CH₃Cl + AlCl₃ (catalyst): add a methyl group', label_fr: 'CH₃Cl + AlCl₃ (catalyseur) : ajouter un groupe méthyle',
      type: 'sear', E: 'CH3', eIon: 'CH₃⁺', fc: 'alkyl', cat: 'AlCl3', counter: 'AlCl₄⁻', hx: 'HCl' },
    { id: 'C2H5Cl_AlCl3', for: ['aromatic'], formula: 'CH3CH2Cl', label: 'CH₃CH₂Cl + AlCl₃ (catalyst): add an ethyl group', label_fr: 'CH₃CH₂Cl + AlCl₃ (catalyseur) : ajouter un groupe éthyle',
      type: 'sear', E: 'C2H5', eIon: 'CH₃CH₂⁺', fc: 'alkyl', cat: 'AlCl3', counter: 'AlCl₄⁻', hx: 'HCl' },
    { id: 'AcCl_AlCl3', for: ['aromatic'], formula: 'CH3COCl', label: 'CH₃COCl + AlCl₃ (catalyst): add an acyl group', label_fr: 'CH₃COCl + AlCl₃ (catalyseur) : ajouter un groupe acyle',
      type: 'sear', E: 'COCH3', eIon: 'CH₃C≡O⁺', fc: 'acyl', cat: 'AlCl3', counter: 'AlCl₄⁻', hx: 'HCl' },
    { id: 'Br2_FeBr3', for: ['aromatic'], formula: 'Br2', label: 'Br₂ + FeBr₃ (catalyst): add Br', label_fr: 'Br₂ + FeBr₃ (catalyseur) : ajouter Br',
      type: 'sear', E: 'Br', eIon: 'Br⁺', cat: 'FeBr3', counter: 'FeBr₄⁻', hx: 'HBr' },
    { id: 'Cl2_FeCl3', for: ['aromatic'], formula: 'Cl2', label: 'Cl₂ + FeCl₃ (catalyst): add Cl', label_fr: 'Cl₂ + FeCl₃ (catalyseur) : ajouter Cl',
      type: 'sear', E: 'Cl', eIon: 'Cl⁺', cat: 'FeCl3', counter: 'FeCl₄⁻', hx: 'HCl' },
    { id: 'SO3_H2SO4', for: ['aromatic'], formula: 'SO3', label: 'SO₃ in H₂SO₄ (catalyst): add –SO₃H', label_fr: 'SO₃ dans H₂SO₄ (catalyseur) : ajouter –SO₃H',
      type: 'sear', E: 'SO3H', eIon: 'SO₃H⁺', cat: 'H2SO4', counter: 'HSO₄⁻', hx: null }
  ];

  var data = { substrates: SUBSTRATES, reagents: REAGENTS };
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.ORGANIC = data;
})(this);
