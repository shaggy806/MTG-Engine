import { defineCard } from "../define.js";
import { distinctTargets } from "../helpers.js";

// EDHREC rank 2720.
//
// Rulings:
//   [2021-06-18] Typecycling is a form of cycling. Any ability that triggers on a card being
//     cycled also triggers on a card being typecycled. Any ability that stops a cycling ability
//     from being activated also stops a typecycling ability from being activated.
//
// The two returns are one instruction: they leave together.
export default defineCard({
  name: "Step Through",
  manaCost: "{3}{U}{U}",
  colors: ["U"],
  types: ["sorcery"],
  text: "Return two target creatures to their owners' hands.\nWizardcycling {2} ({2}, Discard this card: Search your library for a Wizard card, reveal it, put it into your hand, then shuffle.)",
  targets: distinctTargets(2, "creature"),
  effect: {
    kind: "sequence",
    simultaneous: true,
    effects: [
      { kind: "return-to-hand", target: 0 },
      { kind: "return-to-hand", target: 1 },
    ],
  },
  cycling: { cost: "{2}", search: { subtype: "Wizard" } },
});
