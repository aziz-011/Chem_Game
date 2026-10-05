# ChemLab — learn chemistry by playing with it

An interactive web app for chemistry students. No install, no build step:
open `index.html` in a browser (or run `npm start` and go to http://localhost:8000).

## What's inside

| Section | What students can do |
| --- | --- |
| **Periodic Table** | Click any of the 118 elements for protons/neutrons/electrons, an animated Bohr model, electron configuration and properties. Recolor the table by family, state, block, or a trend (electronegativity, atomic radius, ionization energy, mass, melting point, density). |
| **Compare Atoms** | Put two elements side by side. It explains the key differences in plain words (protons, shells, size, metal vs. nonmetal) and predicts the bond type between them from the electronegativity difference, and the ionic formula (e.g. Mg + O → MgO). |
| **Molecules** | Type any formula (`H2O`, `Ca(OH)2`, `CuSO4·5H2O`…) to get its name, an atom count, molar mass worked out step by step, and percent composition. Includes a draggable 3D ball-and-stick gallery (water, methane, benzene, the NaCl crystal…). |
| **Naming** | Formula ⇄ name converter with step-by-step reasoning (ionic, Roman numerals, polyatomic ions, prefixes, acids, hydrates), an ion builder that shows charges cancelling, a multiple-choice quiz, and reference rules. |
| **Reaction Lab** | Pick chemicals from a shelf and mix them in an animated beaker (bubbles, flames, precipitates, color changes). Shows the balanced equation, reaction type, energy change, an atom-count check, and explains why nothing happens when there's no reaction (activity series, solubility). There's also a general equation balancer. |

## Project layout

```
index.html            page shell and the five views
css/style.css         styles (light + dark theme)
js/chem.js            chemistry engine: formula parser, molar mass, balancer, naming
js/data/elements.js   generated periodic table data (do not edit by hand)
js/data/compounds.js  ions, common/acid names and quiz lists
js/data/molecules.js  3D model coordinates
js/data/reactions.js  reactions available in the lab
js/ui/*.js            one file per view
scripts/build-elements.py   regenerates elements.js from the source dataset
tests/chem.test.js    unit tests for the chemistry engine and data
```

## Development

```bash
npm test             # run the unit tests (Node 18+)
npm start            # serve locally on port 8000
npm run build:data   # re-download element data and regenerate js/data/elements.js
```

To add a reaction to the lab, append an entry to `js/data/reactions.js` with
unbalanced `reactants`/`products`: the app balances it for you, and the tests
check that every reaction balances.

## Data source

Element data comes from the open
[Periodic-Table-JSON](https://github.com/Bowserinator/Periodic-Table-JSON) dataset,
which is compiled from Wikipedia. Reactions are simplified for learning. Never try them without a teacher and proper safety equipment.
