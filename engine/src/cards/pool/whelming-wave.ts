import { defineCard } from "../define.js";

// "Except for Krakens, Leviathans, Octopuses, and Serpents": `notSubtypes`
// asks `hasSubtype`, so a changeling (every creature type) stays put.
export default defineCard({
  name: "Whelming Wave",
  manaCost: "{2}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Return all creatures to their owners' hands except for Krakens, Leviathans, Octopuses, and Serpents.",
  effect: {
    kind: "return-to-hand-all",
    filter: { type: "creature", notSubtypes: ["Kraken", "Leviathan", "Octopus", "Serpent"] },
  },
});
