// French names used when the app language is French.
// elements[i] is the French name of element number i + 1.
(function (root) {
  var NAMES_FR = {
    elements: [
      'Hydrogène', 'Hélium', 'Lithium', 'Béryllium', 'Bore', 'Carbone', 'Azote', 'Oxygène', 'Fluor', 'Néon',
      'Sodium', 'Magnésium', 'Aluminium', 'Silicium', 'Phosphore', 'Soufre', 'Chlore', 'Argon', 'Potassium', 'Calcium',
      'Scandium', 'Titane', 'Vanadium', 'Chrome', 'Manganèse', 'Fer', 'Cobalt', 'Nickel', 'Cuivre', 'Zinc',
      'Gallium', 'Germanium', 'Arsenic', 'Sélénium', 'Brome', 'Krypton', 'Rubidium', 'Strontium', 'Yttrium', 'Zirconium',
      'Niobium', 'Molybdène', 'Technétium', 'Ruthénium', 'Rhodium', 'Palladium', 'Argent', 'Cadmium', 'Indium', 'Étain',
      'Antimoine', 'Tellure', 'Iode', 'Xénon', 'Césium', 'Baryum', 'Lanthane', 'Cérium', 'Praséodyme', 'Néodyme',
      'Prométhium', 'Samarium', 'Europium', 'Gadolinium', 'Terbium', 'Dysprosium', 'Holmium', 'Erbium', 'Thulium', 'Ytterbium',
      'Lutécium', 'Hafnium', 'Tantale', 'Tungstène', 'Rhénium', 'Osmium', 'Iridium', 'Platine', 'Or', 'Mercure',
      'Thallium', 'Plomb', 'Bismuth', 'Polonium', 'Astate', 'Radon', 'Francium', 'Radium', 'Actinium', 'Thorium',
      'Protactinium', 'Uranium', 'Neptunium', 'Plutonium', 'Américium', 'Curium', 'Berkélium', 'Californium', 'Einsteinium', 'Fermium',
      'Mendélévium', 'Nobélium', 'Lawrencium', 'Rutherfordium', 'Dubnium', 'Seaborgium', 'Bohrium', 'Hassium', 'Meitnérium', 'Darmstadtium',
      'Roentgenium', 'Copernicium', 'Nihonium', 'Flérovium', 'Moscovium', 'Livermorium', 'Tennesse', 'Oganesson'
    ],
    // Anion word for binary compounds ("chlorure de sodium", "dioxyde de carbone").
    ide: {
      H: 'hydrure', B: 'borure', C: 'carbure', N: 'nitrure', O: 'oxyde', F: 'fluorure',
      Si: 'siliciure', S: 'sulfure', Cl: 'chlorure', Se: 'séléniure', Br: 'bromure', Te: 'tellurure', I: 'iodure'
    },
    // Ion names, keyed by the English name in compounds.js. Missing ones stay in English.
    ions: {
      'lithium': 'lithium', 'sodium': 'sodium', 'potassium': 'potassium', 'rubidium': 'rubidium', 'cesium': 'césium',
      'silver': 'argent', 'ammonium': 'ammonium', 'beryllium': 'béryllium', 'magnesium': 'magnésium', 'calcium': 'calcium',
      'strontium': 'strontium', 'barium': 'baryum', 'zinc': 'zinc', 'cadmium': 'cadmium', 'aluminum': 'aluminium', 'gallium': 'gallium',
      'copper(I)': 'cuivre(I)', 'copper(II)': 'cuivre(II)', 'iron(II)': 'fer(II)', 'iron(III)': 'fer(III)',
      'cobalt(II)': 'cobalt(II)', 'cobalt(III)': 'cobalt(III)', 'nickel(II)': 'nickel(II)', 'nickel(III)': 'nickel(III)',
      'chromium(II)': 'chrome(II)', 'chromium(III)': 'chrome(III)', 'manganese(II)': 'manganèse(II)', 'manganese(IV)': 'manganèse(IV)',
      'tin(II)': 'étain(II)', 'tin(IV)': 'étain(IV)', 'lead(II)': 'plomb(II)', 'lead(IV)': 'plomb(IV)',
      'mercury(I)': 'mercure(I)', 'mercury(II)': 'mercure(II)', 'gold(I)': 'or(I)', 'gold(III)': 'or(III)',
      'fluoride': 'fluorure', 'chloride': 'chlorure', 'bromide': 'bromure', 'iodide': 'iodure', 'hydride': 'hydrure',
      'oxide': 'oxyde', 'sulfide': 'sulfure', 'selenide': 'séléniure', 'nitride': 'nitrure', 'phosphide': 'phosphure',
      'hydroxide': 'hydroxyde', 'nitrate': 'nitrate', 'nitrite': 'nitrite', 'hydrogen carbonate': 'hydrogénocarbonate',
      'hydrogen sulfate': 'hydrogénosulfate', 'dihydrogen phosphate': 'dihydrogénophosphate', 'hypochlorite': 'hypochlorite',
      'chlorite': 'chlorite', 'chlorate': 'chlorate', 'perchlorate': 'perchlorate', 'bromate': 'bromate', 'iodate': 'iodate',
      'permanganate': 'permanganate', 'acetate': 'acétate', 'sulfate': 'sulfate', 'sulfite': 'sulfite', 'carbonate': 'carbonate',
      'hydrogen phosphate': 'hydrogénophosphate', 'chromate': 'chromate', 'dichromate': 'dichromate', 'peroxide': 'peroxyde',
      'phosphate': 'phosphate'
    },
    // Common compounds, keyed by formula as written in compounds.js. Missing ones stay in English.
    known: {
      'H2O': 'eau', 'H2O2': 'peroxyde d’hydrogène', 'NH3': 'ammoniac', 'CH4': 'méthane', 'C2H4': 'éthène (éthylène)',
      'C2H2': 'éthyne (acétylène)', 'C6H6': 'benzène', 'CH3OH': 'méthanol', 'C2H5OH': 'éthanol', 'C3H6O': 'acétone (propanone)',
      'C6H12O6': 'glucose', 'C12H22O11': 'saccharose', 'CH3COOH': 'acide acétique', 'SiH4': 'silane',
      'HCl': 'acide chlorhydrique', 'HBr': 'acide bromhydrique', 'HI': 'acide iodhydrique', 'HNO3': 'acide nitrique',
      'HNO2': 'acide nitreux', 'H2SO4': 'acide sulfurique', 'H2SO3': 'acide sulfureux', 'H3PO4': 'acide phosphorique',
      'H2CO3': 'acide carbonique', 'HClO3': 'acide chlorique', 'HClO': 'acide hypochloreux'
    },
    alkanes: ['', 'méthane', 'éthane', 'propane', 'butane', 'pentane', 'hexane', 'heptane', 'octane', 'nonane', 'décane']
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = NAMES_FR;
  else root.NAMES_FR = NAMES_FR;
})(this);
