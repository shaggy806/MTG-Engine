import { defineCard } from "../define.js";

// The creature found attacks what its controller chooses, not necessarily
// what Raph & Mikey attack (ruling; rule 508.4), and was never declared
// (508.3a).
const ATTACK_TEXT =
  "Whenever Raph & Mikey attack, reveal cards from the top of your library until you reveal a creature card. Put that card onto the battlefield tapped and attacking and the rest on the bottom of your library in a random order.";

export default defineCard({
  name: "Raph & Mikey, Troublemakers",
  manaCost: "{5}{R/G}{R/G}",
  colors: ["R", "G"],
  supertypes: ["legendary"],
  types: ["creature"],
  subtypes: ["Mutant", "Ninja", "Turtle"],
  power: 7,
  toughness: 7,
  keywords: ["trample", "haste"],
  text: `Trample, haste\n${ATTACK_TEXT}`,
  triggered: [
    {
      trigger: { on: "attacks", who: "self" },
      targets: [],
      effect: {
        kind: "reveal-until",
        filter: { type: "creature" },
        put: "battlefield",
        tapped: true,
        attacking: "choose",
        rest: "bottom-random",
      },
      resolve: null,
      text: ATTACK_TEXT,
    },
  ],
});
