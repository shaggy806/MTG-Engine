import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

const CAST_TEXT = "When you cast this spell, exile two target permanents.";
const ATTACK_TEXT = "Whenever Ulamog attacks, defending player exiles the top twenty cards of their library.";

// The cast trigger resolves first, even if Ulamog is then countered (the
// ruling). With fewer than twenty cards, all of them go.
export default defineCard({
  name: "Ulamog, the Ceaseless Hunger",
  manaCost: "{10}",
  colors: [],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Eldrazi"],
  power: 10,
  toughness: 10,
  keywords: ["indestructible"],
  text: `${CAST_TEXT}\nIndestructible\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "this-cast" },
      targets: distinctTargets(2, "permanent"),
      // One instruction over both targets: they leave together.
      effect: {
        kind: "sequence",
        simultaneous: true,
        effects: [
          { kind: "exile", target: 0 },
          { kind: "exile", target: 1 },
        ],
      },
      resolve: null,
      text: CAST_TEXT,
    },
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: { kind: "exile-from-library", whose: "trigger-player", amount: 20 },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
