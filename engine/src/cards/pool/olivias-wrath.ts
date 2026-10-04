import { defineCard } from "../define.js";

// EDHREC rank 2853.

// X is counted once as it resolves (rule 608.2h).
const MINUS_X = { product: [{ countOf: { subtype: "Vampire", controlledBy: "you" } }, -1] } as const;

export default defineCard({
  name: "Olivia's Wrath",
  manaCost: "{4}{B}",
  colors: ["B"],
  types: ["sorcery"],
  text: "Each non-Vampire creature gets -X/-X until end of turn, where X is the number of Vampires you control.",
  effect: {
    kind: "modify-pt-all",
    filter: { type: "creature", notSubtypes: ["Vampire"] },
    power: MINUS_X,
    toughness: MINUS_X,
    duration: "end-of-turn",
  },
});
